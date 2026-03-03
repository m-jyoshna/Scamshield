"""
SCAM JOB DETECTOR - FastAPI Backend (WITH IMAGE OCR SUPPORT)
=============================================================
Install:
  pip install fastapi uvicorn scikit-learn joblib python-multipart
  pip install requests beautifulsoup4 python-dotenv
  pip install pytesseract Pillow pdfplumber pdf2image

Tesseract OCR Engine (must install separately):
  Windows: https://github.com/UB-Mannheim/tesseract/wiki
  Mac:     brew install tesseract
  Linux:   sudo apt install tesseract-ocr

Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import json
import re
import os
import io
import time
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# ─── OCR Imports ─────────────────────────────────────────────────────────────
try:
    import easyocr
    from PIL import Image, ImageFilter, ImageEnhance
    OCR_AVAILABLE = True
    ocr_reader = None  # lazy load on first use
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️  easyocr not installed. Run: pip install easyocr")

try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

app = FastAPI(title="Scam Job Detector API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Load Model ───────────────────────────────────────────────────────────────
model = joblib.load("scam_model.pkl") if os.path.exists("scam_model.pkl") else None
print("✅ Model loaded" if model else "⚠️  No model found — using rule-based scoring")

RED_FLAGS = json.load(open("red_flags.json")) if os.path.exists("red_flags.json") else [
    "work from home immediately","no experience needed","urgent hiring","wire transfer",
    "western union","gift card","send money","processing fee","training fee",
    "guaranteed income","no interview","start today","data entry clerk",
    "confidential company","undisclosed company","earn $","reshipping","unlimited earning"
]

GROQ_API_KEY = os.getenv("GROQ_API_KEY","")


# ─── Pydantic Models ──────────────────────────────────────────────────────────
class JobPosting(BaseModel):
    title: str
    company: Optional[str] = ""
    description: str
    requirements: Optional[str] = ""
    benefits: Optional[str] = ""
    location: Optional[str] = ""
    salary: Optional[str] = ""
    contact_email: Optional[str] = ""

class ChatMessage(BaseModel):
    message: str
    analysis_context: Optional[str] = ""
    history: Optional[list] = []


# ─── Image Preprocessing ──────────────────────────────────────────────────────
def preprocess_image(image):
    if image.mode not in ('RGB','L'):
        image = image.convert('RGB')
    w, h = image.size
    if w < 1200:
        scale = 1200 / w
        image = image.resize((int(w*scale), int(h*scale)), Image.LANCZOS)
    image = image.convert('L')
    image = ImageEnhance.Contrast(image).enhance(2.0)
    image = image.filter(ImageFilter.SHARPEN)
    return image


# ─── OCR ─────────────────────────────────────────────────────────────────────
def ocr_image(image_bytes: bytes) -> str:
    global ocr_reader
    if not OCR_AVAILABLE:
        raise HTTPException(500, "OCR not available. Install easyocr.")
    try:
        # Lazy load EasyOCR reader on first use
        if ocr_reader is None:
            print("Loading EasyOCR model (first time only)...")
            ocr_reader = easyocr.Reader(['en'], gpu=False)
            print("EasyOCR ready!")

        image = Image.open(io.BytesIO(image_bytes))
        if image.mode not in ('RGB', 'L'):
            image = image.convert('RGB')

        # Upscale for better accuracy
        w, h = image.size
        if w < 1200:
            scale = 1200 / w
            image = image.resize((int(w*scale), int(h*scale)), Image.LANCZOS)

        import numpy as np
        img_array = np.array(image)
        results = ocr_reader.readtext(img_array, detail=0, paragraph=True)
        text = "\n".join(results)
        return text.strip()
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")


def extract_pdf_text(pdf_bytes: bytes) -> str:
    if not PDF_AVAILABLE:
        raise HTTPException(500, "pdfplumber not installed. Run: pip install pdfplumber")
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t: text += t + "\n"
        if len(text.strip()) > 50:
            return text.strip()
        # Fallback OCR for scanned PDFs
        if OCR_AVAILABLE:
            try:
                from pdf2image import convert_from_bytes
                images = convert_from_bytes(pdf_bytes, dpi=200)
                return "\n".join(pytesseract.image_to_string(preprocess_image(img)) for img in images[:3]).strip()
            except ImportError:
                pass
        raise HTTPException(422, "Could not extract text from PDF. Try copying text manually.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"PDF extraction failed: {e}")


# ─── Smart Field Extractor ────────────────────────────────────────────────────
def extract_fields_from_text(raw_text: str) -> dict:
    text = raw_text.strip()
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    result = {
        "title": "", "company": "", "location": "", "salary": "",
        "contact_email": "", "description": text, "requirements": "", "benefits": ""
    }

    # Email
    m = re.search(r'[\w.\-+]+@[\w.\-]+\.\w{2,}', text)
    if m: result["contact_email"] = m.group()

    # Salary (Indian + International formats)
    for pat in [
        r'(?:salary|ctc|package|pay|compensation)[:\s]*([₹$£€]?\s*[\d,.\s]+\s*(?:lakh|lac|LPA|k|K)?(?:\s*(?:per|p\.?\s*a\.?|p\.?\s*m\.?)?\s*(?:annum|year|month|week|hour))?)',
        r'([₹$£€]\s*[\d,]+(?:\s*[-–to]+\s*[\d,]+)?\s*(?:lakh|lac|LPA|k|K)?(?:\s*(?:per\s+)?(?:annum|month|year))?)',
        r'([\d.]+\s*(?:lakh|lac|LPA)\s*(?:per\s*(?:annum|year))?)',
        r'(\d+\s*[-–]\s*\d+\s*(?:lakh|lac|LPA|k))',
        r'(\$[\d,]+(?:\s*[-–]\s*\$?[\d,]+)?\s*(?:per\s+(?:year|month|hour|week))?)',
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = (m.group(1) if m.lastindex else m.group()).strip()
            if val and len(val) > 2:
                result["salary"] = val
                break

    # Location
    for pat in [
        r'(?:location|place|city|job\s*location|work\s*location|office)[:\s]+([A-Za-z\s,/|]+?)(?:\n|$|\||\·|\•)',
        r'(?:based\s*in|located\s*in)[:\s]+([A-Za-z\s,]+?)(?:\n|$|\|)',
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            loc = m.group(1).strip()[:80]
            if len(loc) > 2:
                result["location"] = loc
                break

    if not result["location"]:
        for city in ["Hyderabad","Bangalore","Bengaluru","Mumbai","Delhi","Chennai",
                     "Kolkata","Pune","Ahmedabad","Noida","Gurgaon","Gurugram",
                     "Remote","Work from Home","WFH","Hybrid","New York","London","Dubai"]:
            if re.search(rf'\b{re.escape(city)}\b', text, re.IGNORECASE):
                result["location"] = city
                break

    # Company
    for pat in [
        r'(?:company|employer|organisation|organization|firm|recruiter)[:\s]+([A-Za-z0-9\s&.,\-()\']+?)(?:\n|$|\|)',
        r'(?:about\s+(?:us|the\s+company))[:\s]*\n?\s*([A-Za-z0-9\s&.,\-()\']+?)(?:\n|$)',
        r'(?:posted\s+by|from)[:\s]+([A-Za-z0-9\s&.,\-()\']+?)(?:\n|$|\|)',
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            c = m.group(1).strip()
            if 4 < len(c) < 70 and not re.search(r'@|http|urgently|immediately', c, re.IGNORECASE):
                result["company"] = c
                break

    # Job Title
    for pat in [
        r'(?:job\s*title|position|role|designation|post|vacancy)[:\s]+([A-Za-z0-9\s/&\-,.()]+?)(?:\n|$|\|)',
        r'(?:hiring|looking\s+for|required|we\s+need)[:\s]+([A-Za-z0-9\s/&\-,.()]+?)(?:\n|$|\|)',
        r'(?:opening|opportunity)[:\s]+([A-Za-z0-9\s/&\-,.()]+?)(?:\n|$|\|)',
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            c = m.group(1).strip()
            if 3 < len(c) < 80:
                result["title"] = c
                break

    # Fallback title from first clean line
    if not result["title"]:
        skip = ['apply','contact','call','whatsapp','salary','send','share','urgent','http','www']
        for line in lines[:10]:
            if (4 < len(line) < 80 and
                not re.search(r'[@\d]{5,}|http|www|\.com', line) and
                not any(w in line.lower() for w in skip)):
                result["title"] = line
                break

    # Requirements section
    m = re.search(
        r'(?:requirements?|qualifications?|skills?\s*(?:required|needed)|eligibility|candidate\s*profile)'
        r'[:\s]*\n(.*?)(?=\n\s*(?:benefits?|perks?|salary|apply|contact|about\s+(?:us|company)|responsibilities?|we\s+offer|how\s+to)|$)',
        text, re.IGNORECASE | re.DOTALL)
    if m: result["requirements"] = m.group(1).strip()[:1000]

    # Benefits section
    m = re.search(
        r'(?:benefits?|perks?|what\s+we\s+offer|we\s+offer)[:\s]*\n(.*?)(?=\n\s*(?:requirements?|qualifications?|apply|contact|about)|$)',
        text, re.IGNORECASE | re.DOTALL)
    if m: result["benefits"] = m.group(1).strip()[:600]

    # Clean OCR artifacts
    for key in result:
        if isinstance(result[key], str):
            result[key] = re.sub(r'[|]{2,}', ' ', result[key])
            result[key] = re.sub(r'\s{3,}', ' ', result[key]).strip()

    return result


# ─── Red Flag Detection ───────────────────────────────────────────────────────
def detect_red_flags(posting: JobPosting):
    found_flags = []
    full_text = f"{posting.title} {posting.description} {posting.requirements} {posting.benefits} {posting.salary}".lower()

    keyword_flags = {
        "work from home immediately": "Promises immediate remote work — a common scam tactic",
        "no experience needed": "Claims no experience required — used to target vulnerable job seekers",
        "urgent hiring": "Artificial urgency to pressure quick decisions",
        "wire transfer": "Requests wire transfer — classic money scam indicator",
        "western union": "Mentions Western Union — untraceable payment method",
        "gift card": "Asks for gift cards — scammers use these to steal money",
        "send money": "Asks you to send money — legitimate employers never do this",
        "processing fee": "Charges processing fee — real companies never charge to apply",
        "training fee": "Charges training fee — legitimate jobs don't require upfront payment",
        "guaranteed income": "Guarantees income — no legitimate job can guarantee earnings",
        "no interview": "No interview required — skips standard verification",
        "start today": "Wants you to start immediately — bypasses proper onboarding",
        "data entry clerk": "Generic posting — frequently used as scam cover",
        "confidential company": "Hides company identity — legitimate employers are transparent",
        "undisclosed company": "Company name undisclosed — major red flag",
        "earn $": "Focuses heavily on earnings — manipulation tactic",
        "reshipping": "Reshipping jobs are almost always package smuggling scams",
        "unlimited earning": "Promises unlimited earnings — unrealistic and manipulative",
    }

    for keyword, reason in keyword_flags.items():
        if keyword in full_text:
            found_flags.append({"flag": keyword.title(), "reason": reason, "severity": "HIGH"})

    if len(posting.description) < 150:
        found_flags.append({"flag": "Very Short Description",
            "reason": "Legitimate postings have detailed descriptions; this is unusually brief", "severity": "MEDIUM"})

    if posting.contact_email and re.search(r'@(gmail|yahoo|hotmail|outlook)\.com', posting.contact_email.lower()):
        found_flags.append({"flag": "Generic Email Domain",
            "reason": f"Uses free email ({posting.contact_email}) — real companies use corporate emails", "severity": "HIGH"})

    if not posting.company or len(posting.company.strip()) < 2:
        found_flags.append({"flag": "No Company Name",
            "reason": "Missing company name — legitimate employers always identify themselves", "severity": "HIGH"})

    if full_text.count('!') > 5:
        found_flags.append({"flag": "Excessive Exclamation Marks",
            "reason": "Overuse of ! indicates unprofessional/manipulative writing", "severity": "LOW"})

    return found_flags


def calculate_risk_score(posting, ml_score, red_flags):
    high = sum(1 for f in red_flags if f['severity'] == 'HIGH')
    med  = sum(1 for f in red_flags if f['severity'] == 'MEDIUM')
    low  = sum(1 for f in red_flags if f['severity'] == 'LOW')
    rule_score = min(high*20, 70) + min(med*10, 20) + min(low*5, 10)
    rule_score = min(rule_score, 100)
    if ml_score is not None:
        return round(ml_score*0.6 + rule_score*0.4, 1)
    return round(rule_score, 1)


def get_risk_level(score):
    if score >= 75: return "HIGH", "🔴 HIGH RISK — Very likely a scam"
    if score >= 45: return "MEDIUM", "🟡 MEDIUM RISK — Suspicious, verify carefully"
    return "LOW", "🟢 LOW RISK — Appears legitimate"


def fetch_real_company_jobs(company_name: str):
    results = []
    if not company_name or len(company_name.strip()) < 2:
        return results
    try:
        q = company_name.replace(' ', '+')
        resp = requests.get(f"https://www.indeed.com/rss?q=%22{q}%22&sort=date&limit=5",
                            headers={'User-Agent':'Mozilla/5.0'}, timeout=8)
        if resp.status_code == 200:
            import xml.etree.ElementTree as ET
            for item in ET.fromstring(resp.content).findall('.//item')[:5]:
                t = item.find('title'); l = item.find('link'); d = item.find('pubDate')
                if t is not None and l is not None:
                    results.append({"source":"Indeed","title":t.text or "Job Posting",
                        "link":l.text or "#","date":d.text[:16] if d is not None and d.text else "Recent","snippet":""})
    except: pass

    enc = requests.utils.quote(company_name)
    results += [
        {"source":"LinkedIn","title":f"Search '{company_name}' jobs on LinkedIn",
         "link":f"https://www.linkedin.com/jobs/search/?keywords={enc}","date":"Live","snippet":"Search all current openings"},
        {"source":"Glassdoor","title":f"'{company_name}' reviews & jobs",
         "link":f"https://www.glassdoor.com/Search/results.htm?keyword={enc}","date":"Live","snippet":"Verify company reputation"},
    ]
    return results[:6]


def get_chatbot_response(message, context, history):
    system_prompt = ("You are ScamShield AI, expert at detecting scam job ads. "
                     "Help users understand red flags and stay safe. Be concise and use bullet points.\n"
                     "Context: " + (context or "No analysis yet."))
    try:
        messages = [{"role":h["role"],"content":h["content"]} for h in history[-6:]]
        messages.append({"role":"user","content":message})
        resp = requests.post("https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization":f"Bearer {GROQ_API_KEY}","Content-Type":"application/json"},
            json={"model":"llama3-8b-8192","messages":[{"role":"system","content":system_prompt}]+messages,
                  "max_tokens":512,"temperature":0.7}, timeout=15)
        return resp.json()['choices'][0]['message']['content']
    except:
        return ("I'm ScamShield AI! Ask me about:\n• Why a posting was flagged\n"
                "• Common scam tactics\n• How to verify a company\n"
                "Add GROQ_API_KEY to .env for full AI responses.")


# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message":"Scam Job Detector API running!","ocr":OCR_AVAILABLE,"model":model is not None}

@app.post("/extract")
async def extract_from_file(file: UploadFile = File(...)):
    """Upload image (JPG/PNG) or PDF → auto-extract all job posting fields."""
    content = await file.read()
    if len(content) > 10*1024*1024:
        raise HTTPException(400,"File too large. Max 10MB.")

    fname = (file.filename or "").lower()
    if fname.endswith(('.jpg','.jpeg','.png','.webp','.bmp','.tiff','.gif')):
        raw_text = ocr_image(content)
    elif fname.endswith('.pdf'):
        raw_text = extract_pdf_text(content)
    else:
        raise HTTPException(400,"Unsupported file type. Upload JPG, PNG, or PDF.")

    if len(raw_text.strip()) < 15:
        raise HTTPException(422,"Could not extract enough text. Try a clearer image.")

    fields = extract_fields_from_text(raw_text)
    return {
        "success": True,
        "raw_text": raw_text,
        "extracted_fields": fields,
        "char_count": len(raw_text),
        "confidence": "high" if len(raw_text)>300 else "medium" if len(raw_text)>100 else "low"
    }

@app.post("/analyze")
def analyze_job(posting: JobPosting):
    if not posting.title or not posting.description:
        raise HTTPException(400,"Title and description are required")

    red_flags = detect_red_flags(posting)
    ml_score = None
    if model:
        combined = clean_text(f"{posting.title} {posting.company} {posting.description} {posting.requirements} {posting.benefits} {posting.salary}")
        ml_score = round(model.predict_proba([combined])[0][1]*100, 1)

    final_score = calculate_risk_score(posting, ml_score, red_flags)
    risk_level, verdict = get_risk_level(final_score)

    if final_score >= 75:
        summary = f"⚠️ {len(red_flags)} suspicious indicators found. Do NOT apply or share personal info."
    elif final_score >= 45:
        summary = f"⚠️ {len(red_flags)} concerning element(s) found. Verify independently before proceeding."
    else:
        summary = f"✅ Appears relatively legitimate with {len(red_flags)} minor concern(s). Standard precautions apply."

    return {
        "fake_probability": final_score,
        "real_probability": round(100-final_score,1),
        "ml_score": ml_score,
        "risk_level": risk_level,
        "verdict": verdict,
        "summary": summary,
        "red_flags": red_flags,
        "company_jobs": fetch_real_company_jobs(posting.company),
        "analyzed_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

@app.post("/chat")
def chat(msg: ChatMessage):
    if not msg.message.strip():
        raise HTTPException(400,"Message cannot be empty")
    return {"response": get_chatbot_response(msg.message, msg.analysis_context, msg.history)}

@app.get("/health")
def health():
    return {"status":"healthy","model":model is not None,"ocr":OCR_AVAILABLE,"pdf":PDF_AVAILABLE,"groq":bool(GROQ_API_KEY)}


def clean_text(text):
    if not text: return ""
    text = re.sub(r'<[^>]+>',' ',text)
    text = re.sub(r'http\S+',' url ',text)
    return re.sub(r'\s+',' ',text).strip().lower()

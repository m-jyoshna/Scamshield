AI-Enabled Risk Scoring System for Automated Detection of Scam Job Advertisements

An AI-powered system for detecting fraudulent job advertisements, assigning Low, Medium, or High risk scores, and providing explainable insights to help job seekers identify suspicious recruitment opportunities.

---

📌 Project Overview

Online recruitment platforms have become a common target for cybercriminals who publish fraudulent job advertisements to:

- Steal personal information
- Collect money through fake recruitment processes
- Distribute malware
- Mislead job seekers

Traditional fraud detection systems generally classify job advertisements as genuine or fraudulent. However, they may not indicate how risky a particular advertisement is.

This project proposes an AI-enabled risk scoring system that detects fraudulent job advertisements, generates a risk score, and provides explainable predictions.

---

🎯 Objectives

The main objectives of the project are:

- Detect fraudulent/scam job advertisements automatically.
- Use Artificial Intelligence and Natural Language Processing (NLP) for job-ad analysis.
- Generate an AI-based risk score:
  - 🟢 Low Risk
  - 🟡 Medium Risk
  - 🔴 High Risk
- Analyze both textual and metadata information.
- Provide explainable predictions using Explainable AI (XAI).
- Help job seekers identify suspicious job advertisements.
- Improve security on online recruitment platforms.

---

🧠 Methodology

The system follows a machine-learning pipeline:

Job Advertisement
        ↓
Data Preprocessing
        ↓
Text & Metadata Analysis
        ↓
TF-IDF Feature Extraction
        ↓
Machine Learning / Deep Learning Models
        ↓
Ensemble Model
        ↓
Fraud Prediction
        ↓
Risk Score
        ↓
Explainable AI
        ↓
User-Friendly Result

Dataset

The project uses the EMSCAD (Employment Scam Aegean Dataset) for detecting fraudulent job advertisements.

Feature Extraction

The system analyzes job advertisements using:

- TF-IDF for textual features
- Metadata analysis
- Textual patterns
- Job advertisement information

---

🤖 Machine Learning Models

The project evaluates multiple machine-learning and deep-learning models:

Model| Type
Naïve Bayes| Machine Learning
SVM| Machine Learning
Decision Tree| Machine Learning
Random Forest| Machine Learning
MLP| Deep Learning
Bi-LSTM| Deep Learning
Ensemble Model| Hybrid

The proposed ensemble model combines Random Forest and Bi-LSTM to improve fraud detection performance.

---

🔍 Explainable AI

The system incorporates Explainable AI (XAI) to make predictions more understandable.

Instead of only displaying whether a job advertisement is fraudulent, the system aims to provide insights into why the advertisement was identified as suspicious.

This improves transparency and helps users understand the factors contributing to the prediction.

---

⭐ Key Features

- ✅ Automatic fake job detection
- ✅ AI-based risk scoring
- ✅ Low / Medium / High risk classification
- ✅ NLP-based text analysis
- ✅ Metadata analysis
- ✅ Machine Learning and Deep Learning models
- ✅ Random Forest + Bi-LSTM ensemble
- ✅ Explainable AI (XAI)
- ✅ User-friendly interface
- ✅ High-performance fraud detection

---

📊 Performance

According to the project evaluation, the proposed ensemble model achieves approximately:

98.9% Accuracy

The system is designed to improve the identification of suspicious job advertisements and reduce recruitment-related fraud.

---

🛠️ Technologies Used

Programming Language

- Python

Libraries & Frameworks

- Scikit-learn
- TensorFlow / Keras
- Pandas
- NumPy
- NLTK
- Matplotlib
- Streamlit

Techniques

- Machine Learning
- Deep Learning
- Natural Language Processing (NLP)
- TF-IDF
- Explainable AI (XAI)
- Ensemble Learning

---

📂 Project Structure

AI-Risk-Scoring-System/
│
├── dataset/
│   └── EMSCAD.csv
│
├── notebooks/
│   └── model_training.ipynb
│
├── src/
│   ├── preprocessing.py
│   ├── feature_extraction.py
│   ├── model_training.py
│   ├── prediction.py
│   └── explainability.py
│
├── models/
│   └── trained_models/
│
├── app/
│   └── app.py
│
├── requirements.txt
├── README.md
└── LICENSE

«Note: Modify the folder structure above to match the actual files in your GitHub repository.»

---

⚙️ Installation

1. Clone the Repository

git clone https://github.com/your-username/AI-Risk-Scoring-System.git
cd AI-Risk-Scoring-System

2. Create a Virtual Environment

python -m venv venv

Activate it:

Windows

venv\Scripts\activate

Linux / macOS

source venv/bin/activate

3. Install Dependencies

pip install -r requirements.txt

---

▶️ Run the Application

If the application is implemented using Streamlit:

streamlit run app/app.py

The application will open in your browser.

---

🖥️ System Workflow

1. User enters or uploads a job advertisement.
2. The system preprocesses the advertisement.
3. NLP techniques analyze the job description.
4. TF-IDF features are extracted.
5. Metadata information is analyzed.
6. Trained ML/DL models predict whether the advertisement is fraudulent.
7. The ensemble model generates the final prediction.
8. A risk level is assigned.
9. Explainable AI provides insights into the prediction.
10. Results are displayed through the user interface.

---

📈 Expected Outcomes

The system is intended to:

- Improve scam job detection accuracy.
- Help job seekers identify suspicious advertisements.
- Provide transparent and explainable predictions.
- Generate meaningful risk scores.
- Improve security on recruitment platforms.
- Reduce recruitment fraud.

---

🔮 Future Scope

Possible future enhancements include:

- Real-time monitoring of job advertisements.
- Integration with online recruitment platforms.
- Browser extension for automatic scam-job warnings.
- Multilingual job advertisement analysis.
- Continuous model retraining with newly identified scams.
- Advanced behavioral analysis.
- API-based integration with recruitment websites.

---

👩‍💻 Author

Macharla Jyoshna

B.Tech – Computer Science and Engineering
Vardhaman College of Engineering

---

📜 License

This project is developed for academic and research purposes.

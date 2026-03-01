import { useState, useRef, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

const T = {
  bg:        "#03050f",
  panel:     "#060b1a",
  card:      "#080e20",
  border:    "#0d1e3d",
  blue:      "#0088ff",
  blueDim:   "rgba(0,136,255,0.12)",
  blueGlow:  "rgba(0,136,255,0.35)",
  cyan:      "#00cfff",
  cyanDim:   "rgba(0,207,255,0.10)",
  cyanGlow:  "rgba(0,207,255,0.30)",
  green:     "#00ff88",
  greenDim:  "rgba(0,255,136,0.10)",
  greenGlow: "rgba(0,255,136,0.30)",
  red:       "#ff2255",
  redDim:    "rgba(255,34,85,0.12)",
  redGlow:   "rgba(255,34,85,0.30)",
  yellow:    "#ffe500",
  yellowDim: "rgba(255,229,0,0.10)",
  text:      "#d0e8ff",
  dim:       "#1e3a6e",
  mono:      "'Courier New', 'Lucida Console', monospace",
  sans:      "'Helvetica Neue', Arial, sans-serif",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700&display=swap');

  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

  body {
    background: ${T.bg};
    color: ${T.text};
    font-family: 'Exo 2', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.blue}; border-radius: 2px; }

  ::selection { background: ${T.blueDim}; color: ${T.cyan}; }

  @keyframes flicker {
    0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.8} 94%{opacity:1} 96%{opacity:0.9} 97%{opacity:1}
  }
  @keyframes scandown {
    0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)}
  }
  @keyframes pulse-ring {
    0%{transform:scale(1);opacity:1} 100%{transform:scale(1.6);opacity:0}
  }
  @keyframes slide-in-left {
    from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)}
  }
  @keyframes slide-in-up {
    from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}
  }
  @keyframes glitch {
    0%,100%{clip-path:inset(0)} 20%{clip-path:inset(8% 0 62% 0);transform:translate(-3px)}
    40%{clip-path:inset(43% 0 30% 0);transform:translate(3px)}
    60%{clip-path:inset(72% 0 5% 0);transform:translate(-2px)}
    80%{clip-path:inset(25% 0 58% 0);transform:translate(2px)}
  }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes bounce-dot {
    0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-6px);opacity:1}
  }
  @keyframes bar-fill { from{width:0} to{width:var(--w)} }
  @keyframes number-count {
    from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)}
  }
  @keyframes fade-up {
    from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)}
  }

  .glitch-text { position: relative; }
  .glitch-text::before, .glitch-text::after {
    content: attr(data-text);
    position: absolute;
    top:0; left:0;
    width:100%; height:100%;
  }
  .glitch-text::before {
    color: ${T.red};
    animation: glitch 4s infinite;
    clip-path: inset(0);
  }
  .glitch-text::after {
    color: ${T.cyan};
    animation: glitch 4s infinite 0.1s;
    clip-path: inset(0);
  }

  .blue-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
  }
  .blue-btn::after {
    content:'';
    position:absolute;
    top:-50%;left:-60%;
    width:40%;height:200%;
    background:rgba(255,255,255,0.15);
    transform:skewX(-20deg);
    transition:left 0.4s;
  }
  .blue-btn:hover::after { left:120%; }

  .panel-glow {
    box-shadow: 0 0 0 1px ${T.border}, inset 0 1px 0 rgba(0,136,255,0.05);
    transition: box-shadow 0.3s;
  }
  .panel-glow:focus-within {
    box-shadow: 0 0 0 1px ${T.blue}, 0 0 20px ${T.blueDim}, inset 0 1px 0 rgba(0,136,255,0.1);
  }

  input, textarea {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    color: ${T.text} !important;
    font-family: 'Exo 2', sans-serif !important;
    font-size: 13px !important;
    width: 100%;
    resize: vertical;
  }
  input::placeholder, textarea::placeholder { color: ${T.dim} !important; }
`;

function BgGrid() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{
        position:"absolute",inset:0,
        backgroundImage:`
          linear-gradient(rgba(0,136,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,136,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize:"60px 60px",
      }}/>
      <div style={{
        position:"absolute",inset:0,
        background:"radial-gradient(ellipse at 50% 0%, rgba(0,100,255,0.07) 0%, transparent 65%)"
      }}/>
      <div style={{
        position:"absolute",inset:0,
        background:"radial-gradient(ellipse at center, transparent 40%, rgba(3,5,15,0.92) 100%)"
      }}/>
      <div style={{
        position:"absolute",left:0,right:0,height:"2px",
        background:`linear-gradient(90deg, transparent, ${T.blue}33, ${T.cyan}55, ${T.blue}33, transparent)`,
        animation:"scandown 12s linear infinite",
        pointerEvents:"none"
      }}/>
      {["topLeft","topRight","bottomLeft","bottomRight"].map(pos => (
        <div key={pos} style={{
          position:"absolute",
          top: pos.includes("top") ? 16 : "auto",
          bottom: pos.includes("bottom") ? 16 : "auto",
          left: pos.includes("Left") ? 16 : "auto",
          right: pos.includes("Right") ? 16 : "auto",
          width:40,height:40,
          borderTop: pos.includes("top") ? `2px solid ${T.blue}44` : "none",
          borderBottom: pos.includes("bottom") ? `2px solid ${T.blue}44` : "none",
          borderLeft: pos.includes("Left") ? `2px solid ${T.blue}44` : "none",
          borderRight: pos.includes("Right") ? `2px solid ${T.blue}44` : "none",
        }}/>
      ))}
    </div>
  );
}

function Header() {
  const [tick, setTick] = useState(0);
  useEffect(()=>{ const t=setInterval(()=>setTick(p=>p+1),1000); return()=>clearInterval(t); },[]);
  const now = new Date();

  return (
    <header style={{
      position:"sticky",top:0,zIndex:200,
      background:`linear-gradient(180deg, ${T.bg} 0%, ${T.panel}cc 100%)`,
      borderBottom:`1px solid ${T.border}`,
      backdropFilter:"blur(20px)",
    }}>
      <div style={{height:2,background:`linear-gradient(90deg, transparent, ${T.blue}, ${T.cyan}, ${T.blue}, transparent)`}}/>
      <div style={{
        maxWidth:1200,margin:"0 auto",padding:"0 28px",
        height:64,display:"flex",alignItems:"center",justifyContent:"space-between"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{position:"relative"}}>
            <div style={{
              width:42,height:42,borderRadius:8,
              background:`linear-gradient(135deg, ${T.blue}33, ${T.blueDim})`,
              border:`1px solid ${T.blue}66`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:20, animation:"flicker 6s infinite",
              boxShadow:`0 0 20px ${T.blueDim}`
            }}>🛡</div>
            <div style={{
              position:"absolute",inset:-4,borderRadius:12,
              border:`1px solid ${T.blue}33`,
              animation:"pulse-ring 2s ease-out infinite"
            }}/>
          </div>
          <div>
            <div style={{
              fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,
              letterSpacing:2,lineHeight:1,
              background:`linear-gradient(135deg, ${T.cyan}, ${T.blue})`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"
            }}>SCAMSHIELD</div>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:3,marginTop:2}}>
              THREAT ANALYSIS SYSTEM v2.0
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:24,fontFamily:T.mono,fontSize:11}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:T.green,
              boxShadow:`0 0 8px ${T.green}`,animation:"flicker 3s infinite"}}/>
            <span style={{color:T.green}}>SYSTEM ONLINE</span>
          </div>
          <div style={{color:T.dim,display:"flex",gap:16}}>
            <span style={{color:T.cyan}}>{now.toLocaleDateString()}</span>
            <span style={{color:T.dim}}>{now.toLocaleTimeString()}</span>
          </div>
          <div style={{
            padding:"4px 12px",borderRadius:4,
            border:`1px solid ${T.blue}55`,
            background:T.blueDim,
            color:T.cyan,fontSize:10,letterSpacing:2,
            boxShadow:`0 0 12px ${T.blueDim}`
          }}>ML + OCR ACTIVE</div>
        </div>
      </div>
    </header>
  );
}

function ThreatMeter({ score }) {
  const color = score >= 75 ? T.red : score >= 45 ? T.yellow : T.green;
  const glow  = score >= 75 ? T.redGlow : score >= 45 ? T.yellowDim : T.greenGlow;
  const label = score >= 75 ? "CRITICAL THREAT" : score >= 45 ? "SUSPICIOUS" : "CLEAR";
  const bars  = 20;

  return (
    <div style={{
      background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
      padding:"28px 24px",position:"relative",overflow:"hidden",
      borderTop:`2px solid ${T.blue}`,
      boxShadow:`0 0 30px ${T.blueDim}`
    }}>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
        width:200,height:100,background:`radial-gradient(${T.blueDim}, transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
        width:160,height:80,background:`radial-gradient(${glow}, transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{fontFamily:T.mono,fontSize:10,color:T.dim,letterSpacing:3,marginBottom:16,textAlign:"center"}}>
        ◈ THREAT ASSESSMENT
      </div>
      <div style={{textAlign:"center",marginBottom:20,animation:"number-count 0.6s ease"}}>
        <div style={{
          fontFamily:"'Orbitron',sans-serif",fontSize:72,fontWeight:900,lineHeight:1,
          color,textShadow:`0 0 30px ${color}, 0 0 60px ${color}44`,
          letterSpacing:-2
        }}>{score}<span style={{fontSize:36}}>%</span></div>
        <div style={{
          fontFamily:T.mono,fontSize:12,letterSpacing:4,marginTop:8,
          color,textShadow:`0 0 10px ${color}`
        }}>{label}</div>
      </div>
      <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:16}}>
        {Array.from({length:bars}).map((_,i)=>{
          const threshold = ((i+1)/bars)*100;
          const active = score >= threshold;
          const barColor = threshold>75 ? T.red : threshold>45 ? T.yellow : T.green;
          return (
            <div key={i} style={{
              width:10,height:28,borderRadius:2,
              background: active ? barColor : T.border,
              boxShadow: active ? `0 0 6px ${barColor}88` : "none",
              transition:`background 0.05s ease ${i*0.02}s, box-shadow 0.05s ease ${i*0.02}s`
            }}/>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12}}>
        {[
          {label:"FRAUD PROBABILITY",val:`${score}%`,c:T.red},
          {label:"LEGITIMATE",val:`${100-score}%`,c:T.green}
        ].map((s,i)=>(
          <div key={i} style={{flex:1,background:T.panel,borderRadius:6,padding:"10px 12px",
            border:`1px solid ${s.c}22`,textAlign:"center"}}>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:2,marginBottom:4}}>{s.label}</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:22,fontWeight:700,color:s.c,
              textShadow:`0 0 10px ${s.c}66`}}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadZone({ onExtract, extracting }) {
  const [drag,setDrag]=useState(false);
  const [preview,setPreview]=useState(null);
  const ref=useRef();

  const handle=useCallback(async(file)=>{
    if(!file)return;
    const ok=['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
    if(!ok.includes(file.type)){alert("Upload JPG, PNG, WEBP, or PDF.");return;}
    setPreview(file.type.startsWith('image/')?URL.createObjectURL(file):null);
    await onExtract(file);
  },[onExtract]);

  return (
    <div
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}}
      onClick={()=>!extracting&&ref.current?.click()}
      style={{
        border:`2px dashed ${drag?T.cyan:T.border}`,borderRadius:10,
        padding:"32px 20px",textAlign:"center",cursor:extracting?"default":"pointer",
        background:drag?T.cyanDim:T.panel,transition:"all 0.25s",
        position:"relative",overflow:"hidden",
        boxShadow:drag?`0 0 24px ${T.cyanDim}`:"none"
      }}>
      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
        style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
      {extracting?(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
          <div style={{position:"relative",width:60,height:60}}>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${T.blue}33`}}/>
            <div style={{position:"absolute",inset:6,borderRadius:"50%",border:`2px solid ${T.blue}55`}}/>
            <div style={{position:"absolute",inset:12,borderRadius:"50%",border:`2px solid ${T.cyan}`,
              animation:"spin 1s linear infinite",boxShadow:`0 0 10px ${T.cyan}`}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:T.mono,fontSize:18,color:T.cyan}}>◎</div>
          </div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:T.cyan,letterSpacing:2,
            textShadow:`0 0 10px ${T.cyan}`}}>SCANNING DOCUMENT</div>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.dim}}>OCR extraction in progress...</div>
          <div style={{display:"flex",gap:4}}>
            {[0,1,2,3,4].map(i=>(
              <div key={i} style={{width:4,height:4,borderRadius:"50%",background:T.cyan,
                animation:`bounce-dot 1s ease ${i*0.15}s infinite`}}/>
            ))}
          </div>
        </div>
      ):preview?(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <img src={preview} alt="preview" style={{maxHeight:120,maxWidth:"100%",borderRadius:6,
            objectFit:"contain",border:`1px solid ${T.green}44`}}/>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.green}}>
            ✓ DOCUMENT LOADED — CLICK TO REPLACE
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{fontSize:40,filter:`drop-shadow(0 0 14px ${T.cyan}99)`}}>⬆</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,color:T.cyan,letterSpacing:1}}>
            DROP JOB POSTING HERE
          </div>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.dim}}>
            JPG · PNG · WEBP · PDF &nbsp;|&nbsp; MAX 10MB
          </div>
          <div style={{
            marginTop:6,padding:"4px 14px",borderRadius:20,
            border:`1px solid ${T.blue}55`,background:T.blueDim,
            fontFamily:T.mono,fontSize:10,color:T.cyan,letterSpacing:1
          }}>OCR AUTO-EXTRACTS ALL FIELDS</div>
        </div>
      )}
    </div>
  );
}

function TField({label,value,onChange,multi,placeholder,half,filled}){
  const [focused,setFocused]=useState(false);
  return(
    <div style={{flex:half?"0 0 calc(50% - 6px)":"1 1 100%"}}>
      <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:2,marginBottom:6,
        color:filled?T.green:focused?T.cyan:T.dim,transition:"color 0.2s"}}>
        {filled?"✓ ":focused?"▶ ":""}{label}
      </div>
      <div className="panel-glow" style={{
        background:T.panel,borderRadius:6,padding:"10px 14px",
        border:`1px solid ${filled?T.green+"44":focused?T.cyan+"55":T.border}`,
        transition:"border-color 0.2s"
      }}>
        {multi?(
          <textarea value={value} onChange={e=>onChange(e.target.value)}
            placeholder={placeholder} rows={4} style={{minHeight:90}}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
        ):(
          <input value={value} onChange={e=>onChange(e.target.value)}
            placeholder={placeholder}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
        )}
      </div>
    </div>
  );
}

function FlagItem({flag,index}){
  const sc=flag.severity==="HIGH"?T.red:flag.severity==="MEDIUM"?T.yellow:T.dim;
  const icons={HIGH:"⛔",MEDIUM:"⚠",LOW:"ℹ"};
  return(
    <div style={{
      display:"flex",gap:12,alignItems:"flex-start",
      padding:"12px 16px",borderRadius:8,marginBottom:8,
      background:T.panel,border:`1px solid ${sc}33`,borderLeft:`3px solid ${sc}`,
      animation:`fade-up 0.35s ease ${index*0.07}s both`,transition:"all 0.2s"
    }}
      onMouseEnter={e=>{e.currentTarget.style.background=`${sc}08`;e.currentTarget.style.borderLeftColor=sc;}}
      onMouseLeave={e=>{e.currentTarget.style.background=T.panel;e.currentTarget.style.borderLeftColor=sc;}}
    >
      <div style={{fontSize:16,marginTop:1,filter:`drop-shadow(0 0 4px ${sc})`}}>{icons[flag.severity]}</div>
      <div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,color:T.text,letterSpacing:1}}>
            {flag.flag.toUpperCase()}
          </span>
          <span style={{fontFamily:T.mono,fontSize:9,color:sc,background:`${sc}15`,
            padding:"2px 8px",borderRadius:3,letterSpacing:2}}>{flag.severity}</span>
        </div>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.dim,lineHeight:1.6}}>{flag.reason}</div>
      </div>
    </div>
  );
}

function CompCard({job,index}){
  return(
    <a href={job.link} target="_blank" rel="noreferrer" style={{
      display:"block",textDecoration:"none",
      padding:"12px 16px",borderRadius:8,marginBottom:8,
      background:T.panel,border:`1px solid ${T.border}`,
      transition:"all 0.2s",animation:`fade-up 0.3s ease ${index*0.08}s both`
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.cyan;e.currentTarget.style.background=T.cyanDim;e.currentTarget.style.boxShadow=`0 0 14px ${T.cyanDim}`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.panel;e.currentTarget.style.boxShadow="none";}}
    >
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:3}}>{job.title}</div>
          {job.snippet&&<div style={{fontFamily:T.mono,fontSize:11,color:T.dim,lineHeight:1.5}}>
            {String(job.snippet).slice(0,110)}...
          </div>}
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:T.mono,fontSize:10,color:T.cyan,marginBottom:2}}>{job.source}</div>
          <div style={{fontFamily:T.mono,fontSize:10,color:T.dim}}>{String(job.date).slice(0,16)}</div>
          <div style={{marginTop:4,fontSize:14,color:T.cyan}}>→</div>
        </div>
      </div>
    </a>
  );
}

function Chatbot({context}){
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{role:"assistant",
    content:"SCAMSHIELD AI ONLINE\n\nI'm your threat analysis assistant. Ask me about:\n• Why this posting was flagged\n• How to verify a company\n• Job scam red flags\n• How to report fraud"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef();
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);

  async function send(){
    if(!input.trim()||loading)return;
    const msg=input.trim();setInput("");setLoading(true);
    setMsgs(p=>[...p,{role:"user",content:msg}]);
    try{
      const r=await fetch(`${API}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:msg,analysis_context:context,history:msgs.slice(-6)})});
      const d=await r.json();
      setMsgs(p=>[...p,{role:"assistant",content:d.response}]);
    }catch{
      setMsgs(p=>[...p,{role:"assistant",content:"⚠ CONNECTION ERROR\nMake sure FastAPI backend is running on port 8000."}]);
    }
    setLoading(false);
  }

  return(
    <>
      <button onClick={()=>setOpen(!open)} style={{
        position:"fixed",bottom:28,right:28,zIndex:1000,
        width:58,height:58,borderRadius:"50%",
        background:`linear-gradient(135deg, ${T.blue}, ${T.cyan})`,
        border:"none",cursor:"pointer",
        boxShadow:`0 4px 20px ${T.blueGlow}, 0 0 0 ${open?"3px":"0px"} ${T.cyan}`,
        transition:"all 0.3s",fontSize:22,
        display:"flex",alignItems:"center",justifyContent:"center",
        animation: open?"none":"flicker 8s infinite"
      }}>
        {open?"✕":"🤖"}
      </button>

      {open&&(
        <div style={{
          position:"fixed",bottom:100,right:28,zIndex:999,
          width:380,height:520,borderRadius:12,
          background:T.card,border:`1px solid ${T.border}`,borderTop:`2px solid ${T.blue}`,
          boxShadow:`0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${T.blueDim}`,
          display:"flex",flexDirection:"column",overflow:"hidden",
          animation:"slide-in-up 0.3s ease"
        }}>
          <div style={{padding:"14px 18px",background:T.panel,borderBottom:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",gap:12}}>
            <div style={{position:"relative"}}>
              <div style={{width:36,height:36,borderRadius:8,background:T.blueDim,
                border:`1px solid ${T.blue}55`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:16,boxShadow:`0 0 10px ${T.blueDim}`}}>🤖</div>
              <div style={{position:"absolute",bottom:0,right:0,width:10,height:10,
                borderRadius:"50%",background:T.green,border:`2px solid ${T.card}`,
                boxShadow:`0 0 6px ${T.green}`}}/>
            </div>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:T.cyan,letterSpacing:2}}>
                SCAMSHIELD AI
              </div>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.green}}>● ONLINE · LLAMA 3</div>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{
                  maxWidth:"85%",padding:"10px 14px",borderRadius:8,
                  fontSize:12,lineHeight:1.7,fontFamily:T.mono,whiteSpace:"pre-wrap",
                  background: m.role==="user" ? T.blueDim : T.panel,
                  border:`1px solid ${m.role==="user"?T.blue+"55":T.border}`,
                  color:m.role==="user"?T.cyan:T.text,
                  borderBottomRightRadius:m.role==="user"?2:8,
                  borderBottomLeftRadius:m.role==="assistant"?2:8,
                }}
                  dangerouslySetInnerHTML={{__html:m.content
                    .replace(/\*\*(.*?)\*\*/g,`<strong style="color:${T.cyan}">$1</strong>`)
                    .replace(/^• /gm,'&nbsp;&nbsp;▸ ')
                    .replace(/\n/g,'<br/>')}}
                />
              </div>
            ))}
            {loading&&(
              <div style={{display:"flex",gap:6,padding:"10px 14px",background:T.panel,
                borderRadius:8,border:`1px solid ${T.border}`,width:"fit-content"}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",
                  background:T.cyan,animation:`bounce-dot 0.8s ease ${i*0.15}s infinite`}}/>)}
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <div style={{padding:12,borderTop:`1px solid ${T.border}`,display:"flex",gap:8}}>
            <div style={{flex:1,background:T.panel,borderRadius:6,padding:"8px 12px",
              border:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&send()}
                placeholder="Ask about this posting..."/>
            </div>
            <button onClick={send} disabled={loading} style={{
              width:40,height:40,borderRadius:6,
              background:loading?T.border:`linear-gradient(135deg,${T.blue},${T.cyan})`,
              border:"none",cursor:loading?"default":"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,color:"#000",transition:"all 0.2s",
              boxShadow:loading?"none":`0 0 12px ${T.blueGlow}`
            }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}

const EMPTY={title:"",company:"",description:"",requirements:"",benefits:"",location:"",salary:"",contact_email:""};

export default function App(){
  const [form,setForm]=useState(EMPTY);
  const [filled,setFilled]=useState(new Set());
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [extracting,setExtracting]=useState(false);
  const [error,setError]=useState("");
  const [tab,setTab]=useState("flags");
  const [mode,setMode]=useState("upload");
  const [ocrConf,setOcrConf]=useState(null);
  const [analyzed,setAnalyzed]=useState(false);

  const sf=(f)=>(v)=>setForm(p=>({...p,[f]:v}));

  const handleExtract=async(file)=>{
    setExtracting(true);setError("");setFilled(new Set());
    const fd=new FormData();fd.append("file",file);
    try{
      const res=await fetch(`${API}/extract`,{method:"POST",body:fd});
      const data=await res.json();
      if(!res.ok)throw new Error(data.detail||"Extraction failed");
      const f=data.extracted_fields;
      const nf={title:f.title||"",company:f.company||"",description:f.description||"",
        requirements:f.requirements||"",benefits:f.benefits||"",location:f.location||"",
        salary:f.salary||"",contact_email:f.contact_email||""};
      setForm(nf);setOcrConf(data.confidence);
      const fl=new Set();
      Object.entries(nf).forEach(([k,v])=>{if(v?.trim())fl.add(k);});
      setFilled(fl);setMode("manual");
    }catch(e){
      setError(`OCR ERROR: ${e.message}\n\nEnsure Tesseract is installed and backend is running on port 8000.`);
    }
    setExtracting(false);
  };

  const analyze=async()=>{
    if(!form.title.trim()||!form.description.trim()){
      setError("MISSING REQUIRED FIELDS: Job Title and Description are required.");return;
    }
    setError("");setLoading(true);setResult(null);
    try{
      const res=await fetch(`${API}/analyze`,{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if(!res.ok)throw new Error(`Server error: ${res.status}`);
      const data=await res.json();
      setResult(data);setTab("flags");setAnalyzed(true);
      setTimeout(()=>document.getElementById("results")?.scrollIntoView({behavior:"smooth",block:"start"}),150);
    }catch(e){
      setError(`CONNECTION FAILED: Cannot reach backend.\nRun: uvicorn main:app --reload --port 8000\n\n${e.message}`);
    }
    setLoading(false);
  };

  const ctx=result?`Risk: ${result.fake_probability}%. Verdict: ${result.verdict}. Flags: ${result.red_flags?.map(f=>f.flag).join(', ')||'none'}. Job: ${form.title} at ${form.company||'unknown'}.`:"";

  return(
    <>
      <style>{GLOBAL_CSS}</style>
      <BgGrid/>

      <div style={{position:"relative",zIndex:1}}>
        <Header/>

        <main style={{maxWidth:1200,margin:"0 auto",padding:"40px 28px 80px"}}>

          {/* HERO */}
          <div style={{textAlign:"center",marginBottom:52,animation:"slide-in-up 0.6s ease"}}>
            <div style={{fontFamily:T.mono,fontSize:11,color:T.cyan,letterSpacing:4,marginBottom:12,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{display:"inline-block",width:40,height:1,background:`linear-gradient(90deg,transparent,${T.blue})`}}/>
              POWERED BY MACHINE LEARNING + OCR
              <span style={{display:"inline-block",width:40,height:1,background:`linear-gradient(90deg,${T.blue},transparent)`}}/>
            </div>
            <h1 className="glitch-text" data-text="DETECT JOB SCAMS" style={{
              fontFamily:"'Orbitron',sans-serif",
              fontSize:"clamp(32px,6vw,64px)",fontWeight:900,
              letterSpacing:"-1px",lineHeight:1.1,marginBottom:16,
              background:`linear-gradient(135deg, ${T.text} 0%, ${T.cyan} 50%, ${T.blue} 100%)`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            }}>DETECT JOB SCAMS</h1>
            <p style={{fontSize:15,color:T.dim,maxWidth:520,margin:"0 auto",lineHeight:1.8,fontWeight:300}}>
              Upload any job posting screenshot or PDF. Our AI scans for fraud patterns and gives you an instant risk score with full explanation.
            </p>
            <div style={{display:"flex",justifyContent:"center",gap:40,marginTop:32,
              padding:"20px 0",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`}}>
              {[
                {val:"18,000+",label:"TRAINING SAMPLES"},
                {val:"25+",label:"FRAUD PATTERNS"},
                {val:"91%",label:"ACCURACY"},
                {val:"FREE",label:"ALWAYS"},
              ].map((s,i)=>(
                <div key={i} style={{textAlign:"center",animation:`slide-in-up 0.5s ease ${i*0.1}s both`}}>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:22,fontWeight:700,
                    color:T.cyan,textShadow:`0 0 15px ${T.cyanGlow}`}}>{s.val}</div>
                  <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:2,marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TWO COLUMN */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>

            {/* LEFT */}
            <div style={{animation:"slide-in-left 0.5s ease"}}>
              <div style={{display:"flex",gap:0,marginBottom:20,borderRadius:8,overflow:"hidden",
                border:`1px solid ${T.border}`}}>
                {[{id:"upload",icon:"📸",label:"UPLOAD FILE"},{id:"manual",icon:"✏",label:"MANUAL INPUT"}].map(m=>(
                  <button key={m.id} onClick={()=>setMode(m.id)} style={{
                    flex:1,padding:"12px 16px",border:"none",cursor:"pointer",
                    fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:2,
                    background:mode===m.id?T.blueDim:T.panel,
                    color:mode===m.id?T.cyan:T.dim,
                    borderBottom:mode===m.id?`2px solid ${T.cyan}`:"2px solid transparent",
                    transition:"all 0.2s"
                  }}>{m.icon} {m.label}</button>
                ))}
              </div>

              {mode==="upload"&&(
                <div style={{marginBottom:20}}>
                  <UploadZone onExtract={handleExtract} extracting={extracting}/>
                  {ocrConf&&(
                    <div style={{marginTop:10,padding:"10px 14px",borderRadius:6,fontFamily:T.mono,fontSize:11,
                      background:ocrConf==="high"?T.greenDim:ocrConf==="medium"?T.yellowDim:T.redDim,
                      border:`1px solid ${ocrConf==="high"?T.green:ocrConf==="medium"?T.yellow:T.red}44`,
                      color:ocrConf==="high"?T.green:ocrConf==="medium"?T.yellow:T.red,
                      display:"flex",justifyContent:"space-between"}}>
                      <span>{ocrConf==="high"?"✓ HIGH CONFIDENCE EXTRACTION":ocrConf==="medium"?"⚠ MEDIUM CONFIDENCE — REVIEW FIELDS":"⚠ LOW CONFIDENCE — CORRECT MANUALLY"}</span>
                      {filled.size>0&&<span style={{color:T.dim}}>{filled.size} FIELDS FILLED</span>}
                    </div>
                  )}
                </div>
              )}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.cyan,letterSpacing:3}}>
                  ◈ {mode==="upload"&&filled.size>0?"REVIEW EXTRACTED FIELDS":"JOB POSTING DATA"}
                </div>
                {filled.size>0&&(
                  <button onClick={()=>{setForm(EMPTY);setFilled(new Set());setOcrConf(null);}}
                    style={{fontFamily:T.mono,fontSize:10,padding:"4px 10px",borderRadius:4,
                      background:"transparent",border:`1px solid ${T.border}`,color:T.dim,cursor:"pointer"}}>
                    ✕ CLEAR
                  </button>
                )}
              </div>

              <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                <TField label="JOB TITLE *" value={form.title} onChange={sf("title")} placeholder="e.g. Software Engineer" filled={filled.has("title")}/>
                <TField label="COMPANY NAME" value={form.company} onChange={sf("company")} placeholder="e.g. Acme Corp" half filled={filled.has("company")}/>
                <TField label="LOCATION" value={form.location} onChange={sf("location")} placeholder="e.g. Hyderabad / Remote" half filled={filled.has("location")}/>
                <TField label="SALARY / CTC" value={form.salary} onChange={sf("salary")} placeholder="e.g. ₹8 LPA" half filled={filled.has("salary")}/>
                <TField label="CONTACT EMAIL" value={form.contact_email} onChange={sf("contact_email")} placeholder="e.g. hr@company.com" half filled={filled.has("contact_email")}/>
                <TField label="JOB DESCRIPTION *" value={form.description} onChange={sf("description")} multi placeholder="Full job description..." filled={filled.has("description")}/>
                <TField label="REQUIREMENTS" value={form.requirements} onChange={sf("requirements")} multi placeholder="Skills required..." half filled={filled.has("requirements")}/>
                <TField label="BENEFITS" value={form.benefits} onChange={sf("benefits")} multi placeholder="Benefits offered..." half filled={filled.has("benefits")}/>
              </div>

              {filled.size>0&&(
                <div style={{marginTop:8,fontFamily:T.mono,fontSize:10,color:T.dim}}>
                  ▸ FIELDS IN GREEN WERE AUTO-EXTRACTED — VERIFY BEFORE ANALYZING
                </div>
              )}

              {error&&(
                <div style={{marginTop:14,padding:"12px 16px",borderRadius:6,
                  background:T.redDim,border:`1px solid ${T.red}44`,
                  fontFamily:T.mono,fontSize:11,color:T.red,whiteSpace:"pre-wrap",lineHeight:1.7}}>
                  {error}
                </div>
              )}

              <button onClick={analyze} disabled={loading} className="blue-btn" style={{
                marginTop:16,width:"100%",padding:"16px",borderRadius:8,
                fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,letterSpacing:3,
                background:loading?T.panel:`linear-gradient(135deg, ${T.blue}, ${T.cyan})`,
                border:loading?`1px solid ${T.border}`:"none",
                color:loading?T.dim:"#000",cursor:loading?"default":"pointer",
                transition:"all 0.3s",
                boxShadow:loading?"none":`0 4px 30px ${T.blueGlow}, 0 0 0 1px ${T.blue}44`
              }}>
                {loading?(
                  <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
                    <span style={{width:16,height:16,border:`2px solid ${T.dim}`,borderTopColor:T.cyan,
                      borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
                    ANALYZING THREAT...
                  </span>
                ):"⚡ RUN THREAT ANALYSIS"}
              </button>
            </div>

            {/* RIGHT */}
            <div>
              {!result?(
                <div style={{animation:"slide-in-up 0.5s ease 0.2s both"}}>
                  <div style={{fontFamily:T.mono,fontSize:10,color:T.cyan,letterSpacing:3,marginBottom:16}}>
                    ◈ SYSTEM CAPABILITIES
                  </div>
                  {[
                    {icon:"📸",title:"IMAGE OCR",color:T.cyan,
                      desc:"Upload screenshots or photos. Tesseract AI reads the text and auto-fills all fields."},
                    {icon:"🧠",title:"ML MODEL",color:T.green,
                      desc:"Gradient Boosting model trained on 18,000+ real and fake job postings (Kaggle EMSCAD dataset)."},
                    {icon:"🚩",title:"RULE ENGINE",color:T.yellow,
                      desc:"25+ pattern checks for suspicious keywords, fake emails, unrealistic salaries, missing company info."},
                    {icon:"🔍",title:"COMPANY VERIFY",color:T.blue,
                      desc:"Cross-references Indeed RSS and LinkedIn to find real postings from the same company."},
                    {icon:"🤖",title:"AI ASSISTANT",color:T.green,
                      desc:"Free LLaMA 3 chatbot via Groq API answers your job safety questions with full context."},
                  ].map((c,i)=>(
                    <div key={i} style={{
                      display:"flex",gap:14,padding:"14px 16px",borderRadius:8,marginBottom:10,
                      background:T.card,border:`1px solid ${T.border}`,
                      borderLeft:`2px solid ${c.color}`,
                      animation:`fade-up 0.4s ease ${i*0.1}s both`,transition:"all 0.2s"
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${c.color}08`;e.currentTarget.style.boxShadow=`0 0 16px ${c.color}11`;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.boxShadow="none";}}
                    >
                      <div style={{fontSize:22,filter:`drop-shadow(0 0 6px ${c.color}88)`}}>{c.icon}</div>
                      <div>
                        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,color:c.color,letterSpacing:2,marginBottom:5}}>{c.title}</div>
                        <div style={{fontFamily:T.mono,fontSize:11,color:T.dim,lineHeight:1.6}}>{c.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ):(
                <div style={{animation:"slide-in-up 0.4s ease"}}>
                  <ThreatMeter score={result.fake_probability}/>
                  <div style={{
                    marginTop:16,padding:"14px 18px",borderRadius:8,
                    background:result.fake_probability>=75?T.redDim:result.fake_probability>=45?T.yellowDim:T.greenDim,
                    border:`1px solid ${result.fake_probability>=75?T.red:result.fake_probability>=45?T.yellow:T.green}44`,
                  }}>
                    <div style={{
                      fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,
                      color:result.fake_probability>=75?T.red:result.fake_probability>=45?T.yellow:T.green,
                      letterSpacing:1,marginBottom:6
                    }}>{result.verdict}</div>
                    <div style={{fontFamily:T.mono,fontSize:11,color:T.dim,lineHeight:1.6}}>{result.summary}</div>
                  </div>
                  {result.ml_score!==null&&(
                    <div style={{marginTop:10,padding:"8px 14px",borderRadius:6,fontFamily:T.mono,fontSize:11,
                      background:T.blueDim,border:`1px solid ${T.blue}33`,color:T.cyan,
                      display:"flex",justifyContent:"space-between"}}>
                      <span>🤖 ML MODEL SCORE</span>
                      <span style={{fontWeight:700}}>{result.ml_score}% FRAUD</span>
                    </div>
                  )}
                  <div style={{marginTop:10,fontFamily:T.mono,fontSize:10,color:T.dim,textAlign:"right"}}>
                    ANALYZED: {result.analyzed_at}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RESULTS DETAIL */}
          {result&&(
            <div id="results" style={{animation:"fade-up 0.5s ease"}}>
              <div style={{display:"flex",gap:0,marginBottom:20,borderRadius:8,overflow:"hidden",
                border:`1px solid ${T.border}`}}>
                {[
                  {id:"flags",icon:"⚠",label:"RED FLAGS",count:result.red_flags?.length||0},
                  {id:"company",icon:"🔍",label:"COMPANY VERIFY",count:result.company_jobs?.length||0},
                ].map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)} style={{
                    flex:1,padding:"14px 20px",border:"none",cursor:"pointer",
                    fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:2,
                    background:tab===t.id?T.blueDim:T.panel,
                    color:tab===t.id?T.cyan:T.dim,
                    borderBottom:tab===t.id?`2px solid ${T.cyan}`:"2px solid transparent",
                    transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8
                  }}>
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    <span style={{
                      fontFamily:T.mono,fontSize:10,padding:"2px 8px",borderRadius:10,
                      background:tab===t.id?T.cyan:T.border,
                      color:tab===t.id?"#000":T.dim
                    }}>{t.count}</span>
                  </button>
                ))}
              </div>

              <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,
                boxShadow:`0 0 30px ${T.blueDim}`}}>
                {tab==="flags"&&(
                  result.red_flags?.length>0?(
                    <div>
                      <div style={{fontFamily:T.mono,fontSize:10,color:T.dim,letterSpacing:2,marginBottom:14}}>
                        {result.red_flags.length} THREAT INDICATOR{result.red_flags.length!==1?"S":""} DETECTED
                      </div>
                      {result.red_flags.map((f,i)=><FlagItem key={i} flag={f} index={i}/>)}
                    </div>
                  ):(
                    <div style={{textAlign:"center",padding:"40px 0"}}>
                      <div style={{fontSize:48,marginBottom:12,filter:`drop-shadow(0 0 16px ${T.green})`}}>✓</div>
                      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,color:T.green,letterSpacing:2}}>
                        NO THREATS DETECTED
                      </div>
                      <div style={{fontFamily:T.mono,fontSize:11,color:T.dim,marginTop:8}}>
                        Passed all fraud pattern checks. Standard job search caution advised.
                      </div>
                    </div>
                  )
                )}
                {tab==="company"&&(
                  <>
                    <div style={{fontFamily:T.mono,fontSize:10,color:T.dim,letterSpacing:2,marginBottom:14}}>
                      VERIFIED LISTINGS FOR: <span style={{color:T.cyan}}>{form.company||"UNKNOWN COMPANY"}</span>
                    </div>
                    {result.company_jobs?.length>0
                      ?result.company_jobs.map((j,i)=><CompCard key={i} job={j} index={i}/>)
                      :<div style={{textAlign:"center",padding:24,fontFamily:T.mono,fontSize:12,color:T.dim}}>
                        NO LISTINGS FOUND — SEARCH LINKEDIN DIRECTLY
                      </div>}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <Chatbot context={ctx}/>
    </>
  );
}
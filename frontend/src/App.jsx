import { useState, useMemo } from "react";

const T = {
  bg:"#05080f",surf:"#0b1120",card:"#111827",border:"#1d2d44",
  acc:"#2dd4bf",accD:"rgba(45,212,191,0.10)",amb:"#fbbf24",ambD:"rgba(251,191,36,0.10)",
  red:"#f87171",redD:"rgba(248,113,113,0.10)",grn:"#34d399",grnD:"rgba(52,211,153,0.10)",
  vio:"#a78bfa",txt:"#dde8f5",sub:"#7f9bbf",mut:"#3d5068",
  fnt:"'Exo 2', sans-serif",mon:"'Fira Code', monospace",
};

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${T.bg};}
  input[type=range]{height:5px;border-radius:3px;cursor:pointer;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:${T.surf};}
  ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
  input::placeholder{color:${T.mut};}
  select option{background:${T.card};color:${T.txt};}
`;

const SUBJECTS_BASE = [
  {id:"dbms",   name:"DBMS",                           coeff:2,  hasDS:true, hasCC:true, hasExam:true},
  {id:"opres",  name:"Operational Research",            coeff:1,  hasDS:true, hasCC:true, hasExam:true},
  {id:"bigdata",name:"Big Data & Architectures",        coeff:1,  hasDS:true, hasCC:true, hasExam:true},
  {id:"dw",     name:"Data Warehouse & e-CRM",          coeff:1,  hasDS:true, hasCC:true, hasExam:true},
  {id:"advai",  name:"Advanced AI",                     coeff:1,  hasDS:true, hasCC:true, hasExam:true},
  {id:"itm",    name:"IT Management (ERP, SCM)",        coeff:1,  hasDS:false,hasCC:true, hasExam:true},
  {id:"ssfw",   name:"Server-side Framework Workshop",  coeff:1,  hasDS:false,hasCC:true, hasExam:true},
  {id:"csfw",   name:"Client-side Framework Workshop",  coeff:1,  hasDS:false,hasCC:true, hasExam:true},
  {id:"cloud",  name:"Cloud Servers & Security",        coeff:1,  hasDS:false,hasCC:true, hasExam:true},
  {id:"python", name:"Python Programming",              coeff:1,  hasDS:false,hasCC:true, hasExam:true},
  {id:"dash",   name:"Dashboard Design & Scoring",      coeff:1,  hasDS:false,hasCC:true, hasExam:true},
  {id:"ppp",    name:"Personal Professional Project",   coeff:0.5,hasDS:false,hasCC:true, hasExam:true},
  {id:"wfp",    name:"Web Framework Project",           coeff:0.5,hasDS:false,hasCC:true, hasExam:true},
  {id:"fr",     name:"Français",                        coeff:1,  hasDS:false,hasCC:true, hasExam:true},
  {id:"en",     name:"English (Business Comm.)",        coeff:1,  hasDS:false,hasCC:true, hasExam:true},
  {id:"mos",    name:"Certification MOS",               coeff:1,  hasDS:false,hasCC:false,hasExam:true},
];

const DIFF_OPTS = [
  {v:"easy",     label:"Easy",      mult:0.60, color:"#34d399"},
  {v:"medium",   label:"Medium",    mult:1.00, color:"#fbbf24"},
  {v:"hard",     label:"Hard",      mult:1.45, color:"#f87171"},
  {v:"very_hard",label:"Very Hard", mult:1.90, color:"#dc2626"},
];
const CONF_OPTS = [
  {v:"expert",  label:"Expert",  mult:0.50, color:"#34d399"},
  {v:"good",    label:"Good",    mult:0.75, color:"#2dd4bf"},
  {v:"neutral", label:"Neutral", mult:1.00, color:"#7f9bbf"},
  {v:"weak",    label:"Weak",    mult:1.35, color:"#fbbf24"},
  {v:"lost",    label:"Lost",    mult:1.80, color:"#f87171"},
];
const DIFF_MAP = Object.fromEntries(DIFF_OPTS.map(o=>[o.v,o.mult]));
const CONF_MAP = Object.fromEntries(CONF_OPTS.map(o=>[o.v,o.mult]));
const SC = ["#2dd4bf","#fbbf24","#f87171","#34d399","#a78bfa","#f472b6","#60a5fa","#fb923c","#e879f9","#4ade80"];

const mkS = b => ({...b,chapters:5,difficulty:"medium",confidence:"neutral",
  dsGrade:"",ccGrade:"",examGrade:"",chaptersCompleted:0,hoursStudied:0});

const pN = v => {
  if(v===""||v===null||v===undefined) return null;
  const n = parseFloat(v); return isNaN(n)?null:Math.min(20,Math.max(0,n));
};

function calcGrade(s) {
  const ds=pN(s.dsGrade),cc=pN(s.ccGrade),exam=pN(s.examGrade);
  if(s.hasDS&&s.hasCC){
    let ws=0,wt=0;
    if(ds!==null){ws+=ds;wt+=1;} if(cc!==null){ws+=cc;wt+=1;} if(exam!==null){ws+=exam*2;wt+=2;}
    return wt===0?null:{val:ws/wt,completeness:wt/4};
  } else if(s.hasCC){
    let ws=0,wt=0;
    if(cc!==null){ws+=cc;wt+=1;} if(exam!==null){ws+=exam*2;wt+=2;}
    return wt===0?null:{val:ws/wt,completeness:wt/3};
  }
  return exam===null?null:{val:exam,completeness:1};
}

function calcReqExam(s,t){
  const ds=pN(s.dsGrade),cc=pN(s.ccGrade);
  if(s.hasDS&&s.hasCC) return(4*t-(ds??t)-(cc??t))/2;
  if(s.hasCC) return(3*t-(cc??t))/2;
  return t;
}

function calcHrs(s){
  return Math.max(0,s.chapters-(s.chaptersCompleted||0))*2.5*(DIFF_MAP[s.difficulty]||1)*(CONF_MAP[s.confidence]||1);
}

function prio(s,t){
  const g=calcGrade(s);
  return Math.max(0,t-(g?g.val:0))*s.coeff*(CONF_MAP[s.confidence]||1);
}

function wAvg(subjects){
  let ws=0,wt=0;
  subjects.forEach(s=>{const g=calcGrade(s);if(g){ws+=g.val*s.coeff;wt+=s.coeff;}});
  return wt?ws/wt:null;
}

function dUntil(d){
  const t=new Date();t.setHours(0,0,0,0);
  return Math.max(0,Math.ceil((new Date(d)-t)/86400000));
}

// ── Shared UI ──────────────────────────────────────────────
function Badge({text,color}){
  return <span style={{background:color+"22",color,border:`1px solid ${color}44`,
    borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700,
    letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{text}</span>;
}

function Ring({value,max=20,label,size=110,color=T.acc,sub}){
  const pct=Math.min(1,Math.max(0,value/max)),r=40,c=2*Math.PI*r,off=c*(1-pct);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke={T.border} strokeWidth="9"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{transition:"stroke-dashoffset 0.9s ease"}}/>
        <text x="50" y="46" textAnchor="middle" fill={T.txt} fontSize="15"
          fontWeight="800" fontFamily={T.mon}>{typeof value==="number"?value.toFixed(1):value}</text>
        <text x="50" y="60" textAnchor="middle" fill={T.sub} fontSize="9" fontFamily={T.fnt}>/{max}</text>
      </svg>
      <span style={{color:T.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",
        letterSpacing:"0.09em"}}>{label}</span>
      {sub&&<span style={{color,fontFamily:T.mon,fontSize:11}}>{sub}</span>}
    </div>
  );
}

function StatCard({label,value,color=T.acc,sub,icon}){
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
      padding:"16px 20px",borderLeft:`3px solid ${color}`}}>
      <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
        letterSpacing:"0.12em",marginBottom:6}}>{icon} {label}</div>
      <div style={{color,fontFamily:T.mon,fontWeight:800,fontSize:32,lineHeight:1}}>{value}</div>
      {sub&&<div style={{color:T.sub,fontSize:11,marginTop:5}}>{sub}</div>}
    </div>
  );
}

function InpText({label,value,onChange,placeholder,type="text"}){
  return(
    <div>
      <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
        letterSpacing:"0.1em",marginBottom:5}}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{background:T.surf,border:`1px solid ${T.border}`,borderRadius:8,
          color:T.txt,padding:"9px 13px",fontFamily:T.fnt,fontSize:14,width:"100%",outline:"none"}}/>
    </div>
  );
}

function RangeRow({label,value,min,max,step=0.5,onChange,color=T.acc,fmt=v=>`${v}h`}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <span style={{color:T.sub,fontWeight:700,fontSize:12,fontFamily:T.mon,
        width:32,textAlign:"right",flexShrink:0}}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))} style={{flex:1,accentColor:color}}/>
      <span style={{color,fontFamily:T.mon,fontWeight:700,fontSize:14,
        width:38,textAlign:"right",flexShrink:0}}>{fmt(value)}</span>
    </div>
  );
}

function Pills({options,value,onChange}){
  return(
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {options.map(o=>(
        <button key={o.v} onClick={()=>onChange(o.v)} style={{
          padding:"6px 12px",borderRadius:8,cursor:"pointer",fontFamily:T.fnt,
          fontWeight:600,fontSize:12,border:`1px solid ${value===o.v?o.color:T.border}`,
          background:value===o.v?o.color+"22":"transparent",
          color:value===o.v?o.color:T.sub,transition:"all 0.2s"
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ── Setup Wizard ───────────────────────────────────────────
function SetupWizard({onComplete}){
  const [step,setStep]=useState(0);
  const [user,setUser]=useState({name:"",target:18,wakeTime:"07:00",sleepTime:"23:30"});
  const [sched,setSched]=useState({mon:4,tue:4,wed:4,thu:4,fri:3,sat:3,sun:6});
  const [subjs,setSubjs]=useState(SUBJECTS_BASE.map(mkS));
  const [si,setSi]=useState(0);
  const upd=(id,f,v)=>setSubjs(p=>p.map(s=>s.id===id?{...s,[f]:v}:s));
  const s=subjs[si];
  const dkl=["mon","tue","wed","thu","fri","sat","sun"];
  const dsl=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const steps=["About You","Study Schedule","Subjects","Grades"];
  const canNext=step===0?user.name.trim().length>0:true;
  const gIn={background:T.surf,border:`1px solid ${T.border}`,borderRadius:7,color:T.txt,
    padding:"7px 10px",fontFamily:T.mon,fontSize:13,width:"80px",outline:"none",textAlign:"center"};

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",
      justifyContent:"center",fontFamily:T.fnt,padding:24}}>
      <style>{GS}</style>
      <div style={{width:"100%",maxWidth:660}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontFamily:T.mon,color:T.acc,fontSize:11,letterSpacing:"0.25em",
            textTransform:"uppercase",marginBottom:14}}>EPIDS · BigData 2A.AN · S2 2025–2026</div>
          <h1 style={{fontSize:38,fontWeight:900,lineHeight:1.1,
            background:`linear-gradient(135deg,${T.txt} 0%,${T.acc} 100%)`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Study Mission Control
          </h1>
          <p style={{color:T.sub,marginTop:10,fontSize:15}}>Precision forecasting for your academic targets</p>
        </div>

        {/* Progress */}
        <div style={{display:"flex",gap:4,marginBottom:28}}>
          {steps.map((st,i)=>(
            <div key={i} style={{flex:1,cursor:i<step?"pointer":"default"}} onClick={()=>i<step&&setStep(i)}>
              <div style={{height:3,borderRadius:2,background:i<=step?T.acc:T.border,transition:"background 0.4s"}}/>
              <div style={{color:i<=step?T.acc:T.mut,fontSize:10,marginTop:5,fontWeight:600,
                textTransform:"uppercase",letterSpacing:"0.08em"}}>{st}</div>
            </div>
          ))}
        </div>

        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:28}}>

          {/* STEP 0 — About You */}
          {step===0&&(
            <div style={{display:"flex",flexDirection:"column",gap:22}}>
              <h2 style={{color:T.txt,fontSize:19,fontWeight:700}}>👋 About You</h2>
              <InpText label="Your Name" value={user.name}
                onChange={v=>setUser({...user,name:v})} placeholder="e.g. Ahmed Dridi"/>
              <div>
                <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
                  letterSpacing:"0.1em",marginBottom:8}}>Target Average</div>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <input type="range" min={10} max={20} step={0.5} value={user.target}
                    onChange={e=>setUser({...user,target:Number(e.target.value)})}
                    style={{flex:1,accentColor:user.target>=18?T.grn:user.target>=15?T.acc:T.amb}}/>
                  <div style={{color:user.target>=18?T.grn:user.target>=15?T.acc:T.amb,
                    fontFamily:T.mon,fontWeight:800,fontSize:26,minWidth:60,textAlign:"right"}}>
                    {user.target}/20
                  </div>
                </div>
                <div style={{marginTop:6,color:T.sub,fontSize:12}}>
                  {user.target>=18?"🏆 Distinction — ambitious!":
                   user.target>=15?"✅ Merit — solid goal":
                   user.target>=12?"📘 Pass — comfortable":"⚠️ Near minimum"}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <InpText label="Wake Up Time" value={user.wakeTime} type="time"
                  onChange={v=>setUser({...user,wakeTime:v})}/>
                <InpText label="Bed Time" value={user.sleepTime} type="time"
                  onChange={v=>setUser({...user,sleepTime:v})}/>
              </div>
              <div style={{padding:"12px 16px",background:T.accD,borderRadius:8,
                border:`1px solid ${T.acc}33`,color:T.sub,fontSize:13}}>
                📅 <strong style={{color:T.acc}}>DS exams: March 30</strong> — {dUntil("2026-03-30")} days away!
                &nbsp;<strong style={{color:T.amb}}>Finals: May 21</strong> — {dUntil("2026-05-21")} days away.
              </div>
            </div>
          )}

          {/* STEP 1 — Schedule */}
          {step===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div>
                <h2 style={{color:T.txt,fontSize:19,fontWeight:700}}>📅 Daily Study Hours</h2>
                <p style={{color:T.sub,fontSize:13,marginTop:4}}>Hours free for studying each day</p>
              </div>
              {dkl.map((k,i)=>(
                <RangeRow key={k} label={dsl[i]} value={sched[k]} min={0} max={12}
                  onChange={v=>setSched({...sched,[k]:v})}
                  color={sched[k]>=5?T.grn:sched[k]>=3?T.acc:sched[k]>0?T.amb:T.mut}/>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:4}}>
                <div style={{padding:"10px 14px",background:T.accD,borderRadius:8,border:`1px solid ${T.acc}33`}}>
                  <div style={{color:T.sub,fontSize:11}}>Weekly total</div>
                  <div style={{color:T.acc,fontFamily:T.mon,fontWeight:800,fontSize:22}}>
                    {Object.values(sched).reduce((a,b)=>a+b,0)}h
                  </div>
                </div>
                <div style={{padding:"10px 14px",background:T.ambD,borderRadius:8,border:`1px solid ${T.amb}33`}}>
                  <div style={{color:T.sub,fontSize:11}}>Est. until Finals</div>
                  <div style={{color:T.amb,fontFamily:T.mon,fontWeight:800,fontSize:22}}>
                    ~{Math.round(Object.values(sched).reduce((a,b)=>a+b,0)/7*dUntil("2026-05-21"))}h
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Subjects */}
          {step===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <h2 style={{color:T.txt,fontSize:19,fontWeight:700}}>📚 Subject Details</h2>
                  <p style={{color:T.acc,fontSize:13,marginTop:3}}>{s.name}</p>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Badge text={`×${s.coeff}`} color={T.amb}/>
                  {s.hasDS&&<Badge text="DS" color={T.vio}/>}
                  {s.hasCC&&<Badge text="CC" color={T.acc}/>}
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {subjs.map((sb,i)=>(
                  <button key={sb.id} onClick={()=>setSi(i)} style={{
                    width:28,height:28,borderRadius:6,border:`1px solid ${i===si?T.acc:T.border}`,
                    background:i===si?T.acc:"transparent",color:i===si?"#000":T.sub,
                    cursor:"pointer",fontFamily:T.mon,fontWeight:700,fontSize:11
                  }}>{i+1}</button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div>
                  <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
                    letterSpacing:"0.1em",marginBottom:8}}>Total Chapters</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>upd(s.id,"chapters",Math.max(1,s.chapters-1))}
                      style={{width:30,height:30,borderRadius:6,border:`1px solid ${T.border}`,
                        background:"transparent",color:T.txt,cursor:"pointer",fontSize:16,fontWeight:700}}>−</button>
                    <span style={{color:T.txt,fontFamily:T.mon,fontWeight:700,fontSize:24,
                      minWidth:30,textAlign:"center"}}>{s.chapters}</span>
                    <button onClick={()=>upd(s.id,"chapters",Math.min(20,s.chapters+1))}
                      style={{width:30,height:30,borderRadius:6,border:`1px solid ${T.acc}`,
                        background:T.accD,color:T.acc,cursor:"pointer",fontSize:16,fontWeight:700}}>+</button>
                  </div>
                </div>
                <div style={{padding:"10px 14px",background:T.accD,borderRadius:8,
                  border:`1px solid ${T.acc}33`,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                  <div style={{color:T.sub,fontSize:11}}>Study hours estimated</div>
                  <div style={{color:T.acc,fontFamily:T.mon,fontWeight:800,fontSize:22}}>
                    {calcHrs(s).toFixed(1)}h
                  </div>
                </div>
              </div>
              <div>
                <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
                  letterSpacing:"0.1em",marginBottom:8}}>Difficulty</div>
                <Pills options={DIFF_OPTS} value={s.difficulty} onChange={v=>upd(s.id,"difficulty",v)}/>
              </div>
              <div>
                <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
                  letterSpacing:"0.1em",marginBottom:8}}>Your Confidence</div>
                <Pills options={CONF_OPTS} value={s.confidence} onChange={v=>upd(s.id,"confidence",v)}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setSi(Math.max(0,si-1))} disabled={si===0}
                  style={{flex:1,padding:10,borderRadius:8,border:`1px solid ${T.border}`,
                    background:"transparent",color:T.sub,cursor:si===0?"not-allowed":"pointer",
                    fontFamily:T.fnt,fontWeight:600}}>← Previous</button>
                <button onClick={()=>setSi(Math.min(subjs.length-1,si+1))} disabled={si===subjs.length-1}
                  style={{flex:1,padding:10,borderRadius:8,border:`1px solid ${T.acc}`,
                    background:T.accD,color:T.acc,cursor:si===subjs.length-1?"not-allowed":"pointer",
                    fontFamily:T.fnt,fontWeight:600}}>Next →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Grades */}
          {step===3&&(
            <div>
              <h2 style={{color:T.txt,fontSize:19,fontWeight:700,marginBottom:4}}>📊 Existing Grades</h2>
              <p style={{color:T.sub,fontSize:13,marginBottom:18}}>
                Enter DS / CC grades already received. Leave blank if not yet graded.
              </p>
              <div style={{maxHeight:360,overflowY:"auto",paddingRight:4}}>
                {subjs.filter(s=>s.hasDS||s.hasCC).map(s=>(
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,
                    padding:"10px 0",borderBottom:`1px solid ${T.border}22`}}>
                    <div style={{flex:1}}>
                      <div style={{color:T.txt,fontWeight:600,fontSize:13}}>{s.name}</div>
                      <div style={{color:T.sub,fontSize:11,marginTop:2}}>×{s.coeff} coeff</div>
                    </div>
                    {s.hasDS&&(
                      <div style={{textAlign:"center"}}>
                        <div style={{color:T.vio,fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>DS</div>
                        <input type="number" min={0} max={20} step={0.25} placeholder="—"
                          value={s.dsGrade} onChange={e=>upd(s.id,"dsGrade",e.target.value)}
                          style={gIn}/>
                      </div>
                    )}
                    {s.hasCC&&(
                      <div style={{textAlign:"center"}}>
                        <div style={{color:T.acc,fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>CC</div>
                        <input type="number" min={0} max={20} step={0.25} placeholder="—"
                          value={s.ccGrade} onChange={e=>upd(s.id,"ccGrade",e.target.value)}
                          style={gIn}/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:14,gap:12}}>
          <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}
            style={{padding:"10px 22px",borderRadius:8,border:`1px solid ${T.border}`,
              background:"transparent",color:T.sub,cursor:step===0?"not-allowed":"pointer",
              fontFamily:T.fnt,fontWeight:600,opacity:step===0?0.4:1}}>← Back</button>
          {step<3
            ?<button onClick={()=>canNext&&setStep(s=>s+1)}
              style={{padding:"10px 28px",borderRadius:8,
                border:`1px solid ${canNext?T.acc:T.border}`,
                background:canNext?T.acc:"transparent",color:canNext?"#000":T.mut,
                cursor:canNext?"pointer":"not-allowed",fontFamily:T.fnt,fontWeight:700,
                opacity:canNext?1:0.5,fontSize:14}}>Continue →</button>
            :<button onClick={()=>onComplete({user,schedule:sched,subjects:subjs})}
              style={{padding:"10px 28px",borderRadius:8,border:"none",
                background:`linear-gradient(135deg,${T.acc},${T.grn})`,
                color:"#05080f",cursor:"pointer",fontFamily:T.fnt,fontWeight:800,
                fontSize:15,letterSpacing:"0.04em"}}>🚀 Launch Mission Control</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────
function Dashboard({appData}){
  const {user,schedule,subjects}=appData;
  const dDS=dUntil("2026-03-30"),dEx=dUntil("2026-05-21"),dRv=dUntil("2026-05-18");
  const wkH=Object.values(schedule).reduce((a,b)=>a+b,0);
  const availHrs=Math.round(wkH/7*dEx);
  const analysis=useMemo(()=>subjects.map(s=>({
    ...s,grade:calcGrade(s),hoursNeeded:calcHrs(s),
    reqExam:calcReqExam(s,user.target),priority:prio(s,user.target)
  })).sort((a,b)=>b.priority-a.priority),[subjects,user.target]);
  const totalHrs=analysis.reduce((s,x)=>s+x.hoursNeeded,0);
  const bal=availHrs-totalHrs,daily=dEx>0?totalHrs/dEx:0;
  const curAvg=wAvg(subjects);
  const projAvg=useMemo(()=>{
    let ws=0,wt=0;
    subjects.forEach(s=>{const g=calcGrade(s);ws+=(g?g.val:user.target)*s.coeff;wt+=s.coeff;});
    return wt?ws/wt:0;
  },[subjects,user.target]);
  const ac=projAvg>=user.target?T.grn:projAvg>=user.target-2?T.amb:T.red;
  const todayKey=["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];
  const todayHrs=schedule[todayKey]||0;

  return(
    <div style={{fontFamily:T.fnt}}>
      <div style={{marginBottom:24}}>
        <h1 style={{color:T.txt,fontSize:24,fontWeight:900}}>Mission Control 🎯</h1>
        <p style={{color:T.sub,fontSize:14,marginTop:4}}>
          Welcome, <span style={{color:T.acc}}>{user.name}</span> — your academic status at a glance
        </p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
        <StatCard label="Days to DS" value={dDS} icon="⚡"
          color={dDS<14?T.red:dDS<21?T.amb:T.acc} sub="Mar 30 — Mid-term exams"/>
        <StatCard label="Days to Revision" value={dRv} icon="📖" color={T.vio} sub="May 18 — Revision period"/>
        <StatCard label="Days to Finals" value={dEx} icon="🏁" color={T.grn} sub="May 21 — Semester exams"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"180px 1fr 1fr",gap:14,marginBottom:20}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
          <Ring value={projAvg} max={20} label="Projected" color={ac}
            sub={projAvg>=user.target?"✅ On target":"⚠️ Below target"}/>
          {curAvg!==null&&(
            <div style={{textAlign:"center"}}>
              <div style={{color:T.sub,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Current (graded)</div>
              <div style={{color:curAvg>=user.target?T.grn:T.amb,fontFamily:T.mon,fontWeight:800,fontSize:20}}>
                {curAvg.toFixed(2)}
              </div>
            </div>
          )}
          <div style={{textAlign:"center"}}>
            <div style={{color:T.sub,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Your Target</div>
            <div style={{color:T.grn,fontFamily:T.mon,fontWeight:800,fontSize:20}}>{user.target}/20</div>
          </div>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:18}}>
          <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
            letterSpacing:"0.12em",marginBottom:14}}>⏱ Study Hours Analysis</div>
          {[
            {l:"Total hours needed",v:`${totalHrs.toFixed(0)}h`,c:T.red},
            {l:"Hours available (est.)",v:`${availHrs}h`,c:T.grn},
            {l:"Balance",v:`${bal>=0?"+":""}${bal.toFixed(0)}h`,c:bal>=0?T.grn:T.red},
            {l:"Required per day",v:`${daily.toFixed(1)}h/day`,c:T.acc},
            {l:"Available today",v:`${todayHrs}h`,c:T.amb},
          ].map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",
              padding:"8px 0",borderBottom:i<4?`1px solid ${T.border}22`:"none"}}>
              <span style={{color:T.sub,fontSize:13}}>{r.l}</span>
              <span style={{color:r.c,fontFamily:T.mon,fontWeight:700,fontSize:14}}>{r.v}</span>
            </div>
          ))}
          {bal<0&&(
            <div style={{marginTop:12,padding:"8px 12px",background:T.redD,borderRadius:8,
              border:`1px solid ${T.red}33`,color:T.red,fontSize:12}}>
              ⚠️ You're {Math.abs(bal).toFixed(0)}h short! Add ~{Math.ceil(Math.abs(bal)/dEx*10)/10}h/day more.
            </div>
          )}
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:18}}>
          <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
            letterSpacing:"0.12em",marginBottom:14}}>📌 Today's Priority List</div>
          <div style={{padding:"8px 12px",background:T.accD,borderRadius:8,
            border:`1px solid ${T.acc}33`,marginBottom:12}}>
            <span style={{color:T.sub,fontSize:12}}>Study time today: </span>
            <span style={{color:T.acc,fontFamily:T.mon,fontWeight:700}}>{todayHrs}h available</span>
          </div>
          {analysis.slice(0,5).map((s,i)=>{
            const ic=["🔴","🔴","🟡","🟡","🟢"][i];
            return(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,
                padding:"7px 0",borderBottom:i<4?`1px solid ${T.border}22`:"none"}}>
                <span style={{fontSize:14,flexShrink:0}}>{ic}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:T.txt,fontSize:12,fontWeight:600,whiteSpace:"nowrap",
                    overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{color:SC[i%SC.length],fontFamily:T.mon,fontSize:11,fontWeight:700}}>
                    {s.hoursNeeded.toFixed(0)}h
                  </div>
                  <div style={{color:T.mut,fontSize:10}}>×{s.coeff}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
          letterSpacing:"0.12em",marginBottom:16}}>
          📋 Full Priority Matrix — Required Exam Scores to Hit {user.target}/20
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:T.fnt}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {["#","Subject","Coeff","Assessments","Hours Left","Req. Exam","Status"].map(h=>(
                  <th key={h} style={{color:T.sub,fontWeight:700,textAlign:"left",
                    padding:"8px 12px",fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysis.map((s,i)=>{
                const rC=s.reqExam>20?T.red:s.reqExam>17?T.amb:s.reqExam<0?T.grn:T.acc;
                const stC=i<3?T.red:i<7?T.amb:T.grn;
                const stT=i<3?"🔴 Critical":i<7?"🟡 Important":"🟢 On Track";
                return(
                  <tr key={s.id} style={{borderBottom:`1px solid ${T.border}18`}}>
                    <td style={{padding:"10px 12px",color:T.mut,fontFamily:T.mon,fontWeight:600}}>{i+1}</td>
                    <td style={{padding:"10px 12px"}}><div style={{color:T.txt,fontWeight:600}}>{s.name}</div></td>
                    <td style={{padding:"10px 12px",color:T.amb,fontFamily:T.mon,fontWeight:700}}>×{s.coeff}</td>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {s.hasDS&&<Badge text="DS" color={T.vio}/>}
                        {s.hasCC&&<Badge text="CC" color={T.acc}/>}
                        <Badge text="EXAM" color={T.sub}/>
                      </div>
                    </td>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:50,background:T.border,borderRadius:3,height:5}}>
                          <div style={{background:T.acc,height:"100%",borderRadius:3,
                            width:`${Math.min(100,s.hoursStudied/(s.hoursStudied+s.hoursNeeded||1)*100)}%`}}/>
                        </div>
                        <span style={{color:T.txt,fontFamily:T.mon,fontSize:12}}>{s.hoursNeeded.toFixed(0)}h</span>
                      </div>
                    </td>
                    <td style={{padding:"10px 12px"}}>
                      <span style={{color:rC,fontFamily:T.mon,fontWeight:700}}>
                        {s.reqExam>20?"⚠️ Impossible":s.reqExam<0?"✅ Secured":`${s.reqExam.toFixed(1)}/20`}
                      </span>
                    </td>
                    <td style={{padding:"10px 12px"}}>
                      <span style={{background:stC+"18",color:stC,border:`1px solid ${stC}33`,
                        borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:700}}>{stT}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Subjects View ──────────────────────────────────────────
function SubjectsView({appData,setAppData}){
  const {subjects,user}=appData;
  const [expanded,setExpanded]=useState(null);
  const upd=(id,f,v)=>setAppData(p=>({...p,subjects:p.subjects.map(s=>s.id===id?{...s,[f]:v}:s)}));
  const inSt={background:T.surf,border:`1px solid ${T.border}`,borderRadius:7,color:T.txt,
    padding:"8px 12px",fontFamily:T.mon,fontSize:13,outline:"none"};
  return(
    <div style={{fontFamily:T.fnt}}>
      <div style={{marginBottom:22}}>
        <h1 style={{color:T.txt,fontSize:24,fontWeight:900}}>📚 Subject Manager</h1>
        <p style={{color:T.sub,fontSize:14,marginTop:4}}>Update grades, chapters & progress — recalculates live</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {subjects.map((s,idx)=>{
          const g=calcGrade(s),hrs=calcHrs(s),req=calcReqExam(s,user.target);
          const rC=req>20?T.red:req>17?T.amb:req<0?T.grn:T.acc;
          const open=expanded===s.id;
          return(
            <div key={s.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
              overflow:"hidden",borderLeft:`3px solid ${SC[idx%SC.length]}`}}>
              <div onClick={()=>setExpanded(open?null:s.id)}
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",cursor:"pointer"}}>
                <div style={{flex:1}}>
                  <div style={{color:T.txt,fontWeight:700,fontSize:14}}>{s.name}</div>
                  <div style={{display:"flex",gap:5,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                    <Badge text={`×${s.coeff}`} color={T.amb}/>
                    {s.hasDS&&<Badge text="DS" color={T.vio}/>}
                    {s.hasCC&&<Badge text="CC" color={T.acc}/>}
                    <Badge text={s.difficulty.replace("_"," ")} color={DIFF_OPTS.find(d=>d.v===s.difficulty)?.color||T.sub}/>
                    <Badge text={s.confidence} color={CONF_OPTS.find(c=>c.v===s.confidence)?.color||T.sub}/>
                  </div>
                </div>
                <div style={{textAlign:"right",minWidth:100}}>
                  <div style={{color:T.sub,fontSize:10,marginBottom:4}}>{s.chaptersCompleted}/{s.chapters} ch done</div>
                  <div style={{background:T.border,borderRadius:3,height:5,width:100}}>
                    <div style={{background:SC[idx%SC.length],height:"100%",borderRadius:3,
                      width:`${s.chapters>0?(s.chaptersCompleted/s.chapters)*100:0}%`,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{color:T.sub,fontSize:10,marginTop:3}}>{hrs.toFixed(0)}h remaining</div>
                </div>
                <div style={{textAlign:"right",minWidth:70}}>
                  {g
                    ?<><div style={{color:g.val>=user.target?T.grn:T.amb,fontFamily:T.mon,fontWeight:800,fontSize:22}}>
                        {g.val.toFixed(1)}</div>
                      <div style={{color:T.sub,fontSize:10}}>{(g.completeness*100).toFixed(0)}% data</div></>
                    :<div style={{color:T.mut,fontSize:13}}>No grades</div>
                  }
                </div>
                <span style={{color:T.sub,fontSize:16,display:"inline-block",
                  transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.3s"}}>▼</span>
              </div>
              {open&&(
                <div style={{padding:"18px",borderTop:`1px solid ${T.border}`}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                    <div>
                      <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
                        letterSpacing:"0.1em",marginBottom:12}}>Grade Entry</div>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {s.hasDS&&(
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <Badge text="DS" color={T.vio}/>
                            <input type="number" min={0} max={20} step={0.25} placeholder="Not graded"
                              value={s.dsGrade} onChange={e=>upd(s.id,"dsGrade",e.target.value)}
                              style={{...inSt,width:110}}/>
                            <span style={{color:T.sub,fontSize:12}}>/20</span>
                          </div>
                        )}
                        {s.hasCC&&(
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <Badge text="CC" color={T.acc}/>
                            <input type="number" min={0} max={20} step={0.25} placeholder="Not graded"
                              value={s.ccGrade} onChange={e=>upd(s.id,"ccGrade",e.target.value)}
                              style={{...inSt,width:110}}/>
                            <span style={{color:T.sub,fontSize:12}}>/20</span>
                          </div>
                        )}
                        {s.hasExam&&(
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <Badge text="EXAM" color={T.grn}/>
                            <input type="number" min={0} max={20} step={0.25} placeholder="Not taken"
                              value={s.examGrade} onChange={e=>upd(s.id,"examGrade",e.target.value)}
                              style={{...inSt,width:110}}/>
                            <span style={{color:T.sub,fontSize:12}}>/20</span>
                          </div>
                        )}
                      </div>
                      <div style={{marginTop:14,padding:"10px 14px",background:rC+"15",
                        border:`1px solid ${rC}33`,borderRadius:8}}>
                        <div style={{color:T.sub,fontSize:11}}>Exam score needed to reach {user.target}/20</div>
                        <div style={{color:rC,fontFamily:T.mon,fontWeight:800,fontSize:24,marginTop:3}}>
                          {req>20?"Impossible 😰":req<0?"Already secured! 🎉":`${req.toFixed(2)}/20`}
                        </div>
                        {req>20&&<div style={{color:T.sub,fontSize:11,marginTop:3}}>
                          DS/CC grades too low. Consider revising target.
                        </div>}
                      </div>
                    </div>
                    <div>
                      <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
                        letterSpacing:"0.1em",marginBottom:12}}>Study Progress</div>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {[
                          {l:"Total chapters",f:"chapters",v:s.chapters,mn:1,mx:20},
                          {l:"Chapters completed",f:"chaptersCompleted",v:s.chaptersCompleted,mn:0,mx:s.chapters},
                          {l:"Hours studied so far",f:"hoursStudied",v:s.hoursStudied,mn:0,mx:999},
                        ].map(r=>(
                          <div key={r.f} style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{color:T.sub,fontSize:13,flex:1}}>{r.l}</span>
                            <input type="number" min={r.mn} max={r.mx} value={r.v}
                              onChange={e=>upd(s.id,r.f,parseFloat(e.target.value)||0)}
                              style={{...inSt,width:70,textAlign:"center"}}/>
                          </div>
                        ))}
                        <div>
                          <div style={{color:T.sub,fontSize:11,marginBottom:5}}>Difficulty</div>
                          <Pills options={DIFF_OPTS} value={s.difficulty} onChange={v=>upd(s.id,"difficulty",v)}/>
                        </div>
                        <div>
                          <div style={{color:T.sub,fontSize:11,marginBottom:5}}>Confidence</div>
                          <Pills options={CONF_OPTS} value={s.confidence} onChange={v=>upd(s.id,"confidence",v)}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Simulator ──────────────────────────────────────────────
function SimulatorView({appData}){
  const {subjects,user}=appData;
  const [sim,setSim]=useState(()=>{
    const i={};
    subjects.forEach(s=>{i[s.id]={ds:pN(s.dsGrade)??user.target,cc:pN(s.ccGrade)??user.target,exam:pN(s.examGrade)??user.target};});
    return i;
  });
  const setAll=(f,v)=>setSim(p=>{const n={};Object.keys(p).forEach(id=>{n[id]={...p[id],[f]:v};});return n;});
  const simAvg=useMemo(()=>{
    let ws=0,wt=0;
    subjects.forEach(s=>{
      const sg=sim[s.id]||{};
      const g=calcGrade({...s,dsGrade:s.hasDS?sg.ds:"",ccGrade:s.hasCC?sg.cc:"",examGrade:sg.exam});
      if(g){ws+=g.val*s.coeff;wt+=s.coeff;}
    });
    return wt?ws/wt:0;
  },[sim,subjects]);
  const ac=simAvg>=user.target?T.grn:simAvg>=user.target-1.5?T.amb:T.red;
  return(
    <div style={{fontFamily:T.fnt}}>
      <div style={{marginBottom:22}}>
        <h1 style={{color:T.txt,fontSize:24,fontWeight:900}}>🎚️ Grade Simulator</h1>
        <p style={{color:T.sub,fontSize:14,marginTop:4}}>Drag sliders and watch your average react in real time</p>
      </div>
      <div style={{background:T.card,border:`2px solid ${ac}55`,borderRadius:14,padding:"20px 28px",
        marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
        <div>
          <div style={{color:T.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}}>
            Simulated Final Average
          </div>
          <div style={{color:ac,fontFamily:T.mon,fontWeight:900,fontSize:56,lineHeight:1}}>
            {simAvg.toFixed(2)}
          </div>
          <div style={{color:T.sub,fontSize:13,marginTop:6}}>
            {simAvg>=user.target
              ?`🎉 +${(simAvg-user.target).toFixed(2)} above your ${user.target} target!`
              :`📉 ${(user.target-simAvg).toFixed(2)} below target — adjust expected grades`}
          </div>
          <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
            {[{l:"All 10",v:10},{l:"All 15",v:15},{l:"All 18",v:18},{l:"All 20",v:20}].map(b=>(
              <button key={b.v} onClick={()=>{setAll("ds",b.v);setAll("cc",b.v);setAll("exam",b.v);}}
                style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${T.border}`,
                  background:"transparent",color:T.sub,cursor:"pointer",fontFamily:T.fnt,
                  fontSize:12,fontWeight:600}}>{b.l}</button>
            ))}
          </div>
        </div>
        <Ring value={simAvg} max={20} label="Average" color={ac} size={130}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {subjects.map((s,idx)=>{
          const sg=sim[s.id]||{};
          const g=calcGrade({...s,dsGrade:s.hasDS?sg.ds:"",ccGrade:s.hasCC?sg.cc:"",examGrade:sg.exam});
          const sg2=g?g.val:0;
          const upd=(f,v)=>setSim(p=>({...p,[s.id]:{...p[s.id],[f]:Math.min(20,Math.max(0,v))}}));
          return(
            <div key={s.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
              padding:"14px 18px",borderLeft:`3px solid ${SC[idx%SC.length]}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{color:T.txt,fontWeight:700,fontSize:14}}>{s.name}</span>
                  <Badge text={`×${s.coeff}`} color={T.amb}/>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{color:sg2>=user.target?T.grn:T.amb,fontFamily:T.mon,fontWeight:800,fontSize:20}}>
                    {sg2.toFixed(1)}
                  </span>
                  <span style={{color:T.sub,fontSize:11,marginLeft:6}}>×{s.coeff} coeff</span>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {s.hasDS&&<RangeRow label="DS" value={sg.ds||0} min={0} max={20} step={0.25}
                  onChange={v=>upd("ds",v)} color={T.vio} fmt={v=>`${v}/20`}/>}
                {s.hasCC&&<RangeRow label="CC" value={sg.cc||0} min={0} max={20} step={0.25}
                  onChange={v=>upd("cc",v)} color={T.acc} fmt={v=>`${v}/20`}/>}
                <RangeRow label="EX" value={sg.exam||0} min={0} max={20} step={0.25}
                  onChange={v=>upd("exam",v)} color={T.grn} fmt={v=>`${v}/20`}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Planner ────────────────────────────────────────────────
function PlannerView({appData}){
  const {user,schedule,subjects}=appData;
  const analysis=useMemo(()=>subjects.map(s=>({
    ...s,hoursNeeded:calcHrs(s),priority:prio(s,user.target)
  })).sort((a,b)=>b.priority-a.priority).filter(s=>s.hoursNeeded>0),[subjects,user.target]);
  const totalN=analysis.reduce((s,x)=>s+x.hoursNeeded,0);
  const dEx=dUntil("2026-05-21"),wkH=Object.values(schedule).reduce((a,b)=>a+b,0);
  const dkl=["mon","tue","wed","thu","fri","sat","sun"];
  const dshr=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const totP=analysis.reduce((s,x)=>s+x.priority,0);
  const weekPlan=dkl.map((k,i)=>{
    const hrs=schedule[k];
    if(!hrs)return{short:dshr[i],hrs:0,slots:[]};
    const slots=analysis.slice(0,6).map((s,si)=>({
      name:s.name.split(" ").slice(0,2).join(" "),
      hrs:totP>0?(s.priority/totP)*hrs:hrs/6,
      color:SC[si%SC.length]
    })).filter(x=>x.hrs>=0.25);
    return{short:dshr[i],hrs,slots};
  });
  const phase=dEx>60?"Deep Learning":dEx>30?"Chapter Review":dEx>14?"Practice & DS Prep":"Exam Sprint";
  const phC=dEx>60?T.grn:dEx>30?T.acc:dEx>14?T.amb:T.red;
  return(
    <div style={{fontFamily:T.fnt}}>
      <div style={{marginBottom:22}}>
        <h1 style={{color:T.txt,fontSize:24,fontWeight:900}}>📋 Study Planner</h1>
        <p style={{color:T.sub,fontSize:14,marginTop:4}}>Optimized weekly allocation based on priority & study needs</p>
      </div>
      <div style={{background:phC+"15",border:`1px solid ${phC}44`,borderRadius:12,padding:"12px 18px",
        marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>
            Current Study Phase
          </div>
          <div style={{color:phC,fontWeight:800,fontSize:20}}>{phase}</div>
        </div>
        <div style={{color:T.sub,fontSize:13}}>
          {dEx>60?"Focus on understanding concepts deeply":
           dEx>30?"Review and consolidate each chapter":
           dEx>14?"Practice past exams, prep for DS":
           "Final revision — prioritize weak subjects"}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {l:"Total Hours Needed",v:`${totalN.toFixed(0)}h`,c:T.red},
          {l:"Weekly Capacity",v:`${wkH}h/week`,c:T.grn},
          {l:"Active Subjects",v:`${analysis.length}`,c:T.acc},
          {l:"Hours/Day Needed",v:`${(totalN/Math.max(1,dEx)).toFixed(1)}h`,c:T.amb},
        ].map(x=>(
          <div key={x.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,
            padding:"12px 14px",textAlign:"center"}}>
            <div style={{color:x.c,fontFamily:T.mon,fontWeight:800,fontSize:22}}>{x.v}</div>
            <div style={{color:T.sub,fontSize:10,marginTop:4,fontWeight:600}}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:20}}>
        {weekPlan.map((day,i)=>(
          <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,
            padding:10,minHeight:170,opacity:day.hrs===0?0.5:1}}>
            <div style={{color:T.txt,fontWeight:700,fontSize:12,marginBottom:2}}>{day.short}</div>
            <div style={{color:T.acc,fontFamily:T.mon,fontSize:11,fontWeight:600,marginBottom:8}}>{day.hrs}h</div>
            {day.slots.length>0
              ?day.slots.map((slot,j)=>(
                <div key={j} style={{background:slot.color+"18",border:`1px solid ${slot.color}44`,
                  borderRadius:5,padding:"3px 6px",marginBottom:4}}>
                  <div style={{color:slot.color,fontSize:9,fontWeight:700,whiteSpace:"nowrap",
                    overflow:"hidden",textOverflow:"ellipsis"}}>{slot.name}</div>
                  <div style={{color:T.sub,fontSize:9,fontFamily:T.mon}}>{slot.hrs.toFixed(1)}h</div>
                </div>
              ))
              :<div style={{color:T.mut,fontSize:10,textAlign:"center",marginTop:20}}>
                {day.hrs===0?"Rest day 🛋️":"Add subjects"}
              </div>
            }
          </div>
        ))}
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{color:T.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
          letterSpacing:"0.12em",marginBottom:16}}>Subject Hours Breakdown</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {analysis.map((s,i)=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:8,height:8,borderRadius:2,flexShrink:0,background:SC[i%SC.length]}}/>
              <div style={{flex:1,color:T.txt,fontSize:12,minWidth:0,whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
              <div style={{width:200,flexShrink:0}}>
                <div style={{background:T.border,borderRadius:3,height:7}}>
                  <div style={{background:SC[i%SC.length],height:"100%",borderRadius:3,
                    width:`${totalN>0?(s.hoursNeeded/totalN)*100:0}%`,transition:"width 0.6s"}}/>
                </div>
              </div>
              <div style={{color:T.sub,fontFamily:T.mon,fontSize:12,minWidth:40,
                textAlign:"right",flexShrink:0}}>{s.hoursNeeded.toFixed(0)}h</div>
              <Badge text={`×${s.coeff}`} color={T.amb}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Shell ─────────────────────────────────────────────
function MainApp({appData,setAppData,onLogout}){
  const [view,setView]=useState("dashboard");
  const nav=[
    {id:"dashboard",label:"Dashboard",icon:"🎯"},
    {id:"subjects", label:"Subjects",  icon:"📚"},
    {id:"simulator",label:"Simulator", icon:"🎚️"},
    {id:"planner",  label:"Planner",   icon:"📋"},
  ];
  const dDS=dUntil("2026-03-30"),dEx=dUntil("2026-05-21");
  const cur=wAvg(appData.subjects);
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",fontFamily:T.fnt,color:T.txt}}>
      <style>{GS}</style>
      <div style={{width:210,background:T.surf,borderRight:`1px solid ${T.border}`,
        display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"20px 18px 16px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{color:T.acc,fontFamily:T.mon,fontSize:12,fontWeight:600,
            letterSpacing:"0.18em",textTransform:"uppercase"}}>StudyOS</div>
          <div style={{color:T.mut,fontSize:10,marginTop:3}}>BigData 2A.AN · S2 2026</div>
          <div style={{marginTop:10,color:T.txt,fontSize:13,fontWeight:600}}>{appData.user.name}</div>
          <div style={{color:T.sub,fontSize:11}}>
            Target: <span style={{color:T.grn,fontFamily:T.mon}}>{appData.user.target}/20</span>
          </div>
          {cur!==null&&(
            <div style={{color:T.sub,fontSize:11}}>
              Current: <span style={{color:cur>=appData.user.target?T.grn:T.amb,
                fontFamily:T.mon}}>{cur.toFixed(2)}/20</span>
            </div>
          )}
        </div>
        <nav style={{padding:"12px 10px",flex:1}}>
          {nav.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 10px",
              borderRadius:8,border:"none",cursor:"pointer",
              background:view===item.id?T.accD:"transparent",
              color:view===item.id?T.acc:T.sub,fontFamily:T.fnt,fontWeight:600,
              fontSize:14,textAlign:"left",marginBottom:3,
              borderLeft:view===item.id?`3px solid ${T.acc}`:"3px solid transparent",
              transition:"all 0.2s",
            }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{padding:"14px 18px",borderTop:`1px solid ${T.border}`}}>
          <div style={{color:T.mut,fontSize:9,fontWeight:700,textTransform:"uppercase",
            letterSpacing:"0.12em",marginBottom:10}}>Countdown</div>
          {[
            {l:"DS Exams",d:dDS,c:dDS<14?T.red:T.amb,dt:"Mar 30"},
            {l:"Finals",d:dEx,c:T.grn,dt:"May 21"},
          ].map(x=>(
            <div key={x.l} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",marginBottom:7}}>
              <div>
                <div style={{color:T.sub,fontSize:11}}>{x.l}</div>
                <div style={{color:T.mut,fontSize:9}}>{x.dt}</div>
              </div>
              <span style={{color:x.c,fontFamily:T.mon,fontWeight:800,fontSize:16}}>{x.d}d</span>
            </div>
          ))}
          {/* ── Logout Button ── */}
          {onLogout&&(
            <button onClick={onLogout} style={{
              width:"100%",marginTop:10,padding:"8px 12px",borderRadius:8,
              border:`1px solid ${T.red}55`,background:T.redD,
              color:T.red,fontFamily:T.fnt,fontWeight:700,fontSize:13,
              cursor:"pointer",display:"flex",alignItems:"center",
              justifyContent:"center",gap:6,transition:"all 0.2s",
            }}>
              🚪 Logout
            </button>
          )}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
        {view==="dashboard"&&<Dashboard appData={appData}/>}
        {view==="subjects" &&<SubjectsView appData={appData} setAppData={setAppData}/>}
        {view==="simulator"&&<SimulatorView appData={appData}/>}
        {view==="planner"  &&<PlannerView appData={appData}/>}
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────
export default function App({ authToken, authUser, onLogout }){
  const [done,setDone]=useState(false);
  const [data,setData]=useState(null);
  return done
    ?<MainApp appData={data} setAppData={setData} onLogout={onLogout}/>
    :<SetupWizard onComplete={d=>{setData(d);setDone(true);}}/>;
}

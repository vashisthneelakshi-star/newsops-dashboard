import { useState, useMemo, useEffect, useCallback, useRef } from "react";

// ── Google Sheet Config ──────────────────────────────────────────
const SHEET_ID = "1Iv3T-ah2Ed2euConb8_cxgF4nyX-BuXmbqoYM1F5zFQ";
const SHEET_NAME = "Sheet1";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
const SENDER_EMAIL = "bhuwan.jain@in.patrika.com";

// ── Login Config ─────────────────────────────────────────────────
const USERS = [
  { username: "Admin",  password: "Admin@2024", role: "admin", label: "Admin",      states: null },
  { username: "Raj",    password: "Raj@2024",   role: "state", label: "Rajasthan",  states: ["Rajasthan","Raj"] },
  { username: "MP",     password: "MP@2024",    role: "state", label: "Madhya Pradesh", states: ["MP","Madhya Pradesh"] },
  { username: "CG",     password: "CG@2024",    role: "state", label: "Chhattisgarh", states: ["CG","Chhattisgarh"] },
  { username: "Metro",  password: "Metro@2024", role: "state", label: "Metro",      states: ["Metro"] },
];

function matchesUserState(recordState, userStates) {
  if (!userStates) return true;
  return userStates.some(s => (recordState||"").toLowerCase().includes(s.toLowerCase()));
}

// ── EmailJS Config (fill your keys) ─────────────────────────────
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";

// ── Edition Categories ───────────────────────────────────────────
// Priority: exact edition match first, then branch match
// Edition-level overrides (more specific)
const EDITION_EXACT = {
  "RP-JAI-JAIPUR CITY": "A+",
};

// Branch-level defaults
const BRANCH_CATEGORY = {
  // Rajasthan
  "Jaipur": "C",       // All Jaipur editions are C except JAIPUR CITY (overridden above)
  "Jodhpur": "B+", "Kota": "B+", "Udaipur": "B+",
  "Alwar": "B", "Jhunjhunu": "B", "Sikar": "B", "Ajmer": "B",
  "Bikaner": "B", "Bhilwara": "B", "Pali": "B",
  "Sriganganagar": "C", "Ganganagar": "B", "Nagaur": "B",  // Fix: Ganganagar = C
  "Bharatpur": "C", "Banswara": "C", "Barmer": "C",
  // Madhya Pradesh
  "Indore": "A", "Bhopal": "A",
  "Jabalpur": "B+",
  "Gwalior": "B", "Ujjain": "B", "Sagar": "B",
  "Chhindwara": "C", "Narmadapuram": "C", "Satna": "C",
  "Ratlam": "C", "Khandwa": "C",
  "Shahdol": "D",
  // Chhattisgarh
  "Raipur": "A",
  "Bilaspur": "B", "Bhilai": "B",
  "Jagdalpur": "D",
  // Metro
  "Bengaluru": "C", "Surat": "C",
  "Ahmedabad": "D", "Chennai": "D", "Hubli": "D",
};

const CAT_ORDER = ["A+", "A", "B+", "B", "C", "D"];
const CAT_COLORS = {
  "A+": { bg: "#fff8e1", color: "#f57f17", border: "#ffd54f", bar: "#ffc107" },
  "A":  { bg: "#e8f5e9", color: "#1b5e20", border: "#81c784", bar: "#4caf50" },
  "B+": { bg: "#e3f2fd", color: "#0d47a1", border: "#64b5f6", bar: "#2196f3" },
  "B":  { bg: "#ede7f6", color: "#4527a0", border: "#9575cd", bar: "#7c4dff" },
  "C":  { bg: "#fff3e0", color: "#e65100", border: "#ffb74d", bar: "#ff9800" },
  "D":  { bg: "#fce4ec", color: "#880e4f", border: "#f48fb1", bar: "#e91e63" },
};

// ── Constants ────────────────────────────────────────────────────
const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QM = { Q1:["January","February","March"], Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };
const SC = { late:{bg:"#fff0f0",color:"#a32d2d",bd:"#f09595"}, ontime:{bg:"#e6f1fb",color:"#185fa5",bd:"#85b7eb"} };

function todayStr() { return new Date().toISOString().slice(0,10); }
function currentMonthName() { return MONTH_NAMES[new Date().getMonth()+1]; }
function currentQuarter() { const m=new Date().getMonth()+1; if(m<=3)return"Q1"; if(m<=6)return"Q2"; if(m<=9)return"Q3"; return"Q4"; }

function parseDate(raw) {
  if(!raw) return {date:"",month:""};
  raw=raw.trim();
  if(raw.includes(".")){const p=raw.split("."); if(p.length===3){const d=p[0].padStart(2,"0"),m=p[1].padStart(2,"0"),y=p[2].length===2?"20"+p[2]:p[2]; return{date:`${y}-${m}-${d}`,month:MONTH_NAMES[parseInt(m)]||""};}}
  if(raw.includes("-")){const p=raw.split("-"); if(p.length===3)return{date:raw,month:MONTH_NAMES[parseInt(p[1])]||""};}
  return{date:raw,month:""};
}
function parseMonth(raw) { if(!raw)return""; raw=raw.trim(); const n=parseInt(raw); if(!isNaN(n)&&n>=1&&n<=12)return MONTH_NAMES[n]; return raw; }
function parseDateTime(raw) {
  if(!raw)return{display:"00:00",totalMins:0}; raw=raw.trim();
  if(raw.includes(" ")){const si=raw.lastIndexOf(" "); const dp=raw.slice(0,si).trim().split("/"); let dayMins=0; if(dp.length===3){const d=new Date(parseInt(dp[2]),parseInt(dp[0])-1,parseInt(dp[1])); dayMins=Math.floor(d.getTime()/60000);} const tp=raw.slice(si+1).trim().split(":"); const th=parseInt(tp[0])||0,tm=parseInt(tp[1])||0; return{display:`${String(th).padStart(2,"0")}:${String(tm).padStart(2,"0")}`,totalMins:dayMins+th*60+tm};}
  const tp=raw.split(":"); const th=parseInt(tp[0])||0,tm=parseInt(tp[1])||0; return{display:`${String(th).padStart(2,"0")}:${String(tm).padStart(2,"0")}`,totalMins:th*60+tm};
}
function tdiff(s,r){if(s&&typeof s==="object"&&r&&typeof r==="object")return r.totalMins-s.totalMins; return 0;}
function fmtDiff(mins){
  if(mins===0)return{label:"On Time",type:"ontime"};
  const a=Math.abs(mins),h=Math.floor(a/60),m=a%60;
  const str=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  return mins>0?{label:`+${str} Late`,type:"late"}:{label:`On Time`,type:"ontime"};
}
function getCategory(branch, edition) {
  // 1. Check exact edition match first (highest priority)
  if(edition) {
    const edUpper = edition.trim().toUpperCase();
    for(const [key, cat] of Object.entries(EDITION_EXACT)){
      if(edUpper === key.toUpperCase()) return cat;
    }
  }
  // 2. Check branch match
  if(branch) {
    for(const [key, cat] of Object.entries(BRANCH_CATEGORY)){
      if(branch.toLowerCase().includes(key.toLowerCase())) return cat;
    }
  }
  return "—";
}

function parseCSVText(text) {
  const lines=text.split("\n").filter(Boolean); if(lines.length<2)return[];
  function parseLine(line){const vals=[];let cur="",inQ=false; for(let i=0;i<line.length;i++){const c=line[i]; if(c==='"'){inQ=!inQ;}else if(c===','&&!inQ){vals.push(cur.trim());cur="";}else cur+=c;} vals.push(cur.trim()); return vals;}
  const hdrs=parseLine(lines[0]).map(h=>h.toLowerCase().replace(/\s+/g,"").replace(/^"|"$/g,""));
  return lines.slice(1).map(ln=>{
    const vals=parseLine(ln).map(v=>v.replace(/^"|"$/g,""));
    const row={}; hdrs.forEach((h,i)=>row[h]=vals[i]||"");
    const{date:parsedDate,month:mfd}=parseDate(row["date"]||"");
    const parsedMonth=parseMonth(row["month"]||"")||mfd;
    const stRaw=row["scheduletime"]||row["schedule_time"]||row["scheduledtime"]||"";
    const rtRaw=row["releasetime"]||row["release_time"]||row["actualtime"]||"";
    const stObj=parseDateTime(stRaw),rtObj=parseDateTime(rtRaw);
    const branch=row["branch"]||"", edition=row["edition"]||"";
    return{
      month:parsedMonth,date:parsedDate,state:row["state"]||"",branch,edition,
      pullout:row["pullout"]||"—",st:stObj.display,rt:rtObj.display,stObj,rtObj,
      cause:row["delaycause"]||row["delay_cause"]||row["reason"]||row["delayreason"]||"",
      delayOntime:row["ontime-aspereho"]||row["ontimeaspereho"]||row["delayontime"]||row["delay/ontime"]||row["ontime"]||"",
      category:getCategory(branch,edition),
    };
  }).filter(r=>r.state&&r.edition);
}

// ── Login Screen ─────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    const user = USERS.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim());
    if (user) { onLogin(user); }
    else { setError("Invalid username or password. Please try again."); }
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a237e 0%,#185fa5 60%,#0288d1 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:20,padding:"40px 36px",maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        {/* Logo/Header */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:"linear-gradient(135deg,#1a237e,#185fa5)",borderRadius:16,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className="ti ti-news" style={{fontSize:32,color:"#fff"}}></i>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:"#1a237e",marginBottom:4}}>Edition Release Tracker</div>
          <div style={{fontSize:13,color:"#888"}}>Print Media Operations Dashboard</div>
        </div>

        {/* Form */}
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,fontWeight:600,color:"#555",display:"block",marginBottom:6}}>Username</label>
          <input
            type="text" value={username} onChange={e=>{setUsername(e.target.value);setError("");}}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            placeholder="Enter username"
            style={{width:"100%",padding:"10px 14px",border:"1.5px solid #e0e0e0",borderRadius:10,fontSize:14,outline:"none",transition:"border .2s"}}
          />
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,fontWeight:600,color:"#555",display:"block",marginBottom:6}}>Password</label>
          <div style={{position:"relative"}}>
            <input
              type={showPass?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="Enter password"
              style={{width:"100%",padding:"10px 14px",border:"1.5px solid #e0e0e0",borderRadius:10,fontSize:14,outline:"none",paddingRight:44}}
            />
            <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:16}}>
              <i className={`ti ${showPass?"ti-eye-off":"ti-eye"}`}></i>
            </button>
          </div>
        </div>

        {error && <div style={{background:"#fff0f0",border:"1px solid #f09595",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#a32d2d",marginBottom:16}}>{error}</div>}

        <button onClick={handleLogin}
          style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#1a237e,#185fa5)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",letterSpacing:"0.3px"}}>
          Sign In
        </button>

        {/* Hint */}
        <div style={{marginTop:20,padding:"12px 14px",background:"#f8f9fa",borderRadius:10,fontSize:11,color:"#888"}}>
          <div style={{fontWeight:600,marginBottom:6,color:"#555"}}>Available Logins:</div>
          {USERS.map(u=>(
            <div key={u.username} style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontWeight:500,color:"#333"}}>{u.username}</span>
              <span style={{color:"#aaa"}}>{u.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomRangePicker({from,to,onChange}){
  return(<span style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
    <label style={{fontSize:11,color:"#888"}}>From</label>
    <input type="date" value={from} onChange={e=>onChange(e.target.value,to)} style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6,background:"#fff"}}/>
    <label style={{fontSize:11,color:"#888"}}>To</label>
    <input type="date" value={to} onChange={e=>onChange(from,e.target.value)} style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6,background:"#fff"}}/>
  </span>);
}

// ── Notice Modal ─────────────────────────────────────────────────
function NoticeModal({record, onClose}){
  const [toEmail,setToEmail]=useState("");
  const [matter,setMatter]=useState(`Dear Sir/Ma'am,\n\nThis is to inform you that the edition "${record.edition}" (${record.branch}, ${record.state}) was delayed by ${fmtDiff(record.dm).label} on ${record.date}.\n\nScheduled Time: ${record.st}\nRelease Time: ${record.rt}\nDelay Cause: ${record.cause||"Not specified"}\n\nKindly take necessary action to avoid recurrence.\n\nRegards,\n${SENDER_EMAIL}`);
  const [status,setStatus]=useState("");
  const [sending,setSending]=useState(false);

  const sendEmail=async()=>{
    if(!toEmail){setStatus("Please enter recipient email.");return;}
    setSending(true); setStatus("");
    try{
      if(typeof emailjs==="undefined"){
        // Fallback: open mailto
        const subject=encodeURIComponent(`Notice: Edition Delay - ${record.edition} (${record.date})`);
        const body=encodeURIComponent(matter);
        window.open(`mailto:${toEmail}?subject=${subject}&body=${body}`);
        setStatus("✅ Mail client opened! Please send from there.");
      } else {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: toEmail, from_email: SENDER_EMAIL,
          subject: `Notice: Edition Delay - ${record.edition} (${record.date})`,
          message: matter,
        }, EMAILJS_PUBLIC_KEY);
        setStatus("✅ Notice sent successfully!");
      }
    }catch(e){setStatus("❌ Failed to send. Check EmailJS config.");}
    finally{setSending(false);}
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:14,padding:24,maxWidth:540,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:600,color:"#111"}}>📋 Send Notice</div>
            <div style={{fontSize:12,color:"#888",marginTop:2}}>{record.edition} · {record.branch} · {record.date}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888",lineHeight:1}}>×</button>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:500,color:"#555",display:"block",marginBottom:4}}>To Email (Incharge)</label>
          <input type="email" value={toEmail} onChange={e=>setToEmail(e.target.value)} placeholder="incharge@patrika.com"
            style={{width:"100%",padding:"8px 10px",border:"1px solid #d0d0d0",borderRadius:8,fontSize:13,outline:"none"}}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:500,color:"#555",display:"block",marginBottom:4}}>Notice Content</label>
          <textarea value={matter} onChange={e=>setMatter(e.target.value)} rows={10}
            style={{width:"100%",padding:"8px 10px",border:"1px solid #d0d0d0",borderRadius:8,fontSize:12,outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <button onClick={sendEmail} disabled={sending}
            style={{padding:"8px 20px",background:"#185fa5",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontWeight:500,opacity:sending?0.7:1}}>
            {sending?"Sending...":"📤 Send Notice"}
          </button>
          <button onClick={onClose} style={{padding:"8px 16px",background:"#f5f5f5",color:"#555",border:"1px solid #ddd",borderRadius:8,fontSize:13,cursor:"pointer"}}>Cancel</button>
          {status&&<span style={{fontSize:12,color:status.startsWith("✅")?"#3b6d11":"#a32d2d",fontWeight:500}}>{status}</span>}
        </div>
        <div style={{marginTop:10,fontSize:11,color:"#aaa"}}>From: {SENDER_EMAIL}</div>
      </div>
    </div>
  );
}

// ── Mini Bar Chart ───────────────────────────────────────────────
function MiniBar({value,max,color}){
  const pct=max>0?Math.round(value/max*100):0;
  return(<div style={{height:6,borderRadius:3,background:"#f0f0f0",overflow:"hidden",marginTop:4}}>
    <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width .4s"}}></div>
  </div>);
}

// ── Main App ─────────────────────────────────────────────────────
export default function App(){
  const [view,setView]=useState("daily");
  const [selState,setSelState]=useState("All");
  const [branch,setBranch]=useState("All");
  const [date,setDate]=useState(todayStr());
  const [month,setMonth]=useState(currentMonthName());
  const [qtr,setQtr]=useState(currentQuarter());
  const [useCustom,setUseCustom]=useState(false);
  const [customFrom,setCustomFrom]=useState(todayStr());
  const [customTo,setCustomTo]=useState(todayStr());
  const [sort,setSort]=useState("diff");
  const [fstat,setFstat]=useState("All");
  const [drill,setDrill]=useState(null);
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [lastSync,setLastSync]=useState(null);
  const [syncError,setSyncError]=useState(false);
  const [tab,setTab]=useState("overview");
  const [noticeRecord,setNoticeRecord]=useState(null);
  const [selectedCat,setSelectedCat]=useState(null);
  const [currentUser,setCurrentUser]=useState(null);

  const fetchSheet=useCallback(async()=>{
    setLoading(true); setSyncError(false);
    try{
      const res=await fetch(CSV_URL+"&cachebust="+Date.now());
      if(!res.ok)throw new Error("Fetch failed");
      const text=await res.text();
      const rows=parseCSVText(text);
      if(rows.length>0){setData(rows);setLastSync(new Date());}
    }catch{setSyncError(true);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{fetchSheet(); const iv=setInterval(fetchSheet,5*60*1000); return()=>clearInterval(iv);},[fetchSheet]);

  const states=useMemo(()=>["All",...new Set(data.map(d=>d.state))],[data]);
  const branches=useMemo(()=>{const b=userData.filter(d=>selState==="All"||d.state===selState); return["All",...new Set(b.map(d=>d.branch))];},[userData,selState]);

  const base=useMemo(()=>{
    let r=userData;
    if(useCustom&&view!=="daily"){r=r.filter(x=>x.date>=customFrom&&x.date<=customTo);}
    else{
      if(view==="daily")r=r.filter(x=>x.date===date);
      else if(view==="monthly")r=r.filter(x=>x.month===month);
      else if(view==="quarterly")r=r.filter(x=>QM[qtr].includes(x.month));
      else if(view==="halfyearly")r=r.filter(x=>["January","February","March","April","May","June"].includes(x.month));
    }
    if(selState!=="All")r=r.filter(x=>x.state===selState);
    if(branch!=="All")r=r.filter(x=>x.branch===branch);
    if(drill)r=r.filter(x=>x.state===drill);
    r=r.map(x=>{
      const rawDm=tdiff(x.stObj,x.rtObj);
      const markedOntime=x.delayOntime&&x.delayOntime.trim().toLowerCase().replace(/[\s\/\-_]/g,"").includes("ontime");
      const rawAfterMark=(view!=="daily"&&markedOntime)?0:rawDm;
      const dm=rawAfterMark<0?0:rawAfterMark;
      return{...x,dm,rawDm};
    });
    if(fstat==="Late")r=r.filter(x=>x.dm>0);
    else if(fstat==="OnTime")r=r.filter(x=>x.dm===0);
    if(sort==="diff")r=[...r].sort((a,b)=>b.dm-a.dm);
    else if(sort==="state")r=[...r].sort((a,b)=>a.state.localeCompare(b.state));
    else r=[...r].sort((a,b)=>a.branch.localeCompare(b.branch));
    return r;
  },[userData,view,date,month,qtr,useCustom,customFrom,customTo,selState,branch,drill,fstat,sort]);

  const kpi=useMemo(()=>{
    const late=base.filter(r=>r.dm>0);
    return{total:base.length,late:late.length,ontime:base.filter(r=>r.dm===0).length,
      avg:late.length?Math.round(late.reduce((s,r)=>s+r.dm,0)/late.length):0};
  },[base]);

  // Category stats
  const catStats=useMemo(()=>{
    const m={};
    CAT_ORDER.forEach(c=>m[c]={cat:c,total:0,late:0,ontime:0,totalDelay:0});
    base.forEach(r=>{
      const c=r.category; if(!m[c])m[c]={cat:c,total:0,late:0,ontime:0,totalDelay:0};
      m[c].total++; if(r.dm>0){m[c].late++;m[c].totalDelay+=r.dm;}else m[c].ontime++;
    });
    return CAT_ORDER.filter(c=>m[c]&&m[c].total>0).map(c=>({
      ...m[c],
      delayRate:m[c].total>0?Math.round(m[c].late/m[c].total*100):0,
      avgDelay:m[c].late>0?Math.round(m[c].totalDelay/m[c].late):0,
    }));
  },[base]);

  const stStats=useMemo(()=>{
    const m={};
    base.forEach(r=>{
      if(!m[r.state])m[r.state]={state:r.state,total:0,late:0,ontime:0};
      m[r.state].total++; if(r.dm>0)m[r.state].late++; else m[r.state].ontime++;
    });
    return Object.values(m).sort((a,b)=>b.late-a.late);
  },[base]);

  const groupedLate=useMemo(()=>{
    const map={};
    base.filter(r=>r.dm>0).forEach(r=>{
      const key=`${r.state}||${r.branch}||${r.edition}`;
      if(!map[key])map[key]={state:r.state,branch:r.branch,edition:r.edition,totalDm:0,count:0,causes:{}};
      map[key].totalDm+=r.dm; map[key].count+=1;
      if(r.cause)map[key].causes[r.cause]=(map[key].causes[r.cause]||0)+1;
    });
    return Object.values(map).map(g=>({...g,avgDm:Math.round(g.totalDm/g.count),
      topCause:Object.entries(g.causes).sort((a,b)=>b[1]-a[1])[0]?.[0]||""}))
      .sort((a,b)=>b.avgDm-a.avgDm).slice(0,10);
  },[base]);

  const groupedOntime=useMemo(()=>{
    const map={};
    base.forEach(r=>{
      const key=`${r.state}||${r.branch}||${r.edition}`;
      if(!map[key])map[key]={state:r.state,branch:r.branch,edition:r.edition,total:0,ontime:0};
      map[key].total+=1; if(r.dm===0)map[key].ontime+=1;
    });
    return Object.values(map).filter(g=>g.ontime>0)
      .map(g=>({...g,ontimePct:Math.round(g.ontime/g.total*100)}))
      .sort((a,b)=>b.ontimePct-a.ontimePct||b.ontime-a.ontime).slice(0,10);
  },[base]);

  const causes=useMemo(()=>{
    const m={};
    base.filter(r=>r.dm>0&&r.cause).forEach(r=>{m[r.cause]=(m[r.cause]||0)+1;});
    const t=Object.values(m).reduce((s,v)=>s+v,0);
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([c,n])=>({c,n,pct:t?Math.round(n/t*100):0}));
  },[base]);

  const exportCSV=()=>{
    const h="Month,Date,State,Branch,Edition,Category,Pullout,Scheduled,Released,Delay/On Time,EHO Remark,Reason";
    const rows=base.map(r=>{const d=fmtDiff(r.dm); return[r.month,r.date,r.state,r.branch,r.edition,r.category,r.pullout,r.st,r.rt,d.label,r.delayOntime,r.cause].join(",");});
    const b=new Blob([[h,...rows].join("\n")],{type:"text/csv"});
    const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="edition_report.csv"; a.click();
  };

  const Pill=({label,active,onClick})=>(
    <button onClick={onClick} style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${active?"#185fa5":"#d0d0d0"}`,background:active?"#185fa5":"transparent",color:active?"#fff":"#666",fontWeight:active?500:400,fontSize:12,cursor:"pointer"}}>{label}</button>
  );

  const maxLate=Math.max(...catStats.map(c=>c.late),1);

  // Show login screen if not authenticated
  if(!currentUser){return <LoginScreen onLogin={(user)=>setCurrentUser(user)}/>;}

  if(loading&&data.length===0){return(
    <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{width:44,height:44,border:"3px solid #e0e0e0",borderTop:"3px solid #185fa5",borderRadius:"50%",margin:"0 auto 16px",animation:"spin 1s linear infinite"}}></div>
        <div style={{fontSize:15,fontWeight:500,color:"#555",marginBottom:6}}>Loading data from Google Sheet...</div>
        <div style={{fontSize:12,color:"#aaa"}}>This may take a moment on first load</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );}

  return(
    <div style={{minHeight:"100vh",background:"#f0f4f8",padding:"16px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} * {box-sizing:border-box;} body{margin:0;font-family:system-ui,sans-serif;}`}</style>
      {noticeRecord&&<NoticeModal record={noticeRecord} onClose={()=>setNoticeRecord(null)}/>}

      <div style={{maxWidth:1100,margin:"0 auto"}}>

        {/* ── TOP HEADER ── */}
        <div style={{background:"linear-gradient(135deg,#1a237e 0%,#185fa5 60%,#0288d1 100%)",borderRadius:16,padding:"20px 28px",marginBottom:16,color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <i className="ti ti-news" style={{fontSize:26}}></i>
              <span style={{fontSize:22,fontWeight:700,letterSpacing:"-0.5px"}}>Edition Release Tracker</span>
              <span style={{background:"rgba(255,255,255,0.2)",fontSize:10,padding:"2px 10px",borderRadius:10,fontWeight:600,backdropFilter:"blur(4px)"}}>LIVE</span>
            </div>
            <div style={{fontSize:12,opacity:.8,display:"flex",gap:12,flexWrap:"wrap"}}>
              <span>📊 {userData.length.toLocaleString()} records{currentUser.role!=="admin"?` · ${currentUser.label}`:""}</span>
              {lastSync&&<span>🔄 Last sync: {lastSync.toLocaleTimeString()}</span>}
              {syncError&&<span style={{color:"#ffcdd2"}}>⚠️ Sync error</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(255,255,255,0.15)",borderRadius:8,backdropFilter:"blur(4px)"}}>
              <i className="ti ti-user-circle" style={{fontSize:16,color:"#fff"}}></i>
              <span style={{fontSize:12,color:"#fff",fontWeight:500}}>{currentUser.label}</span>
              {currentUser.role==="admin"&&<span style={{fontSize:9,background:"#ffd54f",color:"#333",padding:"1px 6px",borderRadius:6,fontWeight:700,marginLeft:2}}>ADMIN</span>}
            </div>
            <button onClick={fetchSheet} disabled={loading} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:12,cursor:"pointer",backdropFilter:"blur(4px)"}}>
              <i className="ti ti-refresh" style={{fontSize:14,animation:loading?"spin 1s linear infinite":"none"}}></i> {loading?"Refreshing...":"Refresh"}
            </button>
            {currentUser.role==="admin"&&<a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noreferrer"
              style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:12,textDecoration:"none",backdropFilter:"blur(4px)"}}>
              <i className="ti ti-table" style={{fontSize:14}}></i> Edit Sheet
            </a>}
            <button onClick={exportCSV} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:12,cursor:"pointer",backdropFilter:"blur(4px)"}}>
              <i className="ti ti-download" style={{fontSize:14}}></i> Export
            </button>
            <button onClick={()=>{setCurrentUser(null);setDrill(null);setSelectedCat(null);}} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.9)",fontSize:12,cursor:"pointer",backdropFilter:"blur(4px)"}}>
              <i className="ti ti-logout" style={{fontSize:14}}></i> Logout
            </button>
          </div>
        </div>

        {/* ── VIEW + FILTERS ── */}
        <div style={{background:"#fff",borderRadius:12,padding:"14px 20px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
          <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            {[["daily","Daily"],["monthly","Monthly"],["quarterly","Quarterly"],["halfyearly","Half-Yearly"],["yearly","Yearly"]].map(([k,l])=>(
              <Pill key={k} label={l} active={view===k} onClick={()=>{setView(k);setDrill(null);setUseCustom(false);}}/>
            ))}
            {view!=="daily"&&(
              <button onClick={()=>setUseCustom(p=>!p)}
                style={{marginLeft:6,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${useCustom?"#854f0b":"#d0d0d0"}`,background:useCustom?"#faeeda":"transparent",color:useCustom?"#854f0b":"#888",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                <i className="ti ti-calendar-event" style={{fontSize:13}}></i>{useCustom?"Custom ✓":"Custom Range"}
              </button>
            )}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <i className="ti ti-adjustments-horizontal" style={{fontSize:15,color:"#aaa"}}></i>
            {view==="daily"&&<span style={{display:"flex",alignItems:"center",gap:5}}><label style={{fontSize:11,color:"#888"}}>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6}}/></span>}
            {view==="monthly"&&!useCustom&&<span style={{display:"flex",alignItems:"center",gap:5}}><label style={{fontSize:11,color:"#888"}}>Month</label><select value={month} onChange={e=>setMonth(e.target.value)} style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6}}>{MONTHS.map(m=><option key={m}>{m}</option>)}</select></span>}
            {view==="quarterly"&&!useCustom&&<span style={{display:"flex",alignItems:"center",gap:5}}><label style={{fontSize:11,color:"#888"}}>Quarter</label><select value={qtr} onChange={e=>setQtr(e.target.value)} style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6}}>{["Q1","Q2","Q3","Q4"].map(q=><option key={q}>{q}</option>)}</select></span>}
            {useCustom&&view!=="daily"&&<CustomRangePicker from={customFrom} to={customTo} onChange={(f,t)=>{setCustomFrom(f);setCustomTo(t);}}/>}
            {[
              {lbl:"State",val:selState,opts:states,set:(v)=>{setSelState(v);setBranch("All");setDrill(null);}},
              {lbl:"Branch",val:branch,opts:branches,set:setBranch},
              {lbl:"Status",val:fstat,opts:["All","Late","OnTime"],set:setFstat},
            ].map(f=>(
              <span key={f.lbl} style={{display:"flex",alignItems:"center",gap:5}}>
                <label style={{fontSize:11,color:"#888"}}>{f.lbl}</label>
                <select value={f.val} onChange={e=>f.set(e.target.value)} style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6}}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </span>
            ))}
            <span style={{display:"flex",alignItems:"center",gap:5}}>
              <label style={{fontSize:11,color:"#888"}}>Sort</label>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6}}>
                <option value="diff">By Delay ↕</option>
                <option value="state">By State</option>
                <option value="branch">By Branch</option>
              </select>
            </span>
            {drill&&<button onClick={()=>setDrill(null)} style={{marginLeft:"auto",fontSize:11,padding:"4px 9px",border:"1px solid #ccc",borderRadius:6,background:"#fff",color:"#888",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><i className="ti ti-x" style={{fontSize:12}}></i> {drill}</button>}
          </div>
        </div>

        {data.length===0&&!loading&&(
          <div style={{background:"#fff",borderRadius:12,padding:"48px 20px",textAlign:"center",color:"#aaa",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
            <i className="ti ti-table-off" style={{fontSize:52,display:"block",marginBottom:12}}></i>
            <div style={{fontSize:16,fontWeight:500,marginBottom:8,color:"#888"}}>No Data in Google Sheet</div>
            <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noreferrer"
              style={{padding:"9px 22px",background:"#185fa5",color:"#fff",borderRadius:8,fontSize:13,textDecoration:"none",display:"inline-block"}}>Open Google Sheet</a>
          </div>
        )}

        {data.length>0&&(<>

          {/* ── KPI CARDS ── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
            {[
              {l:"Total Editions",v:kpi.total,ic:"ti-layout-grid",bg:"linear-gradient(135deg,#1a237e,#283593)",c:"#fff"},
              {l:"Late Editions",v:kpi.late,ic:"ti-clock-exclamation",bg:"linear-gradient(135deg,#b71c1c,#c62828)",c:"#fff"},
              {l:"On Time",v:kpi.ontime,ic:"ti-circle-check",bg:"linear-gradient(135deg,#1b5e20,#2e7d32)",c:"#fff"},
              {l:"Avg Delay",v:(()=>{const h=Math.floor(kpi.avg/60),m=kpi.avg%60; return`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;})(),ic:"ti-trending-up",bg:"linear-gradient(135deg,#e65100,#f57c00)",c:"#fff"},
            ].map(k=>(
              <div key={k.l} style={{background:k.bg,borderRadius:12,padding:"16px 18px",boxShadow:"0 2px 8px rgba(0,0,0,.15)"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <i className={`ti ${k.ic}`} style={{fontSize:16,color:"rgba(255,255,255,0.8)"}}></i>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:500}}>{k.l}</span>
                </div>
                <div style={{fontSize:28,fontWeight:700,color:k.c,letterSpacing:"-1px"}}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* ── SECTION TABS ── */}
          <div style={{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,.06)",overflow:"hidden"}}>
            <div style={{display:"flex",borderBottom:"1px solid #eee",overflowX:"auto"}}>
              {[["overview","📊 Overview"],["report","📋 Full Report"],["states","🗺️ State Overview"],["top10","🏆 Top 10 Lists"],["causes","🔍 Delay Analysis"]].map(([k,l])=>(
                <button key={k} onClick={()=>setTab(k)} style={{padding:"12px 18px",fontSize:12,border:"none",background:"transparent",cursor:"pointer",color:tab===k?"#185fa5":"#888",borderBottom:tab===k?"3px solid #185fa5":"3px solid transparent",fontWeight:tab===k?600:400,whiteSpace:"nowrap"}}>{l}</button>
              ))}
            </div>

            <div style={{padding:"20px 24px"}}>

            {/* ── TAB: OVERVIEW ── */}
            {tab==="overview"&&(<div>
              {/* Category Analysis */}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:15,fontWeight:600,color:"#111",marginBottom:4}}>Category-wise Performance Analysis</div>
                <div style={{fontSize:12,color:"#888",marginBottom:16}}>Click on any category card to see all editions in that category — sorted by highest delay first</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:16}}>
                  {catStats.map(c=>{
                    const col=CAT_COLORS[c.cat]||CAT_COLORS["D"];
                    const h=Math.floor(c.avgDelay/60),m=c.avgDelay%60;
                    const isSelected=selectedCat===c.cat;
                    return(
                      <button key={c.cat} onClick={()=>setSelectedCat(isSelected?null:c.cat)}
                        style={{background:col.bg,border:`${isSelected?"3px":"1.5px"} solid ${isSelected?col.color:col.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left",boxShadow:isSelected?`0 4px 16px ${col.bar}44`:"none",transition:"all .2s"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:22,fontWeight:800,color:col.color}}>{c.cat}</span>
                          <span style={{fontSize:10,background:col.color,color:"#fff",padding:"2px 8px",borderRadius:20,fontWeight:600}}>{c.delayRate}% delay</span>
                        </div>
                        <div style={{fontSize:12,color:"#555",marginBottom:2}}><b style={{color:"#111"}}>{c.total}</b> editions total</div>
                        <div style={{fontSize:12,color:"#a32d2d",marginBottom:2}}><b>{c.late}</b> late</div>
                        <div style={{fontSize:12,color:"#1b5e20",marginBottom:8}}><b>{c.ontime}</b> on time</div>
                        <MiniBar value={c.late} max={maxLate} color={col.bar}/>
                        {c.avgDelay>0&&<div style={{fontSize:11,color:col.color,marginTop:6,fontWeight:500}}>Avg delay: {h>0?`${h}h ${m}m`:`${m}m`}</div>}
                        {isSelected&&<div style={{fontSize:10,color:col.color,marginTop:4,fontWeight:600}}>▼ Click to collapse</div>}
                      </button>
                    );
                  })}
                </div>

                {/* Category Drill-down Table */}
                {selectedCat&&(()=>{
                  const col=CAT_COLORS[selectedCat]||CAT_COLORS["D"];
                  const catEditions=[...base].filter(r=>r.category===selectedCat).sort((a,b)=>b.dm-a.dm);
                  // Group by state, within each group sort by delay desc
                  const STATE_ORDER=["Rajasthan","Raj","MP","Madhya Pradesh","CG","Chhattisgarh","Metro"];
                  const grouped={};
                  catEditions.forEach(r=>{
                    const s=r.state||"Other";
                    if(!grouped[s])grouped[s]=[];
                    grouped[s].push(r);
                  });
                  // Sort state groups: Raj first, then MP, CG, Metro, others
                  const stateOrder=["Rajasthan","Raj","Madhya Pradesh","MP","Chhattisgarh","CG","Metro"];
                  const sortedStates=Object.keys(grouped).sort((a,b)=>{
                    const ai=stateOrder.findIndex(s=>a.toLowerCase().includes(s.toLowerCase()));
                    const bi=stateOrder.findIndex(s=>b.toLowerCase().includes(s.toLowerCase()));
                    const an=ai===-1?99:ai, bn=bi===-1?99:bi;
                    return an-bn;
                  });
                  let globalIdx=0;
                  return(
                    <div style={{border:`2px solid ${col.border}`,borderRadius:12,padding:16,background:col.bg,marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                        <div>
                          <span style={{fontSize:14,fontWeight:700,color:col.color}}>Category {selectedCat} — All Editions</span>
                          <span style={{fontSize:12,color:"#888",marginLeft:10}}>{catEditions.length} editions · grouped by state · sorted by delay</span>
                        </div>
                        <button onClick={()=>setSelectedCat(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#888",lineHeight:1}}>×</button>
                      </div>
                      {sortedStates.map(stateName=>{
                        const stateEditions=grouped[stateName];
                        return(
                          <div key={stateName} style={{marginBottom:16}}>
                            <div style={{fontSize:13,fontWeight:700,color:col.color,padding:"6px 12px",background:`${col.border}44`,borderRadius:8,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                              <i className="ti ti-map-pin" style={{fontSize:13}}></i> {stateName}
                              <span style={{fontSize:11,fontWeight:400,color:"#666"}}>({stateEditions.length} editions)</span>
                            </div>
                            <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #eee",background:"#fff"}}>
                              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                                <thead>
                                  <tr style={{background:"#f8f9fa"}}>
                                    {["#","Branch","Edition","Scheduled","Released","Delay/On Time","EHO Remark","Reason","Notice"].map(h=>(
                                      <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#555",borderBottom:"2px solid #eee",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {stateEditions.map((r,i)=>{
                                    globalIdx++;
                                    const d=fmtDiff(r.dm); const sc=SC[d.type];
                                    return(
                                      <tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:i%2?"#fafafa":"#fff"}}>
                                        <td style={{padding:"7px 10px",fontWeight:600,color:col.color,fontSize:11}}>#{globalIdx}</td>
                                        <td style={{padding:"7px 10px",color:"#555"}}>{r.branch}</td>
                                        <td style={{padding:"7px 10px",fontWeight:500}}>{r.edition}</td>
                                        <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11}}>{r.st}</td>
                                        <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11}}>{r.rt}</td>
                                        <td style={{padding:"7px 10px"}}>
                                          <span style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.bd}`,borderRadius:8,fontSize:10,padding:"3px 8px",fontWeight:600,whiteSpace:"nowrap"}}>{d.label}</span>
                                        </td>
                                        <td style={{padding:"7px 10px",fontSize:11}}>
                                          {(()=>{const val=(r.delayOntime||"").trim().toLowerCase().replace(/[\s\/\-_]/g,""); return val.includes("ontime")?<span style={{background:"#e6f1fb",color:"#185fa5",padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:500}}>On Time</span>:<span style={{color:"#ccc"}}>—</span>;})()}
                                        </td>
                                        <td style={{padding:"7px 10px",color:r.cause?"#854f0b":"#ccc",fontSize:11,maxWidth:200,wordBreak:"break-word",whiteSpace:"pre-wrap",lineHeight:1.4}}>{r.cause||"—"}</td>
                                        <td style={{padding:"7px 10px"}}>
                                          {r.dm>0&&<button onClick={()=>setNoticeRecord(r)}
                                            style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",background:"#fff3e0",border:"1px solid #ffb74d",borderRadius:6,color:"#e65100",fontSize:10,cursor:"pointer",fontWeight:500,whiteSpace:"nowrap"}}>
                                            <i className="ti ti-send" style={{fontSize:11}}></i> Notice
                                          </button>}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Director Summary */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
                {/* State Performance */}
                <div style={{border:"1px solid #eee",borderRadius:12,padding:16}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:12,color:"#111"}}>🗺️ State Performance</div>
                  {stStats.slice(0,6).map(s=>(
                    <div key={s.state} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:500}}>{s.state}</span>
                        <span style={{fontSize:11,color:"#a32d2d"}}>{s.late} late / {s.total}</span>
                      </div>
                      <div style={{height:5,borderRadius:3,background:"#f0f0f0",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.round(s.late/s.total*100)}%`,background:s.late/s.total>0.5?"#c62828":s.late/s.total>0.3?"#ef6c00":"#43a047",borderRadius:3}}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Delay Causes */}
                <div style={{border:"1px solid #eee",borderRadius:12,padding:16}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:12,color:"#111"}}>🔍 Top Delay Causes</div>
                  {causes.slice(0,6).map(({c,n,pct})=>(
                    <div key={c} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{c}</span>
                        <span style={{fontSize:11,color:"#a32d2d"}}>{n}x ({pct}%)</span>
                      </div>
                      <div style={{height:5,borderRadius:3,background:"#f0f0f0",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:"#e53935",borderRadius:3}}></div>
                      </div>
                    </div>
                  ))}
                  {causes.length===0&&<div style={{fontSize:12,color:"#aaa"}}>No delay causes recorded</div>}
                </div>
              </div>

              {/* Late % by Category — visual bar */}
              <div style={{border:"1px solid #eee",borderRadius:12,padding:16}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:4,color:"#111"}}>📈 Delay Rate by Category</div>
                <div style={{fontSize:12,color:"#888",marginBottom:16}}>% of editions that were late, grouped by category</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:12,height:120,padding:"0 8px"}}>
                  {catStats.map(c=>{
                    const col=CAT_COLORS[c.cat]||CAT_COLORS["D"];
                    return(
                      <div key={c.cat} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{fontSize:11,fontWeight:600,color:col.color}}>{c.delayRate}%</div>
                        <div style={{width:"100%",background:col.bar,borderRadius:"6px 6px 0 0",height:`${c.delayRate}%`,minHeight:4,transition:"height .4s"}}></div>
                        <div style={{fontSize:12,fontWeight:700,color:col.color}}>{c.cat}</div>
                        <div style={{fontSize:10,color:"#aaa"}}>{c.total} ed.</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>)}

            {/* ── TAB: FULL REPORT ── */}
            {tab==="report"&&(
              <div>
                <div style={{fontSize:12,color:"#888",marginBottom:10}}>
                  {drill?`Drill-down: ${drill} — `:""}Showing {base.length} editions
                  {useCustom&&view!=="daily"&&<span style={{marginLeft:8,color:"#854f0b"}}>({customFrom} → {customTo})</span>}
                </div>
                <div style={{overflowX:"auto",border:"1px solid #eee",borderRadius:10}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:900}}>
                    <thead>
                      <tr style={{background:"#f8f9fa"}}>
                        {["State","Branch","Edition","Cat.","Pullout","Scheduled","Released","Delay/On Time","EHO Remark","Reason","Notice"].map(h=>(
                          <th key={h} style={{padding:"9px 10px",textAlign:"left",fontWeight:600,color:"#555",borderBottom:"2px solid #eee",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {base.length===0&&<tr><td colSpan={11} style={{padding:24,textAlign:"center",color:"#aaa"}}>No data for this selection.</td></tr>}
                      {base.map((r,i)=>{
                        const d=fmtDiff(r.dm); const sc=SC[d.type];
                        const col=CAT_COLORS[r.category];
                        const isOntime=(r.delayOntime||"").trim().toLowerCase().replace(/[\s\/\-_]/g,"").includes("ontime");
                        return(
                          <tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:i%2?"#fafafa":"#fff"}}>
                            <td style={{padding:"7px 10px",fontWeight:500}}>{r.state}</td>
                            <td style={{padding:"7px 10px",color:"#555"}}>{r.branch}</td>
                            <td style={{padding:"7px 10px"}}>{r.edition}</td>
                            <td style={{padding:"7px 10px"}}>
                              {col?<span style={{background:col.bg,color:col.color,border:`1px solid ${col.border}`,borderRadius:6,fontSize:10,padding:"2px 6px",fontWeight:700}}>{r.category}</span>:<span style={{color:"#ccc",fontSize:11}}>—</span>}
                            </td>
                            <td style={{padding:"7px 10px",color:"#888",fontSize:11}}>{r.pullout}</td>
                            <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11,color:"#555"}}>{r.st}</td>
                            <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11,color:"#555"}}>{r.rt}</td>
                            <td style={{padding:"7px 10px"}}>
                              <span style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.bd}`,borderRadius:8,fontSize:10,padding:"3px 8px",fontWeight:600,whiteSpace:"nowrap"}}>{d.label}</span>
                            </td>
                            <td style={{padding:"7px 10px",fontSize:11}}>
                              {isOntime?<span style={{background:"#e6f1fb",color:"#185fa5",padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:500}}>On Time</span>:<span style={{color:"#ccc"}}>—</span>}
                            </td>
                            <td style={{padding:"7px 10px",color:r.cause?"#854f0b":"#ccc",fontSize:11,maxWidth:220,wordBreak:"break-word",whiteSpace:"pre-wrap",lineHeight:1.4}}>{r.cause||"—"}</td>
                            <td style={{padding:"7px 10px"}}>
                              {r.dm>0&&<button onClick={()=>setNoticeRecord(r)}
                                style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",background:"#fff3e0",border:"1px solid #ffb74d",borderRadius:6,color:"#e65100",fontSize:10,cursor:"pointer",fontWeight:500,whiteSpace:"nowrap"}}>
                                <i className="ti ti-send" style={{fontSize:11}}></i> Notice
                              </button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB: STATE OVERVIEW ── */}
            {tab==="states"&&(
              <div>
                <div style={{fontSize:12,color:"#888",marginBottom:12}}>Click on a state card to drill down into its editions</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                  {stStats.map(s=>(
                    <button key={s.state} onClick={()=>{setDrill(s.state);setTab("report");}} style={{background:"#fff",border:`1.5px solid ${s.late>0?"#f09595":"#e0e0e0"}`,borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"left",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
                      <div style={{fontWeight:600,fontSize:14,marginBottom:6}}>{s.state}</div>
                      <div style={{fontSize:12,color:"#888",marginBottom:8}}>{s.total} editions</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                        <span style={{fontSize:10,background:"#fff0f0",color:"#a32d2d",padding:"2px 8px",borderRadius:20,fontWeight:500}}>{s.late} late</span>
                        <span style={{fontSize:10,background:"#e6f1fb",color:"#185fa5",padding:"2px 8px",borderRadius:20,fontWeight:500}}>{s.ontime} on-time</span>
                      </div>
                      <div style={{height:5,borderRadius:3,background:"#f0f0f0",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.round(s.late/s.total*100)}%`,background:s.late/s.total>0.5?"#c62828":s.late/s.total>0.3?"#ef6c00":"#43a047",borderRadius:3}}></div>
                      </div>
                      <div style={{marginTop:4,fontSize:11,color:"#aaa"}}>{Math.round(s.late/s.total*100)}% delay rate</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: TOP 10 ── */}
            {tab==="top10"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{border:"1.5px solid #f09595",borderRadius:12,padding:16}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#a32d2d",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                    <i className="ti ti-alert-triangle" style={{fontSize:16}}></i> Top 10 Late Editions
                  </div>
                  <div style={{fontSize:11,color:"#aaa",marginBottom:14}}>Avg delay · High → Low (HH:MM)</div>
                  {groupedLate.length===0&&<div style={{fontSize:12,color:"#aaa"}}>No late editions</div>}
                  {groupedLate.map((r,i)=>{
                    const h=Math.floor(r.avgDm/60),m=r.avgDm%60;
                    return(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:10,borderBottom:i<groupedLate.length-1?"1px solid #fef0f0":"none"}}>
                        <span style={{fontSize:13,fontWeight:700,color:"#a32d2d",minWidth:26,textAlign:"right"}}>#{i+1}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.branch} — {r.edition}</div>
                          <div style={{fontSize:11,color:"#888"}}>{r.state}{r.topCause?" · "+r.topCause:""}</div>
                          <div style={{fontSize:10,color:"#bbb"}}>{r.count} days of data</div>
                        </div>
                        <span style={{fontSize:11,background:"#fff0f0",color:"#a32d2d",padding:"3px 9px",borderRadius:8,fontWeight:700,whiteSpace:"nowrap"}}>+{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{border:"1.5px solid #85b7eb",borderRadius:12,padding:16}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#185fa5",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                    <i className="ti ti-circle-check" style={{fontSize:16}}></i> Top 10 On Time Editions
                  </div>
                  <div style={{fontSize:11,color:"#aaa",marginBottom:14}}>Most consistently on time · High % first</div>
                  {groupedOntime.length===0&&<div style={{fontSize:12,color:"#aaa"}}>No on-time editions</div>}
                  {groupedOntime.map((r,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:10,borderBottom:i<groupedOntime.length-1?"1px solid #e6f1fb":"none"}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#185fa5",minWidth:26,textAlign:"right"}}>#{i+1}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.branch} — {r.edition}</div>
                        <div style={{fontSize:11,color:"#888"}}>{r.state}</div>
                        <div style={{fontSize:10,color:"#bbb"}}>{r.ontime}/{r.total} days on time</div>
                      </div>
                      <span style={{fontSize:11,background:"#e6f1fb",color:"#185fa5",padding:"3px 9px",borderRadius:8,fontWeight:700,whiteSpace:"nowrap"}}>{r.ontimePct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: DELAY ANALYSIS ── */}
            {tab==="causes"&&(
              <div>
                <div style={{fontSize:12,color:"#888",marginBottom:16}}>Delay cause breakdown for current filter selection</div>
                {causes.length===0&&<div style={{fontSize:12,color:"#aaa"}}>No delay causes recorded for this selection.</div>}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {causes.map(({c,n,pct})=>(
                    <div key={c} style={{background:"#fafafa",border:"1px solid #eee",borderRadius:10,padding:"12px 16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:13,fontWeight:500}}>{c}</span>
                        <span style={{fontSize:12,color:"#a32d2d",fontWeight:600}}>{n} times ({pct}%)</span>
                      </div>
                      <div style={{height:6,borderRadius:3,background:"#eee",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:"#e53935",borderRadius:3}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </div>
          </div>

          <div style={{marginTop:16,fontSize:11,color:"#aaa",textAlign:"center"}}>
            Print Media Operations · Edition Release Tracker · {userData.length.toLocaleString()} records · Powered by Google Sheets
          </div>
        </>)}
      </div>
    </div>
  );
}

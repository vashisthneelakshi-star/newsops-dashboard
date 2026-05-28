import { useState, useMemo, useEffect, useCallback } from "react";

const SHEET_ID = "1Iv3T-ah2Ed2euConb8_cxgF4nyX-BuXmbqoYM1F5zFQ";
const SHEET_NAME = "Sheet1";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QM = {
  Q1: ["January","February","March"],
  Q2: ["April","May","June"],
  Q3: ["July","August","September"],
  Q4: ["October","November","December"],
};
const SC = {
  late:   { bg: "#fff0f0", color: "#a32d2d", bd: "#f09595" },
  ontime: { bg: "#e6f1fb", color: "#185fa5", bd: "#85b7eb" },
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function currentMonthName() { return MONTH_NAMES[new Date().getMonth() + 1]; }
function currentQuarter() {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return "Q1"; if (m <= 6) return "Q2"; if (m <= 9) return "Q3"; return "Q4";
}

function parseDate(raw) {
  if (!raw) return { date: "", month: "" };
  raw = raw.trim();
  if (raw.includes(".")) {
    const p = raw.split(".");
    if (p.length === 3) {
      const d = p[0].padStart(2,"0"), m = p[1].padStart(2,"0");
      const y = p[2].length === 2 ? "20"+p[2] : p[2];
      return { date:`${y}-${m}-${d}`, month: MONTH_NAMES[parseInt(m)]||"" };
    }
  }
  if (raw.includes("-")) {
    const p = raw.split("-");
    if (p.length === 3) return { date: raw, month: MONTH_NAMES[parseInt(p[1])]||"" };
  }
  return { date: raw, month: "" };
}

function parseMonth(raw) {
  if (!raw) return "";
  raw = raw.trim();
  const n = parseInt(raw);
  if (!isNaN(n) && n >= 1 && n <= 12) return MONTH_NAMES[n];
  return raw;
}

function parseDateTime(raw) {
  if (!raw) return { display:"00:00", totalMins:0 };
  raw = raw.trim();
  if (raw.includes(" ")) {
    const si = raw.lastIndexOf(" ");
    const dp = raw.slice(0, si).trim().split("/");
    let dayMins = 0;
    if (dp.length === 3) {
      const d = new Date(parseInt(dp[2]), parseInt(dp[0])-1, parseInt(dp[1]));
      dayMins = Math.floor(d.getTime()/60000);
    }
    const tp = raw.slice(si+1).trim().split(":");
    const th = parseInt(tp[0])||0, tm = parseInt(tp[1])||0;
    return { display:`${String(th).padStart(2,"0")}:${String(tm).padStart(2,"0")}`, totalMins: dayMins+th*60+tm };
  }
  const tp = raw.split(":");
  const th = parseInt(tp[0])||0, tm = parseInt(tp[1])||0;
  return { display:`${String(th).padStart(2,"0")}:${String(tm).padStart(2,"0")}`, totalMins: th*60+tm };
}

function tdiff(s, r) {
  if (s && typeof s==="object" && r && typeof r==="object") return r.totalMins - s.totalMins;
  return 0;
}

// FIX 1: Always format as HH:MM (not raw minutes)
function fmtDiff(mins) {
  if (mins === 0) return { label: "On Time", type: "ontime" };
  const a = Math.abs(mins);
  const h = Math.floor(a / 60);
  const m = a % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const str = `${hh}:${mm}`;
  return mins > 0
    ? { label: `+${str} Late`, type: "late" }
    : { label: `-${str} Early`, type: "ontime" }; // FIX 3: Early = On Time
}

function parseCSVText(text) {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  function parseLine(line) {
    const vals = []; let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = ""; }
      else cur += c;
    }
    vals.push(cur.trim());
    return vals;
  }
  const hdrs = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g,"").replace(/^"|"$/g,""));
  return lines.slice(1).map(ln => {
    const vals = parseLine(ln).map(v => v.replace(/^"|"$/g,""));
    const row = {}; hdrs.forEach((h,i) => row[h] = vals[i]||"");
    const { date: parsedDate, month: mfd } = parseDate(row["date"]||"");
    const parsedMonth = parseMonth(row["month"]||"") || mfd;
    const stRaw = row["scheduletime"]||row["schedule_time"]||row["scheduledtime"]||"";
    const rtRaw = row["releasetime"]||row["release_time"]||row["actualtime"]||"";
    const stObj = parseDateTime(stRaw), rtObj = parseDateTime(rtRaw);
    return {
      month: parsedMonth, date: parsedDate,
      state: row["state"]||"", branch: row["branch"]||"",
      edition: row["edition"]||"", pullout: row["pullout"]||"—",
      st: stObj.display, rt: rtObj.display, stObj, rtObj,
      cause: row["delaycause"]||row["delay_cause"]||row["reason"]||row["delayreason"]||"",
      delayOntime: row["ontime-aspereho"]||row["ontimeaspereho"]||row["delayontime"]||row["delay/ontime"]||row["delayorontime"]||row["ontime"]||"",
    };
  }).filter(r => r.state && r.edition);
}

function CustomRangePicker({ from, to, onChange }) {
  return (
    <span style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
      <label style={{ fontSize:11, color:"#888" }}>From</label>
      <input type="date" value={from} onChange={e=>onChange(e.target.value,to)}
        style={{ fontSize:12, padding:"4px 7px", border:"1px solid #d0d0d0", borderRadius:6, background:"#fff" }}/>
      <label style={{ fontSize:11, color:"#888" }}>To</label>
      <input type="date" value={to} onChange={e=>onChange(from,e.target.value)}
        style={{ fontSize:12, padding:"4px 7px", border:"1px solid #d0d0d0", borderRadius:6, background:"#fff" }}/>
    </span>
  );
}

export default function App() {
  const [view, setView]           = useState("daily");
  const [selState, setSelState]   = useState("All");
  const [branch, setBranch]       = useState("All");
  const [date, setDate]           = useState(todayStr());
  const [month, setMonth]         = useState(currentMonthName());
  const [qtr, setQtr]             = useState(currentQuarter());
  const [useCustom, setUseCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(todayStr());
  const [customTo, setCustomTo]     = useState(todayStr());
  const [sort, setSort]           = useState("diff");
  const [fstat, setFstat]         = useState("All");
  const [drill, setDrill]         = useState(null);
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastSync, setLastSync]   = useState(null);
  const [syncError, setSyncError] = useState(false);
  const [tab, setTab]             = useState("report");

  const fetchSheet = useCallback(async () => {
    setLoading(true); setSyncError(false);
    try {
      const res = await fetch(CSV_URL + "&cachebust=" + Date.now());
      if (!res.ok) throw new Error("Fetch failed");
      const text = await res.text();
      const rows = parseCSVText(text);
      if (rows.length > 0) { setData(rows); setLastSync(new Date()); }
    } catch { setSyncError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSheet();
    const interval = setInterval(fetchSheet, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSheet]);

  const states   = useMemo(() => ["All",...new Set(data.map(d=>d.state))], [data]);
  const branches = useMemo(() => {
    const b = data.filter(d=>selState==="All"||d.state===selState);
    return ["All",...new Set(b.map(d=>d.branch))];
  }, [data, selState]);

  const base = useMemo(() => {
    let r = data;
    if (useCustom && view !== "daily") {
      r = r.filter(x => x.date >= customFrom && x.date <= customTo);
    } else {
      if (view==="daily")           r = r.filter(x=>x.date===date);
      else if (view==="monthly")    r = r.filter(x=>x.month===month);
      else if (view==="quarterly")  r = r.filter(x=>QM[qtr].includes(x.month));
      else if (view==="halfyearly") r = r.filter(x=>["January","February","March","April","May","June"].includes(x.month));
      // yearly = all data
    }
    if (selState!=="All") r = r.filter(x=>x.state===selState);
    if (branch!=="All")   r = r.filter(x=>x.branch===branch);
    if (drill)            r = r.filter(x=>x.state===drill);

    r = r.map(x=>{
      const rawDm = tdiff(x.stObj, x.rtObj);
      const markedOntime = x.delayOntime &&
        x.delayOntime.trim().toLowerCase().replace(/[\s\/\-_]/g,"").includes("ontime");
      // FIX 3: Early = On Time, so treat negative dm as 0 (on time) always
      const rawAfterMark = (view !== "daily" && markedOntime) ? 0 : rawDm;
      const dm = rawAfterMark < 0 ? 0 : rawAfterMark; // Early = On Time
      return {...x, dm, rawDm};
    });

    // FIX 2: Status filter — "Late" = dm>0, "On Time" = dm<=0 (includes early)
    if (fstat==="Late")         r = r.filter(x=>x.dm>0);
    else if (fstat==="OnTime")  r = r.filter(x=>x.dm===0);

    if (sort==="diff")      r = [...r].sort((a,b)=>b.dm-a.dm);
    else if (sort==="state") r = [...r].sort((a,b)=>a.state.localeCompare(b.state));
    else if (sort==="branch") r = [...r].sort((a,b)=>a.branch.localeCompare(b.branch));
    return r;
  }, [data, view, date, month, qtr, useCustom, customFrom, customTo, selState, branch, drill, fstat, sort]);

  const kpi = useMemo(() => {
    const late = base.filter(r=>r.dm>0);
    const ontime = base.filter(r=>r.dm===0);
    return {
      total: base.length,
      late: late.length,
      ontime: ontime.length,
      avg: late.length ? Math.round(late.reduce((s,r)=>s+r.dm,0)/late.length) : 0
    };
  }, [base]);

  const stStats = useMemo(() => {
    const m={};
    base.forEach(r=>{
      if (!m[r.state]) m[r.state]={state:r.state,total:0,late:0,ontime:0};
      m[r.state].total++;
      if (r.dm>0) m[r.state].late++; else m[r.state].ontime++;
    });
    return Object.values(m).sort((a,b)=>b.late-a.late);
  }, [base]);

  // FIX 2: Top 10 Late — only dm>0 groups; Top 10 On Time — only dm===0 groups
  const groupedLate = useMemo(() => {
    const map={};
    base.filter(r=>r.dm>0).forEach(r=>{
      const key=`${r.state}||${r.branch}||${r.edition}`;
      if (!map[key]) map[key]={state:r.state,branch:r.branch,edition:r.edition,totalDm:0,count:0,causes:{}};
      map[key].totalDm+=r.dm; map[key].count+=1;
      if (r.cause) map[key].causes[r.cause]=(map[key].causes[r.cause]||0)+1;
    });
    return Object.values(map)
      .map(g=>({...g, avgDm:Math.round(g.totalDm/g.count),
        topCause:Object.entries(g.causes).sort((a,b)=>b[1]-a[1])[0]?.[0]||""}))
      .sort((a,b)=>b.avgDm-a.avgDm).slice(0,10);
  }, [base]);

  // FIX 2: Top 10 On Time — editions that are most consistently on time (lowest late count)
  const groupedOntime = useMemo(() => {
    const map={};
    base.forEach(r=>{
      const key=`${r.state}||${r.branch}||${r.edition}`;
      if (!map[key]) map[key]={state:r.state,branch:r.branch,edition:r.edition,total:0,ontime:0,totalDm:0};
      map[key].total+=1;
      if (r.dm===0) map[key].ontime+=1;
      else map[key].totalDm+=r.dm;
    });
    return Object.values(map)
      .filter(g=>g.ontime>0)
      .map(g=>({...g, ontimePct:Math.round(g.ontime/g.total*100)}))
      .sort((a,b)=>b.ontimePct-a.ontimePct || b.ontime-a.ontime)
      .slice(0,10);
  }, [base]);

  const causes = useMemo(()=>{
    const m={};
    base.filter(r=>r.dm>0&&r.cause).forEach(r=>{m[r.cause]=(m[r.cause]||0)+1;});
    const t=Object.values(m).reduce((s,v)=>s+v,0);
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([c,n])=>({c,n,pct:t?Math.round(n/t*100):0}));
  }, [base]);

  const exportCSV = () => {
    const h="Month,Date,State,Branch,Edition,Pullout,Schedule,Release,Delay/On Time,Reason,On Time-As per EHO";
    const rows=base.map(r=>{const d=fmtDiff(r.dm);return[r.month,r.date,r.state,r.branch,r.edition,r.pullout,r.st,r.rt,d.label,r.cause,r.delayOntime].join(",");});
    const b=new Blob([[h,...rows].join("\n")],{type:"text/csv"});
    const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="edition_report.csv"; a.click();
  };

  const Pill = ({label,active,onClick}) => (
    <button onClick={onClick} style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${active?"#185fa5":"#d0d0d0"}`,background:active?"#185fa5":"transparent",color:active?"#fff":"#666",fontWeight:active?500:400,fontSize:12,cursor:"pointer"}}>{label}</button>
  );

  const sectionTabs=[["report","Full Report"],["states","State Overview"],["top10","Top 10 Lists"],["causes","Delay Analysis"]];

  if (loading && data.length === 0) {
    return (
      <div style={{minHeight:"100vh",background:"#f4f5f7",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",padding:40}}>
          <div style={{width:40,height:40,border:"3px solid #e0e0e0",borderTop:"3px solid #185fa5",borderRadius:"50%",margin:"0 auto 16px",animation:"spin 1s linear infinite"}}></div>
          <div style={{fontSize:15,fontWeight:500,color:"#555",marginBottom:6}}>Loading data from Google Sheet...</div>
          <div style={{fontSize:12,color:"#aaa"}}>This may take a moment on first load</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#f4f5f7",padding:"16px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{maxWidth:980,margin:"0 auto",background:"#fff",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>

        {/* Header */}
        <div style={{borderBottom:"1px solid #eee",paddingBottom:14,marginBottom:18,display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
              <i className="ti ti-news" aria-hidden="true" style={{fontSize:22,color:"#185fa5"}}></i>
              <span style={{fontSize:20,fontWeight:500,color:"#111"}}>Edition Release Tracker</span>
              <span style={{background:"#e6f1fb",color:"#185fa5",fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:500}}>LIVE</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#888",flexWrap:"wrap"}}>
              <span>{data.length} records · Live from Google Sheet</span>
              {lastSync && <span>· Last sync: {lastSync.toLocaleTimeString()}</span>}
              {syncError && <span style={{color:"#a32d2d"}}>· ⚠️ Sync error</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <button onClick={fetchSheet} disabled={loading} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",border:"1px solid #185fa5",borderRadius:7,background:"#e6f1fb",color:"#185fa5",fontSize:12,cursor:"pointer"}}>
              <i className="ti ti-refresh" aria-hidden="true" style={{fontSize:14,animation:loading?"spin 1s linear infinite":"none"}}></i>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noreferrer"
              style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",border:"1px solid #3b6d11",borderRadius:7,background:"#eaf3de",color:"#3b6d11",fontSize:12,textDecoration:"none"}}>
              <i className="ti ti-table" aria-hidden="true" style={{fontSize:14}}></i> Edit Sheet
            </a>
            <button onClick={exportCSV} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",border:"1px solid #d0d0d0",borderRadius:7,background:"#fff",color:"#555",fontSize:12,cursor:"pointer"}}>
              <i className="ti ti-download" aria-hidden="true" style={{fontSize:14}}></i> Export
            </button>
          </div>
        </div>

        {/* Update banner */}
        {data.length > 0 && (
          <div style={{background:"#f0f7ea",border:"1px solid #97c459",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <i className="ti ti-info-circle" style={{fontSize:15,color:"#3b6d11"}}></i>
            <span style={{color:"#3b6d11",fontWeight:500}}>To update data:</span>
            <span style={{color:"#555"}}>Add or edit data in the Google Sheet via "Edit Sheet" → Click "Refresh" → Dashboard will update automatically!</span>
          </div>
        )}

        {/* No Data */}
        {data.length === 0 && !loading && (
          <div style={{textAlign:"center",padding:"48px 20px",color:"#aaa"}}>
            <i className="ti ti-table-off" style={{fontSize:52,display:"block",marginBottom:12}}></i>
            <div style={{fontSize:16,fontWeight:500,marginBottom:8,color:"#888"}}>No Data in Google Sheet</div>
            <div style={{fontSize:13,marginBottom:16,color:"#aaa"}}>Add data to the Sheet with the correct column headers</div>
            <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noreferrer"
              style={{padding:"9px 22px",background:"#185fa5",color:"#fff",border:"none",borderRadius:8,fontSize:13,textDecoration:"none",display:"inline-block"}}>
              Open Google Sheet
            </a>
          </div>
        )}

        {data.length > 0 && (
          <>
            {/* KPI Cards — FIX 3: No "Early" card, only Late + On Time */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
              {[
                {l:"Total Editions", v:kpi.total,    ic:"ti-layout-grid",       bg:"#f5f5f5",c:"#333"},
                {l:"Late",           v:kpi.late,      ic:"ti-clock-exclamation", bg:"#fff0f0",c:"#a32d2d"},
                {l:"On Time",        v:kpi.ontime,    ic:"ti-circle-check",      bg:"#e6f1fb",c:"#185fa5"},
                {l:"Avg Delay",      v:(() => { const m=kpi.avg; const h=Math.floor(m/60); const mn=m%60; return h>0?`${String(h).padStart(2,"0")}:${String(mn).padStart(2,"0")}`:`00:${String(mn).padStart(2,"0")}`; })(),
                  ic:"ti-trending-up", bg:"#faeeda",c:"#854f0b"},
              ].map(k=>(
                <div key={k.l} style={{background:k.bg,borderRadius:9,padding:"11px 13px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                    <i className={`ti ${k.ic}`} aria-hidden="true" style={{fontSize:14,color:k.c}}></i>
                    <span style={{fontSize:10,color:k.c,opacity:.85}}>{k.l}</span>
                  </div>
                  <div style={{fontSize:22,fontWeight:500,color:k.c}}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* View Pills */}
            <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              {[["daily","Daily"],["monthly","Monthly"],["quarterly","Quarterly"],["halfyearly","Half-Yearly"],["yearly","Yearly"]].map(([k,l])=>(
                <Pill key={k} label={l} active={view===k} onClick={()=>{setView(k);setDrill(null);setUseCustom(false);}}/>
              ))}
              {view!=="daily" && (
                <button onClick={()=>setUseCustom(p=>!p)}
                  style={{marginLeft:6,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${useCustom?"#854f0b":"#d0d0d0"}`,background:useCustom?"#faeeda":"transparent",color:useCustom?"#854f0b":"#888",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                  <i className="ti ti-calendar-event" style={{fontSize:13}}></i>
                  {useCustom?"Custom Range ✓":"Custom Range"}
                </button>
              )}
            </div>

            {/* Filters */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14,padding:"10px 12px",background:"#f8f9fa",borderRadius:9,alignItems:"center"}}>
              <i className="ti ti-adjustments-horizontal" aria-hidden="true" style={{fontSize:15,color:"#aaa"}}></i>
              {view==="daily" && (
                <span style={{display:"flex",alignItems:"center",gap:5}}>
                  <label style={{fontSize:11,color:"#888"}}>Date</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                    style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6,background:"#fff"}}/>
                </span>
              )}
              {view==="monthly"&&!useCustom&&(
                <span style={{display:"flex",alignItems:"center",gap:5}}>
                  <label style={{fontSize:11,color:"#888"}}>Month</label>
                  <select value={month} onChange={e=>setMonth(e.target.value)}
                    style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6,background:"#fff"}}>
                    {MONTHS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </span>
              )}
              {view==="quarterly"&&!useCustom&&(
                <span style={{display:"flex",alignItems:"center",gap:5}}>
                  <label style={{fontSize:11,color:"#888"}}>Quarter</label>
                  <select value={qtr} onChange={e=>setQtr(e.target.value)}
                    style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6,background:"#fff"}}>
                    {["Q1","Q2","Q3","Q4"].map(q=><option key={q}>{q}</option>)}
                  </select>
                </span>
              )}
              {useCustom&&view!=="daily"&&(
                <CustomRangePicker from={customFrom} to={customTo} onChange={(f,t)=>{setCustomFrom(f);setCustomTo(t);}}/>
              )}
              {[
                {lbl:"State",val:selState,opts:states,set:(v)=>{setSelState(v);setBranch("All");setDrill(null);}},
                {lbl:"Branch",val:branch,opts:branches,set:setBranch},
                {lbl:"Status",val:fstat,opts:["All","Late","OnTime"],set:setFstat},
              ].map(f=>(
                <span key={f.lbl} style={{display:"flex",alignItems:"center",gap:5}}>
                  <label style={{fontSize:11,color:"#888"}}>{f.lbl}</label>
                  <select value={f.val} onChange={e=>f.set(e.target.value)}
                    style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6,background:"#fff"}}>
                    {f.opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </span>
              ))}
              <span style={{display:"flex",alignItems:"center",gap:5}}>
                <label style={{fontSize:11,color:"#888"}}>Sort</label>
                <select value={sort} onChange={e=>setSort(e.target.value)}
                  style={{fontSize:12,padding:"4px 7px",border:"1px solid #d0d0d0",borderRadius:6,background:"#fff"}}>
                  <option value="diff">By Delay ↕</option>
                  <option value="state">By State</option>
                  <option value="branch">By Branch</option>
                </select>
              </span>
              {drill&&(
                <button onClick={()=>setDrill(null)} style={{marginLeft:"auto",fontSize:11,padding:"4px 9px",border:"1px solid #ccc",borderRadius:6,background:"#fff",color:"#888",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                  <i className="ti ti-x" style={{fontSize:12}}></i> Clear: {drill}
                </button>
              )}
            </div>

            {/* Section Tabs */}
            <div style={{display:"flex",marginBottom:16,borderBottom:"1px solid #eee"}}>
              {sectionTabs.map(([k,l])=>(
                <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 15px",fontSize:12,border:"none",background:"transparent",cursor:"pointer",color:tab===k?"#185fa5":"#888",borderBottom:tab===k?"2px solid #185fa5":"2px solid transparent",fontWeight:tab===k?500:400}}>{l}</button>
              ))}
            </div>

            {/* TAB: Full Report */}
            {tab==="report"&&(
              <div>
                <div style={{fontSize:12,color:"#888",marginBottom:8}}>
                  {drill?`Drill-down: ${drill} — `:""}Showing {base.length} editions
                  {useCustom&&view!=="daily"&&<span style={{marginLeft:8,color:"#854f0b"}}>({customFrom} → {customTo})</span>}
                </div>
                <div style={{overflowX:"auto",border:"1px solid #eee",borderRadius:10}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}>
                    <thead>
                      <tr style={{background:"#f8f9fa"}}>
                        {["State","Branch","Edition","Pullout","Scheduled","Released","Delay/On Time","Reason","On Time-As per EHO"].map(h=>(
                          <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:500,color:"#888",borderBottom:"1px solid #eee",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {base.length===0&&<tr><td colSpan={9} style={{padding:24,textAlign:"center",color:"#aaa"}}>No data for this selection.</td></tr>}
                      {base.map((r,i)=>{
                        const d=fmtDiff(r.dm); const sc=SC[d.type];
                        return (
                          <tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:i%2?"#fafafa":"#fff"}}>
                            <td style={{padding:"7px 10px",fontWeight:500}}>{r.state}</td>
                            <td style={{padding:"7px 10px",color:"#555"}}>{r.branch}</td>
                            <td style={{padding:"7px 10px"}}>{r.edition}</td>
                            <td style={{padding:"7px 10px",color:"#888",fontSize:11}}>{r.pullout}</td>
                            <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11,color:"#555"}}>{r.st}</td>
                            <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11,color:"#555"}}>{r.rt}</td>
                            <td style={{padding:"7px 10px"}}>
                              <span style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.bd}`,borderRadius:8,fontSize:10,padding:"3px 8px",fontWeight:600,whiteSpace:"nowrap"}}>{d.label}</span>
                            </td>
                            <td style={{padding:"7px 10px",color:r.cause?"#854f0b":"#ccc",fontSize:11}}>{r.cause||"—"}</td>
                            <td style={{padding:"7px 10px",fontSize:11}}>
                              {r.delayOntime
                                ? <span style={{background:"#e6f1fb",color:"#185fa5",padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:500}}>{r.delayOntime}</span>
                                : <span style={{color:"#ccc"}}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: State Overview */}
            {tab==="states"&&(
              <div>
                <div style={{fontSize:12,color:"#888",marginBottom:12}}>Click on a state card to drill down into its editions</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10}}>
                  {stStats.map(s=>(
                    <button key={s.state} onClick={()=>{setDrill(s.state);setTab("report");}} style={{background:"#fff",border:`1px solid ${s.late>0?"#f09595":"#e0e0e0"}`,borderRadius:10,padding:"12px",cursor:"pointer",textAlign:"left"}}>
                      <div style={{fontWeight:500,fontSize:13,marginBottom:6}}>{s.state}</div>
                      <div style={{fontSize:12,color:"#888",marginBottom:8}}>{s.total} editions</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                        <span style={{fontSize:10,background:"#fff0f0",color:"#a32d2d",padding:"2px 6px",borderRadius:8}}>{s.late} late</span>
                        <span style={{fontSize:10,background:"#e6f1fb",color:"#185fa5",padding:"2px 6px",borderRadius:8}}>{s.ontime} on-time</span>
                      </div>
                      {s.total>0&&(
                        <div>
                          <div style={{height:4,borderRadius:2,background:"#f0f0f0",overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${Math.round(s.late/s.total*100)}%`,background:"#a32d2d",borderRadius:2}}></div>
                          </div>
                          <div style={{marginTop:3,fontSize:11,color:"#aaa"}}>{Math.round(s.late/s.total*100)}% delay rate</div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Top 10 */}
            {tab==="top10"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {/* Top 10 Late */}
                <div style={{border:"1px solid #f09595",borderRadius:10,padding:14}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#a32d2d",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                    <i className="ti ti-alert-triangle" aria-hidden="true" style={{fontSize:15}}></i> Top 10 Late Editions
                  </div>
                  <div style={{fontSize:11,color:"#aaa",marginBottom:12}}>Avg delay · High → Low (HH:MM format)</div>
                  {groupedLate.length===0&&<div style={{fontSize:12,color:"#aaa"}}>No late editions in this selection</div>}
                  {groupedLate.map((r,i)=>{
                    const h=Math.floor(r.avgDm/60), m=r.avgDm%60;
                    const timeStr=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
                    return (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:10,borderBottom:i<groupedLate.length-1?"1px solid #fef0f0":"none"}}>
                        <span style={{fontSize:12,fontWeight:700,color:"#a32d2d",minWidth:24,textAlign:"right"}}>#{i+1}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.branch} — {r.edition}</div>
                          <div style={{fontSize:11,color:"#888"}}>{r.state}{r.topCause?" · "+r.topCause:""}</div>
                          <div style={{fontSize:10,color:"#bbb"}}>{r.count} days of data</div>
                        </div>
                        <span style={{fontSize:11,background:"#fff0f0",color:"#a32d2d",padding:"3px 9px",borderRadius:8,fontWeight:700,whiteSpace:"nowrap"}}>+{timeStr}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Top 10 On Time */}
                <div style={{border:"1px solid #85b7eb",borderRadius:10,padding:14}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#185fa5",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                    <i className="ti ti-circle-check" aria-hidden="true" style={{fontSize:15}}></i> Top 10 On Time Editions
                  </div>
                  <div style={{fontSize:11,color:"#aaa",marginBottom:12}}>Most consistently on time · High % first</div>
                  {groupedOntime.length===0&&<div style={{fontSize:12,color:"#aaa"}}>No on-time editions in this selection</div>}
                  {groupedOntime.map((r,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:10,borderBottom:i<groupedOntime.length-1?"1px solid #e6f1fb":"none"}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#185fa5",minWidth:24,textAlign:"right"}}>#{i+1}</span>
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

            {/* TAB: Delay Causes */}
            {tab==="causes"&&(
              <div>
                <div style={{fontSize:12,color:"#888",marginBottom:12}}>Delay cause breakdown for current filter selection</div>
                {causes.length===0&&<div style={{fontSize:12,color:"#aaa"}}>No delay causes recorded for this selection.</div>}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {causes.map(({c,n,pct})=>(
                    <div key={c} style={{background:"#fafafa",border:"1px solid #eee",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:13,fontWeight:500}}>{c}</span>
                        <span style={{fontSize:12,color:"#a32d2d",fontWeight:500}}>{n} times ({pct}%)</span>
                      </div>
                      <div style={{height:5,borderRadius:3,background:"#eee",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:"#a32d2d",borderRadius:3}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{marginTop:20,fontSize:11,color:"#bbb",textAlign:"center"}}>
          Print Media Operations · Edition Release Tracker · {data.length} records · Powered by Google Sheets
        </div>
      </div>
    </div>
  );
}

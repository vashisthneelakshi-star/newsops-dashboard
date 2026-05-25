import { useState, useMemo } from "react";

const SAMPLE = [
  {month:"May",date:"2026-05-25",state:"Rajasthan",branch:"Jaipur",edition:"City Morning",pullout:"Metro Plus",st:"04:00",rt:"04:35",cause:"Plate making delay"},
  {month:"May",date:"2026-05-25",state:"Rajasthan",branch:"Jodhpur",edition:"Desert Edition",pullout:"Weekend",st:"04:15",rt:"03:58",cause:""},
  {month:"May",date:"2026-05-25",state:"Rajasthan",branch:"Udaipur",edition:"Lake City",pullout:"None",st:"04:30",rt:"05:10",cause:"Ink supply issue"},
  {month:"May",date:"2026-05-25",state:"Maharashtra",branch:"Mumbai",edition:"Bombay Metro",pullout:"Supplement",st:"03:30",rt:"03:45",cause:"Press breakdown"},
  {month:"May",date:"2026-05-25",state:"Maharashtra",branch:"Pune",edition:"Pune City",pullout:"Education",st:"04:00",rt:"03:55",cause:""},
  {month:"May",date:"2026-05-25",state:"Maharashtra",branch:"Nagpur",edition:"Vidarbha",pullout:"None",st:"04:30",rt:"05:05",cause:"Power outage"},
  {month:"May",date:"2026-05-25",state:"Delhi",branch:"New Delhi",edition:"Capital Edition",pullout:"Delhi Times",st:"03:00",rt:"03:00",cause:""},
  {month:"May",date:"2026-05-25",state:"Delhi",branch:"Dwarka",edition:"West Delhi",pullout:"None",st:"03:30",rt:"04:00",cause:"Late news content"},
  {month:"May",date:"2026-05-25",state:"Gujarat",branch:"Ahmedabad",edition:"Sabarmati",pullout:"Business",st:"04:00",rt:"04:20",cause:"Cylinder problem"},
  {month:"May",date:"2026-05-25",state:"Gujarat",branch:"Surat",edition:"Diamond City",pullout:"None",st:"04:15",rt:"04:10",cause:""},
  {month:"May",date:"2026-05-25",state:"UP",branch:"Lucknow",edition:"Awadh",pullout:"Sunday Mag",st:"04:00",rt:"04:55",cause:"Staff shortage"},
  {month:"May",date:"2026-05-25",state:"UP",branch:"Varanasi",edition:"Kashi Edition",pullout:"None",st:"04:30",rt:"04:25",cause:""},
  {month:"May",date:"2026-05-25",state:"MP",branch:"Bhopal",edition:"Madhya",pullout:"Political Plus",st:"04:00",rt:"04:45",cause:"Plate burn delay"},
  {month:"May",date:"2026-05-25",state:"Punjab",branch:"Chandigarh",edition:"Tricity",pullout:"None",st:"03:45",rt:"03:45",cause:""},
  {month:"May",date:"2026-05-25",state:"Tamil Nadu",branch:"Chennai",edition:"Madras Edition",pullout:"Cinema",st:"03:30",rt:"04:05",cause:"Content approval delay"},
  {month:"May",date:"2026-05-24",state:"Rajasthan",branch:"Jaipur",edition:"City Morning",pullout:"Metro Plus",st:"04:00",rt:"04:10",cause:"Ink problem"},
  {month:"May",date:"2026-05-24",state:"Maharashtra",branch:"Mumbai",edition:"Bombay Metro",pullout:"Supplement",st:"03:30",rt:"03:28",cause:""},
  {month:"May",date:"2026-05-24",state:"Delhi",branch:"New Delhi",edition:"Capital Edition",pullout:"Delhi Times",st:"03:00",rt:"03:22",cause:"Pullout binding delay"},
  {month:"May",date:"2026-05-24",state:"Gujarat",branch:"Ahmedabad",edition:"Sabarmati",pullout:"Business",st:"04:00",rt:"03:50",cause:""},
  {month:"May",date:"2026-05-24",state:"UP",branch:"Lucknow",edition:"Awadh",pullout:"Sunday Mag",st:"04:00",rt:"04:30",cause:"Machine maintenance"},
  {month:"May",date:"2026-05-23",state:"Rajasthan",branch:"Jaipur",edition:"City Morning",pullout:"Metro Plus",st:"04:00",rt:"03:55",cause:""},
  {month:"May",date:"2026-05-23",state:"Maharashtra",branch:"Mumbai",edition:"Bombay Metro",pullout:"Supplement",st:"03:30",rt:"04:15",cause:"Generator failure"},
  {month:"May",date:"2026-05-23",state:"Tamil Nadu",branch:"Chennai",edition:"Madras Edition",pullout:"Cinema",st:"03:30",rt:"03:30",cause:""},
  {month:"May",date:"2026-05-22",state:"Rajasthan",branch:"Jaipur",edition:"City Morning",pullout:"Metro Plus",st:"04:00",rt:"04:50",cause:"Plate making delay"},
  {month:"May",date:"2026-05-22",state:"UP",branch:"Lucknow",edition:"Awadh",pullout:"Sunday Mag",st:"04:00",rt:"03:45",cause:""},
  {month:"May",date:"2026-05-22",state:"Gujarat",branch:"Surat",edition:"Diamond City",pullout:"None",st:"04:15",rt:"04:40",cause:"Inking unit fault"},
  {month:"May",date:"2026-05-21",state:"Maharashtra",branch:"Nagpur",edition:"Vidarbha",pullout:"None",st:"04:30",rt:"05:20",cause:"Power outage"},
  {month:"May",date:"2026-05-21",state:"Delhi",branch:"Dwarka",edition:"West Delhi",pullout:"None",st:"03:30",rt:"03:30",cause:""},
  {month:"May",date:"2026-05-20",state:"Rajasthan",branch:"Udaipur",edition:"Lake City",pullout:"None",st:"04:30",rt:"05:00",cause:"Plate burn delay"},
  {month:"May",date:"2026-05-20",state:"Punjab",branch:"Chandigarh",edition:"Tricity",pullout:"None",st:"03:45",rt:"03:40",cause:""},
  {month:"April",date:"2026-04-30",state:"Rajasthan",branch:"Jaipur",edition:"City Morning",pullout:"Metro Plus",st:"04:00",rt:"04:45",cause:"Press breakdown"},
  {month:"April",date:"2026-04-30",state:"Maharashtra",branch:"Mumbai",edition:"Bombay Metro",pullout:"Supplement",st:"03:30",rt:"04:00",cause:"Cylinder problem"},
  {month:"April",date:"2026-04-29",state:"Gujarat",branch:"Ahmedabad",edition:"Sabarmati",pullout:"Business",st:"04:00",rt:"04:35",cause:"Staff shortage"},
  {month:"April",date:"2026-04-28",state:"UP",branch:"Lucknow",edition:"Awadh",pullout:"Sunday Mag",st:"04:00",rt:"04:20",cause:"Late news content"},
  {month:"April",date:"2026-04-27",state:"Delhi",branch:"New Delhi",edition:"Capital Edition",pullout:"Delhi Times",st:"03:00",rt:"03:15",cause:"Content approval delay"},
  {month:"March",date:"2026-03-31",state:"Rajasthan",branch:"Jaipur",edition:"City Morning",pullout:"Metro Plus",st:"04:00",rt:"04:30",cause:"Machine maintenance"},
  {month:"March",date:"2026-03-30",state:"Maharashtra",branch:"Mumbai",edition:"Bombay Metro",pullout:"Supplement",st:"03:30",rt:"03:25",cause:""},
  {month:"March",date:"2026-03-29",state:"Tamil Nadu",branch:"Chennai",edition:"Madras Edition",pullout:"Cinema",st:"03:30",rt:"04:10",cause:"Ink supply issue"},
  {month:"February",date:"2026-02-28",state:"Rajasthan",branch:"Jaipur",edition:"City Morning",pullout:"Metro Plus",st:"04:00",rt:"04:15",cause:"Cylinder problem"},
  {month:"February",date:"2026-02-27",state:"Gujarat",branch:"Ahmedabad",edition:"Sabarmati",pullout:"Business",st:"04:00",rt:"04:50",cause:"Press breakdown"},
  {month:"January",date:"2026-01-31",state:"Delhi",branch:"New Delhi",edition:"Capital Edition",pullout:"Delhi Times",st:"03:00",rt:"03:45",cause:"Power outage"},
  {month:"January",date:"2026-01-30",state:"MP",branch:"Bhopal",edition:"Madhya",pullout:"Political Plus",st:"04:00",rt:"04:00",cause:""},
];

function tdiff(s, r) {
  const [sh, sm] = s.split(":").map(Number);
  const [rh, rm] = r.split(":").map(Number);
  return (rh * 60 + rm) - (sh * 60 + sm);
}

function fmtD(m) {
  if (m === 0) return { label: "On Time", type: "ontime" };
  const a = Math.abs(m);
  const h = Math.floor(a / 60), mn = a % 60;
  const s = h > 0 ? `${h}h ${mn}m` : `${mn}m`;
  return m > 0 ? { label: `+${s} Late`, type: "late" } : { label: `-${s} Early`, type: "early" };
}

const SC = {
  late:   { bg: "#fff0f0", color: "#a32d2d", bd: "#f09595" },
  early:  { bg: "#eaf3de", color: "#3b6d11", bd: "#97c459" },
  ontime: { bg: "#e6f1fb", color: "#185fa5", bd: "#85b7eb" },
};

const QM = {
  Q1: ["January","February","March"],
  Q2: ["April","May","June"],
  Q3: ["July","August","September"],
  Q4: ["October","November","December"],
};

const TODAY = new Date().toISOString().slice(0, 10);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function App() {
  const [view, setView]       = useState("daily");
  const [selState, setSelState] = useState("All");
  const [branch, setBranch]   = useState("All");
  const [date, setDate]       = useState("2026-05-25");
  const [month, setMonth]     = useState("May");
  const [qtr, setQtr]         = useState("Q2");
  const [sort, setSort]       = useState("diff");
  const [fstat, setFstat]     = useState("All");
  const [drill, setDrill]     = useState(null);
  const [data, setData]       = useState(SAMPLE);
  const [showUp, setShowUp]   = useState(false);
  const [tab, setTab]         = useState("report");

  const states   = useMemo(() => ["All", ...new Set(data.map(d => d.state))], [data]);
  const branches = useMemo(() => {
    const b = data.filter(d => selState === "All" || d.state === selState);
    return ["All", ...new Set(b.map(d => d.branch))];
  }, [data, selState]);

  const base = useMemo(() => {
    let r = data;
    if (view === "daily")       r = r.filter(x => x.date === date);
    else if (view === "monthly") r = r.filter(x => x.month === month);
    else if (view === "quarterly") r = r.filter(x => QM[qtr].includes(x.month));
    else r = r.filter(x => ["January","February","March","April","May","June"].includes(x.month));
    if (selState !== "All") r = r.filter(x => x.state === selState);
    if (branch !== "All")   r = r.filter(x => x.branch === branch);
    if (drill)              r = r.filter(x => x.state === drill);
    r = r.map(x => ({ ...x, dm: tdiff(x.st, x.rt) }));
    if (fstat === "Late")   r = r.filter(x => x.dm > 0);
    else if (fstat === "Early")  r = r.filter(x => x.dm < 0);
    else if (fstat === "OnTime") r = r.filter(x => x.dm === 0);
    if (sort === "diff")  r = [...r].sort((a, b) => b.dm - a.dm);
    else if (sort === "state")  r = [...r].sort((a, b) => a.state.localeCompare(b.state));
    else r = [...r].sort((a, b) => a.branch.localeCompare(b.branch));
    return r;
  }, [data, view, date, month, qtr, selState, branch, drill, fstat, sort]);

  const todayKpi = useMemo(() => {
    const a = data.filter(r => r.date === "2026-05-25").map(r => ({ ...r, dm: tdiff(r.st, r.rt) }));
    const late = a.filter(r => r.dm > 0);
    return {
      total: a.length,
      late: late.length,
      early: a.filter(r => r.dm < 0).length,
      ontime: a.filter(r => r.dm === 0).length,
      avg: late.length ? Math.round(late.reduce((s, r) => s + r.dm, 0) / late.length) : 0,
    };
  }, [data]);

  const stStats = useMemo(() => {
    const m = {};
    base.forEach(r => {
      if (!m[r.state]) m[r.state] = { state: r.state, total: 0, late: 0, early: 0, ontime: 0 };
      m[r.state].total++;
      if (r.dm > 0) m[r.state].late++;
      else if (r.dm < 0) m[r.state].early++;
      else m[r.state].ontime++;
    });
    return Object.values(m).sort((a, b) => b.late - a.late);
  }, [base]);

  const top10late  = useMemo(() => [...base].filter(r => r.dm > 0).sort((a, b) => b.dm - a.dm).slice(0, 10), [base]);
  const top10early = useMemo(() => [...base].sort((a, b) => a.dm - b.dm).slice(0, 10), [base]);

  const causes = useMemo(() => {
    const m = {};
    base.filter(r => r.dm > 0 && r.cause).forEach(r => { m[r.cause] = (m[r.cause] || 0) + 1; });
    const t = Object.values(m).reduce((s, v) => s + v, 0);
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ c, n, pct: t ? Math.round(n / t * 100) : 0 }));
  }, [base]);

  const handleCSV = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = ev => {
      const lines = ev.target.result.split("\n").filter(Boolean);
      const hdrs = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/ /g, ""));
      const rows = lines.slice(1).map(ln => {
        const v = ln.split(",").map(x => x.trim());
        const row = {}; hdrs.forEach((h, i) => row[h] = v[i] || "");
        return { month: row.month||"", date: row.date||"", state: row.state||"", branch: row.branch||"", edition: row.edition||"", pullout: row.pullout||"None", st: row.scheduletime||row.schedule_time||"00:00", rt: row.releasetime||row.release_time||"00:00", cause: row.delaycause||row.delay_cause||row.reason||"" };
      }).filter(r => r.state && r.edition);
      if (rows.length) { setData(p => [...p, ...rows]); setShowUp(false); }
    };
    rd.readAsText(f);
  };

  const exportCSV = () => {
    const h = "Month,Date,State,Branch,Edition,Pullout,Schedule,Release,Diff,Cause";
    const rows = base.map(r => { const d = fmtD(r.dm); return [r.month,r.date,r.state,r.branch,r.edition,r.pullout,r.st,r.rt,d.label,r.cause].join(","); });
    const b = new Blob([[h, ...rows].join("\n")], { type: "text/csv" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = u; a.download = "edition_report.csv"; a.click();
  };

  const Pill = ({ label, active, onClick, col = "#185fa5" }) => (
    <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${active ? col : "#d0d0d0"}`, background: active ? col : "transparent", color: active ? "#fff" : "#666", fontWeight: active ? 500 : 400, fontSize: 12, cursor: "pointer" }}>
      {label}
    </button>
  );

  const sectionTabs = [["report","Full Report"],["states","State Overview"],["top10","Top 10 Lists"],["causes","Delay Analysis"]];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", padding: "16px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
        <h2 className="sr-only">Print Edition Release Tracking Dashboard</h2>

        {/* Header */}
        <div style={{ borderBottom: "1px solid #eee", paddingBottom: 14, marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <i className="ti ti-news" aria-hidden="true" style={{ fontSize: 22, color: "#185fa5" }}></i>
              <span style={{ fontSize: 20, fontWeight: 500, color: "#111" }}>Edition Release Tracker</span>
              <span style={{ background: "#e6f1fb", color: "#185fa5", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>LIVE</span>
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>Print Media Operations Dashboard · {data.length} records loaded</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setShowUp(!showUp)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "1px solid #d0d0d0", borderRadius: 7, background: "#fff", color: "#555", fontSize: 12, cursor: "pointer" }}>
              <i className="ti ti-upload" aria-hidden="true" style={{ fontSize: 14 }}></i> Import CSV
            </button>
            <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "1px solid #d0d0d0", borderRadius: 7, background: "#fff", color: "#555", fontSize: 12, cursor: "pointer" }}>
              <i className="ti ti-download" aria-hidden="true" style={{ fontSize: 14 }}></i> Export
            </button>
          </div>
        </div>

        {/* CSV Upload */}
        {showUp && (
          <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: 9, padding: "14px 16px", marginBottom: 16, fontSize: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 5 }}>Upload Daily Sheet (CSV)</div>
            <div style={{ color: "#888", marginBottom: 8 }}>Columns: Month, Date, State, Branch, Edition, Pullout, Schedule Time, Release Time, Delay Cause</div>
            <input type="file" accept=".csv" onChange={handleCSV} />
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid5" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 18 }}>
          {[
            { l: "Total Editions", v: todayKpi.total, ic: "ti-layout-grid", bg: "#f5f5f5", c: "#333" },
            { l: "Late Today",     v: todayKpi.late,  ic: "ti-clock-exclamation", bg: "#fff0f0", c: "#a32d2d" },
            { l: "On Time",        v: todayKpi.ontime,ic: "ti-circle-check", bg: "#e6f1fb", c: "#185fa5" },
            { l: "Early Release",  v: todayKpi.early, ic: "ti-bolt", bg: "#eaf3de", c: "#3b6d11" },
            { l: "Avg Delay",      v: `${todayKpi.avg}m`, ic: "ti-trending-up", bg: "#faeeda", c: "#854f0b" },
          ].map(k => (
            <div key={k.l} style={{ background: k.bg, borderRadius: 9, padding: "11px 13px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <i className={`ti ${k.ic}`} aria-hidden="true" style={{ fontSize: 14, color: k.c }}></i>
                <span style={{ fontSize: 10, color: k.c, opacity: .85 }}>{k.l}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* View Selector */}
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
          {[["daily","Daily"],["monthly","Monthly"],["quarterly","Quarterly"],["halfyearly","Half-Yearly"]].map(([k,l]) => (
            <Pill key={k} label={l} active={view === k} onClick={() => { setView(k); setDrill(null); }} />
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, padding: "10px 12px", background: "#f8f9fa", borderRadius: 9, alignItems: "center" }}>
          <i className="ti ti-adjustments-horizontal" aria-hidden="true" style={{ fontSize: 15, color: "#aaa" }}></i>
          {view === "daily" && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <label style={{ fontSize: 11, color: "#888" }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          )}
          {view === "monthly" && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <label style={{ fontSize: 11, color: "#888" }}>Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          )}
          {view === "quarterly" && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <label style={{ fontSize: 11, color: "#888" }}>Quarter</label>
              <select value={qtr} onChange={e => setQtr(e.target.value)}>
                {["Q1","Q2","Q3","Q4"].map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <label style={{ fontSize: 11, color: "#888" }}>State</label>
            <select value={selState} onChange={e => { setSelState(e.target.value); setBranch("All"); setDrill(null); }}>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <label style={{ fontSize: 11, color: "#888" }}>Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}>
              {branches.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <label style={{ fontSize: 11, color: "#888" }}>Status</label>
            <select value={fstat} onChange={e => setFstat(e.target.value)}>
              {["All","Late","OnTime","Early"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <label style={{ fontSize: 11, color: "#888" }}>Sort</label>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="diff">By Delay</option>
              <option value="state">By State</option>
              <option value="branch">By Branch</option>
            </select>
          </div>
          {drill && (
            <button onClick={() => setDrill(null)} style={{ marginLeft: "auto", fontSize: 11, padding: "4px 9px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-x" style={{ fontSize: 12 }}></i> Clear: {drill}
            </button>
          )}
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #eee" }}>
          {sectionTabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: "7px 15px", fontSize: 12, border: "none", background: "transparent", cursor: "pointer", color: tab === k ? "#185fa5" : "#888", borderBottom: tab === k ? "2px solid #185fa5" : "2px solid transparent", fontWeight: tab === k ? 500 : 400 }}>{l}</button>
          ))}
        </div>

        {/* TAB: Full Report */}
        {tab === "report" && (
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{drill ? `Drill-down: ${drill} — ` : ""}Showing {base.length} editions</div>
            <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 620 }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["State","Branch","Edition","Pullout","Sched","Release","Diff","Reason"].map(h => (
                      <th key={h} style={{ padding: "8px 9px", textAlign: "left", fontWeight: 500, color: "#888", borderBottom: "1px solid #eee", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {base.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#aaa" }}>No data for this selection.</td></tr>}
                  {base.map((r, i) => {
                    const d = fmtD(r.dm); const sc = SC[d.type];
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafafa" : "#fff" }}>
                        <td style={{ padding: "7px 9px", fontWeight: 500 }}>{r.state}</td>
                        <td style={{ padding: "7px 9px", color: "#555" }}>{r.branch}</td>
                        <td style={{ padding: "7px 9px" }}>{r.edition}</td>
                        <td style={{ padding: "7px 9px", color: "#888", fontSize: 11 }}>{r.pullout}</td>
                        <td style={{ padding: "7px 9px", fontFamily: "monospace", fontSize: 11, color: "#888" }}>{r.st}</td>
                        <td style={{ padding: "7px 9px", fontFamily: "monospace", fontSize: 11, color: "#888" }}>{r.rt}</td>
                        <td style={{ padding: "7px 9px" }}>
                          <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.bd}`, borderRadius: 8, fontSize: 10, padding: "2px 7px", fontWeight: 500, whiteSpace: "nowrap" }}>{d.label}</span>
                        </td>
                        <td style={{ padding: "7px 9px", color: r.cause ? "#854f0b" : "#ccc", fontSize: 11 }}>{r.cause || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: State Overview */}
        {tab === "states" && (
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Click a state card to drill down</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
              {stStats.map(s => (
                <button key={s.state} onClick={() => { setDrill(s.state); setTab("report"); }} style={{ background: "#fff", border: `1px solid ${s.late > 0 ? "#f09595" : "#e0e0e0"}`, borderRadius: 10, padding: "12px", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>{s.state}</div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{s.total} editions</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, background: "#fff0f0", color: "#a32d2d", padding: "2px 6px", borderRadius: 8 }}>{s.late} late</span>
                    <span style={{ fontSize: 10, background: "#eaf3de", color: "#3b6d11", padding: "2px 6px", borderRadius: 8 }}>{s.early} early</span>
                    <span style={{ fontSize: 10, background: "#e6f1fb", color: "#185fa5", padding: "2px 6px", borderRadius: 8 }}>{s.ontime} on-time</span>
                  </div>
                  {s.late > 0 && (
                    <div>
                      <div style={{ height: 4, borderRadius: 2, background: "#f0f0f0", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round(s.late / s.total * 100)}%`, background: "#a32d2d", borderRadius: 2 }}></div>
                      </div>
                      <div style={{ marginTop: 3, fontSize: 11, color: "#aaa" }}>{Math.round(s.late / s.total * 100)}% delay rate</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Top 10 */}
        {tab === "top10" && (
          <div className="grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ border: "1px solid #f09595", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#a32d2d", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-alert-triangle" aria-hidden="true" style={{ fontSize: 15 }}></i> Top 10 Late
              </div>
              {top10late.length === 0 && <div style={{ fontSize: 12, color: "#aaa" }}>No late editions</div>}
              {top10late.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#a32d2d", minWidth: 20, textAlign: "right" }}>#{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.branch} — {r.edition}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{r.state}{r.cause ? " · " + r.cause : ""}</div>
                  </div>
                  <span style={{ fontSize: 10, background: "#fff0f0", color: "#a32d2d", padding: "2px 7px", borderRadius: 8, fontWeight: 500, whiteSpace: "nowrap" }}>+{r.dm}m</span>
                </div>
              ))}
            </div>
            <div style={{ border: "1px solid #97c459", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#3b6d11", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-award" aria-hidden="true" style={{ fontSize: 15 }}></i> Top 10 Early / On-Time
              </div>
              {top10early.length === 0 && <div style={{ fontSize: 12, color: "#aaa" }}>No data</div>}
              {top10early.map((r, i) => {
                const d = fmtD(r.dm);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#3b6d11", minWidth: 20, textAlign: "right" }}>#{i+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.branch} — {r.edition}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{r.state}</div>
                    </div>
                    <span style={{ fontSize: 10, background: d.type === "ontime" ? "#e6f1fb" : "#eaf3de", color: d.type === "ontime" ? "#185fa5" : "#3b6d11", padding: "2px 7px", borderRadius: 8, fontWeight: 500, whiteSpace: "nowrap" }}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: Delay Causes */}
        {tab === "causes" && (
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Delay cause breakdown for current filter selection</div>
            {causes.length === 0 && <div style={{ fontSize: 12, color: "#aaa" }}>No delay causes recorded.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {causes.map(({ c, n, pct }) => (
                <div key={c} style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c}</span>
                    <span style={{ fontSize: 12, color: "#a32d2d", fontWeight: 500 }}>{n} times ({pct}%)</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "#eee", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#a32d2d", borderRadius: 3 }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 11, color: "#bbb", textAlign: "center" }}>
          Print Media Operations · Edition Release Tracker · {data.length} records
        </div>
      </div>
    </div>
  );
}

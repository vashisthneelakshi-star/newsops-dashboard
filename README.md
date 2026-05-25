# Edition Release Tracker — Deployment Guide

## Step-by-step Vercel Deployment

### 1. GitHub pe project upload karo (free)
1. https://github.com pe jaao, nayi free account banao (agar nahi hai)
2. "New Repository" click karo
3. Name rakho: `edition-tracker`
4. "Create repository" click karo
5. Is folder ke saare files upload karo (drag & drop works)

### 2. Vercel pe deploy karo (free)
1. https://vercel.com pe jaao
2. "Sign Up with GitHub" se login karo
3. "Add New Project" click karo
4. `edition-tracker` repository select karo
5. Settings automatically detect ho jaayenge (Vite framework)
6. **"Deploy" click karo** — bas itna!

### 3. Live URL milega
- Format: `https://edition-tracker-yourname.vercel.app`
- Yeh URL sabke liye open hoga — laptop, mobile, tablet sab pe

---

## Daily CSV Sheet Format

Aapka daily sheet is format mein hona chahiye:

```
Month,Date,State,Branch,Edition,Pullout,Schedule Time,Release Time,Delay Cause
May,2026-05-25,Rajasthan,Jaipur,City Morning,Metro Plus,04:00,04:35,Plate making delay
May,2026-05-25,Maharashtra,Mumbai,Bombay Metro,Supplement,03:30,03:45,Press breakdown
```

- Date format: YYYY-MM-DD (e.g., 2026-05-25)
- Time format: HH:MM (24-hour, e.g., 04:30)
- Delay Cause: blank chhod sakte ho agar delay nahi tha

---

## Features
- Daily / Monthly / Quarterly / Half-Yearly reports
- State-wise & Branch-wise filtering
- Drill-down: state card pe click karo
- Top 10 Late editions (with cause)
- Top 10 Early / On-Time editions  
- Delay cause analysis with bar chart
- CSV import (daily sheet upload)
- CSV export (filtered data download)
- Mobile responsive

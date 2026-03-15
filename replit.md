# BEML FRACAS & RAMS System — RS-3R Rolling Stock

## Overview

A complete FRACAS (Failure Reporting and Corrective Action System) and RAMS (Reliability, Availability, Maintainability and Safety) application for **BEML RS-3R Rolling Stock** fleet management — KMRC Project, Kolkata.

Based on:
- BEML RAMS Plan GR/TD/3457 Rev 1
- KMRCL RS(3R) Technical Specification
- BEML Job Card Format FM/RS/PPIO/01/01
- PTS for DBMS/FRACAS Module Rev01
- Withdrawal Scenario document BEML/RS(3R)/TC/Withdrawal Scenario/718

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui (artifacts/fracas-rams)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **Forms**: react-hook-form + zod
- **CSV I/O**: PapaParse
- **Auth**: Context-based with localStorage persistence (hardcoded BEML users)
- **AI**: Gemini AI via Replit AI Integrations (no external API key needed) — RAMS analysis chatbot

## Authentication

Login page with BEML-branded UI. All sessions stored in localStorage.

Users:
- `BEML/ADMIN/001` — SHASHI SHEKHAR MISHRA (Admin, passcode: 9799494321)
- `BEML/70147` — AKHILESH KUMAR YADAV (Engineer, pw: AKHILESH@1234)
- `BEML/70153` — CHANDAN KUMAR (Engineer, pw: CHANDAN@1234)
- `BEML/DEO/001` — KAUSHIK MONDAL (Data Entry, pw: KAUSHIK@1234)
- `BEML/OFFICER/001` — ARAGHYA KAR (Officer, pw: ARAGHYA@1234)
- `BEML/OFFICER/002` — SHILPA SAHU (Officer, pw: SHILPA@1234)
- `BEML/OFFICER/003` — SHIRSHENDU MAJUMDAR (Officer, pw: SHIRSHENDU@1234)
- `BEML/OFFICER/004` — SUNIL KUMAR RAJAN (Officer, pw: SUNIL@1234)
- `BEML/OFFICER/005` — SOORAJ SURESH (Officer, pw: SOORAJ@1234)

## Real Data

- **3,132 unique job cards** from `BEML_Master_Job_card_details_as_on_05.03.26_(TS#01_to_14)` CSV
  - CSV uses `_` (underscore) as a checkbox/mark for withdrawal and delay fields
  - Fixed `normBool()` to handle `_` → true (critical for RAMS service failure calculation)
- **928 NCR records** imported from `NCRs_master_list_as_on_date_11.02.26` CSV (933 imported, 5 were duplicates updated)
  - 897 NCRs with train numbers, 896 with sub-system
- **Train sets**: TS01–TS14 (MR601–MR614)
- **Fleet KM**: 2,058,001 km (from max odometer per train set)
- **Date range**: Aug 2023 – Mar 2026
- **RAMS Actual (as of Mar 2026)**: MDBF=12,549km | MTTR=396min | Availability=90.70%
  - 163 withdrawals, 164 delays (service failures = 164 unique events)

Import script: `scripts/import-beml-jobcards.mjs`
Re-import command: `node scripts/import-beml-jobcards.mjs`

## Application Features

### FRACAS Module (Job Cards)
- Full BEML job card list with pagination (50/page), FRACAS#, JC#, Issued To, Train/Car, System, KM columns
- Click any row to open full **job card print view** matching FM/RS/PPIO/01/01 format (Parts A–H)
- **Print / Save PDF** button generates formatted BEML job card in new window
- Filters: Depot, Train Set, System, Order Type (CM/PM/OPM), Status, Class, Date Range
- Import CSV: BEML-format multi-header CSV files
- Export CSV: All 50+ fields
- Create/Edit job card form with all BEML fields

### RAMS Module (Dashboard & Reports)
- **Dashboard**: Live KPI cards — MDBF, MTTR, Availability with target compliance
- **MDBF calculation**: Fleet KM (sum of max odometer per trainSet) / CM failures
  - Fleet KM = 2,058,001 km from real job card odometer data
  - CM failures from orderType='CM' as service-affecting proxy
- **MTTR**: Average repair duration from job cards with repair time (1,541 records, ~396 min avg)
- **Availability**: (Scheduled hours - downtime) / scheduled hours = 98.38%
- **Monthly trend chart**: 18 months of failure data
- **System breakdown bar chart**: Top 10 systems by job card count
- **Train set bar chart**: TS01–TS14 distribution
- Detailed MDBF, MDBCF, MTTR, Availability, Pattern Failure reports (separate pages)

### NCR Management
- Create/Edit NCR records with full BEML fields
- **Print NCR as PDF**: Opens formatted NCR document in new window
- Import NCRs from CSV (auto-mapped column headers)
- Export NCR list to CSV

### Fleet Management
- Train fleet table with status
- Fleet distance tracking (manually entered KM records)
- KMRC RS-3R specific train numbering (MR601–MR614 → TS01–TS14)

### EIR (Engineering Incident Report)
- Full EIR format: EIR No., Applicable To (RS3R), Depot (MNSD), Status (OPEN/IN PROGRESS/CLOSED)
- Fields: Train Set, Car, Equipment, Event Time, Temperature, Location, Incident Date/Details
- Actions: Depot/Main Line/Further; Distribution checkboxes; System Hierarchy
- Other Details: Repercussion, History, Investigation Cause, Concern, Conclusion
- Full view modal; export CSV; action menus (Edit/View/Delete)

### RSOI (Rolling Stock Open Issues)
- RSOI No., Failure Detected JC, Status (OPEN/IN PROGRESS/CLOSE)
- Fields: datetime, Investigation Report Received/O&M Sent checkboxes, Type (ELEC/MECH/S&T)
- Refs, System Hierarchy, Comments
- Cyclic Check Related Job Cards table with inline add-row feature
- Action menus (View/Edit/Delete)

### DLP Items Register
- Defect Liability Period tracking with automatic alarm (expired/critical/warning/ok)
- Fields: Item, Part No., System, Subsystem, Train, Qty, DLP Expiry, Vendor, NCR Count
- Alarm system: auto-toast on load for expired items; Alarm ON/OFF toggle
- **3 Views**: All Items (with filters), By System (grouped), By Vendor (grouped)
- **Import CSV**, Export CSV, Edit item, Delete item actions
- DLP period progress bar; alarm-level color coding in table rows

### Store Inventory
- Full spare parts register: Part No., System, Category, Qty, Min Qty, Location, Vendor, Unit Cost
- Status: OK / Low / Critical (auto-determined from qty vs minQty)
- **Import CSV**, Export CSV, **Print Store Report** (A4 printable with signature blocks)
- **Edit Item**, **Adjust Stock** (Issue/Receive transactions), Delete item
- Action dropdown menus per row
- Low stock alert banner; inventory value calculation (₹)

### Tools Management
- Full tool register: Tool ID, Name, Tool No., Category, Location, Condition, Calibration Due
- Calibration overdue/due-soon alert banner
- **Import CSV**, Export CSV, **Edit Tool**, **Delete Tool**
- **Issue Tool** / **Return Tool** inline workflow (assigns tool to user)
- Action dropdown menus; condition filter; availability tracking

### Gate Pass Management
- GP No., Date, Type (Out/In), Train, Car, Item Description, Part No., Sr. No., Destination
- Status management: Open → Closed (with return date)
- **View Details** modal; **Edit Gate Pass**; **Mark Closed**; **Print** (A5 landscape format)
- Export CSV; action dropdown menus per row

## Key Files

```
artifacts/api-server/src/routes/
  failures.ts          — Job card CRUD + import/export + stats
  reports.ts           — RAMS calculations (MDBF/MDBCF/MTTR/Availability/Pattern)
  ncr.ts               — NCR CRUD + import
  
artifacts/fracas-rams/src/pages/
  dashboard.tsx         — RAMS dashboard with KPI cards + charts
  job-cards/
    index.tsx           — Job card list, import, export, filters
    job-card-print.tsx  — Full BEML job card print view (Parts A–H)
    job-card-form.tsx   — Create/edit job card form
  ncr/
    index.tsx           — NCR list + print + CSV import/export
    ncr-form.tsx        — NCR create/edit form
  reports/index.tsx     — Detailed RAMS reports

lib/db/src/schema/
  failures.ts           — ~100 column job card schema
  
scripts/
  import-beml-jobcards.mjs  — BEML CSV → PostgreSQL import script
```

## RAMS Targets (RS-3R Contract)

| Metric | Target | Current |
|--------|--------|---------|
| MDBF | ≥ 30,000 km | 8,039 km (CM failures proxy) |
| MTTR | ≤ 240 min | 396 min |
| Availability | ≥ 95% | 98.38% |

Note: MDBF uses CM orderType as service-failure proxy since raw data lacks explicit service-failure classification.

## Important Commands

```bash
# Re-import BEML job cards from CSV
node scripts/import-beml-jobcards.mjs

# DB schema push (if schema changes)
pnpm --filter @workspace/db run push-force

# Start servers
pnpm --filter @workspace/api-server run dev  # port 8080
pnpm --filter @workspace/fracas-rams run dev  # port 21360
```

## API Endpoints

- `GET /api/failures` — list all job cards (with filters: trainId, system, failureClass, startDate, endDate, depot, status, trainSet, orderType)
- `POST /api/failures` — create job card
- `GET /api/failures/stats` — aggregated stats by system/trainSet/month
- `POST /api/failures/import` — bulk import (records[], clearFirst?)
- `GET /api/failures/export` — export all
- `GET /api/reports/summary` — RAMS dashboard data
- `GET /api/reports/mdbf` — MDBF report
- `GET /api/reports/mdbcf` — MDBCF report
- `GET /api/reports/mttr` — MTTR report
- `GET /api/reports/availability` — Availability report
- `GET /api/reports/pattern-failures` — Pattern failure analysis
- `GET/POST/PUT/DELETE /api/ncr` — NCR management
- `POST /api/ncr/import` — bulk NCR import

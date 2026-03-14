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

## Application Features

### FRACAS Module (Job Cards)
- Full BEML job card form: Parts A–F matching FM/RS/PPIO/01/01 format
- 30+ fields: Depot, Order Type (CM/PM/OPM), Train Set (TS01–TS17), Car No (DMC1/TC1/MC1/MC2/TC2/DMC2)
- Failure Occurred Date/Time, Depot Arrival Date/Time, Expected Complete Date/Time
- Work Pending, Can Be Energized, Can Be Moved, Withdrawal, Delay toggles
- Service Distinction (6 types), Delay Duration, Service Checks (PM only)
- SIC Required / Power Block Required flags
- Part In/Out Serial Numbers, Root Cause, Corrective Action
- Auto-generated JC numbers (JC-YYYYMM-####)
- Fixed CSV import with full BEML column mapping (20+ column aliases)
- CSV export with all BEML fields
- CSV template download
- Advanced filter panel: Depot, TrainSet, System, Status, Class
- System taxonomy: 14 systems, 50+ subsystems

### NCR Module
- Full Non-Conformity Report format matching BEML NCR template
- NCR number auto-generation (NCR-BEML-RS3R-YYYYMM-###)
- Fields: Vehicle, Product, Assembly Drawing, Supplier, Detection, Severity (Major/Minor)
- Material status, Part/Assembly serial numbers, Distribution list
- Cause of Non-Conformity, Correction Actions, Decision (7 types)
- Linked to Job Card numbers
- Status tracking: Open → Under Investigation → Corrective Action → Closed
- Summary stats dashboard panel
- CSV export

### RAMS Calculations
- **MDBF** = Total Fleet Distance / Total Service Failures (target: 30,000 km)
- **MDBCF** = (Total Fleet Distance × Population) / Component Failures by system
- **MTTR** = Total Repair Time / Number of Repairs (target: 240 minutes)
- **Availability** = (Scheduled Hours − Unavailable Hours) / Scheduled Hours (target: 95%)
- **Pattern Failure** = 3+ occurrences of same part AND (rate ≥20% above predicted OR ≥20% fleet affected) in 18-month rolling window

### Dashboard
- Live MDBF, MTTR, Availability, Open Job Cards KPI cards
- MDBF monthly trend chart vs 30,000 km target
- Failures by system pie chart
- Recent job cards table

### Fleet Management
- Train registry (RS-3R-01 to RS-3R-17+)
- Daily/cumulative distance recording per train

### Withdrawal Scenarios
- Reference page for all withdrawal conditions (W01–W16)

## API Endpoints (all under /api)

- GET/POST /trains
- GET/POST /failures, GET/PUT/DELETE /failures/:id
- POST /failures/import, GET /failures/export
- GET/POST /fleet-distances
- GET/POST /ncr, GET/PUT/DELETE /ncr/:id
- GET /reports/mdbf, /reports/mdbcf, /reports/mttr, /reports/availability
- GET /reports/pattern-failures, /reports/summary

## Database Tables

- `trains` — Fleet registry
- `failures` — Full BEML job card records (50+ columns)
- `fleet_distances` — Cumulative distance records per train
- `ncr` — Non-Conformity Reports

## DB Migration

Run: `pnpm --filter @workspace/db run push-force`

## Structure

```text
├── artifacts/
│   ├── api-server/src/routes/     # trains, failures, reports, fleet_distances, ncr
│   └── fracas-rams/src/
│       ├── contexts/auth-context  # Auth with BEML users
│       ├── pages/
│       │   ├── login.tsx          # BEML login page
│       │   ├── dashboard.tsx      # KPI + charts
│       │   ├── job-cards/         # FRACAS job card management
│       │   ├── ncr/               # NCR management
│       │   ├── reports/           # RAMS reports (tabbed)
│       │   ├── fleet/             # Fleet management
│       │   └── scenarios.tsx      # Withdrawal scenarios
│       └── lib/taxonomy.ts        # Systems, depots, train sets, car numbers
├── lib/
│   ├── api-spec/                  # OpenAPI spec + Orval codegen
│   ├── api-client-react/          # Generated React Query hooks
│   ├── api-zod/                   # Generated Zod schemas
│   └── db/src/schema/             # trains, failures, fleet_distances, ncr
```

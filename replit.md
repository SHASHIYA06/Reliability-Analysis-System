# FRACAS & RAMS System — KMRC Rolling Stock

## Overview

A complete FRACAS (Failure Reporting and Corrective Action System) and RAMS (Reliability, Availability, Maintainability and Safety) calculation application for KMRC RS(3R) Rolling Stock fleet management.

Based on:
- BEML RAMS Plan GR/TD/3457 Rev 1
- KMRC RS(3R) Technical Specification
- Withdrawal Scenario document (BEML/RS(3R)/TC/Withdrawal Scenario/718)

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

## Application Features

### FRACAS Module (Job Cards)
- Create, Read, Update, Delete failure reports (job cards)
- Auto-generated job card numbers (JC-YYYYMM-####)
- Failure classification: Relevant, Non-Relevant, Service Failure
- System/Subsystem taxonomy per KMRC spec (12 systems, 30+ subsystems)
- Withdrawal scenario mapping
- Import/Export job cards as CSV or JSON
- Filter by train, system, date range, failure class

### RAMS Calculations
- **MDBF** = Total Fleet Distance / Total Service Failures (target: 30,000 km)
- **MDBCF** = (Total Fleet Distance × Population) / Component Failures (by system)
- **MTTR** = Total Repair Time / Number of Repairs (target: 240 minutes)
- **Availability** = (Scheduled Hours − Unavailable Hours) / Scheduled Hours (target: 95%)
- **Pattern Failure** = 3+ occurrences of same part AND (rate ≥20% above predicted OR ≥20% fleet affected) in 18-month rolling window

### Dashboard
- Live summary cards for MDBF, MTTR, Availability, Open Job Cards
- MDBF monthly trend chart
- Failures by system pie chart
- Compliance indicators (On Target / Off Target) vs KMRC requirements

### Fleet Management
- Add/manage trains in fleet
- Record cumulative and daily running distances per train
- Fleet status tracking (Active, Maintenance, Withdrawn)

### Withdrawal Scenarios
- Reference page for all KMRC withdrawal conditions (31 scenarios)
- Categorized by system

## API Endpoints (all under /api)

- GET/POST /trains
- GET/POST /failures, GET/PUT/DELETE /failures/:id
- POST /failures/import, GET /failures/export
- GET/POST /fleet-distances
- GET /reports/mdbf
- GET /reports/mdbcf
- GET /reports/mttr
- GET /reports/availability
- GET /reports/pattern-failures
- GET /reports/summary

## Database Tables

- `trains` — Fleet registry
- `failures` — Failure reports (job cards)
- `fleet_distances` — Cumulative distance records per train

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API backend
│   │   └── src/routes/     # trains.ts, failures.ts, reports.ts, fleet_distances.ts
│   └── fracas-rams/        # React + Vite frontend
│       └── src/pages/      # dashboard, job-cards, reports, fleet, scenarios
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/
│       └── src/schema/     # trains.ts, failures.ts, fleet_distances.ts
```

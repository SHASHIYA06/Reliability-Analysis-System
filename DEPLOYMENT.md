# BEML FRACAS & RAMS — Deployment Guide

## Architecture Overview

```
GitHub (source)  →  Vercel (frontend)  +  Render (backend API)  +  Neon (database)
```

| Component | Service | Notes |
|-----------|---------|-------|
| Frontend (React + Vite) | **Vercel** | Auto-deploys from GitHub |
| Backend API (Express) | **Render** | Free tier available |
| Database (PostgreSQL) | **Neon** | Serverless Postgres, free tier |
| AI (Gemini) | **Google AI Studio** | Free API key |

---

## Step 1 — Database Setup (Neon)

1. Go to **https://neon.tech** → Sign up / Login
2. Create a new project: `fracas-rams`
3. Copy the **Connection String (pooled)** — it looks like:
   ```
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/fracas_rams?sslmode=require
   ```
4. Save this as `DATABASE_URL` — you'll need it in Step 2 and Step 3

### Initialize the database schema
After deploying the backend (Step 2), run this once to create all tables:
```bash
# From your local machine or Replit terminal
DATABASE_URL="your_neon_connection_string" pnpm --filter @workspace/db run push-force
```

---

## Step 2 — Backend API Deployment (Render)

1. Go to **https://render.com** → Sign up / Login with GitHub
2. Click **New** → **Web Service** → Connect your GitHub repo (`Reliability-Analysis-System`)
3. Configure:
   - **Name**: `fracas-rams-api`
   - **Region**: Singapore (or nearest to you)
   - **Branch**: `master`
   - **Build Command**: `pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server run build`
   - **Start Command**: `node artifacts/api-server/dist/index.cjs`
   - **Plan**: Free

4. Add **Environment Variables** in Render dashboard:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | `postgresql://...` (from Neon Step 1) |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (set after Step 3) |
   | `AI_INTEGRATIONS_GEMINI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta` |
   | `AI_INTEGRATIONS_GEMINI_API_KEY` | Your key from https://aistudio.google.com/apikey |

5. Click **Create Web Service** — note your Render URL: `https://fracas-rams-api.onrender.com`

---

## Step 3 — Frontend Deployment (Vercel)

1. Go to **https://vercel.com** → Sign up / Login with GitHub
2. Click **Add New → Project** → Import `Reliability-Analysis-System` from GitHub
3. Vercel auto-detects settings from `vercel.json`. Verify:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm install --no-frozen-lockfile && pnpm --filter @workspace/fracas-rams run build`
   - **Output Directory**: `artifacts/fracas-rams/dist/public`
   - **Install Command**: `pnpm install --no-frozen-lockfile`

4. Add **Environment Variables** in Vercel dashboard:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `BASE_PATH` | `/` |
   | `VITE_API_URL` | `https://fracas-rams-api.onrender.com` (from Step 2) |

5. Click **Deploy**
6. After deploy, copy your Vercel URL: `https://fracas-rams.vercel.app`

7. Go back to **Render** → Your service → **Environment** → Update `ALLOWED_ORIGINS` to your Vercel URL

---

## Step 4 — Gemini AI Key

1. Go to **https://aistudio.google.com/apikey**
2. Click **Create API Key**
3. Add to both Render (`AI_INTEGRATIONS_GEMINI_API_KEY`) environment variables

---

## Step 5 — GitHub Push

To push this code to GitHub for the first time:

```bash
# In Replit terminal or locally
git remote add github https://github.com/SHASHIYA06/Reliability-Analysis-System.git
git push github master
```

If prompted for credentials, use your GitHub **Personal Access Token** (not password):
- Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
- Generate new token with `repo` scope
- Use it as the password when prompted

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/SHASHIYA06/Reliability-Analysis-System.git
cd Reliability-Analysis-System

# Copy env files
cp .env.example .env
cp artifacts/fracas-rams/.env.example artifacts/fracas-rams/.env
cp artifacts/api-server/.env.example artifacts/api-server/.env

# Edit .env files with your actual values
# Then install dependencies
pnpm install

# Start the API server (terminal 1)
pnpm --filter @workspace/api-server run dev

# Start the frontend (terminal 2)
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/fracas-rams run dev
```

---

## Environment Variables Reference

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Backend API URL (e.g. `https://fracas-rams-api.onrender.com`) |
| `BASE_PATH` | Yes | Always `/` for Vercel |
| `NODE_ENV` | Yes | `production` |

### Backend (Render)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `PORT` | Yes | `10000` for Render |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend URLs |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Yes | Google Gemini API key |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Yes | `https://generativelanguage.googleapis.com/v1beta` |

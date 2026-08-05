# Mwenje AI Tutor — Deployment TODO

## ✅ Completed
- [x] Created `railway.json` (build/deploy config)
- [x] Created `backend/Procfile` (start command)
- [x] Added `start` script to `backend/package.json`
- [x] Created `.railwayignore` (excludes node_modules/.env/build artifacts)
- [x] Created `DEPLOYMENT.md` (step-by-step guide)
- [x] Fixed Node.js version issue (Railway defaulted to Node 18; Next.js 16 needs ≥20.9)
  - [x] `.node-version` (20.19.0) at repo root, frontend/, backend/
  - [x] `nixpacks.toml` (nodejs_20)
  - [x] `engines.node >=20.9.0` in all package.json files
- [x] **Backend deployed successfully on Railway** ✅
- [x] **Frontend deployed successfully on Railway** ✅

## ✅ Live Configuration
- [x] **MySQL database provisioned** on Railway (mysql:9.4, volume attached)
  - DB_HOST=mysql.railway.internal, DB_USER=root, DB_NAME=railway
- [x] **Backend env vars set**: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, FRONTEND_ORIGIN, PORT=3000, NODE_ENV=production
- [x] **Frontend env vars set**: NEXT_PUBLIC_API_URL=https://mwenje-backend-production.up.railway.app, PORT=3000
- [x] **Port configured** to 3000 on both services
- [x] **Backend redeployed** (SUCCESS) with DB + env vars
- [x] **Frontend redeployed** (SUCCESS) with NEXT_PUBLIC_API_URL

## ✅ Verification
- [x] Backend `/health` → `{status:"ok", service:"mwenje-backend"}`
- [x] Frontend → HTTP 200, title contains "Mwenje"
- [x] Backend `/subjects` → returns 9 subjects
- [x] **Sign-up works** → created user id=1 in MySQL (DB connection confirmed)

## 🔲 Optional next steps
- [ ] Set `CLAUDE_API_KEY` on backend for real AI responses (currently falls back to stub mode)
- [ ] Point a custom domain at the Railway services
- [ ] Replace the placeholder JWT_SECRET with a strong random value
</content>

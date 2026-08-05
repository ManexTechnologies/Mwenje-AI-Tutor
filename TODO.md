# Mwenje AI Tutor — Deployment TODO

## ✅ Completed (config files created)
- [x] Created `railway.json` (build/deploy config)
- [x] Created `backend/Procfile` (start command)
- [x] Added `start` script to `backend/package.json`
- [x] Created `.railwayignore` (excludes node_modules/.env/build artifacts)
- [x] Created `DEPLOYMENT.md` (step-by-step guide)
- [x] Verified backend build → `backend/dist/index.js`
- [x] Verified frontend build → all 20 routes compiled
- [x] **Fixed Node.js version issue** — Railway was using Node 18 (build failed: Next.js 16 requires Node ≥20.9)
  - [x] Added `.node-version` (20.19.0)
  - [x] Added `nixpacks.toml` (node provider version 20.19.0)
  - [x] Added `engines.node >=20.9.0` to root, frontend, backend package.json

## 🔲 Manual steps required in Railway dashboard
- [ ] Commit & push the Node version fix to GitHub `ManexTechnologies/Mwenje-AI-Tutor`
- [ ] Redeploy the backend service (pull latest)
- [ ] Redeploy the frontend service (pull latest)
- [ ] Verify backend `/health` returns `{status:"ok"}`
- [ ] Verify frontend loads and sign-up/login/quiz flow works
- [ ] Confirm data persists across restarts (MySQL connected)

## Railway service config (already set up in dashboard)
- Backend service: root dir repo root, start `npm --workspace=backend run start`
  - env: PORT=4000, NODE_ENV=production, DB_*, JWT_SECRET, FRONTEND_ORIGIN, CLAUDE_API_KEY(optional)
- Frontend service: root dir `frontend`, start `npm run start`
  - build env: NEXT_PUBLIC_API_URL=https://<backend>.up.railway.app

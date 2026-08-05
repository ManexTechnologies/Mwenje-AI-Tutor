# Mwenje AI Tutor — Deployment TODO

## ✅ Completed (config files created)
- [x] Created `railway.json` (build/deploy config)
- [x] Created `backend/Procfile` (start command)
- [x] Added `start` script to `backend/package.json`
- [x] Created `.railwayignore` (excludes node_modules/.env/build artifacts)
- [x] Created `DEPLOYMENT.md` (step-by-step guide)
- [x] Verified backend build → `backend/dist/index.js`
- [x] Verified frontend build → all 20 routes compiled

## 🔲 Manual steps required in Railway dashboard
- [ ] Push latest changes to GitHub `ManexTechnologies/Mwenje-AI-Tutor`
- [ ] Create Railway project
- [ ] Add MySQL plugin (copy connection vars)
- [ ] Create Backend service (root dir: repo root, start: `npm --workspace=backend run start`)
  - [ ] Set env: PORT=4000, NODE_ENV=production
  - [ ] Set env: DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME (or DATABASE_URL)
  - [ ] Set env: JWT_SECRET (random string)
  - [ ] Set env: FRONTEND_ORIGIN = https://<frontend>.up.railway.app
  - [ ] Optional: CLAUDE_API_KEY
- [ ] Create Frontend service (root dir: `frontend`, start: `npm run start`)
  - [ ] Set build env: NEXT_PUBLIC_API_URL = https://<backend>.up.railway.app
- [ ] Deploy backend, verify `/health` returns `{status:"ok"}`
- [ ] Deploy frontend, verify sign-up/login/quiz flow
- [ ] Confirm data persists across restarts (MySQL connected)

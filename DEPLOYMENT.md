# Mwenje AI Tutor — Railway Deployment Guide

This guide walks you through deploying **Mwenje AI Tutor** to [Railway](https://railway.app) with three services:

| Service | Tech | Purpose |
|---------|------|---------|
| **Frontend** | Next.js 14 | User-facing web app (port 3000) |
| **Backend** | Express + TypeScript | REST API / AI tutor (port 4000) |
| **MySQL** | Railway plugin | Persistent data store |

Your GitHub repo: `https://github.com/ManexTechnologies/Mwenje-AI-Tutor`

---

## 1. Prerequisites

- A [Railway](https://railway.app) account
- Push this project to your GitHub repo if not already there:

> ⚠️ **Node.js version requirement**: Next.js 16 requires **Node.js ≥ 20.9.0**.
> This repo pins Node via `.node-version` (20.19.0), `nixpacks.toml`, and `engines` fields in all `package.json` files. If builds fail with `Node.js 18.20.5 is required`, confirm these files are committed to the repo.

```bash
git add .
git commit -m "Add Railway deployment config"
git push origin main
```

---

## 2. Create the MySQL database

1. In Railway, create a **New Project**.
2. Click **+ New** → **Database** → **MySQL**.
3. Once provisioned, open the MySQL service → **Variables** tab.
4. Copy the connection details. Railway will create variables like:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
   - Or a `DATABASE_URL` connection string.

> The schema (7 tables) is **auto-created automatically** on backend startup via `ensureMysqlSchema()`. No manual SQL import is needed.

---

## 3. Create the Backend service

1. Click **+ New** → **GitHub Repo** → select `ManexTechnologies/Mwenje-AI-Tutor`.
2. Railway will detect the project. Set the **Root Directory** appropriately (see Step 5).
3. Configure the **start command**: `npm --workspace=backend run start`
4. Go to the **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `DB_HOST` | `${{MYSQLHOST}}` |
| `DB_PORT` | `${{MYSQLPORT}}` |
| `DB_USER` | `${{MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MYSQLPASSWORD}}` |
| `DB_NAME` | `${{MYSQLDATABASE}}` |
| `JWT_SECRET` | `a-long-random-secret-string` |
| `CLAUDE_API_KEY` | *(optional)* `sk-ant-...` |
| `FRONTEND_ORIGIN` | `https://<frontend-url>.up.railway.app` |

> Railway supports **variable references** like `${{MYSQLHOST}}` to link the MySQL values automatically.

---

## 4. Create the Frontend service

1. Click **+ New** → **GitHub Repo** → select the same repo.
2. Set the **Root Directory** to `frontend` (see Step 5).
3. Set the **Build Command**: `npm --workspace=frontend run build`
4. Set the **Start Command**: `npm --workspace=frontend run start`
5. Add the **build variable**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<backend-url>.up.railway.app` |

> ⚠️ `NEXT_PUBLIC_API_URL` is **baked into the build**. It must be set before the frontend builds, and must point to the deployed backend URL (e.g. `https://mwenje-backend-production.up.railway.app`).

---

## 5. Monorepo root directory note

Because this is an **npm monorepo** with workspaces, there are two ways to configure railway.json. The simplest for Railway's auto-detection is to set the **Root Directory** per service:

- **Backend service Root Directory**: *(repo root)* — start command `npm --workspace=backend run start`
- **Frontend service Root Directory**: `frontend` — start command `npm run start`

If you prefer the root `railway.json` approach (included in this repo), set both services' root directory to the repo root and use the `startCommand` mapping below.

---

## 6. Verify the connection

1. Open the **Backend service** → **Deployments** tab → wait for success.
2. Visit the backend health endpoint: `https://<backend-url>.up.railway.app/health`
   - Expected: `{ "status": "ok", "service": "mwenje-backend" }`
3. Open the **Frontend service** URL in your browser.
4. Sign up / log in, generate a quiz, and confirm data persists.

---

## 7. Environment variables summary

| Service | Variable | Required | Notes |
|---------|----------|----------|-------|
| Backend | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | ✅ | MySQL connection |
| Backend | `JWT_SECRET` | ✅ | Auth signing secret |
| Backend | `FRONTEND_ORIGIN` | ✅ | CORS allowlist for frontend |
| Backend | `CLAUDE_API_KEY` | ❌ | Falls back to stub mode if absent |
| Backend | `PORT` | ✅ | `4000` |
| Frontend | `NEXT_PUBLIC_API_URL` | ✅ | Backend URL (build-time) |

---

## Troubleshooting

### `ECONNREFUSED` / `ER_ACCESS_DENIED_ERROR`
- Confirm the backend and MySQL are in the **same Railway project** so they share the internal network.
- Verify `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` match the MySQL service.

### CORS errors in the browser
- Set `FRONTEND_ORIGIN` to the exact deployed frontend URL (no trailing slash) and redeploy the backend.

### Cookies not persisting / auth loops
- Cookie `secure:true` requires HTTPS. Railway serves HTTPS by default on `.up.railway.app`.
- SameSite is `lax`, so the frontend and backend being on different Railway subdomains still works for cookies.

### Frontend can't reach backend
- `NEXT_PUBLIC_API_URL` must be set at **build time**. Change it → trigger a new build → redeploy.

---

## Cost notes

- Railway bills per service (2 app services + 1 database) and by usage. Remove unused services or scale down to save costs.
- The MySQL plugin is a paid add-on after the trial period.

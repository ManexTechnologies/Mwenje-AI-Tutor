# Mwenje AI Tutor

Mwenje is an AI-powered learning platform for Zimbabwean high school students. It combines an AI tutor experience, adaptive quizzes, essay feedback, study planning, gamification, and progress tracking in a warm, African-modern design.

## Workspace structure

- `frontend/` — Next.js 14 App Router application with Tailwind CSS, custom design tokens, full landing page and app route scaffolding for auth, dashboard, tutor chat, quizzes, essay reviews, planner, progress, teacher view, and profile settings.
- `backend/` — Express API server with REST endpoints for auth, AI chat, quiz generation, essay feedback, study planning, progress, and leaderboard data. Includes Prisma schema scaffolding.

## Features included in this scaffold

- Landing page with product overview, subject cards, and pricing
- Sign up, log in, and forgot password screens
- Student dashboard shell with streak, XP, quick actions, and mastery progress
- AI tutor chat page mockup
- Quiz engine, essay feedback, study planner, progress tracker, teacher dashboard, and profile pages
- Backend API stubs for `/auth`, `/ai`, `/progress`, and `/leaderboard`
- Claude AI helper with fallback stub mode when `CLAUDE_API_KEY` is not configured

## Running locally

Install dependencies:
```bash
npm install
```

Run both apps locally:
```bash
npm run dev
```

Run frontend only:
```bash
npm run dev:frontend
```

Run backend only:
```bash
npm run dev:backend
```

## Backend configuration

Copy `backend/.env.example` to `backend/.env` and provide your API key and database settings. The scaffold includes placeholders for:

- `DATABASE_URL`
- `CLAUDE_API_KEY`
- `REDIS_URL`
- `FRONTEND_ORIGIN`

## Build verification

The workspace was successfully built after the frontend page and backend endpoint expansion.


# Mwenje AI Tutor TODO

This file captures the project scope from the prompt, what has been completed, and what remains to verify.

## Completed / Implemented

- [x] Frontend scaffold using Next.js 14 App Router and Tailwind CSS.
- [x] Landing page and main app route scaffolding.
- [x] Sign up, log in, and forgot password screens.
- [x] Backend Express server scaffold with REST routes.
- [x] Protected backend routes for AI, progress, and leaderboard APIs.
- [x] Frontend helper for authenticated fetch requests (ID token in Authorization header).
- [x] Navigation updated to show authenticated user name and sign-out action.
- [x] User menu with avatar/profile link instead of plain name text.
- [x] Progress persistence and leaderboard scoring backed by the protected backend API.
- [x] Unit/integration tests for auth and protected backend routes.

## Features included in scaffold

- AI tutor chat page shell.
- Quiz engine page shell.
- Essay feedback page shell.
- Study planner and progress tracker shells.
- Teacher dashboard and profile settings page shells.
- Backend routes for `/auth`, `/ai`, `/progress`, `/leaderboard`.

## Items requiring verification or follow-up

- [ ] Validate end-to-end sign-up/login flow in the running app.
- [ ] Confirm frontend navigation updates immediately after authentication.
- [ ] Add backend testing steps to README and verify local commands.
- [ ] Verify AI and content generation routes return production-ready responses or properly stubbed defaults.
- [ ] Confirm `backend/src/lib/auth.ts` can be removed once no imports depend on it.

## Optional enhancements

- [ ] Add a server-side user profile endpoint for frontend profile data.

# Mwenje AI AI4I MVP Roadmap

## Dependency Audit

- Backend stack: Express, TypeScript, MySQL, Zod, JWT, bcrypt, axios. This is sufficient for MVP APIs, validation, AI provider calls, and persistence.
- Frontend stack: Next.js App Router, React, Tailwind CSS, Chart.js. This is sufficient for the demo experience, tutor UI, quiz flow, dashboard widgets, and planner screens.
- AI layer: The backend already includes a Claude helper with fallback behavior, so the MVP can run with a real API key for better answers and still remain deployable without one.
- Data layer: The schema already covers users, profiles, progress, tutor sessions/messages, quiz results, and study plans, which reduces implementation risk.

## Highest-Impact MVP Backlog

### P0 — Demo-critical work

1. Tutor end-to-end polish
- Impact: Very high
- Effort: Medium
- Goal: Make the tutor feel like a real lesson experience with subject/form/curriculum awareness, persistent sessions, and clear fallback responses.
- Files: [backend/src/routes/tutor.ts](backend/src/routes/tutor.ts), [backend/src/lib/claude.ts](backend/src/lib/claude.ts), [frontend/app/tutor/page.tsx](frontend/app/tutor/page.tsx)
- Outcome: A student can ask a question, receive an explanation, and continue the conversation without losing context.

2. Tutor-to-quiz flow with automatic marking
- Impact: Very high
- Effort: Medium
- Goal: Turn a tutoring moment into a quiz, collect answers, mark them automatically, and update progress.
- Files: [backend/src/lib/quiz.ts](backend/src/lib/quiz.ts), [backend/src/services/progressStore.ts](backend/src/services/progressStore.ts), [frontend/app/tutor/page.tsx](frontend/app/tutor/page.tsx), [frontend/app/quiz/page.tsx](frontend/app/quiz/page.tsx)
- Outcome: The five-minute demo can move from explanation to quiz to dashboard updates without manual intervention.

3. Profile-driven personalization
- Impact: High
- Effort: Low
- Goal: Use form level, subjects, learning goals, weak areas, and preferred style to tailor tutor prompts and quiz content.
- Files: [backend/src/services/profileStore.ts](backend/src/services/profileStore.ts), [frontend/components/profile-provider.tsx](frontend/components/profile-provider.tsx), [frontend/lib/profile.ts](frontend/lib/profile.ts), [frontend/app/profile/page.tsx](frontend/app/profile/page.tsx)
- Outcome: The app feels personal rather than generic.

### P1 — Core polish and persistence

4. Progress dashboard live updates
- Impact: High
- Effort: Low
- Goal: Show XP, streak, mastery, weekly activity, and recent quiz history from real events rather than static placeholders.
- Files: [backend/src/services/progressStore.ts](backend/src/services/progressStore.ts), [frontend/app/dashboard/page.tsx](frontend/app/dashboard/page.tsx), [frontend/app/progress/page.tsx](frontend/app/progress/page.tsx)
- Outcome: Dashboard changes immediately after quiz completion.

5. Generated study planner
- Impact: High
- Effort: Low
- Goal: Replace hardcoded planner content with generated weekly plans, revision timings, and priority topics based on profile input.
- Files: [backend/src/services/studyPlanner.ts](backend/src/services/studyPlanner.ts), [frontend/app/planner/page.tsx](frontend/app/planner/page.tsx)
- Outcome: The planner feels useful for exam prep and is persisted for the student.

### P2 — Demo readiness and hardening

6. Demo data, documentation, and smoke tests
- Impact: Medium
- Effort: Low
- Goal: Seed a realistic student account, document the API surfaces, and add one reliable smoke test for the full flow.
- Files: [docs/API.md](docs/API.md), [demo-seed.sql](demo-seed.sql), [backend/src/app.test.ts](backend/src/app.test.ts)
- Outcome: The app can be demonstrated confidently without setup confusion.

## Time Estimates

- Tutor flow polish: 6-8 hours
- Quiz generation, marking, and XP/mastery updates: 4-6 hours
- Profile personalization: 2-3 hours
- Dashboard live progress display: 3-4 hours
- Study planner generation and persistence: 3-4 hours
- Tests, docs, and demo seed data: 3-4 hours

## Recommended Implementation Order

1. Finish the tutor + quiz loop.
2. Wire profile fields into tutor prompts and quiz generation.
3. Make the dashboard reflect quiz outcomes immediately.
4. Generate and save a study plan from profile data.
5. Add seed data and a one-click smoke test for the AI4I demo.

## Demo Flow Target

1. Student logs in.
2. Student selects Form 4 Mathematics.
3. Student asks: "Explain simultaneous equations using substitution."
4. AI explains with examples and curriculum context.
5. Student clicks Generate Quiz.
6. Student completes the quiz.
7. Backend marks answers, updates XP, streak, mastery, and quiz history.
8. Dashboard reflects the new progress.
9. Planner generates tomorrow's revision plan.

## Explicitly Out of Scope for AI4I v1

- Teacher dashboard backend
- Password reset and email verification
- MFA
- Offline mode
- Advanced analytics pipeline
- Payments and subscriptions

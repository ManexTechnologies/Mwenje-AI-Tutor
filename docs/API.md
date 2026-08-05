# Mwenje AI MVP API

Base URL: `http://localhost:4000`

Authenticated routes use the `mwenje_session` cookie or `Authorization: Bearer <token>`.

## Tutor

`POST /api/tutor/ask`

```json
{
  "subject": "Mathematics",
  "grade": "Form 4",
  "mode": "explain",
  "prompt": "Explain simultaneous equations using substitution.",
  "session_id": 1
}
```

Returns a persisted assistant message and `session_id`.

`GET /api/tutor/sessions`

Returns recent tutor sessions for the signed-in student.

`GET /api/tutor/sessions/:session_id`

Returns a session and its conversation history.

## Quiz

`POST /ai/quiz`

```json
{
  "subject": "Mathematics",
  "topic": "Simultaneous equations",
  "difficulty": "Core"
}
```

Returns 5 multiple-choice questions with answers and explanations.

`POST /ai/quiz/mark`

```json
{
  "quiz": { "subject": "Mathematics", "topic": "Simultaneous equations", "difficulty": "Core", "questions": [] },
  "answers": { "q1": "Option A" }
}
```

Marks the quiz, saves the result, updates XP/streak/mastery, and returns updated progress.

## Profile

`GET /profile`

Returns name, school, form level, subjects, learning goals, preferred learning style, weak areas, and examination year.

`PUT /profile`

Saves the same profile fields.

## Progress

`GET /progress`

Returns:

- `xpPoints`
- `streakDays`
- `mastery`
- `masteryAverage`
- `weeklyActivity`
- `recentQuizzes`

`POST /progress/quiz-result`

Legacy-compatible endpoint for directly saving a score.

## Study Planner

`POST /ai/planner`

```json
{
  "subjects": ["Mathematics", "Physics"],
  "weakSubjects": ["Mathematics"],
  "examDate": "2026-11-10",
  "hoursPerDay": 2
}
```

Returns and persists:

- `weeklyPlan`
- `revisionSchedule`
- `priorityTopics`

`GET /ai/planner/latest`

Returns the latest saved plan for the signed-in student.

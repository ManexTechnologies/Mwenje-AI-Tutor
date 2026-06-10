# Mwenje AI Tutor — Backend Setup Guide

This guide walks you through integrating the tutor API endpoints, database persistence, and AI session management into your backend.

## Files Created

- **`schema.sql`** (root) — MySQL database schema with 7 tables
- **`backend/src/lib/tutorSessionRepository.ts`** — Repository for managing tutor sessions and messages
- **`backend/src/lib/claude.ts`** — Enhanced AI prompt engineering with ZIMSEC curricula support
- **`backend/src/routes/tutor.ts`** — REST API endpoints for tutor interactions
- **`backend/src/index.snippet.ts`** — Reference implementation for index.ts integration
- **`backend/.env.example`** — Updated with MySQL connection variables

## Setup Steps

### 1. Prerequisites

- **MySQL 8.0+** installed and running locally
- **Node.js 18+** with npm installed
- **Claude API key** from https://console.anthropic.com/account/keys
- Basic understanding of Express.js and async/await

### 2. Database Setup

#### 2a. Create the database and tables

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mwenje;"

# Apply the schema (from project root)
mysql -u root -p mwenje < schema.sql

# Verify tables were created
mysql -u root -p mwenje -e "SHOW TABLES;"
```

#### 2b. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
# MySQL connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=mwenje

# Claude API
CLAUDE_API_KEY=sk-ant-xxxx

# JWT for session signing
JWT_SECRET=your-long-random-secret-here
```

### 3. Install Dependencies

```bash
cd backend
npm install mysql2
```

The `mysql2/promise` package is already listed in `package.json`, but ensure it's installed:

```bash
npm list mysql2
```

### 4. Update `backend/src/index.ts`

Open `backend/src/index.ts` and make these changes:

#### 4a. Add imports

```typescript
import { createPool } from 'mysql2/promise'
import { createTutorRouter } from './routes/tutor'
```

#### 4b. Create the database pool

Add this after your dotenv config:

```typescript
const db = createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mwenje',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
})

// Verify connection on startup
async function verifyDatabaseConnection() {
  try {
    const connection = await db.getConnection()
    console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME}`)
    connection.release()
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error)
    process.exit(1)
  }
}
```

#### 4c. Wire the tutor router

Inside your `createApp()` function, add the router **after** your auth middleware is set up:

```typescript
// ─── Tutor API (protected by verifySession middleware) ────
app.use('/api/tutor', verifySession, createTutorRouter(db))
```

#### 4d. Verify database on startup

Before `app.listen()`, call the verification function:

```typescript
export async function createApp() {
  // ... app setup ...
  return app
}

async function main() {
  const port = process.env.PORT || 4000
  const app = createApp()

  // Verify database before listening
  await verifyDatabaseConnection()

  app.listen(port, () => {
    console.log(`🚀 Mwenje backend listening on http://localhost:${port}`)
  })
}

if (require.main === module) {
  main().catch(console.error)
}
```

**Reference**: See `backend/src/index.snippet.ts` for a complete example.

### 5. Build and Test

#### 5a. Check for TypeScript errors

```bash
cd backend
npx tsc --noEmit
```

#### 5b. Start the backend

```bash
npm run dev
```

You should see:

```
✅ Connected to MySQL database: mwenje
🚀 Mwenje backend listening on http://localhost:4000
📚 Tutor API: http://localhost:4000/api/tutor
```

#### 5c. Test the tutor endpoint

In a new terminal, run this test request. First, get a JWT token from your login endpoint, then:

```powershell
# PowerShell example
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN_HERE"
    "Content-Type" = "application/json"
}

$body = @{
    prompt = "Explain osmosis and give me a ZIMSEC exam question on it"
    subject = "Biology"
    grade = "O Level"
    mode = "explain"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:4000/api/tutor/ask" `
    -Method POST `
    -Headers $headers `
    -Body $body | ConvertTo-Json -Depth 5
```

Or with `curl`:

```bash
curl -X POST http://localhost:4000/api/tutor/ask \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain osmosis and give me a ZIMSEC exam question on it",
    "subject": "Biology",
    "grade": "O Level",
    "mode": "explain"
  }'
```

Expected response:

```json
{
  "success": true,
  "session_id": 1,
  "message": {
    "id": 1,
    "role": "assistant",
    "content": "Osmosis is the movement of water molecules across a partially permeable membrane...",
    "created_at": "2026-06-07T12:00:00.000Z"
  },
  "session_title": "Explain osmosis and give me a ZIMSEC exam..."
}
```

### 6. API Endpoints

#### **POST /api/tutor/ask**

Ask Mwenje a question and save conversation history.

**Request:**

```json
{
  "prompt": "Explain osmosis",
  "subject": "Biology",
  "grade": "O Level",
  "mode": "explain",
  "session_id": 1
}
```

**Parameters:**

- `prompt` (required) — Student's question or prompt (1–2000 chars)
- `subject` (required) — Subject name (e.g., "Maths", "Biology", "English")
- `grade` — Grade level (default: "O Level")
- `mode` — Response type: `explain`, `exam_practice`, `essay_feedback`, `quiz`, `general` (default: "explain")
- `session_id` (optional) — Existing session ID to continue conversation; if omitted, creates a new session

**Response:**

```json
{
  "success": true,
  "session_id": 1,
  "message": {
    "id": 1,
    "role": "assistant",
    "content": "...",
    "created_at": "2026-06-07T12:00:00.000Z"
  },
  "session_title": "..."
}
```

#### **GET /api/tutor/sessions**

Get all tutor sessions for the current user.

**Query parameters:**

- `limit` — Number of sessions (default: 20, max: 100)

**Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "subject": "Biology",
      "grade": "O Level",
      "mode": "explain",
      "title": "Explain osmosis and give me a ZIMSEC exam...",
      "created_at": "2026-06-07T12:00:00.000Z"
    }
  ]
}
```

#### **GET /api/tutor/sessions/:session_id**

Get a specific session with all its messages.

**Response:**

```json
{
  "success": true,
  "session": {
    "id": 1,
    "subject": "Biology",
    "grade": "O Level",
    "mode": "explain",
    "title": "Explain osmosis...",
    "created_at": "2026-06-07T12:00:00.000Z",
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "Explain osmosis",
        "created_at": "2026-06-07T12:00:00.000Z"
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "Osmosis is...",
        "created_at": "2026-06-07T12:00:01.000Z"
      }
    ]
  }
}
```

#### **DELETE /api/tutor/sessions/:session_id**

Delete a tutor session and all its messages.

**Response:**

```json
{
  "success": true
}
```

#### **GET /api/tutor/stats**

Get tutor usage statistics for the current user.

**Response:**

```json
{
  "success": true,
  "stats": {
    "total_sessions": 5,
    "total_messages": 23,
    "subjects": ["Biology", "Chemistry", "Maths"]
  }
}
```

## Troubleshooting

### MySQL connection fails

```
❌ Failed to connect to MySQL: Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**

1. Verify MySQL is running:
   ```bash
   mysql -u root -p -e "SELECT 1;"
   ```

2. Check your `.env` variables match your MySQL setup:
   ```bash
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=yourpassword
   ```

3. Create the database if it doesn't exist:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mwenje;"
   ```

### TypeScript errors on `mysql2`

```
Cannot find module 'mysql2/promise'
```

**Solution:** Install the package:

```bash
npm install mysql2 --save
npm install @types/node --save-dev
```

### Claude API returns an error

If you see `"Unable to reach the AI tutor service right now"`, check:

1. Is `CLAUDE_API_KEY` set correctly in `.env`?
2. Is your Claude API key valid and active?
3. Are you within your API quota?

### User is not authenticated

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Solution:** Make sure you're including a valid JWT token in the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get a token by calling `/api/auth/login` first.

## Next Steps

1. **Wire the frontend** — Update `frontend/app/tutor/page.tsx` to call `/api/tutor/ask`
2. **Add subscription limits** — Check `subscriptions` table before allowing requests
3. **Add rate limiting** — Use Redis or a simple in-memory cache
4. **Add essay review storage** — Extend the schema with an `essay_reviews` table
5. **Monitor logs** — Use `console.log` or a logging library like `winston`

## Additional Resources

- [Claude API Docs](https://docs.anthropic.com)
- [MySQL Node.js Driver](https://github.com/mysqljs/mysql2)
- [Express.js Guide](https://expressjs.com)
- [Zod Validation](https://zod.dev)

---

**Happy tutoring!** 🎓

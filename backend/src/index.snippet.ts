/**
 * ═══════════════════════════════════════════════════════════════
 * index.snippet.ts — Database and Router Integration
 * ═══════════════════════════════════════════════════════════════
 *
 * This file shows how to integrate the database pool and tutor router
 * into your Express app. Use this as a reference to update backend/src/index.ts
 *
 * STEPS:
 * 1. Copy the import statements and create the pool
 * 2. Update app.ts or index.ts to include the database pool and router
 * 3. Ensure verifySession/authMiddleware is set up first
 */

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { createPool } from 'mysql2/promise'

// ─── Existing imports ───────────────────────────────────────────────
import { generateFlashcardDeck } from './lib/flashcards'
import { askClaude } from './lib/claude'
import { generatePracticeQuestions } from './lib/practice'
import { generateQuiz } from './lib/quiz'
import { clearSessionCookie, setSessionCookie, signSession } from './lib/session'
import { verifySession } from './middleware/verifySession'
import { createUser, validateLogin } from './services/authStore'

// ─── NEW: Database and tutor router imports ──────────────────────
import { createTutorRouter } from './routes/tutor'

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

// ─── NEW: Create MySQL connection pool ──────────────────────────
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

/**
 * Verify database connection on startup
 */
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

/**
 * Create and configure the Express app
 */
export function createApp() {
  const app = express()

  // ─── Middleware ─────────────────────────────────────────────────
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' }))
  app.use(express.json())

  // ─── Existing routes ────────────────────────────────────────────
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, name } = req.body
      const user = await createUser(email, password, name)
      res.json({ success: true, user })
    } catch (error) {
      res.status(400).json({ success: false, error: String(error) })
    }
  })

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body
      const user = await validateLogin(email, password)
      const sessionToken = signSession(user.id)
      setSessionCookie(res, sessionToken)
      res.json({ success: true, user, sessionToken })
    } catch (error) {
      res.status(401).json({ success: false, error: String(error) })
    }
  })

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(res)
    res.json({ success: true })
  })

  // ─── AI tutor routes (protected by verifySession middleware) ────
  app.use('/api/tutor', verifySession, createTutorRouter(db))

  // ─── Existing AI routes ──────────────────────────────────────────
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { prompt, subject } = req.body
      const response = await askClaude(prompt, subject)
      res.json({ success: true, response })
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) })
    }
  })

  app.post('/api/quiz/generate', async (req, res) => {
    try {
      const { subject, topic, numQuestions } = req.body
      const quiz = await generateQuiz(subject, topic, numQuestions)
      res.json({ success: true, quiz })
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) })
    }
  })

  app.post('/api/practice/generate', async (req, res) => {
    try {
      const { subject, topic, numQuestions } = req.body
      const questions = await generatePracticeQuestions(subject, topic, numQuestions)
      res.json({ success: true, questions })
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) })
    }
  })

  app.post('/api/flashcards/generate', async (req, res) => {
    try {
      const { subject, topic, numCards } = req.body
      const cards = await generateFlashcardDeck(subject, topic, numCards)
      res.json({ success: true, cards })
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) })
    }
  })

  // ─── Health check ───────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Mwenje backend is running' })
  })

  // ─── Not found ───────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
  })

  return app
}

/**
 * Start the server
 */
async function main() {
  const port = process.env.PORT || 4000
  const app = createApp()

  // Verify database connection before starting
  await verifyDatabaseConnection()

  app.listen(port, () => {
    console.log(`🚀 Mwenje backend listening on http://localhost:${port}`)
    console.log(`📚 Tutor API: http://localhost:${port}/api/tutor`)
  })
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error)
}

export { db }

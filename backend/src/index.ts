import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { askClaude } from './lib/claude'
import { createUser, loginUser } from './lib/auth'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mwenje-backend' })
})

app.get('/subjects', (_req, res) => {
  res.json({
    subjects: [
      'Maths',
      'English',
      'Physics',
      'Chemistry',
      'Biology',
      'History',
      'Geography',
      'Commerce',
      'Shona',
      'French'
    ]
  })
})

app.post('/auth/signup', async (req, res) => {
  const { name, email, password, grade, curriculum } = req.body
  if (!name || !email || !password || !grade) {
    return res.status(400).json({ error: 'Missing required signup fields' })
  }

  try {
    const result = await createUser(name, email, password, grade, curriculum || 'ZIMSEC')
    res.json({ success: true, token: result.token, user: result.user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed'
    res.status(400).json({ error: message })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const result = await loginUser(email, password)
    res.json({ success: true, token: result.token, user: result.user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    res.status(401).json({ error: message })
  }
})


app.post('/ai/chat', async (req, res) => {
  const { message, subject, curriculum } = req.body
  if (!message || !subject) {
    return res.status(400).json({ error: 'message and subject are required' })
  }

  try {
    const response = await askClaude(message, subject)
    return res.json({ aiResponse: response })
  } catch (error) {
    return res.status(500).json({ error: 'AI service unavailable', details: error instanceof Error ? error.message : String(error) })
  }
})

app.post('/ai/quiz', (req, res) => {
  const { subject, topic, difficulty } = req.body
  res.json({
    quiz: {
      subject,
      topic,
      difficulty,
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          prompt: `What is the next step when solving a ${topic} question?`,
          options: ['Read the question carefully', 'Skip the diagram', 'Guess the answer'],
          answer: 'Read the question carefully'
        }
      ]
    }
  })
})

app.post('/ai/essay', (req, res) => {
  const { subject, content } = req.body
  res.json({
    score: 18,
    feedback: {
      overall: 'Good structure with clear argument, but the conclusion needs more detail.',
      paragraphs: [
        { index: 1, note: 'Strong introduction with a clear thesis.' },
        { index: 2, note: 'Use more evidence from the passage in this paragraph.' }
      ],
      improvedOpening: 'In Zimbabwean history, the fight for independence shaped the nation’s identity and inspired generations of learners.'
    }
  })
})

app.post('/ai/planner', (req, res) => {
  const { examDates } = req.body
  res.json({
    schedule: [
      { day: 'Monday', task: 'Maths revision — algebra and graphs' },
      { day: 'Wednesday', task: 'English essay practice — paragraph structure' },
      { day: 'Friday', task: 'Science quick-review — circuits and forces' }
    ],
    generatedAt: new Date().toISOString()
  })
})

app.get('/progress', (_req, res) => {
  res.json({
    mastery: [
      { subject: 'Maths', score: 82 },
      { subject: 'English', score: 74 },
      { subject: 'Science', score: 68 }
    ],
    streakDays: 6,
    xpPoints: 1420
  })
})

app.get('/leaderboard', (_req, res) => {
  res.json({
    top: [
      { name: 'Simba', xp: 1720 },
      { name: 'Tariro', xp: 1610 },
      { name: 'Nyasha', xp: 1540 }
    ]
  })
})

app.listen(port, () => {
  console.log(`Mwenje backend listening on http://localhost:${port}`)
})

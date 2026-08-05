import { RowDataPacket } from 'mysql2/promise'
import { getPool } from '../lib/mysql'

export type SubjectProgress = {
  subject: string
  score: number
  attempts: number
  lastScore: number
  lastUpdated: string
}

export type QuizResultInput = {
  subject: string
  score: number
  totalQuestions?: number
  topic?: string
  difficulty?: string
  correctAnswers?: number
  durationSeconds?: number
}

export type LeaderboardEntry = {
  uid: string
  name: string
  xp: number
  masteryAverage: number
}

type UserProgressRecord = {
  uid: string
  name: string
  xpPoints: number
  streakDays: number
  lastActivityDate: string | null
  subjects: Record<string, SubjectProgress>
}

type ProgressRow = RowDataPacket & {
  user_id: number
  name: string
  xp_points: number
  streak_days: number
  last_activity_date: Date | string | null
  subjects: string | Record<string, SubjectProgress>
}

type QuizHistoryEntry = {
  id: string
  subject: string
  topic: string
  difficulty: string
  score: number
  totalQuestions: number
  correctAnswers: number
  createdAt: string
}

type QuizRow = RowDataPacket & {
  id: number
  subject: string
  topic: string
  difficulty: string
  score: number
  total_questions: number
  correct_answers: number
  created_at: Date | string
}

const memoryStore = new Map<string, UserProgressRecord>()
const memoryQuizResults = new Map<string, QuizHistoryEntry[]>()

function useMemoryStore() {
  return process.env.NODE_ENV === 'test' || process.env.PROGRESS_STORE === 'memory'
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function calculateStreak(lastActivityDate: string | null, currentStreak: number) {
  const today = todayKey()
  if (!lastActivityDate) return 1
  if (lastActivityDate === today) return Math.max(currentStreak, 1)

  const last = new Date(`${lastActivityDate}T00:00:00.000Z`)
  const now = new Date(`${today}T00:00:00.000Z`)
  const diffDays = Math.round((now.getTime() - last.getTime()) / 86_400_000)
  return diffDays === 1 ? currentStreak + 1 : 1
}

function scoreToXp(score: number, totalQuestions = 1) {
  const normalizedTotal = Math.max(1, totalQuestions)
  return Math.max(0, Math.round(score * 10 + normalizedTotal * 5))
}

function createEmptyProgress(uid: string, name?: string): UserProgressRecord {
  return {
    uid,
    name: name || 'Learner',
    xpPoints: 0,
    streakDays: 0,
    lastActivityDate: null,
    subjects: {}
  }
}

function normalizeScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function normalizeRecord(uid: string, data: Partial<UserProgressRecord> | undefined): UserProgressRecord {
  return {
    ...createEmptyProgress(uid, data?.name),
    ...data,
    uid,
    subjects: data?.subjects || {}
  }
}

function parseSubjects(subjects: ProgressRow['subjects'] | undefined) {
  if (!subjects) return {}
  if (typeof subjects !== 'string') return subjects

  try {
    return JSON.parse(subjects) as Record<string, SubjectProgress>
  } catch {
    return {}
  }
}

function rowToRecord(uid: string, row: ProgressRow | undefined): UserProgressRecord {
  if (!row) return createEmptyProgress(uid)

  const lastActivityDate = row.last_activity_date instanceof Date
    ? row.last_activity_date.toISOString().slice(0, 10)
    : row.last_activity_date

  return normalizeRecord(uid, {
    name: row.name,
    xpPoints: row.xp_points,
    streakDays: row.streak_days,
    lastActivityDate,
    subjects: parseSubjects(row.subjects)
  })
}

async function readMysqlRecord(uid: string) {
  const [rows] = await getPool().execute<ProgressRow[]>(
    `SELECT progress.user_id, COALESCE(progress.name, users.name) AS name, progress.xp_points, progress.streak_days, progress.last_activity_date, progress.subjects
     FROM progress
     LEFT JOIN users ON users.id = progress.user_id
     WHERE progress.user_id = ?`,
    [Number(uid)]
  )
  return rowToRecord(uid, rows[0])
}

async function writeMysqlRecord(record: UserProgressRecord) {
  await getPool().execute(
    `INSERT INTO progress (user_id, name, xp_points, streak_days, last_activity_date, subjects)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       xp_points = VALUES(xp_points),
       streak_days = VALUES(streak_days),
       last_activity_date = VALUES(last_activity_date),
       subjects = VALUES(subjects)`,
    [
      Number(record.uid),
      record.name,
      record.xpPoints,
      record.streakDays,
      record.lastActivityDate,
      JSON.stringify(record.subjects)
    ]
  )
}

async function readRecord(uid: string) {
  if (useMemoryStore()) {
    return normalizeRecord(uid, memoryStore.get(uid))
  }

  return readMysqlRecord(uid)
}

async function writeRecord(record: UserProgressRecord) {
  if (useMemoryStore()) {
    memoryStore.set(record.uid, record)
    return
  }

  await writeMysqlRecord(record)
}

function toProgressResponse(record: UserProgressRecord) {
  const mastery = Object.values(record.subjects).sort((a, b) => a.subject.localeCompare(b.subject))
  const masteryAverage = mastery.length
    ? Math.round(mastery.reduce((sum, entry) => sum + entry.score, 0) / mastery.length)
    : 0

  return {
    mastery,
    masteryAverage,
    streakDays: record.streakDays,
    xpPoints: record.xpPoints,
    weeklyActivity: buildWeeklyActivity(record),
    recentQuizzes: getMemoryQuizHistory(record.uid)
  }
}

function buildWeeklyActivity(record: UserProgressRecord) {
  const today = new Date()
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - offset))
    const key = date.toISOString().slice(0, 10)
    const attempts = Object.values(record.subjects).filter((entry) => entry.lastUpdated.slice(0, 10) === key).length
    return { date: key, attempts }
  })
}

function getMemoryQuizHistory(uid: string) {
  return (memoryQuizResults.get(uid) || []).slice(0, 8)
}

async function getMysqlQuizHistory(uid: string): Promise<QuizHistoryEntry[]> {
  const [rows] = await getPool().execute<QuizRow[]>(
    `SELECT id, subject, topic, difficulty, score, total_questions, correct_answers, created_at
     FROM quiz_results
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 8`,
    [Number(uid)]
  )

  return rows.map((row) => ({
    id: String(row.id),
    subject: row.subject,
    topic: row.topic,
    difficulty: row.difficulty,
    score: row.score,
    totalQuestions: row.total_questions,
    correctAnswers: row.correct_answers,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
  }))
}

async function addQuizHistory(uid: string, input: Required<Pick<QuizResultInput, 'subject' | 'score'>> & QuizResultInput) {
  const totalQuestions = Math.max(1, input.totalQuestions || 1)
  const correctAnswers = Math.max(0, Math.min(totalQuestions, input.correctAnswers ?? Math.round((input.score / 100) * totalQuestions)))

  if (useMemoryStore()) {
    const current = memoryQuizResults.get(uid) || []
    current.unshift({
      id: `${Date.now()}-${current.length + 1}`,
      subject: input.subject,
      topic: input.topic || '',
      difficulty: input.difficulty || '',
      score: input.score,
      totalQuestions,
      correctAnswers,
      createdAt: new Date().toISOString()
    })
    memoryQuizResults.set(uid, current.slice(0, 20))
    return
  }

  await getPool().execute(
    `INSERT INTO quiz_results (user_id, subject, topic, difficulty, score, total_questions, correct_answers, duration_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(uid),
      input.subject,
      input.topic || '',
      input.difficulty || '',
      input.score,
      totalQuestions,
      correctAnswers,
      input.durationSeconds ?? null
    ]
  )
}

export async function getUserProgress(uid: string) {
  const record = await readRecord(uid)
  const response = toProgressResponse(record)
  return {
    ...response,
    recentQuizzes: useMemoryStore() ? response.recentQuizzes : await getMysqlQuizHistory(uid)
  }
}

export async function recordQuizResult(uid: string, name: string | undefined, input: QuizResultInput) {
  const subject = input.subject?.trim()
  if (!subject) {
    throw new Error('subject is required')
  }

  const score = normalizeScore(input.score)
  const totalQuestions = Math.max(1, input.totalQuestions || 1)
  const record = await readRecord(uid)
  const previous = record.subjects[subject]
  const attempts = (previous?.attempts || 0) + 1
  const masteryScore = previous ? Math.round(previous.score * 0.7 + score * 0.3) : score

  record.name = name || record.name || 'Learner'
  record.xpPoints += scoreToXp(score, totalQuestions)
  record.streakDays = calculateStreak(record.lastActivityDate, record.streakDays)
  record.lastActivityDate = todayKey()
  record.subjects[subject] = {
    subject,
    score: masteryScore,
    attempts,
    lastScore: score,
    lastUpdated: new Date().toISOString()
  }

  await writeRecord(record)
  await addQuizHistory(uid, { ...input, subject, score, totalQuestions })
  return getUserProgress(uid)
}

export async function getLeaderboard(limit = 10) {
  if (useMemoryStore()) {
    return Array.from(memoryStore.values())
      .map((record) => ({
        uid: record.uid,
        name: record.name,
        xp: record.xpPoints,
        masteryAverage: toProgressResponse(record).masteryAverage
      }))
      .sort((a, b) => b.xp - a.xp || b.masteryAverage - a.masteryAverage || a.name.localeCompare(b.name))
      .slice(0, limit)
  }

  const [rows] = await getPool().execute<ProgressRow[]>(
    `SELECT progress.user_id, progress.name, progress.xp_points, progress.streak_days, progress.last_activity_date, progress.subjects
     FROM progress
     ORDER BY progress.xp_points DESC
     LIMIT ?`,
    [limit]
  )

  return rows.map((row): LeaderboardEntry => {
    const record = rowToRecord(String(row.user_id), row)
    return {
      uid: record.uid,
      name: record.name,
      xp: record.xpPoints,
      masteryAverage: toProgressResponse(record).masteryAverage
    }
  })
}

export function resetProgressStoreForTests() {
  memoryStore.clear()
  memoryQuizResults.clear()
}

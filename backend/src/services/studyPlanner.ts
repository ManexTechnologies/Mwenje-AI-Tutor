import { RowDataPacket } from 'mysql2/promise'
import { getPool } from '../lib/mysql'

export type StudyPlanInput = {
  subjects: string[]
  examDate?: string
  hoursPerDay: number
  weakSubjects: string[]
  weakAreas?: string[]
}

export type StudyPlan = {
  weeklyPlan: Array<{ day: string; focus: string; task: string; hours: number }>
  revisionSchedule: Array<{ when: string; activity: string }>
  priorityTopics: string[]
  generatedAt: string
}

type StudyPlanRow = RowDataPacket & {
  id: number
  plan: string | StudyPlan
  created_at: Date | string
}

const memoryPlans = new Map<string, StudyPlan[]>()

const subjectTopicFallbacks: Record<string, string[]> = {
  Mathematics: ['simultaneous equations', 'graphs', 'trigonometry', 'statistics'],
  Maths: ['simultaneous equations', 'graphs', 'trigonometry', 'statistics'],
  Physics: ['forces', 'electricity', 'waves', 'energy'],
  Chemistry: ['chemical equations', 'acids and bases', 'rates of reaction', 'bonding'],
  Biology: ['cells', 'human nutrition', 'ecology', 'genetics'],
  Geography: ['map reading', 'weather and climate', 'population', 'resources'],
  History: ['First Chimurenga', 'colonialism', 'independence movements', 'source analysis'],
  Accounts: ['ledger accounts', 'trial balance', 'bank reconciliation', 'final accounts'],
  'Computer Science': ['algorithms', 'databases', 'networks', 'programming logic'],
  'English Language': ['composition', 'comprehension', 'summary writing', 'grammar']
}

function cleanList(items: unknown, fallback: string[]) {
  if (!Array.isArray(items)) return fallback
  const cleaned = items.map((item) => String(item).trim()).filter(Boolean)
  return cleaned.length ? cleaned : fallback
}

function getDaysUntilExam(examDate?: string) {
  if (!examDate) return null
  const target = new Date(`${examDate}T00:00:00.000Z`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  return Math.max(1, Math.ceil((target.getTime() - start.getTime()) / 86_400_000))
}

export function generateLocalStudyPlan(input: StudyPlanInput): StudyPlan {
  const subjects = cleanList(input.subjects, ['Mathematics'])
  const weakSubjects = cleanList(input.weakSubjects, [subjects[0]])
  const weakAreas = cleanList(input.weakAreas, [])
  const hours = Math.max(1, Math.min(8, Math.round(input.hoursPerDay * 2) / 2 || 2))
  const daysUntilExam = getDaysUntilExam(input.examDate)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const priorityTopics = Array.from(new Set([
    ...weakAreas,
    ...weakSubjects.flatMap((subject) => subjectTopicFallbacks[subject] || subjectTopicFallbacks[subjects[0]] || ['exam practice']),
    ...subjects.flatMap((subject) => (subjectTopicFallbacks[subject] || []).slice(0, 2))
  ])).slice(0, 8)

  const weeklyPlan = days.map((day, index) => {
    const subject = index % 2 === 0
      ? weakSubjects[index % weakSubjects.length]
      : subjects[index % subjects.length]
    const topic = priorityTopics[index % priorityTopics.length] || 'past paper practice'
    const revisionTask = index >= 5
      ? `Timed ZIMSEC-style questions on ${topic}, then correct mistakes.`
      : `Revise ${topic}, write short notes, then answer 3 practice questions.`

    return {
      day,
      focus: subject,
      task: revisionTask,
      hours: index >= 5 ? Math.min(hours + 0.5, 8) : hours
    }
  })

  const revisionSchedule = [
    { when: 'Tomorrow', activity: `Start with ${weakSubjects[0]} for ${hours} hour${hours === 1 ? '' : 's'} and finish with 15 minutes of recall.` },
    { when: 'Midweek', activity: 'Do one mixed quiz and rewrite every missed answer with the correct method.' },
    { when: 'Weekend', activity: 'Attempt a timed past-paper section, then update weak areas from mistakes.' }
  ]

  if (daysUntilExam && daysUntilExam <= 21) {
    revisionSchedule.unshift({
      when: `${daysUntilExam} days to exam`,
      activity: 'Prioritise past papers, formula recall, and weak topics before adding new content.'
    })
  }

  return {
    weeklyPlan,
    revisionSchedule,
    priorityTopics,
    generatedAt: new Date().toISOString()
  }
}

export async function saveStudyPlan(uid: string, input: StudyPlanInput, plan: StudyPlan) {
  if (process.env.NODE_ENV === 'test') {
    const current = memoryPlans.get(uid) || []
    current.unshift(plan)
    memoryPlans.set(uid, current.slice(0, 5))
    return plan
  }

  await getPool().execute(
    `INSERT INTO study_plans (user_id, subjects, weak_subjects, exam_date, hours_per_day, plan)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      Number(uid),
      JSON.stringify(input.subjects),
      JSON.stringify(input.weakSubjects),
      input.examDate || null,
      input.hoursPerDay,
      JSON.stringify(plan)
    ]
  )

  return plan
}

export async function getLatestStudyPlan(uid: string) {
  if (process.env.NODE_ENV === 'test') {
    return memoryPlans.get(uid)?.[0] || null
  }

  const [rows] = await getPool().execute<StudyPlanRow[]>(
    `SELECT id, plan, created_at FROM study_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [Number(uid)]
  )
  const row = rows[0]
  if (!row) return null
  if (typeof row.plan !== 'string') return row.plan
  return JSON.parse(row.plan) as StudyPlan
}

export function resetStudyPlansForTests() {
  memoryPlans.clear()
}

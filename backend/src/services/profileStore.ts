import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { getPool } from '../lib/mysql'

export type LearningProfile = {
  name: string
  email: string
  school: string
  grade: string
  curriculum: string
  subjects: string[]
  learningGoals: string[]
  preferredLearningStyle: string
  weakAreas: string[]
  examinationYear: number | null
  role: string
}

type ProfileInput = Omit<Partial<LearningProfile>, 'subjects'> & {
  name?: string
  email?: string
  subjects?: unknown
}

const testProfiles = new Map<string, LearningProfile>()

type ProfileRow = RowDataPacket & {
  name: string
  email: string
  school: string
  grade: string
  curriculum: string
  subjects: string | string[]
  learning_goals: string | string[] | null
  preferred_learning_style: string | null
  weak_areas: string | string[] | null
  examination_year: number | null
  role: string
}

function normalizeSubjects(subjects: unknown, fallback: string[]) {
  if (typeof subjects === 'string') {
    try {
      return normalizeSubjects(JSON.parse(subjects), fallback)
    } catch {
      return fallback
    }
  }

  if (!Array.isArray(subjects)) return fallback
  const cleanSubjects = subjects.map((subject) => String(subject).trim()).filter(Boolean)
  return cleanSubjects.length ? cleanSubjects : fallback
}

function normalizeProfile(data: ProfileInput | undefined, fallback: LearningProfile): LearningProfile {
  return {
    name: String(data?.name || fallback.name || 'Learner'),
    email: String(data?.email || fallback.email || ''),
    school: String(data?.school || fallback.school || ''),
    grade: String(data?.grade || fallback.grade || ''),
    curriculum: String(data?.curriculum || fallback.curriculum || 'ZIMSEC'),
    subjects: normalizeSubjects(data?.subjects, fallback.subjects),
    learningGoals: normalizeSubjects((data as any)?.learningGoals ?? (data as any)?.learning_goals, fallback.learningGoals),
    preferredLearningStyle: String((data as any)?.preferredLearningStyle ?? (data as any)?.preferred_learning_style ?? fallback.preferredLearningStyle ?? ''),
    weakAreas: normalizeSubjects((data as any)?.weakAreas ?? (data as any)?.weak_areas, fallback.weakAreas),
    examinationYear: Number.isFinite(Number((data as any)?.examinationYear ?? (data as any)?.examination_year))
      ? Number((data as any)?.examinationYear ?? (data as any)?.examination_year)
      : fallback.examinationYear,
    role: String(data?.role || fallback.role || 'STUDENT')
  }
}

export function buildProfileFallback(user: { name?: string; email?: string }): LearningProfile {
  return {
    name: user.name || 'Learner',
    email: user.email || '',
    school: '',
    grade: '',
    curriculum: 'ZIMSEC',
    subjects: ['Mathematics', 'English Language'],
    learningGoals: ['Improve exam performance'],
    preferredLearningStyle: 'step-by-step examples',
    weakAreas: [],
    examinationYear: null,
    role: 'STUDENT'
  }
}

export async function getProfile(uid: string, fallback: LearningProfile) {
  if (process.env.NODE_ENV === 'test') {
    return testProfiles.get(uid) || fallback
  }

  const [rows] = await getPool().execute<ProfileRow[]>(
    `SELECT users.name, users.email, users.role, profiles.school, profiles.grade, profiles.curriculum, profiles.subjects,
       profiles.learning_goals, profiles.preferred_learning_style, profiles.weak_areas, profiles.examination_year
     FROM users
     LEFT JOIN profiles ON profiles.user_id = users.id
     WHERE users.id = ?`,
    [Number(uid)]
  )

  const row = rows[0]
  return normalizeProfile(row ? {
    name: row.name,
    email: row.email,
    school: row.school,
    grade: row.grade,
    curriculum: row.curriculum,
    subjects: row.subjects,
    learningGoals: normalizeSubjects(row.learning_goals, fallback.learningGoals),
    preferredLearningStyle: row.preferred_learning_style || '',
    weakAreas: normalizeSubjects(row.weak_areas, fallback.weakAreas),
    examinationYear: row.examination_year,
    role: row.role
  } : undefined, fallback)
}

export async function saveProfile(uid: string, input: ProfileInput, fallback: LearningProfile, connection?: PoolConnection) {
  const profile = normalizeProfile(input, fallback)

  if (process.env.NODE_ENV === 'test') {
    testProfiles.set(uid, profile)
    return profile
  }

  const executor = connection || getPool()
  const userId = Number(uid)

  await executor.execute(
    'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
    [profile.name, profile.email, profile.role, userId]
  )

  await executor.execute(
    `INSERT INTO profiles (user_id, school, grade, curriculum, subjects, learning_goals, preferred_learning_style, weak_areas, examination_year)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       school = VALUES(school),
       grade = VALUES(grade),
       curriculum = VALUES(curriculum),
       subjects = VALUES(subjects),
       learning_goals = VALUES(learning_goals),
       preferred_learning_style = VALUES(preferred_learning_style),
       weak_areas = VALUES(weak_areas),
       examination_year = VALUES(examination_year)`,
    [
      userId,
      profile.school,
      profile.grade,
      profile.curriculum,
      JSON.stringify(profile.subjects),
      JSON.stringify(profile.learningGoals),
      profile.preferredLearningStyle,
      JSON.stringify(profile.weakAreas),
      profile.examinationYear
    ]
  )

  return profile
}

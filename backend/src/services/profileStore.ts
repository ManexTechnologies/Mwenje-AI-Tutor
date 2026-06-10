import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { getPool } from '../lib/mysql'

export type LearningProfile = {
  name: string
  email: string
  school: string
  grade: string
  curriculum: string
  subjects: string[]
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
    subjects: ['Maths', 'English'],
    role: 'STUDENT'
  }
}

export async function getProfile(uid: string, fallback: LearningProfile) {
  if (process.env.NODE_ENV === 'test') {
    return testProfiles.get(uid) || fallback
  }

  const [rows] = await getPool().execute<ProfileRow[]>(
    `SELECT users.name, users.email, users.role, profiles.school, profiles.grade, profiles.curriculum, profiles.subjects
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
    `INSERT INTO profiles (user_id, school, grade, curriculum, subjects)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       school = VALUES(school),
       grade = VALUES(grade),
       curriculum = VALUES(curriculum),
       subjects = VALUES(subjects)`,
    [userId, profile.school, profile.grade, profile.curriculum, JSON.stringify(profile.subjects)]
  )

  return profile
}

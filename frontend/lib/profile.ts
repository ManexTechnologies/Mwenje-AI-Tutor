import { fetchWithAuth } from './fetchWithAuth'

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
}

type ProfileFallback = Partial<LearningProfile> & {
  name: string
  email?: string
  subjects: string[]
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), milliseconds)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function normalizeProfile(data: Partial<LearningProfile> | undefined, fallback: ProfileFallback): LearningProfile {
  const subjects = Array.isArray(data?.subjects) && data.subjects.length ? data.subjects : fallback.subjects

  return {
    name: data?.name || fallback.name,
    email: data?.email || fallback.email || '',
    school: data?.school || fallback.school || '',
    grade: data?.grade || fallback.grade || '',
    curriculum: data?.curriculum || fallback.curriculum || 'ZIMSEC',
    subjects,
    learningGoals: Array.isArray(data?.learningGoals) ? data.learningGoals : [],
    preferredLearningStyle: data?.preferredLearningStyle || '',
    weakAreas: Array.isArray(data?.weakAreas) ? data.weakAreas : [],
    examinationYear: typeof data?.examinationYear === 'number' ? data.examinationYear : null
  }
}

async function readProfileResponse(response: Response, fallback: ProfileFallback) {
  if (!response.ok) {
    const text = await response.text()
    let message = text
    try {
      const data = JSON.parse(text) as { error?: string; details?: string }
      message = data.details ? `${data.error}: ${data.details}` : data.error || text
    } catch {
      message = text
    }
    throw new Error(message || 'Profile request failed')
  }

  const data = (await response.json()) as { profile?: Partial<LearningProfile> }
  return normalizeProfile(data.profile, fallback)
}

export async function loadUserProfile(fallback: ProfileFallback, timeoutMs = 3500) {
  const response = await withTimeout(
    fetchWithAuth(`${apiBase}/profile`),
    timeoutMs,
    'Profile is taking too long to load. Showing account defaults for now.'
  )

  return readProfileResponse(response, fallback)
}

export async function saveUserProfile(profile: LearningProfile, fallback: ProfileFallback, timeoutMs = 5000) {
  const response = await withTimeout(
    fetchWithAuth(`${apiBase}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }),
    timeoutMs,
    'Profile save is taking too long. Please try again.'
  )

  return readProfileResponse(response, fallback)
}

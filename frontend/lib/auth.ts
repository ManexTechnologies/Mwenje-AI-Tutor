const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export type AppUser = {
  uid: string
  id: number
  email: string
  name: string
  role: string
  subscriptionPlan?: string
}

async function readJsonResponse<T>(response: Response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Authentication request failed'
    throw new Error(message)
  }
  return data as T
}

export async function getCurrentUser() {
  try {
    const response = await fetch(`${apiBase}/auth/me`, { credentials: 'include' })
    if (response.status === 401 || response.status === 403 || !response.ok) return null
    const data = await readJsonResponse<{ user: AppUser | null }>(response)
    return data.user ?? null
  } catch {
    return null
  }
}

function isFriendlyAuthError(message: string) {
  return /database|service unavailable|connection refused|unable to connect/i.test(message)
}

export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await readJsonResponse<{ user: AppUser }>(response)
    return data.user
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    if (isFriendlyAuthError(message)) throw new Error('Unable to log in right now. Please try again later.')
    throw error
  }
}

export async function signUpUser(input: {
  name: string
  email: string
  password: string
  grade: string
  curriculum: string
  subjects: string[]
}) {
  try {
    const response = await fetch(`${apiBase}/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    const data = await readJsonResponse<{ user: AppUser }>(response)
    return data.user
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign up failed'
    if (isFriendlyAuthError(message)) throw new Error('Unable to sign up right now. Please try again later.')
    throw error
  }
}

export async function logoutUser() {
  await fetch(`${apiBase}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  })
}

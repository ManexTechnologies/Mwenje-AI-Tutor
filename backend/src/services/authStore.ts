import bcrypt from 'bcrypt'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getPool, withConnection } from '../lib/mysql'
import { SessionUser } from '../lib/session'
import { buildProfileFallback, saveProfile } from './profileStore'

type UserRow = RowDataPacket & {
  id: number
  email: string
  password_hash: string
  name: string
  role: string
  subscription_plan: string
}

const proEmails = new Set(['mamvuraemmmanuel@gmail.com'])

function getInitialSubscriptionPlan(email: string) {
  return proEmails.has(email.trim().toLowerCase()) ? 'pro' : 'free-trial'
}

function toSessionUser(row: Pick<UserRow, 'id' | 'email' | 'name' | 'role' | 'subscription_plan'>): SessionUser {
  return {
    uid: String(row.id),
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    subscriptionPlan: row.subscription_plan
  }
}

export async function findUserById(id: number) {
  const [rows] = await getPool().execute<UserRow[]>('SELECT id, email, password_hash, name, role, subscription_plan FROM users WHERE id = ?', [id])
  const user = rows[0]
  return user ? toSessionUser(user) : null
}

export async function createUser(input: {
  name: string
  email: string
  password: string
  school?: string
  grade?: string
  curriculum?: string
  subjects?: string[]
}) {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const subjects = input.subjects?.length ? input.subjects : ['Maths', 'English']
  const subscriptionPlan = getInitialSubscriptionPlan(email)

  if (!name) throw new Error('Name is required')
  if (!email) throw new Error('Email is required')
  if (password.length < 6) throw new Error('Password must be at least 6 characters')

  const passwordHash = await bcrypt.hash(password, 12)

  return withConnection(async (connection) => {
    await connection.beginTransaction()
    try {
      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO users (email, password_hash, name, role, subscription_plan) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, name, 'STUDENT', subscriptionPlan]
      )

      const user = { uid: String(result.insertId), id: result.insertId, email, name, role: 'STUDENT', subscriptionPlan }
      const fallback = buildProfileFallback(user)
      await saveProfile(user.uid, {
        name,
        email,
        school: input.school || '',
        grade: input.grade || '',
        curriculum: input.curriculum || 'ZIMSEC',
        subjects,
        role: 'STUDENT'
      }, fallback, connection)

      await connection.commit()
      return user
    } catch (error: any) {
      await connection.rollback()
      if (error?.code === 'ER_DUP_ENTRY') throw new Error('That email address already has an account. Log in instead.')
      throw error
    }
  })
}

export async function validateLogin(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase()
  const [rows] = await getPool().execute<UserRow[]>('SELECT id, email, password_hash, name, role, subscription_plan FROM users WHERE email = ?', [email])
  const user = rows[0]

  if (!user) throw new Error('Invalid email or password')

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw new Error('Invalid email or password')

  return toSessionUser(user)
}

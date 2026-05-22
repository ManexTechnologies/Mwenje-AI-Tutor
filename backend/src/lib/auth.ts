import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'mwenje-dev-secret-key-change-in-production'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export async function createUser(name: string, email: string, password: string, grade: string, curriculum: string) {
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new Error('Email already registered')
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      grade,
      curriculum: curriculum as any,
      role: 'STUDENT'
    }
  })

  return { userId: user.id, token: generateToken(user.id), user: { name: user.name, email: user.email } }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error('Invalid email or password')
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    throw new Error('Invalid email or password')
  }

  return { userId: user.id, token: generateToken(user.id), user: { name: user.name, email: user.email } }
}

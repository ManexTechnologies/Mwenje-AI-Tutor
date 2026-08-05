import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export type SessionUser = {
  uid: string
  id: number
  email: string
  name: string
  role: string
  subscriptionPlan?: string
}

const cookieName = 'mwenje_session'
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7

function getJwtSecret() {
  return process.env.JWT_SECRET || 'mwenje-dev-secret-key-change-in-production'
}

function parseCookies(header: string | undefined) {
  const cookies = new Map<string, string>()
  if (!header) return cookies

  for (const part of header.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name) cookies.set(name, decodeURIComponent(value.join('=')))
  }

  return cookies
}

export function signSession(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: sessionMaxAgeSeconds })
}

export function readSession(req: Request) {
  const authHeader = req.headers.authorization
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined
  const cookieToken = parseCookies(req.headers.cookie).get(cookieName)
  const token = bearerToken || cookieToken

  if (!token) return null

  const decoded = jwt.verify(token, getJwtSecret()) as SessionUser
  return decoded
}

export function setSessionCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: sessionMaxAgeSeconds * 1000,
    path: '/'
  })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
}

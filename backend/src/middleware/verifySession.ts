import { Request, Response, NextFunction } from 'express'
import { readSession } from '../lib/session'

export function verifySession(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.NODE_ENV === 'test') {
      const authHeader = req.headers.authorization
      if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' })

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : authHeader
      if (token !== 'test-token') return res.status(401).json({ error: 'Invalid or expired session' })

      const uid = process.env.TEST_AUTH_UID || 'learner-1'
      ;(req as any).user = {
        uid,
        id: Number.parseInt(uid.replace(/\D/g, ''), 10) || 1,
        email: `${uid}@example.com`,
        name: uid === 'learner-2' ? 'Second Learner' : 'Test Learner',
        role: 'STUDENT'
      }
      return next()
    }

    const user = readSession(req)
    if (!user) return res.status(401).json({ error: 'Missing session' })

    ;(req as any).user = user
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session', details: err instanceof Error ? err.message : String(err) })
  }
}

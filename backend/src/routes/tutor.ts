import { Router, Request, Response } from 'express'
import { Pool } from 'mysql2/promise'
import { TutorSessionRepository } from '../lib/tutorSessionRepository'
import { askClaude, normalizeAiResponse, type QueryMode, type TutorRequest } from '../lib/claude'
import { z } from 'zod'

/**
 * Request validation schema for /api/tutor/ask
 */
const TutorAskSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(2000, 'Prompt too long'),
  subject: z.string().min(1, 'Subject required'),
  grade: z.enum(['O Level', 'A Level', 'Form 3', 'Form 4']).optional().default('O Level'),
  mode: z.enum(['explain', 'exam_practice', 'essay_feedback', 'quiz', 'general']).optional().default('explain'),
  session_id: z.number().optional()
})

type TutorAskRequest = z.infer<typeof TutorAskSchema>

/**
 * Create the tutor router with database injection.
 * Usage: app.use('/api/tutor', authMiddleware, createTutorRouter(db))
 */
export function createTutorRouter(db: Pool) {
  const router = Router()
  const repo = new TutorSessionRepository(db)

  /**
   * POST /api/tutor/ask
   * Ask Mwenje a tutor question and save conversation history.
   *
   * Request body:
   * {
   *   prompt: string        // The question/prompt
   *   subject: string       // e.g. "Maths", "Biology", "English"
   *   grade?: string        // "O Level" | "A Level" (default: "O Level")
   *   mode?: string         // "explain" | "exam_practice" | "essay_feedback" | "quiz" | "general"
   *   session_id?: number   // Optional; if provided, appends to existing session
   * }
   *
   * Response:
   * {
   *   success: boolean
   *   session_id: number
   *   message: {
   *     id: number
   *     role: "assistant"
   *     content: string
   *     created_at: string
   *   }
   *   session_title: string
   * }
   */
  router.post('/ask', async (req: Request, res: Response) => {
    try {
      // Validate input
      const bodyResult = TutorAskSchema.safeParse(req.body)
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: bodyResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
        })
      }

      const { prompt, subject, grade, mode, session_id } = bodyResult.data

      // Get user ID from auth middleware (assumes req.user is set by authMiddleware)
      const userId = (req as any).user?.id
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' })
      }

      let sessionId = session_id
      let sessionTitle: string | null = null

      // Create new session if not provided
      if (!sessionId) {
        sessionId = await repo.createSession(userId, subject, grade, mode)
      }

      // Save user's prompt to session
      await repo.addMessage(sessionId, 'user', prompt)

      // Get conversation context for Claude
      const context = await repo.getSessionContext(sessionId, 6)

      // Prepare messages for Claude
      const conversationHistory = context.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

      // Call Claude with the tutor request
      const claudeRequest: TutorRequest = {
        prompt,
        subject,
        grade: grade as 'O Level' | 'A Level',
        mode: mode as QueryMode,
        conversationHistory
      }

      const claudeResponse = await askClaude(claudeRequest)
      const normalizedResponse = normalizeAiResponse(claudeResponse)

      // Save Claude's response to session
      const messageId = await repo.addMessage(sessionId, 'assistant', normalizedResponse, 'claude')

      // Generate session title from first user prompt if new session
      if (!session_id && context.length === 0) {
        const titlePreview = prompt.substring(0, 60).trim()
        sessionTitle = titlePreview.length < prompt.length ? `${titlePreview}...` : titlePreview
        await repo.updateSessionTitle(sessionId, sessionTitle)
      }

      // Return response
      return res.status(200).json({
        success: true,
        session_id: sessionId,
        message: {
          id: messageId,
          role: 'assistant',
          content: normalizedResponse,
          created_at: new Date().toISOString()
        },
        session_title: sessionTitle
      })
    } catch (error) {
      console.error('Tutor ask error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to process tutor request',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  /**
   * GET /api/tutor/sessions
   * Get all tutor sessions for the current user.
   *
   * Query params:
   * - limit: number (default 20, max 100)
   *
   * Response:
   * {
   *   success: boolean
   *   sessions: Array<{
   *     id: number
   *     subject: string
   *     grade: string
   *     mode: string
   *     title: string
   *     created_at: string
   *   }>
   * }
   */
  router.get('/sessions', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' })
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
      const sessions = await repo.getUserSessions(userId, limit)

      return res.status(200).json({
        success: true,
        sessions: sessions.map((s) => ({
          id: s.id,
          subject: s.subject,
          grade: s.grade,
          mode: s.mode,
          title: s.title,
          created_at: s.created_at?.toISOString()
        }))
      })
    } catch (error) {
      console.error('Get sessions error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve sessions'
      })
    }
  })

  /**
   * GET /api/tutor/sessions/:session_id
   * Get a specific session with all its messages.
   *
   * Response:
   * {
   *   success: boolean
   *   session: {
   *     id: number
   *     subject: string
   *     grade: string
   *     mode: string
   *     title: string
   *     created_at: string
   *     messages: Array<{
   *       id: number
   *       role: "user" | "assistant"
   *       content: string
   *       created_at: string
   *     }>
   *   }
   * }
   */
  router.get('/sessions/:session_id', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' })
      }

      const sessionId = parseInt(req.params.session_id)
      if (isNaN(sessionId)) {
        return res.status(400).json({ success: false, error: 'Invalid session ID' })
      }

      const session = await repo.getSession(sessionId)
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' })
      }

      // Verify user owns this session
      if (session.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }

      return res.status(200).json({
        success: true,
        session: {
          id: session.id,
          subject: session.subject,
          grade: session.grade,
          mode: session.mode,
          title: session.title,
          created_at: session.created_at?.toISOString(),
          messages: (session.messages || []).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at?.toISOString()
          }))
        }
      })
    } catch (error) {
      console.error('Get session error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve session'
      })
    }
  })

  /**
   * DELETE /api/tutor/sessions/:session_id
   * Delete a tutor session and all its messages.
   *
   * Response:
   * {
   *   success: boolean
   * }
   */
  router.delete('/sessions/:session_id', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' })
      }

      const sessionId = parseInt(req.params.session_id)
      if (isNaN(sessionId)) {
        return res.status(400).json({ success: false, error: 'Invalid session ID' })
      }

      // Verify user owns this session before deleting
      const session = await repo.getSession(sessionId)
      if (!session || session.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }

      await repo.deleteSession(sessionId)

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Delete session error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete session'
      })
    }
  })

  /**
   * GET /api/tutor/stats
   * Get tutor usage stats for the current user.
   *
   * Response:
   * {
   *   success: boolean
   *   stats: {
   *     total_sessions: number
   *     total_messages: number
   *     subjects: string[]
   *   }
   * }
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' })
      }

      const stats = await repo.getUserSessionStats(userId)

      return res.status(200).json({
        success: true,
        stats
      })
    } catch (error) {
      console.error('Get stats error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve stats'
      })
    }
  })

  return router
}

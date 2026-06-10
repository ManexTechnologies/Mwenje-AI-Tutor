import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise'

export interface TutorMessage {
  id?: number
  session_id?: number
  role: 'user' | 'assistant'
  content: string
  source?: string
  created_at?: Date
}

export interface TutorSession {
  id?: number
  user_id: number
  subject: string
  grade?: string
  mode?: string
  title?: string
  created_at?: Date
  updated_at?: Date
  messages?: TutorMessage[]
}

/**
 * Repository for tutor session persistence.
 * Handles creating, saving, and retrieving tutor conversation history.
 */
export class TutorSessionRepository {
  constructor(private db: Pool) {}

  /**
   * Create a new tutor session for a user.
   */
  async createSession(userId: number, subject: string, grade?: string, mode?: string): Promise<number> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO tutor_sessions (user_id, subject, grade, mode) 
       VALUES (?, ?, ?, ?)`,
      [userId, subject, grade || null, mode || 'explain']
    )
    return result.insertId
  }

  /**
   * Save a message in a tutor session.
   */
  async addMessage(sessionId: number, role: 'user' | 'assistant', content: string, source?: string): Promise<number> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO tutor_messages (session_id, role, content, source) 
       VALUES (?, ?, ?, ?)`,
      [sessionId, role, content, source || 'claude']
    )
    return result.insertId
  }

  /**
   * Get all messages in a session.
   */
  async getSessionMessages(sessionId: number): Promise<TutorMessage[]> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT id, session_id, role, content, source, created_at 
       FROM tutor_messages 
       WHERE session_id = ? 
       ORDER BY created_at ASC`,
      [sessionId]
    )
    return rows.map((row) => ({
      id: row.id,
      session_id: row.session_id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      source: row.source,
      created_at: row.created_at
    }))
  }

  /**
   * Get a session by ID with its messages.
   */
  async getSession(sessionId: number): Promise<(TutorSession & { messages: TutorMessage[] }) | null> {
    const [sessionRows] = await this.db.execute<RowDataPacket[]>(
      `SELECT id, user_id, subject, grade, mode, title, created_at, updated_at 
       FROM tutor_sessions 
       WHERE id = ?`,
      [sessionId]
    )

    if (!sessionRows.length) return null

    const session = sessionRows[0]
    const messages = await this.getSessionMessages(sessionId)

    return {
      id: session.id,
      user_id: session.user_id,
      subject: session.subject,
      grade: session.grade,
      mode: session.mode,
      title: session.title,
      created_at: session.created_at,
      updated_at: session.updated_at,
      messages
    }
  }

  /**
   * Get all sessions for a user, ordered by most recent first.
   */
  async getUserSessions(userId: number, limit: number = 20): Promise<TutorSession[]> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT id, user_id, subject, grade, mode, title, created_at, updated_at 
       FROM tutor_sessions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    )

    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      subject: row.subject,
      grade: row.grade,
      mode: row.mode,
      title: row.title,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  }

  /**
   * Update session title (usually set after first message pair).
   */
  async updateSessionTitle(sessionId: number, title: string): Promise<void> {
    await this.db.execute(
      `UPDATE tutor_sessions SET title = ?, updated_at = NOW() WHERE id = ?`,
      [title, sessionId]
    )
  }

  /**
   * Get the last N messages from a session for context window.
   * Useful for sending conversation history to Claude.
   */
  async getSessionContext(sessionId: number, limit: number = 8): Promise<TutorMessage[]> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT id, session_id, role, content, source, created_at 
       FROM tutor_messages 
       WHERE session_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [sessionId, limit]
    )
    return rows.reverse().map((row) => ({
      id: row.id,
      session_id: row.session_id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      source: row.source,
      created_at: row.created_at
    }))
  }

  /**
   * Delete a session and all its messages.
   */
  async deleteSession(sessionId: number): Promise<void> {
    await this.db.execute(`DELETE FROM tutor_sessions WHERE id = ?`, [sessionId])
  }

  /**
   * Get session statistics for a user.
   */
  async getUserSessionStats(userId: number): Promise<{ total_sessions: number; total_messages: number; subjects: string[] }> {
    const [sessions] = await this.db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total_sessions FROM tutor_sessions WHERE user_id = ?`,
      [userId]
    )

    const [messages] = await this.db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total_messages FROM tutor_messages 
       WHERE session_id IN (SELECT id FROM tutor_sessions WHERE user_id = ?)`,
      [userId]
    )

    const [subjects] = await this.db.execute<RowDataPacket[]>(
      `SELECT DISTINCT subject FROM tutor_sessions WHERE user_id = ? ORDER BY subject`,
      [userId]
    )

    return {
      total_sessions: sessions[0].total_sessions || 0,
      total_messages: messages[0].total_messages || 0,
      subjects: subjects.map((s) => s.subject)
    }
  }
}

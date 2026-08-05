'use client'

import { useState } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

const essaySubjects = [
  'English Language',
  'English Literature',
  'History',
  'Geography',
  'Principles of Accounting',
  'Accounting',
  'Shona',
  'French',
  'Religious Studies'
]

const essayTypes = ['Exam essay', 'Argumentative essay', 'Narrative essay', 'Descriptive essay', 'Literature essay', 'Source-based essay']
const essayTypeDescriptions: Record<string, string> = {
  'Exam essay': 'Structured introduction, body paragraphs, and judgement.',
  'Argumentative essay': 'Takes a position and defends it against a counter-argument.',
  'Narrative essay': 'Tells a polished student story with a clear turning point.',
  'Descriptive essay': 'Uses vivid sensory detail and atmosphere.',
  'Literature essay': 'Analyses character, theme, setting, and language.',
  'Source-based essay': 'Uses source evidence with interpretation and context.'
}
const levels = ['Foundation', 'Core', 'Extended']
const levelDescriptions: Record<string, string> = {
  Foundation: 'Simple, clear paragraphs with direct explanation.',
  Core: 'Balanced exam-style essay with examples and judgement.',
  Extended: 'Polished, analytical essay for a high-performing student.'
}
const wordCounts = [300, 500, 800, 1000]
const apiBase = '/backend'

type EssayResult = {
  title: string
  subject: string
  topic: string
  level: string
  wordCount: number
  outline: string[]
  content: string
  studyTips: string[]
  source?: string
  note?: string
}

type FeedbackResult = {
  score: number
  feedback: {
    overall: string
    paragraphs: { index: number; note: string }[]
    improvedOpening: string
  }
}

export default function EssayPage() {
  const [mode, setMode] = useState<'generate' | 'review'>('generate')
  const [subject, setSubject] = useState(essaySubjects[0])
  const [essayType, setEssayType] = useState(essayTypes[0])
  const [level, setLevel] = useState(levels[1])
  const [wordCount, setWordCount] = useState(500)
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [essay, setEssay] = useState<EssayResult | null>(null)
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generateEssay() {
    const trimmedTopic = topic.trim()
    if (!trimmedTopic) {
      setStatus('Enter an essay topic or question first.')
      return
    }

    setLoading(true)
    setStatus('Generating essay...')
    setEssay(null)
    setFeedback(null)

    try {
      const res = await fetch(`${apiBase}/ai/essay/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic: trimmedTopic, level, wordCount, essayType })
      })

      if (!res.ok) throw new Error('Could not generate essay')
      const data = (await res.json()) as { essay: EssayResult }
      setEssay(data.essay)
      setStatus(data.essay.source === 'ai' || !data.essay.source ? null : 'Generated a local fallback essay because the AI service is unavailable.')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not generate essay')
    } finally {
      setLoading(false)
    }
  }

  async function requestFeedback() {
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      setStatus('Paste an essay before requesting feedback.')
      return
    }

    setLoading(true)
    setStatus('Reviewing essay...')
    setEssay(null)
    setFeedback(null)

    try {
      const res = await fetchWithAuth(`${apiBase}/ai/essay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content: trimmedContent })
      })

      if (res.status === 401) throw new Error('Log in to request essay feedback.')
      if (!res.ok) throw new Error('Could not review essay')
      const data = (await res.json()) as FeedbackResult
      setFeedback(data)
      setStatus(null)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not review essay')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Essay writing</p>
            <h1 className="text-3xl font-display font-semibold text-text-primary sm:text-4xl">Generate and improve subject essays</h1>
            <p className="max-w-3xl text-text-secondary">Create structured essays for writing-heavy subjects, or paste your own work for scoring and improvement feedback.</p>
          </div>

          <div className="mt-8 inline-flex rounded-full border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-1">
            {(['generate', 'review'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item)
                  setStatus(null)
                }}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  mode === item ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item === 'generate' ? 'Generate essay' : 'Review essay'}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Subject</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                {essaySubjects.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Level</span>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                {levels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-text-secondary">{levelDescriptions[level]}</span>
            </label>
            {mode === 'generate' ? (
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Essay type</span>
                <select value={essayType} onChange={(e) => setEssayType(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                  {essayTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <span className="mt-2 block text-xs text-text-secondary">{essayTypeDescriptions[essayType]}</span>
              </label>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>

          {mode === 'generate' ? (
            <div className="mt-8 space-y-6">
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Essay topic or question</span>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  className="mt-4 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-4 text-text-primary outline-none focus:border-accent-secondary"
                  placeholder="Example: Discuss the causes of the First Chimurenga."
                />
              </label>
              <label className="block max-w-xs">
                <span className="text-sm font-medium text-text-secondary">Length</span>
                <select value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                  {wordCounts.map((count) => (
                    <option key={count} value={count}>{count} words</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={generateEssay}
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? 'Generating...' : 'Generate essay'}
              </button>
            </div>
          ) : (
            <div className="mt-8">
              <label className="block text-sm font-medium text-text-secondary">Paste your essay</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="mt-4 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-4 text-text-primary outline-none focus:border-accent-secondary"
                placeholder="Write or paste your essay here..."
              />
              <button
                type="button"
                onClick={requestFeedback}
                disabled={loading}
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? 'Reviewing...' : 'Request feedback'}
              </button>
            </div>
          )}

          {status ? (
            <div className="mt-6 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary px-5 py-4 text-sm text-text-secondary">
              {status}
            </div>
          ) : null}

          <div className="mt-10 rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-[#FFF6E8] p-5 sm:rounded-[32px] sm:p-6">
            {essay ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-accent-primary">{essay.subject} - {essay.level}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-text-primary">{essay.title}</h2>
                  <p className="mt-2 text-sm text-text-secondary">Target length: {essay.wordCount} words</p>
                </div>
                <div className="rounded-3xl bg-white p-5">
                  <p className="whitespace-pre-line leading-7 text-text-primary">{essay.content}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Outline</p>
                    <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                      {essay.outline.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Study tips</p>
                    <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                      {essay.studyTips.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : feedback ? (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Score: {feedback.score}/20</p>
                  <p className="mt-3 text-text-secondary">{feedback.feedback.overall}</p>
                </div>
                <div className="grid gap-3">
                  {feedback.feedback.paragraphs.map((item) => (
                    <div key={item.index} className="rounded-3xl bg-white p-4 text-sm text-text-secondary">
                      <span className="font-semibold text-text-primary">Paragraph {item.index}: </span>{item.note}
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-sm font-semibold text-text-primary">Improved opening</p>
                  <p className="mt-2 text-text-secondary">{feedback.feedback.improvedOpening}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-primary">{mode === 'generate' ? 'Generated essay preview' : 'Feedback note'}</p>
                <p className="mt-3 text-text-secondary">
                  {mode === 'generate'
                    ? 'Your generated essay, outline, and study tips will appear here.'
                    : 'A score, paragraph notes, and improved opening will appear here after review.'}
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

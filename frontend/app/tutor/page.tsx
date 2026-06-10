'use client'

import { useEffect, useRef, useState } from 'react'
import { useProfile } from '@/components/profile-provider'
import { subjects as allSubjects } from '@/lib/learning'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type ChatMessage = {
  role: 'user' | 'ai'
  text: string
}

type LearningProfile = {
  name: string
  grade: string
  curriculum: string
  subjects: string[]
}

function getReplyText(response: unknown) {
  if (typeof response === 'string') return response
  if (response && typeof response === 'object') {
    const data = response as Record<string, any>
    if (typeof data.reply === 'string') return data.reply
    if (typeof data.completion === 'string') return data.completion
    if (Array.isArray(data.content)) {
      return data.content.map((item) => item?.text || '').join('\n')
    }
  }

  return 'Mwenje could not format the answer. Try asking the question again.'
}

export default function TutorPage() {
  const { user, profile: loadedProfile, profileError } = useProfile()
  const [profile, setProfile] = useState<LearningProfile>({
    name: 'there',
    grade: '',
    curriculum: 'ZIMSEC',
    subjects: ['Maths', 'English']
  })
  const [subject, setSubject] = useState('Maths')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Mangwanani. I am Mwenje, your study companion. Ask me anything, or choose a subject and start with a practice question.'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!loadedProfile) return
    const nextSubjects = loadedProfile.subjects.length ? loadedProfile.subjects : ['Maths', 'English']
    setProfile({
      name: loadedProfile.name,
      grade: loadedProfile.grade,
      curriculum: loadedProfile.curriculum,
      subjects: nextSubjects
    })
    setSubject((current) => nextSubjects.includes(current) ? current : nextSubjects[0])
    if (profileError) setStatus(profileError)
  }, [loadedProfile, profileError])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const askQuestion = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || loading) return

    setMessage('')
    setMessages((current) => [...current, { role: 'user', text: trimmedMessage }])
    setLoading(true)
    setStatus(null)

    try {
      const prompt = [
        `Student: ${profile.name}`,
        profile.grade ? `Grade/Form: ${profile.grade}` : '',
        `Curriculum: ${profile.curriculum}`,
        `Subject: ${subject}`,
        'Tutor behaviour: be warm, clear, Zimbabwe-aware, and guide the student step by step. Use the Socratic method when helpful. Do not simply do homework; help the student understand the method.',
        '',
        `Student question: ${trimmedMessage}`
      ].filter(Boolean).join('\n')

      const res = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message: prompt })
      })

      if (!res.ok) throw new Error('Mwenje could not answer right now.')
      const data = (await res.json()) as { aiResponse: unknown }
      setMessages((current) => [...current, { role: 'ai', text: getReplyText(data.aiResponse) }])
    } catch (e) {
      setMessages((current) => [
        ...current,
        { role: 'ai', text: e instanceof Error ? e.message : 'Mwenje could not answer right now.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const profileSubjects = profile.subjects.length ? profile.subjects : allSubjects
  const suggestions = [
    'Explain this topic simply',
    'Give me a practice question',
    'What should I know for exams?',
    'Show me a worked example'
  ]

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 md:px-10 md:py-12">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white shadow-soft sm:rounded-[32px]">
          <div className="border-b border-[rgba(28,25,23,0.08)] p-5 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">AI Tutor</p>
                <h1 className="mt-2 text-2xl font-display font-semibold text-text-primary sm:text-4xl">Ask Mwenje a question</h1>
                <p className="mt-3 max-w-2xl text-text-secondary">Warm step-by-step help for your current subject and curriculum.</p>
              </div>
              {user ? (
                <span className="rounded-full bg-[#F8F2EC] px-4 py-2 text-sm font-semibold text-accent-primary">
                  {profile.curriculum}{profile.grade ? ` - ${profile.grade}` : ''}
                </span>
              ) : null}
            </div>
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
              {profileSubjects.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubject(item)}
                  className={`max-w-[78vw] shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition sm:max-w-none ${
                    item === subject
                      ? 'border-accent-primary bg-[#FFF0E6] text-accent-primary'
                      : 'border-[rgba(28,25,23,0.08)] bg-bg-secondary text-text-secondary hover:bg-[#fbf2e7]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[calc(100svh-18rem)] flex-col lg:min-h-[620px]">
            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-8">
              {messages.map((item, index) => (
                <div key={index} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] whitespace-pre-line break-words rounded-[24px] px-4 py-3 text-sm leading-7 sm:max-w-[85%] sm:px-5 sm:py-4 ${
                    item.role === 'user'
                      ? 'rounded-br-md bg-text-primary text-white'
                      : 'rounded-tl-md border border-[#F4DEB8] bg-[#FFF8E6] text-text-primary'
                  }`}>
                    {item.text}
                  </div>
                </div>
              ))}
              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-[24px] rounded-tl-md border border-[#F4DEB8] bg-[#FFF8E6] px-5 py-4 text-sm text-text-secondary">
                    Mwenje is thinking...
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {messages.length <= 2 ? (
              <div className="flex gap-2 overflow-x-auto border-t border-[rgba(28,25,23,0.08)] px-5 py-3 sm:px-8">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMessage(item)}
                    className="shrink-0 rounded-full border border-[rgba(28,25,23,0.08)] bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-[#fbf2e7]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}

            {status ? (
              <div className="mx-5 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary px-5 py-4 text-sm text-text-secondary sm:mx-8">
                {status}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-[rgba(28,25,23,0.08)] p-4 sm:flex-row sm:p-8">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    askQuestion()
                  }
                }}
                rows={1}
                className="max-h-32 min-h-[52px] min-w-0 flex-1 resize-none rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary"
                placeholder={`Ask about ${subject}...`}
              />
              <button
                type="button"
                onClick={askQuestion}
                disabled={loading || !message.trim()}
                className="inline-flex h-[52px] shrink-0 items-center justify-center rounded-full bg-accent-primary px-6 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

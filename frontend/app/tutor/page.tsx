'use client'

import { useState } from 'react'

const subjects = ['Maths', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Commerce', 'Shona', 'French']

export default function TutorPage() {
  const [subject, setSubject] = useState('Maths')
  const [message, setMessage] = useState('')
  const [responses, setResponses] = useState<string[]>([])

  const askQuestion = () => {
    if (!message.trim()) return
    setResponses([...responses, `You asked about ${subject}: ${message}`])
    setMessage('')
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Subject selector</p>
            <div className="mt-6 space-y-3">
              {subjects.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubject(item)}
                  className={`block w-full rounded-3xl px-5 py-3 text-left text-sm font-medium transition ${item === subject ? 'bg-accent-primary text-white' : 'bg-bg-secondary text-text-primary hover:bg-[#FFF0E6]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>
          <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-8 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">AI Tutor</p>
                <h1 className="mt-2 text-3xl font-display font-semibold text-text-primary">Ask Mwenje a question</h1>
              </div>
              <span className="rounded-full bg-[#F8F2EC] px-4 py-2 text-sm font-semibold text-accent-primary">{subject}</span>
            </div>
            <div className="mt-8 space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-secondary">Your question</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-4 text-text-primary outline-none focus:border-accent-secondary"
                  placeholder="Explain the quadratic formula step by step..."
                />
              </div>
              <button type="button" onClick={askQuestion} className="inline-flex items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26]">
                Ask Mwenje
              </button>
            </div>
            <div className="mt-10 space-y-4">
              {responses.length === 0 ? (
                <div className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6 text-text-secondary">Your tutor replies will appear here.</div>
              ) : (
                responses.map((reply, index) => (
                  <div key={index} className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-[#FFF8E6] p-6 text-text-primary">
                    {reply}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

'use client'

import { useState } from 'react'

const subjects = ['English Language', 'English Literature', 'History', 'Geography']

export default function EssayPage() {
  const [subject, setSubject] = useState(subjects[0])
  const [content, setContent] = useState('')

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-8 shadow-soft">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Essay feedback</p>
            <h1 className="text-4xl font-display font-semibold text-text-primary">Improve your writing with AI review</h1>
            <p className="max-w-3xl text-text-secondary">Paste an essay and get structure, grammar, and scoring feedback aligned to examination standards.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Subject context</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                {subjects.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="block" />
          </div>
          <div className="mt-8">
            <label className="block text-sm font-medium text-text-secondary">Paste your essay</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="mt-4 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-4 text-text-primary outline-none focus:border-accent-secondary"
              placeholder="Write or paste your essay here..."
            />
          </div>
          <button className="mt-8 inline-flex items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26]">
            Request feedback
          </button>
          <div className="mt-10 rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-[#FFF6E8] p-6">
            <p className="text-sm font-semibold text-text-primary">Feedback note</p>
            <p className="mt-3 text-text-secondary">A sample report, score and improved paragraph will appear here after review.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

'use client'

import { useState } from 'react'

export default function PlannerPage() {
  const [examSubject, setExamSubject] = useState('Maths')
  const [examDate, setExamDate] = useState('')
  const [schedule, setSchedule] = useState<string[]>([])

  const generate = () => {
    setSchedule([
      'Monday — Maths revision: algebra and statistics',
      'Wednesday — English essay planning',
      'Friday — Biology past paper review'
    ])
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Study planner</p>
            <h1 className="text-3xl font-display font-semibold text-text-primary sm:text-4xl">Plan your revision with ease</h1>
            <p className="max-w-3xl text-text-secondary">Add upcoming exams and let Mwenje create a balanced daily schedule around them.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Exam subject</span>
              <input
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Exam date</span>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary"
              />
            </label>
            <div className="flex items-end">
              <button type="button" onClick={generate} className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26]">
                Generate plan
              </button>
            </div>
          </div>
          {schedule.length > 0 && (
            <div className="mt-10 rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-5 sm:rounded-[32px] sm:p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Weekly schedule</p>
              <div className="mt-5 space-y-3 text-text-secondary">
                {schedule.map((line) => (
                  <div key={line} className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-white p-4">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

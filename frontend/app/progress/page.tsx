'use client'

import { useState } from 'react'

const badges = ['First Light', 'Sharp Mind', 'Consistent']
const history = [
  { label: 'Quiz 1', score: 74 },
  { label: 'Quiz 2', score: 85 },
  { label: 'Quiz 3', score: 92 }
]

export default function ProgressPage() {
  const [selected, setSelected] = useState('Maths')

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Progress tracker</p>
              <h1 className="mt-2 text-4xl font-display font-semibold text-text-primary">See your growth over time</h1>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Subject</span>
              <select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-2 rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                <option>Maths</option>
                <option>English</option>
                <option>Science</option>
              </select>
            </label>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-[#FFF8E6] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Mastery score</p>
              <p className="mt-4 text-5xl font-semibold text-text-primary">84%</p>
              <p className="mt-2 text-text-secondary">Your lamp is shining brighter in {selected}.</p>
            </div>
            <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Time studied</p>
              <p className="mt-4 text-5xl font-semibold text-text-primary">12h</p>
              <p className="mt-2 text-text-secondary">This week across all subjects.</p>
            </div>
            <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Active streak</p>
              <p className="mt-4 text-5xl font-semibold text-text-primary">7d</p>
              <p className="mt-2 text-text-secondary">Keep your momentum going.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_0.95fr]">
            <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-[#FDF8F1] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Quiz history</p>
              <div className="mt-6 space-y-4">
                {history.map((entry) => (
                  <div key={entry.label} className="rounded-3xl bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-text-primary">
                      <span>{entry.label}</span>
                      <span className="font-semibold">{entry.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Badges earned</p>
              <div className="mt-6 grid gap-4">
                {badges.map((badge) => (
                  <div key={badge} className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-4 text-text-primary">
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

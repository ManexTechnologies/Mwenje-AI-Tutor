'use client'

import { useState } from 'react'

const topics = ['Algebra', 'Essay writing', 'Cell biology', 'World history']
const difficulties = ['Foundation', 'Core', 'Extended']

export default function QuizPage() {
  const [subject, setSubject] = useState('Maths')
  const [topic, setTopic] = useState('Algebra')
  const [difficulty, setDifficulty] = useState('Core')

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-8 shadow-soft">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Quiz engine</p>
            <h1 className="text-4xl font-display font-semibold text-text-primary">Practice with smart questions</h1>
            <p className="max-w-3xl text-text-secondary">Select a subject, topic, and difficulty level to generate practice questions tailored to your curriculum.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Subject</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                <option>Maths</option>
                <option>English</option>
                <option>Science</option>
                <option>History</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Topic</span>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                {topics.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Difficulty</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                {difficulties.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
          </div>
          <button className="mt-10 inline-flex items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26]">
            Generate quiz
          </button>
          <div className="mt-10 rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6">
            <p className="text-sm font-semibold text-text-primary">Preview</p>
            <p className="mt-3 text-text-secondary">AI-generated questions will appear here once your quiz is created.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

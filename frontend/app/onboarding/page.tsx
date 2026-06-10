'use client'

import { useState } from 'react'
import { getSubjectsForGrade } from '@/lib/learning'

const roles = ['student', 'teacher', 'parent']
const curricula = ['zimsec', 'cambridge']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('student')
  const [grade, setGrade] = useState(10)
  const [curriculum, setCurriculum] = useState('zimsec')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Maths', 'English'])
  const availableSubjects = getSubjectsForGrade(grade)

  function handleGradeChange(nextGrade: number) {
    const nextSubjects = getSubjectsForGrade(nextGrade)
    setGrade(nextGrade)
    setSelectedSubjects((current) => {
      const selectedForGrade = current.filter((subject) => nextSubjects.includes(subject))
      return selectedForGrade.length ? selectedForGrade : ['Maths', 'English'].filter((subject) => nextSubjects.includes(subject))
    })
  }

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject])
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-8">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Meet Mwenje</p>
          <h1 className="mt-3 text-3xl font-display font-semibold sm:text-4xl">Set up your learning path</h1>
          <div className="mt-8 flex gap-2">
            {[0, 1, 2].map((item) => <span key={item} className={`h-2 flex-1 rounded-full ${item <= step ? 'bg-accent-primary' : 'bg-bg-secondary'}`} />)}
          </div>

          {step === 0 ? (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Choose your role</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {roles.map((item) => (
                  <button key={item} type="button" onClick={() => setRole(item)} className={`rounded-3xl px-5 py-4 text-left capitalize ${role === item ? 'bg-accent-primary text-white' : 'bg-bg-secondary'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <label>
                <span className="text-sm font-medium text-text-secondary">Grade</span>
                <select value={grade} onChange={(e) => handleGradeChange(Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3">
                  {[8, 9, 10, 11, 12].map((item) => <option key={item} value={item}>Grade {item}</option>)}
                </select>
              </label>
              <label>
                <span className="text-sm font-medium text-text-secondary">Curriculum</span>
                <select value={curriculum} onChange={(e) => setCurriculum(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3">
                  {curricula.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
                </select>
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Choose subjects</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {availableSubjects.map((subject) => (
                  <button key={subject} type="button" onClick={() => toggleSubject(subject)} className={`rounded-3xl px-5 py-3 text-left ${selectedSubjects.includes(subject) ? 'bg-accent-primary text-white' : 'bg-bg-secondary'}`}>
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} className="rounded-full bg-bg-secondary px-5 py-3 text-sm font-semibold">Back</button>
            {step < 2 ? (
              <button type="button" onClick={() => setStep((current) => current + 1)} className="rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white">Continue</button>
            ) : (
              <div className="rounded-3xl bg-bg-secondary px-5 py-4 text-sm text-text-secondary">
                Ready: {role}, Grade {grade}, {curriculum.toUpperCase()}, {selectedSubjects.length} subjects.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

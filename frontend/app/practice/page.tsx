'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '@/components/profile-provider'
import { difficulties, subjects, subjectTopics } from '@/lib/learning'

const apiBase = '/backend'
const questionTypes = ['Mixed', 'MCQ', 'Short answer', 'True/false', 'Fill in the blank']

type PracticeQuestion = {
  id: string
  type: string
  prompt: string
  options?: string[]
  answer: string
  explanation: string
}

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function isAnswerCorrect(question: PracticeQuestion, value?: string) {
  const userAnswer = normalizeAnswer(value || '')
  const correctAnswer = normalizeAnswer(question.answer)

  if (!userAnswer) return false
  if (userAnswer === correctAnswer) return true

  const numericCorrectAnswer = correctAnswer.match(/^-?\d+(\.\d+)?/)?.[0]
  return Boolean(numericCorrectAnswer && userAnswer === numericCorrectAnswer)
}

function explanationSteps(explanation: string) {
  const steps = explanation
    .replace(/,\s*then\s+/gi, '. Then ')
    .replace(/,\s*so\s+/gi, '. So ')
    .replace(/:\s*/g, ': ')
    .split(/(?<=[.!?])\s+/)
    .map((step) => step.trim())
    .filter(Boolean)

  return steps.length ? steps : [explanation]
}

export default function PracticePage() {
  const { user, authReady, profile, profileError } = useProfile()
  const [profileSubjects, setProfileSubjects] = useState<string[]>(subjects)
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('Maths')
  const [topic, setTopic] = useState('Algebra')
  const [difficulty, setDifficulty] = useState('Core')
  const [questionType, setQuestionType] = useState('Mixed')
  const [count, setCount] = useState(5)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const topics = useMemo(() => subjectTopics[subject] || [], [subject])
  const selectedSubjects = profileSubjects.length ? profileSubjects : subjects

  useEffect(() => {
    if (!profile) return
    const nextSubjects = profile.subjects.length ? profile.subjects : subjects
    const nextSubject = nextSubjects.includes(subject) ? subject : nextSubjects[0]
    setProfileSubjects(nextSubjects)
    setGrade(profile.grade)
    setSubject(nextSubject)
    setTopic((current) => subjectTopics[nextSubject]?.includes(current) ? current : subjectTopics[nextSubject]?.[0] || '')
    if (profileError) setStatus(profileError)
  }, [profile, profileError, subject])

  function chooseSubject(nextSubject: string) {
    setSubject(nextSubject)
    setTopic(subjectTopics[nextSubject]?.[0] || '')
  }

  async function generatePractice() {
    if (!topic) {
      setStatus('Choose a topic before generating practice.')
      return
    }

    setLoading(true)
    setStatus('Generating practice...')
    setQuestions([])
    setAnswers({})
    setSubmitted(false)

    try {
      const res = await fetch(`${apiBase}/ai/practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, difficulty, questionType, count, grade })
      })
      if (!res.ok) throw new Error('Could not generate practice')
      const data = (await res.json()) as { practice: { questions: PracticeQuestion[] } }
      setQuestions(data.practice.questions)
      setStatus(null)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not generate practice')
    } finally {
      setLoading(false)
    }
  }

  const score = submitted
    ? questions.filter((question) => isAnswerCorrect(question, answers[question.id])).length
    : 0

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Smart practice</p>
            <h1 className="text-3xl font-display font-semibold sm:text-4xl">Practice with instant explanations</h1>
            <p className="max-w-3xl text-text-secondary">Choose from your focus subjects, then set the topic, difficulty, and question style. Mwenje gives explanations after you submit.</p>
          </div>
          {authReady && !user ? (
            <div className="mt-8 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6 text-text-secondary">
              Log in to limit practice to the subjects saved in your profile.
              <Link href="/login" className="ml-2 font-semibold text-accent-primary hover:underline">Log in</Link>
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 md:grid-cols-5">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Subject</span>
              <select value={subject} onChange={(e) => chooseSubject(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 outline-none focus:border-accent-secondary">
                {selectedSubjects.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Topic</span>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 outline-none focus:border-accent-secondary">
                {topics.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Difficulty</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 outline-none focus:border-accent-secondary">
                {difficulties.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Type</span>
              <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 outline-none focus:border-accent-secondary">
                {questionTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Questions</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 outline-none focus:border-accent-secondary">
                {[5, 8, 10].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <button type="button" onClick={generatePractice} disabled={loading} className="mt-8 inline-flex w-full justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26] disabled:opacity-60 sm:w-auto">
            {loading ? 'Generating...' : 'Generate practice'}
          </button>
          {status ? <div className="mt-6 rounded-3xl bg-bg-secondary px-5 py-4 text-sm text-text-secondary">{status}</div> : null}

          <div className="mt-10 space-y-5">
            {questions.map((question, index) => (
              <div key={question.id} className={`rounded-3xl border p-5 ${
                submitted
                  ? isAnswerCorrect(question, answers[question.id])
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                  : 'border-transparent bg-bg-secondary'
              }`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">{question.type} {index + 1}</p>
                <p className="mt-2 font-medium">{question.prompt}</p>
                {question.options?.length ? (
                  <div className="mt-4 grid gap-3">
                    {question.options.map((option) => {
                      const isSelected = answers[question.id] === option
                      const isCorrectOption = normalizeAnswer(option) === normalizeAnswer(question.answer)
                      return (
                      <label key={option} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                        submitted && isCorrectOption
                          ? 'border-green-300 bg-green-50 text-green-800'
                          : submitted && isSelected && !isCorrectOption
                            ? 'border-red-300 bg-red-50 text-red-800'
                            : 'border-transparent bg-white'
                      }`}>
                        <input disabled={submitted} type="radio" name={question.id} value={option} checked={isSelected} onChange={(e) => setAnswers((current) => ({ ...current, [question.id]: e.target.value }))} />
                        <span>{option}</span>
                      </label>
                      )
                    })}
                  </div>
                ) : (
                  <input disabled={submitted} value={answers[question.id] || ''} onChange={(e) => setAnswers((current) => ({ ...current, [question.id]: e.target.value }))} className="mt-4 w-full rounded-2xl border border-[rgba(28,25,23,0.1)] bg-white px-4 py-3 outline-none focus:border-accent-secondary disabled:opacity-80" placeholder="Your answer" />
                )}
                {submitted ? (
                  <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-text-secondary">
                    <p className={`font-semibold ${isAnswerCorrect(question, answers[question.id]) ? 'text-green-700' : 'text-red-700'}`}>
                      {isAnswerCorrect(question, answers[question.id]) ? 'Correct' : 'Needs correction'}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <p><span className="font-semibold text-text-primary">Your answer:</span> {answers[question.id] || 'No answer'}</p>
                      <p><span className="font-semibold text-text-primary">Correct answer:</span> {question.answer}</p>
                    </div>
                    {!isAnswerCorrect(question, answers[question.id]) ? (
                      <div className="mt-4 rounded-2xl bg-bg-secondary p-4">
                        <p className="font-semibold text-text-primary">Where you went wrong</p>
                        <p className="mt-2">Your answer does not match the required result. Compare your working with the steps below and check the operation or substitution used.</p>
                      </div>
                    ) : null}
                    <div className="mt-4">
                      <p className="font-semibold text-text-primary">Step-by-step explanation</p>
                      <ol className="mt-2 space-y-2">
                        {explanationSteps(question.explanation).map((step, stepIndex) => (
                          <li key={`${question.id}-step-${stepIndex}`} className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-xs font-semibold text-accent-primary">{stepIndex + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {questions.length ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => setSubmitted(true)} className="rounded-full bg-text-primary px-6 py-3 text-sm font-semibold text-white">Submit practice</button>
              {submitted ? <span className="text-sm font-semibold">Score: {score}/{questions.length}</span> : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

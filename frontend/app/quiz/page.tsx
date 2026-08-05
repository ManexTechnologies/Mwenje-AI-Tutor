'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '@/components/profile-provider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { difficulties, subjects, subjectTopics } from '@/lib/learning'
const apiBase = '/backend'

type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  answer: string
  explanation?: string
}

type GeneratedQuiz = {
  subject: string
  topic: string
  difficulty: string
  questions: QuizQuestion[]
}

export default function QuizPage() {
  const { user, authReady, profile, profileError } = useProfile()
  const [profileSubjects, setProfileSubjects] = useState<string[]>(subjects)
  const [subject, setSubject] = useState('Maths')
  const [topic, setTopic] = useState('Algebra')
  const [difficulty, setDifficulty] = useState('Core')
  const [phase, setPhase] = useState<'setup' | 'loading' | 'question' | 'result'>('setup')
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const topics = useMemo(() => subjectTopics[subject] || [], [subject])

  useEffect(() => {
    const savedTutorQuiz = window.localStorage.getItem('mwenjeTutorQuiz')
    if (savedTutorQuiz) {
      try {
        const parsed = JSON.parse(savedTutorQuiz) as GeneratedQuiz
        window.localStorage.removeItem('mwenjeTutorQuiz')
        setQuiz(parsed)
        setSubject(parsed.subject)
        setTopic(parsed.topic)
        setDifficulty(parsed.difficulty)
        setPhase('question')
      } catch {
        window.localStorage.removeItem('mwenjeTutorQuiz')
      }
    }
  }, [])

  useEffect(() => {
    if (!profile) return
    const nextSubjects = profile.subjects.length ? profile.subjects : subjects
    const nextSubject = nextSubjects.includes(subject) ? subject : nextSubjects[0]
    setProfileSubjects(nextSubjects)
    setSubject(nextSubject)
    setTopic((current) => subjectTopics[nextSubject]?.includes(current) ? current : subjectTopics[nextSubject]?.[0] || '')
    if (profileError) setStatus(profileError)
  }, [profile, profileError, subject])

  async function generateQuiz() {
    if (!topic) {
      setStatus('Choose a topic before generating a quiz.')
      return
    }

    setLoading(true)
    setPhase('loading')
    setStatus('Generating quiz...')
    setScore(null)
    setQuiz(null)
    setAnswers({})
    setCurrent(0)
    setSelected('')
    setShowAnswer(false)

    try {
      const res = await fetch(`${apiBase}/ai/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, difficulty })
      })

      if (!res.ok) throw new Error('Could not generate quiz')
      const data = (await res.json()) as { quiz: GeneratedQuiz }
      setQuiz(data.quiz)
      setPhase('question')
      if (authReady && !user) {
        setStatus('Log in to save your quiz score.')
      } else {
        setStatus(null)
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not generate quiz')
      setPhase('setup')
    } finally {
      setLoading(false)
    }
  }

  async function markAndSaveQuiz(nextQuiz: GeneratedQuiz, nextAnswers: Record<string, string>) {
    if (!user) {
      setStatus('Score calculated. Log in to save your progress.')
      return
    }

    try {
      const res = await fetchWithAuth(`${apiBase}/ai/quiz/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: nextQuiz, answers: nextAnswers })
      })

      if (!res.ok) throw new Error('Score calculated, but progress was not saved')
      const data = await res.json() as { result?: { score: number } }
      if (typeof data.result?.score === 'number') setScore(data.result.score)
      setStatus('Progress saved')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Progress was not saved')
    }
  }

  async function goNext() {
    if (!quiz) return
    if (!selected) return

    const question = quiz.questions[current]
    const nextAnswers = { ...answers, [question.id]: selected }
    setAnswers(nextAnswers)

    if (current + 1 < quiz.questions.length) {
      setCurrent((value) => value + 1)
      setSelected(nextAnswers[quiz.questions[current + 1].id] || '')
      setShowAnswer(false)
      return
    }

    const correct = quiz.questions.filter((item) => nextAnswers[item.id] === item.answer).length
    const nextScore = Math.round((correct / quiz.questions.length) * 100)
    setScore(nextScore)
    setPhase('result')
    setStatus(null)
    await markAndSaveQuiz(quiz, nextAnswers)
  }

  function chooseSubject(nextSubject: string) {
    setSubject(nextSubject)
    setTopic(subjectTopics[nextSubject]?.[0] || '')
  }

  function resetQuiz() {
    setPhase('setup')
    setQuiz(null)
    setAnswers({})
    setCurrent(0)
    setSelected('')
    setShowAnswer(false)
    setScore(null)
    setStatus(null)
  }

  const currentQuestion = quiz?.questions[current]
  const selectedSubjects = profileSubjects.length ? profileSubjects : subjects

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 md:px-10 md:py-12">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-4 shadow-soft sm:rounded-[32px] sm:p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Quiz engine</p>
            <h1 className="text-2xl font-display font-semibold text-text-primary sm:text-4xl">Practice with smart questions</h1>
            <p className="max-w-3xl text-text-secondary">Select a subject, topic, and difficulty level to generate practice questions tailored to your curriculum.</p>
          </div>
          {authReady && !user ? (
            <div className="mt-8 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6 text-text-secondary">
              You can generate quizzes now. Log in when you want to save scores to your progress.
              <Link href="/login" className="ml-2 font-semibold text-accent-primary hover:underline">Log in</Link>
            </div>
          ) : null}

          {phase === 'setup' ? (
            <>
              <div className="mt-10 space-y-8">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Subject</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSubjects.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => chooseSubject(item)}
                        className={`max-w-full rounded-full border px-4 py-2 text-sm font-semibold transition ${
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

                <div>
                  <p className="text-sm font-medium text-text-secondary">Topic</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topics.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTopic(item)}
                        className={`max-w-full rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          item === topic
                            ? 'border-accent-secondary bg-[#FFF8E6] text-accent-primary'
                            : 'border-[rgba(28,25,23,0.08)] bg-bg-secondary text-text-secondary hover:bg-[#fbf2e7]'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-text-secondary">Difficulty</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {difficulties.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          level === difficulty
                            ? 'border-accent-primary bg-[#FFF0E6] text-accent-primary'
                            : 'border-[rgba(28,25,23,0.08)] bg-bg-secondary text-text-secondary hover:bg-[#fbf2e7]'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={generateQuiz}
                disabled={loading}
                className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Generate 5 questions
              </button>
            </>
          ) : null}

          {status ? (
            <div className="mt-6 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary px-5 py-4 text-sm text-text-secondary">
              {status}
            </div>
          ) : null}

          {phase === 'loading' ? (
            <div className="mt-10 rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-8 text-center text-text-secondary sm:rounded-[32px]">
              Crafting your quiz...
            </div>
          ) : null}

          {phase === 'question' && quiz && currentQuestion ? (
            <div className="mt-10 rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-4 sm:rounded-[32px] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">Question {current + 1} of {quiz.questions.length}</p>
                <span className="max-w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-accent-primary">{quiz.subject} - {quiz.topic}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-accent-primary transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
              </div>
              <div className="mt-6 rounded-3xl bg-white p-5">
                <p className="font-medium leading-7 text-text-primary">{currentQuestion.prompt}</p>
              </div>
              <div className="mt-5 grid gap-3">
                {currentQuestion.options.map((option) => {
                  const isCorrect = showAnswer && option === currentQuestion.answer
                  const isWrong = showAnswer && selected === option && option !== currentQuestion.answer

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        if (!showAnswer) setSelected(option)
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm leading-6 transition ${
                        isCorrect
                          ? 'border-green-300 bg-green-50 text-green-800'
                          : isWrong
                            ? 'border-red-300 bg-red-50 text-red-800'
                            : selected === option
                              ? 'border-accent-primary bg-[#FFF0E6] text-text-primary'
                              : 'border-[rgba(28,25,23,0.08)] bg-white text-text-primary hover:bg-[#FFF8E6]'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              {showAnswer ? (
                <div className="mt-5 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-white p-5 text-sm leading-6 text-text-secondary">
                  Correct answer: <span className="font-semibold text-text-primary">{currentQuestion.answer}</span>
                </div>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {!showAnswer ? (
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    disabled={!selected}
                    className="inline-flex w-full items-center justify-center rounded-full border border-accent-primary px-6 py-3 text-sm font-semibold text-accent-primary hover:bg-[#FFF0E6] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    Check answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white hover:bg-[#b55a26] sm:w-auto"
                  >
                    {current + 1 >= quiz.questions.length ? 'See results' : 'Next question'}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {phase === 'result' && quiz && score !== null ? (
            <div className="mt-10 rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-5 text-center sm:rounded-[32px] sm:p-8">
              <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Quiz result</p>
              <h2 className="mt-3 text-3xl font-display font-semibold text-text-primary">You scored {score}%</h2>
              <p className="mt-3 text-text-secondary">{quiz.subject} - {quiz.topic} - {quiz.difficulty}</p>
              <div className="mt-8 space-y-4 text-left">
                {quiz.questions.map((question, index) => {
                  const wasCorrect = answers[question.id] === question.answer
                  return (
                    <div key={question.id} className={`rounded-3xl border bg-white p-5 ${wasCorrect ? 'border-green-200' : 'border-red-200'}`}>
                      <p className="text-sm font-semibold text-text-primary">{index + 1}. {question.prompt}</p>
                      <p className={`mt-3 text-sm ${wasCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {wasCorrect ? 'Correct' : `You chose: ${answers[question.id] || 'No answer'}`}
                      </p>
                      {!wasCorrect ? <p className="mt-1 text-sm text-text-secondary">Correct answer: {question.answer}</p> : null}
                      {question.explanation ? <p className="mt-2 text-sm text-text-secondary">{question.explanation}</p> : null}
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={resetQuiz}
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26] sm:w-auto"
              >
                Try another quiz
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '@/components/profile-provider'
import { subjects, subjectTopics } from '@/lib/learning'

const apiBase = '/backend'

type Flashcard = {
  id: string
  front: string
  back: string
  example: string
}

export default function FlashcardsPage() {
  const { profile, profileError } = useProfile()
  const [profileSubjects, setProfileSubjects] = useState<string[]>(subjects)
  const [subject, setSubject] = useState('Biology')
  const [topic, setTopic] = useState('Cell biology')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const topics = useMemo(() => subjectTopics[subject] || [], [subject])
  const current = cards[index]

  useEffect(() => {
    if (!profile) return
    const nextSubjects = profile.subjects.length ? profile.subjects : subjects
    const nextSubject = nextSubjects.includes(subject) ? subject : nextSubjects[0]
    setProfileSubjects(nextSubjects)
    setSubject(nextSubject)
    setTopic((currentTopic) => subjectTopics[nextSubject]?.includes(currentTopic) ? currentTopic : subjectTopics[nextSubject]?.[0] || '')
    if (profileError) setStatus(profileError)
  }, [profile, profileError, subject])

  async function generateDeck() {
    if (!topic) {
      setStatus('Choose a topic before generating flashcards.')
      return
    }

    setLoading(true)
    setStatus('Building flashcards...')
    setCards([])
    setIndex(0)
    setFlipped(false)

    try {
      const res = await fetch(`${apiBase}/ai/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, count: 8 })
      })
      if (!res.ok) throw new Error('Could not generate flashcards')
      const data = (await res.json()) as { deck: { cards: Flashcard[] } }
      setCards(data.deck.cards)
      setStatus(null)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not generate flashcards')
    } finally {
      setLoading(false)
    }
  }

  function nextCard() {
    if (!cards.length) return
    setIndex((currentIndex) => (currentIndex + 1) % cards.length)
    setFlipped(false)
  }

  function previousCard() {
    if (!cards.length) return
    setIndex((currentIndex) => (currentIndex - 1 + cards.length) % cards.length)
    setFlipped(false)
  }

  function chooseSubject(nextSubject: string) {
    setSubject(nextSubject)
    setTopic(subjectTopics[nextSubject]?.[0] || '')
    setCards([])
    setIndex(0)
    setFlipped(false)
    setStatus(null)
  }

  function markCard(label: string) {
    setStatus(`${label}. Card ${Math.min(index + 2, cards.length)} is ready.`)
    nextCard()
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 md:px-10 md:py-12">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-4 shadow-soft sm:rounded-[32px] sm:p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Flashcards</p>
            <h1 className="text-2xl font-display font-semibold sm:text-4xl">Review with spaced repetition cards</h1>
            <p className="max-w-3xl text-text-secondary">Generate a quick deck for any topic. The full SM-2 review schedule will build on this deck structure.</p>
          </div>

          <div className="mt-10 space-y-8">
            <div>
              <p className="text-sm font-medium text-text-secondary">Subject</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profileSubjects.map((item) => (
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
                    onClick={() => {
                      setTopic(item)
                      setCards([])
                      setIndex(0)
                      setFlipped(false)
                      setStatus(null)
                    }}
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
          </div>
          <button type="button" onClick={generateDeck} disabled={loading} className="mt-8 inline-flex w-full justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26] disabled:opacity-60 sm:w-auto">
            {loading ? 'Generating...' : `Generate ${subject} cards`}
          </button>
          {status ? <div className="mt-6 rounded-3xl bg-bg-secondary px-5 py-4 text-sm text-text-secondary">{status}</div> : null}

          <div className="mt-10">
            {current ? (
              <button
                type="button"
                onClick={() => setFlipped((value) => !value)}
                className={`min-h-[280px] w-full rounded-[24px] border p-5 text-center shadow-soft transition sm:min-h-[320px] sm:rounded-[32px] sm:p-8 ${
                  flipped
                    ? 'border-green-200 bg-green-50'
                    : 'border-[#F4DEB8] bg-[#FFF8E6]'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
                  {flipped ? 'Answer' : 'Question'} - Card {index + 1} of {cards.length}
                </p>
                <div className="flex min-h-[180px] flex-col items-center justify-center">
                  <h2 className={`break-words text-xl font-semibold leading-8 sm:text-2xl sm:leading-9 ${flipped ? 'text-success' : 'text-text-primary'}`}>
                    {flipped ? current.back : current.front}
                  </h2>
                  <p className="mt-5 max-w-2xl text-text-secondary">
                    {flipped ? current.example : 'Tap to reveal the answer.'}
                  </p>
                </div>
              </button>
            ) : (
              <div className="rounded-3xl bg-bg-secondary p-6 text-text-secondary">Generated flashcards will appear here.</div>
            )}
          </div>
          {current ? (
            <div className="mt-6 space-y-6">
              <div className="flex justify-center gap-2">
                {cards.map((card, cardIndex) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setIndex(cardIndex)
                      setFlipped(false)
                    }}
                    className={`h-2 rounded-full transition-all ${cardIndex === index ? 'w-8 bg-accent-primary' : 'w-2 bg-bg-secondary'}`}
                    aria-label={`Go to card ${cardIndex + 1}`}
                  />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <button type="button" onClick={previousCard} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-text-primary shadow-sm">Previous</button>
                <button type="button" onClick={nextCard} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-text-primary shadow-sm">Next</button>
                <button type="button" onClick={() => markCard('Marked for review')} className="rounded-full bg-[#FFF0E6] px-5 py-3 text-sm font-semibold text-accent-primary">Review again</button>
                <button type="button" onClick={() => markCard('Marked as known')} className="rounded-full bg-text-primary px-5 py-3 text-sm font-semibold text-white">Know it</button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

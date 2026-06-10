export type Flashcard = {
  id: string
  front: string
  back: string
  example: string
  intervalDays: number
  easeFactor: number
}

export function generateFlashcardDeck(subject: string, topic: string, count: number) {
  const safeCount = Math.min(Math.max(Number(count) || 8, 4), 12)
  const cards: Flashcard[] = Array.from({ length: safeCount }, (_, index) => ({
    id: `card-${index + 1}`,
    front: `${subject}: ${topic} key idea ${index + 1}`,
    back: `A clear explanation of ${topic} should connect the term to a real ${subject} example.`,
    example: `Example: In ${subject}, ${topic} questions often ask you to define, explain, or apply this idea.`,
    intervalDays: 1,
    easeFactor: 2.5
  }))

  return {
    subject,
    topic,
    algorithm: 'SM-2-ready',
    cards
  }
}

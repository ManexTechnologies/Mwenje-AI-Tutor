import { randomUUID } from 'node:crypto'
import { askClaude } from './claude'

export type PracticeQuestion = {
  id: string
  type: string
  prompt: string
  options?: string[]
  answer: string
  explanation: string
}

export type GeneratedPractice = {
  subject: string
  topic: string
  difficulty: string
  questionType: string
  grade: string
  questions: PracticeQuestion[]
}

const allowedTypes = ['MCQ', 'Short answer', 'True/false', 'Fill in the blank']

function getAiText(response: any) {
  if (typeof response === 'string') return response
  if (typeof response?.reply === 'string') return response.reply
  if (typeof response?.completion === 'string') return response.completion
  if (Array.isArray(response?.content)) {
    return response.content.map((item: any) => item?.text || '').join('\n')
  }
  return JSON.stringify(response)
}

function parsePracticeJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] || text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain JSON')
  }

  return JSON.parse(candidate.slice(start, end + 1))
}

function normalizePractice(
  data: any,
  subject: string,
  topic: string,
  difficulty: string,
  questionType: string,
  grade: string,
  count: number
): GeneratedPractice {
  const rawQuestions = Array.isArray(data?.questions) ? data.questions : []
  const questions = rawQuestions
    .map((question: any, index: number) => {
      const type = String(question?.type || (questionType === 'Mixed' ? allowedTypes[index % allowedTypes.length] : questionType))
      const options = Array.isArray(question?.options)
        ? question.options.map((option: unknown) => String(option)).filter(Boolean).slice(0, 4)
        : undefined

      if (!question?.prompt || !question?.answer || !question?.explanation) return null
      if (type === 'MCQ' && (!options || options.length < 3 || !options.includes(String(question.answer)))) return null
      if (type === 'True/false' && (!options || !options.includes(String(question.answer)))) return null

      return {
        id: String(question.id || `p${index + 1}`),
        type,
        prompt: String(question.prompt),
        options,
        answer: String(question.answer),
        explanation: String(question.explanation)
      }
    })
    .filter(Boolean)
    .slice(0, count) as PracticeQuestion[]

  if (questions.length !== count) {
    throw new Error('AI response did not contain enough valid practice questions')
  }

  return {
    subject: String(data?.subject || subject),
    topic: String(data?.topic || topic),
    difficulty: String(data?.difficulty || difficulty),
    questionType,
    grade,
    questions
  }
}

function buildPracticePrompt(subject: string, topic: string, difficulty: string, questionType: string, count: number, grade: string) {
  const randomSeed = randomUUID()
  const typeInstruction =
    questionType === 'Mixed'
      ? 'Use a varied mix of MCQ, Short answer, True/false, and Fill in the blank.'
      : `Use only ${questionType} questions.`

  return `
Generate fresh practice questions on demand for a learner.

Subject: ${subject}
Topic: ${topic}
Grade/Form: ${grade || 'Not specified'}
Difficulty: ${difficulty}
Question type: ${questionType}
Question count: ${count}
Random seed: ${randomSeed}

Return only valid JSON. Do not include markdown.
The JSON must use this exact shape:
{
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "p1",
      "type": "MCQ",
      "prompt": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Step 1. ... Step 2. ... Step 3. ..."
    }
  ]
}

Rules:
- Create exactly ${count} questions.
- ${typeInstruction}
- Every question must be different.
- Match the learner's grade/form and difficulty.
- Test the selected topic directly, not study advice or theory about answering questions.
- For Maths, generate real numeric problems with solvable answers and step-by-step working.
- For MCQ and True/false, the answer must exactly match one option.
- Explanations must show the working step by step so a learner can see where they went wrong.
`.trim()
}

function makeLocalTestPractice(subject: string, topic: string, difficulty: string, questionType: string, count: number, grade: string) {
  const questions = Array.from({ length: count }, (_, index): PracticeQuestion => {
    const type = questionType === 'Mixed' ? allowedTypes[index % allowedTypes.length] : questionType
    const a = Math.floor(Math.random() * 8) + index + 2
    const b = Math.floor(Math.random() * 6) + index + 3
    const answer = String(a + b)
    const prompt = subject === 'Maths'
      ? `Question ${index + 1}: Calculate ${a} + ${b}.`
      : `Question ${index + 1}: Answer a ${difficulty} ${subject} question about ${topic}.`

    if (type === 'MCQ') {
      return {
        id: `p${index + 1}`,
        type,
        prompt,
        options: [answer, String(a + b + 1), String(a), String(b)],
        answer,
        explanation: `Step 1. Identify the numbers ${a} and ${b}. Step 2. Add them together. Step 3. ${a} + ${b} = ${answer}.`
      }
    }

    return {
      id: `p${index + 1}`,
      type,
      prompt,
      answer,
      explanation: `Step 1. Read the question carefully. Step 2. Work through the selected topic. Step 3. Check that the answer matches the question.`
    }
  })

  return { subject, topic, difficulty, questionType, grade, questions }
}

export async function generatePracticeQuestions(
  subject: string,
  topic: string,
  difficulty: string,
  questionType: string,
  count: number,
  grade = ''
): Promise<GeneratedPractice> {
  const safeCount = Math.min(Math.max(Number(count) || 5, 3), 10)

  if (process.env.NODE_ENV === 'test') {
    return makeLocalTestPractice(subject, topic, difficulty, questionType, safeCount, grade)
  }

  const prompt = buildPracticePrompt(subject, topic, difficulty, questionType, safeCount, grade)
  const response = await askClaude(prompt, subject)
  return normalizePractice(parsePracticeJson(getAiText(response)), subject, topic, difficulty, questionType, grade, safeCount)
}

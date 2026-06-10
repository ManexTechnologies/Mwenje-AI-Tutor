import { askClaude } from './claude'

type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  answer: string
}

export type GeneratedQuiz = {
  subject: string
  topic: string
  difficulty: string
  questions: QuizQuestion[]
}

function getAiText(response: any) {
  if (typeof response === 'string') return response
  if (typeof response?.reply === 'string') return response.reply
  if (typeof response?.completion === 'string') return response.completion
  if (Array.isArray(response?.content)) {
    return response.content.map((item: any) => item?.text || '').join('\n')
  }
  return JSON.stringify(response)
}

function parseQuizJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] || text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain JSON')
  }

  return JSON.parse(candidate.slice(start, end + 1))
}

function normalizeQuiz(data: any, subject: string, topic: string, difficulty: string): GeneratedQuiz {
  const rawQuestions = Array.isArray(data?.questions) ? data.questions : []
  const questions = rawQuestions
    .map((question: any, index: number) => {
      const options = Array.isArray(question?.options)
        ? question.options.map((option: unknown) => String(option)).filter(Boolean).slice(0, 4)
        : []
      const answer = String(question?.answer || '')

      if (!question?.prompt || options.length < 3 || !options.includes(answer)) {
        return null
      }

      return {
        id: String(question.id || `q${index + 1}`),
        prompt: String(question.prompt),
        options,
        answer
      }
    })
    .filter(Boolean) as QuizQuestion[]

  if (questions.length === 0) {
    throw new Error('AI response did not contain valid questions')
  }

  return {
    subject: String(data?.subject || subject),
    topic: String(data?.topic || topic),
    difficulty: String(data?.difficulty || difficulty),
    questions
  }
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function makeQuestion(id: string, prompt: string, answer: string, distractors: string[]): QuizQuestion {
  return {
    id,
    prompt,
    options: shuffle([answer, ...shuffle(distractors).slice(0, 3)]),
    answer
  }
}

function fallbackQuiz(subject: string, topic: string, difficulty: string): GeneratedQuiz {
  const banks: Record<string, Array<{ prompt: string; answer: string; distractors: string[] }>> = {
    Maths: [
      {
        prompt: `In ${topic}, why should each step of a calculation be shown clearly?`,
        answer: 'It helps track the method and avoid hidden mistakes',
        distractors: ['It makes the answer shorter', 'It removes the need for checking', 'It changes the formula', 'It guarantees full marks without accuracy']
      },
      {
        prompt: `Which approach is most useful when solving a ${difficulty} ${topic} problem?`,
        answer: 'Identify the known values before applying a rule',
        distractors: ['Start with the final answer', 'Ignore units', 'Use any formula at random', 'Skip working to save time']
      }
    ],
    English: [
      {
        prompt: `When answering a ${topic} question, what should your response include?`,
        answer: 'Relevant evidence and a clear explanation',
        distractors: ['Only a copied sentence', 'Unrelated personal stories', 'A list without explanation', 'A single-word answer']
      },
      {
        prompt: `What improves a ${difficulty} English answer on ${topic}?`,
        answer: 'Clear structure and accurate language',
        distractors: ['Very long sentences only', 'No paragraphing', 'Ignoring the question', 'Using slang throughout']
      }
    ],
    Physics: [
      {
        prompt: `In ${topic}, why are units important in calculations?`,
        answer: 'They show the physical quantity being measured',
        distractors: ['They replace the formula', 'They are optional in science', 'They make diagrams unnecessary', 'They only matter in essays']
      },
      {
        prompt: `What is the best first step for a ${difficulty} Physics question on ${topic}?`,
        answer: 'List the known quantities and choose a relevant principle',
        distractors: ['Guess the closest number', 'Ignore the diagram', 'Use only memory', 'Write the answer before calculating']
      }
    ],
    Chemistry: [
      {
        prompt: `When working on ${topic}, why should observations be separated from conclusions?`,
        answer: 'Observations describe what is seen, conclusions explain what it means',
        distractors: ['They are always identical', 'Conclusions must come first', 'Observations are not scientific', 'It makes practical work unnecessary']
      },
      {
        prompt: `What helps most in a ${difficulty} Chemistry question on ${topic}?`,
        answer: 'Use correct chemical terms and balance relationships carefully',
        distractors: ['Avoid symbols completely', 'Guess the product every time', 'Ignore state symbols in all questions', 'Use everyday names only']
      }
    ],
    Biology: [
      {
        prompt: `In ${topic}, what makes a biological explanation stronger?`,
        answer: 'Linking structure or process to its function',
        distractors: ['Naming terms without explanation', 'Using physics formulas only', 'Avoiding diagrams completely', 'Writing unrelated definitions']
      },
      {
        prompt: `For a ${difficulty} Biology question on ${topic}, what should you focus on?`,
        answer: 'Accurate key terms and cause-and-effect reasoning',
        distractors: ['Random examples', 'Only copying the question', 'No scientific vocabulary', 'Guessing from the longest option']
      }
    ],
    History: [
      {
        prompt: `When answering a ${topic} question in History, what is most important?`,
        answer: 'Use evidence to support the explanation',
        distractors: ['List dates without context', 'Ignore causes and effects', 'Write only personal opinion', 'Avoid mentioning events']
      },
      {
        prompt: `What improves a ${difficulty} History answer about ${topic}?`,
        answer: 'Explaining causes, consequences, and significance',
        distractors: ['Using one sentence only', 'Mixing unrelated periods', 'Avoiding evidence', 'Repeating the question']
      }
    ],
    Geography: [
      {
        prompt: `In ${topic}, why are examples important?`,
        answer: 'They connect geographic ideas to real places and processes',
        distractors: ['They replace explanation', 'They make maps unnecessary', 'They only matter in Maths', 'They should never be named']
      },
      {
        prompt: `What should you do first in a ${difficulty} Geography question on ${topic}?`,
        answer: 'Identify the command word and relevant geographic process',
        distractors: ['Ignore the map or data', 'Write everything you know', 'Avoid place names', 'Choose the shortest response']
      }
    ],
    Commerce: [
      {
        prompt: `In ${topic}, what makes a business answer stronger?`,
        answer: 'Applying the idea to a realistic business situation',
        distractors: ['Using definitions only', 'Ignoring customers', 'Avoiding examples', 'Writing unrelated calculations']
      },
      {
        prompt: `For a ${difficulty} Commerce question on ${topic}, what should you show?`,
        answer: 'Understanding of benefits, risks, and business decisions',
        distractors: ['Only one-word answers', 'No explanation of terms', 'Random product names', 'Ignoring the question context']
      }
    ],
    Shona: [
      {
        prompt: `Pa${topic}, chii chinonyanya kukosha pakupindura mubvunzo?`,
        answer: 'Kupindura zvakanangana nemubvunzo uchishandisa mutauro wakajeka',
        distractors: ['Kunyora zvisina kurongeka', 'Kusiya pfungwa huru', 'Kushandisa Chirungu chete', 'Kusaverenga mubvunzo']
      },
      {
        prompt: `Mhinduro ye${difficulty} pa${topic} inofanira kuratidza chii?`,
        answer: 'Kunzwisisa nyaya uye kushandisa mazwi akakodzera',
        distractors: ['Kufungidzira chete', 'Kunyora mutsara mumwe chete', 'Kudzokorora mubvunzo chete', 'Kusiya tsananguro']
      }
    ],
    French: [
      {
        prompt: `For French ${topic}, what is most important when choosing an answer?`,
        answer: 'Match meaning, grammar, and context',
        distractors: ['Choose the longest word', 'Ignore accents always', 'Translate every word separately without context', 'Use English grammar rules only']
      },
      {
        prompt: `What helps with a ${difficulty} French question on ${topic}?`,
        answer: 'Check agreement, tense, and vocabulary carefully',
        distractors: ['Guess from spelling only', 'Ignore verb endings', 'Use one tense for everything', 'Avoid reading the sentence']
      }
    ]
  }

  const generic = [
    {
      prompt: `What is the best way to begin a ${difficulty} question on ${topic} in ${subject}?`,
      answer: 'Read the question carefully and identify what is being tested',
      distractors: ['Guess immediately', 'Ignore key words', 'Copy the first option', 'Skip the topic']
    },
    {
      prompt: `What should a good answer about ${topic} show?`,
      answer: 'Understanding of the topic and clear reasoning',
      distractors: ['Only memorised words', 'No explanation', 'Unrelated examples', 'Random facts']
    }
  ]

  const selectedBank = banks[subject] || generic
  const source = shuffle([...selectedBank, ...generic])
  const questions = Array.from({ length: 5 }, (_, index) => {
    const item = source[index % source.length]
    return makeQuestion(`q${index + 1}`, item.prompt, item.answer, item.distractors)
  })

  return {
    subject,
    topic,
    difficulty,
    questions
  }
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('AI quiz generation timed out')), milliseconds)
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout))
  })
}

export async function generateQuiz(subject: string, topic: string, difficulty: string): Promise<GeneratedQuiz> {
  const prompt = `
Generate a curriculum-aligned multiple-choice quiz for a Zimbabwean high school learner.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Return only valid JSON. Do not include markdown or explanations.
The JSON must use this exact shape:
{
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "prompt": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A"
    }
  ]
}

Rules:
- Create 5 questions.
- Each question must have exactly 4 options.
- The answer must exactly match one option.
- Questions must test ${topic}, not generic study advice.
- Keep language clear for high school students.
`.trim()

  try {
    const response = await withTimeout(askClaude(prompt, subject), 12000)
    return normalizeQuiz(parseQuizJson(getAiText(response)), subject, topic, difficulty)
  } catch {
    return fallbackQuiz(subject, topic, difficulty)
  }
}

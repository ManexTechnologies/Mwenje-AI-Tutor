import assert from 'node:assert/strict'
import { after, afterEach, before, describe, it } from 'node:test'
import { AddressInfo } from 'node:net'
import { Server } from 'node:http'
import { createApp } from './app'
import { resetProgressStoreForTests } from './services/progressStore'
import { resetStudyPlansForTests } from './services/studyPlanner'

let baseUrl = ''
let server: Server

before(async () => {
  process.env.NODE_ENV = 'test'
  process.env.TEST_AUTH_UID = 'learner-1'

  server = createApp().listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterEach(() => {
  resetProgressStoreForTests()
  resetStudyPlansForTests()
})

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
})

function authHeaders(token = 'test-token') {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

describe('protected backend routes', () => {
  it('returns an auth error instead of a database error for /auth/me when the database is unavailable', async () => {
    const previousNodeEnv = process.env.NODE_ENV
    const previousDbHost = process.env.DB_HOST
    const previousDbPort = process.env.DB_PORT

    process.env.NODE_ENV = 'development'
    process.env.DB_HOST = '127.0.0.1'
    process.env.DB_PORT = '1'

    const authOnlyServer = createApp().listen(0)
    await new Promise<void>((resolve) => authOnlyServer.once('listening', resolve))
    const address = authOnlyServer.address() as AddressInfo
    const authOnlyBaseUrl = `http://127.0.0.1:${address.port}`

    try {
      const res = await fetch(`${authOnlyBaseUrl}/auth/me`)
      const body = await res.json()

      assert.equal(res.status, 401)
      assert.equal(body.error, 'Missing session')
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = previousNodeEnv

      if (previousDbHost === undefined) delete process.env.DB_HOST
      else process.env.DB_HOST = previousDbHost

      if (previousDbPort === undefined) delete process.env.DB_PORT
      else process.env.DB_PORT = previousDbPort

      await new Promise<void>((resolve, reject) => {
        authOnlyServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    }
  })

  it('rejects requests without an Authorization header', async () => {
    const res = await fetch(`${baseUrl}/progress`)
    const body = await res.json()

    assert.equal(res.status, 401)
    assert.equal(body.error, 'Missing Authorization header')
  })

  it('verifies a valid test session token', async () => {
    const res = await fetch(`${baseUrl}/auth/verify`, {
      method: 'POST',
      headers: authHeaders()
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.success, true)
    assert.equal(body.user.uid, 'learner-1')
  })

  it('rejects an invalid session token', async () => {
    const res = await fetch(`${baseUrl}/auth/verify`, {
      method: 'POST',
      headers: authHeaders('wrong-token')
    })

    assert.equal(res.status, 401)
  })
})

describe('quiz generation', () => {
  it('generates a quiz without requiring authentication', async () => {
    const res = await fetch(`${baseUrl}/ai/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'Maths', topic: 'Algebra', difficulty: 'Core' })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.quiz.subject, 'Maths')
    assert.equal(body.quiz.topic, 'Algebra')
    assert.ok(body.quiz.questions.length > 0)
    assert.ok(body.quiz.questions[0].options.includes(body.quiz.questions[0].answer))
  })
})

describe('practice and flashcards', () => {
  it('generates mixed practice questions', async () => {
    const res = await fetch(`${baseUrl}/ai/practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'Biology', topic: 'Cell biology', difficulty: 'Core', questionType: 'Mixed', count: 6 })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.practice.subject, 'Biology')
    assert.equal(body.practice.questions.length, 6)
    assert.ok(body.practice.questions.some((question: any) => question.explanation))
  })

  it('generates different grade-aware maths questions for each question number', async () => {
    const juniorRes = await fetch(`${baseUrl}/ai/practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'Maths', topic: 'Algebra', difficulty: 'Core', questionType: 'Short answer', count: 5, grade: 'Form 1' })
    })
    const advancedRes = await fetch(`${baseUrl}/ai/practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'Maths', topic: 'Algebra', difficulty: 'Core', questionType: 'Short answer', count: 5, grade: 'Upper 6' })
    })
    const juniorBody = await juniorRes.json()
    const advancedBody = await advancedRes.json()
    const juniorPrompts = juniorBody.practice.questions.map((question: any) => question.prompt)

    assert.equal(juniorRes.status, 200)
    assert.equal(advancedRes.status, 200)
    assert.equal(new Set(juniorPrompts).size, 5)
    assert.notEqual(juniorBody.practice.questions[0].prompt, advancedBody.practice.questions[0].prompt)
    assert.equal(advancedBody.practice.questions.length, 5)
  })

  it('generates SM-2-ready flashcards', async () => {
    const res = await fetch(`${baseUrl}/ai/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'History', topic: 'Independence movements', count: 8 })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.deck.cards.length, 8)
    assert.equal(body.deck.cards[0].intervalDays, 1)
    assert.equal(body.deck.algorithm, 'SM-2-ready')
  })
})

describe('tutor chat AI provider handling', () => {
  it('returns a local fallback answer when no provider is available', async () => {
    const res = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'English Language', message: 'How do I write a strong introduction?' })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(typeof body.aiResponse, 'string')
    assert.ok(body.aiResponse.includes('unable to access the AI tutor service') || body.aiResponse.length > 0)
  })

  it('does not fabricate a local answer from internal learner context', async () => {
    const message = [
      'Student: Emmanuel M Mamvura',
      'Grade/Form: Upper 6',
      'Curriculum: ZIMSEC',
      'Subject: Maths',
      'Tutor behaviour: be warm, clear, Zimbabwe-aware, and guide the student step by step.',
      '',
      'Student question: What should I know for exams?'
    ].join('\n')

    const res = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'Maths', message })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(typeof body.aiResponse, 'string')
    assert.equal(body.aiResponse.includes('Student: Emmanuel'), false)
    assert.equal(body.aiResponse.includes('Tutor behaviour'), false)
  })
})

describe('essay generation', () => {
  it('generates an essay without requiring authentication', async () => {
    const res = await fetch(`${baseUrl}/ai/essay/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'History', topic: 'The causes of the First Chimurenga', level: 'Core' })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.essay.subject, 'History')
    assert.equal(body.essay.topic, 'The causes of the First Chimurenga')
    assert.ok(body.essay.content.includes('The causes of the First Chimurenga'))
    assert.equal(body.essay.content.includes('configure CLAUDE_API_KEY'), false)
    assert.equal(body.essay.content.includes('A strong essay should'), false)
    assert.equal(body.essay.content.includes('Study tips'), false)
    assert.ok(body.essay.outline.length > 0)
  })

  it('changes essay style when the level changes', async () => {
    const payload = { subject: 'English Language', topic: 'The importance of education' }
    const levels = await Promise.all(
      ['Foundation', 'Core', 'Extended'].map((level) =>
        fetch(`${baseUrl}/ai/essay/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, level })
        }).then((res) => res.json())
      )
    )

    assert.equal(levels[0].essay.title.startsWith('Foundation'), true)
    assert.equal(levels[1].essay.title.startsWith('Core'), true)
    assert.equal(levels[2].essay.title.startsWith('Extended'), true)
    assert.notEqual(levels[0].essay.content, levels[1].essay.content)
    assert.notEqual(levels[1].essay.content, levels[2].essay.content)
    assert.ok(levels[2].essay.content.includes('clear personal understanding') || levels[2].essay.content.includes('strongest point'))
    assert.equal(levels[2].essay.content.includes('professional student'), false)
    assert.equal(levels[2].essay.content.includes('convincing judgement'), false)
  })

  it('changes essay structure when the essay type changes', async () => {
    const payload = { subject: 'English Language', topic: 'A memorable school day', level: 'Core' }
    const [argumentative, narrative, descriptive] = await Promise.all(
      ['Argumentative essay', 'Narrative essay', 'Descriptive essay'].map((essayType) =>
        fetch(`${baseUrl}/ai/essay/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, essayType })
        }).then((res) => res.json())
      )
    )

    assert.ok(argumentative.essay.title.includes('Argumentative'))
    assert.ok(narrative.essay.title.includes('Narrative'))
    assert.ok(descriptive.essay.title.includes('Descriptive'))
    assert.notEqual(argumentative.essay.content, narrative.essay.content)
    assert.notEqual(narrative.essay.content, descriptive.essay.content)
    assert.ok(narrative.essay.content.includes('day'))
    assert.ok(descriptive.essay.content.includes('colour') || descriptive.essay.content.includes('atmosphere'))
  })

  it('turns describe prompts into concrete descriptive essays', async () => {
    const res = await fetch(`${baseUrl}/ai/essay/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'English Language',
        topic: 'Describe your favorite sport',
        level: 'Extended',
        essayType: 'Exam essay',
        wordCount: 800
      })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.ok(body.essay.title.includes('Descriptive'))
    assert.ok(body.essay.content.includes('football'))
    assert.ok(body.essay.content.includes('favorite sport'))
    assert.equal(body.essay.content.includes('Describe your favorite sport is'), false)
    assert.equal(body.essay.content.includes('complex issue'), false)
    assert.equal(body.essay.content.includes('overlapping causes'), false)
  })

  it('uses humanised wording in generated fallback essays', async () => {
    const res = await fetch(`${baseUrl}/ai/essay/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'English Language',
        topic: 'The importance of honesty',
        level: 'Extended',
        essayType: 'Argumentative essay'
      })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.ok(body.essay.content.includes('I think') || body.essay.content.includes('real people'))
    assert.equal(body.essay.content.includes('professional student response'), false)
    assert.equal(body.essay.content.includes('overlapping causes'), false)
    assert.equal(body.essay.content.includes('final judgement'), false)
  })

  it('changes essay content when the subject changes', async () => {
    const payload = { topic: 'The importance of water', level: 'Core', essayType: 'Exam essay' }
    const [history, geography, religious] = await Promise.all(
      ['History', 'Geography', 'Religious Studies'].map((subject) =>
        fetch(`${baseUrl}/ai/essay/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, subject })
        }).then((res) => res.json())
      )
    )

    assert.notEqual(history.essay.content, geography.essay.content)
    assert.notEqual(geography.essay.content, religious.essay.content)
    assert.ok(history.essay.content.includes('History'))
    assert.ok(geography.essay.content.includes('Geography'))
    assert.ok(religious.essay.content.includes('Religious Studies'))
    assert.ok(history.essay.content.includes('events') || history.essay.content.includes('historical'))
    assert.ok(geography.essay.content.includes('places') || geography.essay.content.includes('environment'))
    assert.ok(religious.essay.content.includes('belief') || religious.essay.content.includes('faith'))
  })

  it('writes Shona subject essays in Shona', async () => {
    const res = await fetch(`${baseUrl}/ai/essay/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Shona',
        topic: 'Kukosha kwetsika nemagariro',
        level: 'Core',
        essayType: 'Exam essay'
      })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.essay.subject, 'Shona')
    assert.ok(body.essay.content.includes('inyaya inokosha'))
    assert.ok(body.essay.content.includes('tsika nemagariro'))
    assert.ok(body.essay.content.includes('Pakupedzisira'))
    assert.equal(body.essay.content.includes('In Shona'), false)
    assert.equal(body.essay.content.includes('language and culture'), false)
    assert.ok(body.essay.outline[0].includes('Tanga'))
    assert.ok(body.essay.studyTips[0].includes('Shandisa'))
  })

  it('scales generated essay length with the selected word count', async () => {
    const payload = {
      subject: 'English Language',
      topic: 'The importance of honesty',
      level: 'Core',
      essayType: 'Exam essay'
    }
    const [shortEssay, longEssay] = await Promise.all(
      [300, 1000].map((wordCount) =>
        fetch(`${baseUrl}/ai/essay/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, wordCount })
        }).then((res) => res.json())
      )
    )

    assert.equal(shortEssay.essay.wordCount, 300)
    assert.equal(longEssay.essay.wordCount, 1000)
    assert.ok(wordCount(longEssay.essay.content) > wordCount(shortEssay.essay.content))
    assert.ok(wordCount(longEssay.essay.content) >= 0.85 * wordCount(shortEssay.essay.content))
  })
})

describe('progress and leaderboard scoring', () => {
  it('marks a generated quiz server-side and updates progress', async () => {
    const quizRes = await fetch(`${baseUrl}/ai/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'Mathematics', topic: 'Simultaneous equations', difficulty: 'Core' })
    })
    const { quiz } = await quizRes.json()
    const answers = Object.fromEntries(quiz.questions.map((question: any) => [question.id, question.answer]))

    const markRes = await fetch(`${baseUrl}/ai/quiz/mark`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ quiz, answers })
    })
    const body = await markRes.json()

    assert.equal(markRes.status, 201)
    assert.equal(body.result.score, 100)
    assert.equal(body.progress.mastery[0].subject, 'Mathematics')
    assert.equal(body.progress.recentQuizzes[0].topic, 'Simultaneous equations')
  })

  it('persists quiz results and rolls them into mastery and XP', async () => {
    const first = await fetch(`${baseUrl}/progress/quiz-result`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subject: 'Maths', score: 80, totalQuestions: 5 })
    })
    assert.equal(first.status, 201)

    const second = await fetch(`${baseUrl}/progress/quiz-result`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subject: 'Maths', score: 90, totalQuestions: 5 })
    })
    assert.equal(second.status, 201)

    const progressRes = await fetch(`${baseUrl}/progress`, { headers: authHeaders() })
    const progress = await progressRes.json()

    assert.equal(progressRes.status, 200)
    assert.equal(progress.mastery[0].subject, 'Maths')
    assert.equal(progress.mastery[0].score, 83)
    assert.equal(progress.mastery[0].attempts, 2)
    assert.equal(progress.xpPoints, 1750)
    assert.equal(progress.streakDays, 1)
  })

  it('orders leaderboard entries by XP', async () => {
    await fetch(`${baseUrl}/progress/quiz-result`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subject: 'Maths', score: 50 })
    })

    process.env.TEST_AUTH_UID = 'learner-2'
    await fetch(`${baseUrl}/progress/quiz-result`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subject: 'Science', score: 95 })
    })

    const res = await fetch(`${baseUrl}/leaderboard`, { headers: authHeaders() })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.top[0].uid, 'learner-2')
    assert.equal(body.top[1].uid, 'learner-1')

    process.env.TEST_AUTH_UID = 'learner-1'
  })
})

describe('study planner', () => {
  it('generates and persists a profile-aware study plan', async () => {
    const res = await fetch(`${baseUrl}/ai/planner`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        subjects: ['Mathematics', 'Physics'],
        weakSubjects: ['Mathematics'],
        examDate: '2026-11-10',
        hoursPerDay: 2
      })
    })
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.plan.weeklyPlan.length, 7)
    assert.ok(body.plan.priorityTopics.includes('simultaneous equations'))

    const latestRes = await fetch(`${baseUrl}/ai/planner/latest`, { headers: authHeaders() })
    const latest = await latestRes.json()
    assert.equal(latestRes.status, 200)
    assert.equal(latest.plan.weeklyPlan.length, 7)
  })
})

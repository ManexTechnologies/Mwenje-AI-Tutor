import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { generateFlashcardDeck } from './lib/flashcards'
import { askClaude } from './lib/claude'
import { generatePracticeQuestions } from './lib/practice'
import { generateQuiz } from './lib/quiz'
import { clearSessionCookie, setSessionCookie, signSession } from './lib/session'
import { ensureMysqlSchema, getPool } from './lib/mysql'
import { createTutorRouter } from './routes/tutor'
import { verifySession } from './middleware/verifySession'
import { createUser, validateLogin } from './services/authStore'
import { buildProfileFallback, getProfile, saveProfile } from './services/profileStore'
import { getLeaderboard, getUserProgress, recordQuizResult } from './services/progressStore'
import { generateLocalStudyPlan, getLatestStudyPlan, saveStudyPlan } from './services/studyPlanner'

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

function normalizeAiText(response: unknown) {
  if (typeof response === 'string') return response
  if (response && typeof response === 'object') {
    const data = response as Record<string, any>
    if (typeof data.reply === 'string') return data.reply
    if (typeof data.completion === 'string') return data.completion
    if (typeof data.content === 'string') return data.content
  }

  return ''
}

function getEssayFocus(topic: string) {
  const lowerTopic = topic.toLowerCase().trim()

  if (lowerTopic.includes('favorite sport') || lowerTopic.includes('favourite sport')) {
    return 'football'
  }

  return topic
    .replace(/^(describe|discuss|explain|argue for|argue against|write about|narrate|tell a story about)\s+/i, '')
    .replace(/\byour\b/gi, 'my')
    .trim()
}

function getEffectiveEssayType(essayType: string, topic: string) {
  const normalizedType = essayType.toLowerCase()
  const normalizedTopic = topic.toLowerCase().trim()

  if (!normalizedType.includes('exam')) return normalizedType
  if (normalizedTopic.startsWith('describe')) return 'descriptive essay'
  if (normalizedTopic.startsWith('narrate') || normalizedTopic.startsWith('tell a story')) return 'narrative essay'
  if (normalizedTopic.startsWith('argue') || normalizedTopic.includes('do you agree')) return 'argumentative essay'
  return normalizedType
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function expandToTargetWordCount(paragraphs: string[], targetWordCount: number, extraParagraphs: string[]) {
  const expanded = [...paragraphs]
  const minimumWordCount = Math.max(220, Math.round(targetWordCount * 0.85))

  for (const paragraph of extraParagraphs) {
    if (countWords(expanded.join('\n\n')) >= minimumWordCount) break
    expanded.splice(Math.max(1, expanded.length - 1), 0, paragraph)
  }

  return expanded
}

function getSubjectProfile(subject: string, topic: string) {
  const normalizedSubject = subject.toLowerCase()
  const focus = getEssayFocus(topic)

  if (normalizedSubject.includes('history')) {
    return {
      lens: 'historical',
      opening: `${focus} should be understood through what was happening at the time, the people involved, and the causes behind their actions.`,
      body: `In History, it is important to use events and evidence. The strongest point is not just what happened, but why it happened and how it changed people's lives afterwards.`,
      second: 'Dates, leaders, ordinary people, and long-term effects all help make the answer more complete.',
      conclusion: 'This shows that a good historical answer connects causes, events, and consequences instead of treating them separately.'
    }
  }

  if (normalizedSubject.includes('geography')) {
    return {
      lens: 'geographical',
      opening: `${focus} can be understood by looking at people, places, natural processes, and how the environment is used.`,
      body: `In Geography, examples matter because they show how an issue affects real places. The answer should explain causes, effects, and possible ways to manage the problem.`,
      second: 'Human activity and physical conditions often work together, so both should be considered.',
      conclusion: 'This makes the topic useful because it shows how people and the environment depend on each other.'
    }
  }

  if (normalizedSubject.includes('literature')) {
    return {
      lens: 'literary',
      opening: `${focus} is best explored through character, theme, setting, conflict, and the writer's choice of language.`,
      body: `In Literature, the answer should not only retell the story. It should explain how the writer creates meaning and how the reader is made to feel or think.`,
      second: 'Characters, images, dialogue, and contrast can all reveal the deeper message of the text.',
      conclusion: `This shows that the topic matters because it helps reveal the writer's purpose.`
    }
  }

  if (normalizedSubject.includes('religious')) {
    return {
      lens: 'religious studies',
      opening: `${focus} can be understood through beliefs, values, moral choices, and the way people try to live according to faith.`,
      body: `In Religious Studies, the answer should explain both belief and behaviour. It should show how teachings guide people's decisions in real life.`,
      second: 'A balanced answer can also mention different views and why people may apply teachings in different ways.',
      conclusion: 'This makes the topic important because it connects faith, responsibility, and everyday life.'
    }
  }

  if (normalizedSubject.includes('shona')) {
    return {
      lens: 'Shona language and culture',
      opening: `${focus} can be linked to Shona language, culture, values, and the way people understand life in the community.`,
      body: `In Shona, a good answer should show respect for culture and use ideas that connect with family, community, identity, and good behaviour.`,
      second: 'Tsumo, examples from daily life, and clear expression can make the writing feel more natural.',
      conclusion: 'This shows that the topic is important because language and culture help people understand who they are.'
    }
  }

  if (normalizedSubject.includes('french')) {
    return {
      lens: 'French language',
      opening: `${focus} should be written with clear ideas, simple organisation, and vocabulary that suits a French language learner.`,
      body: `In French, the answer should focus on communication. The ideas need to be easy to follow, with attention to description, opinion, and everyday examples.`,
      second: 'A good response should also show awareness of tense, agreement, and useful expressions.',
      conclusion: 'This makes the topic useful because it builds confidence in expressing real ideas in another language.'
    }
  }

  return {
    lens: 'English Language',
    opening: `${focus} should be written with a clear voice, natural expression, and details that make the idea easy to imagine.`,
    body: `In English Language, the writing should suit the task. Description needs vivid detail, argument needs a clear position, and narrative needs events that feel real.`,
    second: 'Good word choice, paragraphing, and a natural flow make the essay stronger.',
    conclusion: 'This makes the writing more interesting because the reader can follow both the ideas and the feeling behind them.'
  }
}

function getEssayTypeProfile(essayType: string, topic: string) {
  const normalizedType = getEffectiveEssayType(essayType, topic)
  const focus = getEssayFocus(topic)

  if (normalizedType.includes('argumentative')) {
    return {
      titlePrefix: 'Argumentative',
      genre: 'analytical',
      opening: `${focus} is something people can honestly disagree about. I think the best way to look at it is to ask who is affected, what changes, and whether the results are fair.`,
      bodyFocus: `One reason this matters is that ${focus} can affect real people, not just ideas on paper. If we only look at one side, we miss the full picture and the answer becomes less convincing.`,
      secondFocus: 'Some people may see it differently, and that view deserves to be mentioned. Even so, it is weaker when it ignores the bigger effect on people and communities.',
      conclusion: 'For that reason, the stronger argument is the one that is fair, clear, and supported by real examples.'
    }
  }

  if (normalizedType.includes('narrative')) {
    return {
      titlePrefix: 'Narrative',
      genre: 'creative',
      opening: `The day I truly understood why I loved ${focus} began with the sound of voices rising from the field and the warm afternoon light stretching across the grass.`,
      bodyFocus: `At first I was nervous, but once the game started, everything around me seemed to move with purpose. The ball rolled quickly from one player to another, boots scraped the ground, and every shout from the touchline made the match feel alive.`,
      secondFocus: 'The turning point came when I had to make a quick decision. I passed instead of trying to score alone, and that moment taught me that a good player thinks about the whole team, not only personal glory.',
      conclusion: `By the end, I was tired and dusty, but I felt proud. ${focus} had given me excitement, discipline, friendship, and a lesson I could carry beyond the field.`
    }
  }

  if (normalizedType.includes('descriptive')) {
    const isFavoriteSport = topic.toLowerCase().includes('favorite sport') || topic.toLowerCase().includes('favourite sport')
    return {
      titlePrefix: 'Descriptive',
      genre: 'creative',
      opening: isFavoriteSport
        ? `My favorite sport is ${focus}. What I love most about it is the energy that fills the field before the first whistle, when players stretch, supporters call out, and the ball waits at the centre like a promise of action.`
        : `${focus} created a vivid scene full of colour, movement, sound, and feeling. Every detail seemed to add something to the atmosphere.`,
      bodyFocus: isFavoriteSport
        ? `The game is beautiful because it is always moving. A pass can split a defence in a second, a goalkeeper can turn fear into relief with one dive, and a striker can make a crowd explode with a single clean shot. The sound of boots on the ground, the sharp blow of the whistle, and the sudden roar after a goal make ${focus} exciting to watch and even better to play.`
        : `The first thing I noticed was the atmosphere. Light, noise, texture, and movement worked together to make the moment clear and memorable, as if the whole scene had been painted carefully in front of me.`,
      secondFocus: isFavoriteSport
        ? `I also admire the discipline behind the sport. Good players must be fit, alert, and unselfish. They run when they are tired, defend when the team is under pressure, and trust each other even when the match becomes difficult.`
        : `What stood out most was the mood. It was not only something to look at, but something to feel, with small details making the scene seem alive and close.`,
      conclusion: isFavoriteSport
        ? `For me, ${focus} is more than a game. It is a sport of skill, courage, teamwork, and emotion. Whether I am playing with friends or watching a serious match, it always reminds me that effort and unity can turn ordinary moments into unforgettable ones.`
        : `By the end, ${focus} remained clear in my mind because its colour, atmosphere, and movement created a lasting picture.`
    }
  }

  if (normalizedType.includes('literature')) {
    return {
      titlePrefix: 'Literature',
      genre: 'analytical',
      opening: `${focus} is important in the text because it reveals the writer's ideas through character, conflict, setting, and language. The issue is not only part of the story; it helps the reader understand the deeper meaning of the work.`,
      bodyFocus: 'One way the writer develops the topic is through characterisation. The choices, speech, and conflicts of the characters reveal the central concerns of the text.',
      secondFocus: 'Language and setting also strengthen the meaning by creating mood, contrast, and tension.',
      conclusion: `Therefore, the topic is significant because it helps communicate the writer's purpose and encourages the reader to think more deeply.`
    }
  }

  if (normalizedType.includes('source')) {
    return {
      titlePrefix: 'Source-Based',
      genre: 'analytical',
      opening: `${focus} can be examined by looking carefully at the evidence provided. A source-based response must consider what the source says, what it suggests, and how reliable or useful it may be.`,
      bodyFocus: 'The first point from the evidence is important because it gives direct information about the issue. However, the source must also be interpreted carefully, since evidence may be limited or shaped by perspective.',
      secondFocus: 'A second point is that the source becomes stronger when it is compared with wider knowledge of the topic.',
      conclusion: 'Overall, the source is useful, but the best answer combines source evidence with careful explanation and contextual knowledge.'
    }
  }

  return {
      titlePrefix: 'Exam',
      genre: 'analytical',
    opening: `${focus} is important because it helps us understand how people, events, and choices are connected.`,
    bodyFocus: `One important point is that ${focus} usually has more than one cause. It makes more sense when the causes are explained together instead of being listed one by one.`,
    secondFocus: 'Another point is the effect it has on people and society. This helps show why the topic matters beyond a simple definition.',
    conclusion: 'In conclusion, the best answer is clear, well explained, and supported by examples.'
  }
}

function buildShonaEssay(topic: string, level: string, wordCount: number, essayType: string) {
  const normalizedType = getEffectiveEssayType(essayType, topic)
  const focus = getEssayFocus(topic)
  const titlePrefix = normalizedType.includes('descriptive')
    ? 'Rondedzero'
    : normalizedType.includes('narrative')
      ? 'Ngano'
      : normalizedType.includes('argumentative')
        ? 'Nharo'
        : 'Rondedzero'

  const paragraphs = expandToTargetWordCount(
    [
      `${topic} inyaya inokosha muhupenyu hwevanhu nokuti inobata maitiro, tsika, uye mafungiro edu. Kana munhu achinyora nezvayo, anofanira kutaura zviri pachena, achishandisa mutauro wakarongeka uye mienzaniso iri nyore kunzwisisa.`,
      `Chokutanga, ${focus} inotibatsira kuona kukosha kwehunhu hwakanaka mumhuri nemunharaunda. Munhu anokura achidzidziswa kuremekedza vamwe, kushanda nesimba, uye kuchengetedza ukama hwakanaka. Izvi ndizvo zvinoita kuti vanhu vagarisane murunyararo.`,
      `Pamusoro pezvo, nyaya iyi inoratidza kuti tsika nemagariro hazvisi zvinhu zvekare chete. Zvinoramba zvichishanda kunyange mazuva ano nokuti zvinotitungamirira pakusarudza zvakanaka. Somuenzaniso, kushandisa tsumo, nyaya dzevakuru, uye zviitiko zvezuva nezuva kunobatsira kuti pfungwa dzibude zvine hudzamu.`,
      `Pakupedzisira, ${topic} inotidzidzisa kuti mutauro weShona une simba pakuchengetedza kuzivikanwa kwedu. Kana tikauchengeta uye tikauushandisa zvakanaka, tinodzivirira tsika dzedu uye tinoratidza kuti tinokoshesa nhaka yatakasiirwa nevakuru.`
    ],
    wordCount,
    [
      `Zvakare, ${focus} inoratidza kuti munhu haagari ega. Zvaanoita zvinobata mhuri yake, shamwari, uye nharaunda yaanogara. Kana vanhu vakabatana vachitevedzera zvakanaka, vana vanokura vachiona muenzaniso wakanaka uye vanodzidza kuremekedza mutauro netsika dzavo.`,
      `Mumagariro eShona, vakuru vanowanzoshandisa nyaya netsumo kudzidzisa vadiki. Izvi zvinoita kuti dzidzo isangoita yemubhuku chete, asi ive chinhu chinobva muupenyu chaihwo. Kana munhu akateerera mazano akadaro, anokwanisa kusiyanisa zvakanaka nezvakaipa.`,
      `Chimwe chinokosha ndechekuti nyaya iyi inobatsira pakuvaka kuzviremekedza. Munhu anoziva kwaanobva uye anokoshesa rurimi rwake haanyare kuzvitaura. Izvi zvinoita kuti ave nechivimbo pakutaura, pakunyora, uye pakurarama nevamwe.`
    ]
  )

  return {
    subject: 'Shona',
    topic,
    level,
    essayType,
    wordCount,
    title: `${titlePrefix}: ${topic}`,
    outline: [
      'Tanga nenyaya huru yauri kuda kutsanangura.',
      'Shandisa mienzaniso yakajeka kubva muupenyu hwezuva nezuva.',
      'Ronga pfungwa dzako mundima dzine musoro.',
      'Pedzisa nekupfupisa pfungwa huru.'
    ],
    content: paragraphs.join('\n\n'),
    studyTips: [
      'Shandisa mutauro wakajeka uye wakarongeka.',
      'Isa mienzaniso inoenderana netsika nemagariro.',
      'Ronga pfungwa dzako mundima dzakasiyana.',
      'Pedzisa nechidzidzo kana pfungwa huru.'
    ]
  }
}

function buildSampleEssay(subject: string, topic: string, level: string, wordCount: number, essayType: string) {
  if (subject.toLowerCase().includes('shona')) {
    return buildShonaEssay(topic, level, wordCount, essayType)
  }

  const normalizedLevel = level.toLowerCase()
  const typeProfile = getEssayTypeProfile(essayType, topic)
  const subjectProfile = getSubjectProfile(subject, topic)
  const levelProfile = normalizedLevel.includes('foundation')
    ? {
        titlePrefix: 'Foundation',
        opening: `${topic} is an important topic in ${subject}. It helps learners understand the main ideas clearly. This essay explains the topic in a simple and organised way.`,
        connector: 'Another clear point is',
        conclusion: 'Overall, the main point is that'
      }
    : normalizedLevel.includes('extended')
      ? {
          titlePrefix: 'Extended',
          opening: `${topic} is an interesting and important topic in ${subject}. A stronger answer should do more than describe it; it should compare ideas, explain effects, and show a clear personal understanding.`,
          connector: 'More significantly, however,',
          conclusion: 'In the end, the strongest point is that'
        }
      : {
          titlePrefix: 'Core',
          opening: `${topic} is an important topic in ${subject} because it shows how actions, choices, and results are connected.`,
          connector: 'A further factor to consider is',
          conclusion: 'Overall, the strongest point is that'
        }

  const paragraphs = expandToTargetWordCount(
    [
      typeProfile.genre === 'creative' ? typeProfile.opening : `${levelProfile.opening} ${subjectProfile.opening} ${typeProfile.opening}`,
      typeProfile.genre === 'creative' ? typeProfile.bodyFocus : `${typeProfile.bodyFocus} ${subjectProfile.body}`,
      `${levelProfile.connector} ${typeProfile.secondFocus} ${subjectProfile.second}`,
      typeProfile.genre === 'creative' ? typeProfile.conclusion : `${levelProfile.conclusion} ${typeProfile.conclusion}`
    ],
    wordCount,
    [
      `Another useful example is found in everyday life. When people experience ${getEssayFocus(topic)} directly, they often understand it better than they would from a definition alone. This makes the topic feel real instead of distant or abstract.`,
      `It is also important to think about different people in the situation. A learner, a parent, a leader, or a community member may all see the issue differently. Looking at these views makes the essay more balanced and more human.`,
      `The topic also teaches a lesson about responsibility. People usually have choices, and those choices can either solve a problem or make it worse. This is why careful thinking matters before action is taken.`,
      `A final point is that ${getEssayFocus(topic)} can shape the future. Even small decisions can lead to bigger results over time, so the topic should be taken seriously rather than treated as a simple idea.`
    ]
  )

  return {
    subject,
    topic,
    level,
    essayType,
    wordCount,
    title: `${levelProfile.titlePrefix} ${subjectProfile.lens} ${typeProfile.titlePrefix}: ${topic}`,
    outline: [
      'Introduce the topic and state a clear position.',
      'Develop the main argument with subject-specific evidence.',
      'Explain a second point and connect it back to the question.',
      'Conclude by weighing the evidence and restating the judgement.'
    ],
    content: paragraphs.join('\n\n'),
    studyTips: [
      'Underline the command word before writing.',
      'Plan three clear paragraphs before drafting.',
      'Use evidence in every main paragraph.',
      'End with a direct judgement, not a new point.'
    ]
  }
}

export function createApp() {
  const app = express()

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.95:3000',
    process.env.FRONTEND_ORIGIN
  ].filter(Boolean) as string[]

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      return callback(null, false)
    },
    credentials: true
  }))
  app.use(express.json())

  const schemaInitialization = ensureMysqlSchema().catch((error) => {
    console.warn('Database initialization failed:', error instanceof Error ? error.message : String(error))
  })

  app.use(async (_req, _res, next) => {
    await schemaInitialization
    next()
  })

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mwenje-backend' })
  })

  app.get('/subjects', (_req, res) => {
    res.json({
      subjects: [
        'Mathematics',
        'English Language',
        'Physics',
        'Chemistry',
        'Biology',
        'History',
        'Geography',
        'Accounts',
        'Computer Science'
      ]
    })
  })

  app.use('/api/tutor', verifySession, createTutorRouter(getPool()))

  function isDatabaseUnavailableError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return /ECONNREFUSED|ENOTFOUND|ER_BAD_DB_ERROR|ER_ACCESS_DENIED_ERROR|Database is not ready/i.test(message)
  }

  app.post('/auth/signup', async (req, res) => {
    try {
      const user = await createUser({
        name: String(req.body?.name || ''),
        email: String(req.body?.email || ''),
        password: String(req.body?.password || ''),
        school: String(req.body?.school || ''),
        grade: String(req.body?.grade || ''),
        curriculum: String(req.body?.curriculum || 'ZIMSEC'),
        subjects: Array.isArray(req.body?.subjects) ? req.body.subjects.map((subject: unknown) => String(subject).trim()).filter(Boolean) : []
      })
      setSessionCookie(res, signSession(user))
      return res.status(201).json({ user })
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        return res.status(503).json({ error: 'Authentication service is unavailable. Please try again later.' })
      }
      return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
    }
  })

  app.post('/auth/login', async (req, res) => {
    try {
      const user = await validateLogin(String(req.body?.email || ''), String(req.body?.password || ''))
      setSessionCookie(res, signSession(user))
      return res.json({ user })
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        return res.status(503).json({ error: 'Authentication service is unavailable. Please try again later.' })
      }
      return res.status(401).json({ error: error instanceof Error ? error.message : String(error) })
    }
  })

  app.post('/auth/logout', (_req, res) => {
    clearSessionCookie(res)
    return res.json({ success: true })
  })

  app.get('/auth/me', verifySession, async (req, res) => {
    return res.json({ user: (req as any).user })
  })

  app.post('/auth/verify', verifySession, async (req, res) => {
    return res.json({ success: true, user: (req as any).user })
  })

  app.get('/profile', verifySession, async (req, res) => {
    const user = (req as any).user
    const fallback = buildProfileFallback({ name: user.name, email: user.email })

    try {
      const profile = await getProfile(user.uid, fallback)
      return res.json({ profile })
    } catch (error) {
      return res.status(500).json({ error: 'Could not load profile', details: error instanceof Error ? error.message : String(error) })
    }
  })

  app.put('/profile', verifySession, async (req, res) => {
    const user = (req as any).user
    const fallback = buildProfileFallback({ name: user.name, email: user.email })
    const name = String(req.body?.name || '').trim()
    const subjects = Array.isArray(req.body?.subjects) ? req.body.subjects.map((subject: unknown) => String(subject).trim()).filter(Boolean) : []

    if (!name) {
      return res.status(400).json({ error: 'name is required' })
    }

    if (!subjects.length) {
      return res.status(400).json({ error: 'Choose at least one subject.' })
    }

    try {
      const profile = await saveProfile(
        user.uid,
        {
          name,
          email: req.body?.email || user.email || '',
          school: req.body?.school || '',
          grade: req.body?.grade || '',
          curriculum: req.body?.curriculum || 'ZIMSEC',
          subjects,
          learningGoals: Array.isArray(req.body?.learningGoals) ? req.body.learningGoals : [],
          preferredLearningStyle: req.body?.preferredLearningStyle || '',
          weakAreas: Array.isArray(req.body?.weakAreas) ? req.body.weakAreas : [],
          examinationYear: req.body?.examinationYear ?? null,
          role: req.body?.role || 'STUDENT'
        },
        fallback
      )
      return res.json({ profile })
    } catch (error) {
      return res.status(500).json({ error: 'Could not save profile', details: error instanceof Error ? error.message : String(error) })
    }
  })

  app.post('/ai/chat', async (req, res) => {
    const { message, subject } = req.body
    if (!message || !subject) {
      return res.status(400).json({ error: 'message and subject are required' })
    }

    try {
      const response = await askClaude(message, subject)
      return res.json({ aiResponse: response })
    } catch (error) {
      return res.status(500).json({ error: 'AI service unavailable', details: error instanceof Error ? error.message : String(error) })
    }
  })

  app.post('/ai/quiz', async (req, res) => {
    const { subject, topic, difficulty } = req.body
    if (!subject || !topic || !difficulty) {
      return res.status(400).json({ error: 'subject, topic and difficulty are required' })
    }

    const quiz = await generateQuiz(String(subject), String(topic), String(difficulty))
    return res.json({ quiz })
  })

  app.post('/ai/quiz/mark', verifySession, async (req, res) => {
    const user = (req as any).user
    const { quiz, answers, durationSeconds } = req.body
    const questions = Array.isArray(quiz?.questions) ? quiz.questions : []

    if (!quiz?.subject || !questions.length || !answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'quiz and answers are required' })
    }

    const markedQuestions = questions.map((question: any) => {
      const selected = String(answers[question.id] || '')
      const correct = selected === question.answer
      return {
        id: question.id,
        prompt: question.prompt,
        selected,
        answer: question.answer,
        correct,
        explanation: question.explanation || `The correct answer is ${question.answer}.`
      }
    })
    const correctAnswers = markedQuestions.filter((question: { correct: boolean }) => question.correct).length
    const score = Math.round((correctAnswers / questions.length) * 100)

    const progress = await recordQuizResult(user.uid, user.name || user.email, {
      subject: String(quiz.subject),
      topic: String(quiz.topic || ''),
      difficulty: String(quiz.difficulty || ''),
      score,
      totalQuestions: questions.length,
      correctAnswers,
      durationSeconds: Number.isFinite(Number(durationSeconds)) ? Number(durationSeconds) : undefined
    })

    return res.status(201).json({
      result: {
        subject: quiz.subject,
        topic: quiz.topic || '',
        difficulty: quiz.difficulty || '',
        score,
        totalQuestions: questions.length,
        correctAnswers,
        markedQuestions
      },
      progress
    })
  })

  app.post('/ai/practice', async (req, res) => {
    const { subject, topic, difficulty = 'Core', questionType = 'Mixed', count = 5, grade = '' } = req.body
    if (!subject || !topic) {
      return res.status(400).json({ error: 'subject and topic are required' })
    }

    try {
      const practice = await generatePracticeQuestions(String(subject), String(topic), String(difficulty), String(questionType), Number(count), String(grade))
      return res.json({ practice })
    } catch (error) {
      return res.status(503).json({ error: 'AI practice generation unavailable', details: error instanceof Error ? error.message : String(error) })
    }
  })

  app.post('/ai/flashcards', async (req, res) => {
    const { subject, topic, count = 8 } = req.body
    if (!subject || !topic) {
      return res.status(400).json({ error: 'subject and topic are required' })
    }

    return res.json({ deck: generateFlashcardDeck(String(subject), String(topic), Number(count)) })
  })

  app.post('/ai/essay/generate', async (req, res) => {
    const { subject, topic, level = 'Core', wordCount = 500, essayType = 'Exam essay' } = req.body
    if (!subject || !topic) {
      return res.status(400).json({ error: 'subject and topic are required' })
    }

    const safeWordCount = Math.min(Math.max(Number(wordCount) || 500, 250), 1200)

    if (process.env.NODE_ENV === 'test') {
      return res.json({ essay: buildSampleEssay(String(subject), String(topic), String(level), safeWordCount, String(essayType)) })
    }

    try {
      const prompt = [
        `Write a ${safeWordCount}-word ${essayType} for a Zimbabwean learner.`,
        `Target length: about ${safeWordCount} words. Stay close to this length, within about 15 percent.`,
        `Subject: ${subject}.`,
        `Topic or question: ${topic}.`,
        `Level: ${level}.`,
        `Essay type: ${essayType}.`,
        `Subject focus: make the essay clearly fit ${subject}. Use the right subject vocabulary, examples, and way of reasoning for that subject.`,
        subject === 'Shona'
          ? 'Write the whole essay in Shona, including title and all paragraphs. Do not write the essay in English.'
          : 'Write the essay in English unless the selected subject is a language that requires otherwise.',
        level === 'Foundation'
          ? 'Use clear, simple student language, short paragraphs, and direct explanation. Make it sound like a real learner wrote it naturally.'
          : level === 'Extended'
            ? 'Write like a high-performing student, but keep the voice natural, human, specific, and not robotic. Avoid stiff phrases and overused academic wording.'
            : 'Write like a competent student with clear exam paragraphs, relevant examples, and a natural human voice.',
        'Use a clear title, introduction, body paragraphs, and conclusion.',
        'Use human-sounding words and concrete details. Avoid generic filler such as "complex issue", "overlapping causes", "professional student response", and repeated "judgement" phrasing.',
        'Return the essay itself, not writing advice, marking guidance, an outline, or study tips.'
      ].join('\n')
      const aiResponse = await askClaude(prompt, String(subject))
      const content = normalizeAiText(aiResponse)
      const responseSource =
        aiResponse && typeof aiResponse === 'object' && 'source' in aiResponse
          ? String((aiResponse as { source?: unknown }).source)
          : 'ai'

      if (!content) {
        throw new Error('AI returned an empty essay')
      }

      return res.json({
        essay: {
          ...buildSampleEssay(String(subject), String(topic), String(level), safeWordCount, String(essayType)),
          content,
          source: responseSource
        }
      })
    } catch (error) {
      return res.json({
        essay: {
          ...buildSampleEssay(String(subject), String(topic), String(level), safeWordCount, String(essayType)),
          source: 'sample',
          note: error instanceof Error ? error.message : 'AI service unavailable'
        }
      })
    }
  })

  app.post('/ai/essay', verifySession, (req, res) => {
    const { subject, content } = req.body
    res.json({
      score: 18,
      feedback: {
        overall: 'Good structure with clear argument, but the conclusion needs more detail.',
        paragraphs: [
          { index: 1, note: 'Strong introduction with a clear thesis.' },
          { index: 2, note: 'Use more evidence from the passage in this paragraph.' }
        ],
        improvedOpening: 'In Zimbabwean history, the fight for independence shaped the nation’s identity and inspired generations of learners.'
      }
    })
  })

  app.get('/ai/planner/latest', verifySession, async (req, res) => {
    const user = (req as any).user
    const plan = await getLatestStudyPlan(user.uid)
    res.json({ plan })
  })

  app.post('/ai/planner', verifySession, async (req, res) => {
    const user = (req as any).user
    const fallback = buildProfileFallback({ name: user.name, email: user.email })
    const profile = await getProfile(user.uid, fallback)
    const subjects = Array.isArray(req.body?.subjects) && req.body.subjects.length
      ? req.body.subjects.map((subject: unknown) => String(subject).trim()).filter(Boolean)
      : profile.subjects
    const weakSubjects = Array.isArray(req.body?.weakSubjects) && req.body.weakSubjects.length
      ? req.body.weakSubjects.map((subject: unknown) => String(subject).trim()).filter(Boolean)
      : profile.weakAreas.length
        ? profile.weakAreas
        : subjects.slice(0, 1)
    const hoursPerDay = Math.max(1, Math.min(8, Number(req.body?.hoursPerDay) || 2))
    const examDate = req.body?.examDate ? String(req.body.examDate) : undefined

    const plan = generateLocalStudyPlan({
      subjects,
      weakSubjects,
      hoursPerDay,
      examDate,
      weakAreas: profile.weakAreas
    })
    await saveStudyPlan(user.uid, { subjects, weakSubjects, hoursPerDay, examDate, weakAreas: profile.weakAreas }, plan)

    res.json({ plan })
  })

  app.get('/progress', verifySession, async (req, res) => {
    const user = (req as any).user
    const progress = await getUserProgress(user.uid)
    res.json(progress)
  })

  app.post('/progress/quiz-result', verifySession, async (req, res) => {
    const user = (req as any).user
    const { subject, score, totalQuestions, topic, difficulty, correctAnswers, durationSeconds } = req.body

    if (!subject || typeof score !== 'number') {
      return res.status(400).json({ error: 'subject and numeric score are required' })
    }

    try {
      const progress = await recordQuizResult(user.uid, user.name || user.email, {
        subject,
        score,
        totalQuestions,
        topic,
        difficulty,
        correctAnswers,
        durationSeconds
      })
      return res.status(201).json(progress)
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
    }
  })

  app.get('/leaderboard', verifySession, async (_req, res) => {
    const top = await getLeaderboard()
    res.json({ top })
  })

  return app
}

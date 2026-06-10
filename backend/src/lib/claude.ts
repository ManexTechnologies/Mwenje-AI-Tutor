import axios from 'axios'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const STUDY_ASSISTANT_SPACE_URL =
  process.env.HF_STUDY_ASSISTANT_SPACE_URL || 'https://abhinaychatla-assistantstudy.hf.space'

/**
 * Parse Hugging Face Gradio event stream response.
 */
function parseGradioEventData(eventStream: string) {
  const dataLine = eventStream
    .split(/\r?\n/)
    .find((line) => line.startsWith('data: ') && line !== 'data: null')

  if (!dataLine) {
    throw new Error('Hugging Face study assistant returned no data')
  }

  const parsed = JSON.parse(dataLine.slice('data: '.length))
  return Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueryMode = 'explain' | 'exam_practice' | 'essay_feedback' | 'quiz' | 'general'

export interface TutorRequest {
  prompt: string
  subject: string
  grade?: 'O Level' | 'A Level'
  mode?: QueryMode
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
}

// ─── ZIMSEC Subject Configuration ─────────────────────────────────────────────

const ZIMSEC_SUBJECT_CONFIG: Record<string, {
  examBoard: string
  syllabusCode?: string
  keySkills: string[]
  examTips: string[]
  commonMistakes: string[]
  markingSchemeStyle: string
}> = {
  mathematics: {
    examBoard: 'ZIMSEC',
    syllabusCode: '4004',
    keySkills: ['show full working', 'use correct notation', 'include units where applicable', 'check answers by substitution'],
    examTips: ['read the question twice — note how many marks are allocated', 'a 3-mark question needs 3 distinct steps', 'draw diagrams for geometry and trigonometry questions'],
    commonMistakes: ['forgetting negative signs when expanding brackets', 'not simplifying surds fully', 'leaving answers as improper fractions when a mixed number is expected'],
    markingSchemeStyle: 'Method marks (M), Accuracy marks (A), and Follow-through marks (FT) are awarded. Even a wrong final answer can earn method marks if working is shown.'
  },
  english: {
    examBoard: 'ZIMSEC',
    syllabusCode: '1122',
    keySkills: ['identify the command word (describe, explain, analyse, evaluate)', 'use evidence from the text', 'write in formal register unless told otherwise', 'vary sentence structure'],
    examTips: ['for comprehension, quote directly from the passage', 'for composition, spend 5 minutes planning before writing', 'check your work for tense consistency'],
    commonMistakes: ['answering in bullet points when a paragraph is expected', 'writing informal language in formal tasks', 'not answering all parts of a multi-part question'],
    markingSchemeStyle: 'Marks are split between content (ideas, argument) and expression (language, structure). Both must be strong to score highly.'
  },
  biology: {
    examBoard: 'ZIMSEC',
    syllabusCode: '5013',
    keySkills: ['use precise scientific terminology', 'link structure to function', 'explain processes in the correct sequence', 'refer to named examples'],
    examTips: ['for "describe" questions, say what happens step by step', 'for "explain" questions, give a reason (because...)', 'draw clear, labelled diagrams when helpful'],
    commonMistakes: ['saying "food" instead of specifying glucose, amino acids, etc.', 'confusing meiosis with mitosis', 'describing the heart as a muscle without mentioning it is cardiac muscle'],
    markingSchemeStyle: 'Each mark point is a separate, distinct piece of scientific information. Vague answers like "it helps the cell" earn nothing — be specific.'
  },
  chemistry: {
    examBoard: 'ZIMSEC',
    syllabusCode: '5020',
    keySkills: ['balance equations correctly', 'define key terms precisely', 'explain observations in terms of particles', 'show calculations with correct units'],
    examTips: ['state symbols (s), (l), (g), (aq) are often required in equations', 'for electrolysis, state which electrode and explain why', 'for rate of reaction, always mention collision theory'],
    commonMistakes: ['forgetting to balance equations', 'writing "ions" without naming them', 'confusing oxidation and reduction direction'],
    markingSchemeStyle: 'Equations must be balanced for full marks. Calculation answers need correct units. Definitions must hit specific mark-point wording.'
  },
  physics: {
    examBoard: 'ZIMSEC',
    syllabusCode: '5054',
    keySkills: ['recall and apply correct formulas', 'include units in every answer', 'show step-by-step calculation', 'explain physical meaning of results'],
    examTips: ['write the formula before substituting values', 'for graph questions, describe gradient and intercept in context', 'for "state" questions, give a concise one-line answer — no explanation needed'],
    commonMistakes: ['wrong or missing units', 'not converting km/h to m/s before calculating', 'confusing weight (N) with mass (kg)'],
    markingSchemeStyle: 'Formula (1 mark) + substitution (1 mark) + correct answer with unit (1 mark) is the typical 3-mark calculation structure.'
  },
  history: {
    examBoard: 'ZIMSEC',
    keySkills: ['use specific dates and named examples', 'explain causes AND consequences', 'assess significance and impact', 'present a structured argument'],
    examTips: ['for essay questions, write an introduction that directly answers the question', 'PEEL paragraph structure works well: Point, Evidence, Explain, Link', 'for source questions, consider reliability and purpose of the source'],
    commonMistakes: ['narrating events without explaining their significance', 'ignoring the time period stated in the question', 'quoting sources without evaluating them'],
    markingSchemeStyle: 'Level-based marking: Level 1 = basic description, Level 2 = explained points, Level 3 = developed argument with evidence, Level 4 = sustained, analytical argument.'
  },
  geography: {
    examBoard: 'ZIMSEC',
    keySkills: ['describe patterns using compass directions and data', 'explain processes step by step', 'use case studies with named places', 'link human and physical geography where relevant'],
    examTips: ['for map questions, always refer to the scale and key', 'for "suggest reasons" questions, you will not be penalised for wrong answers — just be logical', 'use local Zimbabwean examples: Harare, Kariba, Eastern Highlands, Zambezi'],
    commonMistakes: ['describing a pattern without explaining why it exists', 'not using data from graphs/tables in answers', 'confusing erosion (wearing away) with transportation (moving)'],
    markingSchemeStyle: 'Specific named examples often carry a dedicated mark. "A city in Africa" earns nothing where "Harare" earns a mark.'
  },
  commerce: {
    examBoard: 'ZIMSEC',
    keySkills: ['apply concepts to realistic business scenarios', 'distinguish between types (e.g. sole trader vs partnership)', 'evaluate advantages AND disadvantages', 'use correct business terminology'],
    examTips: ['for "discuss" questions, present both sides before giving a conclusion', 'for calculations (e.g. profit, break-even), show full working', 'relate answers to the Zimbabwean economic context where possible'],
    commonMistakes: ['listing advantages without explaining them', 'confusing revenue with profit', 'not reading the scenario carefully before answering'],
    markingSchemeStyle: 'Application marks require the answer to be linked to the specific context given in the question, not just general knowledge.'
  },
  accounts: {
    examBoard: 'ZIMSEC',
    keySkills: ['balance accounts correctly (debit = credit)', 'apply the accounting equation', 'prepare financial statements in the correct format', 'explain accounting concepts clearly'],
    examTips: ['always label which side is debit and which is credit', 'for trial balances, check totals match before moving on', 'show adjustments clearly in year-end accounts'],
    commonMistakes: ['putting items on the wrong side of an account', 'forgetting closing entries', 'confusing capital expenditure with revenue expenditure'],
    markingSchemeStyle: 'Format marks are awarded for correct layout. Figure marks require correct numbers. Both are needed for full marks.'
  },
  shona: {
    examBoard: 'ZIMSEC',
    keySkills: ['use correct Shona grammar and vocabulary', 'relate ideas to Zimbabwean culture and everyday life', 'structure essays with introduction, body, and conclusion', 'use appropriate register'],
    examTips: ['for composition, choose a topic you know well and plan first', 'for comprehension, answer in complete sentences using the passage', 'proofread for agreement errors (subject-verb, noun-adjective)'],
    commonMistakes: ['using English loanwords where Shona equivalents exist', 'not matching the register to the task (formal vs informal)'],
    markingSchemeStyle: 'Marks for content (ideas) and language (grammar, vocabulary) are awarded separately. Both must be strong.'
  },
  french: {
    examBoard: 'ZIMSEC',
    keySkills: ['write in correct tense as required', 'use varied vocabulary', 'apply gender and agreement rules', 'respond to all bullet points in tasks'],
    examTips: ['for role-plays, cover every bullet point — each is usually worth a mark', 'for translation, read the full sentence before translating', 'check adjective agreement carefully'],
    commonMistakes: ['forgetting to agree adjectives with nouns', 'mixing up être and avoir in compound tenses', 'direct word-for-word translation of idioms'],
    markingSchemeStyle: 'Communication (getting the message across) and accuracy (correct language) are both marked. Communicate first, then refine.'
  }
}

// ─── Prompt Builders ───────────────────────────────────────────────────────────

function getSubjectConfig(subject: string) {
  const normalized = subject.toLowerCase().trim()
  const key = Object.keys(ZIMSEC_SUBJECT_CONFIG).find((k) => normalized.includes(k))
  return key ? ZIMSEC_SUBJECT_CONFIG[key] : null
}

function buildSystemPrompt(subject: string, grade: string, mode: QueryMode): string {
  const config = getSubjectConfig(subject)

  const basePersonality = `You are Mwenje, an expert AI tutor for Zimbabwean high school students. You are warm, encouraging, and deeply knowledgeable about the ZIMSEC curriculum. You speak clearly and directly, like a brilliant teacher who genuinely wants every student to succeed. You never talk down to students — you meet them where they are and lift them higher.`

  const curriculumContext = config
    ? `
## Subject Context: ${subject} (${grade})
- Exam Board: ${config.examBoard}${config.syllabusCode ? ` | Syllabus: ${config.syllabusCode}` : ''}
- Key exam skills for this subject: ${config.keySkills.join('; ')}
- Marking scheme style: ${config.markingSchemeStyle}
- Common student mistakes to help avoid: ${config.commonMistakes.join('; ')}`
    : `\n## Subject: ${subject} (${grade}, ZIMSEC)`

  const modeInstructions: Record<QueryMode, string> = {
    explain: `
## Your task: Explain clearly
- Start with the core idea in 1–2 simple sentences
- Build up with a clear step-by-step explanation
- Use a relatable Zimbabwean example or analogy where helpful (e.g. farming, urban life, sports)
- End with a quick "Key points to remember" summary (3–5 bullet points max)
- If a diagram or table would help, describe it clearly or use ASCII formatting`,

    exam_practice: `
## Your task: Exam-style answer
- Answer the question as a model student would in a ZIMSEC exam
- Format it exactly as a ZIMSEC marking scheme expects: clear points, correct terminology, proper structure
- After the model answer, add a short "Examiner's Notes" section explaining:
  • what marks each part would earn and why
  • 1–2 tips specific to this question type
- Keep the tone of the model answer formal and academic`,

    essay_feedback: `
## Your task: Essay feedback
- Read the student's work carefully
- Give structured feedback with these sections:
  1. **Strengths** (what they did well — be specific)
  2. **Areas to improve** (be kind but honest — no vague advice)
  3. **Suggested rewrites** (show 1–2 improved sentences or paragraphs)
  4. **Mark estimate** (give an honest estimated band/mark with brief justification)
- Focus on what the ZIMSEC examiner would reward or penalise`,

    quiz: `
## Your task: Generate a quiz
- Create 5 exam-style questions on the topic at the appropriate grade level
- Mix question types: multiple choice (2), short answer (2), structured/longer answer (1)
- For each question, provide the answer and mark allocation at the end
- Style the questions exactly as they would appear in a ZIMSEC paper
- Label: Q1 [2 marks], Q2 [3 marks], etc.`,

    general: `
## Your task: General tutoring
- Answer the student's question helpfully and accurately
- Be conversational but precise
- If the question is vague, answer the most likely interpretation and ask a clarifying question at the end
- Bring in ZIMSEC exam relevance wherever it helps`
  }

  const examTipsSection = config
    ? `\n## Exam tips to weave in naturally when relevant:\n${config.examTips.map((t) => `- ${t}`).join('\n')}`
    : ''

  const formatting = `
## Formatting rules
- Use **bold** for key terms the student must remember
- Use numbered lists for steps and processes
- Use bullet points for lists of facts or features
- Keep paragraphs short — students read on phones
- Never use overly technical jargon without immediately explaining it
- Respond in English unless the subject is Shona or the student writes in Shona`

  return [basePersonality, curriculumContext, modeInstructions[mode], examTipsSection, formatting]
    .filter(Boolean)
    .join('\n')
}

function buildUserMessage(request: TutorRequest): string {
  const { prompt, mode } = request

  // Enrich the prompt with mode context so the model understands what's being asked
  const modePrefix: Partial<Record<QueryMode, string>> = {
    exam_practice: 'Please give me a model ZIMSEC exam answer for this question: ',
    essay_feedback: "Please review my essay/answer and give me feedback:\n\n",
    quiz: 'Please create a quiz on this topic: ',
    explain: 'Please explain this to me: '
  }

  const prefix = mode && modePrefix[mode] ? modePrefix[mode] : ''
  return `${prefix}${prompt}`
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function buildLocalTutorFallback(subject: string, mode: QueryMode = 'general'): string {
  const config = getSubjectConfig(subject)

  const subjectHint = config
    ? `For ${subject}, focus on: ${config.keySkills.slice(0, 2).join(' and ')}.`
    : `For ${subject}, break the question into smaller parts and use correct subject vocabulary.`

  const modeHint =
    mode === 'exam_practice'
      ? ' Structure your answer clearly and show all your working or reasoning.'
      : mode === 'essay_feedback'
        ? ' Re-read your work and check it against the marking criteria for your subject.'
        : ''

  return `I'm unable to reach the AI tutor service right now. ${subjectHint}${modeHint} Try again shortly, or ask your teacher for guidance in the meantime.`
}

// ─── Hugging Face fallback ─────────────────────────────────────────────────────

function parseGradioEventData(eventStream: string) {
  const dataLine = eventStream
    .split(/\r?\n/)
    .find((line) => line.startsWith('data: ') && line !== 'data: null')

  if (!dataLine) {
    throw new Error('Hugging Face study assistant returned no data')
  }

  const parsed = JSON.parse(dataLine.slice('data: '.length))
  return Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed
}

async function askStudyAssistant(request: TutorRequest) {
  const { prompt, subject } = request
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (process.env.HF_TOKEN) {
    headers.Authorization = `Bearer ${process.env.HF_TOKEN}`
  }

  const req = await axios.post(
    `${STUDY_ASSISTANT_SPACE_URL}/call/study_assistant`,
    { data: [`Subject: ${subject}\n\n${prompt}`, 'Friendly'] },
    { headers, timeout: 30000 }
  )

  const eventId = req.data?.event_id
  if (!eventId) throw new Error('Hugging Face study assistant did not return an event id')

  const response = await axios.get(
    `${STUDY_ASSISTANT_SPACE_URL}/call/study_assistant/${eventId}`,
    {
      headers: process.env.HF_TOKEN ? { Authorization: `Bearer ${process.env.HF_TOKEN}` } : undefined,
      responseType: 'text',
      timeout: 30000
    }
  )

  return {
    reply: parseGradioEventData(response.data),
    prompt,
    subject,
    source: 'huggingface-study-assistant'
  }
}

// ─── Main export ───────────────────────────────────────────────────────────────

/**
 * Ask Mwenje a question with full ZIMSEC curriculum context.
 *
 * @example
 * // Simple usage (backwards compatible)
 * await askClaude('What is photosynthesis?', 'Biology')
 *
 * @example
 * // Full usage with mode and conversation history
 * await askClaude({
 *   prompt: 'Explain the causes of the First Chimurenga',
 *   subject: 'History',
 *   grade: 'O Level',
 *   mode: 'exam_practice',
 *   conversationHistory: [...]
 * })
 */
export async function askClaude(
  promptOrRequest: string | TutorRequest,
  subjectLegacy?: string
): Promise<unknown> {
  // Support both old string signature and new object signature
  const request: TutorRequest =
    typeof promptOrRequest === 'string'
      ? { prompt: promptOrRequest, subject: subjectLegacy ?? 'General', mode: 'general' }
      : promptOrRequest

  const { subject, grade = 'O Level', mode = 'general', conversationHistory = [] } = request

  const shouldUseStudyAssistant = !!process.env.HF_TOKEN || !!process.env.HF_STUDY_ASSISTANT_SPACE_URL

  if (!process.env.CLAUDE_API_KEY) {
    if (!shouldUseStudyAssistant) return buildLocalTutorFallback(subject, mode)
    try {
      return await askStudyAssistant(request)
    } catch {
      return buildLocalTutorFallback(subject, mode)
    }
  }

  const systemPrompt = buildSystemPrompt(subject, grade, mode)
  const userMessage = buildUserMessage(request)

  // Build messages array: prior conversation + new user message
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage }
  ]

  try {
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-sonnet-4-20250514',
        system: systemPrompt,
        max_tokens: mode === 'essay_feedback' ? 1800 : mode === 'quiz' ? 1500 : 1200,
        messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      }
    )

    return response.data
  } catch (error) {
    if (shouldUseStudyAssistant) {
      try {
        return await askStudyAssistant(request)
      } catch {
        return buildLocalTutorFallback(subject, mode)
      }
    }
    return buildLocalTutorFallback(subject, mode)
  }
}

/**
 * Normalize AI response from different sources into a plain string.
 * Handles responses from Claude API, Hugging Face, and fallback modes.
 */
export function normalizeAiResponse(response: unknown): string {
  if (typeof response === 'string') return response
  if (response && typeof response === 'object') {
    const data = response as Record<string, any>
    // Claude API response
    if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
      return data.content[0].text
    }
    // Hugging Face response
    if (typeof data.reply === 'string') return data.reply
    // Generic fallbacks
    if (typeof data.completion === 'string') return data.completion
    if (typeof data.message === 'string') return data.message
    if (typeof data.text === 'string') return data.text
  }

  return 'Unable to process response. Please try again.'
}
export type TutorPromptProfile = {
  grade?: string
  curriculum?: string
  subjects?: string[]
  learningGoals?: string[]
  preferredLearningStyle?: string
  weakAreas?: string[]
  examinationYear?: number | null
}

export type TutorPromptRequest = {
  prompt: string
  subject: string
  grade?: string
  mode?: 'explain' | 'exam_practice' | 'essay_feedback' | 'quiz' | 'general'
}

export function buildPersonalizedTutorPrompt(profile: TutorPromptProfile, request: TutorPromptRequest) {
  const subject = request.subject || 'General'
  const grade = request.grade || profile.grade || 'O Level'
  const curriculum = profile.curriculum || 'ZIMSEC'

  const profileSection = [
    `Learner profile: ${grade}, ${curriculum}.`,
    profile.subjects?.length ? `Subjects: ${profile.subjects.join(', ')}.` : '',
    profile.learningGoals?.length ? `Learning goals: ${profile.learningGoals.join(', ')}.` : '',
    profile.preferredLearningStyle ? `Preferred learning style: ${profile.preferredLearningStyle}.` : '',
    profile.weakAreas?.length ? `Weak areas: ${profile.weakAreas.join(', ')}.` : '',
    profile.examinationYear ? `Examination year: ${profile.examinationYear}.` : ''
  ].filter(Boolean).join('\n')

  const modeInstruction = request.mode === 'exam_practice'
    ? 'Answer as a model Zimbabwean student following the exam rubric.'
    : request.mode === 'quiz'
      ? 'Create a short quiz suitable for this learner.'
      : 'Explain clearly and step-by-step in a supportive manner.'

  return [
    `You are Mwenje, an AI tutor for Zimbabwean students. Use the Zimbabwean curriculum context for ${subject} and keep the explanation aligned to ${curriculum}.`,
    profileSection,
    `Task: ${modeInstruction}`,
    '',
    request.prompt
  ].filter(Boolean).join('\n')
}

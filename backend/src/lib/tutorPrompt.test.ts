import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPersonalizedTutorPrompt } from './tutorPrompt'

test('buildPersonalizedTutorPrompt includes learner profile and Zimbabwe curriculum context', () => {
  const prompt = buildPersonalizedTutorPrompt(
    {
      grade: 'Form 4',
      curriculum: 'ZIMSEC',
      subjects: ['Mathematics', 'Physics'],
      learningGoals: ['Pass Mathematics with a B or better'],
      preferredLearningStyle: 'step-by-step examples',
      weakAreas: ['Simultaneous equations'],
      examinationYear: 2026
    },
    {
      prompt: 'Explain simultaneous equations using substitution.',
      subject: 'Mathematics',
      grade: 'Form 4',
      mode: 'explain'
    }
  )

  assert.match(prompt, /Zimbabwean curriculum/i)
  assert.match(prompt, /Form 4/i)
  assert.match(prompt, /Simultaneous equations/i)
  assert.match(prompt, /Explain simultaneous equations using substitution/i)
})

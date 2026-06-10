export const subjectTopics: Record<string, string[]> = {
  Maths: ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Graphs', 'Probability'],
  English: ['Essay writing', 'Comprehension', 'Grammar', 'Summary writing', 'Poetry', 'Literature analysis'],
  Physics: ['Forces and motion', 'Electricity', 'Waves', 'Energy', 'Light', 'Magnetism'],
  Chemistry: ['Atomic structure', 'Chemical bonding', 'Acids and bases', 'Rates of reaction', 'Organic chemistry', 'Stoichiometry'],
  Biology: ['Cell biology', 'Genetics', 'Human nutrition', 'Respiration', 'Ecology', 'Reproduction'],
  History: ['World history', 'Zimbabwean history', 'Colonialism', 'Independence movements', 'Cold War', 'Source analysis'],
  Geography: ['Map reading', 'Weather and climate', 'Population', 'Settlements', 'Natural resources', 'Environmental management'],
  Commerce: ['Business ownership', 'Trade', 'Banking', 'Insurance', 'Marketing', 'Consumer rights'],
  'Principles of Accounting': ['Source documents', 'Books of original entry', 'Ledger accounts', 'Trial balance', 'Bank reconciliation', 'Final accounts', 'Control accounts', 'Depreciation'],
  Accounting: ['Financial statements', 'Partnership accounts', 'Company accounts', 'Manufacturing accounts', 'Incomplete records', 'Cash flow statements', 'Ratio analysis', 'Cost accounting'],
  Shona: ['Nzwisiso', 'Rondedzero', 'Tsumo netsumo', 'Nhetembo', 'Mutauro', 'Tsika nemagariro'],
  French: ['Vocabulary', 'Grammar', 'Reading comprehension', 'Tenses', 'Conversation', 'Writing']
}

export const subjects = Object.keys(subjectTopics)
export const difficulties = ['Foundation', 'Core', 'Extended']

export function getSubjectsForGrade(grade?: string | number) {
  const gradeLabel = String(grade || '').toLowerCase()
  const isAdvancedLevel =
    gradeLabel.includes('lower 6') ||
    gradeLabel.includes('upper 6') ||
    gradeLabel.includes('form 5') ||
    gradeLabel.includes('form 6') ||
    gradeLabel === '11' ||
    gradeLabel === '12'

  return subjects.filter((subject) => {
    if (subject === 'Accounting') return isAdvancedLevel
    if (subject === 'Principles of Accounting') return !isAdvancedLevel
    return true
  })
}

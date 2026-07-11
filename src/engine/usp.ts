import type { BusinessInput } from '../types'

function deriveOutcome(input: BusinessInput): string {
  const desc = input.productDescription?.toLowerCase() || ''
  const problem = input.mainCustomerProblem?.toLowerCase() || ''
  const diff = input.keyDifferentiation?.toLowerCase() || ''

  if (diff.includes('monte carlo') || desc.includes('simulation') || problem.includes('scenario')) return 'faster, more accurate financial and risk analysis'
  if (desc.includes('feasib') || problem.includes('feasib') || desc.includes('npv') || desc.includes('irr')) return 'faster, more reliable feasibility analysis'
  if (desc.includes('invest') || problem.includes('invest') || diff.includes('investor')) return 'better, data-driven investment decisions'
  if (desc.includes('model') || problem.includes('model') || diff.includes('model')) return 'error-free financial models in minutes'
  if (problem.includes('error') || desc.includes('error') || diff.includes('audit')) return 'audit-ready reports with zero manual errors'
  if (desc.includes('report') || problem.includes('report')) return 'investor-ready reports in under 5 minutes'

  return 'faster, more accurate analysis'
}

export function generateUSP(input: BusinessInput): string {
  const target = input.targetCustomerGuess?.split(',')[0]?.trim() || 'businesses and professionals'
  const outcome = deriveOutcome(input)
  const advantage = input.keyDifferentiation?.split('.')[0]?.toLowerCase() || 'our innovative approach'
  const pain = input.currentAlternative?.split(',')[0]?.trim() || 'the complexity and inefficiency of traditional methods'

  return `We help ${target} achieve ${outcome} through ${advantage}, without ${pain}.`
}

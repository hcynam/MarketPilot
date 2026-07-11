import type { BusinessInput } from '../types'

const businessTypeLabels: Record<string, string> = {
  'saas-digital': 'SaaS / Digital Product',
  'service-consulting-education': 'Service / Consulting / Education',
  'physical-product-store': 'Physical Product / Store',
  other: 'Other',
}

const stageLabels: Record<string, string> = {
  idea: 'Idea / Concept stage',
  mvp: 'MVP / Prototype stage',
  'early-sales': 'Early Sales stage',
  growth: 'Growth stage',
  mature: 'Mature stage',
}

export function generateBusinessSummary(input: BusinessInput): string {
  const typeLabel = businessTypeLabels[input.businessType] || input.businessType
  const stageLabel = stageLabels[input.currentStage] || input.currentStage
  const scope = input.geographicScope || 'Scope not yet defined'

  return [
    `${input.businessName} is a ${typeLabel} operating in a ${input.marketModel} model, currently at the ${stageLabel}.`,
    `The business serves customers in: ${scope}.`,
    `Product/Service: ${input.productDescription}`,
    input.teamCapacity ? `Team capacity: ${input.teamCapacity}.` : '',
    input.monthlyBudget ? `Initial marketing budget: ${input.monthlyBudget}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

import type { BusinessInput } from '../types'

const businessCategory: Record<string, string> = {
  'saas-digital': 'AI-powered SaaS platform',
  'service-consulting-education': 'professional service provider',
  'physical-product-store': 'product company',
  other: 'solution provider',
}

export function generatePositioning(input: BusinessInput): string {
  const target = input.targetCustomerGuess?.split('.')[0] || 'target customers'
  const need = input.mainCustomerProblem?.split('.')[0]?.toLowerCase() || 'solve critical business challenges'
  const category = businessCategory[input.businessType] || 'solution provider'
  const benefit = input.keyDifferentiation?.split('.')[0]?.toLowerCase() || 'deliver superior results'
  const alternative = input.currentAlternative?.split(',')[0]?.trim() || 'traditional approaches'

  return [
    `Positioning Statement:`,
    `For ${target},`,
    `who ${need},`,
    `${input.businessName} is a ${category}`,
    `that ${benefit}.`,
    `Unlike ${alternative},`,
    `${input.businessName} ${input.keyDifferentiation ? input.keyDifferentiation.split('.')[0]?.toLowerCase() : 'delivers better outcomes'} — making it the preferred choice for forward-thinking organizations.`,
  ].join('\n')
}

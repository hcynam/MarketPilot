import type { BusinessInput } from '../types'

export function generateValueProposition(input: BusinessInput): string {
  const problem = input.mainCustomerProblem || 'critical business challenge'
  const solution = input.productDescription?.split('.')[0] || 'our solution'
  const differentiator = input.keyDifferentiation || 'unique approach'

  return [
    `Problem: ${problem}`,
    `Solution: ${input.businessName} provides ${solution.toLowerCase()}.`,
    `Differentiation: ${differentiator}.`,
    input.freeTrial ? 'Risk Reduction: Free trial/demo available, allowing customers to validate value before committing.' : '',
    input.currentPrice ? `Value Metric: Priced at ${input.currentPrice}, positioning ${input.abilityToPay === 'high' ? 'as a premium solution for serious investors.' : input.abilityToPay === 'low' ? 'to be accessible while delivering meaningful value.' : 'competitively within the market.'}` : '',
    `Expected Outcome: ${input.mainCustomerProblem ? `Reduced or eliminated "${input.mainCustomerProblem.split('.')[0]}"` : 'Improved business outcomes'} through ${input.businessName}'s capabilities, leading to measurable improvements in efficiency, accuracy, and decision quality.`,
  ]
    .filter(Boolean)
    .join('\n')
}

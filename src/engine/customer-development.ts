import type { BusinessInput } from '../types'
import { customerDevelopmentMap } from '../data/courseFramework'

export function generateCustomerDevelopment(input: BusinessInput): string {
  const stage = customerDevelopmentMap[input.currentStage]
  const descriptions: Record<string, string> = {
    'Customer Discovery':
      'At this stage, the primary goal is to identify customer problems and validate that the proposed solution addresses a real need. Focus on qualitative interviews, problem-solution fit, and building an MVP for testing.',
    'Customer Validation':
      'The focus is on validating that customers are willing to pay for the solution. Develop a repeatable sales process, test pricing models, and confirm product-market fit with early adopters.',
    'Customer Creation':
      'With validated demand, the focus shifts to driving customer acquisition through scalable marketing channels. Develop demand generation, build sales processes, and establish brand presence.',
    'Company Building':
      'The business has established product-market fit. Focus shifts to scaling operations, optimizing channel mix, building customer retention programs, and expanding into new segments or geographies.',
  }

  const desc = descriptions[stage] || ''
  const urgencyNote = input.urgencyLevel === 'critical' || input.urgencyLevel === 'high'
    ? `Given the ${input.urgencyLevel} urgency of the customer problem, development speed is a critical success factor.`
    : `The moderate urgency level allows for a more methodical customer development approach.`

  return `${input.businessName} is currently in the "${stage}" phase of customer development. ${desc} ${urgencyNote}`
}

import type { BusinessInput } from '../types'

export function generateMarketSegments(input: BusinessInput): string[] {
  const segments: string[] = []

  // Geographic
  if (input.geographicScope) {
    segments.push(
      `Geographic: ${input.geographicScope}. ${input.marketModel === 'B2C' || input.marketModel === 'Both' ? 'Localization and language adaptation will be key factors.' : 'Remote/online delivery model allows broad geographic reach without significant localization investment.'}`,
    )
  } else {
    segments.push('Geographic: Not yet specified. Assumption: digital/online delivery enables global reach initially.')
  }

  // Firmographic / Demographic
  const customerHint = input.targetCustomerGuess || input.productDescription
  const modelType = input.marketModel === 'B2C' ? 'Demographic' : 'Firmographic'
  segments.push(
    `${modelType}: Based on the stated target — "${customerHint}" — the primary segment consists of ${input.marketModel === 'B2C' ? 'individuals who match this profile' : 'organizations and decision-makers matching this profile'}.${input.abilityToPay === 'high' ? ' This segment has strong purchasing power and enterprise-level budgets.' : input.abilityToPay === 'low' ? ' This segment is price-sensitive and may require lower-cost options.' : ' This segment has moderate purchasing power typical of SMBs.'}`,
  )

  // Psychographic
  segments.push(
    `Psychographic: Customers who value efficiency, data-driven decision-making, and modern technology solutions. They are likely early adopters or innovation-seekers in their domain. ${input.urgencyLevel === 'critical' || input.urgencyLevel === 'high' ? 'The high urgency of their problem means they are actively seeking solutions.' : 'The moderate urgency means they may evaluate solutions carefully before committing.'}`,
  )

  // Behavioral
  segments.push(
    `Behavioral: ${input.currentStage === 'idea' || input.currentStage === 'mvp' ? 'Potential customers are likely researching alternatives and comparing features. Early adopters who tolerate imperfect solutions are the target.' : input.currentStage === 'early-sales' ? 'Customers are actively comparing options and looking for proven solutions with references.' : 'Customers expect mature products with established ROI data and case studies.'} ${input.freeTrial ? 'The availability of a free trial/demo lowers the barrier to trial for this segment.' : ''}`,
  )

  // Profitability
  segments.push(
    `Profitability / Ability to Pay: ${input.abilityToPay === 'high' ? 'Enterprise-grade budgets allow for premium pricing with high service expectations. CAC can be higher given strong LTV potential.' : input.abilityToPay === 'low' ? 'Price-sensitive segment requires efficient customer acquisition and low-cost delivery models. Volume is key to profitability.' : 'SMB-appropriate pricing with a focus on demonstrated ROI to justify spend. Balance between acquisition cost and lifetime value is critical.'}`,
  )

  return segments
}

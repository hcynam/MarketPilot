import type { BusinessInput } from '../types'
import { qualityCriteria } from '../data/courseFramework'

export function generateQualityScore(input: BusinessInput): {
  score: number
  maxScore: number
  details: string[]
} {
  const details: string[] = []
  let score = 0

  // 1. Clear target market
  if (input.targetCustomerGuess?.trim() && input.targetCustomerGuess.length > 15) {
    score++
    details.push('✓ Clear Target Market: Specific customer description provided with actionable detail.')
  } else if (input.targetCustomerGuess?.trim()) {
    details.push('○ Clear Target Market: Target customer identified but could be more specific.')
  } else {
    details.push('✗ Clear Target Market: No target customer information provided.')
  }

  // 2. Specific personas
  if (input.targetCustomerGuess?.trim() && input.mainCustomerProblem?.trim()) {
    score++
    details.push('✓ Specific Personas: Customer context and pain points enable persona development.')
  } else if (input.targetCustomerGuess?.trim() || input.mainCustomerProblem?.trim()) {
    details.push('○ Specific Personas: Partial customer information available — more detail needed for robust personas.')
  } else {
    details.push('✗ Specific Personas: Insufficient customer data for persona creation.')
  }

  // 3. Non-generic USP
  if (input.keyDifferentiation?.trim() && input.keyDifferentiation.length > 30) {
    score++
    details.push('✓ Non-Generic USP: Clear differentiation identified with specific, meaningful detail.')
  } else if (input.keyDifferentiation?.trim()) {
    details.push('○ Non-Generic USP: Differentiation noted but could be more specific and compelling.')
  } else {
    details.push('✗ Non-Generic USP: No differentiation or unique value identified.')
  }

  // 4. Channel-funnel alignment
  if (input.availableChannels.length >= 2) {
    score++
    details.push('✓ Channel-Funnel Alignment: Multiple channels selected with potential for funnel coverage.')
  } else if (input.availableChannels.length === 1) {
    details.push('○ Channel-Funnel Alignment: Single channel limits funnel coverage.')
  } else {
    details.push('✗ Channel-Funnel Alignment: No marketing channels selected.')
  }

  // 5. Measurable KPIs
  if (input.monthlyBudget?.trim() || input.currentPrice?.trim()) {
    score++
    details.push('✓ Measurable KPIs: Budget or pricing data available — enables KPI target setting.')
  } else {
    details.push('○ Measurable KPIs: Limited financial context — KPI targets are estimated.')
  }

  // 6. Practical 30-day plan
  if (input.availableChannels.length > 0 && input.teamCapacity?.trim()) {
    score++
    details.push('✓ Practical 30-Day Plan: Channels and team capacity known — action plan is grounded.')
  } else if (input.availableChannels.length > 0 || input.teamCapacity?.trim()) {
    details.push('○ Practical 30-Day Plan: Partial operational data available — some assumptions needed.')
  } else {
    details.push('✗ Practical 30-Day Plan: Missing channel and team information limits plan practicality.')
  }

  // 7. Explicit risks and assumptions
  if (input.competitors?.trim() || input.marketConstraints?.trim()) {
    score++
    details.push('✓ Explicit Risks and Assumptions: Competitive or constraint information enables risk identification.')
  } else {
    details.push('○ Explicit Risks and Assumptions: Limited external context — risks are generalized.')
  }

  return {
    score,
    maxScore: qualityCriteria.length,
    details,
  }
}

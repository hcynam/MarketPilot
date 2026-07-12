import type { BusinessInput } from '../types'

export interface InputSufficiencyResult {
  sufficient: boolean
  score: number
  missingDecisionInputs: string[]
}

export function evaluateInputSufficiency(input: BusinessInput): InputSufficiencyResult {
  const checks: Array<[string, boolean, number]> = [
    ['businessName', meaningful(input.businessName, 2), 1],
    ['productDescription', meaningful(input.productDescription, 30), 2],
    ['targetCustomerGuess', meaningful(input.targetCustomerGuess, 20), 2],
    ['mainCustomerProblem', meaningful(input.mainCustomerProblem, 20), 2],
    ['currentAlternative', meaningful(input.currentAlternative, 10), 1],
    ['competitors', meaningful(input.competitors, 10), 1],
    ['keyDifferentiation', meaningful(input.keyDifferentiation, 15), 2],
    ['currentPrice', meaningful(input.currentPrice, 2), 1],
    ['monthlyBudget', meaningful(input.monthlyBudget, 2), 1],
    ['teamCapacity', meaningful(input.teamCapacity, 5), 1],
    ['availableChannels', input.availableChannels.length >= 2, 1],
    ['geographicScope', meaningful(input.geographicScope, 3), 1],
  ]
  const totalWeight = checks.reduce((sum, [, , weight]) => sum + weight, 0)
  const earnedWeight = checks.reduce((sum, [, passed, weight]) => sum + (passed ? weight : 0), 0)
  const missingDecisionInputs = checks.filter(([, passed]) => !passed).map(([name]) => name)
  const coreComplete = ['productDescription', 'targetCustomerGuess', 'mainCustomerProblem', 'keyDifferentiation']
    .every((name) => !missingDecisionInputs.includes(name))
  const commercialComplete = meaningful(input.currentPrice, 2)
    && meaningful(input.monthlyBudget, 2)
    && meaningful(input.teamCapacity, 5)
  const score = Math.round((earnedWeight / totalWeight) * 100)

  return {
    sufficient: coreComplete && commercialComplete && input.availableChannels.length >= 2 && score >= 82,
    score,
    missingDecisionInputs,
  }
}

export function isBusinessInputSufficientForDirectPlan(input: BusinessInput): boolean {
  return evaluateInputSufficiency(input).sufficient
}

function meaningful(value: string, minimum: number): boolean {
  return value.trim().length >= minimum
}

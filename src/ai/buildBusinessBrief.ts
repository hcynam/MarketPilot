import type { BusinessInput } from '../types'

export interface CompactBusinessBrief {
  businessName?: string
  businessType?: BusinessInput['businessType']
  businessModel?: BusinessInput['marketModel']
  businessStage?: BusinessInput['currentStage']
  coreOffer?: string
  targetCustomer?: string
  customerProblem?: string
  currentAlternative?: string
  differentiation?: string
  geography?: string
  competitors?: string
  pricingModel?: BusinessInput['pricingModel']
  priceRange?: string
  freeTrial?: boolean
  pricingNotes?: string
  marketingBudget?: string
  teamCapacity?: string
  primaryGoal?: BusinessInput['marketingGoal']
  availableChannels?: BusinessInput['availableChannels']
  constraints?: string
  purchaseUrgency?: BusinessInput['urgencyLevel']
  abilityToPay?: BusinessInput['abilityToPay']
}

export type MarketingBusinessBrief = CompactBusinessBrief

const FIELD_LIMITS = {
  businessName: 120,
  compact: 500,
  narrative: 900,
} as const

/**
 * Builds the only AI-facing representation of form data.
 * Whitespace is normalized, arrays are deduplicated, empty values are omitted,
 * and unusually long free text is deterministically truncated with an ellipsis.
 */
export function buildBusinessBrief(input: BusinessInput): CompactBusinessBrief {
  const brief: CompactBusinessBrief = {
    businessName: compactText(input.businessName, FIELD_LIMITS.businessName),
    businessType: input.businessType,
    businessModel: input.marketModel,
    businessStage: input.currentStage,
    coreOffer: compactText(input.productDescription, FIELD_LIMITS.narrative),
    targetCustomer: compactText(input.targetCustomerGuess, FIELD_LIMITS.narrative),
    customerProblem: compactText(input.mainCustomerProblem, FIELD_LIMITS.narrative),
    currentAlternative: compactText(input.currentAlternative, FIELD_LIMITS.compact),
    differentiation: compactText(input.keyDifferentiation, FIELD_LIMITS.narrative),
    geography: compactText(input.geographicScope, FIELD_LIMITS.compact),
    competitors: compactText(input.competitors, FIELD_LIMITS.narrative),
    pricingModel: input.pricingModel,
    priceRange: compactText(input.currentPrice, FIELD_LIMITS.compact),
    freeTrial: input.freeTrial,
    pricingNotes: compactText(input.discountOptions, FIELD_LIMITS.compact),
    marketingBudget: compactText(input.monthlyBudget, FIELD_LIMITS.compact),
    teamCapacity: compactText(input.teamCapacity, FIELD_LIMITS.compact),
    primaryGoal: input.marketingGoal,
    availableChannels: deduplicate(input.availableChannels),
    constraints: compactText(input.marketConstraints, FIELD_LIMITS.narrative),
    purchaseUrgency: input.urgencyLevel,
    abilityToPay: input.abilityToPay,
  }

  return removeEmptyValues(brief)
}

export function compactText(value: string, maxChars: number): string | undefined {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return undefined
  if (normalized.length <= maxChars) return normalized

  const slice = normalized.slice(0, Math.max(1, maxChars - 1))
  const boundary = slice.lastIndexOf(' ')
  const safeSlice = boundary >= Math.floor(maxChars * 0.65)
    ? slice.slice(0, boundary)
    : slice
  return `${safeSlice.trimEnd()}…`
}

function deduplicate<T extends string>(values: T[]): T[] | undefined {
  const seen = new Set<string>()
  const result = values.filter((value) => {
    const key = value.trim().toLocaleLowerCase('en-US')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  return result.length > 0 ? result : undefined
}

function removeEmptyValues<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null || item === '') return false
      if (Array.isArray(item) && item.length === 0) return false
      return true
    }),
  ) as T
}

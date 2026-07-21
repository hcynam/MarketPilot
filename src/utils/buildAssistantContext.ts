import { buildBusinessBrief, compactText } from '../ai/buildBusinessBrief'
import type { AssistantBusinessContext } from '../types/assistant'
import type { BusinessInput, MarketingPlan } from '../types'

const planTextLimit = 520
const planItemLimit = 260

/**
 * Builds a deliberately small, AI-facing summary for the assistant. Raw form
 * state and the complete generated plan never cross the function boundary.
 */
export function buildAssistantContext(
  input: BusinessInput,
  plan?: MarketingPlan | null,
): AssistantBusinessContext | undefined {
  if (!hasMeaningfulBusinessData(input) && !plan) return undefined

  const brief = buildBusinessBrief(input)
  const context: AssistantBusinessContext = {
    businessName: brief.businessName,
    businessType: brief.businessType,
    businessModel: brief.businessModel,
    businessStage: brief.businessStage,
    coreOffer: compactOptional(brief.coreOffer, 620),
    targetAudience: compactOptional(brief.targetCustomer, 620),
    customerProblem: compactOptional(brief.customerProblem, 520),
    differentiation: compactOptional(brief.differentiation, 520),
    geography: brief.geography,
    competitors: compactOptional(brief.competitors, 420),
    pricing: compactOptional(brief.priceRange, 320),
    marketingBudget: compactOptional(brief.marketingBudget, 260),
    teamCapacity: compactOptional(brief.teamCapacity, 260),
    primaryGoal: brief.primaryGoal,
    selectedChannels: brief.availableChannels?.slice(0, 8),
  }

  if (plan) {
    context.planAvailable = true
    context.targetMarket = compactText(plan.targetMarket, planTextLimit)
    context.positioning = compactText(plan.positioningStatement, planTextLimit)
    context.pricingRecommendation = compactText(plan.pricingRecommendation, planTextLimit)
    context.channelStrategy = compactItems(plan.channelStrategy, 4)
    context.kpis = compactItems(plan.kpiDashboard.map((item) => `${item.metric}: ${item.value}`), 4)
    context.actionPriorities = compactItems(plan.actionPlan, 3)
  }

  return removeEmpty(context)
}

function hasMeaningfulBusinessData(input: BusinessInput): boolean {
  return [
    input.businessName,
    input.productDescription,
    input.targetCustomerGuess,
    input.mainCustomerProblem,
    input.competitors,
    input.keyDifferentiation,
    input.monthlyBudget,
    input.currentPrice,
  ].some((value) => value.trim().length > 0) || input.availableChannels.length > 0
}

function compactOptional(value: string | undefined, maxChars: number): string | undefined {
  return value ? compactText(value, maxChars) : undefined
}

function compactItems(items: string[], maxItems: number): string[] | undefined {
  const compacted = items
    .map((item) => compactText(item, planItemLimit))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems)
  return compacted.length > 0 ? compacted : undefined
}

function removeEmpty(context: AssistantBusinessContext): AssistantBusinessContext {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)),
  ) as AssistantBusinessContext
}

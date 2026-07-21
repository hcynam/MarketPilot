import type { MarketingPlan } from '../types'
import type { CompactBusinessBrief } from './buildBusinessBrief'
import { compactText } from './buildBusinessBrief'

export interface BaselineDigest {
  businessStage?: string
  currentPrimarySegment?: string
  currentPositioning?: string
  currentValueProposition?: string
  currentChannelPriorities?: string[]
  currentPricingDirection?: string
  currentPrimaryGoal?: string
  currentKpis?: string[]
  knownAssumptions?: string[]
}

export function buildBaselineDigest(
  plan: MarketingPlan,
  brief: CompactBusinessBrief,
): BaselineDigest {
  return removeEmpty({
    currentPrimarySegment: compactText(removeBriefFacts(plan.targetMarket, brief), 320),
    currentPositioning: compactText(removeBriefFacts(plan.positioningStatement, brief), 320),
    currentValueProposition: compactText(removeBriefFacts(plan.valueProposition, brief), 320),
    currentChannelPriorities: plan.channelStrategy.slice(0, 3).map((item) => compactText(removeBriefFacts(item, brief), 180)).filter(isString),
    currentPricingDirection: compactText(removeBriefFacts(plan.pricingRecommendation, brief), 280),
    currentKpis: plan.kpiDashboard.slice(0, 6).map((item) => item.metric),
    knownAssumptions: plan.risksAssumptions.filter((item) => /فرض|assum/i.test(item)).slice(0, 3).map((item) => compactText(removeBriefFacts(item, brief), 160)).filter(isString),
  })
}

function removeBriefFacts(value: string, brief: CompactBusinessBrief): string {
  const facts: Array<[string | undefined, string]> = [
    [brief.businessName, '[businessName]'],
    [brief.targetCustomer, '[targetCustomer]'],
    [brief.customerProblem, '[customerProblem]'],
    [brief.currentAlternative, '[currentAlternative]'],
    [brief.differentiation, '[differentiation]'],
    [brief.priceRange, '[priceRange]'],
    [brief.marketingBudget, '[marketingBudget]'],
  ]
  return facts
    .filter((item): item is [string, string] => Boolean(item[0] && item[0].length >= 8))
    .sort((a, b) => b[0].length - a[0].length)
    .reduce((text, [fact, reference]) => text.split(fact).join(reference), value)
}

function removeEmpty<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => {
    if (item === undefined || item === '') return false
    if (Array.isArray(item) && item.length === 0) return false
    return true
  })) as T
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0
}

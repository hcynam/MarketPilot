import type { BusinessInput, MarketingPlan } from '../types'
import { generateBusinessSummary } from './business-summary'
import { generateCustomerDevelopment } from './customer-development'
import { generateMarketSegments } from './market-segments'
import { generateTargetMarket } from './target-market'
import { generatePositioning } from './positioning'
import { generatePersonas } from './personas'
import { generateValueProposition } from './value-proposition'
import { generateUSP } from './usp'
import { generateCompetitorAnalysis } from './competitor-analysis'
import { generateMarketingMix } from './marketing-mix'
import { generateFunnelJourney } from './funnel-journey'
import { generateChannelStrategy } from './channel-strategy'
import { generatePricingRecommendation } from './pricing'
import { generateKPIDashboard } from './kpi-dashboard'
import { generateActionPlan } from './action-plan'
import { generateRisksAssumptions } from './risks-assumptions'
import { generateQualityScore } from './quality-score'
import { toPersianMarketingPlan } from './persian-plan'

export function generateMarketingPlan(input: BusinessInput): MarketingPlan {
  const basePlan: MarketingPlan = {
    businessSummary: generateBusinessSummary(input),
    customerDevelopmentStage: generateCustomerDevelopment(input),
    marketSegments: generateMarketSegments(input),
    targetMarket: generateTargetMarket(input),
    positioningStatement: generatePositioning(input),
    customerPersonas: generatePersonas(input),
    valueProposition: generateValueProposition(input),
    usp: generateUSP(input),
    competitorAnalysis: generateCompetitorAnalysis(input),
    marketingMix7p: generateMarketingMix(input),
    funnelJourney: generateFunnelJourney(input),
    channelStrategy: generateChannelStrategy(input),
    pricingRecommendation: generatePricingRecommendation(input),
    kpiDashboard: generateKPIDashboard(input),
    actionPlan: generateActionPlan(input),
    risksAssumptions: generateRisksAssumptions(input),
    qualityScore: generateQualityScore(input),
  }

  return toPersianMarketingPlan(input, basePlan)
}

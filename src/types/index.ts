export type BusinessType =
  | 'saas-digital'
  | 'service-consulting-education'
  | 'physical-product-store'
  | 'other'

export type MarketModel = 'B2B' | 'B2C' | 'Both'

export type BusinessStage = 'idea' | 'mvp' | 'early-sales' | 'growth' | 'mature'

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low'

export type AbilityToPayLevel = 'high' | 'medium' | 'low'

export type MarketingGoal =
  | 'awareness'
  | 'leads'
  | 'sales'
  | 'app-installs'
  | 'retention'
  | 'referral'

export type AvailableChannel =
  | 'website'
  | 'seo'
  | 'content-marketing'
  | 'social-media'
  | 'email'
  | 'mobile'
  | 'influencer'
  | 'referral'
  | 'ppc'
  | 'offline'
  | 'other'

export type PricingModel =
  | 'freemium'
  | 'subscription'
  | 'one-time'
  | 'usage-based'
  | 'tiered'
  | 'custom'
  | 'free'

export interface BusinessInput {
  // Section 1: Business Basics
  businessName: string
  productDescription: string
  businessType: BusinessType
  marketModel: MarketModel
  currentStage: BusinessStage
  geographicScope: string

  // Section 2: Customer and Problem
  targetCustomerGuess: string
  mainCustomerProblem: string
  currentAlternative: string
  urgencyLevel: UrgencyLevel
  abilityToPay: AbilityToPayLevel

  // Section 3: Market and Competition
  competitors: string
  keyDifferentiation: string
  marketConstraints: string

  // Section 4: Channels and Budget
  availableChannels: AvailableChannel[]
  monthlyBudget: string
  teamCapacity: string
  marketingGoal: MarketingGoal

  // Section 5: Pricing and Offer
  currentPrice: string
  pricingModel: PricingModel
  freeTrial: boolean
  discountOptions: string
}

export const defaultBusinessInput: BusinessInput = {
  businessName: '',
  productDescription: '',
  businessType: 'saas-digital',
  marketModel: 'B2B',
  currentStage: 'idea',
  geographicScope: '',
  targetCustomerGuess: '',
  mainCustomerProblem: '',
  currentAlternative: '',
  urgencyLevel: 'medium',
  abilityToPay: 'medium',
  competitors: '',
  keyDifferentiation: '',
  marketConstraints: '',
  availableChannels: [],
  monthlyBudget: '',
  teamCapacity: '',
  marketingGoal: 'awareness',
  currentPrice: '',
  pricingModel: 'subscription',
  freeTrial: false,
  discountOptions: '',
}

export interface KPI {
  metric: string
  value: string
  benchmark: string
  interpretation: string
}

export interface MarketingPlan {
  businessSummary: string
  customerDevelopmentStage: string
  marketSegments: string[]
  targetMarket: string
  positioningStatement: string
  customerPersonas: string[]
  valueProposition: string
  usp: string
  competitorAnalysis: string[]
  marketingMix7p: Record<string, string>
  funnelJourney: string[]
  channelStrategy: string[]
  pricingRecommendation: string
  kpiDashboard: KPI[]
  actionPlan: string[]
  risksAssumptions: string[]
  qualityScore: { score: number; maxScore: number; details: string[] }
}

export const STORAGE_KEY = 'marketpilot-form-draft'

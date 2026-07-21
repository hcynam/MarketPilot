export type AssistantRole = 'user' | 'assistant'

export interface AssistantMessage {
  id: string
  role: AssistantRole
  content: string
}

export interface AssistantHistoryMessage {
  role: AssistantRole
  content: string
}

export interface AssistantBusinessContext {
  businessName?: string
  businessType?: string
  businessModel?: string
  businessStage?: string
  coreOffer?: string
  targetAudience?: string
  customerProblem?: string
  differentiation?: string
  geography?: string
  competitors?: string
  pricing?: string
  marketingBudget?: string
  teamCapacity?: string
  primaryGoal?: string
  selectedChannels?: string[]
  planAvailable?: boolean
  targetMarket?: string
  positioning?: string
  pricingRecommendation?: string
  channelStrategy?: string[]
  kpis?: string[]
  actionPriorities?: string[]
}

export interface AssistantRequest {
  message: string
  history: AssistantHistoryMessage[]
  businessContext?: AssistantBusinessContext
}

export interface AssistantSuccessResponse {
  success: true
  answer: string
  suggestions: string[]
}

export interface AssistantErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export type AssistantResponse = AssistantSuccessResponse | AssistantErrorResponse

export type ClarifyingQuestionExpectedAnswerType = 'text' | 'number' | 'choice' | 'multiChoice'
export type ClarifyingQuestionPriority = 'high' | 'medium' | 'low'
export type ClarifyingDecisionImpact =
  | 'segmentation'
  | 'positioning'
  | 'channel'
  | 'pricing'
  | 'kpi'
  | 'budget'
  | 'funnel'
  | 'competition'
  | 'customer'
  | 'offer'
  | 'trust'
  | 'distribution'
  | 'goal'
  | 'other'

export interface ClarifyingQuestion {
  id: string
  question: string
  whyItMatters: string
  expectedAnswerType: ClarifyingQuestionExpectedAnswerType
  options?: string[]
  required: boolean
  priority: ClarifyingQuestionPriority
  decisionImpact: ClarifyingDecisionImpact
}

export interface ClarifyingQuestionsResponse {
  mode: 'needs_clarification' | 'ready_for_plan'
  inputQualityScore: number
  diagnosis: string
  missingInformation: string[]
  requiredQuestions: ClarifyingQuestion[]
  optionalQuestions: ClarifyingQuestion[]
  assumptionsIfProceeding: string[]
}

export interface AIStrategyPatch {
  diagnosis?: string
  assumptions?: string[]
  targetMarket?: {
    primarySegment?: string
    secondarySegment?: string
    selectionReason?: string
  }
  positioning?: {
    positioningStatement?: string
    valueProposition?: string
    usp?: string
    proofNeeded?: string[]
  }
  personas?: Array<{
    label?: string
    profile?: string
    pain?: string
    motivation?: string
    objection?: string
    buyingTrigger?: string
  }>
  channelPriorities?: Array<{
    channel?: string
    funnelRole?: string
    recommendedAction?: string
    kpi?: string
    rationale?: string
  }>
  pricingDirection?: {
    recommendation?: string
    rationale?: string
    validationExperiment?: string
  }
  kpis?: Array<{
    name?: string
    formula?: string
    initialTarget?: string
    reviewFrequency?: string
  }>
  actionPlan?: Array<{
    period?: string
    focus?: string
    actions?: string[]
    successMetric?: string
  }>
  risks?: Array<{
    risk?: string
    mitigation?: string
  }>
}

export interface PatchMergeDiagnostic {
  acceptedPatchAreas: string[]
  rejectedPatchAreas: Array<{
    area: string
    reason: string
  }>
  usablePatch: boolean
}

export interface StrategyPatchValidationResult extends PatchMergeDiagnostic {
  patch: AIStrategyPatch
  normalization: PatchNormalizationDiagnostic
}

export interface StrategyPatchResponse {
  patch: AIStrategyPatch
  diagnostic: PatchMergeDiagnostic
}

export type PatchWrapperSource = 'root' | 'patch' | 'strategyPatch' | 'data' | 'result'

export interface PatchNormalizationDiagnostic {
  rawTopLevelKeys: string[]
  unwrappedFrom: PatchWrapperSource
  normalizedTopLevelKeys: string[]
  recognizedPatchAreas: string[]
  unknownTopLevelKeys: string[]
}

export interface ProviderResponseDiagnostic {
  providerHttpStatus?: number
  providerFinishReason?: string
  providerContentChars: number
  providerReasoningChars?: number
  parsedJson: boolean
  rawTopLevelKeys: string[]
  unwrappedFrom?: PatchWrapperSource
  normalizedTopLevelKeys: string[]
  recognizedPatchAreas: string[]
  unknownTopLevelKeys: string[]
  acceptedPatchAreas: string[]
  rejectedPatchAreas: Array<{
    area: string
    reason: string
  }>
}

export type ProviderRequestFormat = 'strict_json_schema' | 'json_object' | 'json_object_fallback'

export interface ProviderAttemptDiagnostic {
  providerRequestFormat: ProviderRequestFormat
  structuredFallbackAttempted: boolean
  structuredFallbackSucceeded: boolean
  providerHttpStatus?: number
  providerErrorCode?: string
  providerErrorType?: string
  providerRequestId?: string
}

export interface RequestPreflightDiagnostic {
  mode: 'clarification' | 'strategy_patch'
  provider: 'groq' | 'gemini'
  selectedModel: string
  systemPromptChars: number
  userPromptChars: number
  compactBusinessBriefChars: number
  baselineDigestChars: number
  clarificationAnswerChars: number
  structuredOutputSchemaChars?: number
  estimatedInputTokens: number
  requestedOutputTokens: number
  totalEstimatedTokens: number
  compressionApplied: boolean
  optionalContextRemoved: boolean
  blockedLocally: boolean
  providerRequestFormat?: ProviderRequestFormat
  structuredFallbackAttempted?: boolean
  structuredFallbackSucceeded?: boolean
  providerHttpStatus?: number
  providerErrorCode?: string
  providerErrorType?: string
  providerRequestId?: string
}

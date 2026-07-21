import type { RequestPreflightDiagnostic } from './marketingSchemas'
import type { PromptParts } from './promptBuilders'
import { isStrictGroqModel, strategyPatchJsonSchema } from './strategyPatchJsonSchema'

export type ProviderName = 'groq' | 'gemini'
export type ProviderRequestMode = 'clarification' | 'strategy_patch'

export const REQUEST_BUDGETS = {
  clarification: {
    maxPromptChars: 7000,
    outputTokens: 600,
    maxTotalEstimatedTokens: 3200,
  },
  strategy_patch: {
    maxPromptChars: 12000,
    outputTokens: 2300,
    maxTotalEstimatedTokens: 7000,
  },
} as const

export interface PreflightOptions {
  mode: ProviderRequestMode
  provider: ProviderName
  selectedModel: string
  prompt: PromptParts
  compressionApplied?: boolean
  optionalContextRemoved?: boolean
}

export function preflightProviderRequest(options: PreflightOptions): RequestPreflightDiagnostic {
  const budget = REQUEST_BUDGETS[options.mode]
  const promptChars = options.prompt.systemPrompt.length + options.prompt.userPrompt.length
  const schemaText = options.provider === 'groq' && options.mode === 'strategy_patch' && isStrictGroqModel(options.selectedModel)
    ? JSON.stringify(strategyPatchJsonSchema)
    : ''
  const estimatedInputTokens = estimateTokens(`${options.prompt.systemPrompt}\n${options.prompt.userPrompt}${schemaText ? `\n${schemaText}` : ''}`)
  const totalEstimatedTokens = estimatedInputTokens + budget.outputTokens
  const blockedLocally = promptChars > budget.maxPromptChars || totalEstimatedTokens > budget.maxTotalEstimatedTokens

  return {
    mode: options.mode,
    provider: options.provider,
    selectedModel: options.selectedModel,
    systemPromptChars: options.prompt.systemPrompt.length,
    userPromptChars: options.prompt.userPrompt.length,
    compactBusinessBriefChars: options.prompt.compactBusinessBriefChars,
    baselineDigestChars: options.prompt.baselineDigestChars,
    clarificationAnswerChars: options.prompt.clarificationAnswerChars,
    ...(schemaText ? { structuredOutputSchemaChars: schemaText.length } : {}),
    estimatedInputTokens,
    requestedOutputTokens: budget.outputTokens,
    totalEstimatedTokens,
    compressionApplied: options.compressionApplied ?? false,
    optionalContextRemoved: options.optionalContextRemoved ?? false,
    blockedLocally,
  }
}

/** Conservative approximation with extra weight for Persian/non-ASCII text and a 15% margin. */
export function estimateTokens(value: string): number {
  let ascii = 0
  let nonAscii = 0
  for (const character of value) {
    if (character.charCodeAt(0) <= 0x7f) ascii += 1
    else nonAscii += 1
  }
  return Math.ceil(((ascii / 4) + (nonAscii / 1.8)) * 1.15)
}

export function safePreflightLog(diagnostic: RequestPreflightDiagnostic): void {
  console.info('MarketPilot AI request preflight', diagnostic)
}

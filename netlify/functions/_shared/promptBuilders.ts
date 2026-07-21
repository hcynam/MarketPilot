import type { BaselineDigest } from '../../../src/ai/baselineDigest'
import type { CompactBusinessBrief } from '../../../src/ai/buildBusinessBrief'
import type { AIStrategyPatch, ClarifyingQuestionsResponse } from './marketingSchemas'

export interface PromptParts {
  systemPrompt: string
  userPrompt: string
  compactBusinessBriefChars: number
  baselineDigestChars: number
  clarificationAnswerChars: number
}

export interface BuildClarifyingQuestionsPromptArgs {
  businessBrief: CompactBusinessBrief
  contextNotes?: string[]
}

export interface BuildStrategyPatchPromptArgs {
  businessBrief: CompactBusinessBrief
  baselineDigest: BaselineDigest
  clarifyingAnswers?: Record<string, unknown>
  contextNotes?: string[]
}

export type ClarifyingQuestionsPromptContract = ClarifyingQuestionsResponse
export type StrategyPatchPromptContract = AIStrategyPatch

const roleAndSafetyRules = [
  'You are MarketPilot AI, a Persian-first marketing strategy analyst.',
  'Use only supplied facts; label inferences as assumptions.',
  'Do not invent market size, competitor facts, financial results, or guaranteed outcomes.',
  'Targets without evidence are initial test targets, not promises.',
  'Return exactly one JSON object only; never use Markdown fences or commentary.',
].join('\n')

export function buildClarifyingQuestionsPrompt(
  args: BuildClarifyingQuestionsPromptArgs,
): PromptParts {
  const brief = serialize(args.businessBrief)
  const optionalContext = compactList(args.contextNotes)
  const systemPrompt = `${roleAndSafetyRules}\n\nMode: clarification. Ask only questions that change segmentation, positioning, pricing, channel, budget, goal, trust, or distribution decisions. Never generate a marketing plan.`
  const userPrompt = [
    'Compact business brief:',
    brief,
    optionalContext ? `Optional context:\n${optionalContext}` : '',
    'Return mode "needs_clarification" with 3-6 non-duplicative required questions, or "ready_for_plan" with zero questions.',
    'Each question needs: id, question, whyItMatters, expectedAnswerType, required=true, priority, decisionImpact.',
    'Contract: {"mode":"needs_clarification|ready_for_plan","inputQualityScore":0,"diagnosis":"...","missingInformation":[],"requiredQuestions":[],"optionalQuestions":[],"assumptionsIfProceeding":[]}',
  ].filter(Boolean).join('\n\n')

  return {
    systemPrompt,
    userPrompt,
    compactBusinessBriefChars: brief.length,
    baselineDigestChars: 0,
    clarificationAnswerChars: 0,
  }
}

export function buildStrategyPatchPrompt(args: BuildStrategyPatchPromptArgs): PromptParts {
  const brief = serialize(args.businessBrief)
  const digest = serialize(args.baselineDigest)
  const answers = serialize(args.clarifyingAnswers ?? {})
  const optionalContext = compactList(args.contextNotes)
  const systemPrompt = `${roleAndSafetyRules}\n\nMode: strategy patch. Improve decision quality using STP, customer motivation, value proposition, positioning, funnel/channel fit, pricing direction, KPI logic, 30-day priorities, risks, and validation. Do not recreate the report.`
  const userPrompt = [
    'Compact business brief:', brief,
    'Compact baseline digest (the complete plan stays local):', digest,
    Object.keys(args.clarifyingAnswers ?? {}).length > 0 ? `Clarification answers:\n${answers}` : '',
    optionalContext ? `Optional context:\n${optionalContext}` : '',
    'Return only a compact patch with the exact schema keys. Never wrap it inside patch, strategyPatch, data, or result.',
    'When the brief is sufficient, produce at least two meaningful strategic areas. Diagnosis is optional and must be business-specific when used.',
    'Use null for unused object/string areas and empty arrays for unused list areas. Facts and assumptions must remain distinct.',
    'Keep the patch concise: at most 2 personas, 3 channel priorities, 4 KPIs, 4 action-plan periods with at most 3 actions each, 3 risks, and 3 assumptions. Use one concise sentence per string.',
    'Exact keys: diagnosis, assumptions, targetMarket, positioning, personas, channelPriorities, pricingDirection, kpis, actionPlan, risks.',
    'Nested shapes: targetMarket{primarySegment,secondarySegment,selectionReason}; positioning{positioningStatement,valueProposition,usp,proofNeeded[]}; personas[{label,profile,pain,motivation,objection,buyingTrigger}]; channelPriorities[{channel,funnelRole,recommendedAction,kpi,rationale}]; pricingDirection{recommendation,rationale,validationExperiment}; kpis[{name,formula,initialTarget,reviewFrequency}]; actionPlan[{period,focus,actions[],successMetric}]; risks[{risk,mitigation}].',
    'Never repeat the complete brief, invent unsupported market or financial facts, include fixed report sections, raw form objects, or regenerate the complete 17-section plan.',
  ].filter(Boolean).join('\n\n')

  return {
    systemPrompt,
    userPrompt,
    compactBusinessBriefChars: brief.length,
    baselineDigestChars: digest.length,
    clarificationAnswerChars: answers === '{}' ? 0 : answers.length,
  }
}

function serialize(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return '{}'
  }
}

function compactList(values: string[] | undefined): string {
  if (!values?.length) return ''
  return values.map((item) => item.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 4).join('\n')
}

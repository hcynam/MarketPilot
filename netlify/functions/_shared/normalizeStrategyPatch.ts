import type { PatchWrapperSource } from './marketingSchemas'

const wrapperKeys = ['patch', 'strategyPatch', 'data', 'result'] as const
const patchAreaKeys = [
  'diagnosis',
  'assumptions',
  'targetMarket',
  'positioning',
  'personas',
  'channelPriorities',
  'pricingDirection',
  'kpis',
  'actionPlan',
  'risks',
] as const

const aliases: Record<string, string> = {
  target_market: 'targetMarket',
  channel_priorities: 'channelPriorities',
  pricing_direction: 'pricingDirection',
  action_plan: 'actionPlan',
  value_proposition: 'valueProposition',
  positioning_statement: 'positioningStatement',
  proof_needed: 'proofNeeded',
  buying_trigger: 'buyingTrigger',
  success_metric: 'successMetric',
  review_frequency: 'reviewFrequency',
  initial_target: 'initialTarget',
  primary_segment: 'primarySegment',
  secondary_segment: 'secondarySegment',
  selection_reason: 'selectionReason',
  funnel_role: 'funnelRole',
  recommended_action: 'recommendedAction',
  validation_experiment: 'validationExperiment',
}

export interface NormalizedStrategyPatchInput {
  value: unknown
  rawTopLevelKeys: string[]
  unwrappedFrom: PatchWrapperSource
  normalizedTopLevelKeys: string[]
  recognizedPatchAreas: string[]
  unknownTopLevelKeys: string[]
}

export function normalizeStrategyPatchInput(data: unknown): NormalizedStrategyPatchInput {
  const rawTopLevelKeys = isRecord(data) ? Object.keys(data).sort() : []
  const unwrapped = unwrapOneLevel(data)
  const normalized = normalizeValue(unwrapped.value, 0)
  const normalizedTopLevelKeys = isRecord(normalized) ? Object.keys(normalized).sort() : []
  const recognizedPatchAreas = normalizedTopLevelKeys.filter((key) => patchAreaKeys.includes(key as typeof patchAreaKeys[number]))
  const unknownTopLevelKeys = normalizedTopLevelKeys.filter((key) => !patchAreaKeys.includes(key as typeof patchAreaKeys[number]))

  return {
    value: normalized,
    rawTopLevelKeys,
    unwrappedFrom: unwrapped.source,
    normalizedTopLevelKeys,
    recognizedPatchAreas,
    unknownTopLevelKeys,
  }
}

function unwrapOneLevel(data: unknown): { value: unknown; source: PatchWrapperSource } {
  if (!isRecord(data)) return { value: data, source: 'root' }
  const presentWrappers = wrapperKeys.filter((key) => isRecord(data[key]))
  const hasRootPatchArea = Object.keys(data).some((key) => patchAreaKeys.includes((aliases[key] ?? key) as typeof patchAreaKeys[number]))
  if (!hasRootPatchArea && presentWrappers.length === 1) {
    const key = presentWrappers[0]
    return { value: data[key], source: key }
  }
  return { value: data, source: 'root' }
}

function normalizeValue(value: unknown, depth: number): unknown {
  if (depth > 2) return value
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item, depth + 1))
  if (!isRecord(value)) return value

  const normalized: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    const normalizedKey = aliases[key] ?? key
    if (normalizedKey in normalized) continue
    normalized[normalizedKey] = normalizeValue(item, depth + 1)
  }
  return normalized
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

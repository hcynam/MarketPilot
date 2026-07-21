import type {
  AIStrategyPatch,
  PatchMergeDiagnostic,
} from '../../netlify/functions/_shared/marketingSchemas'
import type { CompactBusinessBrief } from './buildBusinessBrief'
import type { KPI, MarketingPlan } from '../types'

export interface PatchMergeResult {
  plan: MarketingPlan
  diagnostic: PatchMergeDiagnostic
}

export function mergeStrategyPatch(
  baseline: MarketingPlan,
  patch: AIStrategyPatch,
  diagnostic: PatchMergeDiagnostic,
  brief: CompactBusinessBrief,
): PatchMergeResult {
  const merged = clonePlan(baseline)

  if (patch.diagnosis) merged.businessSummary = joinUnique([merged.businessSummary, `تشخیص راهبردی: ${patch.diagnosis}`])
  if (patch.targetMarket) {
    merged.targetMarket = joinUnique([
      patch.targetMarket.primarySegment,
      patch.targetMarket.secondarySegment && `بخش ثانویه: ${patch.targetMarket.secondarySegment}`,
      patch.targetMarket.selectionReason && `منطق انتخاب: ${patch.targetMarket.selectionReason}`,
    ]) || merged.targetMarket
  }
  if (patch.positioning?.positioningStatement) merged.positioningStatement = patch.positioning.positioningStatement
  if (patch.positioning?.valueProposition) merged.valueProposition = patch.positioning.valueProposition
  if (patch.positioning?.usp) merged.usp = patch.positioning.usp
  if (patch.positioning?.proofNeeded?.length) {
    merged.risksAssumptions.push(...patch.positioning.proofNeeded.map((item) => `شاهد موردنیاز: ${item}`))
  }
  if (patch.personas?.length) {
    merged.customerPersonas = patch.personas.map((persona) => joinUnique([
      persona.label,
      persona.profile && `پروفایل: ${persona.profile}`,
      persona.pain && `مسئله: ${persona.pain}`,
      persona.motivation && `انگیزه: ${persona.motivation}`,
      persona.objection && `اعتراض: ${persona.objection}`,
      persona.buyingTrigger && `محرک خرید: ${persona.buyingTrigger}`,
    ])).filter(Boolean)
  }
  if (patch.channelPriorities?.length) {
    merged.channelStrategy = patch.channelPriorities.map((item) => joinUnique([
      item.channel,
      item.funnelRole && `نقش در قیف: ${item.funnelRole}`,
      item.recommendedAction && `اقدام: ${item.recommendedAction}`,
      item.kpi && `KPI: ${item.kpi}`,
      item.rationale && `منطق: ${item.rationale}`,
    ])).filter(Boolean)
  }
  if (patch.pricingDirection) {
    merged.pricingRecommendation = joinUnique([
      patch.pricingDirection.recommendation,
      patch.pricingDirection.rationale && `منطق: ${patch.pricingDirection.rationale}`,
      patch.pricingDirection.validationExperiment && `آزمایش اعتبارسنجی: ${patch.pricingDirection.validationExperiment}`,
    ]) || merged.pricingRecommendation
  }
  if (patch.kpis?.length) merged.kpiDashboard = patch.kpis.map(toKpi)
  if (patch.actionPlan?.length) {
    merged.actionPlan = patch.actionPlan.map((item) => joinUnique([
      `${item.period}: ${item.focus}`,
      ...(item.actions ?? []),
      item.successMetric && `معیار موفقیت: ${item.successMetric}`,
    ], '; ')).filter(Boolean)
  }
  if (patch.risks?.length) {
    merged.risksAssumptions.push(...patch.risks.map((item) => `${item.risk} — راهکار: ${item.mitigation}`))
  }
  if (patch.assumptions?.length) {
    merged.risksAssumptions.push(...patch.assumptions.map((item) => `فرضیه هوش مصنوعی: ${item}`))
  }

  return {
    plan: consistencyPass(merged, baseline, brief, diagnostic),
    diagnostic,
  }
}

function consistencyPass(
  plan: MarketingPlan,
  baseline: MarketingPlan,
  brief: CompactBusinessBrief,
  diagnostic: PatchMergeDiagnostic,
): MarketingPlan {
  const result = clonePlan(plan)
  if (!result.targetMarket.trim()) result.targetMarket = baseline.targetMarket
  if (!result.positioningStatement.trim()) result.positioningStatement = baseline.positioningStatement
  if (!result.valueProposition.trim()) result.valueProposition = baseline.valueProposition
  if (!result.usp.trim()) result.usp = baseline.usp
  if (result.customerPersonas.length === 0) result.customerPersonas = [...baseline.customerPersonas]
  if (result.channelStrategy.length === 0) result.channelStrategy = [...baseline.channelStrategy]
  if (result.kpiDashboard.length === 0) result.kpiDashboard = baseline.kpiDashboard.map((item) => ({ ...item }))
  if (result.actionPlan.length === 0) result.actionPlan = [...baseline.actionPlan]
  if (result.risksAssumptions.length === 0) result.risksAssumptions = [...baseline.risksAssumptions]

  const channelNames = result.channelStrategy.join(' ').toLocaleLowerCase('fa')
  result.kpiDashboard = result.kpiDashboard.filter((kpi) => {
    const hasExplicitChannel = /کانال:|channel:/i.test(kpi.interpretation)
    if (!hasExplicitChannel) return true
    const channel = kpi.interpretation.split(/کانال:|channel:/i)[1]?.split(/[|؛]/)[0]?.trim().toLocaleLowerCase('fa')
    return !channel || channelNames.includes(channel)
  })
  if (result.kpiDashboard.length === 0) result.kpiDashboard = baseline.kpiDashboard.map((item) => ({ ...item }))

  const enhancementLabel = diagnostic.rejectedPatchAreas.length > 0
    ? 'بخشی از پیشنهادهای هوش مصنوعی پس از اعتبارسنجی اعمال شد.'
    : 'پیشنهادهای معتبر هوش مصنوعی پس از اعتبارسنجی اعمال شد.'
  result.qualityScore.details = deduplicate([...result.qualityScore.details, `✓ ${enhancementLabel}`])
  if (brief.businessName && !result.businessSummary.includes(brief.businessName)) {
    result.businessSummary = `${brief.businessName}: ${result.businessSummary}`
  }
  result.risksAssumptions = deduplicate(result.risksAssumptions)
  return result
}

function toKpi(item: NonNullable<AIStrategyPatch['kpis']>[number]): KPI {
  return {
    metric: item.name ?? 'KPI',
    value: item.initialTarget ?? 'هدف آزمایشی نیازمند اعتبارسنجی',
    benchmark: `روش سنجش: ${item.formula ?? 'تعریف شود'} | بازبینی: ${item.reviewFrequency ?? 'هفتگی'}`,
    interpretation: 'هدف اولیه برای آزمون است و باید با داده واقعی کمپین بازتنظیم شود.',
  }
}

function clonePlan(plan: MarketingPlan): MarketingPlan {
  return {
    ...plan,
    marketSegments: [...plan.marketSegments],
    customerPersonas: [...plan.customerPersonas],
    competitorAnalysis: [...plan.competitorAnalysis],
    marketingMix7p: { ...plan.marketingMix7p },
    funnelJourney: [...plan.funnelJourney],
    channelStrategy: [...plan.channelStrategy],
    kpiDashboard: plan.kpiDashboard.map((item) => ({ ...item })),
    actionPlan: [...plan.actionPlan],
    risksAssumptions: [...plan.risksAssumptions],
    qualityScore: { ...plan.qualityScore, details: [...plan.qualityScore.details] },
  }
}

function joinUnique(values: Array<string | undefined>, separator = '\n'): string {
  return deduplicate(values.filter((value): value is string => Boolean(value?.trim()))).join(separator)
}

function deduplicate(values: string[]): string[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('fa')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

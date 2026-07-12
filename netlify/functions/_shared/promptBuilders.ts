import type { BaselineMarketingPlan } from './hybridPlan'

type PromptValue = string | Record<string, unknown> | unknown[] | null | undefined

export interface BuildClarifyingQuestionsPromptArgs {
  businessInput: PromptValue
  contextNotes?: string[]
}

export interface BuildFinalMarketingPlanPromptArgs {
  businessInput: PromptValue
  clarifyingAnswers?: PromptValue
  baselinePlan: BaselineMarketingPlan
  repairIssues?: string[]
  invalidPatch?: unknown
  contextNotes?: string[]
}

const courseRules = `
- STP: choose actionable segments, one primary target, and a defensible position.
- 7P: recommendations must fit product, price, place, promotion, people, process, and physical evidence.
- Funnel: cover Awareness, Consideration, Conversion, and Retention with actions and metrics.
- Tie channels, pricing, KPI, and experiments to budget, capacity, stage, customer problem, and evidence.
- Do not invent market facts. Turn uncertainty into a named assumption and validation test.
`.trim()

export function buildClarifyingQuestionsPrompt(args: BuildClarifyingQuestionsPromptArgs): string {
  return `
TASK: Decide whether a marketing plan needs a small number of decision-changing clarifications.

BUSINESS INPUT
${serialize(args.businessInput)}

RULES
- Ask zero to 3 required questions and at most 1 optional question.
- Never repeat a form question whose answer is already present.
- Ask tradeoff or prioritization questions that change STP, channel, pricing, offer, or KPI decisions.
- Each question needs a short Persian label and Persian priority: بالا, متوسط, or پایین.
- Prefer useful choice options grounded in the supplied business.
- All user-visible strings must be professional Persian. KPI, USP, STP, 7P and channel names may remain standard acronyms.
- Output only one JSON object. No markdown and no extra keys.

EXACT JSON SHAPE
{
  "mode":"needs_clarification|ready_for_plan",
  "inputQualityScore":70,
  "diagnosis":"تشخیص کوتاه و اختصاصی",
  "missingInformation":[],
  "requiredQuestions":[{
    "id":"decision-1",
    "label":"اولویت بخش مشتری",
    "question":"یک پرسش تصمیم‌ساز و اختصاصی",
    "whyItMatters":"اثر پاسخ بر تصمیم STP، کانال، قیمت یا KPI",
    "expectedAnswerType":"choice",
    "options":["گزینه اختصاصی اول","گزینه اختصاصی دوم"],
    "required":true,
    "priority":"بالا",
    "decisionImpact":"segmentation"
  }],
  "optionalQuestions":[],
  "assumptionsIfProceeding":[]
}

CONTEXT NOTES
${list(args.contextNotes)}
`.trim()
}

export function buildFinalMarketingPlanPrompt(args: BuildFinalMarketingPlanPromptArgs): string {
  return `
TASK: Produce a strategic enhancement patch for the deterministic baseline. Improve selected strategic decisions; do not rewrite the full 17-section report.

BUSINESS INPUT
${serialize(args.businessInput)}

CLARIFYING ANSWERS
${serialize(args.clarifyingAnswers ?? {})}

DETERMINISTIC BASELINE PLAN
${serialize(args.baselinePlan)}

COURSE RULES
${courseRules}

REQUIREMENTS
- Ground every recommendation in the business input, clarifying answers, or a clearly named assumption.
- Be specific to the product, customer problem, budget, stage, existing channels, competitors, pricing, and goal.
- Avoid templates, filler, generic marketing advice, and repeated sentences.
- Do not repeat the app name as content.
- All user-visible text must be concise professional Persian; KPI, USP, STP, 7P and standard stage/element identifiers may remain English.
- Priority values must be exactly بالا, متوسط, or پایین; never high, medium, or low.
- All seven 7P elements and all four funnel stages must appear exactly once.
- Risks must include concrete validation tests.
- Output only one JSON object. No markdown, code fences, or prose outside JSON.
- Return EXACTLY one object whose top-level keys are: summaryInsight, segments, primaryTarget, positioningStatement, personas, usp, competitors, marketingMix7P, funnel, digitalChannels, pricingRecommendation, kpis, thirtyDayPlan, risks, qualityRationale.
- Do NOT wrap the object inside patch, data, result, output, response, plan, or any other key.
- Do NOT return an array.
- Use the user's clarifying answers explicitly in primaryTarget, digitalChannels, KPIs, thirtyDayPlan, and pricing or trust strategy where relevant.
${args.repairIssues?.length ? `- Repair all of these prior quality issues:\n${list(args.repairIssues)}` : ''}
${args.invalidPatch !== undefined ? `\nINVALID PATCH TO REPAIR\n${serialize(args.invalidPatch)}\nKeep the same patch schema. Fix only invalid, missing, or generic areas and return the unwrapped JSON object.` : ''}

EXACT PATCH JSON SHAPE
{
  "summaryInsight":"بینش اختصاصی و کوتاه",
  "segments":[{"name":"نام بخش","problem":"مسئله مشخص","accessChannel":"مسیر دسترسی","willingnessToPay":"منطق توان پرداخت","priority":"بالا"}],
  "primaryTarget":{"name":"بخش اولویت‌دار","reason":"دلیل انتخاب","whyNow":"دلیل اولویت زمانی"},
  "positioningStatement":"بیانیه جایگاه‌یابی مشخص",
  "personas":[{"name":"نام پرسونا","role":"نقش","pain":"درد","trigger":"محرک","objection":"اعتراض","message":"پیام"}],
  "usp":"پیشنهاد فروش منحصربه‌فرد و قابل دفاع",
  "competitors":[{"name":"رقیب یا جایگزین","type":"نوع","strength":"قوت","weakness":"ضعف","howToDifferentiate":"روش تمایز"}],
  "marketingMix7P":[{"element":"Product|Price|Place|Promotion|People|Process|Physical Evidence","recommendation":"توصیه مشخص","reason":"دلیل"}],
  "funnel":[{"stage":"Awareness|Consideration|Conversion|Retention","action":"اقدام","channel":"کانال","metric":"معیار"}],
  "digitalChannels":[{"channel":"کانال","priority":"بالا","reason":"دلیل","firstExperiment":"آزمایش نخست"}],
  "pricingRecommendation":{"recommendedModel":"مدل قیمت","reason":"دلیل","introOffer":"پیشنهاد آغازین","risk":"ریسک"},
  "kpis":[{"name":"KPI","target":"هدف","measurement":"روش سنجش","whyItMatters":"اهمیت","channel":"کانال"}],
  "thirtyDayPlan":[{"week":"هفته ۱","actions":["اقدام مشخص اول","اقدام مشخص دوم"],"successMetric":"معیار موفقیت"}],
  "risks":[{"risk":"ریسک واقعی","assumption":"فرض","validationTest":"آزمون اعتبارسنجی"}],
  "qualityRationale":"دلیل کوتاه کیفیت و محدودیت تحلیل"
}

MINIMUM COUNTS: segments 3; personas 2; competitors 3; marketingMix7P 7; funnel 4; digitalChannels 3; kpis 3; thirtyDayPlan 4; risks 2.

CONTEXT NOTES
${list(args.contextNotes)}
`.trim()
}

function serialize(value: unknown): string {
  try { return JSON.stringify(value ?? {}, null, 2) } catch { return '{}' }
}

function list(values: string[] | undefined): string {
  return values?.length ? values.map((value) => `- ${value}`).join('\n') : '- none'
}

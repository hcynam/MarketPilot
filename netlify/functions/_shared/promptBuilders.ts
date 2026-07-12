import {
  requiredMarketingPlanSections,
  type AIFinalMarketingPlanResponse,
  type ClarifyingQuestionsResponse,
} from './marketingSchemas'

type PromptValue = string | Record<string, unknown> | unknown[] | null | undefined

export interface BuildClarifyingQuestionsPromptArgs {
  businessInput: PromptValue
  contextNotes?: string[]
}

export interface BuildFinalMarketingPlanPromptArgs {
  businessInput: PromptValue
  clarifyingAnswers?: PromptValue
  assumptions?: string[]
  contextNotes?: string[]
}

export type ClarifyingQuestionsPromptContract = ClarifyingQuestionsResponse
export type FinalMarketingPlanPromptContract = AIFinalMarketingPlanResponse

const decisionImpactValues = [
  'segmentation',
  'positioning',
  'channel',
  'pricing',
  'kpi',
  'budget',
  'funnel',
  'competition',
  'customer',
  'offer',
  'other',
]

const compactMarketingKnowledge = `
- STP: define actionable segments, select a priority target, and state positioning/USP.
- Persona: capture need, pain, objection, buying trigger, access path, and willingness to pay.
- 7P: connect Product, Price, Place, Promotion, People, Process, and Physical Evidence to actions.
- Funnel: map awareness, consideration, conversion, activation/loyalty, and advocacy to channels and KPIs.
- KPIs: use measurable targets and methods such as CTR, conversion, CPL, CAC, retention, LTV, and ROI.
- Pricing and budget must fit margin, stage, capacity, evidence, and risk. Never invent market facts.
`.trim()

export function buildClarifyingQuestionsPrompt(args: BuildClarifyingQuestionsPromptArgs): string {
  const businessInput = serializeForPrompt(args.businessInput)
  const contextNotes = formatList(args.contextNotes)

  return `
You are MarketPilot AI, a Persian-first marketing planning analyst.

TASK
Evaluate the user business input quality. Do not generate the marketing plan yet.

INPUT
${businessInput}

COURSE KNOWLEDGE
${compactMarketingKnowledge}

CONTEXT NOTES
${contextNotes}

CLARIFICATION INSTRUCTIONS
- Detect missing, vague, contradictory, unrealistic, suspicious, nonsense, or low-value information.
- Ask only questions that materially improve the final marketing plan.
- Every question must affect one of these decision areas: ${decisionImpactValues.join(', ')}.
- Every question must include priority: "high", "medium", or "low".
- Every question must include decisionImpact using exactly one allowed value.
- Questions must be specific, business-useful, and answerable.
- Avoid generic questions that the original form already answered.
- Do not ask unnecessary questions just to fill a quota.
- If input is nonsense, suspicious, contradictory, or very low-value, ask diagnostic questions instead of pretending it is enough.
- Ask at most 3 required questions and at most 1 optional question.
- If the input is genuinely sufficient, return mode "ready_for_plan" and keep requiredQuestions empty.
- If important information is missing, return mode "needs_clarification".
- Output Persian-first professional JSON only.
- Do not include markdown, comments, code fences, or explanations outside JSON.

OUTPUT CONTRACT
Return valid JSON matching ClarifyingQuestionsResponse:
{
  "mode": "needs_clarification",
  "inputQualityScore": 0,
  "diagnosis": "string",
  "missingInformation": ["string"],
  "requiredQuestions": [
    {
      "id": "target-customer-specificity",
      "question": "سوال مشخص و قابل پاسخ",
      "whyItMatters": "توضیح دهید پاسخ چگونه تصمیم بازاریابی را تغییر می‌دهد",
      "expectedAnswerType": "text",
      "options": ["string"],
      "required": true,
      "priority": "high",
      "decisionImpact": "segmentation"
    }
  ],
  "optionalQuestions": [],
  "assumptionsIfProceeding": ["string"]
}
`.trim()
}

export function buildFinalMarketingPlanPrompt(args: BuildFinalMarketingPlanPromptArgs): string {
  const businessInput = serializeForPrompt(args.businessInput)
  const clarifyingAnswers = serializeForPrompt(args.clarifyingAnswers ?? {})
  const assumptions = formatList(args.assumptions)
  const contextNotes = formatList(args.contextNotes)
  const requiredSections = requiredMarketingPlanSections
    .map((section) => `${section.id}. ${section.title}`)
    .join('\n')

  return `
You are MarketPilot AI, a Persian-first marketing planning analyst.

TASK
Generate the final structured marketing plan using the user form input, clarifying answers, course knowledge, and strict rules.

BUSINESS INPUT
${businessInput}

CLARIFYING ANSWERS
${clarifyingAnswers}

ASSUMPTIONS ALLOWED ONLY IF NEEDED
${assumptions}

COURSE KNOWLEDGE
${compactMarketingKnowledge}

REQUIRED 17 SECTIONS
Return exactly these 17 sections with exact ids and titles:
${requiredSections}

CONTEXT NOTES
${contextNotes}

FINAL PLAN INSTRUCTIONS
- Generate a practical 17-section marketing plan.
- sections.length must be exactly 17.
- language must be exactly "fa".
- Avoid generic filler and essay-like output.
- Keep every section concise: one short paragraph or a minimal structured list/cards set.
- Be Persian-first and professional.
- Use English only for standard terms and acronyms such as KPI, USP, CAC, ROI, CTR, SEO, LTV, PPC.
- Every recommendation must include logic from input or an explicit assumption.
- Use structured content for important sections where useful, especially sections 3, 6, 10, 11, 12, 14, 15, and 17.
- Section 3 should use AISegmentCard-like objects when possible.
- Section 6 should use AIPersonaCard-like objects when possible.
- Section 10 should use AI7PItem-like objects.
- Section 11 should use AIFunnelStageItem-like objects.
- Section 12 must use AIChannelRecommendation-like objects with channel, funnelStage, goal, action, kpi, risk, and budgetFit.
- KPI dashboard must use KPI objects with formula or method, target, channel, reviewFrequency, and riskOrCaution.
- The 30-day action plan must be weekly, executable, and measurable.
- qualityScore must be an object, not a plain number.
- State assumptions clearly.
- Do not overpromise results.
- Output valid JSON only, matching AIFinalMarketingPlanResponse.
- No markdown outside JSON. No explanations outside JSON.
- Fit the complete response within 2200 output tokens.

STRUCTURED CONTENT SHAPES
AIChannelRecommendation:
{ "channel": "string", "funnelStage": "string", "goal": "string", "action": "string", "kpi": "string", "risk": "string", "budgetFit": "string" }

AI7PItem:
{ "element": "string", "diagnosis": "string", "recommendation": "string", "action": "string" }

AIFunnelStageItem:
{ "stage": "string", "customerMindset": "string", "action": "string", "channel": "string", "kpi": "string" }

AISegmentCard:
{ "segmentName": "string", "description": "string", "pain": "string", "accessPath": "string", "willingnessToPay": "string", "priority": "high" }

AIPersonaCard:
{ "name": "string", "profile": "string", "needs": ["string"], "objections": ["string"], "trigger": "string", "message": "string" }

OUTPUT CONTRACT
Return valid JSON matching AIFinalMarketingPlanResponse:
{
  "businessName": "string",
  "language": "fa",
  "planType": "AI-assisted marketing plan",
  "inputQualityDiagnosis": "string",
  "assumptions": ["string"],
  "sections": [
    {
      "id": 1,
      "title": "خلاصه کسب‌وکار",
      "contentType": "paragraph",
      "content": "string or structured content"
    },
    {
      "id": 12,
      "title": "استراتژی کانال دیجیتال",
      "contentType": "cards",
      "content": [
        {
          "channel": "string",
          "funnelStage": "string",
          "goal": "string",
          "action": "string",
          "kpi": "string",
          "risk": "string",
          "budgetFit": "string"
        }
      ]
    }
  ],
  "kpis": [
    {
      "name": "string",
      "reason": "string",
      "formula": "string",
      "target": "string",
      "channel": "string",
      "reviewFrequency": "string",
      "riskOrCaution": "string"
    }
  ],
  "actionPlan30Days": [
    {
      "week": 1,
      "focus": "string",
      "actions": ["string"],
      "successMetric": "string"
    }
  ],
  "risks": ["string"],
  "qualityScore": {
    "score": 0,
    "strengths": ["string"],
    "weaknesses": ["string"],
    "missingInputs": ["string"],
    "improvementSuggestions": ["string"]
  }
}
`.trim()
}

function serializeForPrompt(value: PromptValue): string {
  if (value === null || value === undefined) return '{}'
  if (typeof value === 'string') return value.trim() || '{}'

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) return '- none'
  return values.map((value) => `- ${value}`).join('\n')
}

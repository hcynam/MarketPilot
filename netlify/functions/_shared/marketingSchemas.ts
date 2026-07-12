export type ClarifyingQuestionExpectedAnswerType = 'text' | 'number' | 'choice' | 'multiChoice'
export type ClarifyingQuestionPriority = 'بالا' | 'متوسط' | 'پایین'
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
  | 'other'

export interface ClarifyingQuestion {
  id: string
  label: string
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

export type AIPlanSectionContentType =
  | 'paragraph'
  | 'list'
  | 'cards'
  | 'table'
  | 'kpi'
  | 'actionPlan'
  | 'score'

export interface AIChannelRecommendation {
  channel: string
  funnelStage: string
  goal: string
  action: string
  kpi: string
  risk: string
  budgetFit: string
}

export interface AI7PItem {
  element: string
  diagnosis: string
  recommendation: string
  action: string
}

export interface AIFunnelStageItem {
  stage: string
  customerMindset: string
  action: string
  channel: string
  kpi: string
}

export interface AISegmentCard {
  segmentName: string
  description: string
  pain: string
  accessPath: string
  willingnessToPay: string
  priority: ClarifyingQuestionPriority
}

export interface AIPersonaCard {
  name: string
  profile: string
  needs: string[]
  objections: string[]
  trigger: string
  message: string
}

export interface AIQualityScore {
  score: number
  strengths: string[]
  weaknesses: string[]
  missingInputs: string[]
  improvementSuggestions: string[]
}

export type AIPlanSectionContent =
  | string
  | string[]
  | AIChannelRecommendation[]
  | AI7PItem[]
  | AIFunnelStageItem[]
  | AISegmentCard[]
  | AIPersonaCard[]
  | AIQualityScore
  | Record<string, unknown>
  | Array<Record<string, unknown>>

export interface AIPlanSection {
  id: number
  title: string
  contentType: AIPlanSectionContentType
  content: AIPlanSectionContent
}

export interface AIKpiItem {
  name: string
  reason: string
  formula: string
  target: string
  channel: string
  reviewFrequency: string
  riskOrCaution: string
}

export interface AIActionPlanItem {
  week: number
  focus: string
  actions: string[]
  successMetric: string
}

export interface AIFinalMarketingPlanResponse {
  businessName: string
  language: 'fa'
  planType: string
  inputQualityDiagnosis: string
  assumptions: string[]
  sections: AIPlanSection[]
  kpis: AIKpiItem[]
  actionPlan30Days: AIActionPlanItem[]
  risks: string[]
  qualityScore: AIQualityScore
}

export const requiredMarketingPlanSections = [
  { id: 1, title: 'خلاصه کسب‌وکار' },
  { id: 2, title: 'مرحله توسعه مشتری' },
  { id: 3, title: 'بخش‌های بازار' },
  { id: 4, title: 'بازار هدف' },
  { id: 5, title: 'بیانیه جایگاه‌یابی' },
  { id: 6, title: 'پرسونای مشتریان' },
  { id: 7, title: 'ارزش پیشنهادی' },
  { id: 8, title: 'پیشنهاد فروش منحصربه‌فرد (USP)' },
  { id: 9, title: 'تحلیل رقبا و جایگزین‌ها' },
  { id: 10, title: 'آمیخته بازاریابی 7P' },
  { id: 11, title: 'قیف و سفر مشتری' },
  { id: 12, title: 'استراتژی کانال دیجیتال' },
  { id: 13, title: 'پیشنهاد اولیه قیمت‌گذاری' },
  { id: 14, title: 'داشبورد KPI' },
  { id: 15, title: 'برنامه اقدام ۳۰ روزه' },
  { id: 16, title: 'ریسک‌ها و فرضیات' },
  { id: 17, title: 'امتیاز کیفیت برنامه بازاریابی' },
] as const

export type RequiredMarketingPlanSectionId = typeof requiredMarketingPlanSections[number]['id']

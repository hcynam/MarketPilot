import type {
  ClarifyingDecisionImpact,
  ClarifyingQuestion,
  ClarifyingQuestionsResponse,
} from '../../netlify/functions/_shared/marketingSchemas'
import type { CompactBusinessBrief } from './buildBusinessBrief'

export interface CompletenessAssessment {
  sufficient: boolean
  score: number
  missingDecisionAreas: string[]
  questions: ClarifyingQuestion[]
}

interface QuestionCandidate {
  id: string
  when: boolean
  question: string
  why: string
  impact: ClarifyingDecisionImpact
}

export function assessBusinessCompleteness(brief: CompactBusinessBrief): CompletenessAssessment {
  const isLocal = isLocalBusiness(brief)
  const isSaas = brief.businessType === 'saas-digital'
  const isConsulting = brief.businessType === 'service-consulting-education'
  const isRetail = brief.businessType === 'physical-product-store'
  const hasResources = hasText(brief.marketingBudget) || hasText(brief.teamCapacity)
  const hasCompetitiveContext = hasText(brief.differentiation) || hasText(brief.currentAlternative)

  const candidates: QuestionCandidate[] = [
    candidate('offer', !hasText(brief.coreOffer), 'محصول یا خدمت اصلی دقیقاً چیست و مشتری چه خروجی ملموسی از آن می‌گیرد؟', 'تعریف پیشنهاد، پیام و مسیر تبدیل به این پاسخ وابسته است.', 'offer'),
    candidate('customer', !hasText(brief.targetCustomer), 'مشتری اصلی را با نقش، نیاز و ویژگی تصمیم‌گیری او مشخص کنید.', 'این پاسخ مبنای بخش‌بندی و انتخاب بازار هدف است.', 'customer'),
    candidate('problem', !hasText(brief.customerProblem), 'مهم‌ترین مسئله‌ای که مشتری برای حل آن اقدام می‌کند چیست؟', 'شدت مسئله بر جایگاه‌یابی و پیام ارزش اثر مستقیم دارد.', 'positioning'),
    candidate('goal', !brief.primaryGoal, 'هدف اصلی بازاریابی در ۳۰ روز آینده چیست؟', 'اولویت کانال‌ها و KPIها باید با یک هدف مشخص همسو باشند.', 'kpi'),
    candidate('resources', !hasResources, 'بودجه تقریبی و ظرفیت اجرایی تیم در ماه آینده چقدر است؟', 'پیشنهاد کانال و حجم اقدام باید با منابع واقعی سازگار باشد.', 'budget'),
    candidate('differentiation', !hasCompetitiveContext, 'مشتری امروز از چه جایگزینی استفاده می‌کند و مزیت قابل‌اثبات شما نسبت به آن چیست؟', 'این پاسخ مبنای جایگاه‌یابی و ادعای قابل دفاع است.', 'competition'),
    candidate('geography', isLocal && !hasText(brief.geography), 'محدوده جغرافیایی خدمت‌رسانی و شعاع جذب مشتری کجاست؟', 'کسب‌وکار محلی بدون محدوده خدمت نمی‌تواند کانال کشف محلی مناسبی انتخاب کند.', 'segmentation'),
    candidate('channels', !brief.availableChannels?.length, 'اکنون به کدام کانال‌ها، فهرست مخاطبان یا نقاط تماس دسترسی دارید؟', 'اولویت توزیع باید از دارایی‌های در دسترس شروع شود.', 'channel'),
    candidate('pricing', (isSaas || isRetail || isConsulting) && !hasText(brief.priceRange), 'مدل و دامنه قیمت فعلی چیست و مهم‌ترین محدودیت قیمت‌گذاری کدام است؟', 'قیمت بر پیشنهاد، قیف و هدف تبدیل اثر می‌گذارد.', 'pricing'),
    candidate('b2b-buyer', isSaas && brief.businessModel === 'B2B' && !mentionsDecisionMaker(brief.targetCustomer), 'تصمیم‌گیرنده خرید در سازمان مشتری چه نقشی دارد و فرایند تصمیم‌گیری معمولاً چگونه است؟', 'قیف B2B و پیام اعتمادساز به نقش خریدار و چرخه فروش وابسته است.', 'funnel'),
    candidate('trust', isConsulting && !mentionsTrustSignal(brief.differentiation), 'چه شواهدی مانند تجربه، نمونه‌کار، نتیجه مشتری یا اعتبار تخصصی برای کاهش ریسک خرید دارید؟', 'فروش خدمات آموزشی و مشاوره‌ای به سیگنال‌های اعتماد وابسته است.', 'positioning'),
    candidate('retail-ops', isRetail && !mentionsRetailOperations(brief.constraints), 'محدودیت اصلی موجودی، حاشیه سود، ارسال یا مرجوعی چیست؟', 'ترویج و تخفیف باید با اقتصاد سفارش و عملیات فروشگاه سازگار باشد.', 'pricing'),
  ]

  const missing = candidates.filter((item) => item.when)
  const requiredCoreMissing = missing.filter((item) => ['offer', 'customer', 'problem', 'goal'].includes(item.id)).length
  // One or two gaps can be handled as explicitly labelled assumptions; a
  // clarification step is reserved for meaningfully incomplete inputs.
  const sufficient = missing.length < 3
  const questions = sufficient ? [] : ensureQuestionRange(missing)
  const score = Math.max(0, Math.min(100, 100 - (requiredCoreMissing * 20) - ((missing.length - requiredCoreMissing) * 8)))

  return {
    sufficient,
    score,
    missingDecisionAreas: missing.map((item) => item.id),
    questions,
  }
}

export function toLocalClarificationResponse(
  assessment: CompletenessAssessment,
): ClarifyingQuestionsResponse {
  return {
    mode: assessment.sufficient ? 'ready_for_plan' : 'needs_clarification',
    inputQualityScore: assessment.score,
    diagnosis: assessment.sufficient
      ? 'اطلاعات برای ساخت برنامه پایه و تحلیل راهبردی کافی است.'
      : 'چند تصمیم کلیدی هنوز برای پیشنهاد دقیق کانال، پیام یا بودجه روشن نیست.',
    missingInformation: assessment.missingDecisionAreas,
    requiredQuestions: assessment.questions,
    optionalQuestions: [],
    assumptionsIfProceeding: [],
  }
}

function ensureQuestionRange(missing: QuestionCandidate[]): ClarifyingQuestion[] {
  return missing.slice(0, 6).map((item) => ({
    id: item.id,
    question: item.question,
    whyItMatters: item.why,
    expectedAnswerType: 'text',
    required: true,
    priority: 'high',
    decisionImpact: item.impact,
  }))
}

function candidate(
  id: string,
  when: boolean,
  question: string,
  why: string,
  impact: ClarifyingDecisionImpact,
): QuestionCandidate {
  return { id, when, question, why, impact }
}

function isLocalBusiness(brief: CompactBusinessBrief): boolean {
  const text = `${brief.coreOffer ?? ''} ${brief.geography ?? ''}`.toLocaleLowerCase('fa')
  return brief.businessModel === 'B2C' && /محلی|کافه|رستوران|سالن|فروشگاه|شهر|منطقه/.test(text)
}

function hasText(value: string | undefined): boolean {
  return Boolean(value && value.trim().length >= 3)
}

function mentionsDecisionMaker(value: string | undefined): boolean {
  return Boolean(value && /مدیر|بنیان|تصمیم|مالک|مدیرعامل|خرید|founder|manager|owner|decision/i.test(value))
}

function mentionsTrustSignal(value: string | undefined): boolean {
  return Boolean(value && /نمونه|سابقه|مدرک|نتیجه|مشتری|اعتبار|تخصص|case|proof|experience/i.test(value))
}

function mentionsRetailOperations(value: string | undefined): boolean {
  return Boolean(value && /موجودی|حاشیه|ارسال|مرجوع|انبار|margin|inventory|shipping|return/i.test(value))
}

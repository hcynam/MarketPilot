import type { BusinessInput, KPI, MarketingPlan } from '../types'

const stageLabels: Record<BusinessInput['currentStage'], string> = {
  idea: 'ایده و اعتبارسنجی اولیه',
  mvp: 'نمونه اولیه / MVP',
  'early-sales': 'فروش اولیه',
  growth: 'رشد',
  mature: 'بلوغ بازار',
}

const businessTypeLabels: Record<BusinessInput['businessType'], string> = {
  'saas-digital': 'محصول دیجیتال / SaaS',
  'service-consulting-education': 'خدمت، مشاوره یا آموزش',
  'physical-product-store': 'محصول فیزیکی یا فروشگاه',
  other: 'مدل ترکیبی یا خاص',
}

const goalLabels: Record<BusinessInput['marketingGoal'], string> = {
  awareness: 'افزایش آگاهی از برند',
  leads: 'جذب سرنخ فروش',
  sales: 'افزایش فروش مستقیم',
  'app-installs': 'افزایش نصب و فعال‌سازی',
  retention: 'افزایش نگهداشت مشتری',
  referral: 'رشد ارجاعی و توصیه مشتریان',
}

const pricingLabels: Record<BusinessInput['pricingModel'], string> = {
  freemium: 'Freemium',
  subscription: 'اشتراکی',
  'one-time': 'خرید یک‌باره',
  'usage-based': 'مبتنی بر میزان استفاده',
  tiered: 'پلن‌های چندسطحی',
  custom: 'سفارشی / سازمانی',
  free: 'رایگان یا حمایتی',
}

const channelLabels: Record<string, string> = {
  website: 'وب‌سایت و صفحه فرود',
  seo: 'SEO',
  'content-marketing': 'بازاریابی محتوایی',
  'social-media': 'شبکه‌های اجتماعی',
  email: 'ایمیل مارکتینگ',
  mobile: 'موبایل / اپلیکیشن',
  influencer: 'همکاری با متخصصان و اثرگذاران',
  referral: 'ارجاع و توصیه مشتریان',
  ppc: 'تبلیغات کلیکی / PPC',
  offline: 'رویدادها و ارتباطات حضوری',
  other: 'کانال‌های تکمیلی',
}

function valueOrFallback(value: string, fallback: string): string {
  return value.trim() || fallback
}

function brand(input: BusinessInput): string {
  return valueOrFallback(input.businessName, 'MarketPilot AI').replace(/MarketPilot AI/g, 'MarketPilot AI')
}

function sanitize(value: string): string {
  return value.replace(/MarketPilot AI/g, 'MarketPilot AI').replace(/\s+/g, ' ').trim()
}

function channels(input: BusinessInput): string {
  if (input.availableChannels.length === 0) {
    return 'هنوز کانال مشخصی انتخاب نشده است؛ پیشنهاد می‌شود با دو تا سه کانال اصلی شروع شود.'
  }

  return input.availableChannels.map((channel) => channelLabels[channel] ?? channel).join('، ')
}

function urgencyText(input: BusinessInput): string {
  switch (input.urgencyLevel) {
    case 'critical':
      return 'فوریت مسئله بسیار بالاست و پیام بازاریابی باید روی کاهش ریسک و سرعت رسیدن به نتیجه تأکید کند.'
    case 'high':
      return 'نیاز مشتری جدی است و می‌توان پیام‌ها را حول حل یک درد عملیاتی یا مالی روشن طراحی کرد.'
    case 'medium':
      return 'مسئله برای مشتری مهم است، اما برای تبدیل بهتر باید مزیت اقتصادی و عملیاتی با شواهد روشن توضیح داده شود.'
    case 'low':
      return 'مسئله فوریت کمی دارد؛ بنابراین آموزش بازار، اعتمادسازی و نشان دادن ارزش تدریجی اهمیت بیشتری دارد.'
  }
}

function stageFocus(input: BusinessInput): string {
  switch (input.currentStage) {
    case 'idea':
      return 'تمرکز اصلی باید روی کشف مسئله، مصاحبه با مشتریان و اعتبارسنجی ارزش پیشنهادی باشد.'
    case 'mvp':
      return 'تمرکز اصلی باید روی تبدیل بازخورد کاربران اولیه به پیام بازاریابی دقیق و قابل سنجش باشد.'
    case 'early-sales':
      return 'تمرکز اصلی باید روی تکرار فروش‌های اولیه، ساخت قیف جذب سرنخ و بهبود نرخ تبدیل باشد.'
    case 'growth':
      return 'تمرکز اصلی باید روی مقیاس‌دادن کانال‌های اثبات‌شده و کنترل CAC، ROI و Retention باشد.'
    case 'mature':
      return 'تمرکز اصلی باید روی تمایز پایدار، وفاداری مشتری و توسعه سهم بازار باشد.'
  }
}

function localizeKpis(kpis: KPI[], input: BusinessInput): KPI[] {
  const name = brand(input)

  return kpis.map((kpi) => ({
    ...kpi,
    value: sanitize(kpi.value),
    benchmark: sanitize(kpi.benchmark),
    interpretation: `${name} باید ${kpi.metric} را به‌عنوان یک شاخص تصمیم‌ساز رصد کند. هدف پیشنهادی «${sanitize(kpi.value)}» است و معیار مقایسه «${sanitize(kpi.benchmark)}» در نظر گرفته می‌شود. این عدد باید با داده‌های واقعی کمپین و کیفیت کانال‌ها بازبینی شود.`,
  }))
}

function qualityDetails(input: BusinessInput, score: number, maxScore: number): string[] {
  const passed = score >= Math.ceil(maxScore * 0.75)
  const partial = score >= Math.ceil(maxScore * 0.45)
  const status = passed ? '✓' : partial ? '○' : '✗'

  return [
    `${status} بازار هدف: ${input.targetCustomerGuess ? 'مشتری هدف تعریف شده و برای بخش‌بندی اولیه قابل استفاده است.' : 'برای تحلیل دقیق‌تر باید مشتری هدف روشن‌تر شود.'}`,
    `${input.mainCustomerProblem ? '✓' : '○'} مسئله مشتری: ${input.mainCustomerProblem ? 'مسئله اصلی مشتری به اندازه کافی برای طراحی پیام بازاریابی مشخص است.' : 'تعریف مسئله مشتری به جزئیات بیشتری نیاز دارد.'}`,
    `${input.keyDifferentiation ? '✓' : '○'} تمایز و USP: ${input.keyDifferentiation ? 'تمایز کلیدی مشخص شده و می‌تواند مبنای جایگاه‌یابی باشد.' : 'برای USP قوی‌تر باید مزیت رقابتی دقیق‌تر شود.'}`,
    `${input.availableChannels.length > 0 ? '✓' : '○'} کانال‌ها: ${input.availableChannels.length > 0 ? 'کانال‌های اصلی انتخاب شده‌اند و می‌توان قیف جذب را طراحی کرد.' : 'برای برنامه اجرایی باید کانال‌های اصلی انتخاب شوند.'}`,
    `${input.monthlyBudget || input.currentPrice ? '✓' : '○'} سنجه‌پذیری: ${input.monthlyBudget || input.currentPrice ? 'بودجه یا قیمت‌گذاری، پایه‌ای برای تعریف KPI فراهم کرده است.' : 'برای هدف‌گذاری دقیق KPI، داده مالی بیشتری لازم است.'}`,
    `${input.teamCapacity ? '✓' : '○'} اجراپذیری: ${input.teamCapacity ? 'ظرفیت تیم در برنامه اقدام لحاظ شده است.' : 'برای واقع‌بینی برنامه اقدام، ظرفیت تیم باید کامل‌تر مشخص شود.'}`,
    `${input.competitors || input.marketConstraints ? '✓' : '○'} ریسک‌ها: ${input.competitors || input.marketConstraints ? 'زمینه رقابتی یا محدودیت‌های بازار برای تحلیل ریسک وجود دارد.' : 'ریسک‌ها فعلاً عمومی هستند و باید با داده بازار تکمیل شوند.'}`,
  ]
}

export function toPersianMarketingPlan(input: BusinessInput, base: MarketingPlan): MarketingPlan {
  const name = brand(input)
  const product = sanitize(valueOrFallback(input.productDescription, 'محصول یا خدمت معرفی‌شده'))
  const target = sanitize(valueOrFallback(input.targetCustomerGuess, 'مشتریان هدفی که بیشترین تناسب را با ارزش پیشنهادی دارند'))
  const problem = sanitize(valueOrFallback(input.mainCustomerProblem, 'مسئله‌ای که مشتری برای حل آن به راه‌حل قابل اعتماد نیاز دارد'))
  const differentiation = sanitize(valueOrFallback(input.keyDifferentiation, 'ترکیبی از سرعت اجرا، ساختار تحلیلی و خروجی قابل اتکا'))
  const competitors = sanitize(valueOrFallback(input.competitors, 'راه‌حل‌های موجود، روش‌های دستی و گزینه‌های جایگزین بازار'))
  const price = sanitize(valueOrFallback(input.currentPrice, 'قیمت‌گذاری هنوز نیازمند اعتبارسنجی بازار است'))
  const budget = sanitize(valueOrFallback(input.monthlyBudget, 'بودجه بازاریابی هنوز تعیین نشده است'))
  const team = sanitize(valueOrFallback(input.teamCapacity, 'ظرفیت تیم باید پیش از اجرای کامل برنامه دقیق‌تر شود'))
  const score = base.qualityScore.score
  const maxScore = base.qualityScore.maxScore

  return {
    businessSummary: `${name} یک ${businessTypeLabels[input.businessType]} با مدل بازار ${input.marketModel} است که برای ${target} طراحی شده است. شرح ارزش اصلی محصول: ${product}. برنامه بازاریابی باید روی حل این مسئله متمرکز شود: ${problem}. در مرحله فعلی (${stageLabels[input.currentStage]})، مسیر پیشنهادی ترکیبی از پیام شفاف، قیف جذب قابل سنجش و کانال‌های قابل کنترل است.`,

    customerDevelopmentStage: `${stageLabels[input.currentStage]} نشان می‌دهد که تصمیم‌های بازاریابی باید با سطح بلوغ محصول هماهنگ باشند. ${stageFocus(input)} ${urgencyText(input)} خروجی مناسب این مرحله، پیام ارزش روشن، فرضیات قابل آزمون و چند شاخص عملیاتی برای سنجش کشش بازار است.`,

    marketSegments: [
      `جغرافیایی: ${sanitize(valueOrFallback(input.geographicScope, 'تمرکز اولیه می‌تواند روی بازارهای قابل دسترس و کانال‌های دیجیتال باشد.'))}`,
      `جمعیت‌شناختی / سازمانی: ${target}`,
      `روان‌شناختی: مشتریانی که به کاهش خطا، صرفه‌جویی زمان، تصمیم‌گیری تحلیلی و اعتبار خروجی اهمیت می‌دهند.`,
      `رفتاری: مشتریانی که برای حل مسئله فعلی از ${sanitize(valueOrFallback(input.currentAlternative, 'روش‌های دستی یا ابزارهای پراکنده'))} استفاده می‌کنند و به دنبال جایگزین سریع‌تر و قابل اعتمادتر هستند.`,
      `سودآوری: با توجه به توان پرداخت ${input.abilityToPay === 'high' ? 'بالا' : input.abilityToPay === 'low' ? 'پایین' : 'متوسط'}، اولویت با بخش‌هایی است که ارزش مسئله برای آن‌ها روشن و قابل تبدیل به درآمد پایدار باشد.`,
    ],

    targetMarket: `بازار هدف اصلی ${name} شامل ${target} است. این گروه با مسئله «${problem}» روبه‌روست و در حال حاضر از ${sanitize(valueOrFallback(input.currentAlternative, 'روش‌های جایگزین موجود'))} استفاده می‌کند. بازار هدف ثانویه می‌تواند شامل تیم‌ها یا سازمان‌هایی باشد که به همان خروجی نیاز دارند اما چرخه خرید طولانی‌تر یا بودجه متفاوتی دارند.`,

    positioningStatement: `برای ${target} که با ${problem} روبه‌رو هستند، ${name} یک راهکار حرفه‌ای و ساختاریافته است که از طریق ${differentiation}، تصمیم‌گیری بازاریابی و رشد را قابل فهم‌تر، قابل سنجش‌تر و اجرایی‌تر می‌کند؛ در مقایسه با ${competitors}، تمرکز آن بر سرعت، وضوح و خروجی عملیاتی است.`,

    customerPersonas: [
      `پرسونای ۱: تصمیم‌گیرنده تحلیلی\n• هدف: کاهش ابهام و انتخاب کانال‌های مؤثرتر\n• درد اصلی: اتلاف زمان، داده پراکنده و نبود ساختار تصمیم‌گیری\n• پیام مناسب: برنامه‌ای روشن، قابل اجرا و قابل سنجش برای رشد بازار`,
      `پرسونای ۲: مدیر رشد یا بازاریابی\n• هدف: تبدیل ورودی‌های کسب‌وکار به برنامه عملیاتی و KPI\n• درد اصلی: دشواری اولویت‌بندی کانال‌ها و سنجش نتیجه\n• پیام مناسب: چارچوبی منظم برای قیف جذب، ارزش پیشنهادی و برنامه اقدام`,
      `پرسونای ۳: بنیان‌گذار یا مالک کسب‌وکار\n• هدف: ساخت برنامه بازاریابی قابل ارائه و قابل اجرا\n• درد اصلی: شروع از صفحه خالی و نداشتن مسیر منسجم\n• پیام مناسب: تبدیل سریع ایده و داده‌های اولیه به نقشه رشد حرفه‌ای`,
    ],

    valueProposition: `${name} به ${target} کمک می‌کند داده‌های پراکنده کسب‌وکار را به یک برنامه بازاریابی منظم، قابل بررسی و قابل اجرا تبدیل کنند. ارزش اصلی در ترکیب ساختار تحلیلی، پیشنهاد کانال‌ها، KPIهای قابل پیگیری و برنامه اقدام مرحله‌ای است؛ بنابراین تیم می‌تواند تصمیم‌های بازاریابی را با وضوح و اعتماد بیشتری اجرا کند.`,

    usp: `${name} به ${target} کمک می‌کند با تکیه بر ${differentiation}، سریع‌تر به یک برنامه بازاریابی قابل سنجش برسند؛ بدون اینکه زمان زیادی صرف ساخت چارچوب از صفر یا هماهنگ‌کردن خروجی‌های پراکنده شود.`,

    competitorAnalysis: [
      `رقبای مستقیم و جایگزین‌ها: ${competitors}. این گزینه‌ها ممکن است شناخته‌شده باشند، اما معمولاً خروجی بازاریابی را به شکل یک مسیر واحد و قابل اجرا جمع‌بندی نمی‌کنند.`,
      `جایگزین دستی: استفاده از فایل‌ها، قالب‌های عمومی یا تحلیل پراکنده می‌تواند ارزان باشد، اما ریسک ناهماهنگی، اتلاف زمان و نبود KPIهای قابل پیگیری را افزایش می‌دهد.`,
      `مزیت رقابتی پیشنهادی: ${differentiation}. پیام بازار باید نشان دهد چرا این تمایز برای مشتری هدف ارزش اقتصادی یا عملیاتی ایجاد می‌کند.`,
    ],

    marketingMix7p: {
      'محصول (Product)': `پیشنهاد اصلی ${name}: ${product}. محصول باید با پیام روشن، تجربه کاربری مطمئن و خروجی قابل اتکا معرفی شود.`,
      'قیمت (Price)': `قیمت فعلی یا پیشنهادی: ${price}. مدل قیمت‌گذاری: ${pricingLabels[input.pricingModel]}. ${input.discountOptions ? `گزینه‌های تشویقی: ${sanitize(input.discountOptions)}.` : 'پیشنهاد می‌شود تخفیف‌ها فقط برای کاهش ریسک خرید اولیه و با کنترل حاشیه سود استفاده شوند.'}`,
      'توزیع (Place)': `${input.businessType === 'saas-digital' ? 'توزیع اصلی دیجیتال است و باید مسیر ورود، فعال‌سازی و استفاده تا حد امکان ساده باشد.' : 'توزیع باید با رفتار خرید مشتری و سطح اعتماد مورد نیاز هماهنگ شود.'} محدوده بازار: ${sanitize(valueOrFallback(input.geographicScope, 'بازارهای قابل دسترس اولیه'))}.`,
      'ترویج (Promotion)': `هدف اصلی بازاریابی: ${goalLabels[input.marketingGoal]}. کانال‌های پیشنهادی: ${channels(input)}. بودجه: ${budget}. پیام‌ها باید روی مسئله مشتری، تمایز و اثبات ارزش تمرکز کنند.`,
      'افراد (People)': `تیم و نقش‌های اجرایی: ${team}. تعامل با مشتری باید حرفه‌ای، پاسخ‌گو و مبتنی بر درک مسئله باشد.`,
      'فرآیند (Process)': `فرآیند پیشنهادی: جذب توجه، ایجاد علاقه، ارائه شواهد، تبدیل، فعال‌سازی و پیگیری. ${input.freeTrial ? 'وجود نسخه آزمایشی یا Demo می‌تواند ریسک ادراک‌شده خرید را کاهش دهد.' : 'در صورت امکان، ارائه Demo یا تجربه اولیه می‌تواند نرخ تبدیل را بهتر کند.'}`,
      'شواهد فیزیکی / دیجیتال (Physical Evidence)': `وب‌سایت، نمونه خروجی، مستندات، مطالعه موردی، پیام‌های ایمیلی و نقاط تماس دیجیتال باید یک تصویر منسجم و قابل اعتماد از برند بسازند.`,
    },

    funnelJourney: [
      `آگاهی: مشتریان بالقوه از طریق ${channels(input)} با ${name} آشنا می‌شوند. پیام این مرحله باید مسئله اصلی و نتیجه قابل دستیابی را روشن کند.`,
      `علاقه: مخاطب با محتوای تخصصی، نمونه خروجی، مقایسه راه‌حل‌ها یا Demo درگیر می‌شود. تمرکز این مرحله بر ایجاد اعتماد و توضیح ارزش است.`,
      `تمایل: مشتری ${name} را با ${competitors} مقایسه می‌کند. نمایش تمایز، شواهد کاربردی و مزیت اقتصادی برای عبور از این مرحله حیاتی است.`,
      `اقدام: تبدیل می‌تواند شامل ثبت درخواست، رزرو Demo، شروع Trial، خرید یا فعال‌سازی باشد. قیمت‌گذاری فعلی: ${price}.`,
      `وفاداری: پس از تبدیل، تجربه onboarding، پشتیبانی، آموزش و ارتباط منظم تعیین می‌کند که مشتری باقی بماند یا ریزش کند.`,
      `توصیه: مشتریان راضی می‌توانند از طریق معرفی، مطالعه موردی، نظر عمومی یا اشتراک تجربه به کانال رشد بعدی تبدیل شوند.`,
    ],

    channelStrategy: [
      `اولویت کانال‌ها: ${channels(input)}.`,
      `بودجه و اجرا: ${budget}. پیشنهاد می‌شود بودجه در ابتدا به آزمون‌های کوچک، قابل اندازه‌گیری و قابل مقایسه اختصاص یابد.`,
      `پیام محوری: مسئله مشتری، نتیجه قابل لمس و تمایز ${name} باید در همه کانال‌ها یکپارچه باشد.`,
      `بهینه‌سازی: هر کانال باید با KPI مشخص، بازه ارزیابی کوتاه و معیار توقف یا افزایش بودجه مدیریت شود.`,
    ],

    pricingRecommendation: `با توجه به مدل ${pricingLabels[input.pricingModel]} و توان پرداخت ${input.abilityToPay === 'high' ? 'بالای' : input.abilityToPay === 'low' ? 'پایینِ' : 'متوسطِ'} مشتری، قیمت‌گذاری باید ارزش حل مسئله را منعکس کند و در عین حال مانع ورود اولیه را کنترل کند. قیمت فعلی: ${price}. پیشنهاد می‌شود بسته‌ها یا پلن‌ها بر اساس سطح استفاده، نیاز تیمی و ارزش خروجی تفکیک شوند.`,

    kpiDashboard: localizeKpis(base.kpiDashboard, input),

    actionPlan: [
      `هفته ۱: بازبینی پیام ارزش و تعریف دقیق بازار هدف؛ انتخاب ۲ تا ۳ کانال اولویت‌دار؛ آماده‌سازی صفحه فرود یا محتوای اصلی`,
      `هفته ۲: اجرای کمپین کوچک برای اعتبارسنجی پیام؛ جمع‌آوری بازخورد مشتریان هدف؛ بررسی نرخ تعامل و نرخ تبدیل اولیه`,
      `هفته ۳: بهینه‌سازی پیام و کانال‌ها بر اساس داده هفته دوم؛ آماده‌سازی پیشنهاد فروش، Demo یا مسیر جذب Lead`,
      `هفته ۴: جمع‌بندی داده‌ها؛ تنظیم KPIهای ماه بعد؛ تصمیم‌گیری درباره افزایش بودجه، توقف کانال‌های ضعیف و تقویت مسیرهای اثبات‌شده`,
    ],

    risksAssumptions: [
      `فرض کلیدی: مشتری هدف واقعاً مسئله «${problem}» را با شدت کافی تجربه می‌کند و حاضر است برای راه‌حل بهتر زمان یا بودجه اختصاص دهد.`,
      `ریسک رقابتی: ${competitors} ممکن است از نظر شناخت بازار یا اعتماد اولیه جلوتر باشند؛ بنابراین اثبات ارزش و تمایز باید سریع و شفاف باشد.`,
      `ریسک اجرایی: ${team}. اگر ظرفیت تیم محدود باشد، باید تعداد کانال‌ها و فعالیت‌ها کنترل شود تا کیفیت اجرا افت نکند.`,
      input.marketConstraints ? `محدودیت بازار: ${sanitize(input.marketConstraints)}.` : 'محدودیت بازار باید با مصاحبه مشتری، بررسی رقبا و تحلیل کانال‌ها دقیق‌تر شود.',
      `ریسک سنجش: KPIها در ابتدا برآوردی هستند و باید با داده واقعی کمپین، کیفیت Lead و رفتار مشتری بازتنظیم شوند.`,
    ],

    qualityScore: {
      ...base.qualityScore,
      details: qualityDetails(input, score, maxScore),
    },
  }
}

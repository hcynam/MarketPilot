import { sampleBusiness } from '../data/sample'
import type { BusinessInput } from '../types'

export interface QAFixture {
  id: string
  expectedFlow: 'direct-plan' | 'questions'
  input: BusinessInput
}

export const hybridQAFixtures: QAFixture[] = [
  { id: 'complete-marketpilot-saas', expectedFlow: 'direct-plan', input: sampleBusiness },
  {
    id: 'incomplete-local-cafe', expectedFlow: 'questions',
    input: {
      ...sampleBusiness,
      businessName: 'کافه محلی', productDescription: 'کافه کوچک محلی', targetCustomerGuess: '',
      mainCustomerProblem: '', currentAlternative: '', competitors: '', keyDifferentiation: '',
      currentPrice: '', monthlyBudget: '', teamCapacity: 'دو نفر', availableChannels: ['social-media'],
      businessType: 'physical-product-store', marketModel: 'B2C', marketingGoal: 'retention',
    },
  },
  {
    id: 'complete-online-english-course', expectedFlow: 'direct-plan',
    input: {
      ...sampleBusiness,
      businessName: 'آکادمی آنلاین زبان', businessType: 'service-consulting-education', marketModel: 'B2C',
      productDescription: 'دوره آنلاین زبان انگلیسی برای متخصصان شاغل با کلاس زنده، تمرین هفتگی و بازخورد مدرس.',
      targetCustomerGuess: 'متخصصان شاغل ۲۵ تا ۴۰ سال که برای مهاجرت یا پیشرفت شغلی به مکالمه نیاز دارند.',
      mainCustomerProblem: 'زمان محدود، نبود برنامه منظم و اضطراب مکالمه باعث توقف پیشرفت زبان‌آموز می‌شود.',
      currentAlternative: 'اپلیکیشن‌های خودآموز، کلاس عمومی و ویدئوهای رایگان', competitors: 'کلاس‌های آنلاین عمومی و اپ‌های زبان',
      keyDifferentiation: 'برنامه مکالمه شغلی شخصی‌سازی‌شده با بازخورد هفتگی مدرس و گروه کوچک',
      currentPrice: 'ماهانه ۲٬۵۰۰٬۰۰۰ تومان', monthlyBudget: 'ماهانه ۲۰ میلیون تومان', teamCapacity: 'یک مدرس و یک مدیر محتوا',
      availableChannels: ['website', 'content-marketing', 'social-media'], marketingGoal: 'leads',
    },
  },
  {
    id: 'small-budget-consulting', expectedFlow: 'direct-plan',
    input: {
      ...sampleBusiness,
      businessName: 'مشاوره رشد ناب', businessType: 'service-consulting-education',
      productDescription: 'خدمت مشاوره چهار هفته‌ای برای طراحی قیف فروش و نظم‌دادن به جذب سرنخ کسب‌وکارهای خدماتی کوچک.',
      targetCustomerGuess: 'مالک یا مدیر کسب‌وکار خدماتی کوچک با فروش نامنظم و تیم کمتر از ده نفر',
      mainCustomerProblem: 'سرنخ‌ها پیگیری منظم ندارند و مالک نمی‌داند کدام کانال فروش واقعاً بازده دارد.',
      currentAlternative: 'ارجاع دوستان، تبلیغات پراکنده و فایل اکسل دستی', competitors: 'مشاوران مستقل و آژانس‌های دیجیتال',
      keyDifferentiation: 'پروژه کوتاه، داشبورد ساده و انتقال فرایند به تیم مشتری',
      currentPrice: 'پروژه‌ای ۳۰ میلیون تومان', monthlyBudget: 'ماهانه ۵ میلیون تومان', teamCapacity: 'یک مشاور پاره‌وقت',
      availableChannels: ['referral', 'content-marketing'], marketingGoal: 'leads',
    },
  },
  {
    id: 'very-vague-input', expectedFlow: 'questions',
    input: {
      ...sampleBusiness,
      businessName: 'ایده جدید', productDescription: 'یک محصول خوب', targetCustomerGuess: '', mainCustomerProblem: '',
      currentAlternative: '', competitors: '', keyDifferentiation: '', currentPrice: '', monthlyBudget: '',
      teamCapacity: '', availableChannels: [], geographicScope: '',
    },
  },
]

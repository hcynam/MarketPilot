import { sampleBusiness } from '../src/data/sample'
import type { BusinessInput } from '../src/types'

export function makeBusiness(overrides: Partial<BusinessInput> = {}): BusinessInput {
  return {
    ...sampleBusiness,
    availableChannels: [...sampleBusiness.availableChannels],
    ...overrides,
    ...(overrides.availableChannels ? { availableChannels: [...overrides.availableChannels] } : {}),
  }
}

export const b2bSaas = makeBusiness({
  businessName: 'LeadFlow',
  businessType: 'saas-digital',
  marketModel: 'B2B',
  currentStage: 'early-sales',
  targetCustomerGuess: 'مدیر فروش و مدیرعامل شرکت‌های خدماتی کوچک که تصمیم‌گیرنده خرید نرم‌افزار هستند',
  mainCustomerProblem: 'سرنخ‌ها بدون پیگیری منظم از دست می‌روند و چرخه فروش قابل مشاهده نیست',
  keyDifferentiation: 'راه‌اندازی یک‌روزه با گزارش شفاف نرخ تبدیل و نمونه موفق مشتری',
  monthlyBudget: '$1200/month',
  teamCapacity: 'یک بازاریاب و یک فروشنده',
  marketingGoal: 'leads',
})

export const localCafe = makeBusiness({
  businessName: 'کافه محله',
  businessType: 'physical-product-store',
  marketModel: 'B2C',
  currentStage: 'growth',
  productDescription: 'کافه محلی با صبحانه و قهوه تخصصی برای ساکنان و کارکنان محله',
  geographicScope: 'شعاع سه کیلومتری مرکز شهر شیراز',
  targetCustomerGuess: 'ساکنان و کارکنان ۲۰ تا ۴۰ ساله همان محله',
  mainCustomerProblem: 'نیاز به فضای قابل اعتماد و سریع برای صبحانه و قرار کوتاه',
  availableChannels: ['website', 'social-media', 'referral', 'offline'],
  monthlyBudget: '۳۰ میلیون تومان در ماه',
  teamCapacity: 'مالک و یک نیروی پاره‌وقت',
  marketingGoal: 'retention',
  marketConstraints: 'ظرفیت محدود سالن، حاشیه سود حساس و محدوده ارسال سه کیلومتر',
})

export const consulting = makeBusiness({
  businessName: 'آکادمی فروش حرفه‌ای',
  businessType: 'service-consulting-education',
  marketModel: 'B2B',
  productDescription: 'دوره و مشاوره بهبود فرایند فروش برای تیم‌های کوچک',
  targetCustomerGuess: 'بنیان‌گذار و مدیر فروش شرکت‌های ۱۰ تا ۵۰ نفره',
  keyDifferentiation: 'ده سال تجربه، نمونه‌کار مستند و جلسه تشخیص اولیه',
  availableChannels: ['website', 'content-marketing', 'email', 'referral'],
  marketingGoal: 'leads',
})

export const onlineRetail = makeBusiness({
  businessName: 'فروشگاه سبز',
  businessType: 'physical-product-store',
  marketModel: 'B2C',
  productDescription: 'فروشگاه آنلاین محصولات مراقبت پوست با ارسال سراسری',
  targetCustomerGuess: 'خریداران آنلاین ۲۵ تا ۴۵ ساله علاقه‌مند به مراقبت پوست',
  currentPrice: 'میانگین سبد ۱.۵ میلیون تومان',
  availableChannels: ['website', 'seo', 'social-media', 'email'],
  marketConstraints: 'حاشیه سود ۳۰ درصد، موجودی محدود و امکان مرجوعی هفت روزه',
  marketingGoal: 'sales',
})

export const veryIncomplete = makeBusiness({
  businessName: 'کسب‌وکار جدید',
  productDescription: '',
  targetCustomerGuess: '',
  mainCustomerProblem: '',
  currentAlternative: '',
  keyDifferentiation: '',
  geographicScope: '',
  competitors: '',
  availableChannels: [],
  monthlyBudget: '',
  teamCapacity: '',
  currentPrice: '',
  discountOptions: '',
})

import type { BusinessInput, AvailableChannel } from '../types'
import type { UseBusinessFormReturn } from './BusinessIntakeFormTypes'
import './BusinessIntakeForm.css'

interface Props {
  form: UseBusinessFormReturn
  onGenerate: () => void | Promise<void>
  onClear?: () => void
  isGenerating?: boolean
}

const businessTypeOptions: { value: BusinessInput['businessType']; label: string }[] = [
  { value: 'saas-digital', label: 'SaaS / محصول دیجیتال' },
  { value: 'service-consulting-education', label: 'خدمت / مشاوره / آموزش' },
  { value: 'physical-product-store', label: 'محصول فیزیکی / فروشگاه' },
  { value: 'other', label: 'سایر' },
]

const marketModelOptions: { value: BusinessInput['marketModel']; label: string }[] = [
  { value: 'B2B', label: 'B2B' },
  { value: 'B2C', label: 'B2C' },
  { value: 'Both', label: 'هر دو: B2B و B2C' },
]

const stageOptions: { value: BusinessInput['currentStage']; label: string }[] = [
  { value: 'idea', label: 'ایده / مفهوم اولیه' },
  { value: 'mvp', label: 'MVP / نمونه اولیه' },
  { value: 'early-sales', label: 'فروش اولیه' },
  { value: 'growth', label: 'مرحله رشد' },
  { value: 'mature', label: 'کسب‌وکار بالغ' },
]

const urgencyOptions: { value: BusinessInput['urgencyLevel']; label: string }[] = [
  { value: 'critical', label: 'بحرانی — باید همین حالا حل شود' },
  { value: 'high', label: 'زیاد — درد مشتری جدی است' },
  { value: 'medium', label: 'متوسط — مهم اما فوری نیست' },
  { value: 'low', label: 'کم — بیشتر یک مزیت تکمیلی است' },
]

const abilityOptions: { value: BusinessInput['abilityToPay']; label: string }[] = [
  { value: 'high', label: 'زیاد — بودجه سازمانی' },
  { value: 'medium', label: 'متوسط — بودجه SME / SMB' },
  { value: 'low', label: 'کم — حساس به قیمت' },
]

const goalOptions: { value: BusinessInput['marketingGoal']; label: string }[] = [
  { value: 'awareness', label: 'آگاهی از برند' },
  { value: 'leads', label: 'جذب Lead' },
  { value: 'sales', label: 'فروش مستقیم' },
  { value: 'app-installs', label: 'نصب اپلیکیشن' },
  { value: 'retention', label: 'نگهداشت مشتری' },
  { value: 'referral', label: 'ارجاع / رشد ویروسی' },
]

const channelOptions: { value: AvailableChannel; label: string }[] = [
  { value: 'website', label: 'وب‌سایت / Landing Page' },
  { value: 'seo', label: 'SEO' },
  { value: 'content-marketing', label: 'بازاریابی محتوایی' },
  { value: 'social-media', label: 'شبکه‌های اجتماعی' },
  { value: 'email', label: 'ایمیل' },
  { value: 'mobile', label: 'موبایل / App' },
  { value: 'influencer', label: 'Influencer Marketing' },
  { value: 'referral', label: 'ارجاع / Word of Mouth' },
  { value: 'ppc', label: 'PPC / تبلیغات پولی' },
  { value: 'offline', label: 'آفلاین / رویدادها' },
  { value: 'other', label: 'سایر' },
]

const pricingModelOptions: { value: BusinessInput['pricingModel']; label: string }[] = [
  { value: 'freemium', label: 'Freemium' },
  { value: 'subscription', label: 'اشتراک ماهانه / سالانه' },
  { value: 'one-time', label: 'خرید یک‌باره' },
  { value: 'usage-based', label: 'مبتنی بر میزان استفاده' },
  { value: 'tiered', label: 'پلن‌های چندسطحی' },
  { value: 'custom', label: 'سفارشی / سازمانی' },
  { value: 'free', label: 'رایگان / تبلیغاتی یا حمایتی' },
]

const SECTIONS = [
  { key: 'basics', label: 'اطلاعات پایه کسب‌وکار', short: 'پایه' },
  { key: 'customer', label: 'مشتری و مسئله', short: 'مشتری' },
  { key: 'market', label: 'بازار و رقبا', short: 'بازار' },
  { key: 'channels', label: 'کانال‌ها و بودجه', short: 'کانال' },
  { key: 'pricing', label: 'قیمت‌گذاری و پیشنهاد', short: 'قیمت' },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

function BusinessIntakeForm({ form, onGenerate, onClear, isGenerating = false }: Props) {
  const { data, updateField, markTouched, loadSample, clearForm, validate, getFieldError } = form

  const handleClear = () => {
    if (isGenerating) return

    if (onClear) {
      onClear()
    } else {
      clearForm()
    }
  }

  const toggleChannel = (ch: AvailableChannel) => {
    const next = data.availableChannels.includes(ch)
      ? data.availableChannels.filter(c => c !== ch)
      : [...data.availableChannels, ch]
    updateField('availableChannels', next)
  }

  const handleGenerate = () => {
    if (isGenerating) return

    if (validate()) {
      onGenerate()
    }
  }

  const handleLoadSample = () => {
    if (isGenerating) return
    loadSample()
  }

  const isComplete = (section: SectionKey): boolean => {
    switch (section) {
      case 'basics':
        return !!data.businessName.trim() && !!data.productDescription.trim()
      case 'customer':
        return !!data.targetCustomerGuess.trim() && !!data.mainCustomerProblem.trim()
      case 'market':
        return !!data.competitors.trim() && !!data.keyDifferentiation.trim()
      case 'channels':
        return data.availableChannels.length > 0 && !!data.monthlyBudget.trim()
      case 'pricing':
        return !!data.currentPrice.trim()
    }
  }

  const completedCount = SECTIONS.filter(s => isComplete(s.key)).length

  return (
    <section className="intake">
      <div className="container">
        <div className="intake__header">
          <h2 className="intake__title">فرم دریافت اطلاعات کسب‌وکار</h2>
          <span className="intake__progress">
            {completedCount} از {SECTIONS.length} بخش تکمیل شده
          </span>
        </div>

        <div className="intake__bar">
          {SECTIONS.map(s => (
            <div
              key={s.key}
              className={`intake__bar-seg ${isComplete(s.key) ? 'intake__bar-seg--done' : ''}`}
              title={s.label}
            />
          ))}
        </div>

        <div className="intake__section">
          <h3 className="intake__section-title">۱. اطلاعات پایه کسب‌وکار</h3>
          <p className="intake__section-desc">کسب‌وکار، محصول یا خدمت مورد نظر را معرفی کنید.</p>
          <div className="intake__field">
            <label className="intake__label" htmlFor="businessName">نام کسب‌وکار / محصول *</label>
            <input
              id="businessName"
              className="intake__input"
              type="text"
              placeholder="مثال: MarketPilot AI"
              value={data.businessName}
              onChange={e => updateField('businessName', e.target.value)}
              onBlur={() => markTouched('businessName')}
            />
            {getFieldError('businessName') && <span className="intake__error">{getFieldError('businessName')}</span>}
          </div>
          <div className="intake__field">
            <label className="intake__label" htmlFor="productDescription">توضیح محصول / خدمت *</label>
            <textarea
              id="productDescription"
              className="intake__textarea"
              rows={3}
              placeholder="توضیح دهید محصول یا خدمت چه کاری انجام می‌دهد، برای چه کسی است و چه مزیتی دارد."
              value={data.productDescription}
              onChange={e => updateField('productDescription', e.target.value)}
              onBlur={() => markTouched('productDescription')}
            />
            {getFieldError('productDescription') && <span className="intake__error">{getFieldError('productDescription')}</span>}
          </div>
          <div className="intake__row">
            <div className="intake__field">
              <label className="intake__label">نوع کسب‌وکار</label>
              <select
                className="intake__select"
                value={data.businessType}
                onChange={e => updateField('businessType', e.target.value as BusinessInput['businessType'])}
              >
                {businessTypeOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="intake__field">
              <label className="intake__label">مدل بازار</label>
              <select
                className="intake__select"
                value={data.marketModel}
                onChange={e => updateField('marketModel', e.target.value as BusinessInput['marketModel'])}
              >
                {marketModelOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="intake__row">
            <div className="intake__field">
              <label className="intake__label">مرحله فعلی</label>
              <select
                className="intake__select"
                value={data.currentStage}
                onChange={e => updateField('currentStage', e.target.value as BusinessInput['currentStage'])}
              >
                {stageOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="intake__field">
              <label className="intake__label" htmlFor="geographicScope">محدوده جغرافیایی</label>
              <input
                id="geographicScope"
                className="intake__input"
                type="text"
                placeholder="مثال: ایران، خاورمیانه، بازار جهانی"
                value={data.geographicScope}
                onChange={e => updateField('geographicScope', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="intake__section">
          <h3 className="intake__section-title">۲. مشتری و مسئله</h3>
          <p className="intake__section-desc">مشتری هدف و مسئله‌ای را که حل می‌کنید مشخص کنید.</p>
          <div className="intake__field">
            <label className="intake__label" htmlFor="targetCustomerGuess">تصور اولیه از مشتری هدف *</label>
            <textarea
              id="targetCustomerGuess"
              className="intake__textarea"
              rows={2}
              placeholder="مشتری ایده‌آل چه کسی است؟ نقش، صنعت، رفتار یا نیاز او را توضیح دهید."
              value={data.targetCustomerGuess}
              onChange={e => updateField('targetCustomerGuess', e.target.value)}
              onBlur={() => markTouched('targetCustomerGuess')}
            />
            {getFieldError('targetCustomerGuess') && <span className="intake__error">{getFieldError('targetCustomerGuess')}</span>}
          </div>
          <div className="intake__field">
            <label className="intake__label" htmlFor="mainCustomerProblem">مسئله اصلی مشتری *</label>
            <textarea
              id="mainCustomerProblem"
              className="intake__textarea"
              rows={2}
              placeholder="محصول شما چه درد، نیاز یا مانعی را برای مشتری حل می‌کند؟"
              value={data.mainCustomerProblem}
              onChange={e => updateField('mainCustomerProblem', e.target.value)}
              onBlur={() => markTouched('mainCustomerProblem')}
            />
            {getFieldError('mainCustomerProblem') && <span className="intake__error">{getFieldError('mainCustomerProblem')}</span>}
          </div>
          <div className="intake__field">
            <label className="intake__label" htmlFor="currentAlternative">راه‌حل یا جایگزین فعلی</label>
            <input
              id="currentAlternative"
              className="intake__input"
              type="text"
              placeholder="مشتریان امروز از چه راهی استفاده می‌کنند؟ رقبا، کار دستی، فایل Excel و ..."
              value={data.currentAlternative}
              onChange={e => updateField('currentAlternative', e.target.value)}
            />
          </div>
          <div className="intake__row">
            <div className="intake__field">
              <label className="intake__label">فوریت مسئله</label>
              <select
                className="intake__select"
                value={data.urgencyLevel}
                onChange={e => updateField('urgencyLevel', e.target.value as BusinessInput['urgencyLevel'])}
              >
                {urgencyOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="intake__field">
              <label className="intake__label">توان پرداخت</label>
              <select
                className="intake__select"
                value={data.abilityToPay}
                onChange={e => updateField('abilityToPay', e.target.value as BusinessInput['abilityToPay'])}
              >
                {abilityOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="intake__section">
          <h3 className="intake__section-title">۳. بازار و رقبا</h3>
          <p className="intake__section-desc">چشم‌انداز رقابتی و تمایز اصلی را مشخص کنید.</p>
          <div className="intake__field">
            <label className="intake__label" htmlFor="competitors">رقبا یا جایگزین‌ها *</label>
            <textarea
              id="competitors"
              className="intake__textarea"
              rows={2}
              placeholder="رقبای مستقیم، جایگزین‌های غیرمستقیم و راه‌حل‌های مشابه را بنویسید."
              value={data.competitors}
              onChange={e => updateField('competitors', e.target.value)}
              onBlur={() => markTouched('competitors')}
            />
            {getFieldError('competitors') && <span className="intake__error">{getFieldError('competitors')}</span>}
          </div>
          <div className="intake__field">
            <label className="intake__label" htmlFor="keyDifferentiation">تمایز کلیدی *</label>
            <textarea
              id="keyDifferentiation"
              className="intake__textarea"
              rows={2}
              placeholder="راه‌حل شما نسبت به گزینه‌های موجود چه تفاوت یا مزیت مهمی دارد؟"
              value={data.keyDifferentiation}
              onChange={e => updateField('keyDifferentiation', e.target.value)}
              onBlur={() => markTouched('keyDifferentiation')}
            />
            {getFieldError('keyDifferentiation') && <span className="intake__error">{getFieldError('keyDifferentiation')}</span>}
          </div>
          <div className="intake__field">
            <label className="intake__label" htmlFor="marketConstraints">محدودیت‌های بازار</label>
            <input
              id="marketConstraints"
              className="intake__input"
              type="text"
              placeholder="محدودیت‌های قانونی، بودجه‌ای، پذیرش بازار، اعتماد مشتری و ..."
              value={data.marketConstraints}
              onChange={e => updateField('marketConstraints', e.target.value)}
            />
          </div>
        </div>

        <div className="intake__section">
          <h3 className="intake__section-title">۴. کانال‌ها و بودجه</h3>
          <p className="intake__section-desc">مشخص کنید چگونه به مشتریان می‌رسید.</p>
          <div className="intake__field">
            <label className="intake__label">کانال‌های بازاریابی قابل استفاده *</label>
            <div className="intake__channels">
              {channelOptions.map(ch => {
                const checked = data.availableChannels.includes(ch.value)
                return (
                  <label key={ch.value} className={`intake__chip ${checked ? 'intake__chip--on' : ''}`}>
                    <input
                      type="checkbox"
                      className="intake__chip-input"
                      checked={checked}
                      onChange={() => toggleChannel(ch.value)}
                    />
                    {ch.label}
                  </label>
                )
              })}
            </div>
          </div>
          <div className="intake__row">
            <div className="intake__field">
              <label className="intake__label" htmlFor="monthlyBudget">بودجه ماهانه بازاریابی</label>
              <input
                id="monthlyBudget"
                className="intake__input"
                type="text"
                placeholder="مثال: ۲٬۰۰۰ دلار در ماه"
                value={data.monthlyBudget}
                onChange={e => updateField('monthlyBudget', e.target.value)}
              />
            </div>
            <div className="intake__field">
              <label className="intake__label" htmlFor="teamCapacity">ظرفیت تیم</label>
              <input
                id="teamCapacity"
                className="intake__input"
                type="text"
                placeholder="مثال: ۲ بنیان‌گذار، ۱ بازاریاب"
                value={data.teamCapacity}
                onChange={e => updateField('teamCapacity', e.target.value)}
              />
            </div>
          </div>
          <div className="intake__field">
            <label className="intake__label">هدف اصلی بازاریابی</label>
            <select
              className="intake__select"
              value={data.marketingGoal}
              onChange={e => updateField('marketingGoal', e.target.value as BusinessInput['marketingGoal'])}
            >
              {goalOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="intake__section">
          <h3 className="intake__section-title">۵. قیمت‌گذاری و پیشنهاد</h3>
          <p className="intake__section-desc">استراتژی قیمت‌گذاری و پیشنهاد اولیه را تعریف کنید.</p>
          <div className="intake__field">
            <label className="intake__label" htmlFor="currentPrice">قیمت فعلی / برنامه‌ریزی‌شده *</label>
            <input
              id="currentPrice"
              className="intake__input"
              type="text"
              placeholder="مثال: ۲۹ دلار ماهانه، خرید یک‌باره، قیمت سفارشی سازمانی"
              value={data.currentPrice}
              onChange={e => updateField('currentPrice', e.target.value)}
              onBlur={() => markTouched('currentPrice')}
            />
            {getFieldError('currentPrice') && <span className="intake__error">{getFieldError('currentPrice')}</span>}
          </div>
          <div className="intake__row">
            <div className="intake__field">
              <label className="intake__label">مدل قیمت‌گذاری</label>
              <select
                className="intake__select"
                value={data.pricingModel}
                onChange={e => updateField('pricingModel', e.target.value as BusinessInput['pricingModel'])}
              >
                {pricingModelOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="intake__field intake__field--checkbox">
              <label className="intake__check-label">
                <input
                  type="checkbox"
                  className="intake__checkbox"
                  checked={data.freeTrial}
                  onChange={e => updateField('freeTrial', e.target.checked)}
                />
                <span>ارائه نسخه آزمایشی یا Demo</span>
              </label>
            </div>
          </div>
          <div className="intake__field">
            <label className="intake__label" htmlFor="discountOptions">تخفیف یا پیشنهاد تبلیغاتی</label>
            <input
              id="discountOptions"
              className="intake__input"
              type="text"
              placeholder="مثال: تخفیف سالانه، قیمت دانشجویی، پیشنهاد زمان عرضه"
              value={data.discountOptions}
              onChange={e => updateField('discountOptions', e.target.value)}
            />
          </div>
        </div>

        <div className="intake__actions">
          <button className="intake__btn intake__btn--secondary" type="button" onClick={handleLoadSample} disabled={isGenerating}>
            بارگذاری نمونه آزمایشی
          </button>
          <button className="intake__btn intake__btn--ghost" type="button" onClick={handleClear} disabled={isGenerating}>
            پاک کردن فرم
          </button>
          <button className="intake__btn intake__btn--primary" type="button" onClick={handleGenerate} disabled={isGenerating}>
            تولید برنامه بازاریابی
          </button>
        </div>
      </div>
    </section>
  )
}

export default BusinessIntakeForm

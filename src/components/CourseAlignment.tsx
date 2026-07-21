import './CourseAlignment.css'

const concepts = [
  { label: 'توسعه مشتری', section: 'بخش ۲: مرحله توسعه مشتری' },
  { label: 'بخش‌بندی و هدف‌گیری', section: 'بخش‌های ۳ و ۴: بخش‌های بازار و بازار هدف' },
  { label: 'جایگاه‌یابی', section: 'بخش ۵: بیانیه جایگاه‌یابی' },
  { label: 'ارزش پیشنهادی و USP', section: 'بخش‌های ۷ و ۸: ارزش پیشنهادی و USP' },
  { label: 'تحلیل رقبا', section: 'بخش ۹: تحلیل رقبا و جایگزین‌ها' },
  { label: 'آمیخته بازاریابی 7P', section: 'بخش ۱۰: Marketing Mix 7P' },
  { label: 'قیف و سفر مشتری', section: 'بخش ۱۱: Funnel & Customer Journey' },
  { label: 'کانال‌های دیجیتال', section: 'بخش ۱۲: استراتژی کانال دیجیتال' },
  { label: 'سنجه‌های بازاریابی و KPI', section: 'بخش ۱۴: داشبورد KPI' },
  { label: 'برنامه اقدام', section: 'بخش ۱۵: برنامه اقدام ۳۰ روزه' },
  { label: 'ارزیابی ریسک', section: 'بخش ۱۶: ریسک‌ها و فرضیات' },
]

function CourseAlignment() {
  return (
    <section className="alignment" data-mp-reveal>
      <div className="container">
        <h2 className="alignment__title">چارچوب تحلیلی برنامه</h2>
        <p className="alignment__desc">
          خروجی نهایی از چند لایه تحلیلی تشکیل می‌شود تا از شناخت مشتری تا KPI و اقدام اجرایی مسیر منسجمی بسازد.
        </p>
        <div className="alignment__grid">
          {concepts.map((c) => (
            <div key={c.label} className="alignment__card">
              <span className="alignment__concept">{c.label}</span>
              <span className="alignment__section">{formatSectionLabel(c.section)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function formatSectionLabel(label: string): string {
  return label.replace(/^بخش(?:‌های)?\s+[^:]+:\s*/, '')
}

export default CourseAlignment

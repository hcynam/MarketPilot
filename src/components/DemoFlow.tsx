import './DemoFlow.css'

const steps = [
  { num: 1, label: 'اطلاعات کسب‌وکار را وارد کنید', desc: 'محصول، بازار، مشتری و ظرفیت اجرایی را در یک فرم منظم ثبت کنید' },
  { num: 2, label: 'مشتری و مسئله را دقیق کنید', desc: 'درد اصلی، جایگزین‌های فعلی و تمایز رقابتی را شفاف کنید' },
  { num: 3, label: 'برنامه بازاریابی را تولید کنید', desc: 'یک گزارش ساختاریافته با بخش‌بندی، جایگاه‌یابی، کانال و KPI دریافت کنید' },
  { num: 4, label: 'خروجی را بررسی و اصلاح کنید', desc: 'بخش‌های گزارش را مرور کنید و در صورت نیاز ورودی‌ها را بهبود دهید' },
  { num: 5, label: 'KPIها را تنظیم کنید', desc: 'هدف‌ها و معیارهای مقایسه را با واقعیت کمپین و تیم خود هماهنگ کنید' },
  { num: 6, label: 'فایل نهایی را دریافت کنید', desc: 'گزارش را به Markdown، Word یا PDF مستقیم خروجی بگیرید' },
]

function DemoFlow() {
  return (
    <section className="demoflow" data-mp-reveal>
      <div className="container">
        <h2 className="demoflow__title">راهنمای شروع سریع</h2>
        <p className="demoflow__desc">برای ارزیابی سریع، می‌توانید از نمونه آزمایشی MarketPilot AI استفاده کنید؛ مسیر اصلی، ورود داده‌های واقعی کسب‌وکار شماست.</p>
        <div className="demoflow__list">
          {steps.map((step, i) => (
            <div key={step.num} className="demoflow__step">
              <span className="demoflow__num">{String(step.num).padStart(2, '0')}</span>
              <div className="demoflow__content">
                <strong className="demoflow__label">{step.label}</strong>
                <span className="demoflow__detail">{step.desc}</span>
              </div>
              {i < steps.length - 1 && <span className="demoflow__connector" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DemoFlow

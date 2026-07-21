import './HeroSection.css'
import DecisionThread from './DecisionThread'

const decisionSteps = [
  { label: 'ورودی' },
  { label: 'تحلیل' },
  { label: 'برنامه' },
  { label: 'سنجش' },
]

function HeroSection() {
  return (
    <header className="hero">
      <div className="container hero__inner">
        <div className="hero__copy">
          <div className="hero__badge">دستیار هوشمند رشد و بازاریابی</div>
          <h1 className="hero__title">MarketPilot AI</h1>
          <p className="hero__subtitle">
            تبدیل داده‌های کسب‌وکار به برنامه بازاریابی حرفه‌ای
          </p>
          <p className="hero__desc">
            MarketPilot AI ورودی‌های محصول، مشتری، رقبا و کانال‌ها را به یک نقشه بازاریابی
            منظم، قابل سنجش و آماده اجرا تبدیل می‌کند.
          </p>
          <p className="hero__desc hero__desc--fa" lang="fa">
            مناسب برای تیم‌هایی که می‌خواهند سریع‌تر از ایده و داده خام به تصمیم، اولویت و برنامه اقدام برسند.
          </p>
        </div>
        <div className="hero__map">
          <DecisionThread
            className="hero__thread"
            steps={decisionSteps}
            ariaLabel="مسیر تصمیم‌گیری از ورودی تا سنجش"
            compact
          />
        </div>
      </div>
    </header>
  )
}

export default HeroSection

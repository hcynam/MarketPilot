import { useState, useCallback } from 'react'
import type { MarketingPlan } from '../types'
import { exportMarketingPlanToMarkdown, exportMarketingPlanToWordHtml } from '../lib/markdownExport'
import { createMarketingPlanPdf, marketingPlanPdfFileName } from '../lib/pdfExport'
import KpiDashboard from './KpiDashboard'
import './MarketingPlanPreview.css'

interface Props {
  plan: MarketingPlan
  stale?: boolean
  businessName: string
}

function makeDownloadName(businessName: string, extension: string): string {
  const base = (businessName || 'MarketPilot-Marketing-Plan')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim() || 'MarketPilot-Marketing-Plan'

  return `${base}-marketing-plan.${extension}`
}

function MarketingPlanPreview({ plan, stale, businessName }: Props) {
  const { score, maxScore, details } = plan.qualityScore
  const [copied, setCopied] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const handleCopyMarkdown = useCallback(() => {
    const md = exportMarketingPlanToMarkdown(plan, businessName)
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [plan, businessName])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownloadWord = useCallback(() => {
    const html = exportMarketingPlanToWordHtml(plan, businessName)
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = makeDownloadName(businessName, 'doc')
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [plan, businessName])

  const handleDownloadPdf = useCallback(() => {
    setPdfBusy(true)
    window.setTimeout(() => {
      try {
        const blob = createMarketingPlanPdf(plan, businessName)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = marketingPlanPdfFileName(businessName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } finally {
        setPdfBusy(false)
      }
    }, 20)
  }, [plan, businessName])

  const copyLabel = copied ? 'Markdown کپی شد' : 'کپی Markdown'
  const pdfLabel = pdfBusy ? 'در حال آماده‌سازی PDF' : 'دانلود PDF'

  return (
    <section className="preview">
      <div className="container">
        <div className="preview__card">
          {stale && (
            <div className="preview__stale-banner">
              اطلاعات فرم بعد از تولید این برنامه تغییر کرده است. محتوای زیر ممکن است با ورودی‌های فعلی هماهنگ نباشد؛
              برای نسخه تازه، دوباره روی «تولید برنامه بازاریابی» کلیک کنید.
            </div>
          )}

          <div className="preview__header">
            <div>
              <span className="preview__badge">برنامه بازاریابی تولید شد</span>
              <h2 className="preview__title">{businessName || 'برنامه بازاریابی'}</h2>
            </div>
            <div className="preview__header-actions">
              <div className="preview__score-pill">
                <span className="preview__score-num">{score}/{maxScore}</span>
                <span className="preview__score-label">کیفیت</span>
              </div>
              <div className="preview__export-actions" aria-label="خروجی‌های گزارش">
                <button className="preview__copy-btn preview__action-btn" type="button" onClick={handleCopyMarkdown}>
                  {copyLabel}
                </button>
                <button className="preview__action-btn" type="button" onClick={handleDownloadWord}>
                  دانلود Word
                </button>
                <button className="preview__action-btn" type="button" onClick={handlePrint}>
                  چاپ گزارش
                </button>
                <button className="preview__action-btn" type="button" onClick={handleDownloadPdf} disabled={pdfBusy}>
                  {pdfLabel}
                </button>
              </div>
            </div>
          </div>

          <CollapsibleSection title="۱. خلاصه کسب‌وکار">
            <p className="preview__text">{plan.businessSummary}</p>
          </CollapsibleSection>

          <CollapsibleSection title="۲. مرحله توسعه مشتری">
            <p className="preview__text">{plan.customerDevelopmentStage}</p>
          </CollapsibleSection>

          <CollapsibleSection title="۳. بخش‌های بازار">
            <div className="preview__grid preview__grid--segments">
              {plan.marketSegments.map((s, i) => (
                <div key={i} className="preview__segment-item">
                  <span className="preview__segment-dim">
                    {s.split(':')[0]}:
                  </span>
                  <span className="preview__segment-text">
                    {s.split(':').slice(1).join(':')}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۴. بازار هدف">
            <p className="preview__text">{plan.targetMarket}</p>
          </CollapsibleSection>

          <CollapsibleSection title="۵. بیانیه جایگاه‌یابی">
            <p className="preview__text">{plan.positioningStatement}</p>
          </CollapsibleSection>

          <CollapsibleSection title="۶. پرسونای مشتریان">
            <div className="preview__persona-grid">
              {plan.customerPersonas.map((p, i) => (
                <div key={i} className="preview__persona-card">
                  <PersonaContent text={p} />
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۷. ارزش پیشنهادی">
            <p className="preview__text">{plan.valueProposition}</p>
          </CollapsibleSection>

          <CollapsibleSection title="۸. پیشنهاد فروش منحصربه‌فرد (USP)">
            <div className="preview__usp-card">
              <p className="preview__text">{plan.usp}</p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۹. تحلیل رقبا و جایگزین‌ها">
            <div className="preview__list">
              {plan.competitorAnalysis.map((c, i) => (
                <div key={i} className="preview__list-item">{c}</div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۱۰. آمیخته بازاریابی 7P">
            <div className="preview__mix-table">
              <div className="preview__mix-header">
                <span className="preview__mix-col-p">عنصر</span>
                <span className="preview__mix-col-d">توضیح</span>
              </div>
              {Object.entries(plan.marketingMix7p).map(([key, value]) => (
                <div key={key} className="preview__mix-row">
                  <span className="preview__mix-key">{key}</span>
                  <span className="preview__mix-value">{value}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۱۱. قیف و سفر مشتری">
            <div className="preview__funnel-table">
              <div className="preview__funnel-header">
                <span className="preview__funnel-col-stage">مرحله</span>
                <span className="preview__funnel-col-desc">توضیح</span>
              </div>
              {plan.funnelJourney.map((f, i) => {
                const stage = f.split(':')[0]
                const desc = f.split(':').slice(1).join(':')
                return (
                  <div key={i} className="preview__funnel-row">
                    <span className="preview__funnel-stage">{stage}</span>
                    <span className="preview__funnel-desc">{desc}</span>
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۱۲. استراتژی کانال دیجیتال">
            <div className="preview__list">
              {plan.channelStrategy.map((c, i) => {
                const isPriority = c.startsWith('Priority Channels') || c.startsWith('Channel-Funnel')
                return (
                  <div key={i} className={`preview__list-item ${isPriority ? 'preview__list-item--highlight' : ''}`}>{c}</div>
                )
              })}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۱۳. پیشنهاد اولیه قیمت‌گذاری">
            <p className="preview__text">{plan.pricingRecommendation}</p>
          </CollapsibleSection>

          <CollapsibleSection title="۱۴. داشبورد KPI">
            <KpiDashboard kpis={plan.kpiDashboard} />
          </CollapsibleSection>

          <CollapsibleSection title="۱۵. برنامه اقدام ۳۰ روزه">
            <div className="preview__weeks">
              {plan.actionPlan.map((week, i) => (
                <div key={i} className="preview__week-card">
                  <WeekContent text={week} />
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۱۶. ریسک‌ها و فرضیات">
            <div className="preview__list preview__list--bullets">
              {plan.risksAssumptions.map((r, i) => (
                <div key={i} className="preview__list-item">{r}</div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="۱۷. امتیاز کیفیت برنامه بازاریابی">
            <QualityContent score={score} maxScore={maxScore} details={details} />
          </CollapsibleSection>
        </div>
      </div>
    </section>
  )
}

function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`preview__section ${open ? 'preview__section--open' : ''}`}>
      <button
        className="preview__section-toggle"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="preview__section-title">{title}</span>
        <span className="preview__section-arrow">{open ? '−' : '+'}</span>
      </button>
      <div className="preview__section-body">
        {children}
      </div>
    </div>
  )
}

function PersonaContent({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean)
  if (lines.length === 0) return <p className="preview__text">{text}</p>

  const title = lines[0]
  const bullets = lines.slice(1).filter(l => l.startsWith('•'))

  return (
    <>
      <div className="preview__persona-title">{title}</div>
      <ul className="preview__persona-list">
        {bullets.map((b, i) => (
          <li key={i} className="preview__persona-bullet">
            {b.replace('• ', '')}
          </li>
        ))}
      </ul>
    </>
  )
}

function WeekContent({ text }: { text: string }) {
  const colonIdx = text.indexOf(':')
  if (colonIdx === -1) return <p className="preview__text">{text}</p>

  const header = text.slice(0, colonIdx)
  const body = text.slice(colonIdx + 1).trim()
  const items = body.split(';').map(s => s.trim()).filter(Boolean)

  return (
    <>
      <div className="preview__week-header">{header}</div>
      <ul className="preview__week-list">
        {items.map((item, i) => (
          <li key={i} className="preview__week-item">{item}</li>
        ))}
      </ul>
    </>
  )
}

function QualityContent({ score, maxScore, details }: {
  score: number
  maxScore: number
  details: string[]
}) {
  const pct = Math.round((score / maxScore) * 100)

  return (
    <div className="preview__quality">
      <div className="preview__quality-summary">
        <span className="preview__quality-big">{score}/{maxScore}</span>
        <span className="preview__quality-pct">{pct}%</span>
      </div>
      <div className="preview__quality-bar">
        <div className="preview__quality-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="preview__quality-checklist">
        {details.map((d, i) => {
          const passed = d.startsWith('✓') || d.startsWith('✔')
          return (
            <div key={i} className={`preview__quality-check ${passed ? 'preview__quality-check--pass' : 'preview__quality-check--fail'}`}>
              <span className="preview__quality-icon">{passed ? '✓' : '○'}</span>
              <span>{d.replace(/^[✓✔○]\s*/, '')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MarketingPlanPreview

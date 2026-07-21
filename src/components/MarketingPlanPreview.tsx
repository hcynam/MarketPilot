import { useState, useCallback, useMemo } from 'react'
import type { BusinessInput, MarketingPlan } from '../types'
import { exportMarketingPlanToMarkdown } from '../lib/markdownExport'
import KpiDashboard from './KpiDashboard'
import { reportChapters } from '../lib/reportPresentation'
import { ActionTimeline, ChapterHeader, ExecutiveSnapshot, ReportDecisionPath, StructuredRows } from './report/ReportVisuals'
import { createGuestPlanSnapshot } from '../plans/guestPlan'
import { usePlanAccess } from '../plans/PlanAccessContext'
import './MarketingPlanPreview.css'

interface Props {
  plan: MarketingPlan
  stale?: boolean
  businessName: string
  inputData: BusinessInput
  source?: 'current' | 'saved'
  savedPlanId?: string
}

function MarketingPlanPreview({ plan, stale, businessName, inputData, source = 'current', savedPlanId }: Props) {
  const { score, maxScore, details } = plan.qualityScore
  const [copied, setCopied] = useState(false)
  const { requestAction, busyAction } = usePlanAccess()
  const snapshot = useMemo(() => ({
    ...createGuestPlanSnapshot({ businessName, inputData, outputData: plan }),
    ...(savedPlanId ? { guestId: savedPlanId, savedPlanId, origin: 'authenticated' as const } : {}),
  }), [businessName, inputData, plan, savedPlanId])

  const handleCopyMarkdown = useCallback(() => {
    const md = exportMarketingPlanToMarkdown(plan, businessName)
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [plan, businessName])

  const handlePrint = useCallback(() => { void requestAction('print', snapshot) }, [requestAction, snapshot])
  const handleDownloadWord = useCallback(() => { void requestAction('word', snapshot) }, [requestAction, snapshot])
  const handleDownloadPdf = useCallback(() => { void requestAction('pdf', snapshot) }, [requestAction, snapshot])
  const handleSave = useCallback(() => { void requestAction('save', snapshot) }, [requestAction, snapshot])

  const copyLabel = copied ? 'Markdown کپی شد' : 'کپی Markdown'
  const wordLabel = busyAction === 'word' ? 'در حال آماده‌سازی Word' : 'دانلود Word'

  return (
    <section className="preview" data-mp-report-root>
      <div className="container">
        <div className="preview__card mp-document">
          {stale && (
            <div className="preview__stale-banner status-strip status-strip--warning">
              اطلاعات فرم بعد از تولید این برنامه تغییر کرده است. محتوای زیر ممکن است با ورودی‌های فعلی هماهنگ نباشد؛
              برای نسخه تازه، دوباره روی «تولید برنامه بازاریابی» کلیک کنید.
            </div>
          )}

          <div className="preview__header">
            <div className="preview__cover-copy">
              <span className="preview__badge">برنامه بازاریابی تولید شد</span>
              <h2 className="preview__title mp-document-heading">{businessName || 'برنامه بازاریابی'}</h2>
              <ReportDecisionPath />
            </div>
            <div className="preview__header-actions">
              <div
                className="preview__score-pill"
                role="meter"
                aria-label="امتیاز کیفیت برنامه"
                aria-valuemin={0}
                aria-valuemax={maxScore}
                aria-valuenow={score}
              >
                <span className="preview__score-num mp-data">{score}/{maxScore}</span>
                <span className="preview__score-label">کیفیت</span>
              </div>
              <div className="preview__export-actions" role="toolbar" aria-label="خروجی‌های گزارش">
                <div className="preview__export-primary" role="group" aria-label="خروجی‌های اصلی">
                  <button className="preview__action-btn preview__action-btn--primary" type="button" onClick={handleDownloadPdf} disabled={Boolean(busyAction)} aria-busy={busyAction === 'pdf'}>
                    دریافت PDF
                  </button>
                  <button className="preview__action-btn preview__action-btn--primary-alt" type="button" onClick={handleDownloadWord} disabled={Boolean(busyAction)} aria-busy={busyAction === 'word'}>
                    {wordLabel}
                  </button>
                </div>
                <div className="preview__export-secondary" role="group" aria-label="عملیات دیگر">
                  <button className="preview__action-btn" type="button" onClick={handleSave} disabled={Boolean(busyAction) || source === 'saved'}>
                    {source === 'saved' ? 'ذخیره‌شده' : busyAction === 'save' ? 'در حال ذخیره…' : 'ذخیره برنامه'}
                  </button>
                  <button className="preview__action-btn" type="button" onClick={handlePrint} disabled={Boolean(busyAction)} aria-busy={busyAction === 'print'}>
                    چاپ گزارش
                  </button>
                  <button className={`preview__copy-btn preview__action-btn ${copied ? 'preview__action-btn--success' : ''}`} type="button" onClick={handleCopyMarkdown} aria-live="polite">
                    {copyLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ExecutiveSnapshot plan={plan} businessName={businessName} />

          <ChapterHeader {...reportChapters[0]} />

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

          <ChapterHeader {...reportChapters[1]} />

          <CollapsibleSection title="۵. بیانیه جایگاه‌یابی">
            <div className="preview__positioning-block">
              <span>بیانیه تصمیم</span>
              <p className="preview__text">{plan.positioningStatement}</p>
            </div>
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
            <StructuredRows caption="ماتریس تحلیل رقبا و جایگزین‌های موجود در برنامه" items={plan.competitorAnalysis} />
          </CollapsibleSection>

          <ChapterHeader {...reportChapters[2]} />

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
            <StructuredRows caption="ماتریس راهبرد کانال‌های موجود در برنامه" items={plan.channelStrategy} firstColumn="محور کانال" secondColumn="راهبرد" />
          </CollapsibleSection>

          <ChapterHeader {...reportChapters[3]} />

          <CollapsibleSection title="۱۳. پیشنهاد اولیه قیمت‌گذاری">
            <div className="preview__pricing-note">
              <span>جهت قیمت‌گذاری موجود</span>
              <p className="preview__text">{plan.pricingRecommendation}</p>
            </div>
          </CollapsibleSection>

          <ChapterHeader {...reportChapters[4]} />

          <CollapsibleSection title="۱۴. داشبورد KPI">
            <KpiDashboard kpis={plan.kpiDashboard} />
          </CollapsibleSection>

          <CollapsibleSection title="۱۵. برنامه اقدام ۳۰ روزه">
            <ActionTimeline items={plan.actionPlan} />
          </CollapsibleSection>

          <CollapsibleSection title="۱۶. ریسک‌ها و فرضیات">
            <StructuredRows caption="جدول ریسک‌ها، فرضیات و محدودیت‌های ثبت‌شده" items={plan.risksAssumptions} firstColumn="نوع" secondColumn="شرح موجود" />
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
      <div className="preview__section-reveal" aria-hidden={!open} inert={!open}>
        <div className="preview__section-body">
          {children}
        </div>
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
      <div
        className="preview__quality-bar"
        role="progressbar"
        aria-label="درصد کیفیت برنامه"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="preview__quality-fill" style={{ transform: `scaleX(${pct / 100})` }} />
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

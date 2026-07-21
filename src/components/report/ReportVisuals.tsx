import type { MarketingPlan } from '../../types'
import { splitReportEntry } from '../../lib/reportPresentation'
import './ReportVisuals.css'

export function ReportDecisionPath() {
  const steps = ['ورودی', 'تحلیل', 'برنامه', 'سنجش']
  return (
    <figure className="report-path" aria-labelledby="report-path-caption">
      <div className="report-path__line" aria-hidden="true" />
      <ol className="report-path__steps">
        {steps.map((step, index) => (
          <li key={step} className="report-path__step">
            <span className="report-path__node" aria-hidden="true">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <figcaption id="report-path-caption">مسیر تصمیم از داده کسب‌وکار تا سنجش نتیجه</figcaption>
    </figure>
  )
}

export function ExecutiveSnapshot({ plan, businessName }: { plan: MarketingPlan; businessName: string }) {
  const { score, maxScore } = plan.qualityScore
  const textItems = [
    businessName ? { label: 'کسب‌وکار', value: businessName } : null,
    plan.customerDevelopmentStage ? { label: 'مرحله توسعه مشتری', value: plan.customerDevelopmentStage } : null,
    plan.targetMarket ? { label: 'بازار هدف', value: plan.targetMarket } : null,
    plan.valueProposition ? { label: 'ارزش پیشنهادی', value: plan.valueProposition } : null,
    plan.pricingRecommendation ? { label: 'جهت قیمت‌گذاری', value: plan.pricingRecommendation } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item))

  return (
    <section className="report-snapshot" aria-labelledby="report-snapshot-title">
      <header className="report-snapshot__header">
        <div>
          <span className="report-snapshot__eyebrow">Executive snapshot</span>
          <h3 id="report-snapshot-title">نمای تصمیم مدیریتی</h3>
        </div>
        <dl className="report-snapshot__metrics">
          <div>
            <dt>سنجه تعریف‌شده</dt>
            <dd className="mp-data">{plan.kpiDashboard.length.toLocaleString('fa-IR')}</dd>
          </div>
          <div>
            <dt>کیفیت برنامه</dt>
            <dd className="mp-data">{score}/{maxScore}</dd>
          </div>
        </dl>
      </header>
      <dl className="report-snapshot__grid">
        {textItems.map((item) => (
          <div key={item.label} className="report-snapshot__item">
            <dt>{item.label}</dt>
            <dd dir="auto">{item.value}</dd>
          </div>
        ))}
        {plan.channelStrategy.length > 0 && (
          <div className="report-snapshot__item report-snapshot__item--wide">
            <dt>راهبردهای کانال موجود</dt>
            <dd>
              <ul>{plan.channelStrategy.map((channel, index) => <li key={index}>{channel}</li>)}</ul>
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}

export function ChapterHeader({ index, title, range }: { index: string; title: string; range: string }) {
  return (
    <header className="report-chapter" aria-label={`${title}، ${range}`}>
      <span className="report-chapter__index mp-data">{index}</span>
      <span className="report-chapter__copy">
        <strong>{title}</strong>
        <small>{range}</small>
      </span>
    </header>
  )
}

export function StructuredRows({ caption, items, firstColumn = 'موضوع', secondColumn = 'تحلیل موجود' }: {
  caption: string
  items: string[]
  firstColumn?: string
  secondColumn?: string
}) {
  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">{firstColumn}</th><th scope="col">{secondColumn}</th></tr></thead>
        <tbody>
          {items.map((item, index) => {
            const { label, value } = splitReportEntry(item)
            return value
              ? <tr key={index}><th scope="row">{label}</th><td>{value}</td></tr>
              : <tr key={index}><td colSpan={2}>{label}</td></tr>
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ActionTimeline({ items }: { items: string[] }) {
  return (
    <figure className="report-timeline">
      <figcaption>نقشه اقدام ۳۰ روزه بر اساس برنامه تولیدشده</figcaption>
      <ol>
        {items.map((item, index) => {
          const { label, value } = splitReportEntry(item)
          const tasks = value.split(';').map((task) => task.trim()).filter(Boolean)
          return (
            <li key={index}>
              <span className="report-timeline__marker" aria-hidden="true">{index + 1}</span>
              <div>
                <strong>{label}</strong>
                {tasks.length > 0 ? <ul>{tasks.map((task) => <li key={task}>{task}</li>)}</ul> : <p>{item}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { KPI } from '../types'
import { kpiDefinitions } from '../data/kpiFramework'
import './KpiDashboard.css'

export interface KpiRow {
  id: string
  metric: string
  funnelStage: string
  formula: string
  target: string
  benchmark: string
  interpretation: string
  priority: string
  frequency: string
  enabled: boolean
}

const priorityLabels: Record<string, string> = {
  Critical: 'حیاتی',
  High: 'زیاد',
  Medium: 'متوسط',
  Low: 'کم',
}

function initRows(kpis: KPI[]): KpiRow[] {
  return kpis.map((k, i) => {
    const def = kpiDefinitions[k.metric]
    return {
      id: `kpi-${i}`,
      metric: k.metric,
      funnelStage: def?.funnelStage ?? '—',
      formula: def?.formula ?? '—',
      target: k.value,
      benchmark: k.benchmark,
      interpretation: k.interpretation,
      priority: def?.priority ?? 'Medium',
      frequency: def?.frequency ?? '—',
      enabled: true,
    }
  })
}

interface Props {
  kpis: KPI[]
}

function KpiDashboard({ kpis }: Props) {
  const [rows, setRows] = useState<KpiRow[]>(() => initRows(kpis))
  const serialized = useMemo(() => JSON.stringify(kpis), [kpis])

  useEffect(() => {
    setRows(initRows(kpis))
  }, [serialized, kpis])

  const toggleEnabled = useCallback((id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }, [])

  const updateTarget = useCallback((id: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, target: value } : r)))
  }, [])

  const updateBenchmark = useCallback((id: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, benchmark: value } : r)))
  }, [])

  const handleReset = useCallback(() => {
    setRows(initRows(kpis))
  }, [kpis])

  const enabledCount = rows.filter((r) => r.enabled).length

  return (
    <div className="kpi-dashboard">
      <p className="kpi-dashboard__note">
        این KPIها بر اساس هدف بازاریابی شما پیشنهاد شده‌اند و باید با داده‌های واقعی کمپین اعتبارسنجی شوند.
        می‌توانید سنجه‌ها را فعال یا غیرفعال کنید، هدف و معیار مقایسه را تغییر دهید و هر زمان به مقدار پیشنهادی برگردید.
      </p>

      <div className="kpi-dashboard__controls">
        <span className="kpi-dashboard__count">{enabledCount} از {rows.length} KPI فعال</span>
        <button className="kpi-dashboard__reset" type="button" onClick={handleReset}>
          بازگشت به مقادیر پیشنهادی
        </button>
      </div>

      <div className="kpi-dashboard__cards" aria-label="کارت‌های KPI">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`kpi-card ${row.enabled ? '' : 'kpi-card--disabled'}`}
          >
            <div className="kpi-card__header">
              <label className="kpi-card__toggle">
                <input
                  type="checkbox"
                  className="kpi-card__checkbox"
                  checked={row.enabled}
                  onChange={() => toggleEnabled(row.id)}
                  aria-label={`فعال یا غیرفعال کردن ${row.metric}`}
                />
                <span className="kpi-card__toggle-vis" />
              </label>
              <span className="kpi-card__name">{row.metric}</span>
              <span className={`kpi-card__priority kpi-card__priority--${row.priority.toLowerCase()}`}>
                {priorityLabels[row.priority] ?? row.priority}
              </span>
            </div>
            <div className="kpi-card__body">
              <div className="kpi-card__meta">
                <span className="kpi-card__badge">{row.funnelStage}</span>
                <span className="kpi-card__freq">{row.frequency}</span>
              </div>
              <div className="kpi-card__formula">{row.formula}</div>
              <div className="kpi-card__inputs">
                <div className="kpi-card__field">
                  <label className="kpi-card__label">هدف</label>
                  <input
                    className="kpi-card__input"
                    type="text"
                    value={row.target}
                    onChange={(e) => updateTarget(row.id, e.target.value)}
                    aria-label={`هدف برای ${row.metric}`}
                    title={row.target}
                  />
                </div>
                <div className="kpi-card__field">
                  <label className="kpi-card__label">معیار مقایسه</label>
                  <input
                    className="kpi-card__input"
                    type="text"
                    value={row.benchmark}
                    onChange={(e) => updateBenchmark(row.id, e.target.value)}
                    aria-label={`معیار مقایسه برای ${row.metric}`}
                    title={row.benchmark}
                  />
                </div>
              </div>
              <div className="kpi-card__interp">{row.interpretation}</div>
            </div>
          </div>
        ))}
      </div>

      <table className="kpi-dashboard__print-table" aria-label="جدول KPI برای چاپ">
        <thead>
          <tr>
            <th>سنجه</th>
            <th>مرحله قیف</th>
            <th>هدف</th>
            <th>معیار مقایسه</th>
            <th>تفسیر</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter((r) => r.enabled).map((row) => (
            <tr key={row.id}>
              <td className="kpi-print__metric">{row.metric}</td>
              <td>{row.funnelStage}</td>
              <td>{row.target}</td>
              <td>{row.benchmark}</td>
              <td className="kpi-print__interp">{row.interpretation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default KpiDashboard

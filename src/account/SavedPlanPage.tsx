import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MarketingPlanPreview from '../components/MarketingPlanPreview'
import BrandLogo from '../components/BrandLogo'
import { getPlan, trackProductEvent, type SavedPlan } from '../plans/planRepository'
import './account.css'

export default function SavedPlanPage() {
  const { planId = '' } = useParams()
  const [plan, setPlan] = useState<SavedPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    void getPlan(planId).then((result) => {
      if (!alive) return
      if (!result) setError('این برنامه پیدا نشد یا به حساب شما تعلق ندارد.')
      else { setPlan(result); void trackProductEvent('plan_viewed', result.id) }
    }).catch(() => { if (alive) setError('دریافت برنامه انجام نشد. دوباره تلاش کنید.') }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [planId])

  if (loading) return <main className="route-state" dir="rtl" lang="fa" aria-busy="true"><BrandLogo iconOnly size="lg" /><div className="route-state__loader"/><p>در حال دریافت برنامه…</p></main>
  if (!plan || error) return <main id="main-content" className="account-page"><div className="container account-missing"><h1>برنامه در دسترس نیست</h1><p>{error}</p><Link className="account-button account-button--primary" to="/account">بازگشت به برنامه‌های من</Link></div></main>
  return <main id="main-content" className="saved-plan-page" dir="rtl" lang="fa"><div className="container saved-plan-page__back"><Link to="/account">بازگشت به برنامه‌های من</Link></div><MarketingPlanPreview plan={plan.outputData} businessName={plan.businessName} inputData={plan.inputData} source="saved" savedPlanId={plan.id} /></main>
}

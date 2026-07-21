import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { usePlanAccess } from '../plans/PlanAccessContext'
import type { GuestPlanSnapshot } from '../plans/guestPlan'
import { listPlans, type SavedPlan } from '../plans/planRepository'
import './account.css'

export default function DashboardPage() {
  const auth = useAuth()
  const { profile } = auth
  const navigate = useNavigate()
  const { requestAction, busyAction } = usePlanAccess()
  const [plans, setPlans] = useState<SavedPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    let alive = true
    void listPlans().then((data) => { if (alive) setPlans(data) }).catch(() => { if (alive) setError('دریافت برنامه‌ها انجام نشد. دوباره تلاش کنید.') }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const cleanup = load()
    return cleanup
  }, [load])

  const latest = plans[0]
  const lastActivity = latest?.lastViewedAt ?? latest?.updatedAt ?? profile?.lastActiveAt
  const logout = async () => {
    setSigningOut(true)
    setError('')
    try {
      await auth.signOut()
      navigate('/', { replace: true })
    } catch {
      setError('خروج از حساب انجام نشد. دوباره تلاش کنید.')
      setSigningOut(false)
    }
  }
  return (
    <main id="main-content" className="account-page" dir="rtl" lang="fa">
      <div className="container account-page__inner">
        <header className="account-hero">
          <div><p>حساب کاربری</p><h1>{profile?.firstName ? `${profile.firstName}، خوش آمدید` : 'حساب کاربری'}</h1><span>برنامه‌های ذخیره‌شده و خروجی‌های شما از همین‌جا در دسترس‌اند.</span></div>
          <div className="account-hero__actions">
            <Link className="account-button account-button--primary" to="/#business-form">ساخت برنامه جدید</Link>
            <Link className="account-button" to="/account/settings">تنظیمات حساب</Link>
            <button className="account-button account-button--quiet" type="button" disabled={signingOut} onClick={() => void logout()}>{signingOut ? 'در حال خروج…' : 'خروج از حساب'}</button>
          </div>
        </header>

        <dl className="account-summary" aria-label="خلاصه فضای شخصی">
          <div><dt>برنامه‌های ذخیره‌شده</dt><dd>{loading || error ? '—' : plans.length.toLocaleString('fa-IR')}</dd></div>
          <div><dt>آخرین برنامه</dt><dd>{loading || error ? '—' : latest?.businessName ?? '—'}</dd></div>
          <div><dt>آخرین فعالیت</dt><dd>{lastActivity ? formatDate(lastActivity) : '—'}</dd></div>
        </dl>

        <section className="account-plans" aria-labelledby="plans-title">
          <div className="account-section-title"><div><h2 id="plans-title">برنامه‌های من</h2><p>برنامه‌های ذخیره‌شده را مشاهده کنید یا خروجی تازه بگیرید.</p></div></div>
          {error ? <AccountError message={error} onRetry={load} /> : loading ? <PlanSkeleton /> : plans.length === 0 ? <EmptyPlans /> : (
            <div className="plan-list">
              {plans.map((plan) => {
                const snapshot = snapshotFromSaved(plan)
                return <article className="plan-row" key={plan.id}>
                  <div className="plan-row__main"><span className="plan-row__status">آماده</span><strong>{plan.businessName || 'کسب‌وکار بدون نام'}</strong><h3>{plan.title}</h3><p>ساخته‌شده {formatDate(plan.createdAt)} · آخرین به‌روزرسانی {formatDate(plan.updatedAt)}</p></div>
                  <div className="plan-row__actions" aria-label={`عملیات ${plan.businessName}`}>
                    <Link className="plan-row__view" to={`/account/plans/${plan.id}`}>مشاهده برنامه</Link>
                    <button type="button" disabled={Boolean(busyAction)} onClick={() => void requestAction('pdf', snapshot)}>دریافت PDF</button>
                    <button type="button" disabled={Boolean(busyAction)} onClick={() => void requestAction('word', snapshot)}>دانلود Word</button>
                    <button type="button" disabled={Boolean(busyAction)} onClick={() => void requestAction('print', snapshot)}>چاپ</button>
                  </div>
                </article>
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function AccountError({ message, onRetry }: { message: string; onRetry: () => unknown }) {
  return <div className="account-error-state" role="alert"><h3>دریافت برنامه‌ها ممکن نشد</h3><p>{message}</p><button className="account-button" type="button" onClick={() => onRetry()}>تلاش دوباره</button></div>
}

function EmptyPlans() {
  return <div className="account-empty"><svg viewBox="0 0 96 96" aria-hidden="true"><rect x="20" y="14" width="56" height="68" rx="8" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M32 32h32M32 44h24M32 56h29" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="m58 70 6 6 12-14" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg><h3>اولین برنامه‌تان را بسازید</h3><p>پس از تولید، برنامه به‌صورت امن در همین فضا ذخیره و برای خروجی‌های بعدی آماده می‌شود.</p><Link className="account-button account-button--primary" to="/#business-form">ساخت اولین برنامه</Link></div>
}

function PlanSkeleton() {
  return <div className="plan-list" aria-busy="true" aria-label="در حال دریافت برنامه‌ها">{[1, 2].map((item) => <div className="plan-row plan-row--skeleton" key={item}><span/><span/><span/></div>)}</div>
}

function snapshotFromSaved(plan: SavedPlan): GuestPlanSnapshot {
  return { guestId: plan.id, savedPlanId: plan.id, businessName: plan.businessName, title: plan.title, inputData: plan.inputData, outputData: plan.outputData, schemaVersion: plan.schemaVersion, modelProvider: plan.modelProvider, status: 'ready', origin: 'authenticated', createdAt: plan.createdAt, updatedAt: plan.updatedAt }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value))
}

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import BrandLogo from '../components/BrandLogo'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, configured, session, profile } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="route-state" dir="rtl" lang="fa" aria-busy="true">
        <BrandLogo iconOnly size="lg" />
        <div className="route-state__loader" aria-hidden="true" />
        <p>در حال آماده‌سازی حساب کاربری…</p>
      </main>
    )
  }

  if (!configured) return <Navigate to="/login?config=missing" replace />
  if (!session || !profile?.isActive || !profile.phoneVerifiedAt) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  return children
}

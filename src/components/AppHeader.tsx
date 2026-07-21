import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AUTH_COPY } from '../auth/copy'
import BrandLogo from './BrandLogo'
import './AppHeader.css'

export default function AppHeader() {
  const auth = useAuth()
  const navigate = useNavigate()
  const logout = async () => {
    await auth.signOut()
    navigate('/', { replace: true })
  }
  return (
    <header className="app-header" dir="rtl">
      <a className="app-header__skip" href="#main-content">رفتن به محتوای اصلی</a>
      <div className="container app-header__inner">
        <Link className="app-header__brand" to="/" aria-label="MarketPilot AI — صفحه اصلی"><BrandLogo size="sm" /></Link>
        <nav className="app-header__nav" aria-label="حساب کاربری">
          {auth.loading ? <span className="app-header__auth-loading" aria-label="در حال بررسی حساب کاربری">در حال بررسی…</span> : auth.profile?.isActive ? <>
            <NavLink to="/account">برنامه‌های من</NavLink>
            <NavLink to="/account/settings">حساب من</NavLink>
            <button type="button" onClick={logout}>خروج</button>
          </> : <>
            <Link to="/login">ورود</Link>
            <Link className="app-header__cta" to="/signup">{AUTH_COPY.signupCta}</Link>
          </>}
        </nav>
      </div>
    </header>
  )
}

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { validateEmailForSettings } from '../auth/AuthPages'
import { isValidPhone, normalizePhone, passwordError } from '../auth/validation'
import './account.css'

export default function AccountSettingsPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const profile = auth.profile
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [lastName, setLastName] = useState(profile?.lastName ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [countryCode, setCountryCode] = useState('+98')
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneStep, setPhoneStep] = useState<'number' | 'otp'>('number')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const run = async (key: string, task: () => Promise<void>, success: string) => {
    setBusy(key); setError(''); setMessage('')
    try { await task(); setMessage(success) } catch { setError('ذخیره تغییرات انجام نشد. اطلاعات را بررسی و دوباره تلاش کنید.') } finally { setBusy('') }
  }

  const submitNames = (event: FormEvent) => { event.preventDefault(); if (firstName.trim().length < 2 || lastName.trim().length < 2) { setError('نام و نام خانوادگی را کامل وارد کنید.'); return } void run('names', () => auth.updateNames(firstName, lastName), 'نام شما به‌روزرسانی شد.') }
  const submitEmail = (event: FormEvent) => { event.preventDefault(); const validation = validateEmailForSettings(email); if (validation) { setError(validation); return } void run('email', () => auth.updateEmail(email), 'ایمیل حساب به‌روزرسانی شد؛ نیازی به تأیید ایمیل نیست.') }
  const submitPhone = (event: FormEvent) => { event.preventDefault(); const normalized = normalizePhone(countryCode, phone); if (!isValidPhone(normalized)) { setError('شماره موبایل جدید معتبر نیست.'); return } if (phoneStep === 'number') void run('phone', async () => { await auth.requestPhoneChange(normalized); setPhone(normalized); setPhoneStep('otp') }, 'کد تأیید به شماره جدید ارسال شد.'); else { if (!/^\d{6}$/.test(phoneCode)) { setError('کد ۶ رقمی را کامل وارد کنید.'); return } void run('phone', async () => { await auth.confirmPhoneChange(phone, phoneCode); setPhoneStep('number'); setPhone(''); setPhoneCode('') }, 'شماره موبایل جدید تأیید و ذخیره شد.') } }
  const submitPassword = (event: FormEvent) => { event.preventDefault(); const validation = passwordError(password); if (validation) { setError(validation); return } if (password !== confirm) { setError('تکرار رمز عبور یکسان نیست.'); return } void run('password', async () => { await auth.updatePassword(password); setPassword(''); setConfirm('') }, 'رمز عبور با موفقیت تغییر کرد.') }
  const logout = () => void run('logout', async () => { await auth.signOut(); navigate('/', { replace: true }) }, '')

  return <main id="main-content" className="account-page" dir="rtl" lang="fa"><div className="container account-page__inner account-settings">
    <header className="account-hero"><div><p>حساب من</p><h1>تنظیمات حساب</h1><span>اطلاعات تماس و روش ورود امن خود را مدیریت کنید.</span></div><span className="account-verified">موبایل تأییدشده</span></header>
    {(message || error) && <div className={`account-alert ${error ? 'account-alert--error' : 'account-alert--success'}`} role="status">{error || message}</div>}
    <div className="settings-sections">
      <form className="settings-section" onSubmit={submitNames}><div><h2>نام و مشخصات</h2><p>این نام در خوشامدگویی فضای شخصی نمایش داده می‌شود.</p></div><div className="settings-fields settings-fields--two"><label>نام<input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" /></label><label>نام خانوادگی<input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" /></label></div><button className="account-button" disabled={Boolean(busy)}>{busy === 'names' ? 'در حال ذخیره…' : 'ذخیره نام'}</button></form>
      <form className="settings-section" onSubmit={submitEmail}><div><h2>ایمیل</h2><p>ایمیل در مشخصات حساب شما نگهداری می‌شود؛ ورود به حساب فقط با شماره موبایل انجام می‌شود.</p></div><div className="settings-fields"><label>ایمیل<input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label></div><button className="account-button" disabled={Boolean(busy)}>{busy === 'email' ? 'در حال ذخیره…' : 'به‌روزرسانی ایمیل'}</button></form>
      <form className="settings-section" onSubmit={submitPhone}><div><h2>شماره موبایل</h2><p>شماره فعلی: <bdi dir="ltr">{profile?.phone}</bdi>. شماره جدید فقط پس از تأیید کد ذخیره می‌شود.</p></div>{phoneStep === 'number' ? <div className="settings-phone"><select aria-label="پیش‌شماره" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}><option value="+98">+۹۸</option><option value="+971">+۹۷۱</option><option value="+90">+۹۰</option><option value="+1">+۱</option></select><input dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9121234567" /></div> : <div className="settings-fields"><label>کد تأیید شماره جدید<input dir="ltr" inputMode="numeric" maxLength={6} value={phoneCode} onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ''))} /></label></div>}<button className="account-button" disabled={Boolean(busy)}>{busy === 'phone' ? 'در حال بررسی…' : phoneStep === 'number' ? 'ارسال کد به شماره جدید' : 'تأیید و ذخیره شماره'}</button></form>
      <form className="settings-section" onSubmit={submitPassword}><div><h2>رمز عبور</h2><p>رمز جدید دست‌کم ۸ نویسه و شامل حرف و عدد باشد.</p></div><div className="settings-fields settings-fields--two"><label>رمز جدید<input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label><label>تکرار رمز جدید<input dir="ltr" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></label></div><button className="account-button" disabled={Boolean(busy)}>{busy === 'password' ? 'در حال ذخیره…' : 'تغییر رمز عبور'}</button></form>
      <section className="settings-section settings-section--danger"><div><h2>خروج از حساب</h2><p>برنامه‌های ذخیره‌شده در فضای شخصی شما باقی می‌مانند.</p></div><button className="account-button account-button--danger" type="button" disabled={Boolean(busy)} onClick={logout}>خروج از حساب</button></section>
    </div>
  </div></main>
}

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { captureAcquisitionSource } from './acquisition'
import { AUTH_COPY } from './copy'
import { readPendingRegistration, useAuth } from './AuthContext'
import { buildAuthPath, safeReturnTo, signupReason } from './navigation'
import type { RegistrationInput } from './types'
import {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  passwordError,
  validateRegistration,
  type FieldErrors,
} from './validation'
import BrandLogo from '../components/BrandLogo'
import './auth.css'

const countryCodes = [
  { value: '+98', label: 'ایران +۹۸' },
  { value: '+971', label: 'امارات +۹۷۱' },
  { value: '+90', label: 'ترکیه +۹۰' },
  { value: '+1', label: 'آمریکا/کانادا +۱' },
]

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [method, setMethod] = useState<'password' | 'otp'>('password')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+98')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const countdown = useCountdown(otpSent ? 60 : 0)
  const returnTo = safeReturnTo(params.get('returnTo'), '/account')
  const reason = signupReason(params.get('reason'))

  if (auth.loading) return <AuthLoading />
  if (auth.profile?.isActive) return <Navigate to={returnTo} replace />

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedPhone = normalizePhone(countryCode, phone)
    if (!isValidPhone(normalizedPhone) || !password) {
      setError('شماره موبایل و رمز عبور را درست وارد کنید.')
      document.getElementById('phone')?.focus()
      return
    }
    setBusy(true)
    setError('')
    try {
      await auth.signInWithPassword(phone, password, countryCode)
      navigate(returnTo, { replace: true })
    } catch (caught) {
      setError(authMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const sendOtp = async () => {
    const phone = normalizePhone(countryCode, otpPhone)
    if (!isValidPhone(phone)) {
      setError('شماره موبایل را همراه با پیش‌شماره درست وارد کنید.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await auth.sendLoginOtp(phone)
      setOtpPhone(phone)
      setOtpSent(true)
      countdown.restart()
    } catch (caught) {
      setError(authMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(otpCode)) {
      setError('کد ۶ رقمی پیامک‌شده را کامل وارد کنید.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await auth.verifyLoginOtp(otpPhone, otpCode)
      navigate(returnTo, { replace: true })
    } catch (caught) {
      setError(authMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={AUTH_COPY.loginTitle}
      description="برنامه‌هایتان همیشه در دسترس می‌مانند و می‌توانید خروجی‌ها را هر زمان دوباره دریافت کنید."
      footer={<span>هنوز حساب ندارید؟ <Link to={buildAuthPath('signup', { reason, returnTo })}>ایجاد حساب کاربری</Link></span>}
      returnTo={returnTo}
    >
      {!auth.configured && <ConfigNotice />}
      <div className="auth-tabs" role="tablist" aria-label="روش ورود">
        <button type="button" role="tab" aria-selected={method === 'password'} onClick={() => { setMethod('password'); setError('') }}>با رمز عبور</button>
        <button type="button" role="tab" aria-selected={method === 'otp'} onClick={() => { setMethod('otp'); setError('') }}>با رمز یک‌بارمصرف</button>
      </div>

      {method === 'password' ? (
        <form className="auth-form" onSubmit={submitPassword} noValidate>
          <PhoneField countryCode={countryCode} onCountryCode={setCountryCode} value={phone} onChange={setPhone} />
          <PasswordField
            id="login-password"
            label="رمز عبور"
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onVisible={setShowPassword}
            capsLock={capsLock}
            onCapsLock={setCapsLock}
            autoComplete="current-password"
          />
          <Link className="auth-form__aside-link" to={buildAuthPath('recover', { reason, returnTo })}>رمز عبورم را فراموش کرده‌ام</Link>
          <FormError message={error} />
          <SubmitButton busy={busy} disabled={!auth.configured} label="ورود" busyLabel="در حال ورود…" />
        </form>
      ) : (
        <form className="auth-form" onSubmit={verifyOtp} noValidate>
          {!otpSent ? (
            <>
              <PhoneField countryCode={countryCode} onCountryCode={setCountryCode} value={otpPhone} onChange={setOtpPhone} />
              <FormError message={error} />
              <button className="auth-button auth-button--primary" type="button" onClick={sendOtp} disabled={busy || !auth.configured}>
                {busy ? 'در حال ارسال…' : 'ارسال کد'}
              </button>
            </>
          ) : (
            <>
              <OtpField value={otpCode} onChange={setOtpCode} phone={otpPhone} />
              <div className="auth-otp-actions">
                <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setError('') }}>اصلاح شماره</button>
                <button type="button" onClick={sendOtp} disabled={busy || countdown.seconds > 0}>
                  {countdown.seconds > 0 ? `ارسال مجدد تا ${formatSeconds(countdown.seconds)}` : 'ارسال مجدد کد'}
                </button>
              </div>
              <FormError message={error} />
              <SubmitButton busy={busy} label="ورود" busyLabel="در حال بررسی کد…" />
            </>
          )}
        </form>
      )}
    </AuthShell>
  )
}

export function SignupPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'), '/account')
  const reason = signupReason(params.get('reason'))
  const [values, setValues] = useState<RegistrationInput>(() => ({
    firstName: '',
    lastName: '',
    countryCode: '+98',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    marketingConsent: false,
    signupReason: reason,
    acquisition: captureAcquisitionSource(),
  }))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  if (auth.loading) return <AuthLoading />
  if (auth.profile?.isActive) return <Navigate to={returnTo} replace />

  const update = <K extends keyof RegistrationInput>(key: K, value: RegistrationInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateRegistration(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }
    setBusy(true)
    setFormError('')
    try {
      const result = await auth.startRegistration(values)
      navigate(
        result.completed ? returnTo : buildAuthPath('verify-phone', { reason, returnTo }),
        { replace: true },
      )
    } catch (caught) {
      const code = errorCode(caught)
      if (code === 'EMAIL_ALREADY_REGISTERED') setErrors((current) => ({ ...current, email: 'این ایمیل قبلاً برای یک حساب ثبت شده است.' }))
      else if (code === 'PHONE_ALREADY_REGISTERED' || code === 'CONTACT_ALREADY_REGISTERED') setErrors((current) => ({ ...current, phone: 'این شماره موبایل قبلاً برای یک حساب ثبت شده است.' }))
      else setFormError(authMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={AUTH_COPY.signupTitle}
      description="برنامه فعلی‌تان حفظ می‌شود؛ پس از تأیید موبایل مستقیماً وارد فضای شخصی خود می‌شوید."
      footer={<span>قبلاً حساب دارید؟ <Link to={buildAuthPath('login', { reason, returnTo })}>ورود به حساب</Link></span>}
      returnTo={returnTo}
      wide
    >
      {!auth.configured && <ConfigNotice />}
      <form className="auth-form auth-form--signup" onSubmit={submit} noValidate>
        <div className="auth-form__row">
          <TextField id="firstName" label="نام *" value={values.firstName} onChange={(value) => update('firstName', value)} error={errors.firstName} autoComplete="given-name" maxLength={80} required />
          <TextField id="lastName" label="نام خانوادگی *" value={values.lastName} onChange={(value) => update('lastName', value)} error={errors.lastName} autoComplete="family-name" maxLength={100} required />
        </div>
        <PhoneField countryCode={values.countryCode} onCountryCode={(value) => update('countryCode', value)} value={values.phone} onChange={(value) => update('phone', value)} error={errors.phone} />
        <TextField id="email" label="ایمیل *" type="email" value={values.email} onChange={(value) => update('email', value)} error={errors.email} autoComplete="email" maxLength={254} required />
        <div className="auth-form__row">
          <PasswordField id="password" label="رمز عبور" value={values.password} onChange={(value) => update('password', value)} visible={passwordVisible} onVisible={setPasswordVisible} capsLock={capsLock} onCapsLock={setCapsLock} error={errors.password} autoComplete="new-password" />
          <PasswordField id="confirmPassword" label="تکرار رمز عبور" value={values.confirmPassword} onChange={(value) => update('confirmPassword', value)} visible={confirmVisible} onVisible={setConfirmVisible} capsLock={capsLock} onCapsLock={setCapsLock} error={errors.confirmPassword} autoComplete="new-password" />
        </div>
        <label className="auth-check" htmlFor="termsAccepted">
          <input id="termsAccepted" type="checkbox" checked={values.termsAccepted} onChange={(event) => update('termsAccepted', event.target.checked)} aria-invalid={Boolean(errors.termsAccepted)} />
          <span>شرایط استفاده و حریم خصوصی MarketPilot را می‌پذیرم.</span>
        </label>
        <FieldError id="termsAccepted-error" message={errors.termsAccepted} />
        <label className="auth-check" htmlFor="marketingConsent">
          <input id="marketingConsent" type="checkbox" checked={values.marketingConsent} onChange={(event) => update('marketingConsent', event.target.checked)} />
          <span>مایلم نکات و ابزارهای کاربردی مرتبط با رشد کسب‌وکار را دریافت کنم. <small>اختیاری</small></span>
        </label>
        <FormError message={formError} />
        <SubmitButton busy={busy} disabled={!auth.configured} label="ارسال کد تأیید موبایل" busyLabel="در حال ارسال کد…" />
      </form>
    </AuthShell>
  )
}

export function VerifyPhonePage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'), '/account')
  const reason = signupReason(params.get('reason'))
  const pending = useMemo(readPendingRegistration, [])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const countdown = useCountdown(60)

  if (!pending) return <Navigate to={buildAuthPath('signup', { reason, returnTo })} replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('کد ۶ رقمی پیامک‌شده را کامل وارد کنید.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await auth.verifyRegistration(pending.phone, code, pending.email)
      navigate(returnTo, { replace: true })
    } catch (caught) {
      setError(authMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setBusy(true)
    setError('')
    try {
      await auth.resendRegistrationOtp(pending.phone)
      countdown.restart()
    } catch (caught) {
      setError(authMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="تأیید شماره موبایل" description="کدی را که به شماره شما پیامک شده است وارد کنید." footer={<Link to={buildAuthPath('signup', { reason, returnTo })}>اصلاح اطلاعات ثبت‌نام</Link>} returnTo={returnTo}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <OtpField value={code} onChange={setCode} phone={pending.phone} />
        <div className="auth-otp-actions">
          <span>کد تا مدت کوتاهی معتبر است.</span>
          <button type="button" onClick={resend} disabled={busy || countdown.seconds > 0}>
            {countdown.seconds > 0 ? `ارسال مجدد تا ${formatSeconds(countdown.seconds)}` : 'ارسال مجدد کد'}
          </button>
        </div>
        <FormError message={error} />
        <SubmitButton busy={busy} label="تأیید و ورود" busyLabel="در حال تأیید…" />
      </form>
    </AuthShell>
  )
}

export function RecoveryPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'), '/account')
  const reason = signupReason(params.get('reason'))
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone')
  const [countryCode, setCountryCode] = useState('+98')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const countdown = useCountdown(step === 'otp' ? 60 : 0)

  const send = async () => {
    const normalized = normalizePhone(countryCode, phone)
    if (!isValidPhone(normalized)) {
      setError('شماره موبایل را همراه با پیش‌شماره درست وارد کنید.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await auth.sendRecoveryOtp(normalized)
      setPhone(normalized)
      setStep('otp')
      countdown.restart()
    } catch (caught) {
      setError(authMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (step === 'phone') await send()
      if (step === 'otp') {
        if (!/^\d{6}$/.test(code)) throw new Error('OTP_INVALID')
        await auth.verifyRecoveryOtp(phone, code)
        setStep('password')
      }
      if (step === 'password') {
        const message = passwordError(password)
        if (message) throw new Error(message)
        if (password !== confirm) throw new Error('PASSWORDS_MISMATCH')
        await auth.setRecoveredPassword(password)
        navigate(returnTo, { replace: true })
      }
    } catch (caught) {
      setError(authMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="بازیابی رمز عبور" description="برای بازیابی دسترسی، شماره موبایل تأییدشده حساب را وارد کنید." footer={<Link to={buildAuthPath('login', { reason, returnTo })}>بازگشت به ورود</Link>} returnTo={returnTo}>
      <form className="auth-form" onSubmit={submit} noValidate>
        {step === 'phone' && <PhoneField countryCode={countryCode} onCountryCode={setCountryCode} value={phone} onChange={setPhone} />}
        {step === 'otp' && <>
          <OtpField value={code} onChange={setCode} phone={phone} />
          <div className="auth-otp-actions">
            <button type="button" onClick={() => setStep('phone')}>اصلاح شماره</button>
            <button type="button" disabled={busy || countdown.seconds > 0} onClick={send}>{countdown.seconds > 0 ? `ارسال مجدد تا ${formatSeconds(countdown.seconds)}` : 'ارسال مجدد کد'}</button>
          </div>
        </>}
        {step === 'password' && <>
          <PasswordField id="recovery-password" label="رمز عبور جدید" value={password} onChange={setPassword} visible={visible} onVisible={setVisible} capsLock={capsLock} onCapsLock={setCapsLock} autoComplete="new-password" />
          <PasswordField id="recovery-confirm" label="تکرار رمز عبور جدید" value={confirm} onChange={setConfirm} visible={visible} onVisible={setVisible} capsLock={capsLock} onCapsLock={setCapsLock} autoComplete="new-password" />
        </>}
        <FormError message={error} />
        <SubmitButton busy={busy} label={step === 'phone' ? 'ارسال کد بازیابی' : step === 'otp' ? 'تأیید کد' : 'ذخیره رمز جدید و ورود'} busyLabel="در حال انجام…" />
      </form>
    </AuthShell>
  )
}

function AuthShell({ title, description, children, footer, returnTo, wide = false }: { title: string; description: string; children: ReactNode; footer: ReactNode; returnTo: string; wide?: boolean }) {
  return (
    <main className="auth-page" dir="rtl" lang="fa">
      <Link className="auth-page__brand" to="/" aria-label="بازگشت به MarketPilot AI">
        <BrandLogo size="lg" />
      </Link>
      <section className={`auth-panel ${wide ? 'auth-panel--wide' : ''}`}>
        <header className="auth-panel__header">
          <p>{AUTH_COPY.eyebrow}</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </header>
        {children}
        <footer className="auth-panel__footer">
          <div>{footer}</div>
          <Link className="auth-panel__back" to={returnTo}>{AUTH_COPY.backToProgram}</Link>
        </footer>
      </section>
    </main>
  )
}

function AuthLoading() {
  return <main className="route-state" dir="rtl" lang="fa" aria-busy="true"><BrandLogo iconOnly size="lg" /><div className="route-state__loader" aria-hidden="true" /><p>در حال بررسی حساب کاربری…</p></main>
}

function TextField({ id, label, value, onChange, type = 'text', error, hint, autoComplete, maxLength, required = false }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string; error?: string; hint?: string; autoComplete?: string; maxLength?: number; required?: boolean }) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  return <div className="auth-field"><label htmlFor={id}>{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} maxLength={maxLength} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} />{hint && <small id={`${id}-hint`}>{hint}</small>}<FieldError id={`${id}-error`} message={error} /></div>
}

function PhoneField({ countryCode, onCountryCode, value, onChange, error }: { countryCode: string; onCountryCode: (value: string) => void; value: string; onChange: (value: string) => void; error?: string }) {
  return <div className="auth-field"><label htmlFor="phone">شماره موبایل *</label><div className="auth-phone"><select aria-label="پیش‌شماره کشور" value={countryCode} onChange={(event) => onCountryCode(event.target.value)}>{countryCodes.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}</select><input id="phone" dir="ltr" inputMode="tel" autoComplete="tel" required value={value} onChange={(event) => onChange(event.target.value)} placeholder="912 123 4567" aria-invalid={Boolean(error)} aria-describedby={error ? 'phone-error' : undefined} /></div><FieldError id="phone-error" message={error} /></div>
}

function PasswordField({ id, label, value, onChange, visible, onVisible, capsLock, onCapsLock, error, autoComplete }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onVisible: (visible: boolean) => void; capsLock: boolean; onCapsLock: (active: boolean) => void; error?: string; autoComplete: string }) {
  return <div className="auth-field"><label htmlFor={id}>{label} *</label><div className="auth-password"><input id={id} type={visible ? 'text' : 'password'} required value={value} onChange={(event) => onChange(event.target.value)} onKeyUp={(event) => onCapsLock(event.getModifierState('CapsLock'))} onKeyDown={(event) => onCapsLock(event.getModifierState('CapsLock'))} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : capsLock ? `${id}-caps` : undefined} /><button type="button" onClick={() => onVisible(!visible)} aria-label={visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}>{visible ? 'پنهان' : 'نمایش'}</button></div>{capsLock && <small id={`${id}-caps`} className="auth-field__warning">Caps Lock روشن است.</small>}<FieldError id={`${id}-error`} message={error} /></div>
}

function OtpField({ value, onChange, phone }: { value: string; onChange: (value: string) => void; phone: string }) {
  return <div className="auth-field auth-field--otp"><label htmlFor="otp">کد یک‌بارمصرف *</label><span>کد ارسال‌شده به <bdi dir="ltr">{phone}</bdi></span><input id="otp" dir="ltr" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" /></div>
}

function SubmitButton({ busy, label, busyLabel, disabled = false }: { busy: boolean; label: string; busyLabel: string; disabled?: boolean }) {
  return <button className="auth-button auth-button--primary" type="submit" disabled={busy || disabled} aria-busy={busy}>{busy ? busyLabel : label}</button>
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span className="auth-field__error" id={id} role="alert">{message}</span> : null
}

function FormError({ message }: { message: string }) {
  return message ? <div className="auth-error" role="alert">{message}</div> : null
}

function ConfigNotice() {
  useEffect(() => {
    if (import.meta.env.DEV) console.warn('Account authentication is unavailable: Supabase environment variables are not configured.')
  }, [])
  const message = import.meta.env.DEV ? AUTH_COPY.developmentConfigNotice : AUTH_COPY.productionConfigNotice
  return <div className="auth-error" role="alert">{message}</div>
}

function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(initial)
  useEffect(() => {
    if (seconds <= 0) return
    const timer = window.setTimeout(() => setSeconds((current) => Math.max(0, current - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])
  return { seconds, restart: () => setSeconds(60) }
}

function formatSeconds(seconds: number): string {
  return `۰:${seconds.toLocaleString('fa-IR', { minimumIntegerDigits: 2, useGrouping: false })}`
}

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : 'AUTH_REQUEST_FAILED'
}

function authMessage(error: unknown): string {
  const code = errorCode(error)
  const messages: Record<string, string> = {
    LOGIN_INVALID: 'شماره موبایل یا رمز عبور درست نیست.',
    LOGIN_PHONE_INVALID: 'شماره موبایل را همراه با پیش‌شماره درست وارد کنید.',
    ACCOUNT_NOT_ACTIVE: 'تأیید موبایل این حساب کامل نشده است. ثبت‌نام را از ابتدا ادامه دهید.',
    OTP_INVALID: 'کد واردشده درست نیست. کد پیامک‌شده را دوباره بررسی کنید.',
    OTP_EXPIRED: 'زمان اعتبار کد تمام شده است. یک کد تازه دریافت کنید.',
    OTP_VERIFICATION_FAILED: 'بررسی کد انجام نشد. دوباره تلاش کنید.',
    OTP_RATE_LIMITED: 'برای ارسال کد تازه کمی صبر کنید و سپس دوباره تلاش کنید.',
    EMAIL_ALREADY_REGISTERED: 'این ایمیل قبلاً برای یک حساب ثبت شده است.',
    PHONE_ALREADY_REGISTERED: 'این شماره موبایل قبلاً برای یک حساب ثبت شده است.',
    CONTACT_ALREADY_REGISTERED: 'این شماره یا ایمیل قبلاً ثبت شده است. وارد حساب شوید.',
    ACCOUNT_FINALIZATION_FAILED: 'تأیید انجام شد اما تکمیل حساب ممکن نشد. دوباره تلاش کنید.',
    ACCOUNT_SERVICE_NOT_CONFIGURED: 'سرویس حساب کاربری برای این محیط کامل تنظیم نشده است.',
    PASSWORDS_MISMATCH: 'تکرار رمز عبور با رمز اصلی یکسان نیست.',
    AUTH_REQUEST_FAILED: 'ارتباط امن با سرویس حساب برقرار نشد. دوباره تلاش کنید.',
  }
  return messages[code] ?? (code.startsWith('رمز عبور') || code.startsWith('برای امنیت') ? code : 'انجام این درخواست ممکن نشد. دوباره تلاش کنید.')
}

export function validateEmailForSettings(value: string): string | null {
  return isValidEmail(value) ? null : 'یک ایمیل معتبر وارد کنید.'
}

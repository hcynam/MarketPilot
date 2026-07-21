import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AUTH_COPY, AUTH_GATE_COPY } from '../auth/copy'
import { buildAuthPath, safeReturnTo } from '../auth/navigation'
import type { PendingAction } from '../auth/types'
import BrandLogo from '../components/BrandLogo'
import { loadGuestPlanSnapshot, saveGuestPlanSnapshot, type GuestPlanSnapshot } from './guestPlan'
import { createPendingActionState, parsePendingAction, PENDING_ACTION_KEY } from './pendingAction'
import { claimGuestPlan, savePlanForUser, trackProductEvent } from './planRepository'
import { prepareExportWindow, runPlanExport } from './planActions'
import './planAccess.css'

interface PlanAccessValue {
  busyAction: PendingAction | null
  requestAction: (action: PendingAction, snapshot: GuestPlanSnapshot) => Promise<void>
}

const PlanAccessContext = createContext<PlanAccessValue | null>(null)

export function PlanAccessProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [promptAction, setPromptAction] = useState<PendingAction | null>(null)
  const [busyAction, setBusyAction] = useState<PendingAction | null>(null)
  const [toast, setToast] = useState('')
  const reservedWindow = useRef<Window | null>(null)
  const resumedKey = useRef('')
  const previousFocus = useRef<HTMLElement | null>(null)

  const execute = useCallback(async (action: PendingAction, snapshot: GuestPlanSnapshot, popup?: Window | null) => {
    if (!auth.user) throw new Error('NOT_AUTHENTICATED')
    setBusyAction(action)
    let savedPlanId: string | undefined = snapshot.savedPlanId
    try {
      try {
        if (snapshot.savedPlanId) throw new Error('PLAN_ALREADY_PERSISTED')
        const saved = await savePlanForUser(snapshot, auth.user)
        savedPlanId = saved.id
        await trackProductEvent('plan_saved', saved.id, { source: action })
      } catch (error) {
        if (!snapshot.savedPlanId) throw error
      }

      if (action !== 'save') {
        await runPlanExport(action, snapshot, popup)
        const eventName = action === 'pdf' ? 'pdf_exported' : action === 'word' ? 'word_exported' : 'printed'
        await trackProductEvent(eventName, savedPlanId, {})
      }
      setToast(action === 'save' ? (snapshot.savedPlanId ? 'این برنامه از قبل در فضای شخصی شماست.' : 'برنامه در فضای شخصی شما ذخیره شد.') : 'خروجی برنامه آماده شد.')
    } finally {
      setBusyAction(null)
    }
  }, [auth.user])

  const requestAction = useCallback(async (action: PendingAction, snapshot: GuestPlanSnapshot) => {
    saveGuestPlanSnapshot(snapshot)
    if (auth.user && auth.profile?.isActive) {
      try {
        await execute(action, snapshot)
      } catch {
        setToast(action === 'save' ? 'ذخیره برنامه انجام نشد؛ برنامه روی صفحه شما باقی مانده است.' : 'ساخت خروجی انجام نشد. دوباره تلاش کنید.')
      }
      return
    }
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setPromptAction(action)
  }, [auth.profile?.isActive, auth.user, execute])

  const continueToAuth = (destination: 'signup' | 'login') => {
    if (!promptAction) return
    const snapshot = loadGuestPlanSnapshot()
    if (!snapshot) {
      setToast('برنامه روی صفحه باقی مانده است؛ لطفاً عملیات را دوباره انتخاب کنید.')
      setPromptAction(null)
      return
    }
    const returnTo = safeReturnTo(`${location.pathname}${location.search}${location.hash}`)
    sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(createPendingActionState(promptAction, snapshot.guestId, returnTo)))
    reservedWindow.current = prepareExportWindow(promptAction)
    const reason = promptAction
    setPromptAction(null)
    navigate(buildAuthPath(destination, { reason, returnTo }))
  }

  const dismissPrompt = () => {
    reservedWindow.current?.close()
    reservedWindow.current = null
    setPromptAction(null)
    window.setTimeout(() => previousFocus.current?.focus(), 0)
  }

  useEffect(() => {
    if (!auth.user || !auth.profile?.isActive) return
    const snapshot = loadGuestPlanSnapshot()
    const key = `${auth.user.id}:${snapshot?.guestId ?? 'none'}`
    if (resumedKey.current === key) return
    resumedKey.current = key

    const rawPending = sessionStorage.getItem(PENDING_ACTION_KEY)
    const pending = rawPending ? parsePendingAction(rawPending) : null
    if (rawPending && !pending) sessionStorage.removeItem(PENDING_ACTION_KEY)
    if (pending && snapshot && pending.guestId === snapshot.guestId) {
      void execute(pending.action, snapshot, reservedWindow.current)
        .then(() => {
          sessionStorage.removeItem(PENDING_ACTION_KEY)
          reservedWindow.current = null
        })
        .catch(() => {
          resumedKey.current = ''
          reservedWindow.current?.frameElement?.remove()
          reservedWindow.current = null
          setToast('عملیات درخواستی کامل نشد؛ برنامه شما حفظ شده و می‌توانید دوباره تلاش کنید.')
        })
      return
    }
    if (pending && (!snapshot || pending.guestId !== snapshot.guestId)) sessionStorage.removeItem(PENDING_ACTION_KEY)

    void claimGuestPlan(snapshot, auth.user).catch(() => {
      resumedKey.current = ''
      setToast('برنامه مهمان روی این دستگاه حفظ شده است؛ اتصال آن به حساب را دوباره امتحان خواهیم کرد.')
    })
  }, [auth.profile?.isActive, auth.user, execute])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 4500)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const value = useMemo(() => ({ busyAction, requestAction }), [busyAction, requestAction])
  return (
    <PlanAccessContext.Provider value={value}>
      {children}
      {promptAction && <GuestAccessDialog onSignup={() => continueToAuth('signup')} onLogin={() => continueToAuth('login')} onDismiss={dismissPrompt} />}
      {toast && <div className="plan-toast" role="status" aria-live="polite">{toast}</div>}
    </PlanAccessContext.Provider>
  )
}

export function usePlanAccess(): PlanAccessValue {
  const context = useContext(PlanAccessContext)
  if (!context) throw new Error('usePlanAccess must be used inside PlanAccessProvider')
  return context
}

function GuestAccessDialog({ onSignup, onLogin, onDismiss }: { onSignup: () => void; onLogin: () => void; onDismiss: () => void }) {
  const signupButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    signupButton.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled)') ?? [])
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDismiss])
  return (
    <div className="plan-gate" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onDismiss() }}>
      <section ref={dialog} className="plan-gate__dialog" role="dialog" aria-modal="true" aria-labelledby="plan-gate-title" aria-describedby="plan-gate-description">
        <button className="plan-gate__close" type="button" onClick={onDismiss} aria-label="بستن">×</button>
        <div className="plan-gate__mark"><BrandLogo iconOnly size="lg" /></div>
        <h2 id="plan-gate-title">{AUTH_GATE_COPY.title}</h2>
        <p id="plan-gate-description">{AUTH_GATE_COPY.description}</p>
        <ul>{AUTH_GATE_COPY.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
        <div className="plan-gate__actions">
          <button ref={signupButton} className="plan-gate__primary" type="button" onClick={onSignup}>{AUTH_COPY.signupCta}</button>
          <button type="button" onClick={onLogin}>{AUTH_COPY.loginCta}</button>
          <button className="plan-gate__later" type="button" onClick={onDismiss}>فعلاً نه</button>
        </div>
      </section>
    </div>
  )
}

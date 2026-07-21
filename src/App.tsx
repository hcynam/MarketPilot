import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import HeroSection from './components/HeroSection'
import WorkflowPreview from './components/WorkflowPreview'
import CourseAlignment from './components/CourseAlignment'
import DemoFlow from './components/DemoFlow'
import BusinessIntakeForm from './components/BusinessIntakeForm'
import ClarifyingQuestionsPanel from './components/ClarifyingQuestionsPanel'
import type { ClarifyingAnswers } from './components/ClarifyingQuestionsPanel'
import MarketingPlanPreview from './components/MarketingPlanPreview'
import MarketingAssistant from './components/assistant/MarketingAssistant'
import MotionController from './components/MotionController'
import { useBusinessForm } from './hooks/useBusinessForm'
import { mergeStrategyPatch } from './ai/aiPlanAdapter'
import { buildBaselineDigest } from './ai/baselineDigest'
import { buildBusinessBrief, type CompactBusinessBrief } from './ai/buildBusinessBrief'
import { assessBusinessCompleteness, toLocalClarificationResponse } from './ai/completeness'
import { requestFinalMarketingPlan, userMessageForError } from './ai/marketingAIClient'
import { generateFallbackMarketingPlan } from './ai/fallbackPlan'
import { buildAssistantContext } from './utils/buildAssistantContext'
import type { BusinessInput, MarketingPlan } from './types'
import type { ClarifyingQuestionsResponse } from '../netlify/functions/_shared/marketingSchemas'
import { useAuth } from './auth/AuthContext'
import { clearGuestPlanSnapshot, createGuestPlanSnapshot, loadGuestPlanSnapshot, saveGuestPlanSnapshot } from './plans/guestPlan'
import { savePlanForUser, trackProductEvent } from './plans/planRepository'
import './App.css'

type AIStatus =
  | 'idle'
  | 'reviewing_input'
  | 'awaiting_clarification'
  | 'generating_plan'
  | 'internal_only'
  | 'ai_enhanced'
  | 'ai_partially_enhanced'

function App() {
  const form = useBusinessForm()
  const auth = useAuth()
  const restoredGuestPlan = useRef(loadGuestPlanSnapshot()).current
  const [plan, setPlan] = useState<MarketingPlan | null>(() => restoredGuestPlan?.outputData ?? null)
  const [planStale, setPlanStale] = useState(false)
  const [generationId, setGenerationId] = useState(restoredGuestPlan ? 0 : 0)
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle')
  const [clarifyingResponse, setClarifyingResponse] = useState<ClarifyingQuestionsResponse | null>(null)
  const [statusDetail, setStatusDetail] = useState('')
  const [lastBusinessBrief, setLastBusinessBrief] = useState<CompactBusinessBrief | null>(null)
  const [lastInputSnapshot, setLastInputSnapshot] = useState<BusinessInput | null>(() => restoredGuestPlan?.inputData ?? null)
  const [lastBaselinePlan, setLastBaselinePlan] = useState<MarketingPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const lastGeneratedKey = useRef(restoredGuestPlan ? JSON.stringify(restoredGuestPlan.inputData) : '')
  const lastBriefInputKey = useRef('')
  const persistedGeneration = useRef(0)

  const renderInternalPlan = useCallback((
    input: BusinessInput,
    baseline: MarketingPlan,
    errorCode?: string,
  ) => {
    setPlan(baseline)
    setGenerationId((previous) => previous + 1)
    lastGeneratedKey.current = JSON.stringify(input)
    setPlanStale(false)
    setClarifyingResponse(null)
    setStatusDetail(errorCode ? userMessageForError(errorCode) : '')
    setAiStatus('internal_only')
    if (errorCode) console.warn('MarketPilot AI enhancement unavailable', { errorCode })
  }, [])

  const requestAndMergePatch = useCallback(async ({
    input,
    brief,
    baseline,
    clarifyingAnswers,
  }: {
    input: BusinessInput
    brief: CompactBusinessBrief
    baseline: MarketingPlan
    clarifyingAnswers?: ClarifyingAnswers
  }) => {
    setAiStatus('generating_plan')
    const result = await requestFinalMarketingPlan({
      businessBrief: brief,
      baselineDigest: buildBaselineDigest(baseline, brief),
      clarifyingAnswers: clarifyingAnswers as Record<string, unknown> | undefined,
    })

    if (!result.ok) {
      renderInternalPlan(input, baseline, result.errorCode)
      return
    }

    const merged = mergeStrategyPatch(
      baseline,
      result.data.patch,
      result.data.diagnostic,
      brief,
    )
    setPlan(merged.plan)
    setGenerationId((previous) => previous + 1)
    lastGeneratedKey.current = JSON.stringify(input)
    setPlanStale(false)
    setClarifyingResponse(null)
    setStatusDetail('')
    setAiStatus(merged.diagnostic.rejectedPatchAreas.length > 0
      ? 'ai_partially_enhanced'
      : 'ai_enhanced')
  }, [renderInternalPlan])

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return

    const inputSnapshot = cloneBusinessInput(form.data)
    const inputKey = JSON.stringify(inputSnapshot)
    const brief = buildBusinessBrief(inputSnapshot)
    const baseline = generateFallbackMarketingPlan(inputSnapshot)
    const completeness = assessBusinessCompleteness(brief)

    setIsGenerating(true)
    setPlan(null)
    setPlanStale(false)
    setClarifyingResponse(null)
    setStatusDetail('')
    setLastBusinessBrief(brief)
    setLastInputSnapshot(inputSnapshot)
    setLastBaselinePlan(baseline)
    lastBriefInputKey.current = inputKey
    setAiStatus('reviewing_input')

    try {
      if (form.origin.skipClarification || completeness.sufficient) {
        await requestAndMergePatch({ input: inputSnapshot, brief, baseline })
        return
      }

      setClarifyingResponse(toLocalClarificationResponse(completeness))
      setStatusDetail('سؤال‌های ضروری با بررسی داخلی آماده شدند و برای ادامه به سرویس خارجی وابسته نیستند.')
      setAiStatus('awaiting_clarification')
    } finally {
      setIsGenerating(false)
    }
  }, [form.data, form.origin.skipClarification, isGenerating, requestAndMergePatch])

  const handleClarifyingSubmit = useCallback(async (answers: ClarifyingAnswers) => {
    if (isGenerating) return
    if (!lastBusinessBrief || !lastInputSnapshot || !lastBaselinePlan) return

    setIsGenerating(true)
    setStatusDetail('')
    try {
      await requestAndMergePatch({
        input: lastInputSnapshot,
        brief: lastBusinessBrief,
        baseline: lastBaselinePlan,
        clarifyingAnswers: answers,
      })
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, lastBaselinePlan, lastBusinessBrief, lastInputSnapshot, requestAndMergePatch])

  const handleBackToForm = useCallback(() => {
    setClarifyingResponse(null)
    setStatusDetail('')
    setAiStatus('idle')
  }, [])

  const handleClear = useCallback(() => {
    form.clearForm()
    setPlan(null)
    setPlanStale(false)
    setClarifyingResponse(null)
    setStatusDetail('')
    setLastBusinessBrief(null)
    setLastInputSnapshot(null)
    setLastBaselinePlan(null)
    setAiStatus('idle')
    lastGeneratedKey.current = ''
    lastBriefInputKey.current = ''
    clearGuestPlanSnapshot()
  }, [form])

  const statusMessage = getAIStatusMessage(aiStatus, statusDetail)
  const previewBusinessName = plan && lastInputSnapshot?.businessName
    ? lastInputSnapshot.businessName
    : form.data.businessName
  const assistantBusinessContext = useMemo(
    () => buildAssistantContext(form.data, planStale ? null : plan),
    [form.data, plan, planStale],
  )

  useEffect(() => {
    const currentKey = JSON.stringify(form.data)
    if (plan && currentKey !== lastGeneratedKey.current) setPlanStale(true)
    if (clarifyingResponse && lastBriefInputKey.current && currentKey !== lastBriefInputKey.current) {
      setClarifyingResponse(null)
      setAiStatus('idle')
      setStatusDetail('')
    }
  }, [clarifyingResponse, form.data, plan])

  useEffect(() => {
    if (!plan || !lastInputSnapshot || planStale) return
    const snapshot = createGuestPlanSnapshot({
      businessName: lastInputSnapshot.businessName || form.data.businessName,
      inputData: lastInputSnapshot,
      outputData: plan,
      modelProvider: aiStatus === 'ai_enhanced' || aiStatus === 'ai_partially_enhanced' ? 'configured-ai-provider' : 'marketpilot-internal',
    })
    saveGuestPlanSnapshot(snapshot)
    if (!auth.user || !auth.profile?.isActive || generationId === 0 || persistedGeneration.current === generationId) return
    persistedGeneration.current = generationId
    void savePlanForUser(snapshot, auth.user)
      .then((saved) => Promise.all([
        trackProductEvent('plan_generated', saved.id, { provider: snapshot.modelProvider ?? 'unknown' }),
        trackProductEvent('plan_saved', saved.id, { source: 'automatic' }),
      ]))
      .catch(() => { persistedGeneration.current = 0 })
  }, [aiStatus, auth.profile?.isActive, auth.user, form.data.businessName, generationId, lastInputSnapshot, plan, planStale])

  return (
    <main id="main-content" className={`app ${plan ? 'app--has-plan' : ''}`} dir="rtl" lang="fa">
      <MotionController revision={`${generationId}:${aiStatus}:${Boolean(clarifyingResponse)}:${Boolean(plan)}`} />
      <HeroSection />
      <WorkflowPreview />
      <CourseAlignment />
      <DemoFlow />
      <BusinessIntakeForm form={form} onGenerate={handleGenerate} onClear={handleClear} isGenerating={isGenerating} />
      {statusMessage && (
        <section className={`app__ai-status app__ai-status--${aiStatus}`} aria-live="polite" data-mp-reveal>
          <div className="container">
            <div className={`app__ai-status-card status-strip status-strip--${getAIStatusTone(aiStatus)} ${isGenerating ? 'status-strip--loading' : ''}`}>
              {isGenerating && (
                <span className="app__ai-status-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <path d="M4 17.5 9 12l4 3 7-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="4" cy="17.5" r="1.6" fill="currentColor" />
                    <circle cx="9" cy="12" r="1.6" fill="currentColor" />
                    <circle cx="13" cy="15" r="1.6" fill="currentColor" />
                    <circle cx="20" cy="7" r="1.6" fill="currentColor" />
                  </svg>
                </span>
              )}
              <span className="app__ai-status-content">
                <strong>{statusMessage}</strong>
                {isGenerating && <small>چند لحظه همراه ما باشید؛ پیشنهادها در حال آماده‌سازی‌اند.</small>}
              </span>
              {isGenerating && <span className="app__ai-status-dots" aria-hidden="true"><i /><i /><i /></span>}
            </div>
          </div>
        </section>
      )}
      {clarifyingResponse && (
        <ClarifyingQuestionsPanel response={clarifyingResponse} busy={isGenerating} onSubmit={handleClarifyingSubmit} onBackToForm={handleBackToForm} />
      )}
      {plan && <MarketingPlanPreview key={generationId} plan={plan} stale={planStale} businessName={previewBusinessName} inputData={lastInputSnapshot ?? form.data} source="current" />}
      <MarketingAssistant businessContext={assistantBusinessContext} />
    </main>
  )
}

function cloneBusinessInput(input: BusinessInput): BusinessInput {
  return { ...input, availableChannels: [...input.availableChannels] }
}

function getAIStatusMessage(status: AIStatus, detail: string): string {
  switch (status) {
    case 'reviewing_input': return 'در حال تحلیل اطلاعات کسب‌وکار و تدوین برنامه بازاریابی شما...'
    case 'awaiting_clarification': return detail || 'برای تصمیم‌های دقیق‌تر، چند پاسخ تکمیلی لازم است.'
    case 'generating_plan': return 'در حال تحلیل اطلاعات کسب‌وکار و تدوین برنامه بازاریابی شما...'
    case 'internal_only': return detail || 'برنامه کامل با موتور داخلی MarketPilot تولید شد؛ بهبود هوش مصنوعی اعمال نشد.'
    case 'ai_enhanced': return 'برنامه با تحلیل هوش مصنوعی بهبود یافت.'
    case 'ai_partially_enhanced': return 'بخشی از پیشنهادهای هوش مصنوعی اعمال شد و ساختار کامل برنامه حفظ گردید.'
    default: return ''
  }
}

function getAIStatusTone(status: AIStatus): 'info' | 'success' | 'warning' {
  if (status === 'internal_only') return 'warning'
  if (status === 'ai_enhanced') return 'success'
  return 'info'
}

export default App

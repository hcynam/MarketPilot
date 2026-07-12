import { useState, useCallback, useRef, useEffect } from 'react'
import HeroSection from './components/HeroSection'
import WorkflowPreview from './components/WorkflowPreview'
import CourseAlignment from './components/CourseAlignment'
import DemoFlow from './components/DemoFlow'
import BusinessIntakeForm from './components/BusinessIntakeForm'
import ClarifyingQuestionsPanel from './components/ClarifyingQuestionsPanel'
import type { ClarifyingAnswers } from './components/ClarifyingQuestionsPanel'
import MarketingPlanPreview from './components/MarketingPlanPreview'
import { useBusinessForm } from './hooks/useBusinessForm'
import { adaptAIPlanToMarketingPlan } from './ai/aiPlanAdapter'
import { buildBusinessBrief } from './ai/buildBusinessBrief'
import type { MarketingBusinessBrief } from './ai/buildBusinessBrief'
import {
  requestClarifyingQuestions,
  requestFinalMarketingPlan,
} from './ai/marketingAIClient'
import {
  fallbackMarketingPlanMessage,
  generateFallbackMarketingPlan,
} from './ai/fallbackPlan'
import type { BusinessInput, MarketingPlan } from './types'
import { generateMarketingPlan } from './engine/orchestrator'
import type { ClarifyingQuestionsResponse } from '../netlify/functions/_shared/marketingSchemas'
import './App.css'

type AIStatus =
  | 'idle'
  | 'reviewing_input'
  | 'awaiting_clarification'
  | 'generating_plan'
  | 'fallback'
  | 'error'
  | 'complete'
  | 'partial_complete'

const validationFallbackMessage =
  'خروجی هوش مصنوعی با قالب موردنیاز سازگار نبود؛ نسخه پایه تولید شد.'

function App() {
  const form = useBusinessForm()
  const [plan, setPlan] = useState<MarketingPlan | null>(null)
  const [planStale, setPlanStale] = useState(false)
  const [generationId, setGenerationId] = useState(0)
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle')
  const [clarifyingResponse, setClarifyingResponse] =
    useState<ClarifyingQuestionsResponse | null>(null)
  const [aiErrorMessage, setAiErrorMessage] = useState('')
  const [fallbackMessage, setFallbackMessage] = useState('')
  const [lastBusinessBrief, setLastBusinessBrief] =
    useState<MarketingBusinessBrief | null>(null)
  const [lastInputSnapshot, setLastInputSnapshot] = useState<BusinessInput | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const lastGeneratedKey = useRef('')
  const lastBriefInputKey = useRef('')

  const applyFallback = useCallback((
    input: BusinessInput,
    reason?: string,
    message = fallbackMarketingPlanMessage,
  ) => {
    const result = generateFallbackMarketingPlan(input, reason)
    setPlan(result)
    setGenerationId((prev) => prev + 1)
    lastGeneratedKey.current = JSON.stringify(input)
    setPlanStale(false)
    setClarifyingResponse(null)
    setFallbackMessage(message)
    setAiErrorMessage(message)
    setAiStatus('fallback')

    if (reason) {
      console.warn('MarketPilot AI fallback used', { errorCode: reason })
    }
  }, [])

  const requestAndRenderFinalPlan = useCallback(async ({
    input,
    clarifyingAnswers,
    assumptions,
  }: {
    input: BusinessInput
    clarifyingAnswers?: ClarifyingAnswers
    assumptions?: string[]
  }) => {
    setAiStatus('generating_plan')
    const baselinePlan = generateMarketingPlan(input)

    try {
      const result = await requestFinalMarketingPlan({
        businessInput: input as unknown as Record<string, unknown>,
        clarifyingAnswers: clarifyingAnswers as Record<string, unknown> | undefined,
        assumptions,
        baselinePlan,
      })

      if (!result.ok) {
        const message = result.errorCode === 'AI_VALIDATION_FAILED'
          ? validationFallbackMessage
          : fallbackMarketingPlanMessage
        applyFallback(input, result.errorCode, message)
        return
      }

      if (result.planSource === 'internal-fallback') {
        console.warn('AI patch quality diagnostic', {
          errorCode: result.errorCode || 'AI_PATCH_REJECTED',
          provider: result.provider,
          modelUsed: result.modelUsed,
          mode: 'plan',
          parseStage: result.parseStage,
          patchType: result.patchType,
          rawTopLevelKeys: result.rawTopLevelKeys ?? [],
          patchTopLevelKeys: result.patchTopLevelKeys ?? [],
          validationIssues: result.validationIssues ?? [],
          qualityIssues: result.qualityIssues ?? [],
          acceptedPatchAreas: result.acceptedPatchAreas ?? [],
          hasBaselinePlan: result.hasBaselinePlan,
          hasClarifyingAnswers: result.hasClarifyingAnswers,
          attemptedRepair: result.attemptedRepair,
          planSource: result.planSource,
        })
        applyFallback(input, 'AI_PATCH_REJECTED')
        return
      }

      const adaptedPlan = adaptAIPlanToMarketingPlan(result.data, input)
      setPlan(adaptedPlan)
      setGenerationId((prev) => prev + 1)
      lastGeneratedKey.current = JSON.stringify(input)
      setPlanStale(false)
      setClarifyingResponse(null)
      setAiErrorMessage('')
      setFallbackMessage('')
      setAiStatus(result.planSource === 'ai-partially-enhanced' ? 'partial_complete' : 'complete')
    } catch {
      applyFallback(input, 'AI_PLAN_RENDER_FAILED')
    }
  }, [applyFallback])

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return

    const inputSnapshot = cloneBusinessInput(form.data)
    const inputKey = JSON.stringify(inputSnapshot)
    const brief = buildBusinessBrief(inputSnapshot)

    setIsGenerating(true)
    setPlan(null)
    setPlanStale(false)
    setClarifyingResponse(null)
    setAiErrorMessage('')
    setFallbackMessage('')
    setLastBusinessBrief(brief)
    setLastInputSnapshot(inputSnapshot)
    lastBriefInputKey.current = inputKey
    setAiStatus('reviewing_input')

    try {
      const result = await requestClarifyingQuestions({
        businessInput: brief as unknown as Record<string, unknown>,
      })

      if (!result.ok) {
        applyFallback(inputSnapshot, result.errorCode)
        return
      }

      if (result.data.mode === 'needs_clarification') {
        setClarifyingResponse(result.data)
        setAiStatus('awaiting_clarification')
        return
      }

      await requestAndRenderFinalPlan({
        input: inputSnapshot,
        assumptions: result.data.assumptionsIfProceeding,
      })
    } finally {
      setIsGenerating(false)
    }
  }, [applyFallback, form.data, isGenerating, requestAndRenderFinalPlan])

  const handleClarifyingSubmit = useCallback(async (answers: ClarifyingAnswers) => {
    if (isGenerating) return

    if (!lastBusinessBrief || !lastInputSnapshot) {
      setAiErrorMessage(fallbackMarketingPlanMessage)
      setAiStatus('error')
      return
    }

    setIsGenerating(true)
    setAiErrorMessage('')
    setFallbackMessage('')

    try {
      await requestAndRenderFinalPlan({
        input: lastInputSnapshot,
        clarifyingAnswers: answers,
        assumptions: clarifyingResponse?.assumptionsIfProceeding,
      })
    } finally {
      setIsGenerating(false)
    }
  }, [
    clarifyingResponse?.assumptionsIfProceeding,
    isGenerating,
    lastBusinessBrief,
    lastInputSnapshot,
    requestAndRenderFinalPlan,
  ])

  const handleBackToForm = useCallback(() => {
    setClarifyingResponse(null)
    setAiErrorMessage('')
    setFallbackMessage('')
    setAiStatus('idle')
  }, [])

  const handleClear = useCallback(() => {
    form.clearForm()
    setPlan(null)
    setPlanStale(false)
    setClarifyingResponse(null)
    setAiErrorMessage('')
    setFallbackMessage('')
    setLastBusinessBrief(null)
    setLastInputSnapshot(null)
    setAiStatus('idle')
    lastGeneratedKey.current = ''
    lastBriefInputKey.current = ''
  }, [form])

  const statusMessage = getAIStatusMessage(aiStatus, aiErrorMessage, fallbackMessage)
  const previewBusinessName = plan && lastInputSnapshot?.businessName
    ? lastInputSnapshot.businessName
    : form.data.businessName

  // Detect stale plan and clear clarification questions when form data changes after generation/review.
  useEffect(() => {
    const currentKey = JSON.stringify(form.data)

    if (plan && currentKey !== lastGeneratedKey.current) {
      setPlanStale(true)
    }

    if (
      clarifyingResponse &&
      lastBriefInputKey.current &&
      currentKey !== lastBriefInputKey.current
    ) {
      setClarifyingResponse(null)
      setAiStatus('idle')
    }
  }, [clarifyingResponse, form.data, plan])

  return (
    <div className={`app ${plan ? 'app--has-plan' : ''}`} dir="rtl" lang="fa">
      <HeroSection />
      <WorkflowPreview />
      <CourseAlignment />
      <DemoFlow />
      <BusinessIntakeForm
        form={form}
        onGenerate={handleGenerate}
        onClear={handleClear}
        isGenerating={isGenerating}
      />
      {statusMessage && (
        <section className={`app__ai-status app__ai-status--${aiStatus}`} aria-live="polite">
          <div className="container">
            <div className="app__ai-status-card">{statusMessage}</div>
          </div>
        </section>
      )}
      {clarifyingResponse && (
        <ClarifyingQuestionsPanel
          response={clarifyingResponse}
          busy={isGenerating}
          onSubmit={handleClarifyingSubmit}
          onBackToForm={handleBackToForm}
        />
      )}
      {plan && (
        <MarketingPlanPreview
          key={generationId}
          plan={plan}
          stale={planStale}
          businessName={previewBusinessName}
        />
      )}
    </div>
  )
}

function cloneBusinessInput(input: BusinessInput): BusinessInput {
  return {
    ...input,
    availableChannels: [...input.availableChannels],
  }
}

function getAIStatusMessage(
  status: AIStatus,
  aiErrorMessage: string,
  fallbackMessage: string,
): string {
  switch (status) {
    case 'reviewing_input':
      return 'در حال بررسی کیفیت اطلاعات واردشده...'
    case 'awaiting_clarification':
      return 'برای ساخت یک برنامه دقیق‌تر، چند سؤال تکمیلی لازم است.'
    case 'generating_plan':
      return 'در حال تولید برنامه بازاریابی هوشمند...'
    case 'fallback':
      return fallbackMessage || fallbackMarketingPlanMessage
    case 'complete':
      return 'برنامه با تحلیل هوشمند Groq تقویت شد.'
    case 'partial_complete':
      return 'برنامه با موتور داخلی MarketPilot تولید و با تحلیل هوشمند Groq در بخش‌های کلیدی تقویت شد.'
    case 'error':
      return aiErrorMessage
    default:
      return ''
  }
}

export default App

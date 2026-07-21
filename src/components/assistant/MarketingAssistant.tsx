import { Component, useCallback, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { useMarketingAssistant } from '../../hooks/useMarketingAssistant'
import type { AssistantBusinessContext } from '../../types/assistant'
import AssistantLauncher from './AssistantLauncher'
import AssistantPanel from './AssistantPanel'
import './assistant.css'

interface MarketingAssistantProps {
  businessContext?: AssistantBusinessContext
}

export default function MarketingAssistant(props: MarketingAssistantProps) {
  return (
    <AssistantErrorBoundary>
      <MarketingAssistantContent {...props} />
    </AssistantErrorBoundary>
  )
}

function MarketingAssistantContent({ businessContext }: MarketingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const assistant = useMarketingAssistant(businessContext)
  const close = useCallback(() => {
    setIsOpen(false)
    setIsClosing(true)
    window.requestAnimationFrame(() => launcherRef.current?.focus())
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => setIsClosing(false), reduceMotion ? 0 : 180)
  }, [])

  const open = useCallback(() => {
    setIsClosing(false)
    setIsOpen(true)
  }, [])

  return (
    <aside className="mp-assistant-root" dir="rtl" aria-label="دستیار هوشمند بازاریابی">
      <AssistantLauncher buttonRef={launcherRef} onOpen={open} hidden={isOpen} />
      {(isOpen || isClosing) && (
          <AssistantPanel
            messages={assistant.messages}
            draft={assistant.draft}
            suggestions={assistant.suggestions}
            isLoading={assistant.isLoading}
            error={assistant.error}
            canRetry={assistant.canRetry}
            onDraftChange={assistant.setDraft}
            onSend={assistant.sendDraft}
            onSuggestion={assistant.sendSuggestion}
            onRetry={assistant.retry}
            onClear={assistant.clearConversation}
            onClose={close}
            isClosing={isClosing}
          />
      )}
    </aside>
  )
}

class AssistantErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Deliberately isolate assistant failures from the form and plan generator.
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

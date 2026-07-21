import { useEffect, useRef, type KeyboardEvent } from 'react'
import { MAX_ASSISTANT_MESSAGE_LENGTH } from '../../services/assistantApi'
import type { AssistantMessage as AssistantMessageType } from '../../types/assistant'
import AssistantMessage from './AssistantMessage'
import AssistantSuggestions from './AssistantSuggestions'

interface AssistantPanelProps {
  messages: AssistantMessageType[]
  draft: string
  suggestions: string[]
  isLoading: boolean
  error: string
  canRetry: boolean
  onDraftChange: (value: string) => void
  onSend: () => void
  onSuggestion: (question: string) => void
  onRetry: () => void
  onClear: () => void
  onClose: () => void
  isClosing?: boolean
}

export default function AssistantPanel(props: AssistantPanelProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [props.error, props.isLoading, props.messages])

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [props.onClose])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      props.onSend()
    }
  }

  const overLimit = props.draft.length > MAX_ASSISTANT_MESSAGE_LENGTH
  const showSuggestions = !props.isLoading && props.suggestions.length > 0

  return (
    <section
      id="mp-assistant-panel"
      className={`mp-assistant-panel ${props.isClosing ? 'mp-assistant-panel--closing' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="mp-assistant-title"
      aria-describedby="mp-assistant-description"
    >
      <header className="mp-assistant-panel__header">
        <div className="mp-assistant-panel__heading">
          <h2 id="mp-assistant-title" className="mp-assistant-panel__title">دستیار هوشمند بازاریابی</h2>
          <p id="mp-assistant-description" className="mp-assistant-panel__description">برای تصمیم‌های بازاریابی و تکمیل برنامه کنار شماست.</p>
        </div>
        <button className="mp-assistant-panel__close" type="button" onClick={props.onClose} aria-label="بستن دستیار">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="mp-assistant-panel__conversation" ref={scrollRef} aria-live="polite" aria-busy={props.isLoading}>
        {props.messages.length === 0 && (
          <div className="mp-assistant-empty">
            <div className="mp-assistant-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M5 5.75A2.75 2.75 0 0 1 7.75 3h8.5A2.75 2.75 0 0 1 19 5.75v6.5A2.75 2.75 0 0 1 16.25 15H11l-4.7 3.68A.8.8 0 0 1 5 18.05V15.2a2.75 2.75 0 0 1-2-2.65v-6.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M8 8.9h8M8 11.6h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </div>
            <strong className="mp-assistant-empty__title">از کجا شروع کنیم؟</strong>
            <span className="mp-assistant-empty__text">یک سؤال بنویسید یا یکی از پیشنهادهای زیر را انتخاب کنید.</span>
          </div>
        )}

        {props.messages.map((message) => <AssistantMessage key={message.id} message={message} />)}

        {props.isLoading && (
          <div className="mp-assistant-thinking" role="status">
            <div className="mp-assistant-thinking__dots" aria-hidden="true"><i /><i /><i /></div>
            <span>در حال آماده‌سازی یک پاسخ کاربردی برای شما...</span>
          </div>
        )}

        {props.error && (
          <div className="mp-assistant-error status-strip status-strip--danger" role="alert">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
              <path d="M12 8v4.5M12 16.2v.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <span>{props.error}</span>
            {props.canRetry && <button type="button" className="mp-assistant-error__retry" onClick={props.onRetry}>تلاش دوباره</button>}
          </div>
        )}

        {showSuggestions && (
          <AssistantSuggestions
            suggestions={props.messages.length === 0 ? props.suggestions : props.suggestions.slice(0, 3)}
            disabled={props.isLoading}
            onSelect={props.onSuggestion}
          />
        )}
      </div>

      <footer className="mp-assistant-panel__footer">
        <div className="mp-assistant-panel__composer">
          <label className="mp-assistant-sr-only" htmlFor="mp-assistant-input">سؤال شما</label>
          <textarea
            id="mp-assistant-input"
            ref={inputRef}
            className="mp-assistant-panel__input"
            rows={2}
            value={props.draft}
            disabled={props.isLoading}
            aria-invalid={overLimit || Boolean(props.error)}
            placeholder="سؤال بازاریابی خود را بنویسید..."
            onChange={(event) => props.onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="mp-assistant-panel__send"
            type="button"
            disabled={props.isLoading || !props.draft.trim() || overLimit}
            onClick={props.onSend}
            aria-label="ارسال سؤال"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
              <path d="m4 12 15.5-7-4.25 15-3.05-5.15L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="m12.2 14.85 3.05-3.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mp-assistant-panel__tools">
          <span className={`mp-assistant-panel__counter ${overLimit ? 'mp-assistant-panel__counter--error' : ''}`}>
            {props.draft.length.toLocaleString('fa-IR')} / {MAX_ASSISTANT_MESSAGE_LENGTH.toLocaleString('fa-IR')}
          </span>
          <span className="mp-assistant-panel__hint">Enter ارسال · Shift + Enter خط جدید</span>
          <button
            className="mp-assistant-panel__clear"
            type="button"
            onClick={props.onClear}
            disabled={props.isLoading || props.messages.length === 0}
          >
            پاک‌کردن گفتگو
          </button>
        </div>
      </footer>
    </section>
  )
}

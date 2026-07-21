import { Fragment, useState, type ReactNode } from 'react'
import type { AssistantMessage as AssistantMessageType } from '../../types/assistant'

interface AssistantMessageProps {
  message: AssistantMessageType
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false)

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className={`mp-assistant-message mp-assistant-message--${message.role}`}>
      <div className="mp-assistant-message__label">
        {message.role === 'assistant' ? 'دستیار' : 'شما'}
      </div>
      <div className="mp-assistant-message__bubble" dir="auto">
        {message.role === 'assistant' ? <SafeMarkdown text={message.content} /> : message.content}
      </div>
      {message.role === 'assistant' && (
        <button
          className="mp-assistant-message__copy"
          type="button"
          onClick={copyAnswer}
          aria-label="کپی پاسخ دستیار"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {copied ? 'کپی شد' : 'کپی پاسخ'}
        </button>
      )}
    </article>
  )
}

function SafeMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  return (
    <div className="mp-assistant-markdown">
      {lines.map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return <span className="mp-assistant-markdown__space" key={`space-${index}`} aria-hidden="true" />

        const heading = trimmed.match(/^#{1,3}\s+(.+)$/)
        if (heading) {
          return <strong className="mp-assistant-markdown__heading" key={`heading-${index}`}>{inlineMarkdown(heading[1])}</strong>
        }

        const bullet = trimmed.match(/^[-*•]\s+(.+)$/)
        if (bullet) {
          return (
            <span className="mp-assistant-markdown__item" key={`bullet-${index}`}>
              <span className="mp-assistant-markdown__bullet" aria-hidden="true" />
              <span>{inlineMarkdown(bullet[1])}</span>
            </span>
          )
        }

        const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/)
        if (numbered) {
          return (
            <span className="mp-assistant-markdown__item" key={`number-${index}`}>
              <span className="mp-assistant-markdown__number">{numbered[1]}.</span>
              <span>{inlineMarkdown(numbered[2])}</span>
            </span>
          )
        }

        return <span className="mp-assistant-markdown__line" key={`line-${index}`}>{inlineMarkdown(trimmed)}</span>
      })}
    </div>
  )
}

function inlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}

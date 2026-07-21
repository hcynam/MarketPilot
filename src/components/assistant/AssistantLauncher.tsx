import type { RefObject } from 'react'

interface AssistantLauncherProps {
  buttonRef?: RefObject<HTMLButtonElement | null>
  onOpen: () => void
  hidden?: boolean
}

export default function AssistantLauncher({ buttonRef, onOpen, hidden = false }: AssistantLauncherProps) {
  return (
    <button
      className={`mp-assistant-launcher ${hidden ? 'mp-assistant-launcher--hidden' : ''}`}
      ref={buttonRef}
      type="button"
      aria-controls="mp-assistant-panel"
      aria-expanded={hidden}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : 0}
      onClick={onOpen}
    >
      <span className="mp-assistant-launcher__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path d="M5.5 5.5h13a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.6 3v-3h-.9A2.5 2.5 0 0 1 3 15V8a2.5 2.5 0 0 1 2.5-2.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M7.5 12h2l1.5-2.5 2 5 1.5-2.5h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>دستیار هوشمند</span>
    </button>
  )
}

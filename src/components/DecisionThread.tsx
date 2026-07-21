import './DecisionThread.css'

export interface DecisionThreadStep {
  marker?: string
  label: string
  description?: string
}

interface Props {
  steps: DecisionThreadStep[]
  ariaLabel: string
  compact?: boolean
  className?: string
}

function DecisionThread({ steps, ariaLabel, compact = false, className = '' }: Props) {
  return (
    <ol
      className={`decision-thread ${compact ? 'decision-thread--compact' : ''} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {steps.map((step, index) => (
        <li key={`${step.label}-${index}`} className="decision-thread__step">
          <span className={`decision-thread__marker ${step.marker ? '' : 'decision-thread__marker--dot'}`} aria-hidden="true">
            {step.marker}
          </span>
          <span className="decision-thread__content">
            <strong className="decision-thread__label">{step.label}</strong>
            {step.description && <span className="decision-thread__description">{step.description}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default DecisionThread

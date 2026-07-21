interface AssistantSuggestionsProps {
  suggestions: string[]
  disabled: boolean
  onSelect: (suggestion: string) => void
}

export default function AssistantSuggestions({ suggestions, disabled, onSelect }: AssistantSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="mp-assistant-suggestions" aria-label="پرسش‌های پیشنهادی">
      {suggestions.map((suggestion) => (
        <button
          className="mp-assistant-suggestion"
          type="button"
          key={suggestion}
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

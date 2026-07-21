import { useCallback, useRef, useState } from 'react'
import { AssistantApiError, MAX_ASSISTANT_MESSAGE_LENGTH, requestMarketingAssistant } from '../services/assistantApi'
import type { AssistantBusinessContext, AssistantHistoryMessage, AssistantMessage } from '../types/assistant'

export const initialAssistantSuggestions = [
  'بازار هدفم را چطور دقیق‌تر انتخاب کنم؟',
  'برای کسب‌وکار من کدام کانال تبلیغاتی مناسب‌تر است؟',
  'KPIهای این برنامه را چطور اندازه‌گیری کنم؟',
  'چطور برنامه بازاریابی را اجرا کنم؟',
  'تفاوت پرسونای مشتری و بازار هدف چیست؟',
]

export function useMarketingAssistant(businessContext?: AssistantBusinessContext) {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [draft, setDraftState] = useState('')
  const [suggestions, setSuggestions] = useState(initialAssistantSuggestions)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [failedQuestion, setFailedQuestion] = useState('')
  const messageSequence = useRef(0)

  const createMessage = useCallback((role: AssistantMessage['role'], content: string): AssistantMessage => ({
    id: `${role}-${Date.now()}-${messageSequence.current++}`,
    role,
    content,
  }), [])

  const submitQuestion = useCallback(async (rawQuestion: string, appendUserMessage: boolean) => {
    if (isLoading) return
    const question = rawQuestion.trim()
    if (!question) {
      setError('لطفاً سؤال خود را بنویسید.')
      return
    }
    if (question.length > MAX_ASSISTANT_MESSAGE_LENGTH) {
      setError(`سؤال باید حداکثر ${MAX_ASSISTANT_MESSAGE_LENGTH.toLocaleString('fa-IR')} کاراکتر باشد.`)
      return
    }

    const previousMessages = appendUserMessage
      ? messages
      : messages[messages.length - 1]?.role === 'user'
        ? messages.slice(0, -1)
        : messages
    const history: AssistantHistoryMessage[] = previousMessages.slice(-6).map(({ role, content }) => ({ role, content }))

    setError('')
    setFailedQuestion('')
    setIsLoading(true)
    if (appendUserMessage) setMessages((current) => [...current, createMessage('user', question)])
    setDraftState('')

    try {
      const response = await requestMarketingAssistant({ message: question, history, businessContext })
      setMessages((current) => [...current, createMessage('assistant', response.answer)])
      setSuggestions(response.suggestions.length > 0 ? response.suggestions : initialAssistantSuggestions.slice(0, 3))
    } catch (requestError) {
      const message = requestError instanceof AssistantApiError
        ? requestError.message
        : 'در حال حاضر امکان دریافت پاسخ وجود ندارد. لطفاً دوباره تلاش کنید.'
      setError(message)
      setFailedQuestion(question)
    } finally {
      setIsLoading(false)
    }
  }, [businessContext, createMessage, isLoading, messages])

  const sendDraft = useCallback(() => submitQuestion(draft, true), [draft, submitQuestion])
  const sendSuggestion = useCallback((question: string) => submitQuestion(question, true), [submitQuestion])
  const retry = useCallback(() => {
    if (failedQuestion) return submitQuestion(failedQuestion, false)
  }, [failedQuestion, submitQuestion])

  const setDraft = useCallback((value: string) => {
    setDraftState(value)
    if (error) setError('')
  }, [error])

  const clearConversation = useCallback(() => {
    setMessages([])
    setDraftState('')
    setSuggestions(initialAssistantSuggestions)
    setError('')
    setFailedQuestion('')
  }, [])

  return {
    messages,
    draft,
    suggestions,
    isLoading,
    error,
    canRetry: Boolean(failedQuestion),
    setDraft,
    sendDraft,
    sendSuggestion,
    retry,
    clearConversation,
  }
}

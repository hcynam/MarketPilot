import { useState } from 'react'
import type { ClarifyingQuestion, ClarifyingQuestionsResponse } from '../../netlify/functions/_shared/marketingSchemas'
import './ClarifyingQuestionsPanel.css'

export type ClarifyingAnswers = Record<string, string | string[]>

interface Props {
  response: ClarifyingQuestionsResponse
  busy?: boolean
  onSubmit: (answers: ClarifyingAnswers) => void | Promise<void>
  onBackToForm: () => void
}

const priorityLabels: Record<ClarifyingQuestion['priority'], string> = {
  high: 'اولویت بالا',
  medium: 'اولویت متوسط',
  low: 'اولویت پایین',
}

const impactLabels: Record<ClarifyingQuestion['decisionImpact'], string> = {
  segmentation: 'بخش‌بندی',
  positioning: 'جایگاه‌یابی',
  channel: 'کانال',
  pricing: 'قیمت',
  kpi: 'KPI',
  budget: 'بودجه',
  funnel: 'قیف',
  competition: 'رقابت',
  customer: 'مشتری',
  offer: 'پیشنهاد',
  other: 'سایر',
}

function ClarifyingQuestionsPanel({ response, busy = false, onSubmit, onBackToForm }: Props) {
  const [answers, setAnswers] = useState<ClarifyingAnswers>({})
  const [showValidation, setShowValidation] = useState(false)

  const missingRequired = response.requiredQuestions.filter((question) => !hasAnswer(answers[question.id]))
  const canSubmit = missingRequired.length === 0 && !busy

  const updateAnswer = (id: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = () => {
    if (!canSubmit) {
      setShowValidation(true)
      return
    }

    onSubmit(answers)
  }

  return (
    <section className="clarify" aria-labelledby="clarify-title">
      <div className="container">
        <div className="clarify__panel">
          <div className="clarify__header">
            <div>
              <span className="clarify__eyebrow">مرحله تکمیلی هوش مصنوعی</span>
              <h2 id="clarify-title" className="clarify__title">
                برای ساخت یک برنامه دقیق‌تر، چند سؤال تکمیلی لازم است.
              </h2>
            </div>
            <div className="clarify__score">
              <strong>{response.inputQualityScore}</strong>
              <span>کیفیت ورودی</span>
            </div>
          </div>

          <p className="clarify__diagnosis">{response.diagnosis}</p>

          {(response.missingInformation.length > 0 || response.assumptionsIfProceeding.length > 0) && (
            <div className="clarify__meta-grid">
              {response.missingInformation.length > 0 && (
                <div className="clarify__meta">
                  <h3>اطلاعات ناقص</h3>
                  <ul>
                    {response.missingInformation.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {response.assumptionsIfProceeding.length > 0 && (
                <div className="clarify__meta">
                  <h3>فرضیات در صورت ادامه</h3>
                  <ul>
                    {response.assumptionsIfProceeding.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <QuestionGroup
            title="سؤال‌های ضروری"
            questions={response.requiredQuestions}
            answers={answers}
            showValidation={showValidation}
            onChange={updateAnswer}
          />

          {response.optionalQuestions.length > 0 && (
            <QuestionGroup
              title="سؤال‌های اختیاری"
              questions={response.optionalQuestions}
              answers={answers}
              showValidation={showValidation}
              onChange={updateAnswer}
            />
          )}

          {showValidation && missingRequired.length > 0 && (
            <div className="clarify__validation" role="alert">
              لطفاً به سؤال‌های الزامی پاسخ دهید.
            </div>
          )}

          <div className="clarify__actions">
            <button className="clarify__btn clarify__btn--secondary" type="button" onClick={onBackToForm} disabled={busy}>
              بازگشت و ویرایش فرم
            </button>
            <button className="clarify__btn clarify__btn--primary" type="button" onClick={handleSubmit} disabled={busy}>
              {busy ? 'در حال تولید برنامه نهایی...' : 'تولید برنامه نهایی با پاسخ‌ها'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function QuestionGroup({
  title,
  questions,
  answers,
  showValidation,
  onChange,
}: {
  title: string
  questions: ClarifyingQuestion[]
  answers: ClarifyingAnswers
  showValidation: boolean
  onChange: (id: string, value: string | string[]) => void
}) {
  if (questions.length === 0) return null

  return (
    <div className="clarify__group">
      <h3 className="clarify__group-title">{title}</h3>
      <div className="clarify__questions">
        {questions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            value={answers[question.id]}
            showValidation={showValidation}
            onChange={(value) => onChange(question.id, value)}
          />
        ))}
      </div>
    </div>
  )
}

function QuestionField({
  question,
  value,
  showValidation,
  onChange,
}: {
  question: ClarifyingQuestion
  value: string | string[] | undefined
  showValidation: boolean
  onChange: (value: string | string[]) => void
}) {
  const invalid = question.required && showValidation && !hasAnswer(value)

  return (
    <div className={`clarify__question ${invalid ? 'clarify__question--invalid' : ''}`}>
      <div className="clarify__question-head">
        <h3>
          {question.question}
          {question.required && <span className="clarify__required"> *</span>}
        </h3>
        <div className="clarify__tags">
          <span>{priorityLabels[question.priority]}</span>
          <span>{impactLabels[question.decisionImpact]}</span>
        </div>
      </div>
      <p className="clarify__why">{question.whyItMatters}</p>
      <QuestionInput question={question} value={value} onChange={onChange} />
      {invalid && <div className="clarify__field-error">پاسخ به این سؤال الزامی است.</div>}
    </div>
  )
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: ClarifyingQuestion
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}) {
  if (question.expectedAnswerType === 'multiChoice') {
    const selected = Array.isArray(value) ? value : []
    return (
      <div className="clarify__options">
        {(question.options ?? []).map((option) => (
          <label key={option} className="clarify__option">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) => {
                const next = event.target.checked
                  ? [...selected, option]
                  : selected.filter((item) => item !== option)
                onChange(next)
              }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    )
  }

  if (question.expectedAnswerType === 'choice') {
    return (
      <select
        className="clarify__select"
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">انتخاب کنید</option>
        {(question.options ?? []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    )
  }

  if (question.expectedAnswerType === 'number') {
    return (
      <input
        className="clarify__input"
        type="number"
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  return (
    <textarea
      className="clarify__textarea"
      rows={3}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function hasAnswer(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'string' && value.trim().length > 0
}

export default ClarifyingQuestionsPanel

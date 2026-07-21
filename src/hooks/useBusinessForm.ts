import { useState, useCallback, useEffect } from 'react'
import type { BusinessInput } from '../types'
import { defaultBusinessInput, STORAGE_KEY } from '../types'
import { sampleBusiness } from '../data/sample'
import {
  builtInSampleOrigin,
  originAfterMeaningfulEdit,
  userInputOrigin,
  type BusinessInputOrigin,
} from '../ai/sampleState'

interface FormErrors {
  [key: string]: string
}

function loadDraft(): BusinessInput {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BusinessInput>
      const draft = { ...defaultBusinessInput, ...parsed }
      if (isSampleCaseDraft(draft)) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        return { ...draft, availableChannels: [...(draft.availableChannels ?? [])] }
      }
    }
  } catch { /* ignore corrupted data */ }
  return { ...defaultBusinessInput }
}

function isDefaultDraft(data: BusinessInput): boolean {
  const fields = Object.keys(defaultBusinessInput) as (keyof BusinessInput)[]
  return fields.every((field) => JSON.stringify(data[field]) === JSON.stringify(defaultBusinessInput[field]))
}

function isSampleCaseDraft(data: BusinessInput): boolean {
  const fields = Object.keys(defaultBusinessInput) as (keyof BusinessInput)[]
  return fields.every((field) => JSON.stringify(data[field]) === JSON.stringify(sampleBusiness[field]))
}

function saveDraft(data: BusinessInput) {
  try {
    if (isDefaultDraft(data) || isSampleCaseDraft(data)) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* storage full or unavailable */ }
}

export function useBusinessForm() {
  const [data, setData] = useState<BusinessInput>(loadDraft)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [origin, setOrigin] = useState<BusinessInputOrigin>(userInputOrigin)

  useEffect(() => {
    saveDraft(data)
  }, [data])

  const updateField = useCallback(<K extends keyof BusinessInput>(
    field: K,
    value: BusinessInput[K],
  ) => {
    const changed = JSON.stringify(data[field]) !== JSON.stringify(value)
    setData(prev => ({ ...prev, [field]: value }))
    setOrigin(current => originAfterMeaningfulEdit(current, changed))
    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [data])

  const markTouched = useCallback((field: string) => {
    setTouched(prev => new Set(prev).add(field))
  }, [])

  const loadSample = useCallback(() => {
    setData({ ...sampleBusiness, availableChannels: [...sampleBusiness.availableChannels] })
    setOrigin(builtInSampleOrigin)
    setErrors({})
    setTouched(new Set())
  }, [])

  const clearForm = useCallback(() => {
    setData({ ...defaultBusinessInput })
    setOrigin(userInputOrigin)
    setErrors({})
    setTouched(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const validate = useCallback((): boolean => {
    const errs: FormErrors = {}
    const allFields = Object.keys(defaultBusinessInput) as (keyof BusinessInput)[]
    const touchAll = new Set<string>(allFields)
    setTouched(touchAll)

    if (!data.businessName.trim()) errs.businessName = 'نام کسب‌وکار یا محصول الزامی است'
    if (!data.productDescription.trim()) errs.productDescription = 'توضیح محصول یا خدمت الزامی است'
    if (!data.targetCustomerGuess.trim()) errs.targetCustomerGuess = 'تعریف مشتری هدف الزامی است'
    if (!data.mainCustomerProblem.trim()) errs.mainCustomerProblem = 'مسئله اصلی مشتری الزامی است'
    if (!data.competitors.trim()) errs.competitors = 'معرفی رقبا یا جایگزین‌ها الزامی است'
    if (!data.keyDifferentiation.trim()) errs.keyDifferentiation = 'تمایز کلیدی الزامی است'
    if (!data.currentPrice.trim()) errs.currentPrice = 'اطلاعات قیمت الزامی است'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [data])

  const getFieldError = useCallback(
    (field: keyof BusinessInput): string | undefined => {
      return touched.has(field) ? errors[field] : undefined
    },
    [errors, touched],
  )

  return {
    data,
    origin,
    errors,
    touched,
    updateField,
    markTouched,
    loadSample,
    clearForm,
    validate,
    getFieldError,
  }
}

import type { BusinessInput } from '../types'

export interface UseBusinessFormReturn {
  data: BusinessInput
  errors: Record<string, string>
  touched: Set<string>
  updateField: <K extends keyof BusinessInput>(field: K, value: BusinessInput[K]) => void
  markTouched: (field: string) => void
  loadSample: () => void
  clearForm: () => void
  validate: () => boolean
  getFieldError: (field: keyof BusinessInput) => string | undefined
}

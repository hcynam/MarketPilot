import type { BusinessInput } from '../types'
import type { BusinessInputOrigin } from '../ai/sampleState'

export interface UseBusinessFormReturn {
  data: BusinessInput
  origin: BusinessInputOrigin
  errors: Record<string, string>
  touched: Set<string>
  updateField: <K extends keyof BusinessInput>(field: K, value: BusinessInput[K]) => void
  markTouched: (field: string) => void
  loadSample: () => void
  clearForm: () => void
  validate: () => boolean
  getFieldError: (field: keyof BusinessInput) => string | undefined
}

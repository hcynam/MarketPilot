export type BusinessInputSource = 'user' | 'built_in_sample'

export interface BusinessInputOrigin {
  source: BusinessInputSource
  skipClarification: boolean
}

export const userInputOrigin: BusinessInputOrigin = {
  source: 'user',
  skipClarification: false,
}

export const builtInSampleOrigin: BusinessInputOrigin = {
  source: 'built_in_sample',
  skipClarification: true,
}

export function originAfterMeaningfulEdit(
  origin: BusinessInputOrigin,
  valueChanged: boolean,
): BusinessInputOrigin {
  if (!valueChanged || origin.source === 'user') return origin
  return userInputOrigin
}

import type { RegistrationInput } from './types'

export type FieldErrors = Record<string, string>

const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit)
    return String(persianIndex >= 0 ? persianIndex : arabicDigits.indexOf(digit))
  })
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isValidEmail(value: string): boolean {
  const normalized = normalizeEmail(value)
  return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(normalized)
}

export function normalizePhone(countryCode: string, value: string): string {
  const cleaned = toLatinDigits(value).trim().replace(/[\s()-]/g, '')
  if (cleaned.startsWith('+')) return `+${cleaned.slice(1).replace(/\D/g, '')}`
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2).replace(/\D/g, '')}`

  const normalizedCountry = `+${toLatinDigits(countryCode).replace(/\D/g, '')}`
  let national = cleaned.replace(/\D/g, '')
  if (national.startsWith('0')) national = national.slice(1)
  return `${normalizedCountry}${national}`
}

export function isValidPhone(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

export function passwordError(value: string): string | null {
  if (value.length < 8) return 'رمز عبور باید دست‌کم ۸ نویسه داشته باشد.'
  if (!/\p{L}/u.test(value) || !/\d/u.test(toLatinDigits(value))) {
    return 'برای امنیت بهتر، از دست‌کم یک حرف و یک عدد استفاده کنید.'
  }
  return null
}

export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {}
  if (input.firstName.trim().length < 2) errors.firstName = 'نام را کامل وارد کنید.'
  if (input.lastName.trim().length < 2) errors.lastName = 'نام خانوادگی را کامل وارد کنید.'

  const phone = normalizePhone(input.countryCode, input.phone)
  if (!isValidPhone(phone)) errors.phone = 'شماره موبایل را همراه با پیش‌شماره درست وارد کنید.'

  if (!isValidEmail(input.email)) errors.email = 'یک ایمیل معتبر وارد کنید.'
  const passwordMessage = passwordError(input.password)
  if (passwordMessage) errors.password = passwordMessage
  if (input.password !== input.confirmPassword) errors.confirmPassword = 'تکرار رمز عبور با رمز اصلی یکسان نیست.'
  if (!input.termsAccepted) errors.termsAccepted = 'برای ساخت حساب، پذیرش شرایط استفاده و حریم خصوصی لازم است.'
  return errors
}

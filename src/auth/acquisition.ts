import type { AcquisitionSource } from './types'

const ACQUISITION_KEY = 'marketpilot-acquisition-v1'

export function captureAcquisitionSource(): AcquisitionSource {
  const fallback: AcquisitionSource = {
    landingPage: '/',
    referrer: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
  }

  if (typeof window === 'undefined') return fallback
  try {
    const existing = localStorage.getItem(ACQUISITION_KEY)
    if (existing) return JSON.parse(existing) as AcquisitionSource

    const url = new URL(window.location.href)
    const source: AcquisitionSource = {
      landingPage: `${url.pathname}${url.search}`,
      referrer: document.referrer || null,
      utmSource: url.searchParams.get('utm_source'),
      utmMedium: url.searchParams.get('utm_medium'),
      utmCampaign: url.searchParams.get('utm_campaign'),
      utmContent: url.searchParams.get('utm_content'),
      utmTerm: url.searchParams.get('utm_term'),
    }
    localStorage.setItem(ACQUISITION_KEY, JSON.stringify(source))
    return source
  } catch {
    return fallback
  }
}

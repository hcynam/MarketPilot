import type { BusinessInput } from '../types'

export function generatePricingRecommendation(input: BusinessInput): string {
  const parts: string[] = []

  parts.push(`Current Pricing: ${input.currentPrice || 'Not yet defined'}`)
  parts.push(`Pricing Model: ${input.pricingModel.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`)

  const pricingNotes: Record<string, string> = {
    freemium: 'Freemium model reduces adoption friction by offering core value at no cost. Monetization depends on converting free users to paid through feature limitations or usage caps.',
    subscription: 'Subscription model provides predictable recurring revenue. Annual billing options can improve cash flow and reduce churn.',
    'one-time': 'One-time purchase model is simple but lacks recurring revenue. Requires continuous new customer acquisition for growth.',
    'usage-based': 'Usage-based pricing aligns cost with value delivered. Scales naturally with customer success but can create revenue unpredictability.',
    tiered: 'Tiered plans allow customers to self-select based on needs and budget. Creates clear upgrade paths and revenue expansion opportunities.',
    custom: 'Custom/enterprise pricing allows maximum flexibility for large deals but requires sales effort for each agreement.',
    free: 'Free/ad-supported model requires scale for viability. Consider alternative monetization strategies.',
  }

  const note = pricingNotes[input.pricingModel]
  if (note) parts.push(`Analysis: ${note}`)

  if (input.abilityToPay === 'high') {
    parts.push('Given high ability to pay, consider premium pricing with enterprise-grade features and dedicated support tiers.')
  } else if (input.abilityToPay === 'low') {
    parts.push('Given price sensitivity, focus on low-cost tiers, volume pricing, or freemium with clear upgrade value.')
  } else {
    parts.push('Moderate ability to pay suggests competitive pricing with clear tier differentiation.')

  }

  if (input.discountOptions) {
    parts.push(`Discount Strategy: ${input.discountOptions}. These options help with customer acquisition and retention.`)
  }

  if (input.freeTrial) {
    parts.push('Free trial/demo is a strong conversion tool. Recommended trial duration: 7-14 days for B2B SaaS, 14-30 days for enterprise products.')
  }

  // Competitor-based recommendation
  if (input.competitors) {
    parts.push(
      `Competitive Context: ${input.competitors.split(',')[0]?.trim() || 'Competitors'} set a pricing benchmark. ${input.businessName} should price based on differentiated value rather than competing solely on price.`,
    )
  }

  return parts.join('\n')
}

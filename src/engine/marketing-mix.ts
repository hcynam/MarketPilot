import type { BusinessInput } from '../types'

export function generateMarketingMix(input: BusinessInput): Record<string, string> {
  return {
    Product: [
      `Core offering: ${input.productDescription || 'Product/service not yet fully described'}`,
      `Stage: ${input.currentStage.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      input.freeTrial ? 'Free trial/demo available to reduce adoption friction.' : 'No free trial currently offered — consider adding one to reduce adoption barriers.',
    ]
      .filter(Boolean)
      .join('. '),

    Price: [
      `Current pricing: ${input.currentPrice || 'Not yet defined'}`,
      `Model: ${input.pricingModel.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      input.discountOptions ? `Discounts: ${input.discountOptions}` : '',
      input.abilityToPay === 'high' ? 'Pricing positioned at premium level given enterprise ability to pay.' : input.abilityToPay === 'low' ? 'Pricing kept accessible to match customer price sensitivity.' : 'Pricing set at competitive market rates for SMB segment.',
    ]
      .filter(Boolean)
      .join('. '),

    Place: [
      input.businessType === 'saas-digital' ? 'Digital delivery via web platform and mobile-responsive interface.' : input.businessType === 'service-consulting-education' ? 'Service delivered through a combination of digital tools and personal interaction.' : 'Distributed through digital and physical channels.',
      input.geographicScope ? `Geographic availability: ${input.geographicScope}.` : 'Distribution: Primarily online/remote, enabling broad reach.',
      input.marketModel === 'B2B' ? 'B2B sales with direct outreach, demos, and partner channels.' : input.marketModel === 'B2C' ? 'B2C distribution through self-serve online channels.' : 'Dual distribution: direct B2B sales and self-serve B2C channels.',
    ].join(' '),

    Promotion: [
      `Primary marketing goal: ${input.marketingGoal.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      input.availableChannels.length > 0
        ? `Channel mix: ${input.availableChannels.map(c => c.replace('-', ' ')).join(', ')}`
        : 'Channel mix: Not yet defined — recommended to start with 2-3 core channels.',
      input.monthlyBudget ? `Budget: ${input.monthlyBudget}, allocated across selected channels based on expected ROI.` : 'Budget: Not yet allocated — recommend starting with a lean test budget of $500-$1,000/month.',
      `Phase-appropriate promotion: ${input.currentStage === 'idea' || input.currentStage === 'mvp' ? 'Focus on building awareness and testing messaging with early adopters through content marketing and social media.' : input.currentStage === 'early-sales' ? 'Shift toward lead generation and conversion optimization with targeted ads and email campaigns.' : 'Scale proven channels and invest in retention programs and referral systems.'}`,
    ].join(' '),

    People: [
      input.teamCapacity || 'Team: Not yet specified',
      input.abilityToPay === 'high' ? 'Enterprise customers expect dedicated account management and responsive support.' : 'Self-serve model with automated onboarding and community-based support.',
      `Customer-facing roles should be trained on ${input.productDescription ? input.productDescription.split('.')[0].toLowerCase() : 'the product'} to deliver informed, empathetic service.`,
    ].join('. '),

    Process: [
      `Customer journey: ${input.currentStage === 'idea' ? 'Awareness → Interest → Onboarding → Feedback Loop' : input.currentStage === 'early-sales' ? 'Awareness → Lead Capture → Demo → Purchase → Onboarding → Support' : 'Lead → Convert → Onboard → Retain → Upsell → Referral'}`,
      input.freeTrial ? 'Free trial/demo process with automated onboarding sequence and in-app guidance.' : 'Standard purchase process with onboarding support.',
      'Key processes to document: customer onboarding, support ticket handling, feedback collection, and escalation procedures.',
    ].join(' '),

    'Physical Evidence': [
      input.businessType === 'saas-digital'
        ? 'Digital touchpoints: website, app interface, email communications, documentation, and support portal. Brand consistency across all digital assets is critical.'
        : input.businessType === 'physical-product-store'
          ? 'Physical and digital evidence: product packaging, store experience, website, receipts, and customer communications.'
          : 'Service evidence: case studies, testimonials, portfolio, certifications, professional profiles, and digital presence.',
      input.currentStage === 'idea' || input.currentStage === 'mvp'
        ? 'At current stage, focus on building a professional MVP/landing page that communicates credibility despite limited brand history.'
        : 'Leverage existing customer results and case studies as social proof.',
    ].join(' '),
  }
}

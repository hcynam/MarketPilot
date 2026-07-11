import type { BusinessInput } from '../types'
import { funnelStages } from '../data/courseFramework'

export function generateFunnelJourney(input: BusinessInput): string[] {
  const goal = input.marketingGoal.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
  const channels = input.availableChannels.map(c => c.replace('-', ' '))

  const funnel: string[] = []

  funnelStages.forEach(stage => {
    switch (stage) {
      case 'Awareness':
        funnel.push(
          `Awareness: Potential customers discover ${input.businessName} through ${channels.length > 0 ? channels.slice(0, 3).join(', ') : 'initial marketing channels'}. ${input.marketingGoal === 'awareness' ? 'This is the primary goal stage — optimize for reach and impressions.' : 'Foundation stage for all downstream conversion.'}` +
            (input.urgencyLevel === 'critical' || input.urgencyLevel === 'high'
              ? ' High problem urgency means awareness campaigns can use pain-point-focused messaging.'
              : ' Moderate urgency requires educational content that builds recognition of the problem.'),
        )
        break
      case 'Interest':
        funnel.push(
          `Interest: Prospects engage with content — ${input.productDescription ? input.productDescription.split('.')[0].toLowerCase() : 'product information'}. ${input.businessType === 'saas-digital' ? 'Demos, case studies, and feature comparisons drive this stage.' : 'Portfolio samples, testimonials, and detailed service descriptions build interest.'}` +
            (input.freeTrial ? ' Free trial/demo availability significantly boosts interest conversion.' : ''),
        )
        break
      case 'Desire':
        funnel.push(
          `Desire: Prospects compare ${input.businessName} against alternatives including ${input.competitors ? input.competitors.split(',')[0]?.trim() : 'current solutions'}. ${input.keyDifferentiation ? `Key differentiator: ${input.keyDifferentiation.split('.')[0]}` : ''}. Social proof, testimonials, and ROI calculators are effective at this stage.`,
        )
        break
      case 'Action':
        funnel.push(
          `Action: Conversion event — ${goal === 'Leads' ? 'lead capture form, demo booking, or free trial signup' : goal === 'Sales' ? 'purchase, subscription activation, or contract signing' : goal === 'App Installs' ? 'app download and account creation' : goal === 'Retention' ? 'welcome completion and first value milestone' : goal === 'Referral' ? 'initial share or invitation sent' : 'desired conversion action'}. ` +
            `Pricing: ${input.currentPrice || 'TBD'}. ${input.freeTrial ? 'Free trial reduces friction at this critical stage.' : 'Consider adding a trial or money-back guarantee to reduce purchase risk.'}`,
        )
        break
      case 'Loyalty':
        funnel.push(
          `Loyalty: Post-purchase experience determines retention. ${input.teamCapacity ? `Team (${input.teamCapacity})` : 'Team'} should focus on onboarding success, responsive support, and regular check-ins. ${input.marketingGoal === 'retention' ? 'Retention is the primary goal — invest in customer success and engagement programs.' : 'Build loyalty programs and community features to encourage repeat engagement.'}`,
        )
        break
      case 'Advocacy':
        funnel.push(
          `Advocacy: Satisfied customers become promoters through ${channels.includes('referral') ? 'referral programs, ' : ''}testimonials, case studies, and user communities. ${input.marketingGoal === 'referral' ? 'Referral/viral growth is the primary goal — incentivize sharing and word-of-mouth.' : 'Encourage reviews and user-generated content to build social proof for the awareness stage.'}`,
        )
        break
    }
  })

  return funnel
}

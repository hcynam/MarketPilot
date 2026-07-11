import type { BusinessInput, AvailableChannel } from '../types'
import { channelFunnelMap } from '../data/courseFramework'

const channelDescriptions: Record<AvailableChannel, { bestFor: string; tactic: string; budgetNote: string }> = {
  website: { bestFor: 'central hub for all funnel stages', tactic: 'Optimize landing pages for clear value proposition and conversion paths', budgetNote: 'Core investment — allocate 10-15% of budget for ongoing optimization' },
  seo: { bestFor: 'Awareness and Interest — organic discovery', tactic: 'Create content targeting problem-awareness keywords and solution comparisons', budgetNote: 'Long-term investment — see results in 3-6 months. Allocate 15-20% of budget.' },
  'content-marketing': { bestFor: 'Interest and Loyalty — education and authority building', tactic: 'Publish case studies, how-to guides, comparison articles, and thought leadership', budgetNote: 'High ROI over time. Allocate 20-25% of budget if content is primary.' },
  'social-media': { bestFor: 'Awareness and Advocacy — brand building and community', tactic: 'Share insights, engage with industry conversations, run targeted ad campaigns', budgetNote: 'Organic is low-cost. Paid social allocate 15-20% of budget.' },
  email: { bestFor: 'Interest, Desire, Action, Loyalty — nurturing and conversion', tactic: 'Drip sequences for leads, onboarding sequences for customers, re-engagement campaigns', budgetNote: 'Very cost-effective. Allocate 5-10% of budget.' },
  mobile: { bestFor: 'Ongoing engagement and retention', tactic: 'Push notifications, in-app messages, mobile-optimized experience', budgetNote: 'Development cost upfront. Marketing allocation 5-10%.' },
  influencer: { bestFor: 'Awareness and Desire — third-party credibility', tactic: 'Partner with industry analysts, thought leaders, and niche influencers for reviews and mentions', budgetNote: 'Varies widely. Start with micro-influencers — allocate 10-15% of budget.' },
  referral: { bestFor: 'Desire and Advocacy — trusted recommendations', tactic: 'Build a referral program with incentives for both referrer and new customer', budgetNote: 'Performance-based — allocate 5-10% for rewards infrastructure.' },
  ppc: { bestFor: 'Awareness, Interest, Action — targeted immediate traffic', tactic: 'Search ads for solution-intent keywords, display ads for retargeting', budgetNote: 'Requires ongoing investment. Allocate 20-30% of budget for test phase.' },
  offline: { bestFor: 'Awareness and Desire — in-person credibility', tactic: 'Industry events, meetups, conferences, networking', budgetNote: 'High cost per touch. Allocate 10-15% if events are strategic.' },
  other: { bestFor: 'Niche or specific channels', tactic: 'Evaluate and document channel performance for future optimization', budgetNote: 'Test with minimal budget before scaling.' },
}

export function generateChannelStrategy(input: BusinessInput): string[] {
  const selected = input.availableChannels
  const strategies: string[] = []

  if (selected.length === 0) {
    strategies.push('No channels selected. Recommendation: Start with website + 1-2 additional channels aligned with the primary marketing goal. Test for 30 days before expanding.')
    return strategies
  }

  const goalStageMap: Record<string, string> = {
    awareness: 'Awareness',
    leads: 'Interest',
    sales: 'Action',
    'app-installs': 'Action',
    retention: 'Loyalty',
    referral: 'Advocacy',
  }

  const primaryStage = goalStageMap[input.marketingGoal] || 'Awareness'

  strategies.push(
    `Channel-Funnel Strategy (Primary Goal: ${input.marketingGoal.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} — focus stage: ${primaryStage}):`,
  )

  selected.forEach(ch => {
    const desc = channelDescriptions[ch]
    const funnelFit = channelFunnelMap[ch]
    const isPrimaryFit = funnelFit.includes(primaryStage)
    strategies.push(
      `${ch.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${desc.bestFor}. ${desc.tactic}. ${isPrimaryFit ? '✓ Aligns with primary marketing goal stage.' : 'Supports other funnel stages.'} ${desc.budgetNote}.`,
    )
  })

  // Summary recommendation
  const prioritized = selected
    .filter(ch => channelFunnelMap[ch].includes(primaryStage))
    .map(ch => ch.replace('-', ' '))

  if (prioritized.length > 0) {
    strategies.push(
      `Priority Channels for ${primaryStage} Stage: ${prioritized.join(', ')}. These channels directly support the primary marketing goal and should receive the majority of budget and effort.`,
    )
  }

  if (input.monthlyBudget) {
    strategies.push(
      `Budget Allocation: With ${input.monthlyBudget}, recommend allocating 50-60% to the top 2 priority channels, 20-30% to testing secondary channels, and 10-20% for experimental channels.`,
    )
  }

  return strategies
}

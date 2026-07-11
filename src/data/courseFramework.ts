import type { BusinessStage, AvailableChannel } from '../types'

export const customerDevelopmentMap: Record<BusinessStage, string> = {
  idea: 'Customer Discovery',
  mvp: 'Customer Validation',
  'early-sales': 'Customer Creation',
  growth: 'Company Building',
  mature: 'Company Building',
}

export const segmentationDimensions = [
  'Geographic',
  'Demographic / Firmographic',
  'Psychographic',
  'Behavioral',
  'Profitability / Ability to Pay',
] as const

export const funnelStages = [
  'Awareness',
  'Interest',
  'Desire',
  'Action',
  'Loyalty',
  'Advocacy',
] as const

export const channelFunnelMap: Record<AvailableChannel, string[]> = {
  website: ['Awareness', 'Interest', 'Action'],
  seo: ['Awareness', 'Interest'],
  'content-marketing': ['Awareness', 'Interest', 'Loyalty'],
  'social-media': ['Awareness', 'Interest', 'Advocacy'],
  email: ['Interest', 'Desire', 'Action', 'Loyalty'],
  mobile: ['Interest', 'Desire', 'Action', 'Loyalty'],
  influencer: ['Awareness', 'Interest', 'Desire'],
  referral: ['Awareness', 'Desire', 'Advocacy'],
  ppc: ['Awareness', 'Interest', 'Action'],
  offline: ['Awareness', 'Desire', 'Action'],
  other: ['Awareness'],
}

export const qualityCriteria: { id: string; label: string; description: string }[] = [
  { id: 'target-market', label: 'Clear Target Market', description: 'Identifies a specific, addressable target market' },
  { id: 'personas', label: 'Specific Personas', description: 'Defines detailed customer personas with real context' },
  { id: 'usp', label: 'Non-Generic USP', description: 'USP differentiates meaningfully from alternatives' },
  { id: 'channel-funnel', label: 'Channel-Funnel Alignment', description: 'Channels map to appropriate funnel stages' },
  { id: 'kpis', label: 'Measurable KPIs', description: 'KPIs are specific, relevant, and measurable' },
  { id: 'action-plan', label: 'Practical 30-Day Plan', description: 'Action plan is realistic given budget and team' },
  { id: 'risks', label: 'Explicit Risks and Assumptions', description: 'Key assumptions and risks are clearly documented' },
]

export const metricDefinitions: Record<string, string> = {
  CTR: 'Click-Through Rate — percentage of users who click on a call-to-action out of total viewers',
  'Conversion Rate': 'Percentage of users who complete a desired action (purchase, signup, etc.)',
  CPL: 'Cost Per Lead — total marketing spend divided by number of leads generated',
  CAC: 'Customer Acquisition Cost — total sales and marketing cost divided by number of new customers',
  ROI: 'Return on Investment — (net profit / cost of investment) × 100',
  CPV: 'Cost Per View — total ad spend divided by number of views (video campaigns)',
  CPE: 'Cost Per Engagement — total ad spend divided by number of engagements',
  CPI: 'Cost Per Install — total ad spend divided by number of app installs',
  CPF: 'Cost Per Follow — total ad spend divided by number of new followers',
  eCPM: 'Effective Cost Per Mille — total earnings per 1,000 impressions',
}

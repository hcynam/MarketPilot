import type { MarketingGoal } from '../types'

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'

export interface KpiDefinition {
  id: string
  metric: string
  funnelStage: string
  formula: string
  frequency: string
  priority: Priority
  benchmarkNote: string
  relevantGoals: MarketingGoal[]
}

export const kpiDefinitions: Record<string, KpiDefinition> = {
  'CTR (Click-Through Rate)': {
    id: 'ctr',
    metric: 'CTR (Click-Through Rate)',
    funnelStage: 'Awareness',
    formula: 'Clicks / Impressions × 100',
    frequency: 'Weekly',
    priority: 'High',
    benchmarkNote: 'Industry avg: 2-3%',
    relevantGoals: ['awareness', 'leads', 'app-installs'],
  },
  'Conversion Rate': {
    id: 'conversion-rate',
    metric: 'Conversion Rate',
    funnelStage: 'Action',
    formula: 'Conversions / Total Visitors × 100',
    frequency: 'Weekly',
    priority: 'Critical',
    benchmarkNote: 'B2C avg: 2-3%, B2B avg: 1-3%',
    relevantGoals: ['leads', 'sales', 'app-installs'],
  },
  'CPL (Cost Per Lead)': {
    id: 'cpl',
    metric: 'CPL (Cost Per Lead)',
    funnelStage: 'Interest',
    formula: 'Total Marketing Spend / Number of Leads',
    frequency: 'Monthly',
    priority: 'High',
    benchmarkNote: 'B2C: $5-20, B2B: $30-150',
    relevantGoals: ['leads', 'sales'],
  },
  'CAC (Customer Acquisition Cost)': {
    id: 'cac',
    metric: 'CAC (Customer Acquisition Cost)',
    funnelStage: 'Action',
    formula: 'Total Sales & Marketing Cost / New Customers',
    frequency: 'Monthly',
    priority: 'Critical',
    benchmarkNote: 'Target varies by industry and LTV',
    relevantGoals: ['sales', 'retention'],
  },
  'ROI (Return on Investment)': {
    id: 'roi',
    metric: 'ROI (Return on Investment)',
    funnelStage: 'Action',
    formula: '(Net Profit - Cost of Investment) / Cost of Investment × 100',
    frequency: 'Monthly',
    priority: 'Critical',
    benchmarkNote: 'Target: 3:1 — 5:1, minimum: 2:1',
    relevantGoals: ['sales', 'leads', 'awareness', 'retention'],
  },
  'Customer LTV (Lifetime Value)': {
    id: 'ltv',
    metric: 'Customer LTV (Lifetime Value)',
    funnelStage: 'Loyalty',
    formula: 'Average Purchase Value × Purchase Frequency × Customer Lifespan',
    frequency: 'Quarterly',
    priority: 'High',
    benchmarkNote: 'LTV:CAC ratio target: 3:1',
    relevantGoals: ['retention', 'sales'],
  },
  'CPI (Cost Per Install)': {
    id: 'cpi',
    metric: 'CPI (Cost Per Install)',
    funnelStage: 'Action',
    formula: 'Total Ad Spend / Number of Installs',
    frequency: 'Weekly',
    priority: 'High',
    benchmarkNote: '$1-5 estimated, varies by platform',
    relevantGoals: ['app-installs'],
  },
  'eCPM (Effective Cost Per Mille)': {
    id: 'ecpm',
    metric: 'eCPM (Effective Cost Per Mille)',
    funnelStage: 'Awareness',
    formula: 'Total Earnings / Impressions × 1,000',
    frequency: 'Weekly',
    priority: 'Medium',
    benchmarkNote: 'Target: $5-15, varies by platform',
    relevantGoals: ['awareness'],
  },
  'Retention Rate': {
    id: 'retention',
    metric: 'Retention Rate',
    funnelStage: 'Loyalty',
    formula: 'Customers at End of Period / Customers at Start × 100',
    frequency: 'Monthly',
    priority: 'Critical',
    benchmarkNote: 'SaaS target: 90%+ monthly, 80%+ annual',
    relevantGoals: ['retention'],
  },
  'Referral Rate': {
    id: 'referral-rate',
    metric: 'Referral Rate',
    funnelStage: 'Advocacy',
    formula: 'Number of Referrals / Total Customers × 100',
    frequency: 'Monthly',
    priority: 'Medium',
    benchmarkNote: 'Target: 5-15% of customers',
    relevantGoals: ['referral'],
  },
  'CPE (Cost Per Engagement)': {
    id: 'cpe',
    metric: 'CPE (Cost Per Engagement)',
    funnelStage: 'Interest',
    formula: 'Total Ad Spend / Number of Engagements',
    frequency: 'Weekly',
    priority: 'Medium',
    benchmarkNote: 'Varies by platform and format',
    relevantGoals: ['awareness'],
  },
  'CPV (Cost Per View)': {
    id: 'cpv',
    metric: 'CPV (Cost Per View)',
    funnelStage: 'Awareness',
    formula: 'Total Video Ad Spend / Number of Views',
    frequency: 'Weekly',
    priority: 'Medium',
    benchmarkNote: '$0.01-0.03 per view typical',
    relevantGoals: ['awareness'],
  },
  'Engagement Rate': {
    id: 'engagement-rate',
    metric: 'Engagement Rate',
    funnelStage: 'Interest',
    formula: 'Total Engagements / Total Impressions × 100',
    frequency: 'Weekly',
    priority: 'Medium',
    benchmarkNote: 'Varies by platform, typically 1-5%',
    relevantGoals: ['awareness', 'retention'],
  },
  'Churn Rate': {
    id: 'churn-rate',
    metric: 'Churn Rate',
    funnelStage: 'Loyalty',
    formula: 'Customers Lost / Customers at Start × 100',
    frequency: 'Monthly',
    priority: 'Critical',
    benchmarkNote: 'SaaS target: <5% monthly churn',
    relevantGoals: ['retention'],
  },
}

export function getRelevantGoalLabel(goal: MarketingGoal): string {
  const labels: Record<MarketingGoal, string> = {
    awareness: 'Brand Awareness',
    leads: 'Lead Generation',
    sales: 'Direct Sales',
    'app-installs': 'App Installs',
    retention: 'Customer Retention',
    referral: 'Referral / Viral',
  }
  return labels[goal]
}

export function getGoalPriorityKpis(goal: MarketingGoal): string[] {
  const map: Record<MarketingGoal, string[]> = {
    awareness: [
      'eCPM (Effective Cost Per Mille)',
      'CPE (Cost Per Engagement)',
      'CTR (Click-Through Rate)',
      'Engagement Rate',
      'ROI (Return on Investment)',
    ],
    leads: [
      'CTR (Click-Through Rate)',
      'Conversion Rate',
      'CPL (Cost Per Lead)',
      'CAC (Customer Acquisition Cost)',
      'ROI (Return on Investment)',
    ],
    sales: [
      'Conversion Rate',
      'CAC (Customer Acquisition Cost)',
      'ROI (Return on Investment)',
      'Customer LTV (Lifetime Value)',
    ],
    'app-installs': [
      'CPI (Cost Per Install)',
      'CTR (Click-Through Rate)',
      'Conversion Rate',
      'Retention Rate',
    ],
    retention: [
      'Retention Rate',
      'Customer LTV (Lifetime Value)',
      'Churn Rate',
      'CAC (Customer Acquisition Cost)',
    ],
    referral: [
      'Referral Rate',
      'CAC (Customer Acquisition Cost)',
      'Conversion Rate',
      'ROI (Return on Investment)',
    ],
  }
  return map[goal] ?? []
}

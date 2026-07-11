import type { BusinessInput, KPI } from '../types'
import { getGoalPriorityKpis } from '../data/kpiFramework'

function parseBudget(budget: string): number {
  if (!budget) return 0
  const digits = budget.replace(/[^0-9]/g, '')
  return parseInt(digits, 10) || 0
}

function stageScale(stage: string): string {
  switch (stage) {
    case 'idea': return 'early'
    case 'mvp': return 'early'
    case 'early-sales': return 'growth'
    case 'growth': return 'growth'
    case 'mature': return 'mature'
    default: return 'early'
  }
}

function isSaaS(input: BusinessInput): boolean {
  return input.businessType === 'saas-digital'
}

function isB2C(input: BusinessInput): boolean {
  return input.marketModel === 'B2C'
}

function hasChannel(input: BusinessInput, ...channels: string[]): boolean {
  return channels.some((c) => input.availableChannels.includes(c as any))
}

export function generateKPIDashboard(input: BusinessInput): KPI[] {
  const goal = input.marketingGoal
  const stage = input.currentStage
  const budget = parseBudget(input.monthlyBudget)
  const scale = stageScale(stage)
  const prioritizedMetrics = getGoalPriorityKpis(goal)

  const kpis: KPI[] = []

  // Build KPI entries based on goal-specific metric list
  prioritizedMetrics.forEach((metric) => {
    const kpi = buildKpi(metric, input, scale, budget)
    if (kpi) kpis.push(kpi)
  })

  // Add extra contextually relevant KPIs (with dedup guards)
  if (goal === 'leads' && (isSaaS(input) || stage === 'growth')) {
    if (!kpis.find((k) => k.metric === 'Customer LTV (Lifetime Value)')) {
      kpis.push(buildKpi('Customer LTV (Lifetime Value)', input, scale, budget)!)
    }
  }
  if (goal === 'app-installs' && !kpis.find((k) => k.metric === 'Retention Rate')) {
    kpis.push(buildKpi('Retention Rate', input, scale, budget)!)
  }
  if (goal === 'awareness' && hasChannel(input, 'social-media', 'ppc')) {
    if (!kpis.find((k) => k.metric === 'CPV (Cost Per View)')) {
      const cpv = buildKpi('CPV (Cost Per View)', input, scale, budget)
      if (cpv) kpis.push(cpv)
    }
  }

  // Deduplication: keep first occurrence (highest priority)
  const seen = new Set<string>()
  const deduped: KPI[] = []
  for (const kpi of kpis) {
    if (!seen.has(kpi.metric)) {
      seen.add(kpi.metric)
      deduped.push(kpi)
    }
  }

  return deduped
}

function buildKpi(metric: string, input: BusinessInput, scale: string, budget: number): KPI | null {
  const { marketingGoal: goal, businessName, freeTrial, abilityToPay } = input
  const b2c = isB2C(input)
  const saas = isSaaS(input)

  switch (metric) {
    case 'CTR (Click-Through Rate)': {
      const value = scale === 'early' ? '1.5-3%' : scale === 'growth' ? '2-4%' : '3-5%'
      return {
        metric,
        value,
        benchmark: 'Industry avg: 2-3%',
        interpretation: `${businessName} should target ${value} CTR by refining ad creative and audience targeting.`,
      }
    }
    case 'Conversion Rate': {
      const value = scale === 'early' ? '0.5-1.5%' : scale === 'growth' ? '(1-3%)' : '2-5%'
      const bench = b2c ? 'B2C avg: 2-3%' : 'B2B avg: 1-3%'
      const tip = freeTrial
        ? 'Free trial availability should boost conversion.'
        : 'Consider offering a free trial or demo.'
      return {
        metric,
        value,
        benchmark: bench,
        interpretation: `${tip} ${goal === 'sales' ? 'Track lead-to-customer conversion closely.' : goal === 'leads' ? 'Conversion rate measures lead quality.' : ''}`,
      }
    }
    case 'CPL (Cost Per Lead)': {
      const value = budget > 0
        ? `$${Math.round(budget * 0.3 / 10)} – $${Math.round(budget * 0.5 / 5)}`
        : 'TBD — depends on channel mix'
      const bench = b2c ? '$5-20' : '$30-150'
      return {
        metric,
        value,
        benchmark: bench,
        interpretation: `Optimize channels toward the lowest CPL. Current budget suggests ${value} range.`,
      }
    }
    case 'CAC (Customer Acquisition Cost)': {
      const value = scale === 'early' ? 'TBD — not yet tracking' : 'Total sales & marketing cost ÷ new customers'
      const bench = abilityToPay === 'high' ? '< $500' : abilityToPay === 'low' ? '< $20' : '< $100'
      return {
        metric,
        value,
        benchmark: `Target: ${bench} (varies by industry)`,
        interpretation: abilityToPay === 'high'
          ? 'Enterprise customers justify higher CAC given larger contract values.'
          : abilityToPay === 'low'
            ? 'Low CAC is critical for price-sensitive segments.'
            : 'Maintain moderate CAC with clear payback period.',
      }
    }
    case 'ROI (Return on Investment)': {
      const value = scale === 'early' ? 'Target: 2:1 — 3:1 (early-stage)' : 'Target: 3:1 — 5:1'
      return {
        metric,
        value,
        benchmark: 'Minimum acceptable: 2:1',
        interpretation: scale === 'early'
          ? 'Early-stage ROI may be negative as you invest in brand building — focus on leading indicators.'
          : 'Track channel-level ROI to optimize spend allocation.',
      }
    }
    case 'Customer LTV (Lifetime Value)': {
      return {
        metric,
        value: 'TBD — requires 3-6 months of customer data',
        benchmark: 'LTV:CAC ratio target: 3:1',
        interpretation: saas
          ? 'For SaaS, focus on monthly recurring revenue (MRR) as a leading LTV indicator.'
          : 'Invest in retention to maximize LTV. Repeat customers drive long-term profitability.',
      }
    }
    case 'CPI (Cost Per Install)': {
      return {
        metric,
        value: budget > 0 ? `Est. $${Math.round(budget * 0.4 / 100)} – $${Math.round(budget * 0.6 / 50)}` : '$1-5 (estimated)',
        benchmark: 'Varies by platform and region',
        interpretation: `${businessName} should A/B test ad creatives and platforms to optimize CPI.`,
      }
    }
    case 'Retention Rate': {
      const value = scale === 'early' ? 'TBD — insufficient data' : 'Target: 80-90%+'
      return {
        metric,
        value,
        benchmark: saas ? 'SaaS target: 90%+ monthly' : 'Industry target: 60-80% repeat rate',
        interpretation: `Track cohort retention to identify drop-off points. ${saas ? 'Monthly active users (MAU) is a key leading indicator.' : 'Loyalty programs and follow-up campaigns improve retention.'}`,
      }
    }
    case 'Referral Rate': {
      return {
        metric,
        value: 'Target: 5-15% of customers',
        benchmark: 'Best-in-class: 20%+',
        interpretation: `Encourage referrals through incentives and shareable experiences. Track referral source in analytics.`,
      }
    }
    case 'eCPM (Effective Cost Per Mille)': {
      const value = scale === 'early' ? 'Target: $3-10' : scale === 'growth' ? 'Target: $5-15' : 'Target: $8-20'
      return {
        metric,
        value,
        benchmark: 'Varies by platform and ad format',
        interpretation: `Track eCPM across display and video campaigns. ${b2c ? 'B2C typically achieves higher eCPM on social platforms.' : 'B2B eCPM may be lower but targeting precision is more important.'} ${scale === 'early' ? 'Early-stage: focus on cost-efficient reach rather than premium placements.' : ''}`,
      }
    }
    case 'CPE (Cost Per Engagement)': {
      const lowBudget = budget > 0 && budget < 3000
      const value = lowBudget ? 'Target: < $0.30' : 'Target: < $0.50'
      return {
        metric,
        value,
        benchmark: 'Varies by platform and format',
        interpretation: `${lowBudget ? 'Focus on organic engagement and low-cost interactive content.' : 'Optimize ad creative to lower CPE.'} ${scale === 'early' ? 'Early-stage: test multiple creative formats to find what resonates.' : 'Video and interactive formats typically drive higher engagement.'}`,
      }
    }
    case 'CPV (Cost Per View)': {
      const channels = input.availableChannels
      const hasVideo = channels.includes('social-media') || channels.includes('ppc')
      if (!hasVideo) return null
      return {
        metric,
        value: 'Target: $0.01-0.03 per view',
        benchmark: 'YouTube: $0.01-0.03, Social: $0.02-0.05',
        interpretation: `Focus on hook strength in first 3 seconds to maximize view-through rates and lower CPV.`,
      }
    }
    case 'Engagement Rate': {
      const b2cEng = isB2C(input)
      const value = scale === 'early' ? 'Target: 2-5%' : scale === 'growth' ? 'Target: 3-6%' : 'Target: 4-8%'
      return {
        metric,
        value,
        benchmark: b2cEng ? 'B2C avg: 3-6%' : 'B2B avg: 1-3%',
        interpretation: `Track engagement across content types. ${b2cEng ? 'Visual and interactive content typically drives higher engagement for B2C.' : 'Thought leadership and industry insights drive B2B engagement.'} ${scale === 'early' ? 'Focus on community building and conversation starters.' : 'Optimize toward highest-engagement formats.'}`,
      }
    }
    case 'Churn Rate': {
      const saasChurn = isSaaS(input)
      const value = scale === 'early' ? 'TBD — insufficient data' : 'Target: < 5% monthly'
      return {
        metric,
        value,
        benchmark: saasChurn ? 'SaaS target: < 5% monthly churn' : 'Industry target: < 10% monthly churn',
        interpretation: `Monitor churn through cohort analysis. ${saasChurn ? 'Focus on onboarding experience and feature adoption to reduce SaaS churn.' : 'Implement retention campaigns and feedback loops.'} ${scale === 'early' ? 'Early-stage churn above 10% may indicate product-market fit issues.' : `Track month-over-month trends. ${budget > 0 && budget < 3000 ? 'Low-cost retention emails and in-app messages can help reduce churn.' : ''}`}`,
      }
    }
    default:
      return null
  }
}

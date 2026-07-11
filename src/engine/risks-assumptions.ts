import type { BusinessInput } from '../types'

export function generateRisksAssumptions(input: BusinessInput): string[] {
  const items: string[] = []
  const stage = input.currentStage

  // Assumptions based on missing or incomplete data
  if (!input.targetCustomerGuess?.trim()) {
    items.push('Assumption: Target customer profile has been identified. Without explicit customer data, all segmentation is hypothetical.')
  } else {
    items.push(`Assumption: "${input.targetCustomerGuess}" accurately represents the addressable market. This should be validated through primary research.`)
  }

  if (!input.competitors?.trim()) {
    items.push('Assumption: No direct competitors exist or the market is new. Competitive monitoring is critical to validate this assumption.')
  }

  if (!input.monthlyBudget?.trim()) {
    items.push('Assumption: Sufficient marketing budget exists. Without defined budget, channel recommendations assume $500-1,000/month minimum.')
  }

  if (!input.currentPrice?.trim()) {
    items.push('Assumption: Pricing can sustain customer acquisition costs and business operations. Validation through unit economics analysis is recommended.')
  }

  // Stage-specific risks
  if (stage === 'idea' || stage === 'mvp') {
    items.push('Risk: Product-market fit is unproven. Significant pivot risk exists if customer discovery reveals different needs than assumed.')
    items.push('Risk: Premature scaling — investing heavily in marketing before validating product-market fit can deplete resources quickly.')
  }

  if (stage === 'early-sales') {
    items.push('Risk: Sales cycle length may be underestimated, especially for enterprise/B2B segments. Cash flow planning should account for 2-4 month sales cycles.')
    items.push('Risk: Customer acquisition cost may exceed projections until channel optimization matures (typically 3-6 months).')
  }

  if (stage === 'growth' || stage === 'mature') {
    items.push('Risk: Channel saturation — as budget scales, marginal ROI on existing channels may decline. Continuous channel exploration is needed.')
    items.push('Risk: Increased competition as the market matures. Defensible moat through technology, data, or brand is critical.')
  }

  // Market-specific risks
  if (input.marketConstraints?.trim()) {
    items.push(`Risk: Market constraints — ${input.marketConstraints}. These should be actively monitored and addressed in the marketing plan.`)
  }

  if (input.urgencyLevel === 'low') {
    items.push('Risk: Low problem urgency means customers may delay purchase decisions. Marketing must create urgency through time-limited offers, scarcity, or FOMO tactics.')
  }

  if (input.abilityToPay === 'low') {
    items.push('Risk: Price sensitivity limits revenue per customer and requires high volume for profitability. CAC must be aggressively managed.')
  }

  // Channel risks
  if (input.availableChannels.length === 0) {
    items.push('Assumption: Marketing channels are undetermined. Channel selection should be based on where target customers spend their time and attention.')
  } else if (input.availableChannels.length > 5) {
    items.push('Risk: Channel overload — managing 5+ channels with limited budget/team may spread resources too thin. Recommend focusing on top 3 channels initially.')
  }

  // General assumptions
  items.push('Assumption: The marketing plan assumes stable economic conditions and no major market disruptions.')
  items.push('Assumption: Digital marketing channels remain accessible and regulatory frameworks (data privacy, advertising standards) do not materially change.')
  items.push('Assumption: The team has or can acquire the skills needed to execute the recommended channel strategies.')

  return items
}

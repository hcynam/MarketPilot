import type { BusinessInput } from '../types'

export function generateActionPlan(input: BusinessInput): string[] {
  const stage = input.currentStage
  const channels = input.availableChannels
  const budget = input.monthlyBudget || 'available budget'
  const team = input.teamCapacity || 'current team'

  const plans: string[] = []

  const week1: string[] = ['Set up tracking infrastructure (Google Analytics, conversion tracking, CRM)']

  if (channels.includes('website')) week1.push('Optimize landing page with clear value proposition and primary CTA')
  if (channels.includes('seo')) week1.push('Publish 2-3 SEO-optimized blog posts targeting problem-awareness keywords')
  if (channels.includes('social-media')) week1.push('Create social media profiles and publish 5-7 posts introducing the solution')
  if (channels.includes('email')) week1.push('Set up email collection (newsletter signup, lead magnet) and welcome sequence')
  if (channels.includes('content-marketing')) week1.push('Draft 1 case study or detailed guide demonstrating value')

  if (stage === 'idea' || stage === 'mvp') week1.push('Conduct 5-10 customer discovery interviews to validate problem-solution fit')

  const week2: string[] = ['Launch first campaign aligned with primary marketing goal']

  if (channels.includes('ppc')) week2.push('Launch small paid ad campaign ($200-500) to test messaging and targeting')
  if (channels.includes('influencer')) week2.push('Identify and reach out to 5-10 micro-influencers or industry voices for partnerships')
  if (channels.includes('referral')) week2.push('Design referral program structure and incentives')
  if (channels.includes('email')) week2.push('Send first newsletter or campaign email and analyze open/click rates')
  week2.push('Review first week metrics and adjust channel allocation')

  const week3: string[] = ['Optimize based on data from first two weeks']

  if (channels.includes('seo')) week3.push('Analyze SEO content performance and update underperforming posts')
  if (channels.includes('social-media')) week3.push('Double down on best-performing social content format')
  if (channels.includes('ppc')) week3.push('A/B test ad copy and visuals based on CTR data')
  week3.push('Collect and document initial customer feedback and testimonials')
  if (stage === 'early-sales' || stage === 'growth') week3.push('Review sales pipeline and identify bottlenecks in conversion')

  const week4: string[] = ['Month-end review and planning']

  week4.push(`Compile marketing performance report — track CTR, Conversion Rate, CPL, and ROI against targets`)
  week4.push(`Planning session for next 30 days — identify top-performing channels and allocate ${budget} accordingly`)
  week4.push('Document lessons learned and update marketing strategy document')
  week4.push('Set specific targets for next 30 days based on month 1 baseline data')

  // Add stage-specific items
  if (stage === 'idea' || stage === 'mvp') {
    week1.push('Define MVP feature set based on customer discovery findings')
    week2.push('Build landing page with email capture for early access waitlist')
    week3.push('Test MVP with 5-10 beta users and collect structured feedback')
    week4.push('Iterate on MVP based on beta feedback — prepare for public launch')
  }

  if (stage === 'growth' || stage === 'mature') {
    week1.push('Review customer churn data and identify retention improvement opportunities')
    week2.push('Plan expansion into adjacent segment or geography')
    week3.push('Develop upsell/cross-sell campaign for existing customer base')
    week4.push('Prepare quarterly marketing review with channel optimization recommendations')
  }

  plans.push(`Week 1 — Foundation (${team}): ${week1.slice(0, 5).join('; ')}.`)
  plans.push(`Week 2 — Launch (${budget}): ${week2.slice(0, 5).join('; ')}.`)
  plans.push(`Week 3 — Optimize: ${week3.slice(0, 5).join('; ')}.`)
  plans.push(`Week 4 — Review: ${week4.slice(0, 5).join('; ')}.`)

  return plans
}

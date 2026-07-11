import type { BusinessInput } from '../types'

export function generatePersonas(input: BusinessInput): string[] {
  const customerHint = input.targetCustomerGuess || 'target customer'
  const problemHint = input.mainCustomerProblem || 'core problem'
  const personasRaw = [
    `Primary Persona — "${input.businessName} Power User":
• Role: ${input.marketModel === 'B2C' ? 'Individual professional or enthusiast' : 'Decision-maker or department head'} who matches the description: "${customerHint}"
• Key Pain: ${problemHint}
• Goals: Efficiency, accuracy, speed in completing tasks; data-driven decision-making
• Objections: ${input.currentAlternative ? `Currently invested in "${input.currentAlternative.split(',')[0]?.trim()}" — needs clear migration value` : 'May be skeptical of new solutions without proven ROI'}
• Preferred Channel: ${input.availableChannels.length > 0 ? input.availableChannels[0].replace('-', ' ') : 'Direct outreach'}
${input.abilityToPay === 'high' ? '• Budget: Enterprise-level, willing to invest for quality' : input.abilityToPay === 'low' ? '• Budget: Price-sensitive, needs clear ROI justification' : '• Budget: Moderate, evaluates cost vs. benefit carefully'}`,
  ]

  // Secondary persona
  personasRaw.push(
    `Secondary Persona — "The Evaluator":
• Role: Technical or financial analyst who evaluates tools and makes recommendations
• Key Pain: ${input.mainCustomerProblem ? `Needs to ${input.mainCustomerProblem.split('.')[0]?.toLowerCase() || 'evaluate solutions'} but lacks efficient evaluation frameworks` : 'Time spent evaluating multiple solutions without clear comparison criteria'}
• Goals: Find the most reliable, well-supported solution with the best total cost of ownership
• Objections: Integration complexity, learning curve, switching costs
• Preferred Channel: Content marketing, detailed documentation, case studies`,
  )

  // Tertiary persona for broader segments
  if (input.marketModel === 'Both' || input.businessType === 'saas-digital') {
    personasRaw.push(
      `Tertiary Persona — "The End User":
• Role: Front-line practitioner who uses the solution daily
• Key Pain: ${input.mainCustomerProblem ? `Deals with ${input.mainCustomerProblem.split('.')[0]?.toLowerCase()}` : 'Inefficient workflows and manual processes'}
• Goals: Simple, intuitive experience that reduces workload
• Objections: Poor UX, slow performance, lack of support
• Preferred Channel: In-app guidance, email, community forums`,
    )
  }

  return personasRaw
}

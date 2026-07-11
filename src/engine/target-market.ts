import type { BusinessInput } from '../types'

export function generateTargetMarket(input: BusinessInput): string {
  const primary = input.targetCustomerGuess || input.productDescription
  const secondary: string[] = []

  if (input.marketModel === 'B2B' || input.marketModel === 'Both') {
    secondary.push(
      `Secondary: Organizations adjacent to the primary market — consulting firms, agencies, or internal teams who ${input.mainCustomerProblem ? `face similar challenges with ${input.mainCustomerProblem.toLowerCase()}` : 'operate in related domains and could benefit from the solution'}.`,
    )
  }
  if (input.marketModel === 'B2C' || input.marketModel === 'Both') {
    secondary.push(
      `Secondary: Individual professionals and power users who ${input.productDescription ? `need ${input.productDescription.split('.')[0].toLowerCase()}` : 'would benefit from the core functionality on a personal basis'}.`,
    )
  }

  const scopeNote = input.geographicScope
    ? `Geographic focus: ${input.geographicScope}.`
    : 'Geographic focus: Not yet defined — recommended to start with a single market or region.'

  return [
    `Primary Target Market: ${primary}.`,
    ...secondary,
    scopeNote,
    `Market Model: ${input.marketModel}. ${input.marketModel === 'Both' ? 'A dual approach requires separate acquisition strategies for business and consumer segments.' : 'A focused single-model approach simplifies channel and messaging strategy.'}`,
  ].join('\n')
}

import type { BusinessInput } from '../types'

function parseCompetitors(raw: string): string[] {
  return raw
    .split(/[,،;]/)
    .map(c => c.trim())
    .filter(c => c.length > 0)
}

export function generateCompetitorAnalysis(input: BusinessInput): string[] {
  const competitors = parseCompetitors(input.competitors || '')
  const analyses: string[] = []
  const diff = input.keyDifferentiation?.toLowerCase() || ''

  if (competitors.length === 0) {
    analyses.push(
      'No direct competitors identified. Assumption: either a new category or insufficient market research. Competitive monitoring should be a priority.',
    )
    return analyses
  }

  // Map generic competitive profiles
  const profiles = getCompetitiveProfiles(competitors)

  profiles.forEach(({ name, type, weakness }) => {
    const howWeBeat = diff.includes('ai') || diff.includes('automated')
      ? `${input.businessName} automates what ${name} does manually, delivering results in minutes instead of hours.`
      : diff.includes('fast') || diff.includes('speed')
        ? `${input.businessName} is significantly faster than ${name}, reducing time-to-value.`
        : `${input.businessName} differentiates through ${input.keyDifferentiation?.split('.')[0]?.toLowerCase() || 'superior execution'}.`

    analyses.push(
      `${name} (${type}): ${weakness || 'Established solution with existing customer base.'} ${howWeBeat}`,
    )
  })

  if (input.currentAlternative) {
    const alts = parseCompetitors(input.currentAlternative)
    if (alts.length > 0) {
      const altExamples = alts.slice(0, 3).join(', ')
      analyses.push(
        `Alternative Solutions (${altExamples}): Customers currently use these as workarounds. ${input.businessName} must offer clear convenience and quality advantages to drive switching behavior.`,
      )
    }
  }

  return analyses
}

function getCompetitiveProfiles(competitors: string[]): {
  name: string
  type: string
  weakness: string
}[] {
  const keywords: { key: string; type: string; weakness: string }[] = [
    { key: 'pitchbook', type: 'Data & Research Platform', weakness: 'Expensive, focused on market data rather than financial modeling, steep learning curve.' },
    { key: 'crunchbase', type: 'Company Database', weakness: 'Primarily a data source — does not generate financial models or feasibility analysis.' },
    { key: 'carta', type: 'Cap Table & Equity Management', weakness: 'Focused on portfolio management, not pre-investment feasibility analysis.' },
    { key: 'eqvista', type: 'Valuation Software', weakness: 'Limited to valuation, does not offer full financial modeling or scenario analysis.' },
    { key: 'excel', type: 'Manual / General Purpose Tool', weakness: 'Entirely manual, error-prone, requires advanced financial modeling expertise, no automation.' },
    { key: 'spreadsheet', type: 'Manual / General Purpose Tool', weakness: 'Entirely manual, error-prone, requires advanced financial modeling expertise, no automation.' },
    { key: 'google', type: 'General Tool', weakness: 'Not specialized — requires manual compilation from multiple sources.' },
  ]

  const profiles: { name: string; type: string; weakness: string }[] = []

  for (const comp of competitors) {
    const lower = comp.toLowerCase()
    const matched = keywords.find(k => lower.includes(k.key))
    if (matched) {
      profiles.push({ name: comp, ...matched })
    } else {
      profiles.push({
        name: comp,
        type: 'Competitor / Alternative',
        weakness: 'Existing solution with established market presence. Differentiation analysis required.',
      })
    }
  }

  return profiles.slice(0, 5)
}

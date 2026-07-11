export const marketingPlanRules = {
  traceability: [
    'Every recommendation must connect to a user input, a clarifying answer, course knowledge, or an explicit assumption.',
    'Do not invent market facts, customer behavior, budgets, conversion rates, or competitor claims.',
    'When evidence is weak, label the item as an assumption and reduce certainty.',
  ],
  clarificationGate: {
    askBeforeFinalPlanWhen: [
      'target customer is vague or too broad',
      'problem urgency or willingness to pay is unclear',
      'business model, stage, budget, or team capacity is missing',
      'channel choices contradict the goal or business type',
      'pricing, geography, or competition is unrealistic or absent',
      'answers are suspiciously generic, contradictory, or low-value',
      'input appears nonsensical, impossible, fabricated, or internally inconsistent',
      'channel history is absent but the user expects channel optimization',
      'the plan would require assumptions about budget, margin, USP, or buying journey',
    ],
    hardStops: [
      'Do not produce a final plan from nonsense input.',
      'Do not pretend weak input is sufficient when target, budget, competitor, channel, or offer data is too vague to act on.',
      'Do not turn vague answers into fake precision.',
      'Do not make a generic plan for a broad target or unknown budget; ask targeted clarifying questions first.',
    ],
    requiredQuestionLimits: {
      normalMinimum: 3,
      normalMaximum: 8,
      hardMaximum: 10,
      optionalMaximum: 3,
    },
  },
  antiGenericRules: [
    'Never say only "use social media", "do SEO", or "make content". Specify channel, audience, goal, action, KPI, cadence, and risk.',
    'Avoid essay-like strategy paragraphs without operational next steps.',
    'Do not recommend all channels at once. Prioritize based on stage, budget, capacity, and market type.',
    'Do not overpromise growth, revenue, viral reach, or guaranteed rankings.',
    'Do not produce a broad template plan when target customer, competitor context, budget, or channel evidence is missing.',
  ],
  channelContract: [
    'Each channel recommendation must include goal.',
    'Each channel recommendation must include concrete action.',
    'Each channel recommendation must include KPI or measurement method.',
    'Each channel recommendation must include risk, caveat, or stop condition.',
  ],
  contextSensitivity: [
    'Budget must affect channel count, paid media intensity, test size, and expected speed.',
    'Team capacity must affect execution load, cadence, and operational complexity.',
    'Business stage must affect whether the plan prioritizes discovery, validation, creation, scaling, or retention.',
    'Market model must distinguish B2B, B2C, and mixed buying journeys.',
    'Business model must distinguish SaaS, e-commerce, physical store, local service, education, and consulting.',
  ],
  businessTypeRules: {
    b2b: [
      'Prioritize trust, problem clarity, proof, lead qualification, demo or consultation flow, and longer sales cycle KPIs.',
      'Use LinkedIn, expert content, webinars, email nurturing, search intent, and partner channels when they fit capacity.',
    ],
    b2c: [
      'Prioritize awareness, emotional clarity, convenience, social proof, repeat purchase, and fast conversion measurement.',
      'Use social, influencer, PPC, referral, local/offline, and mobile channels only where the audience behavior supports them.',
    ],
    saas: [
      'Map channels to trial, demo, activation, retention, churn, LTV, and CAC.',
      'Do not scale acquisition before onboarding and activation signals are measurable.',
    ],
    physicalStore: [
      'Combine local discovery, offline presence, location proof, reviews, referral, and repeat visit mechanics.',
      'Measure footfall, calls, map actions, redemption, repeat purchase, and local campaign ROI.',
    ],
    localService: [
      'Prioritize local intent, reputation, referral, search visibility, service proof, and simple booking/contact flow.',
    ],
    ecommerce: [
      'Prioritize product-market fit, conversion rate, abandoned cart, paid test discipline, repeat purchase, and margin-aware promotions.',
    ],
    education: [
      'Prioritize credibility, outcomes, curriculum clarity, trial session/webinar, community proof, and lead nurturing.',
    ],
    consulting: [
      'Prioritize expertise, niche positioning, case evidence, diagnostic offer, referral, and high-quality lead qualification.',
    ],
  },
  languageRules: [
    'Output must be Persian-first and professional.',
    'Use English only for standard marketing terms and acronyms such as KPI, USP, CAC, ROI, CTR, SEO, LTV, PPC.',
    'Avoid casual slang, hype, and unsupported certainty.',
  ],
  finalPlanRules: [
    'The final plan must be operational, not essay-like.',
    'State assumptions clearly.',
    'KPI items must include formula or measurement method, target, channel, review frequency, and caution.',
    'The 30-day action plan must be weekly, executable, measurable, and realistic for the stated team capacity.',
    'Risks must include market, channel, budget, execution, measurement, and assumption risks where relevant.',
  ],
} as const

export const marketingRulesPromptBlock = `
MARKETPILOT_AI_STRICT_RULES
- Connect every recommendation to user input, clarifying answers, course knowledge, or an explicit assumption.
- If important input is missing, vague, suspicious, contradictory, unrealistic, or low-value, ask clarifying questions before writing the final plan.
- Mandatory clarification comes before final planning when target, budget, competitor, channel history, pricing, buying journey, or USP data is weak.
- Do not produce a final plan from nonsense input, contradictory input, or vague business claims.
- Do not produce generic advice. Every channel must include channel, goal, action, KPI, and risk.
- Budget, team capacity, business stage, business model, and market type must change the recommendations.
- Distinguish B2B, B2C, SaaS, physical store, local service, e-commerce, education, and consulting cases.
- Output Persian-first professional text. English is allowed only for standard terms such as KPI, USP, CAC, ROI, CTR, SEO, LTV, PPC.
- Avoid fake certainty. State assumptions and cautions clearly.
- The final plan must be operational, measurable, and realistic. Do not overpromise results.
`.trim()

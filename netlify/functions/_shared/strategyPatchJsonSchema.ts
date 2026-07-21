type JsonSchema = Record<string, unknown>

const nullableString: JsonSchema = { type: ['string', 'null'] }
const stringArray: JsonSchema = { type: 'array', items: { type: 'string' } }

function strictObject(properties: Record<string, JsonSchema>): JsonSchema {
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  }
}

function nullableObject(properties: Record<string, JsonSchema>): JsonSchema {
  return { anyOf: [strictObject(properties), { type: 'null' }] }
}

export const strategyPatchJsonSchema: JsonSchema = strictObject({
  diagnosis: nullableString,
  assumptions: stringArray,
  targetMarket: nullableObject({
    primarySegment: nullableString,
    secondarySegment: nullableString,
    selectionReason: nullableString,
  }),
  positioning: nullableObject({
    positioningStatement: nullableString,
    valueProposition: nullableString,
    usp: nullableString,
    proofNeeded: stringArray,
  }),
  personas: {
    type: 'array',
    items: strictObject({
      label: nullableString,
      profile: nullableString,
      pain: nullableString,
      motivation: nullableString,
      objection: nullableString,
      buyingTrigger: nullableString,
    }),
  },
  channelPriorities: {
    type: 'array',
    items: strictObject({
      channel: nullableString,
      funnelRole: nullableString,
      recommendedAction: nullableString,
      kpi: nullableString,
      rationale: nullableString,
    }),
  },
  pricingDirection: nullableObject({
    recommendation: nullableString,
    rationale: nullableString,
    validationExperiment: nullableString,
  }),
  kpis: {
    type: 'array',
    items: strictObject({
      name: nullableString,
      formula: nullableString,
      initialTarget: nullableString,
      reviewFrequency: nullableString,
    }),
  },
  actionPlan: {
    type: 'array',
    items: strictObject({
      period: nullableString,
      focus: nullableString,
      actions: stringArray,
      successMetric: nullableString,
    }),
  },
  risks: {
    type: 'array',
    items: strictObject({
      risk: nullableString,
      mitigation: nullableString,
    }),
  },
})

export function isStrictGroqModel(model: string): boolean {
  return model === 'openai/gpt-oss-20b' || model === 'openai/gpt-oss-120b'
}

import type { BusinessInput } from '../types'

export interface MarketingBusinessBrief {
  businessIdentity: {
    businessName: string
    businessType: BusinessInput['businessType']
    marketModel: BusinessInput['marketModel']
    currentStage: BusinessInput['currentStage']
  }
  productOrService: {
    description: string
    currentPrice: string
    pricingModel: BusinessInput['pricingModel']
    freeTrial: boolean
    discountOptions: string
  }
  customerAssumptions: {
    targetCustomerGuess: string
    mainCustomerProblem: string
    currentAlternative: string
    urgencyLevel: BusinessInput['urgencyLevel']
    abilityToPay: BusinessInput['abilityToPay']
  }
  marketAndGeography: {
    geographicScope: string
    marketConstraints: string
  }
  competitorsAndSubstitutes: {
    competitors: string
    keyDifferentiation: string
    currentAlternative: string
  }
  currentChannels: {
    availableChannels: BusinessInput['availableChannels']
  }
  budgetAndResources: {
    monthlyBudget: string
    teamCapacity: string
  }
  goalsAndSuccessCriteria: {
    marketingGoal: BusinessInput['marketingGoal']
  }
  constraintsAndRisks: {
    marketConstraints: string
    pricingConstraints: string
    channelConstraints: string
  }
  rawInput: BusinessInput
}

export function buildBusinessBrief(input: BusinessInput): MarketingBusinessBrief {
  return {
    businessIdentity: {
      businessName: input.businessName,
      businessType: input.businessType,
      marketModel: input.marketModel,
      currentStage: input.currentStage,
    },
    productOrService: {
      description: input.productDescription,
      currentPrice: input.currentPrice,
      pricingModel: input.pricingModel,
      freeTrial: input.freeTrial,
      discountOptions: input.discountOptions,
    },
    customerAssumptions: {
      targetCustomerGuess: input.targetCustomerGuess,
      mainCustomerProblem: input.mainCustomerProblem,
      currentAlternative: input.currentAlternative,
      urgencyLevel: input.urgencyLevel,
      abilityToPay: input.abilityToPay,
    },
    marketAndGeography: {
      geographicScope: input.geographicScope,
      marketConstraints: input.marketConstraints,
    },
    competitorsAndSubstitutes: {
      competitors: input.competitors,
      keyDifferentiation: input.keyDifferentiation,
      currentAlternative: input.currentAlternative,
    },
    currentChannels: {
      availableChannels: input.availableChannels,
    },
    budgetAndResources: {
      monthlyBudget: input.monthlyBudget,
      teamCapacity: input.teamCapacity,
    },
    goalsAndSuccessCriteria: {
      marketingGoal: input.marketingGoal,
    },
    constraintsAndRisks: {
      marketConstraints: input.marketConstraints,
      pricingConstraints: input.discountOptions,
      channelConstraints: input.availableChannels.length > 0
        ? `Selected channels: ${input.availableChannels.join(', ')}`
        : 'No current channels selected',
    },
    rawInput: input,
  }
}


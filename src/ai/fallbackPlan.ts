import { generateMarketingPlan } from '../engine/orchestrator'
import type { BusinessInput, MarketingPlan } from '../types'

export const fallbackMarketingPlanMessage =
  'برنامه کامل با موتور داخلی MarketPilot تولید شد؛ بهبود هوش مصنوعی اعمال نشد.'

export type FallbackMarketingPlan = MarketingPlan & {
  fallbackMessage: string
  fallbackReason?: string
}

export function generateFallbackMarketingPlan(
  input: BusinessInput,
  reason?: string,
): FallbackMarketingPlan {
  return {
    ...generateMarketingPlan(input),
    fallbackMessage: fallbackMarketingPlanMessage,
    fallbackReason: reason,
  }
}

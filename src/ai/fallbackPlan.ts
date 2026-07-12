import { generateMarketingPlan } from '../engine/orchestrator'
import type { BusinessInput, MarketingPlan } from '../types'

export const fallbackMarketingPlanMessage =
  'به دلیل محدودیت موقت سرویس هوش مصنوعی، برنامه بازاریابی با موتور تحلیلی داخلی MarketPilot تولید شد.'

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

import { generateMarketingPlan } from '../engine/orchestrator'
import type { BusinessInput, MarketingPlan } from '../types'

export const fallbackMarketingPlanMessage =
  'تحلیل هوشمند در دسترس نبود؛ نسخه پایه برنامه با موتور داخلی تولید شد.'

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


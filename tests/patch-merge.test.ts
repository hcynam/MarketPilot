import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeStrategyPatch } from '../src/ai/aiPlanAdapter'
import { buildBusinessBrief } from '../src/ai/buildBusinessBrief'
import { generateMarketingPlan } from '../src/engine/orchestrator'
import { validateStrategyPatch } from '../netlify/functions/_shared/validateAIResponse'
import { b2bSaas } from './fixtures'

test('valid patch areas update the plan while an invalid item does not erase them', () => {
  const baseline = generateMarketingPlan(b2bSaas)
  const validation = validateStrategyPatch({
    positioning: {
      positioningStatement: 'سامانه پیگیری ساده برای مدیران فروش تیم‌های کوچک با شفافیت نرخ تبدیل.',
      valueProposition: 'کاهش سرنخ‌های فراموش‌شده و دید روزانه به مراحل فروش.',
      usp: 'راه‌اندازی یک‌روزه با گزارش قابل اقدام برای تیم کوچک.',
    },
    personas: [
      { label: 'مدیر فروش', profile: 'مدیر یک تیم پنج‌نفره', pain: 'پیگیری نامنظم', motivation: 'پیش‌بینی فروش' },
      { label: 'ناقص' },
    ],
  })

  assert.equal(validation.usablePatch, true)
  assert.ok(validation.acceptedPatchAreas.includes('positioning'))
  assert.ok(validation.rejectedPatchAreas.some((item) => item.area === 'personas[1]'))
  const merged = mergeStrategyPatch(baseline, validation.patch, validation, buildBusinessBrief(b2bSaas))
  assert.match(merged.plan.positioningStatement, /سامانه پیگیری ساده/)
  assert.ok(merged.plan.customerPersonas.length >= 1)
})

test('partial patch preserves all complete report areas, KPI data, and action plan fallback', () => {
  const baseline = generateMarketingPlan(b2bSaas)
  const validation = validateStrategyPatch({
    diagnosis: 'اولویت اصلی، اثبات کاهش اتلاف سرنخ پیش از توسعه کانال‌های پرهزینه است.',
    channelPriorities: [{
      channel: 'محتوای تخصصی',
      funnelRole: 'اعتمادسازی',
      recommendedAction: 'انتشار مطالعه موردی و دعوت به دموی کوتاه',
      kpi: 'نرخ رزرو دمو',
      rationale: 'با بودجه و ظرفیت تیم کوچک سازگار است',
    }],
    pricingDirection: { recommendation: '' },
  })
  const merged = mergeStrategyPatch(baseline, validation.patch, validation, buildBusinessBrief(b2bSaas)).plan

  assert.ok(merged.businessSummary)
  assert.ok(merged.marketSegments.length)
  assert.ok(merged.customerPersonas.length)
  assert.ok(merged.marketingMix7p && Object.keys(merged.marketingMix7p).length)
  assert.ok(merged.funnelJourney.length)
  assert.ok(merged.channelStrategy.length)
  assert.equal(merged.pricingRecommendation, baseline.pricingRecommendation)
  assert.deepEqual(merged.kpiDashboard, baseline.kpiDashboard)
  assert.deepEqual(merged.actionPlan, baseline.actionPlan)
  assert.ok(merged.risksAssumptions.length)
  assert.ok(merged.qualityScore.details.some((item) => item.includes('بخشی از پیشنهادهای هوش مصنوعی')))
})

test('empty patch is completely rejected', () => {
  const validation = validateStrategyPatch({ assumptions: [], personas: [], unknown: 'value' })
  assert.equal(validation.usablePatch, false)
  assert.equal(validation.acceptedPatchAreas.length, 0)
})

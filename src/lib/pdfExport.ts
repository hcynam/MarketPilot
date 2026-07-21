import type { MarketingPlan } from '../types'
import { createReportPresentation } from './reportPresentation'
import { createPrintableReportHtml, openPrintableReport } from './printDocument'

function safeName(value: string): string {
  return (value || 'MarketPilot AI').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'MarketPilot AI'
}

export function marketingPlanPdfFileName(businessName: string): string {
  return `${safeName(businessName)}-marketing-plan.pdf`
}

/**
 * Returns the dedicated, text-based report document used by the browser's
 * native PDF engine. It deliberately avoids canvas/raster page capture.
 */
export function createMarketingPlanPdfDocument(plan: MarketingPlan, businessName: string): string {
  return createPrintableReportHtml(createReportPresentation(plan, businessName), 'pdf', false)
}

export function openMarketingPlanPdf(plan: MarketingPlan, businessName: string): void {
  openPrintableReport(createReportPresentation(plan, businessName), 'pdf')
}


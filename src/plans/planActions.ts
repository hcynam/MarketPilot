import { createMarketingPlanDocx, marketingPlanDocxFileName } from '../lib/docxExport'
import { openMarketingPlanPdf } from '../lib/pdfExport'
import { createReportPresentation } from '../lib/reportPresentation'
import { createPrintableReportHtml, openPrintableReport } from '../lib/printDocument'
import type { PendingAction } from '../auth/types'
import type { GuestPlanSnapshot } from './guestPlan'

export async function runPlanExport(
  action: Exclude<PendingAction, 'save'>,
  snapshot: GuestPlanSnapshot,
  reservedWindow?: Window | null,
): Promise<void> {
  const report = createReportPresentation(snapshot.outputData, snapshot.businessName)
  if (action === 'word') {
    const blob = await createMarketingPlanDocx(report)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = marketingPlanDocxFileName(snapshot.businessName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    return
  }

  if (reservedWindow && !reservedWindow.closed) {
    const mode = action === 'pdf' ? 'pdf' : 'print'
    reservedWindow.opener = null
    reservedWindow.document.open()
    reservedWindow.document.write(createPrintableReportHtml(report, mode, true))
    reservedWindow.document.close()
    return
  }

  if (action === 'pdf') openMarketingPlanPdf(snapshot.outputData, snapshot.businessName)
  else openPrintableReport(report, 'print')
}

export function prepareExportWindow(action: PendingAction): Window | null {
  if (action !== 'pdf' && action !== 'print') return null
  document.getElementById('marketpilot-pending-export-frame')?.remove()
  const frame = document.createElement('iframe')
  frame.id = 'marketpilot-pending-export-frame'
  frame.title = 'آماده‌سازی خروجی برنامه'
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.style.visibility = 'hidden'
  document.body.appendChild(frame)
  return frame.contentWindow
}

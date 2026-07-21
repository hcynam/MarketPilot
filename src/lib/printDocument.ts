import type { ReportPresentation, ReportRow, ReportSection } from './reportPresentation'

type PrintMode = 'pdf' | 'print'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function text(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function rowsTable(rows: ReportRow[], firstHeader = 'عنوان', secondHeader = 'شرح'): string {
  return `<table class="report-table">
    <thead><tr><th>${firstHeader}</th><th>${secondHeader}</th></tr></thead>
    <tbody>${rows.map((row) => `<tr><th scope="row">${text(row.label || '—')}</th><td>${text(row.value)}</td></tr>`).join('')}</tbody>
  </table>`
}

function sectionBody(section: ReportSection): string {
  if (section.kind === 'prose') return `<p class="prose">${text(section.text ?? '')}</p>`
  if (section.kind === 'callout') return `<div class="callout">${text(section.text ?? '')}</div>`
  if (section.kind === 'table') return rowsTable(section.rows ?? [], 'موضوع', 'شرح موجود')
  if (section.kind === 'mix') return rowsTable(section.rows ?? [], 'عنصر', 'توضیح')
  if (section.kind === 'funnel') {
    return `<div class="funnel">${(section.rows ?? []).map((row, index) => `<div class="funnel__item"><span>${index + 1}</span><div><strong>${text(row.label || `مرحله ${index + 1}`)}</strong><p>${text(row.value)}</p></div></div>`).join('')}</div>`
  }
  if (section.kind === 'personas') {
    return `<div class="persona-grid">${(section.personas ?? []).map((persona) => `<article class="persona"><h3>${text(persona.title)}</h3><ul>${persona.details.map((detail) => `<li>${text(detail)}</li>`).join('')}</ul></article>`).join('')}</div>`
  }
  if (section.kind === 'kpis') {
    return `<div class="metric-grid">${(section.kpis ?? []).map((kpi) => `<article class="metric">
      <div class="metric__head"><h3>${text(kpi.metric)}</h3><span>${text(kpi.funnelStage)}</span></div>
      <dl><div><dt>فرمول</dt><dd class="ltr">${text(kpi.formula)}</dd></div><div><dt>هدف</dt><dd>${text(kpi.target)}</dd></div><div><dt>معیار مقایسه</dt><dd>${text(kpi.benchmark)}</dd></div><div><dt>تناوب / اولویت</dt><dd>${text(kpi.frequency)} · ${text(kpi.priority)}</dd></div></dl>
      <p>${text(kpi.interpretation)}</p>
    </article>`).join('')}</div>`
  }
  if (section.kind === 'timeline') {
    return `<ol class="timeline">${(section.rows ?? []).map((row) => `<li><strong>${text(row.label || 'اقدام')}</strong><p>${text(row.value)}</p></li>`).join('')}</ol>`
  }
  if (section.kind === 'risks') return rowsTable(section.rows ?? [], 'نوع', 'شرح موجود')
  if (section.kind === 'quality' && section.quality) {
    const { score, maxScore, percent, details } = section.quality
    return `<div class="quality"><div class="quality__score"><strong>${score}/${maxScore}</strong><span>${percent}%</span></div><div class="quality__bar"><i style="width:${percent}%"></i></div><ul>${details.map((detail) => `<li>${text(detail.replace(/^[✓✔○]\s*/, ''))}</li>`).join('')}</ul></div>`
  }
  return ''
}

function helperText(mode: PrintMode): string {
  return mode === 'pdf'
    ? 'برای ساخت PDF متنی و قابل انتخاب، مقصد چاپ را روی «Save as PDF» بگذارید. برای خروجی کاملاً تمیز، گزینه Headers and footers را غیرفعال کنید.'
    : 'برای چاپ کاملاً تمیز، گزینه Headers and footers را در تنظیمات چاپ غیرفعال کنید.'
}

export function createPrintableReportHtml(model: ReportPresentation, mode: PrintMode = 'print', autoPrint = true): string {
  const chapters = model.chapters.map((chapter) => `<section class="chapter">
    <header class="chapter__header"><span>${text(chapter.index)}</span><div><h1>${text(chapter.title)}</h1><p>${text(chapter.range)}</p></div></header>
    ${chapter.sections.map((section) => `<section class="report-section report-section--${section.kind}"><h2>${text(section.title)}</h2>${sectionBody(section)}</section>`).join('')}
  </section>`).join('')
  const snapshot = model.executiveSnapshot.map((item) => `<div><dt>${text(item.label)}</dt><dd>${text(item.value)}</dd></div>`).join('')
  const decisionPath = model.decisionPath.map((item, index) => `<li><span>${index + 1}</span><strong>${text(item)}</strong></li>`).join('')
  const printScript = autoPrint
    ? `<script>window.addEventListener('afterprint',function(){if(window.frameElement)window.frameElement.remove();},{once:true});window.addEventListener('load',function(){var ready=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();ready.then(function(){window.focus();window.print();});});</script>`
    : ''

  return `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${text(model.metadata.title)} - ${text(model.metadata.businessName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet" />
<style>
:root{--ink:#102a2a;--text:#243e3e;--muted:#526d6b;--line:#cbd8d5;--line-strong:#9eb5b1;--primary:#0e5e5a;--primary-soft:#eaf0ee;--accent:#d66a3a;--accent-soft:#fae7dd;--surface:#fff;}
*{box-sizing:border-box}html{background:#eef2f1}body{margin:0;color:var(--text);font-family:"Vazirmatn",Tahoma,"Segoe UI",Arial,sans-serif;font-size:10pt;line-height:1.58;background:#eef2f1;direction:rtl}.document{width:210mm;margin:12mm auto;background:#fff;box-shadow:0 4px 14px rgba(16,42,42,.12)}
.print-help{position:fixed;z-index:10;inset:auto 18px 18px 18px;max-width:760px;margin:auto;padding:10px 14px;border:1px solid var(--line-strong);border-radius:8px;background:#fff;color:var(--ink);font-size:10pt;box-shadow:0 4px 12px rgba(16,42,42,.12)}
.page{padding:16mm}.cover{min-height:265mm;display:flex;flex-direction:column;justify-content:center;break-after:page;page-break-after:always}.cover__brand{color:var(--primary);font-weight:800;font-size:10pt;letter-spacing:.04em}.cover h1{max-width:16ch;margin:7mm 0 3mm;color:var(--ink);font-size:26pt;line-height:1.38}.cover h2{margin:0;color:var(--primary);font-size:17pt}.cover__rule{width:30mm;height:3px;margin:9mm 0;background:var(--accent)}.cover__note{max-width:78%;color:var(--muted);font-size:10pt}.decision-path{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:12mm 0 0;padding:0;list-style:none}.decision-path li{padding:4mm 2mm;border:1px solid var(--line);background:var(--primary-soft);text-align:center}.decision-path span{display:block;margin:auto auto 1mm;color:var(--accent);font-weight:800}.decision-path strong{color:var(--ink);font-size:10pt}
.content{padding:15mm 16mm 18mm}.snapshot{margin:0 0 11mm}.snapshot>header{display:flex;justify-content:space-between;gap:8mm;align-items:end;margin-bottom:5mm;padding-bottom:3mm;border-bottom:2px solid var(--primary)}.snapshot h1{margin:0;color:var(--ink);font-size:18pt}.snapshot header span{color:var(--primary);font-size:9pt;font-weight:700}.snapshot dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;border-top:1px solid var(--line);border-inline-start:1px solid var(--line)}.snapshot dl>div{padding:4mm;border-inline-end:1px solid var(--line);border-bottom:1px solid var(--line)}dt{margin-bottom:1mm;color:var(--primary);font-size:8.75pt;font-weight:700}dd{margin:0;color:var(--text);unicode-bidi:plaintext}
.chapter{margin-top:9mm}.chapter__header{display:flex;align-items:center;gap:4mm;margin:0 0 5mm;padding:4mm 5mm;background:var(--primary);color:#fff;break-after:avoid;page-break-after:avoid}.chapter__header>span{color:#ffd7c4;font-size:18pt;font-weight:800}.chapter__header h1{margin:0;color:#fff;font-size:18pt;line-height:1.35}.chapter__header p{margin:1mm 0 0;color:#dcebea;font-size:8.5pt}.report-section{margin:0 0 7mm}.report-section>h2{margin:0 0 3mm;padding-bottom:2mm;border-bottom:1px solid var(--line);color:var(--ink);font-size:13pt;line-height:1.45;break-after:avoid;page-break-after:avoid}.prose{max-width:72ch;margin:0;color:var(--text);text-align:right;unicode-bidi:plaintext;orphans:3;widows:3}.callout{padding:4mm 5mm;border:1px solid var(--line-strong);background:var(--primary-soft);color:var(--ink);unicode-bidi:plaintext;break-inside:avoid}.report-table{width:100%;border-collapse:collapse;margin:0;font-size:9pt}.report-table thead{display:table-header-group}.report-table th,.report-table td{padding:2.8mm 3mm;border:1px solid var(--line);vertical-align:top;text-align:right;unicode-bidi:plaintext}.report-table thead th{background:var(--primary);color:#fff;font-weight:700}.report-table tbody th{width:28%;background:var(--primary-soft);color:var(--ink)}.report-table tr{break-inside:auto;page-break-inside:auto}
.persona-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm}.persona{padding:4mm;border:1px solid var(--line);background:#f7f9f8;break-inside:avoid}.persona h3,.metric h3{margin:0 0 2mm;color:var(--ink);font-size:10.5pt}.persona ul,.quality ul{margin:0;padding:0 5mm 0 0}.persona li,.quality li{margin:1mm 0}.funnel{display:grid;gap:2mm}.funnel__item{display:grid;grid-template-columns:9mm minmax(0,1fr);gap:3mm;align-items:start;padding:3mm 0;border-bottom:1px solid var(--line);break-inside:avoid}.funnel__item>span{width:8mm;height:8mm;display:grid;place-items:center;border-radius:50%;background:var(--primary);color:#fff;font-weight:800}.funnel strong{color:var(--ink)}.funnel p{margin:1mm 0 0}.metric-grid{font-size:0}.metric{width:49%;display:inline-block;margin:0 0 4mm 1%;padding:4mm;border:1px solid var(--line);vertical-align:top;font-size:9pt;break-inside:avoid}.metric:nth-child(even){margin-left:0}.metric__head{display:flex;justify-content:space-between;gap:3mm;align-items:start;margin-bottom:3mm}.metric__head span{padding:1mm 2mm;background:var(--accent-soft);color:#8b4627;font-size:8pt}.metric dl{margin:0;border-top:1px solid var(--line)}.metric dl>div{display:grid;grid-template-columns:28mm minmax(0,1fr);gap:2mm;padding:2mm 0;border-bottom:1px solid var(--line)}.metric p{margin:3mm 0 0;color:var(--muted)}.ltr{direction:ltr;text-align:left;unicode-bidi:embed}.timeline{margin:0;padding:0 8mm 0 0;border-inline-start:2px solid var(--line);list-style:none}.timeline li{position:relative;margin:0 0 4mm;padding:0 5mm 0 0;break-inside:avoid}.timeline li:before{content:"";position:absolute;right:-10.2mm;top:2mm;width:4mm;height:4mm;border:2px solid var(--primary);border-radius:50%;background:#fff}.timeline strong{color:var(--primary)}.timeline p{margin:1mm 0 0}.quality{break-inside:avoid}.quality__score{display:flex;align-items:baseline;gap:3mm}.quality__score strong{color:var(--primary);font-size:20pt}.quality__score span{color:var(--muted);font-size:11pt}.quality__bar{height:3mm;margin:2mm 0 4mm;background:var(--line)}.quality__bar i{display:block;height:100%;background:var(--primary)}
@media print{@page{size:A4 portrait;margin:15mm 16mm 18mm}html,body{background:#fff}.document{width:auto;margin:0;box-shadow:none}.page,.content{padding:0}.print-help{display:none!important}.cover{min-height:257mm}.chapter{break-inside:auto}.chapter__header{break-inside:avoid}.report-section--personas,.report-section--kpis{break-inside:auto}}
@media(max-width:760px){.document{width:100%;margin:0}.page,.content{padding:20px}.cover{min-height:100vh}.snapshot dl,.persona-grid{grid-template-columns:1fr}.metric{width:100%;margin-left:0}.decision-path{grid-template-columns:repeat(2,1fr)}}
</style></head><body><aside class="print-help">${helperText(mode)}</aside><main class="document">
<section class="page cover"><div class="cover__brand">MARKETPILOT AI</div><h1>${text(model.metadata.title)}</h1><h2>${text(model.metadata.businessName)}</h2><div class="cover__rule"></div><p class="cover__note">گزارش ساختاریافته تصمیم‌گیری بازاریابی شامل نمای مدیریتی، ۱۷ بخش، KPI، برنامه اقدام، ریسک‌ها و جمع‌بندی کیفیت.</p><ol class="decision-path">${decisionPath}</ol></section>
<div class="content"><section class="snapshot"><header><div><span>EXECUTIVE SNAPSHOT</span><h1>نمای تصمیم مدیریتی</h1></div><strong>${model.sectionCount.toLocaleString('fa-IR')} بخش</strong></header><dl>${snapshot}</dl></section>${chapters}</div></main>${printScript}</body></html>`
}

export function openPrintableReport(model: ReportPresentation, mode: PrintMode): void {
  const popup = window.open('', '_blank')
  if (!popup) throw new Error('print_popup_blocked')
  popup.opener = null
  popup.document.open()
  popup.document.write(createPrintableReportHtml(model, mode, true))
  popup.document.close()
}

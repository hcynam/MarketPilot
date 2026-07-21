import type { ReportKpi, ReportPresentation, ReportRow, ReportSection } from './reportPresentation'

const A4_WIDTH = 11906
const A4_HEIGHT = 16838
const PAGE_MARGIN_X = 907
const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN_X * 2
const FONT = 'Tahoma'
const COLORS = {
  ink: '102A2A',
  text: '243E3E',
  muted: '526D6B',
  line: 'CBD8D5',
  lineStrong: '9EB5B1',
  primary: '0E5E5A',
  primarySoft: 'EAF0EE',
  accent: 'D66A3A',
  accentSoft: 'FAE7DD',
  white: 'FFFFFF',
}

function safeName(value: string): string {
  return (value || 'MarketPilot AI').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'MarketPilot AI'
}

export function marketingPlanDocxFileName(businessName: string): string {
  return `${safeName(businessName)}-marketing-plan.docx`
}

export async function createMarketingPlanDocx(model: ReportPresentation): Promise<Blob> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    Header,
    PageBreak,
    PageNumber,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    VerticalAlign,
    WidthType,
    TextRun,
  } = await import('docx')

  const run = (value: string, options: { bold?: boolean; color?: string; size?: number; rtl?: boolean } = {}) => new TextRun({
    text: value,
    font: FONT,
    size: options.size ?? 21,
    sizeComplexScript: options.size ?? 21,
    color: options.color ?? COLORS.text,
    bold: options.bold,
    boldComplexScript: options.bold,
    rightToLeft: options.rtl ?? true,
    language: { bidirectional: 'fa-IR' },
  })

  const paragraph = (value: string, options: {
    style?: string
    bold?: boolean
    color?: string
    size?: number
    align?: (typeof AlignmentType)[keyof typeof AlignmentType]
    before?: number
    after?: number
    line?: number
    keepNext?: boolean
    bullet?: boolean
    ltr?: boolean
  } = {}) => new Paragraph({
    style: options.style,
    bidirectional: !options.ltr,
    alignment: options.align ?? AlignmentType.RIGHT,
    spacing: { before: options.before ?? 0, after: options.after ?? 120, line: options.line ?? 300 },
    keepNext: options.keepNext,
    widowControl: true,
    bullet: options.bullet ? { level: 0 } : undefined,
    children: [run(value, { bold: options.bold, color: options.color, size: options.size, rtl: !options.ltr })],
  })

  const cell = (children: InstanceType<typeof Paragraph>[], options: { width: number; fill?: string; compact?: boolean } ) => new TableCell({
    width: { size: options.width, type: WidthType.DXA },
    margins: { top: options.compact ? 70 : 110, bottom: options.compact ? 70 : 110, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    shading: options.fill ? { type: ShadingType.CLEAR, fill: options.fill, color: 'auto' } : undefined,
    children,
  })

  const table = (tableRows: InstanceType<typeof TableRow>[], widths: number[]) => new Table({
    rows: tableRows,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    visuallyRightToLeft: true,
    alignment: AlignmentType.CENTER,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    borders: {
      top: { style: BorderStyle.SINGLE, color: COLORS.lineStrong, size: 4 },
      bottom: { style: BorderStyle.SINGLE, color: COLORS.lineStrong, size: 4 },
      left: { style: BorderStyle.SINGLE, color: COLORS.lineStrong, size: 4 },
      right: { style: BorderStyle.SINGLE, color: COLORS.lineStrong, size: 4 },
      insideHorizontal: { style: BorderStyle.SINGLE, color: COLORS.line, size: 3 },
      insideVertical: { style: BorderStyle.SINGLE, color: COLORS.line, size: 3 },
    },
  })

  const rowsTable = (items: ReportRow[], firstHeader = 'عنوان', secondHeader = 'شرح') => {
    const widths = [2900, CONTENT_WIDTH - 2900]
    return table([
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          cell([paragraph(firstHeader, { bold: true, color: COLORS.white, size: 19, align: AlignmentType.CENTER, after: 0 })], { width: widths[0], fill: COLORS.primary }),
          cell([paragraph(secondHeader, { bold: true, color: COLORS.white, size: 19, align: AlignmentType.CENTER, after: 0 })], { width: widths[1], fill: COLORS.primary }),
        ],
      }),
      ...items.map((item) => new TableRow({
        children: [
          cell([paragraph(item.label || '—', { bold: true, color: COLORS.ink, size: 18, after: 0 })], { width: widths[0], fill: COLORS.primarySoft }),
          cell([paragraph(item.value, { size: 18, after: 0 })], { width: widths[1] }),
        ],
      })),
    ], widths)
  }

  const callout = (value: string) => table([
    new TableRow({ children: [cell([paragraph(value, { color: COLORS.ink, after: 0 })], { width: CONTENT_WIDTH, fill: COLORS.primarySoft })] }),
  ], [CONTENT_WIDTH])

  const personaTable = (section: ReportSection) => {
    const widths = [Math.floor(CONTENT_WIDTH / 2), CONTENT_WIDTH - Math.floor(CONTENT_WIDTH / 2)]
    const personaCells = (section.personas ?? []).map((persona) => cell([
      paragraph(persona.title, { bold: true, color: COLORS.ink, size: 21, after: 80 }),
      ...persona.details.map((detail) => paragraph(detail, { bullet: true, size: 19, after: 60 })),
    ], { width: widths[0], fill: 'F7F9F8' }))
    const tableRows: InstanceType<typeof TableRow>[] = []
    for (let index = 0; index < personaCells.length; index += 2) {
      const children = personaCells.slice(index, index + 2)
      if (children.length === 1) children.push(cell([paragraph('')], { width: widths[1], fill: 'F7F9F8' }))
      tableRows.push(new TableRow({ cantSplit: true, children }))
    }
    return table(tableRows, widths)
  }

  const kpiBlock = (kpi: ReportKpi) => {
    const widths = [2500, CONTENT_WIDTH - 2500]
    return table([
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          cell([paragraph(kpi.metric, { bold: true, color: COLORS.white, size: 21, after: 0, line: 260 })], { width: widths[0], fill: COLORS.primary, compact: true }),
          cell([paragraph(kpi.funnelStage, { bold: true, color: COLORS.ink, size: 18, after: 0, line: 260 })], { width: widths[1], fill: COLORS.accentSoft, compact: true }),
        ],
      }),
      ...[
        ['فرمول', kpi.formula],
        ['هدف / معیار مقایسه', `${kpi.target} · معیار مقایسه: ${kpi.benchmark}`],
        ['تناوب / اولویت', `${kpi.frequency} · ${kpi.priority}`],
        ['تفسیر', kpi.interpretation],
      ].map(([label, value]) => new TableRow({
        children: [
          cell([paragraph(label, { bold: true, color: COLORS.ink, size: 18, after: 0, line: 260 })], { width: widths[0], fill: COLORS.primarySoft, compact: true }),
          cell([paragraph(value, { size: 18, after: 0, line: 260, ltr: label === 'فرمول' })], { width: widths[1], compact: true }),
        ],
      })),
    ], widths)
  }

  const sectionContent = (section: ReportSection): Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> => {
    if (section.kind === 'prose') return [paragraph(section.text ?? '')]
    if (section.kind === 'callout') return [callout(section.text ?? '')]
    if (section.kind === 'table') return [rowsTable(section.rows ?? [], 'موضوع', 'شرح موجود')]
    if (section.kind === 'mix') return [rowsTable(section.rows ?? [], 'عنصر', 'توضیح')]
    if (section.kind === 'funnel') return [rowsTable(section.rows ?? [], 'مرحله', 'توضیح')]
    if (section.kind === 'personas') return [personaTable(section)]
    if (section.kind === 'kpis') return (section.kpis ?? []).flatMap((kpi) => [kpiBlock(kpi), paragraph('', { after: 80 })])
    if (section.kind === 'timeline') return [rowsTable(section.rows ?? [], 'بازه', 'اقدام‌ها')]
    if (section.kind === 'risks') return [rowsTable(section.rows ?? [], 'نوع', 'شرح موجود')]
    if (section.kind === 'quality' && section.quality) {
      return [
        callout(`امتیاز کیفیت: ${section.quality.score}/${section.quality.maxScore} (${section.quality.percent}%)`),
        ...section.quality.details.map((detail) => paragraph(detail.replace(/^[✓✔○]\s*/, ''), { bullet: true, after: 60 })),
      ]
    }
    return []
  }

  const coverDecisionWidths = Array.from({ length: 4 }, () => Math.floor(CONTENT_WIDTH / 4))
  const coverDecision = table([
    new TableRow({
      cantSplit: true,
      children: model.decisionPath.map((step, index) => cell([
        paragraph(String(index + 1), { bold: true, color: COLORS.accent, size: 24, align: AlignmentType.CENTER, after: 50 }),
        paragraph(step, { bold: true, color: COLORS.ink, size: 20, align: AlignmentType.CENTER, after: 0 }),
      ], { width: coverDecisionWidths[index], fill: COLORS.primarySoft })),
    }),
  ], coverDecisionWidths)

  const snapshotWidths = [2850, CONTENT_WIDTH - 2850]
  const snapshot = table(model.executiveSnapshot.map((item) => new TableRow({
    children: [
      cell([paragraph(item.label, { bold: true, color: COLORS.ink, size: 19, after: 0 })], { width: snapshotWidths[0], fill: COLORS.primarySoft }),
      cell([paragraph(item.value, { size: 19, after: 0 })], { width: snapshotWidths[1] }),
    ],
  })), snapshotWidths)

  const body: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [
    paragraph('MARKETPILOT AI', { bold: true, color: COLORS.primary, size: 22, before: 900, after: 220 }),
    paragraph(model.metadata.title, { bold: true, color: COLORS.ink, size: 52, after: 180 }),
    paragraph(model.metadata.businessName, { bold: true, color: COLORS.primary, size: 34, after: 500 }),
    coverDecision,
    paragraph('گزارش ساختاریافته تصمیم‌گیری بازاریابی شامل نمای مدیریتی، ۱۷ بخش، KPI، برنامه اقدام، ریسک‌ها و جمع‌بندی کیفیت.', { color: COLORS.muted, size: 20, before: 360, after: 0 }),
    new Paragraph({ children: [new PageBreak()] }),
    paragraph('نمای تصمیم مدیریتی', { style: 'Heading1', keepNext: true }),
    snapshot,
  ]

  model.chapters.forEach((chapter) => {
    body.push(paragraph(`${chapter.index} · ${chapter.title}`, { style: 'Heading1', keepNext: true, before: 300, after: 80 }))
    body.push(paragraph(chapter.range, { bold: true, color: COLORS.accent, size: 18, keepNext: true, after: 160 }))
    chapter.sections.forEach((section) => {
      body.push(paragraph(section.title, { style: 'Heading2', keepNext: true }))
      body.push(...sectionContent(section))
    })
  })

  const header = new Header({ children: [new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: BorderStyle.SINGLE, color: COLORS.lineStrong, size: 4, space: 4 } },
    children: [run(`MarketPilot AI · ${model.metadata.businessName}`, { bold: true, color: COLORS.muted, size: 17 })],
  })] })
  const footer = new Footer({ children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    children: [run('صفحه ', { color: COLORS.muted, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: COLORS.muted }), run(' از ', { color: COLORS.muted, size: 16 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: COLORS.muted })],
  })] })

  const document = new Document({
    creator: 'MarketPilot AI',
    title: `${model.metadata.title} - ${model.metadata.businessName}`,
    description: 'Editable RTL marketing plan report generated by MarketPilot AI',
    features: { updateFields: true },
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 21, sizeComplexScript: 21, color: COLORS.text, rightToLeft: true, language: { bidirectional: 'fa-IR' } },
          paragraph: { spacing: { after: 120, line: 300 }, alignment: AlignmentType.RIGHT },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 36, sizeComplexScript: 36, bold: true, boldComplexScript: true, color: COLORS.primary, rightToLeft: true },
          paragraph: { alignment: AlignmentType.RIGHT, spacing: { before: 260, after: 140 }, keepNext: true, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 27, sizeComplexScript: 27, bold: true, boldComplexScript: true, color: COLORS.ink, rightToLeft: true },
          paragraph: { alignment: AlignmentType.RIGHT, spacing: { before: 220, after: 100 }, keepNext: true, outlineLevel: 1, border: { bottom: { style: BorderStyle.SINGLE, color: COLORS.line, size: 3, space: 4 } } },
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 23, sizeComplexScript: 23, bold: true, boldComplexScript: true, color: COLORS.primary, rightToLeft: true },
          paragraph: { alignment: AlignmentType.RIGHT, spacing: { before: 160, after: 80 }, keepNext: true, outlineLevel: 2 },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: A4_WIDTH, height: A4_HEIGHT },
          margin: { top: 850, right: PAGE_MARGIN_X, bottom: 1020, left: PAGE_MARGIN_X, header: 420, footer: 500 },
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children: body,
    }],
  })

  return Packer.toBlob(document)
}

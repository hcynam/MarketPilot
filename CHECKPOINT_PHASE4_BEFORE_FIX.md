# Checkpoint: Before Phase 4 Fix Pass

## 1. Current Project Status

MarketPilot AI is a deterministic marketing plan generator (Vite + React 19 + TypeScript, plain CSS, no Tailwind). The app accepts business inputs via a 5-section intake form, runs 16 deterministic engine modules + orchestrator, and renders a 17-section marketing plan preview with collapsible sections, markdown copy, print styles, and an interactive KPI dashboard.

## 2. Completed Phases Through Phase 4

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Project charter and planning | Complete |
| 1 | Scaffold and foundation (Vite + React + TS shell) | Complete |
| 2 | Business intake form, data model, sample case | Complete |
| 3A | Deterministic marketing plan engine (16 modules + orchestrator) | Complete |
| 3A (Hardening) | USP fix, quality score, clear/stale behavior, noEmit | Complete |
| 3B | Results UI polish, structured report, markdown copy, print styles | Complete |
| 3B Fix Pass | Collapsible sections, full markdown export, report-only print | Complete |
| 4 | Interactive KPI Dashboard (framework, editable table, reset) | Complete |

## 3. What Currently Works

- **Load Sample Case Study** — fills the form with MarketPilot AI data
- **Generate Marketing Plan** — runs the engine and displays all 17 sections
- **Collapsible sections** — toggle open/close per section; 4 sections open by default
- **Copy as Markdown** — copies full plan to clipboard as Markdown
- **Report-only print** — hides hero, form, workflow; hides controls; forces sections open; black text
- **KPI enable/disable** — checkbox toggles per KPI, disabled rows dim
- **KPI target/benchmark editing** — inline text inputs editable by the user
- **KPI reset** — "Reset to Recommended" restores original plan values

## 4. Known Phase 4 Issues to Fix

1. **KPI recommendations do not dynamically change after changing business inputs / marketing goal and regenerating** — the KPI dashboard reads the plan's `kpiDashboard` array which is generated once by the engine and not recalculated on goal change.
2. **KPI UI table is too cramped and row heights are too tall** — the grid layout with 8 columns creates narrow cells; the formula + interpretation columns cause uneven, tall rows.
3. **Print has a mostly blank page around the KPI-to-Action-Plan transition** — `break-inside: avoid` or other print properties cause a page break between the KPI dashboard and the 30-Day Action Plan.
4. **KPI Markdown is complete but too wide/hard to read in plain Notepad** — the 6-column markdown table (Metric, Funnel Stage, Formula, Target, Benchmark, Interpretation) exceeds typical terminal/Notepad widths.

## 5. Files Likely Involved in the Next Fix

- `src/components/KpiDashboard.tsx` — dynamic KPI regeneration logic, table layout adjustments
- `src/components/KpiDashboard.css` — cell sizing, row height, print break, responsive layout
- `src/data/kpiFramework.ts` — if KPI filtering/relevance logic needs adjustment
- `src/lib/markdownExport.ts` — KPI markdown format adjustment for readability
- `src/components/MarketingPlanPreview.css` — print break rules between sections
- `src/engine/kpi-dashboard.ts` — only if engine needs to accept goal parameter for dynamic regeneration
- `src/components/MarketingPlanPreview.tsx` — integration wiring only if necessary

## 6. Strict Constraints

- No new dependencies
- No backend
- No database
- No AI API
- No root Next.js project changes (`D:\InvestmentPlatform`)
- No redesign of the whole app — targeted fixes only

## 7. Exact Verification Commands

```
npm run build
npm run dev
```

## 8. Recommended Next Step

**Phase 4 Fix Pass** focused on:

1. **Dynamic KPI regeneration** — KPI dashboard re-evaluates against the current business input/goal when the plan is regenerated
2. **KPI UI readability** — reduce cell count (combine or hide less important columns on screen), normalize row heights
3. **Print balance** — eliminate the blank page between KPI and Action Plan sections
4. **KPI Markdown readability** — narrower table or alternative format for plain-text viewing

---

*Created before the Phase 4 Fix Pass. Working directory: `D:\InvestmentPlatform\OpenCodeTest`.*

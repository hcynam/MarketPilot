# MarketPilot AI — Implementation Plan

## Phase 0: Project Charter and Planning (current)
- Inspect repo structure
- Create PROJECT_BRIEF.md, IMPLEMENTATION_PLAN.md, IMPLEMENTATION_LOG.md

## Phase 1: Scaffold and Foundation
- Initialize Vite + React + TypeScript project
- Install minimal dependencies (react, react-dom, typescript, @types/*)
- Set up folder structure:
  ```
  src/
    components/       # UI components
    engine/           # Marketing plan generation logic
    hooks/            # React hooks
    data/             # Sample case study, constants
    types/            # TypeScript types
    i18n/             # RTL/Persian support
    styles/           # Global CSS
  ```
- Configure TypeScript, ESLint
- Verify `npm run dev` and `npm run build` succeed

## Phase 2: Types, Data Model, and Sample Case
- Define all TypeScript interfaces:
  - BusinessInput (form data from user)
  - MarketingPlan (the full 17-section output)
  - Persona, Segment, Channel, KPI, etc.
- Create sample case study data (AI investment feasibility platform)
- Create constants/enums for marketing channels, metrics, stages

## Phase 3: Marketing Plan Engine
- Build pure function modules under `src/engine/`:
  - `business-summary.ts`
  - `customer-development.ts`
  - `market-segments.ts`
  - `target-market.ts`
  - `positioning.ts`
  - `personas.ts`
  - `value-proposition.ts`
  - `usp.ts`
  - `competitor-analysis.ts`
  - `marketing-mix.ts`
  - `funnel-journey.ts`
  - `channel-strategy.ts`
  - `pricing.ts`
  - `kpi-dashboard.ts`
  - `action-plan.ts`
  - `risks-assumptions.ts`
  - `quality-score.ts`
  - `orchestrator.ts` (composes all sections from BusinessInput)
- All functions are deterministic, rule-based, and tied to inputs
- No generic fluff — every output references provided data

## Phase 4: Multi-Step Form UI
- Build form wizard with steps matching input categories:
  1. Business Info (name, description, stage, industry)
  2. Customer Info (target customers, segments, personas)
  3. Market Info (competitors, channels, budget)
  4. Product Info (features, pricing, distribution)
- Responsive, polished UI with Tailwind or plain CSS modules
- Persian (RTL) support via CSS and text direction
- Progress indicator, back/next navigation
- localStorage autosave

## Phase 5: Results Dashboard
- Render all 17 sections of the marketing plan
- Print/export styles (CSS `@media print`)
- Quality score display with checklist breakdown
- Copy-as-AI-prompt button for external refinement
- Sample case study loader (one-click populate)

## Phase 6: Polish, Testing, and Deliverables
- Responsive testing (desktop, tablet, mobile)
- RTL/Persian text verification
- RTL UI testing
- Build verification (`npm run build`)
- Update IMPLEMENTATION_LOG.md with final status
- Add sample case study as default demo data
- Final README.md polish

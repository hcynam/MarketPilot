# MarketPilot AI

A lightweight AI-assisted marketing plan generator for SMEs and digital products. Built as a React + TypeScript + Vite single-page application with a secure Netlify Function boundary and a deterministic completeness engine.

## Why It Was Built

It takes structured business/product information, always creates a complete 17-section plan locally, and can use Groq or Gemini to apply a compact, validated strategy enhancement when configured.

## Course Relevance — Marketing Course Project

Covers 17 core marketing concepts as an applied software project:

- Digital marketing fundamentals
- Customer lifecycle & development
- Market segmentation & targeting
- Positioning & USP
- 7P Marketing Mix (Product, Price, Place, Promotion, People, Process, Physical Evidence)
- AIDA+LA funnel & customer journey
- Digital channel strategy
- Marketing metrics & KPIs (CTR, Conversion Rate, CPL, CAC, ROI, LTV, CPI, eCPM, CPE, CPV, etc.)
- 30-day action planning
- Risk & assumptions analysis

## Key Features

- Multi-step intake form (5 sections, 18 fields)
- Deterministic, context-aware completeness check with 3-6 clarification questions only when needed
- Built-in sample explicitly skips clarification
- Complete local 17-section plan plus compact, field-validated AI strategy patches
- Server-side Groq or Gemini integration through a Netlify Function
- Conservative request preflight, typed provider errors, safe partial-patch merging, and a two-call provider ceiling
- Strict Groq JSON Schema output with `openai/gpt-oss-120b` by default; other configured models retain validated JSON Object Mode
- Interactive KPI dashboard (12 editable metrics with toggles)
- Collapsible sections for easy navigation
- Copy as Markdown for external refinement
- Report-only browser print
- Sample case study preloaded (MarketPilot AI)
- Persian (RTL) bilingual support
- localStorage autosave
- Quality score with checklist breakdown
- Existing Markdown, Word, PDF, and print exports for internal or AI-enhanced plans

## Tech Stack

- **Framework:** React 19 + TypeScript 5.8
- **Build Tool:** Vite 6
- **Dependencies:** react, react-dom, @types/react, @types/react-dom, vite, @vitejs/plugin-react, typescript (7 packages total)
- **No client-side API key, no database, no Tailwind, no external UI libraries**

## AI and Deployment Notes

- Provider calls run through `/.netlify/functions/marketing-ai`.
- Groq/Gemini API keys must stay in Netlify environment variables and must never be exposed to frontend code.
- Do not use a `VITE_` provider key and do not commit a real `.env` file.
- Local Vite dev without a Netlify Function environment may trigger the fallback engine.
- For full AI testing, use a Netlify deployment or a Netlify local function environment.
- Strict GPT-OSS strategy requests fall back once to validated JSON Object Mode only for Groq `json_validate_failed`; all other responses still use the same local parse/normalize/validate/merge pipeline.
- See `NETLIFY_ENV_SETUP.md`, `docs/DEPLOYMENT_READINESS_CHECKLIST.md`, and `docs/AI_FINAL_QA_SCENARIOS.md`.

## How to Run Locally

```bash
cd D:\InvestmentPlatform\OpenCodeTest
npm install
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

## How to Demo

1. Open the app
2. Click **Load Sample Case Study**
3. Click **Generate Marketing Plan**
4. The built-in sample renders without clarification; incomplete custom inputs receive only decision-relevant questions
5. If a provider is configured, valid strategy improvements are merged into the complete internal plan
6. Browse the 17-section collapsible report
7. Explore the KPI dashboard — toggle metrics, edit targets
8. Click **Copy as Markdown** to export
9. Use **File → Print** (browser) for a report-only print

## Known Limitations

- AI enhancement requires Netlify Function environment variables in deployed/function-enabled environments
- Local Vite dev without the Netlify function falls back to the deterministic engine
- Generated plans are advisory and should be reviewed before use
- KPI values are planning assumptions, not real campaign data
- No user accounts or persistent storage beyond localStorage
- Persian localization is partial (hero text + RTL CSS only)

## Future Improvements

- Editable sections after generation
- Export to PDF with full formatting
- Custom template selection for different course contexts
- Multi-language full localization
- Stronger AI QA tests and deployed-function monitoring

---

*Built for Marketing Course Project — Academic Submission*

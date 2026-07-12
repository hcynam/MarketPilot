# MarketPilot AI

A lightweight AI-assisted marketing plan generator for SMEs and digital products. Built as a React + TypeScript + Vite single-page application with a secure Netlify Function boundary for Groq and a deterministic fallback engine.

## Why It Was Built

Created as a course project to demonstrate practical application of marketing concepts. It takes structured business/product information and generates a concise 17-section marketing plan using Groq when configured, with rule-based fallback when AI is unavailable.

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
- AI review flow with clarifying questions before final plan generation
- Two-step AI flow: input-quality review first, final 17-section plan second
- Server-side Groq integration through a Netlify Function
- Deterministic fallback marketing plan engine (17 sections)
- Interactive KPI dashboard (12 editable metrics with toggles)
- Collapsible sections for easy navigation
- Copy as Markdown for external refinement
- Report-only browser print
- Sample case study preloaded (MarketPilot AI)
- Persian (RTL) bilingual support
- localStorage autosave
- Quality score with checklist breakdown
- Existing Markdown, Word, PDF, and print exports for AI or fallback plans

## Tech Stack

- **Framework:** React 19 + TypeScript 5.8
- **Build Tool:** Vite 6
- **Dependencies:** react, react-dom, @types/react, @types/react-dom, vite, @vitejs/plugin-react, typescript (7 packages total)
- **No client-side API key, no database, no Tailwind, no external UI libraries**

## AI and Deployment Notes

The production AI path uses a hybrid architecture: the existing deterministic engine first creates a complete 17-section baseline in the browser, Groq returns a smaller strategic enhancement patch, and the Netlify Function validates and deterministically merges that patch. A post-merge quality gate allows one patch-only repair retry; if quality still fails, the baseline remains the final report. The form, report renderer, KPI dashboard, and Markdown/Word/PDF/print exports keep their existing contracts.

Only a compact baseline digest is sent onward to Groq; the full baseline remains inside the Function for merging. Complete inputs, including the built-in sample, skip clarification and go directly to final-plan enhancement. Incomplete or strategically ambiguous inputs use the questions flow.

- Groq calls run through `/.netlify/functions/marketing-ai` using `qwen/qwen3-32b` by default.
- `GROQ_API_KEY` is server-side only and must be stored as a Netlify Secret.
- `GROQ_MODEL`, `AI_PROVIDER`, and `AI_PROVIDER_TIMEOUT_MS` are normal non-secret Netlify variables.
- Do not use `VITE_GROQ_API_KEY` and do not commit a real `.env` file.
- Gemini and OpenRouter are deprecated for this project.
- Local Vite dev without a Netlify Function environment may trigger the fallback engine.
- For full AI testing, use a Netlify deployment or a Netlify local function environment.
- See `NETLIFY_ENV_SETUP.md`, `docs/DEPLOYMENT_READINESS_CHECKLIST.md`, and `docs/AI_FINAL_QA_SCENARIOS.md`.
- Use `docs/AI_HYBRID_QA_CHECKLIST.md` for the five required hybrid release scenarios.

## How to Run Locally

```bash
cd D:\MarketPilotAI
npm install
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

## How to Demo

1. Open the app
2. Click **Load Sample Case Study**
3. Click **Generate Marketing Plan**
4. If Groq is unavailable locally, the deterministic fallback plan renders safely
5. If Groq is configured, answer required clarifying questions when requested
6. Browse the 17-section collapsible report
7. Explore the KPI dashboard — toggle metrics, edit targets
8. Click **Copy as Markdown** to export
9. Use **File → Print** (browser) for a report-only print

## Known Limitations

- Groq generation requires Netlify Function environment variables in deployed/function-enabled environments
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

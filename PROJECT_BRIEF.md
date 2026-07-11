# MarketPilot AI — Project Brief

## Project Goal

Build a lightweight, polished, static MVP that collects structured business/product information from a user and generates a compact but academically grounded marketing plan. The output must be useful for a Marketing course presentation and strong enough to be shown as a resume/LinkedIn project.

## Scope

- Single-page or multi-step form that accepts business/product input
- Deterministic marketing plan generator (no external AI API)
- 17-section structured marketing plan output
- Persian (RTL) and English language support
- Responsive, polished UI
- localStorage for session persistence
- Sample case study preloaded for demo

## Out of Scope

- Authentication or user accounts
- Database or backend
- Real AI API integration (OpenAI, etc.)
- Payment or subscription
- Multi-tenant or SaaS infrastructure
- Advanced PDF generation (plain print/export only)
- Complex analytics or dashboards
- Real-time collaboration
- Anything that cannot be delivered in 2–3 days

## Course Concepts Reflected

1. Digital marketing fundamentals
2. Customer lifecycle
3. Customer development
4. Marketing channels
5. Market segmentation
6. Marketing evaluation
7. Digital marketing strategy
8. SEO
9. Content marketing
10. Social media marketing
11. Email marketing
12. Mobile marketing
13. Influencer marketing
14. 7 basic steps of marketing strategy
15. Marketing mix: 4P and 7P
16. USP
17. Marketing metrics (CTR, Conversion Rate, CPL, CAC, ROI, CPV, CPE, CPI, CPF, eCPM)

## Required Output Sections

1. Business Summary
2. Customer Development Stage
3. Market Segments
4. Target Market
5. Positioning Statement
6. Customer Personas
7. Value Proposition
8. USP
9. Competitor / Alternative Analysis
10. 7P Marketing Mix
11. Funnel and Customer Journey
12. Digital Channel Strategy
13. Initial Pricing Recommendation
14. KPI Dashboard
15. 30-Day Action Plan
16. Risks and Assumptions
17. Marketing Plan Quality Score

## Technical Constraints

- Framework: React + TypeScript + Vite (repo subfolder is empty)
- No backend, no database, no authentication
- No external AI API calls
- Deterministic rule-based plan generation
- localStorage for session persistence
- Clean component structure, pure functions
- Minimal dependencies
- Must build successfully with no errors

## Quality Guardrails

The quality score checks whether the plan has:
1. Clear target market
2. Specific personas
3. Non-generic USP
4. Channel-funnel alignment
5. Measurable KPIs
6. Practical 30-day plan
7. Explicit risks and assumptions

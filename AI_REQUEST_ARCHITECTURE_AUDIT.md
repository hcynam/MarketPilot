# MarketPilot AI Request Architecture Audit

Date: 2026-07-13  
Scope: `D:\InvestmentPlatform\OpenCodeTest`

## Evidence-based findings

1. `src/ai/buildBusinessBrief.ts` duplicates `currentAlternative`, `marketConstraints`, selected channels, and pricing notes across multiple nested blocks, then appends the complete `rawInput` object. The same fact can therefore be serialized two or three times.
2. `netlify/functions/_shared/promptBuilders.ts` injects the full marketing knowledge block and the full strict-rules block into both request modes. The plan prompt also repeats the 17-section list, several structured examples, and a large response example.
3. The existing plan request asks the provider to generate the complete 17-section report. The deterministic engine is used only after an AI failure instead of being generated first as the completeness layer.
4. The complete plan validator in `validateAIResponse.ts` is all-or-nothing: exactly 17 correctly titled sections, at least three KPIs, four weekly actions, risks, and a complete quality score must all pass. One malformed optional area discards every otherwise useful AI improvement.
5. The only request guard is a late 30,000-character prompt check. It does not estimate tokens, does not use mode-specific budgets, does not compress optional input, and does not report the required safe diagnostics.
6. The local source currently implements Gemini while the reported production diagnostics identify Groq/Qwen. Provider selection and error classification are not represented explicitly in the source.
7. Clarification is always attempted after form submission. There is no deterministic completeness preflight and no explicit built-in-sample state, so the sample can ask questions.
8. The current form hook recognizes sample data only by comparing all visible field values. It does not carry `source: built_in_sample` or `skipClarification`, and cannot deliberately clear stale sample state after an edit.
9. Provider errors collapse mostly into `GEMINI_REQUEST_FAILED`; 413, 429, authentication, timeout, network, 5xx, malformed JSON, partial validity, and total patch rejection are not distinct end-to-end states.
10. The final AI response replaces the baseline through `adaptAIPlanToMarketingPlan()`. There is no field-level merge diagnostic or deterministic post-merge consistency pass.

## Current data flow

`BusinessIntakeForm` -> `useBusinessForm` -> `buildBusinessBrief` (duplicated brief + raw input) -> clarification provider call -> full-report provider call -> strict whole-response validation -> full AI plan adapter -> renderer/KPI dashboard/exports. Any failure takes a separate deterministic fallback path.

## Implemented target flow

`BusinessIntakeForm` -> canonical compact brief -> deterministic completeness check -> local complete baseline -> compact baseline digest -> mode-specific preflight/compression -> provider clarification only when needed, otherwise compact strategy patch -> field-level patch validation -> safe merge + consistency pass -> unchanged renderer/KPI dashboard/exports.

The complete `BusinessInput` and complete `MarketingPlan` remain local. Provider requests contain only the compact brief, optional clarification answers, and compact baseline digest.

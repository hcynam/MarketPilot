# MarketPilot AI Hybrid QA Checklist

## Shared acceptance criteria

For every scenario, verify:

- no generic filler, repeated placeholder sentence, raw object label, or unnecessary `موضوع:` prefix;
- questions are either unnecessary or decision-changing, grounded, Persian, and limited to 3 required plus 1 optional;
- at least 3 meaningful segments and one explicit primary target;
- a concrete, defensible USP;
- all seven 7P elements;
- channels prioritized against budget, goal, stage, and capacity;
- at least 3 measurable KPIs;
- a four-week plan with week-level actions and success metrics;
- real risks with assumptions and validation tests;
- professional Persian and no visible `high`, `medium`, or `low` priority labels;
- Markdown, Word, PDF, and print exports still contain all 17 sections and the KPI dashboard;
- successful enhancement reports `planSource: ai-enhanced`; rejected patches preserve the baseline and report `planSource: internal-fallback`.

## A. MarketPilot SaaS sample

- Confirm segments distinguish founders, SME marketing managers, and consultants/agencies.
- Confirm the target, proof asset, acquisition channel, pricing, CAC/activation KPI, and USP reference the supplied SaaS facts.

## B. Local cafe

- Use a small local radius, modest budget, repeat-visit goal, and offline/social/map channels.
- Confirm segments are local and behavioral, 7P includes physical evidence and service process, and KPIs include footfall/redemption/repeat visits.

## C. Online English course

- Include learner level, outcome, instructor proof, trial lesson/webinar, and course pricing.
- Confirm personas and funnel distinguish discovery, trust, enrollment, completion, and referral.

## D. Vague low-quality input

- Leave target, differentiation, budget, and competition weak.
- Confirm questions ask tradeoffs that change STP/channel/pricing/KPI decisions and do not repeat already answered form fields.
- If the patch remains weak after one repair retry, confirm the deterministic baseline is shown instead of low-quality AI content.

## E. Small-budget consulting/service business

- Use a narrow service offer, small team, limited budget, and lead-generation goal.
- Confirm channel choices favor expertise, referrals, outreach, partnerships, or a focused webinar/content experiment instead of broad paid media.
- Confirm pricing and KPI recommendations reflect sales-cycle and capacity constraints.

## Diagnostics to inspect

- Provider failures: `Groq provider diagnostic`.
- Patch validation failures: `AI validation diagnostic` with safe issue summaries and top-level keys.
- Quality rejection: `AI patch quality diagnostic` with `validationIssues`, `qualityIssues`, `patchTopLevelKeys`, and `planSource`.
- Never expect API keys, Authorization headers, or full raw provider bodies in logs.

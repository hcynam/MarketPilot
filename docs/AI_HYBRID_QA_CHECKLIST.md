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

## Patch rejection and partial-enhancement checks

- Verify direct patches and wrappers under `patch`, `aiPatch`, `enhancementPatch`, `marketingPatch`, `data`, `result`, or `output` are unwrapped recursively.
- Verify an array response reports `AI returned an array instead of patch object`.
- Verify an empty object reports `AI patch object is empty after parsing/unwrapping`.
- Verify every `AI_PATCH_REJECTED` has at least one non-empty validation or quality issue plus parse stage, patch type, top-level keys, baseline/answer flags, and repair status.
- Verify a patch with at least 3 useful strategic areas produces `ai-partially-enhanced`; 5 or more produces `ai-enhanced`. Missing or invalid areas must remain baseline content.
- Verify the built-in sample scores as sufficient and skips questions, while the incomplete cafe and vague fixtures enter questions mode.
- Verify provider HTTP/timeout/empty/JSON failures keep precise `GROQ_*` error codes and never become `AI_PATCH_REJECTED` before a patch object exists.
- In the MarketPilot sample, select explicit target/channel answers and confirm those exact choices appear in the enhanced target, channel, KPI, action, pricing, or trust recommendations.

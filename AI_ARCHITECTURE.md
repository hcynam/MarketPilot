# MarketPilot AI — Request Architecture

## Responsibility split

The deterministic engine is the completeness layer. It always creates the full 17-section `MarketingPlan` used by the report UI, KPI dashboard, Markdown, Word, PDF, and print paths.

The provider is an optional enhancement layer. It receives one compact business brief plus a compact baseline digest and returns a small strategy patch. The complete form object and complete baseline plan never cross the Netlify Function boundary.

## Request flow

1. `buildBusinessBrief()` normalizes form data into one canonical compact object, removes empty values, deduplicates arrays, and deterministically truncates abnormal free text.
2. `assessBusinessCompleteness()` decides locally whether clarification is meaningful. Complete inputs skip the clarification provider call.
3. The built-in sample carries explicit `source: built_in_sample` and `skipClarification: true` state. Any meaningful edit clears that state.
4. The deterministic engine creates the complete baseline locally.
5. `buildBaselineDigest()` extracts only the facts needed for strategic improvement.
6. Every provider request passes through a mode-specific preflight with character counts, conservative token estimation, output budget, compression state, and a local block decision.
7. Clarification mode returns only 3-6 decision-relevant questions. Strategy mode returns only optional patch areas.
8. Patch validation is area-level and item-level. Valid positioning can be retained even if pricing is invalid; one invalid persona does not discard another valid persona.
9. The composer merges accepted areas into the complete baseline and runs a deterministic consistency pass. Missing or rejected patch areas retain their internal values.
10. The UI labels the result as internal-only, AI-enhanced, partially AI-enhanced, or clarification-required.

## Budgets

| Mode | Prompt characters | Output tokens | Total estimated tokens |
|---|---:|---:|---:|
| Clarification | 7,000 | 600 | 3,200 |
| Strategy patch | 12,000 | 2,300 | 7,000 |

Token estimation weights Persian/non-ASCII text more conservatively and adds a 15% margin. Optional notes are removed and the budget is recalculated before a request is blocked. A blocked payload never reaches the provider.

## Providers and security

The Netlify Function supports Groq Chat Completions and Gemini `generateContent` without an SDK. `AI_PROVIDER` selects the provider; when it is absent, an available `GROQ_API_KEY` selects Groq, otherwise Gemini is used. API keys remain server-side and are never logged or returned.

The recommended Groq default is `openai/gpt-oss-120b`. GPT-OSS 20B/120B strategy requests use strict JSON Schema Structured Outputs and `reasoning_effort: low`; all schema properties are required, optional values are nullable, and every object rejects additional properties. Other Groq models use JSON Object Mode plus wrapper/alias normalization and area-level validation. Qwen-compatible requests hide reasoning, and parsing always consumes only final assistant `content`.

If Groq specifically rejects the primary strict strategy request with `json_validate_failed`, the Function makes one JSON Object Mode fallback request. That response still passes through local JSON parsing, normalization, area/item validation, and safe merge. This fallback and the existing transient retry policy share one explicit two-call ceiling, so they cannot combine into three or more provider calls.

Safe response diagnostics record provider status, finish reason, content/reasoning character counts, parse success, raw/normalized top-level key names, one recognized wrapper, unknown keys, and accepted/rejected areas. Complete content, prompts, business input, credentials, and hidden reasoning are never logged.

Safe diagnostics contain mode, provider, model, prompt/digest/answer character counts, estimated tokens, output budget, compression flags, and the local block decision. They never contain authorization headers, raw provider bodies, or environment values.

## Failure behavior

- 413 and 429 are not retried.
- 401/403 are classified as authentication failures without exposing secret details.
- Timeout, network failure, and provider 5xx may receive one controlled retry with a short backoff.
- A strict Groq `json_validate_failed` may receive one JSON Object Mode fallback instead of a retry.
- `AI_PROVIDER_TIMEOUT_MS` is preferred, with `AI_TIMEOUT_MS` and `GEMINI_TIMEOUT_MS` retained for backward compatibility.
- Empty response, malformed JSON, schema mismatch, partial patch, and total patch rejection are distinct states.
- One local JSON wrapper/extraction recovery is allowed; no large AI repair request is sent.
- Every failure preserves the complete internal plan.

See `AI_REQUEST_ARCHITECTURE_AUDIT.md` for the pre-change evidence and `tests/` for request, scenario, provider-failure, merge, KPI, and export coverage.

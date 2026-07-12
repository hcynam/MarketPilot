# MarketPilot AI Architecture

> Historical Gemini production notes below are deprecated. The current runtime provider is OpenRouter.

## Phase AI-1 Scope

This phase adds the AI foundation only. Gemini is not wired yet, no Netlify API function is created, no API key is added, and the current rule-based app flow remains unchanged.

## Planned AI Flow

1. User enters the business intake form.
2. The app packages the form into a structured business brief.
3. The Netlify Function sends the brief to OpenRouter for input-quality review.
4. OpenRouter returns either clarifying questions or a ready-for-plan signal.
5. If clarification is needed, the user answers the questions.
6. A second OpenRouter call generates the final structured marketing plan.
7. The Netlify Function validates the JSON response.
8. The app renders the final plan through the existing 17-section report UI.
9. Markdown, Word, and PDF exports continue to use the rendered plan.
10. If AI or API validation fails, the current rule-based engine remains the fallback.

## Two AI Calls

- Call 1: clarifying questions only. It must not generate the final plan.
- Call 2: final marketing plan only after the input is sufficient or assumptions are accepted.

## Server-Side OpenRouter Integration

OpenRouter is called only from the Netlify Function at `/.netlify/functions/marketing-ai`. `OPENROUTER_API_KEY` stays server-side as a Netlify Secret; the frontend never receives provider credentials. The function uses the Chat Completions endpoint, parses `choices[0].message.content`, strips optional JSON fences through the shared parser, and validates both supported response modes before returning data.

The current configuration is `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL`, and `OPENROUTER_APP_NAME`. Only the API key is secret. Free models may be rate-limited and are suitable for demo/testing. The older Gemini environment variables and runtime setup are deprecated.

## Phase AI-2 Function Foundation

Phase AI-2 originally introduced the server-side Gemini boundary. That provider implementation has now been replaced by OpenRouter without changing the function route, prompt builders, validators, frontend flow, report renderer, exports, or deterministic fallback.

The frontend infrastructure now includes:

- `src/ai/marketingAIClient.ts` for POST calls to `/.netlify/functions/marketing-ai`
- `src/ai/buildBusinessBrief.ts` for packaging the current business form into an AI-ready brief
- `src/ai/fallbackPlan.ts` for preserving the deterministic engine fallback

Phase AI-3 connects the Generate button to the user-triggered AI flow while preserving the deterministic fallback path.

Request size limits, prompt size limits, and provider timeout protection ensure oversized inputs and slow provider responses fail safely.

## Phase AI-3 UI Integration

Phase AI-3 connects the existing Generate Marketing Plan action to `buildBusinessBrief()`, `requestClarifyingQuestions()`, and `requestFinalMarketingPlan()`. If the provider asks for more information, the app shows a Persian RTL clarifying-questions panel and requires mandatory answers before the final AI plan call.

Validated final AI responses are converted by `src/ai/aiPlanAdapter.ts` into the existing `MarketingPlan` structure, so the original 17-section renderer and Markdown, Word, PDF, and print exports remain the output path. If AI is unavailable, times out, returns invalid JSON, or fails validation, `generateFallbackMarketingPlan()` renders the deterministic rule-based plan with a safe Persian fallback message.

## Validation

AI output must be valid JSON and pass local validators before the UI uses it:

- `validateClarifyingQuestionsResponse`
- `validateFinalMarketingPlanResponse`
- `safeParseJson`

Invalid AI output should return a safe error or fall back to rule-based generation.

## AI-1 Hardening

The AI-1 hardening pass tightened the contracts before Gemini wiring:

- Clarifying questions now include priority and decision-impact metadata.
- Final plan output now uses stronger structured expectations for channel recommendations, 7P items, funnel stages, segments, personas, KPI items, weekly action plans, and quality scoring.
- Validators reject malformed, obviously weak, incomplete, duplicated, or hard-to-render output while avoiding unnecessary brittleness around normal wording.
- Prompt builders instruct the provider to ask diagnostic questions when inputs are vague, contradictory, suspicious, or low-value.
- These historical foundation notes predate the current OpenRouter runtime integration.

## API Usage Control

AI calls happen only after explicit user actions, such as clicking an AI review or generate button. The app does not call OpenRouter automatically on every keystroke, page load, or localStorage restore.

## Knowledge Strategy

The course PDF is distilled into `marketingKnowledgeBase.ts` instead of sending the full course every time. This keeps prompts smaller, lowers cost, reduces latency, and turns course material into operational rules that the model can apply consistently.

## Current Fallback

The existing deterministic marketing engine remains important. It provides a build-safe baseline, works without network access, and should be used when AI is unavailable, invalid, rate-limited, or disabled.

## Phase AI-4 Release Readiness

Phase AI-4 completes final QA and release documentation. The release state preserves the user-triggered two-step AI flow, deterministic fallback, server-side OpenRouter boundary, JSON validation, request/prompt size guards, timeout protection, and existing Markdown, Word, PDF, and print exports.

Final manual deployment work remains environment-specific: configure Netlify variables, redeploy, test the UI against the deployed Function, and verify AI and fallback scenarios using `docs/AI_FINAL_QA_SCENARIOS.md` and `docs/DEPLOYMENT_READINESS_CHECKLIST.md`.

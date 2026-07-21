# MarketPilot AI - Deployment Readiness Checklist

## Build

- [ ] `cmd /c "npm run build"` passes.
- [ ] No dependency was added for final QA unless explicitly justified.

## Netlify Environment

- [ ] `AI_PROVIDER` is set to `groq` or `gemini`.
- [ ] Only the selected provider's server-side API key and model are configured.
- [ ] For Groq, `GROQ_MODEL=openai/gpt-oss-120b` is configured and the project permits that model.
- [ ] `AI_PROVIDER_TIMEOUT_MS` is optionally configured, for example `25000` (`AI_TIMEOUT_MS` and `GEMINI_TIMEOUT_MS` are legacy fallbacks).
- [ ] No `VITE_` secret variables are used.
- [ ] Site is redeployed after environment variable changes.

## Function and AI Flow

- [ ] Test the AI function indirectly through the UI Generate action.
- [ ] Confirm the built-in sample asks zero questions and incomplete custom input asks 3-6 questions.
- [ ] Confirm required clarifying answers block final generation until answered.
- [ ] Confirm a complete input can reach the final 17-section plan.
- [ ] Confirm fallback by removing or invalidating the key in a safe test environment.

## Exports

- [ ] Test Markdown export after AI generation.
- [ ] Test Word export after AI generation.
- [ ] Test PDF export after AI generation.
- [ ] Test print preview after AI generation.
- [ ] Repeat export smoke check for fallback plan.

## UI and Content

- [ ] Test mobile layout at a narrow viewport.
- [ ] Test Persian/RTL readability.
- [ ] Confirm fallback message is professional and does not expose raw errors.
- [ ] Confirm report title uses the generated input snapshot business name.

## Academic Demo

- [ ] Rehearse sample-load, generate, report, KPI, and export flow.
- [ ] Explain clarifying questions as input-quality control.
- [ ] Explain course concept coverage: STP, USP, 7P, funnel, channels, and KPI.
- [ ] Explain fallback as reliability and demo safety.

## Portfolio / LinkedIn Positioning

- Position as: "Complete internal marketing planning with server-side, budget-guarded AI strategy enhancement."
- Avoid claiming it is a fully autonomous marketing consultant.
- Mention that generated plans are advisory and should be reviewed before use.

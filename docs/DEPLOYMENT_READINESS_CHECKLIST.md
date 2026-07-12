# MarketPilot AI - Deployment Readiness Checklist

## Build

- [ ] `cmd /c "npm run build"` passes.
- [ ] No dependency was added for final QA unless explicitly justified.

## Netlify Environment

- [ ] `OPENROUTER_API_KEY` is configured as a Netlify Secret and is available to Functions.
- [ ] `OPENROUTER_MODEL` is configured as a non-secret variable, for example `openrouter/free`.
- [ ] `OPENROUTER_SITE_URL` is configured as a non-secret variable with the deployed site URL.
- [ ] `OPENROUTER_APP_NAME` is configured as a non-secret variable, for example `MarketPilot AI`.
- [ ] No `VITE_` secret variables are used.
- [ ] Site is redeployed after environment variable changes.
- [ ] Demo testing accounts for rate limits on free OpenRouter models.

## Function and AI Flow

- [ ] Test the AI function indirectly through the UI Generate action.
- [ ] Confirm clarifying questions can appear when input is weak.
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

- Position as: "AI-assisted, course-informed structured marketing planning with server-side OpenRouter integration and deterministic fallback."
- Avoid claiming it is a fully autonomous marketing consultant.
- Mention that generated plans are advisory and should be reviewed before use.

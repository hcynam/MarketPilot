# Netlify Environment Setup

MarketPilot AI calls OpenRouter only through the server-side Netlify Function at `/.netlify/functions/marketing-ai`.

## Required Variables

Add these variables in Netlify:

- `OPENROUTER_API_KEY` (Secret)
- `OPENROUTER_MODEL` (not Secret)
- `OPENROUTER_SITE_URL` (not Secret)
- `OPENROUTER_APP_NAME` (not Secret)

Recommended model value:

```text
openrouter/free
```

## Setup Steps

1. Open the Netlify project for MarketPilot AI.
2. Go to Site configuration.
3. Open Environment variables.
4. Add `OPENROUTER_API_KEY` with the real key and mark it as a Secret.
5. Add `OPENROUTER_MODEL` with `openrouter/free` (not Secret).
6. Add `OPENROUTER_SITE_URL` with the deployed site URL (not Secret).
7. Add `OPENROUTER_APP_NAME` with `MarketPilot AI` (not Secret).
8. Ensure the variables are available to Functions and redeploy the site.

## Security Rules

- Never use `VITE_OPENROUTER_API_KEY`.
- Never commit a real `.env` file.
- Never place OpenRouter credentials in `src/`.
- Frontend code cannot hide secrets; all OpenRouter calls must go through `/.netlify/functions/marketing-ai`.
- `.env.example` must contain placeholders only.

Free OpenRouter models may have rate limits and are intended for demo and testing workloads.

## Deprecated Gemini Setup

The former `GEMINI_API_KEY`, `GEMINI_MODEL`, and `GEMINI_TIMEOUT_MS` production setup is deprecated and is no longer read by the runtime function.

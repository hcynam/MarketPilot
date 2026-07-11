# Netlify Environment Setup

MarketPilot AI calls Gemini only through the server-side Netlify Function at `/.netlify/functions/marketing-ai`.

## Required Variables

Add these variables in Netlify:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_TIMEOUT_MS` (optional)

Recommended model value:

```text
gemini-1.5-flash
```

## Setup Steps

1. Open the Netlify project for MarketPilot AI.
2. Go to Site configuration.
3. Open Environment variables.
4. Add `GEMINI_API_KEY` with the real Gemini API key.
5. Add `GEMINI_MODEL` with `gemini-1.5-flash` or the selected Gemini model.
6. Optionally add `GEMINI_TIMEOUT_MS` with `25000` to cap Gemini wait time.
7. Ensure the variables are available to Functions.
8. Redeploy the site after saving environment variables.

## Security Rules

- Never use `VITE_GEMINI_API_KEY`.
- Never commit a real `.env` file.
- Never place Gemini credentials in `src/`.
- Frontend code cannot hide secrets; all Gemini calls must go through `/.netlify/functions/marketing-ai`.
- `.env.example` must contain placeholders only.

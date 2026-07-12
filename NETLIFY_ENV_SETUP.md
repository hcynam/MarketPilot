# Netlify Environment Setup

MarketPilot AI uses Groq as its production AI provider through the server-side Netlify Function at `/.netlify/functions/marketing-ai`.

## Required Variables

Add these variables in Netlify:

- `GROQ_API_KEY` (Secret)
- `GROQ_MODEL` (not Secret)
- `AI_PROVIDER` (not Secret)
- `AI_PROVIDER_TIMEOUT_MS` (not Secret)

Recommended model value:

```text
qwen/qwen3-32b
```

## Setup Steps

1. Open the Netlify project for MarketPilot AI.
2. Go to Site configuration.
3. Open Environment variables.
4. Add `GROQ_API_KEY` with the real key and mark it as a Secret.
5. Add `GROQ_MODEL` with `qwen/qwen3-32b` (not Secret).
6. Add `AI_PROVIDER` with `groq` (not Secret).
7. Add `AI_PROVIDER_TIMEOUT_MS` with `18000` (not Secret).
8. Ensure the variables are available to Functions and redeploy the site.

## Security Rules

- Never use `VITE_GROQ_API_KEY`.
- Never commit a real `.env` file.
- Never place Groq credentials in `src/`.
- Frontend code cannot hide secrets; all Groq calls must go through `/.netlify/functions/marketing-ai`.
- `.env.example` must contain placeholders only.

## Deprecated Provider Setup

The former Gemini and OpenRouter production variables are deprecated and are no longer read by the runtime function.

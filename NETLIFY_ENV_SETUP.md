# Netlify AI Environment Setup

MarketPilot calls AI providers only through `/.netlify/functions/marketing-ai`. No provider secret belongs in frontend code or in a committed real `.env` file.

## Groq

Set these Netlify environment variables:

- `AI_PROVIDER=groq`
- `GROQ_API_KEY=<real server-side key>`
- `GROQ_MODEL=openai/gpt-oss-120b` (recommended; supports strict JSON Schema output)
- `AI_PROVIDER_TIMEOUT_MS=25000` (optional; `AI_TIMEOUT_MS` and `GEMINI_TIMEOUT_MS` remain supported as legacy fallbacks)

## Gemini alternative

- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY=<real server-side key>`
- `GEMINI_MODEL=gemini-2.5-flash` (or another verified compatible model)
- `AI_PROVIDER_TIMEOUT_MS=25000` (optional)

Timeout precedence is `AI_PROVIDER_TIMEOUT_MS` → `AI_TIMEOUT_MS` → `GEMINI_TIMEOUT_MS` → `25000`. Only finite positive values are accepted.

After changing environment variables, trigger a new Netlify deployment so the Function receives them. Never use `VITE_GROQ_API_KEY`, `VITE_GEMINI_API_KEY`, or any client-visible secret. The application remains usable with the internal plan if provider configuration is missing or invalid.

## Supabase staging

Use the following names for local Netlify Dev and for the Netlify staging/Deploy Preview context:

- `VITE_SUPABASE_URL`: the staging project URL; public and included in the browser build.
- `VITE_SUPABASE_ANON_KEY`: the staging publishable key (preferred) or legacy anon key; public and included in the browser build.
- `SUPABASE_URL`: the same staging project URL, read only by Netlify Functions. If this is omitted, the function falls back to `VITE_SUPABASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`: the staging service-role secret, read only by `account-registration`.
- `KAVENEGAR_VERIFY_TEMPLATE`: the exact Kavenegar Verify Lookup template name used for OTP SMS. Required together with `KAVENEGAR_API_KEY` and `SUPABASE_SMS_HOOK_SECRET` for the Send SMS hook.

For local work, enter the values directly in `.env.local`; never paste them into chat or `.env.example`. For Netlify, set them in the site environment-variable UI and scope them to Deploy Previews/branch deploys as appropriate. Do not place `SUPABASE_SERVICE_ROLE_KEY` in `netlify.toml`, and do not give it a `VITE_` prefix.

The account Function is called through the same-origin path `/.netlify/functions/account-registration`. It intentionally sends no permissive CORS header; cross-origin browser access is not part of the application contract.

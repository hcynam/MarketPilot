# MarketPilot AI - Final QA Scenarios

Use these scenarios for final manual testing, demo rehearsal, and release checks.

## 1. Weak B2C Local Store Input

Sample input summary:
- Pet supplies shop in one city
- General target customer such as "pet owners"
- Small monthly budget
- Weak differentiation and incomplete competitor details

Expected behavior:
- AI should ask clarifying questions before final planning.
- Questions should focus on target customer, budget, local competitors, channels, and differentiation.

Pass/fail checklist:
- [ ] Generate triggers input-quality review.
- [ ] Clarifying questions panel appears.
- [ ] Required questions cannot be skipped.
- [ ] Optional questions can remain empty.
- [ ] Final plan uses local retail channels and practical KPIs.

Tester notes:
- Use this to prove the app does not pretend weak input is complete.

## 2. Complete B2B/SaaS-Like Input

Sample input summary:
- B2B software product with clear buyer persona, budget, competitors, pricing, and channels
- Example channels: LinkedIn, content marketing, email, website, demo calls

Expected behavior:
- AI may go directly to final plan or ask fewer clarifying questions.
- Plan should include LinkedIn, content, email, demo or sales-led logic, and CAC/LTV/churn-style KPI thinking where relevant.

Pass/fail checklist:
- [ ] Generate produces either ready-for-plan or a short clarification step.
- [ ] Final report renders in the existing 17-section UI.
- [ ] KPI dashboard appears.
- [ ] Export buttons remain visible.

Tester notes:
- Good main portfolio demo scenario.

## 3. Education or Service Business

Sample input summary:
- Online course, tutoring service, consulting practice, or workshop business
- Needs trust, proof, trial, and lead nurturing

Expected behavior:
- Plan should include credibility evidence, trial session or webinar, referral, email nurturing, and trust-building content.

Pass/fail checklist:
- [ ] Target market and personas reflect a service/education buyer.
- [ ] Funnel includes trust and lead nurturing.
- [ ] 7P section includes people, process, and proof.
- [ ] Action plan includes a concrete first-month campaign.

Tester notes:
- Use this to connect the product to course concepts beyond SaaS.

## 4. Very Vague or Nonsense Input

Sample input summary:
- Business name only, vague product text, unclear customer, no meaningful competition or budget

Expected behavior:
- AI should not treat the input as sufficient.
- It should ask diagnostic questions or fall back safely if the response fails validation.

Pass/fail checklist:
- [ ] No crash.
- [ ] No raw technical error shown.
- [ ] Clarifying questions are diagnostic and practical, or fallback plan renders safely.
- [ ] Required answers are enforced before final generation.

Tester notes:
- Use this as a stress test for responsible planning behavior.

## 5. Missing API Key or Local Vite Without Netlify Function

Sample input summary:
- Load sample case and click Generate in plain Vite dev without a function environment

Expected behavior:
- Fallback plan renders.
- Persian fallback message appears.
- App does not crash.

Pass/fail checklist:
- [ ] Generate button does not hang.
- [ ] Existing deterministic report renders.
- [ ] 17 sections appear.
- [ ] Exports remain visible.

Tester notes:
- This is the expected local no-key behavior.

## 6. Gemini Timeout or Invalid JSON

Sample input summary:
- Simulate timeout or invalid AI output in a safe test environment

Expected behavior:
- Fallback plan renders.
- User sees a safe Persian message.
- Raw provider or validation details are not displayed to the user.

Pass/fail checklist:
- [ ] Timeout produces fallback.
- [ ] Invalid JSON produces fallback.
- [ ] Validation failure produces fallback with professional copy.
- [ ] Console logs do not expose secrets.

Tester notes:
- Use Netlify function logs for technical diagnosis, not the frontend UI.

## 7. Export Check

Sample input summary:
- Test once with a Gemini-generated plan and once with a fallback plan

Expected behavior:
- Markdown, Word, PDF, and print all use the existing 17-section report content.
- Export title uses the generated input snapshot business name.

Pass/fail checklist:
- [ ] Markdown copy works.
- [ ] Word download starts.
- [ ] PDF download starts.
- [ ] Print preview hides form/hero sections.
- [ ] Fallback plans export too.

Tester notes:
- Export content is advisory and should be reviewed before external submission.

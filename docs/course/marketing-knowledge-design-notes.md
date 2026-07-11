# Marketing Knowledge Design Notes

## Purpose

Phase AI-1 converts the course deck into a compact operational layer for future Gemini prompts. The goal is not to summarize the course for a human reader. The goal is to make MarketPilot AI produce practical, measurable, course-aligned marketing plans.

## Transformation Approach

The course topics were converted into four reusable layers:

- Knowledge base: course concepts turned into decision rules, channel guidance, KPI logic, and business-type playbooks.
- Plan rules: strict guardrails that prevent vague, generic, overconfident, or unmeasurable output.
- Prompt rules: two-stage instructions for clarification first and final planning second.
- AI output structure: TypeScript contracts and validators for predictable JSON.

## Knowledge Base Design

The knowledge base keeps the course spine:

- digital marketing foundations
- customer lifecycle
- customer development
- segmentation, targeting, positioning
- channels
- marketing evaluation
- SEO
- content marketing
- social media
- email
- mobile
- influencer marketing
- USP
- KPI cost metrics
- low-budget guerrilla marketing

Each topic is expressed as an operational rule:

- when to prioritize it
- when it is not the first priority
- what actions fit it
- which KPIs measure it
- what risks or cautions apply

## Plan Rules Design

The plan rules force every recommendation to be traceable to:

- user input
- clarifying answers
- course knowledge
- explicit assumptions

They also require every channel recommendation to include:

- channel
- goal
- action
- KPI
- risk or caution

## Prompt Rules Design

The future AI flow uses two prompts:

1. Clarifying questions prompt: checks input quality and asks only questions that materially improve the final plan.
2. Final plan prompt: uses the form input, clarifying answers, knowledge base, and rules to generate the 17-section plan.

Both prompts require valid JSON only. No markdown, commentary, or prose outside JSON is allowed.

## AI Output Structure

The schema separates:

- clarifying question responses
- final marketing plan sections
- KPI items
- weekly 30-day action plan items
- risks
- quality score

The final plan must include the existing 17 Persian report sections so the current renderer and export flow can be adapted in a later phase without redesigning the report structure.

## Maintenance Notes

- If a better text version of the course becomes available, update `marketing-course-extracted.md` first.
- Then revise `marketingKnowledgeBase.ts` with operational rules, not raw course text.
- Keep prompt blocks compact so API calls remain cost-aware.
- Keep validators dependency-free unless a later phase explicitly chooses a schema library.


# Design skill workflow

For UI and UX work in MarketPilot AI:

1. Use `ui-ux-pro-max` for design-system research, layout, typography, color, spacing, components, and Persian RTL recommendations.
2. Use `impeccable` for critique, anti-pattern detection, accessibility, responsive behavior, edge states, hardening, and final polish.
3. Use `motion-framer` only after the static visual direction and interactions are approved, for purposeful micro-interactions and transitions.
4. Do not let the skills independently redesign the same surface with conflicting systems.
5. Preserve existing business logic, form behavior, AI flows, validation, exports, and Netlify integration.
6. Separate visual changes from functional or API changes.
7. Work section by section and review diffs before broad changes.
8. Respect Persian RTL, mobile layout, reduced motion, keyboard use, and visible focus.
9. Avoid generic AI aesthetics, excessive gradients, nested cards, excessive rounding, decorative icons without function, and gratuitous animation.
10. Do not add production dependencies without checking the existing stack, bundle impact, and actual need.

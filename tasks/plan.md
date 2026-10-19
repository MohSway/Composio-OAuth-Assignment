# AuthPilot build plan

Scope and architecture are final per user spec (pasted in conversation). This is a build order, not a design discussion.

## Phase 1 — Hands-on verification (blocking, do first)
1. GitHub: register a real OAuth app in Developer Settings. Capture actual steps, scopes, callback behavior, gotchas.
2. Google: create OAuth client in Cloud Console + walk the consent screen setup. Capture verification requirements for sensitive scopes.
3. LinkedIn: use existing dev account, apply for/request products in Developer Portal. Capture real review gating.
   - If blocked on any (e.g. missing login), STOP and ask — never mark "tested" without doing it.

## Phase 2 — Guide content
4. Write `/data/guides/github.json`, `google.json`, `linkedin.json` from Phase 1 findings. `evidence: "tested"`.
5. Doc-source `slack.json`, `salesforce.json`, `shopify.json`, `twitter.json` from current official docs. `evidence: "doc-sourced"`.
   - Every guide's `agentPrompt` must be provider-specific (real SDK names, callback routes, scopes, authorize URLs) — no generic template reuse.

## Phase 3 — App
6. Scaffold Next.js (app router), `/data/guides`, `/components`, `/lib`.
7. Marketplace page — match `design-reference/marketplace.html` exactly (tokens, layout, search, filter chips).
8. Guide detail page — match `design-reference/guide-page.html` exactly (TOC, copy-prompt panel, copy-code buttons, download .md).
9. Live generation: `app/api/generate/route.ts`, Claude API + web_search tool, streamed, same schema, flat-file cache for the session.

## Phase 4 — Ship
10. Local verification: golden path (search → view guide) + edge cases (unknown app → live gen, filters, copy/download).
11. README.md: setup, decisions (why 3-of-7 hands-on, why these 7), limitations.
12. Deploy to Vercel.

## Checkpoints
- After Phase 1: confirm all 3 guides are genuinely evidence:"tested" before writing any UI.
- After Phase 3: visual check against both reference HTML files side by side.
- Before deploy: confirm no real secrets committed, `.env.example` only.

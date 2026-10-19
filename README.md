# AuthPilot

Clear, actionable guides for registering and getting approved to use an OAuth app with a provider — what to do, how long it takes, and what might block you. Built as a take-home project.

## Setup

```bash
npm install
cp .env.example .env.local
# fill in .env.local:
#   GEMINI_API_KEY   - free key from https://aistudio.google.com/apikey
#   TAVILY_API_KEY   - free key from https://tavily.com (1,000 credits/month, no card)
npm run dev
```

Open `http://localhost:3000`. The 7 library guides load instantly from static JSON — no API key needed to browse those. The two keys above are only needed for **live generation** (searching for an app not in the library).

## Key product decisions

**Why 7 apps, and why these 7.** The brief asked for deliberately varied friction: GitHub (instant, no review), Google and LinkedIn (self-serve but gated — sensitive-scope verification and a Company-Page/product-request model, respectively), and four more doc-sourced providers (Slack, Salesforce, Shopify, Twitter/X) that each have a distinct shape of friction (App Directory review, ISV security review, custom-vs-public app, and pay-per-use access). The goal was range, not count.

**Why 3-of-7 are hands-on tested, not all 7.** The brief asked for a representative sample, not full coverage — GitHub, Google, and LinkedIn were chosen because they cover the three distinct friction shapes (instant, review-gated, product-gated) and because real accounts were available to register real throwaway OAuth apps against. A short audit trail of what was actually found during each walkthrough is in [`tasks/verification-log.md`](tasks/verification-log.md). Slack, Salesforce, Shopify, and Twitter/X are clearly labeled doc-sourced — built from each provider's current official docs, not claimed as tested.

**Single schema, no drift.** Every guide — library or live-generated — is the exact same JSON shape (`lib/types.ts`). The marketplace card, the guide detail page, the agent-prompt panel, and the downloadable `.md` are all rendered from that one object, so there's one source of truth per app.

**Why Tavily + Gemini instead of the Claude API for live generation.** The brief originally specified the Claude API's web-search tool. In practice: the Anthropic API needs separate billing from a Claude.ai Pro subscription, and wasn't available for this build. Google's Gemini API offers a genuinely free key with no card required, but its native Google Search grounding tool turned out to require a billing-enabled project even within its "free" quota (confirmed directly: plain generation works on the free key, adding the grounding tool alone returns `429 RESOURCE_EXHAUSTED` every time). The live-generation route (`app/api/generate/route.ts`) instead calls **Tavily** (`/search` then `/extract`, free tier, no card) to pull real current doc content, then feeds that extracted text into a plain Gemini `generateContentStream` call with no model-native search tool on either side. This keeps the "investigates real docs in real time" requirement intact without needing a paid account anywhere in the pipeline.

**Streaming, not a blocking spinner.** The marketplace page streams newline-delimited status events (`searching → reading → writing the guide`) from the API route as they happen, shown in a dashed "Investigating…" box matching the design reference. Once the guide is complete, the browser navigates to its detail page. Generated guides are cached to `data/generated-cache/*.json` (gitignored) so a repeat query doesn't re-research from scratch in the same deployment.

**No database.** The 7 library guides are static JSON committed to the repo (`data/guides/*.json`). Live-generated guides are cached to the filesystem. This is the right amount of persistence for the brief — anything more would be over-engineering for a stateless demo.

## Evidence tags

Every guide carries one of three tags, shown in the guide header:

- **Hands-on tested** — GitHub, Google, LinkedIn. A real OAuth app/client was actually registered and walked through; the guide reflects what was found, including things the provider's own docs got wrong or left out.
- **Doc-sourced** — Slack, Salesforce, Shopify, Twitter/X, and every live-generated guide. Built from current official documentation (fetched live via Tavily for generated guides), not a hands-on walkthrough.
- **Uncertain** — reserved in the schema for cases where even the docs are ambiguous; unused in the current library.

## What's untested / what could break

- **Live generation depends on two free external APIs.** If Tavily can't find a provider's docs (very new or very obscure apps), or finds low-quality pages, the generated guide's `agentPrompt` specifics (real URLs, real env var names) could be wrong. There's no fact-checking pass after generation.
- **The Gemini free tier has real rate limits.** Heavy concurrent use of live generation will eventually hit a 429; the UI surfaces the error cleanly but doesn't retry or queue.
- **The three hands-on test apps/projects were left in place** (GitHub OAuth App "AuthPilot Verification App", Google Cloud project "authpilot-verification", and read-only inspection of the developer's existing LinkedIn app — no new LinkedIn app was created because its logo-upload step needs a native file picker this environment's browser automation can't drive). None hold real user data or secrets beyond the throwaway test credentials.
- **No automated tests.** Given the project's scope and timeline, verification was manual: built, ran locally, clicked through the golden path and edge cases (search → view guide, filter chips, unknown app → live generation, copy/download) in a real browser. See [`tasks/verification-log.md`](tasks/verification-log.md) for the hands-on audit trail.
- **Mobile layout** was checked at a few widths (the guide page's side TOC correctly stacks below the content per the spec), but not exhaustively across devices.

## Project structure

```
app/
  page.tsx                 marketplace (server component, loads library guides)
  guide/[slug]/page.tsx    guide detail (library or cached live-generated guide)
  api/generate/route.ts    live generation: Tavily search+extract -> Gemini -> cache
components/                Marketplace, AppCard, GuideDetail, CopyButton, FrictionBadge
data/guides/*.json         the 7 pre-built guides (single source of truth per app)
data/generated-cache/      live-generated guides, cached per session (gitignored)
lib/types.ts               the one Guide schema everything renders from
lib/guides.ts               filesystem loader + cache read/write
lib/markdown.ts             renders a Guide as the downloadable .md
tasks/verification-log.md  hands-on audit trail from the GitHub/Google/LinkedIn walkthroughs
```

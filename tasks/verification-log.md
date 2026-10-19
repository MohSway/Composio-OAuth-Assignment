# Hands-on verification log

Real audit trail from walking through each provider's actual developer console.
No secrets are recorded here. Test apps were created under the developer's own
free account for this purpose only.

## GitHub — tested

- Created at Settings → Developer settings → OAuth Apps → New OAuth App
  (`github.com/settings/applications/new`). App name "AuthPilot Verification App".
- **Redirect URIs are now a list, not a single field.** GitHub supports up to 10
  redirect URIs per app, each addable/removable individually, plus an optional
  "Allow wildcard matching" toggle per URI. Older docs/tutorials assume one
  callback URL field — that's no longer the UI.
- **"Expire user access tokens" is checked by default on new apps.** This means
  new OAuth Apps get short-lived access tokens (8h) + a refresh token, not the
  classic non-expiring token. It's listed under "Optional features" as an
  opt-out, but defaults to ON for apps created today. A minimal code sample that
  only does the initial code-for-token exchange (like most tutorials show) will
  silently stop working after 8 hours unless refresh-token handling is added.
- "Enable Device Flow" is a separate opt-in checkbox at creation time, for apps
  that want the device-code flow (e.g. CLIs) instead of/alongside the web flow.
- Client secret is genuinely shown once ("Make sure to copy your new client
  secret now. You won't be able to see it again.") — confirms the common
  knowledge here is accurate.
- Authorize screen now shows trust signals on new/small apps: "Not owned or
  operated by GitHub", "Created less than a day ago", "Fewer than 10 GitHub
  users". A brand-new app looks visibly unvetted to early users — worth knowing
  if you're demoing this to someone.
- No review or approval step anywhere in this flow — app is usable immediately
  after registration, as expected.
- Test app left in place (0 users, unused secret) pending developer's call on
  whether to delete it.

## Google — tested

- Created a dedicated GCP project ("AuthPilot Verification") rather than reusing
  the developer's existing project, to keep this test isolated.
- **The "OAuth consent screen" has been rebranded/restructured to "Google Auth
  Platform."** It's no longer one form — it's a 4-step wizard: App Information
  → Audience → Contact Information → Finish. Docs/tutorials that say "go to
  OAuth consent screen" are describing an interface that no longer exists in
  this shape.
- Audience step offers Internal (Workspace-org only, no verification needed)
  vs External (any Google account). For a personal Gmail-based project, only
  External is realistic.
- Creating the actual OAuth client (Credentials → Create OAuth client) now has
  a checkbox: **"Use this client for an AI-powered agent."** New, and directly
  relevant to this product's audience — worth flagging as a gotcha/novelty in
  the guide rather than ignoring it.
- Client secret is shown exactly once, same one-time-reveal pattern as GitHub.
- New OAuth clients are immediately gated: "OAuth access is restricted to the
  test users listed on your OAuth consent screen" — you cannot authorize with
  *any* account, even your own, until it's added as a test user while the app
  is in Testing.
- **Scopes are scoped to enabled APIs.** The scope picker only lists scopes for
  APIs you've already enabled in the API Library — e.g. Calendar/Drive scopes
  don't appear until the Calendar/Drive API is turned on for the project first.
  This is an easy early stumbling block: "add the scope" assumes a step
  (enabling the API) that isn't mentioned in the step itself.
- Confirmed concrete, specific numbers under Audience → OAuth user cap: **while
  Publishing status is "Testing," only explicitly-added test users can use the
  app, and the cap is 100 users total before verification — counted over the
  entire lifetime of the app**, not just concurrently. This is more precise
  than "verification takes days to weeks" and worth stating exactly.
- Publishing requires completing the Branding page first ("To publish your
  app, you must complete your configuration on the Branding page.") — branding
  (app name, logo, support links) is a prerequisite gate before you can even
  attempt to move out of Testing, separate from the verification review itself.
- Did not submit for actual verification (multi-day/week human review queue,
  not something to trigger against a throwaway test project) — the Testing-mode
  behavior and user cap above are directly observed, the verification queue
  timeline itself is doc-sourced, and the guide should say so.

## LinkedIn — tested

- Attempted to create a brand-new app ("AuthPilot Verification"). Found at
  creation time:
  - **An app must be linked to a real LinkedIn Company Page, not a personal
    profile** — the picker is literally labeled "LinkedIn Page," and the UI
    warns "This action can't be undone once the app is saved."
  - **App logo is a required field** (marked with `*`), not optional — square
    image, at least one dimension ≥100px. Privacy policy URL, by contrast, is
    optional at creation.
  - Could not complete creation of a *new* throwaway app in this session: the
    logo upload opens a native OS file picker that this browser-automation
    session can't drive. Rather than leave a half-created app, the form was
    abandoned and verification continued against the developer's existing
    real app ("Content-manager") in read-only inspection — no settings on
    that real app were changed.
- **Products tab confirms the "each gated by its own review" structure
  directly:** "Added products" showed "Share on LinkedIn" (Default Tier) and
  "Sign In with LinkedIn using OpenID Connect" (Standard Tier) already
  active — these are the two that are effectively self-serve/instant.
  "Available products" (Advertising API, Lead Sync API, Matched Audiences
  API, etc.) each have their own standalone "Request access" button — there
  is no single "apply once" step; every additional product is its own
  request.
- **Requesting a gated product requires verifying a separate business email**
  (not the developer's LinkedIn login email) via a one-time code sent to that
  address — a distinct, easy-to-miss gate before the actual review even
  starts. Did not submit a real verification code / access request against
  the developer's live company page — the dialog was inspected and closed
  without submitting, to avoid triggering a real review queue entry with no
  real product need behind it.
- **Scopes are not picked directly — they come from which products are
  added.** The Auth tab lists granted scopes (`openid`, `profile`, `email`
  from the Sign In product; `w_member_social` from Share on LinkedIn) as a
  direct consequence of the Products tab, not a separate scopes UI.
- **Access tokens are long-lived: 2 months (5,184,000 seconds)** per the
  Auth tab's "Token time to live duration" — notably longer than GitHub's
  8-hour default or Google's short-lived access tokens, and worth calling
  out explicitly since it changes how much refresh-token plumbing a minimal
  integration actually needs.
- No review/approval needed at all for the default Sign-In + Share products;
  the "apply to the Developer Program" friction is real but specifically
  about requesting additional, non-default products — confirmed directly
  from this account's own app rather than assumed from docs.


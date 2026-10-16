<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep public pages at top-level routes and private app pages under the client-only `_authenticated` layout; this preserves one public home and a single account gate.
- Keep account state in one root subscriber and private profile access owner-scoped through the generated browser client; this avoids duplicate session listeners and enforces database privacy.
- Treat authentication, trust requests and accepted circle relationships, AskHer / Trust Ripples, private question ownership metadata, replies, Perspective Map, AI perspective synthesis, Wingwoman, and persisted demo data as existing functional systems; extend their current paths rather than duplicate or replace working logic.
- Trust edges change only through owner-checked database functions (send, respond, cancel, find by exact email, circle listing, extended-reach count) so other members never see emails, raw ids beyond lookup, or second-degree identities; existing question publication, visibility, deletion, and reporting workflows use checked database functions rather than direct member table writes; author identity belongs only in owner-readable question metadata, never in shareable question rows.
- Share profile validation and editing between account onboarding and Profile; database triggers enforce attestation and field limits independently of the UI.
- Keep avatars in owner-scoped private storage and strip uploaded image metadata; short-lived signed links prevent public identity exposure.
- Keep reusable editorial styling in semantic global design tokens and shared components; extend existing functional screens and retain genuine empty states without rebuilding navigation.
- Replies and Perspective Map data flow only through visibility-checked database functions (one reply per member, never by the question author); the map lists perspectives in a fixed order so no answer reads as winning.
- Wingwoman AI calls run only in an authenticated server function that saves the session under the caller's own row; the composer reloads drafts by owner-scoped session id, never via URL text, so situations stay private.
- Keep Wingwoman source context separate from editable Ripple state in the existing four-step composer, and publish through the explicit ripplePublication field allowlist only at final confirmation; this prevents private source/session data from leaking into shared questions.
- Perspective synthesis is generated on demand in an authenticated server function that reads replies only through the visibility-checked reply functions and is gated by a shared meaningful-reply threshold; it is never stored and never replaces the map.
- Persisted fictional demo accounts, connections, questions, replies, and picks already exist; keep demo setup in the existing controlled scripts (scripts/seed-demo.ts and scripts/seed-eva-network.ts), never seed on app load or mistake demo content for display-only mocks, so normal member workflows retain their privacy checks.
- Trusted Picks are owner-written rows readable by others only through a function limited to the reader's accepted direct circle, exposing just the recommender's first name; no ratings or ranking, so provenance is the only signal.
- Member profiles are read only through the viewer-checked tellher_member_profile function (owner discoverability + viewer trust context); avatars are signed server-side after that check, so raw profiles stay owner-only and storage paths never leave the server.
- Extended Circle discovery lists only discoverable second-degree members through the checked tellher_extended_circle function (one trust path shown); Trust Bridges are ordinary trust requests, so there is a single relationship model.
- Global search (tellher_search) only composes the viewer-checked profile, shelf and feed functions and matches fields they already return; section filters run client-side over data those same functions return.

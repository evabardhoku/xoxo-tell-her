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
- Keep all trust, Ripple, response, and AI surfaces presentation-only until explicitly requested; no simulated data or actions may imply implemented product logic.
- Trust edges change only through owner-checked database functions (send, respond, cancel, find by exact email, circle listing, extended-reach count) so other members never see emails, raw ids beyond lookup, or second-degree identities; question tables stay read-only for members until explicit workflows are implemented; author identity belongs only in owner-readable question metadata, never in shareable question rows.
- Share profile validation and editing between account onboarding and Profile; database triggers enforce attestation and field limits independently of the UI.
- Keep avatars in owner-scoped private storage and strip uploaded image metadata; short-lived signed links prevent public identity exposure.
- Keep reusable editorial styling in semantic global design tokens and shared foundation components; later functionality can replace empty states without rebuilding navigation.
- Replies and Perspective Map data flow only through visibility-checked database functions (one reply per member, never by the question author); the map lists perspectives in a fixed order so no answer reads as winning.

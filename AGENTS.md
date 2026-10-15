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
- Keep reusable editorial styling in semantic global design tokens and shared foundation components; later functionality can replace empty states without rebuilding navigation.

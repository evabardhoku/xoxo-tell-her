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

- Public routes stay top-level; private routes use client-only `_authenticated` to avoid redirect loops.
- One root auth subscriber clears queries before identity changes and ignores stale lookups; profiles stay owner-scoped.
- Extend checked systems/demo data; never duplicate paths.
- Trust/content writes use checked functions. Ripple identity uses additive checked publication/representation, immutable visibility, and private ownership. Named first names are Ripple-scoped; anonymous identity and responder privacy never change.
- Share profile validation and editing between account onboarding and Profile; database triggers enforce attestation and field limits independently of the UI.
- Open Avatars use private storage, stripped metadata, short-lived links and checked photo/illustration rendering. Anonymous display masks randomize on checked reads independently of profiles; historical storage stays untouched.
- Use semantic tokens, shared editorial controls and genuine empty states; disclosures demote tools without removing access.
- Replies and Perspective Map data flow only through visibility-checked database functions (one reply per member, never by the question author); the map lists perspectives in a fixed order so no answer reads as winning.
- Wingwoman AI turns run only in authenticated server functions sharing one gateway helper and safety prompt, saved under the caller's rows; drafts reload by owner-scoped session id, never URL text, so situations stay private.
- Keep Wingwoman source context separate from editable Ripple state in the existing four-step composer, and publish through the explicit ripplePublication field allowlist only at final confirmation; this prevents private source/session data from leaking into shared questions.
- AI synthesis is authenticated and on-demand: checked Ripple identity selects checked replies/comments, and only bodies reach AI. Shared meaningful-response gating avoids filler; summaries are not stored and never replace responses or the map.
- Read scoped `AGENTS.md` first.
- Picks are owner-written, read by others only through an accepted Direct Circle check exposing the recommender's first name; no ratings or ranking.
- Profiles use tellher_member_profile viewer checks; avatars are signed afterward server-side. Raw profiles and storage paths stay private.
- Extended discovery uses tellher_extended_circle; Connect uses ordinary trust requests, not a second relationship model.
- Search composes checked profile, shelf and feed sources; client-side filters never broaden access.
- Feed and Constellations compose checked sources client-side, ordered by trust distance, topic and freshness; no new access.
- Between Us messaging is one-to-one only, readable by participants via RLS, with all writes (open, send, read marker, block, report) through checked database functions that re-check accepted Direct trust and blocks on every send; it is never initiated from anonymous content.
- One app-shell navigation list includes Wingwoman; named Ripples return to My Feed and anonymous Ripples to Sky via a shared identity helper. Hubs keep all sub-pages reachable and filter the same checked feed.
- Echo/Echo Rooms/The Other Side/Letters: anonymous Ripple add-ons via checked functions only. One Echo per member; counts and room entry (author + echoers) only at ECHO_THRESHOLD (mirrors DB); room voices are stable numbers; outcomes are author-only, private by default, shared only within Ripple reach; Letters (echoers, or the author after a shared outcome) are read only via tellher_letters with author_id column-revoked; none are searchable.
- Progressive disclosure uses owner-scoped activity and account cutoff only to soften emphasis; no scores, hidden routes or blocked direct navigation.
- Field Notes reuse trust_notes; writes and optional Ripple linkage go through tellher_save_field_note, with append-only consent receipts for own anonymous links and viewer-checked context/read functions, so links never broaden Ripple or profile access.
- Moderation roles live only in user_roles; queue/actions use checked mod functions returning content without identities, logged, removal in place. Abuse limits are insert triggers on the rate_limits table; notification copy is neutralised by trigger.
- Account deletion deletes the auth user (rows cascade); safety resources are config in src/lib/safety.ts. Trust Codes: hashed, row-locked checked functions that create ordinary accepted trust_connections.

- Password reset requires verified recovery or its user-bound session marker, never URL flags; blocked storage must not break it.
- Tests run serially: hosted auth and abuse limits are shared. Check fixture writes and reads for errors.

- Ripple detail reuses checked reply-likes and outcomes; decorative reply masks never use profiles. Trust Letter reveals the checked outcome, preserving author-only/private defaults.

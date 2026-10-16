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

- Public pages use top-level routes; private pages use client-only `_authenticated` to avoid session redirect loops.
- One root auth subscriber clears queries before identity changes and ignores stale initial lookups; private profiles remain owner-scoped.
- Extend existing auth, trust relationships, Ripples/private ownership, replies, Perspective Map/synthesis, Wingwoman and persisted demo systems; never duplicate or replace working paths.
- Trust/content writes use checked functions. Ripple identity uses additive checked publication/representation, immutable visibility, and private ownership. Named first names are Ripple-scoped; anonymous identity and responder privacy never change.
- Share profile validation and editing between account onboarding and Profile; database triggers enforce attestation and field limits independently of the UI.
- Avatars use private owner storage, stripped metadata and short-lived links; shared viewer-checked Open Avatar rendering honors photo/illustration choices.
- Use semantic global tokens/shared editorial components; retain genuine empty states. UI simplification demotes controls without removing stored data or checked access paths.
- Replies and Perspective Map data flow only through visibility-checked database functions (one reply per member, never by the question author); the map lists perspectives in a fixed order so no answer reads as winning.
- Wingwoman AI turns run only in authenticated server functions sharing one gateway helper and safety prompt, saved under the caller's rows; drafts reload by owner-scoped session id, never URL text, so situations stay private.
- Keep Wingwoman source context separate from editable Ripple state in the existing four-step composer, and publish through the explicit ripplePublication field allowlist only at final confirmation; this prevents private source/session data from leaking into shared questions.
- Perspective synthesis is generated on demand in an authenticated server function that reads replies only through the visibility-checked reply functions and is gated by a shared meaningful-reply threshold; it is never stored and never replaces the map.
- Read subdirectory `AGENTS.md` before edits for scoped rules.
- Picks are owner-written, read by others only through an accepted Direct Circle check exposing the recommender's first name; no ratings or ranking.
- Member profiles are read only through the viewer-checked tellher_member_profile function (owner discoverability + viewer trust context); avatars are signed server-side after that check, so raw profiles stay owner-only and storage paths never leave the server.
- Extended Circle discovery lists only discoverable second-degree members through the checked tellher_extended_circle function; Trust Bridges are ordinary trust requests, so there is a single relationship model.
- Global search (tellher_search) only composes the viewer-checked profile, shelf and feed functions and matches fields they already return; section filters run client-side over data those same functions return.
- The Current and Constellations only compose existing checked sources client-side (no feed table), ordered by trust distance, topic, freshness, so they never grant access their sources don't.
- Between Us messaging is one-to-one only, readable by participants via RLS, with all writes (open, send, read marker, block, report) through checked database functions that re-check accepted Direct trust and blocks on every send; it is never initiated from anonymous content.
- One app-shell `navigation` list (My Feed = named Ripples, Sky = anonymous Ripples + Constellations, My Circle, Profile), all filtering the same checked feed; nested-route `match` and hub controls keep every sub-page reachable from this single IA source.
- Echo/Echo Rooms/The Other Side/Letters: anonymous Ripple add-ons via checked functions only. One Echo per member; counts and room entry (author + echoers) only at ECHO_THRESHOLD (mirrors DB); room voices are stable numbers; outcomes are author-only, private by default, shared only within Ripple reach; Letters (echoers, or the author after a shared outcome) are read only via tellher_letters with author_id column-revoked; none are searchable.
- Progressive disclosure uses owner-scoped activity and account cutoff only to soften emphasis; no scores, hidden routes or blocked direct navigation.
- Field Notes reuse trust_notes; writes and optional Ripple linkage go through tellher_save_field_note, with append-only consent receipts for own anonymous links and viewer-checked context/read functions, so links never broaden Ripple or profile access.
- Moderation roles live only in user_roles; queue/actions use checked mod functions returning content without identities, logged, removal in place. Abuse limits are insert triggers on the rate_limits table; notification copy is neutralised by trigger.
- Account deletion deletes the auth user (rows cascade); safety resources are config in src/lib/safety.ts. Trust Codes: hashed, row-locked checked functions that create ordinary accepted trust_connections.

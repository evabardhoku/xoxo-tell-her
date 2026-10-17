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

- Public routes stay top-level; private routes use client-only `_authenticated`. Landing links select validated auth modes; members get one feed entry.
- One root auth subscriber clears queries before identity changes and ignores stale lookups; profiles stay owner-scoped.
- Extend checked systems; never duplicate paths. tellher_member_ready gates access (now: confirmed email, names, attestation); dormant invite functions allow re-tightening; invite errors never block signup.
- Trust/content writes use checked functions. Ripple identity uses additive checked publication/representation, immutable visibility, and private ownership. Named first names are Ripple-scoped; anonymous identity and responder privacy never change.
- Onboarding and Profile share validation/editing; triggers independently enforce attestation and field limits.
- Open Avatars use private storage, stripped metadata, short-lived links and checked photo/illustration rendering. Anonymous display masks randomize on checked reads independently of profiles; historical storage stays untouched.
- Use semantic tokens, shared controls and genuine empty states; disclosures never remove access.
- Visual refinement stays in the shared stylesheet and existing controls; reuse checked MemberAvatar everywhere so presentation changes cannot bypass profile privacy.
- Replies and Perspective Map data flow only through visibility-checked database functions (one reply per member, never by the question author); the map lists perspectives in a fixed order so no answer reads as winning.
- Wingwoman AI turns run only in authenticated server functions sharing one gateway helper and safety prompt, saved under the caller's rows; drafts reload by owner-scoped session id, never URL text, so situations stay private.
- Keep Wingwoman source context separate from editable Ripple state in the four-step composer; publish only the ripplePublication allowlist at final confirmation, preventing private source/session leaks.
- AI synthesis is authenticated and on-demand: checked Ripple identity selects checked replies/comments, and only bodies reach AI. Shared meaningful-response gating avoids filler; summaries are not stored and never replace responses or the map.
- Picks are owner-written; checked accepted Direct Circle reads expose only recommender first name. No ratings or ranking.
- Profiles use tellher_member_profile viewer checks; avatars are signed afterward server-side. Raw profiles and storage paths stay private.
- Profile discussion lists use tellher_member_ripples (named-only, profile-checked and tellher_can_view); Wingwoman stars use targetless tellher_my_stars, so anonymous ownership is never associated with a public profile.
- Circle groups code exchanges apart from membership invites; discovery and requests reuse checked sources.
- Search composes checked profile, shelf and feed sources; client-side filters never broaden access.
- Feed and Constellations compose checked sources client-side, ordered by trust distance, topic and freshness; no new access.
- Between Us messaging is one-to-one only, readable by participants via RLS, with all writes (open, send, read marker, block, report) through checked database functions that re-check accepted Direct trust and blocks on every send; it is never initiated from anonymous content.
- One shell navigation includes Wingwoman. Shared identity navigation returns named Ripples to Feed and anonymous to Sky. Hubs preserve sub-page access and checked feeds.
- Echo/Echo Rooms/The Other Side/Letters: anonymous Ripple add-ons via checked functions only. One Echo per member; counts and room entry (author + echoers) only at ECHO_THRESHOLD (mirrors DB); room voices are stable numbers; outcomes are author-only, private by default, shared only within Ripple reach; Letters (echoers, or the author after a shared outcome) are read only via tellher_letters with author_id column-revoked; none are searchable.
- Disclosure uses owner activity/account cutoff only for emphasis; never scores, hides routes or blocks navigation.
- Field Notes reuse trust_notes; writes and optional Ripple linkage go through tellher_save_field_note, with append-only consent receipts for own anonymous links and viewer-checked context/read functions, so links never broaden Ripple or profile access.
- Moderation roles live only in user_roles; queue/actions use checked mod functions returning content without identities, logged, removal in place. Abuse limits are insert triggers on the rate_limits table; notification copy is neutralised by trigger.
- Account deletion removes auth with cascading rows. Safety uses src/lib/safety.ts. Trust Codes are hashed, row-locked and create ordinary accepted connections.

- Password reset requires verified recovery or its user-bound session marker, never URL flags; blocked storage must not break it.
- Run tests serially for shared auth/limits; check fixture read/write errors.

- Ripple detail reuses checked reply-likes and outcomes; decorative reply masks never use profiles. Trust Letter reveals the checked outcome, preserving author-only/private defaults.

# TellHer submission cleanup

## Goal
Make TellHer easier to understand and more polished for submission without adding features, deleting member content, or weakening privacy. Prioritize a convincing core experience over a claim of perfect production readiness.

## What to keep
- The current navigation: My Feed, Wingwoman, Sky, My Circle, Profile. Wingwoman stays immediately after My Feed.
- The core journey: reflect privately → choose what to share → receive human perspectives → build trusted connections.
- Anonymous identity protections, audience choices, account controls, safety notices and existing access rules.
- The warm editorial visual identity and clear distinction between your content and other members’ content.

## What to simplify
1. **Sky:** keep its signature constellation view, but reduce competing emphasis from topic summaries and recent stories. Make the anonymous questions and “Ask anonymously” action easy to find without removing access to Constellations.
2. **Profile:** show identity, editing and shared knowledge first. Put Avatar Studio and privacy/data controls behind clearly labelled expandable sections. Keep all existing capabilities reachable.
3. **Ripple detail:** keep the question and human perspectives central. Make Afterwards and related material quieter; avoid empty optional sections. Replace visible legacy “Ask” back links with the appropriate My Feed or Sky destination.
4. **Wingwoman:** simplify the first-screen hierarchy and shorten the start action. Keep conversation history and first instinct secondary, with privacy and safety notices intact.
5. **Presentation:** correct awkward or inconsistent wording, long labels, duplicated prompts and cramped phone controls. Keep genuine empty and error states, with no invented activity.

## Final checks
- Check phone and desktop navigation, profile/avatar display, comment expansion and page readability.
- Verify account switching and the private reflection-to-Ripple journey, including cancellation and final sharing confirmation.
- Run relevant existing tests serially where account-creation rate limits make parallel runs unreliable.
- Report any unverified email delivery, social sign-in or external-service behavior explicitly.
- Do not publish automatically; publication remains a separate decision.

## Technical scope
Use existing shared controls, semantic styling tokens, checked data sources and routes. This is a presentation cleanup, not a schema or permission rewrite. Preserve leaf-page metadata and avoid private information in previews. Update tests only for changed navigation or behavior, not styling or wording.

## Submission priorities
Finish hierarchy, wording and phone usability first; then verify the central journey. No new features, ranking systems, visual redesign or destructive feature removal.
# Anyone’s Guide handover, 7 October 2026, v0.8.7

Continue from the complete cumulative v0.8.7 source, built on v0.8.6. Package/lockfile are 0.8.7. Nothing was deployed during this work. Read [the current upgrade and Gemini reminder](../UPGRADE-v0.8.7-personal-recommendations.md), [verification](verification.md), and the retained v0.8.6/v0.8.5 handovers for city/badge/import implementation details.

## Current product decisions

The central value is sharing a friend's favourite places, with their selection, notes and stars. Boris challenged the Google migration and its cost, clutter and relevance. Google integration is paused pending demonstrated value. Earlier photo-provider proposals and the separate Google UI Kit assessment are research, not the accepted build direction.

Optional photo uploads and external source links were discussed but are not implemented or authorised by this reader-only release. Screenshot/message import is already implemented and remains optional alongside direct search. Boris has not enabled the Gemini server integration yet. Do not claim a live extraction has been verified.

Boris approved the reader-card hierarchy and a two-line guide introduction preview. He explicitly rejected changing the first-save moment. Preserve the existing inline search, selection, optional note, explicit Save and navigation to the editor. No extra screen, forced preview, completion target or personalisation requirement.

## v0.8.7 implementation

PlaceRow now shows the exact author note under the name, with location/distance below it. PlaceSheet follows the same hierarchy for list/map openings. Note-free rows remain compact. The collapsed From [author] preview shows up to two lines, preserving original line breaks and wrapping long words. Expansion reveals the exact full text. No empty introduction is shown.

Only PlaceRow.tsx, PlaceSheet.tsx and reader CSS changed in application source. No dictionary/shared copy, dependency, SQL, server handler or hosting configuration change. Version files and release documentation updated. The full previous screenshot importer, city display aliases, Netlify badge clearance, stars, guest/recovery and sharing flows are retained.

## Verified and outstanding

160 existing automated tests and the production build pass. Six local headless Chromium layouts using actual reader components with fixture data passed at 320/390/768 px in EN/PL, including notes/empty notes, introduction expansion/collapse and long-note dialog behaviour. EN/PL screenshots were inspected. This is simulated viewport browser QA, not actual iPhone/Android or live API acceptance. The older inability to launch a browser is historical, superseded for these reader checks only.

Live Gemini/OCR and its project quota, deployed Netlify routing/rate limit, real venue matching, live map/badge/phone behaviour and messaging/auth/recovery acceptance remain outstanding. Nothing was deployed, migrated or changed in an external account.

## Working style

Preserve the latest user English/Polish copy and author-written text. Avoid em dashes in system copy. Keep clean editorial design, optional input and useful map/list experiences. Think through product value before adding integrations. Run checks appropriate to risk, reuse existing coverage and avoid adding implementation-mirroring tests for small visual changes. State verified evidence separately from live/mobile work. Deliver cumulative source and concrete setup instructions. Do not deploy, send messages or change external settings without authorisation.

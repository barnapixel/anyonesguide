# Anyone’s Guide handover, 4 October 2026, v0.8.5

Continue from the full v0.8.5 archive. Read the implementation and [current setup/acceptance](../UPGRADE-v0.8.5-screenshot-import.md); the previous [v0.8.4 handover](anyones-guide-handover-v0.8.4.md) retains the broader agreed architecture and product decisions. Do not treat older Eat-first onboarding documents as current behaviour.

## Decisions retained

Anyone’s Guide is one person’s city recommendations for friends. Keep the warm editorial style, clean interface and natural latest English/Polish copy. Avoid em dashes in system copy; preserve author-written punctuation and language. Keep direct search immediately available to someone who knows their first place.

We rejected cluttered discovery feeds, Google-like rating/photo lists without comparable data, and mandatory memory-prompt screens. The optional screenshot shortcut and pasted-text option help people bring together recommendations they already have. AI is used for extraction, not guide generation, rewriting, translation, ratings or automatic recommendations.

No Stay category, account sync for browser Saved Guides, automatic stars, public-by-default guides, auto-sending to requesters, Google review-account connection or extra sign-in steps were introduced. Existing invitation recovery, short links, privacy choices, editing queues, map controls and share copy remain.

## New implementation

`RecommendationImport.tsx` is shared by FirstPlace and AddPlaces. FirstPlace keeps the original explicit manual selection/Save flow. The importer handles one image or pasted text, venue confirmation, opt-in source notes, selection, explicit batch Save and recovery. It uses owner/guest/local existing save paths, including later category intent and durable guest saves. Local sequential imports use current store state to avoid losing earlier entries.

`recommendationImport.ts` contains the client request, browser image preparation and seven-day account/guide-scoped review checkpoint. Original source files/messages are not persisted. Expired reviews are pruned at startup. A first import’s partial note failure restores its review even if the pin already exists. A later import checkpoint does not force the ordinary editor into first-place mode.

`netlify/functions/recommendation-import.mjs` is a stateless Gemini REST proxy. The key is server-only; configuration is required. It validates inputs, bounded streamed bodies, image signatures and structured output. Text source quotations are checked against the supplied text. Source material is treated as data; no tools or external browsing are provided to Gemini. The host rate-limit declaration still needs live verification.

The current public Netlify badge is an injected iframe. The source stylesheet anchors the observed `nl-badge-frame` above existing bottom controls with safe-area padding. Its internal layout and popover are still Netlify-owned. This is a narrow override of observed markup, not a supported configurable provider API; real devices remain to be checked.

## Evidence and next work

Package/lockfile are 0.8.5. Dependencies and all ten migrations are unchanged. **150 automated tests and the TypeScript/Vite build pass.** New tests cover actual React/store behaviour and Request/Response execution using provider/search/database fixtures. Image processing uses a decoder/canvas fixture, not a real browser.

No Gemini API key was available. No real screenshot extraction, live provider matching, Netlify routing/rate-limit enforcement, live database/auth change or deployment was performed. Browser installation failed. Phone keyboard/layout/photo-picker/badge checks and receiving-app share acceptance remain outstanding.

Next step is configuring the server key and enable flag, then testing representative real screenshots and the actual mobile flow. Do not describe these as verified until they have been exercised. The upgrade note contains the precise setup and outstanding acceptance cases.

## Working style

Think through the product behaviour before changing it. Keep scope clear, preserve decisions/copy, take authorised work to completion and distinguish local automated evidence from live/mobile checks. Explain material limitations plainly. Deliver complete integrated source releases with setup instructions. Do not publish or change an external account unless authorised.

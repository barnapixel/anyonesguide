# Verification for v0.8.7

The existing 160 automated tests pass with zero failures, skips or cancellations. No new automated suite cases were added for the small presentation change. TypeScript/Vite production build passes, with the retained main/MapLibre chunk warnings. Dependency pins, all ten migrations, server/configuration files, English/Polish copy and first-save/editor behaviour are unchanged.

Local headless Chromium rendered the actual PublicGuide, PlaceRow and PlaceSheet with fixture data at 320, 390 and 768 px in EN and PL. Six viewport/language combinations passed: note-before-location order, compact rows without notes, two-line collapsed introduction, normal expansion/collapse, omission of an empty introduction, dialog focus/Escape, full long-note rendering without sheet horizontal overflow and a visible directions action. EN/PL screenshots were visually inspected. This checks real browser rendering at simulated widths, not actual Android/iOS behaviour, a live map or a deployed backend.

No live Gemini request, provider quality check, Netlify setting change, database change or deployment occurred. Real phone/browser acceptance, Gemini/OCR, Netlify function routing/quota/rate limiting, live maps/badge and retained messaging/auth/recovery checks remain outstanding. See [the v0.8.7 upgrade and Gemini reminder](../UPGRADE-v0.8.7-personal-recommendations.md).

## Historical v0.8.6 evidence

# Verification for v0.8.6

**160 automated tests pass**, with zero failures, skips or cancellations. TypeScript/Vite production compilation passes. Dependency pins and all ten migrations are unchanged. Known main/MapLibre chunk-size warnings remain.

Ten new regression cases cover country-aware city aliases, preservation of legitimate regional/borough names, provider identity/coordinates, deduplication/query aliases, existing cloud editor/public/own/Explore summaries, new cloud/guest creation, old guest invitation lookup and recovery, saved shortcut bytes/route identity, EN/PL crawler titles and exact author notes. Two of those ten cases cover conditional CSS lane injection/removal/private-toolbar isolation and map-padding calculations.

The cloud/guest/provider tests use fixtures. Badge tests examine CSS/DOM rules in jsdom, including important override declarations. They do not measure browser geometry or certify stacking against Netlify’s actual inline styles. jsdom does not render safe areas, keyboards or iframes. The map-padding helper is exercised, but the real MapLibre camera and late-frame observer still require browser acceptance.

No new browser render, live city-provider query, Netlify account change, photo-provider request, live Gemini request or deployment was performed. No actual top-100-city API audit or photo-coverage percentage is claimed. The screenshot import live checks remain outstanding. See [current upgrade/acceptance](../UPGRADE-v0.8.6-city-labels-and-badge.md).

## Historical v0.8.5 evidence

# Verification for v0.8.5

150 automated cases pass with no failures, skips or cancellations. TypeScript/Vite production compilation passes. The known MapLibre chunk warning remains. The frontend main chunk also crosses Vite’s 500 kB warning threshold; compilation is successful.

New tests exercise the actual import client, review component, Editor, AddPlaces and cloud/guest/local save stores, with extraction/search/database networking replaced by fixtures. They cover EN/PL, unchecked candidates, explicit save, opt-in exact source quotes, unchanged existing notes/stars, category intent, duplicate prevention, interrupted and partial saves, the first pin’s failed note, reopening, durable guest writes, local sequential batches, review expiry/account scope, native file-input retention and return focus.

Image-request assembly and clipboard handling use a fixture decoder/canvas. They verify local preparation before submission, metadata-free request assembly, no original-image persistence and format/size/pixel limits. They do not verify actual browser image decoding, photo-picker behaviour, visual layout or OCR quality.

Direct Request/Response tests execute the new Netlify handler using the documented Gemini Interactions REST shape. They verify stateless requests, current model configuration, JSON semantic validation, exact text quotations, deduplication, body/image bounds, origin/content-type guards, disabled operation, incomplete or malformed output, provider failure and rate-limit responses. Native Netlify rate-limit enforcement is not simulated.

No live Gemini key was available. No real extraction, Geoapify matching-quality evaluation, Supabase auth/database deployment or Netlify deployment was performed. Chromium installation failed because the download was invalid, so no viewport/browser screenshot check is claimed.

The existing 131-case baseline is retained below as historical scope. See the v0.8.5 upgrade note for live/device acceptance.

## Historical v0.8.4 verification

# v0.8.4 integrated-source verification

## Checks executed

`npm test` passes **131 cases**, with zero failures or skips. `npm run build` passes TypeScript and Vite production compilation. Installed dependencies were reused; none was added or updated. Package and lockfile remain 0.8.4. No new advisory scan, live-provider or hosting check is claimed.

The actual React Editor/FirstPlace/owner/guest store flows are exercised with remote services/config replaced at boundaries. Search/selection stay inline and do not add a guide row. Save produces the inferred category and exact note before showing the real editor row, focus and truthful confirmation. EN/PL empty states, existing notes, category-aware subsequent additions and historical routes remain covered.

Ten additional cases cover: pending selection/text reopening without sending, guarded slow Save, partial cloud note failure/latest-value recovery/no duplicate, blocked guest storage with truthful retry, inline replacement without Eat bias, removal of the final row, fresh-module checkpoint bytes and account/guide isolation, blocked checkpoint storage memory fallback, malformed/expired/future/oversized/invalid checkpoints, and scoped success cleanup. Existing first-guide cases are rewritten around explicit Save; ordinary editor/read/share/database tests continue passing.

DOM tests are independent of local API keys. These tests establish interaction/data behavior, not actual browser viewport geometry, soft-keyboard activation, live authentication or provider routing.

## Retained sharing and database evidence

The 87 earlier cases remain, with message assertions adjusted for the intentional plain-text payload and preview description changes. Eleven additional cases cover:

- Identical native/clipboard message bytes, deliberate paragraphs, one URL, EN/PL named and anonymous messages, and no generated indentation or HTML.
- Exact short paths, malformed-code rejection and legacy UUID compatibility.
- Actual React short-link opening and legacy UUID reopening into one original-UUID-indexed draft. API/auth/search boundaries are fixtures.
- Localized PNG card metadata, absolute image URLs, dimensions/alt/locale, unknown messaging user agents, original short-link canonical identity, and ignored spoofed query fields.
- Wrong-code/malformed/missing preview lookup rejection, public-guide/homepage imagery and private-route/non-HTML exclusions.
- Actual request-service dispatch to UUID/code RPCs, case preservation, UUID normalization, response-identity checks, errors and older additive RPC compatibility. Only the API client is replaced.
- PostgreSQL exact code lookups, browser denial of internal generator/table access, same-key identity/code preservation, format guards and account deletion.
- A forced generated-code collision that retries without overwriting another invitation or adding an incorrect row.
- The actual 0010 migration applied over seeded 0009 invitation data. Original invitation JSON, UUID/context and existing guide rows are compared before/after. Both old and short lookups resolve the upgraded record.

Database cases execute all ten actual migrations in disposable PGlite with Supabase-style auth roles and permissive default EXECUTE fixtures. Only the initial pgcrypto extension declaration is omitted; UUID operations are built in. This verifies PostgreSQL behavior, not live PostgREST routing, project configuration or network quotas.

Copy/edge tests execute actual source with mocked Netlify environment, public API replies and native share/clipboard. They cannot establish receiving-app typography or preview caching. React tests use jsdom and do not establish real browser native-share activation, viewport geometry or provider authentication.

## Latest refinements

The latest suite includes city deduplication/ranking, country/region/Polish qualifiers, partial and multiword names, parent municipalities, malformed coordinates, request failures and cancellation. A computed-style regression verifies that text-only first-place suggestions use a full-width grid while normal icon suggestions retain their icon/text columns. Editor tests also verify the compact Change labels in EN/PL, removal of repeated selected-place text, All after first Save, compact guide-note behavior and save guards.

## Release verification

The full source archive is cumulative over the original complete v0.8.4 release. All ten migrations, dependency/package pins, shared sharing modules, PNG assets and AuthorStar source are compared with that baseline. First-place styles are scoped; original search attribution spacing and bottom List/Map/map-footer rules remain. Archive entries are compared with the staged source bytes. The complete source, tests, all ten unchanged migrations, configuration, sharing modules and static assets are included. Credentials, Git metadata, dependencies, generated build output and caches are excluded. MapLibre worker modules are regenerated by the existing predev/prebuild script from the pinned dependency.

The unchanged static social image assets retain their v083 suffix. The known lazy MapLibre chunk warning remains; production compilation succeeds. Author-written punctuation is untouched and system copy avoids em dashes.

## Remaining device/hosting acceptance

The local Chromium runner failed to start, so no browser screenshot or viewport check is claimed. Test the actual first screen on a phone: tapping search keeps the same route and instruction, keyboard/input/results stay reachable, provider credits do not overlap, selecting closes the keyboard, optional note remains editable, and manual Save shows the real editor row afterwards. Check EN/PL, long content, reload and blocked storage. See [upgrade acceptance](../UPGRADE-v0.8.4-inline-first-place.md).

No live database/deployment, provider/authentication or WhatsApp/Messenger share was performed. Retained short links, metadata and sharing require the same hosted/device acceptance as before. Cloud first place plus optional note use existing separate operations; failure/retry is tested, not advertised as a new atomic backend transaction.

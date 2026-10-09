# Verification for v0.8.13

The 19 existing affected component tests passed with zero failures, skips or cancellations: `node --test tests/components.test.mjs`. The run took 13.8 seconds. No new suite case was added for the presentation changes. TypeScript/Vite production compilation passed on final source, retaining the main/MapLibre chunk-size warnings. The full 167-test suite last passed in v0.8.11 and was not rerun here. Unchanged database, server, provider and import suites were not re-executed.

Local Chromium rendered actual components and actual MapLibre WebGL. The guide, editor, first-place flow and Home passed in EN/PL at 1,024px and 1,440px, height 900px: 16 primary view checks. These verify side-by-side geometry, no horizontal page overflow, larger preview pin framing, unchanged preview markers/camera under list filters, one map canvas through full-map entry/return, inherited category/note/focus state, sticky overview and note positioning, inline 44px map controls, transparent attribution clear of the cue, centred detail dialogs, editor note/venue edits, stars and menus, explicit first selection/Change/Save with exact author words, illustration aspect/choice stability and existing Home navigation. Six collection views passed: Your guides, Saved guides and Explore in both languages, including two-column placement, removal, navigation and new-guide form width. Screenshots of the guide, editor, Home, first-place and collection views were visually inspected.

A further six desktop utility views passed layout checks: Add place, Login, profile onboarding, Feedback, Privacy and Error. Existing form widths stay constrained. A long-title/long-note dialog case passed at 1,280x600 with scrollable content and a visible directions action; it also checked the 1,140px content limit at 1,920px and reduced-motion note expansion. The first short-height check found an inherited bottom-sheet margin; final desktop styles explicitly clear it. The final desktop Add place case at 1,280x700 confirms the button sits left of venue controls, clears the visible footer and simulated Netlify badge, and retains its navigation. This final case covers the button's adjusted left position. The initial utility pass stopped at a QA readiness selector that did not include profile onboarding's heading; the corrected utility harness passed all six. No application logic was changed for that harness issue.

Mobile/tablet preservation was checked against the actual v0.8.12 components/styles. Twenty geometry comparisons passed: Home, populated Editor and first-place creation in EN/PL at 390/768/1,023px, plus the guide in both languages at 390px. Heading, container, note, map, filter, venue/action, illustration/search and footer rectangles match within 0.2px. A separate resize case crossed 1,440, 1,023, 390 and 1,024px, retaining the canvas, filter and expanded-note state; opening full map then returning at mobile width also retained the same map/state and hid the reader/footer appropriately. Mobile screenshots were inspected. These checks verify browser rendering at simulated widths, not real mobile devices.

Repository, search and saved-guide data used controlled fixtures. Raster requests were intercepted with neutral fixture images. No live provider quality, tile availability, account write, authentication, OCR or hosting behaviour is certified. The larger desktop map may need additional existing-provider tiles for its viewport; no new map instance or API integration was added. One approved illustration loads per creation visit, unchanged from prior versions.

Package and lockfile agree on 0.8.13; lockfile changes only root versions. Only Editor's neutral venue wrapper and a desktop-only style block change application source. Every new layout rule is inside min-width 1,024px. All ten migrations, test files, dependency pins, server/hosting configuration, i18n/shared copy and assets are unchanged from v0.8.12. The delta archive is reconstructed over v0.8.12 and checked byte-for-byte against cumulative source. No secrets, Git metadata, installed dependencies, build output, browser harness or helper is packaged. PowerShell merge command reviewed, not executed on Windows.

Outstanding: real laptops and browser zoom/trackpads, Safari/Firefox, real Android/iOS touch/browser chrome/safe areas/keyboards, live Geoapify maps/search and actual Netlify badge, Gemini/OCR and deployed function routing/quota/rate limits, live auth/sharing/recovery. The earlier partially loaded map warning is still a separate live diagnostic. No paid API call, live migration, deployment or external-account change occurred. See [upgrade](../UPGRADE-v0.8.13-desktop-layouts.md).

## Historical v0.8.12 evidence

# Verification for v0.8.12

The affected suite passed 33 automated tests with zero failures, skips or cancellations on final source: `node --test tests/components.test.mjs tests/refinement.test.mjs tests/badge-layout.test.mjs`. Existing cases were extended; no new suite case or dependency was added. The last run took 11.8 seconds. TypeScript/Vite production compilation passed on final source, with the retained main/MapLibre chunk-size warnings. The complete 167-test suite last passed for v0.8.11; it was not rerun for this small patch. SQL/server/auth/import coverage was not re-executed because those files are unchanged.

Actual local Chromium and MapLibre WebGL passed six reader combinations: EN/PL at 320/390/768px, height 844px. Checks include one-line note preview, intermediate heights during expansion and collapse, stationary header, selectable exact note text, rapid toggle settling, one inline map toolbar, 44px arrow Back and category heights, horizontal overflow confined to the category strip, keyboard traversal reaching the last category with Back fixed, and measured camera clearance. Existing all-pin framing, unchanged preview markers/camera on list filters, same map canvas, nested dialog Escape, map return state/focus/position, transparent clickable attribution, centred footer/action clearance, simulated late badge injection/dismissal and one-place/empty-guide checks also passed. A first browser run caught insufficient scrolling for focused categories; the final source fixes this within the strip and all final runs pass.

Two additional EN/PL browser scenarios use the exact saved addresses supplied in the new screenshots. Their real list rows show Garncarska, Księdza Jerzego Popiełuszki 5 and Wałowa. Detail view retains the complete original address. Reduced-motion rendering disables the note transition, resizing the expanded note to 320px avoids clipping, collapse returns to one line, and an inherited last category is visible after opening the full map. Reader, full-map and Gdańsk screenshots were visually inspected. Raster tiles were intercepted with fixture images; search/backend data were controlled. These are browser-rendering checks, not live-provider or real-device verification.

Package and lockfile agree on 0.8.12; lockfile changes only root versions. All ten migrations, dependency pins, server handlers, hosting/build configuration, approved images and EN/PL dictionary are unchanged. Saved addresses and author words are not mutated, no house number is invented and no new provider request or backfill is introduced. Unknown or ambiguous international address formats may still be omitted.

The changed-files archive is checked byte-for-byte by overlaying it on v0.8.11 and comparing with current source. No credentials, Git metadata, installed dependencies, build output, QA harness or helper are included. PowerShell update command reviewed, not executed on Windows here. It neither pushes nor deploys. No new SQL, environment variable or hosting setting is required.

Outstanding: real Android/iOS touch and category gestures, browser chrome/safe areas/keyboards, actual live Netlify badge, live Geoapify search/tiles and these saved records on the deployed app, Gemini/OCR, deployed function routing/quota/rate limits and live auth/sharing/recovery. The screenshot's existing map-loading warning despite some visible tiles remains a separate live diagnostic; only its placement under the compact toolbar changes. Unchanged first-place graphics/loading and other route/footer scenarios retain historical evidence below and were not rerun. No paid API call, live migration, deployment or external-account change occurred. See [the upgrade](../UPGRADE-v0.8.12-compact-map-and-note.md).

## Historical v0.8.11 evidence

# Verification for v0.8.11

The existing suite passes 167 automated tests with no failures, skips or cancellations. One meaningful footer interaction case was added for visible/hidden clearance and cleanup. Existing reader coverage now checks one selectable note paragraph, header-only toggle, accessible disclosure state, expansion retention through map return, reset on a different guide, and arrow-only translated Back without the title pill. Existing address/search cases were extended with numbered Polish street names, spaced house letters, slash/range numbers, unit suffixes, venue prefixes, translated/diacritic city differences, postcode/district rejection and retention of structured provider street data without altering full addresses. Existing map-padding coverage includes the measured wrapped toolbar and badge lane. The full suite ran once in 23.9 seconds. After a final address-prefix refinement, the affected 13 address/search tests passed again. TypeScript/Vite production compilation passed on final source with the retained main/MapLibre chunk-size warnings.

Actual local Chromium and MapLibre WebGL passed six reader combinations: EN/PL at 320/390/768px, height 844px. Checks include transparent clickable map attribution with no overlap against Explore map, all-pin overview framing, unchanged preview markers/camera on list category changes, header geometry unchanged when the note expands using Enter, text clicks not toggling it, exact single note text, arrow-only 44px Back with translated accessible name, absence of map title/footer, measured toolbar camera clearance including wrapped chips, one map canvas, nested dialog Escape, category/note/position/focus restoration, contextual shortcut visibility, centred end-of-guide footer, Map action above it, simulated late badge injection/dismissal and empty/one-place guides. Tiles were intercepted with fixture images. This is rendering evidence, not live-provider evidence.

A further 42 browser combinations passed the actual Home, Login, Feedback, Privacy, populated Editor, first-place creation and Error components at the same three widths in EN/PL. Each verifies normal-flow centred footer, no horizontal overflow, end-of-page placement and editor Add action clearance, then repeats clearance with a simulated public Netlify badge. This also checks the footer on both short and long pages and responsive translated labels. Reader/map and representative route/footer screenshots in both languages were visually inspected. The original local Chromium executable was incomplete; the successful run used a fresh QA-only browser package. No browser package/dependency or harness is added to the application or patch.

New provider/search tests use fixture responses. No full saved addresses for the specific missing Gdańsk venue rows were provided. The parser improvements are verified, but confirmation for Masło Maślane, Restauracja Pueblo and Pierogarnia Stary Młyn remains a live acceptance check. Records genuinely lacking a street remain blank. No street is guessed, fetched in the background or backfilled.

Package and lockfile are 0.8.11; only the root versions change. All ten migrations, dependency pins, server handlers, Netlify/Vite configuration, source images, i18n dictionary and shared invitation/sharing copy are unchanged. No credentials, Git metadata, installed dependencies, build output, QA harness or helper are packaged. The small delta archive contains changed/new files only and is checked byte-for-byte by overlaying it on the v0.8.10 baseline. PowerShell update command reviewed, not run on Windows here.

Outstanding: real Android/iOS and touch/browser chrome/safe areas/keyboards, actual live Netlify badge, live Geoapify search/tiles and those existing Gdańsk records, Gemini/OCR, deployed function routing/quota/rate limits and live auth/sharing/recovery. Initial delay/failure browser scenarios were verified in v0.8.10 and were not repeated for unchanged loading code. No paid API call, live migration, deployment or external-account change occurred. See [the upgrade](../UPGRADE-v0.8.11-footer-note-and-addresses.md).

## Historical v0.8.10 evidence

# Verification for v0.8.10

166 automated tests pass with no failures, skips or cancellations. Two meaningful component cases were added: bounded stalled-map readiness with continued filtering/empty-guide behaviour, and first-place image load/error release. Existing reader coverage checks identical preview marker nodes/camera operations through category changes, inherited full-map filters, return state and a fresh readiness lifecycle for another guide in the same city. Existing address coverage now also checks street-only extraction and safe omission. Import copy expectations were updated. The existing owner/guest/local explicit-save, partial failure/retry, import/recovery, sharing/auth and disposable PostgreSQL coverage remains. The final full suite took 12 seconds. After final map-clearance/lifecycle adjustments, the affected component file was rerun successfully. TypeScript/Vite production compilation passes with retained main/MapLibre size warnings. No dependency upgrade.

Actual Chromium and MapLibre WebGL rendered the reader at 320/390/768px in EN/PL. All six combinations pass: content order, no total count, street-only rows, no overflow, all-pin preview framing, clickable attribution within the map, nonoverlapping Explore cue/credits, unchanged preview camera and exact marker elements through list filtering, inherited full-map category, one canvas across expansion, equal 44px Back/title heights, lowered full-map credits, note/category/scroll/focus restoration, nested dialog Escape, contextual shortcut, simulated late badge clearance and empty/one-place guides. Raster tiles were intercepted with fixture images. This verifies actual rendering/geometry, not live provider quality.

All 18 first-place combinations pass: three unchanged approved images, three widths and two languages. Image dimensions, order, decoded reveal, no overflow, visible search/upload, English artwork across language changes, stable choice through query and Change, one-line updated EN/PL screenshot copy without the helper, explicit save and exact note in the real Editor row pass. Search and save callbacks use controlled fixtures; live cloud writes are not claimed. Reader/map and first-place screenshots were visually inspected.

Six further browser scenarios pass: delayed raster tiles hold content until the initial map frame; stalled map chunk releases after the 2.5-second limit and recovers later without rehiding content; delayed illustration waits for decoding and requests only its chosen asset; failed image reveals usable search/import; stalled image releases search and remains omitted after late load; failed map chunk immediately reveals a readable guide and closable full-map fallback. No permanent page loader, second filter/navigation loader or late image layout shift was observed.

Version and lockfile are 0.8.10; lockfile changes only root version. All ten migrations, dependency pins, server handlers, netlify.toml, Vite configuration and shared invitation/sharing copy are unchanged. Only two existing i18n entries change, both import.start. No credentials, installed dependencies, build output, QA harness or helper files are packaged. Delta patch reconstruction is checked byte-for-byte against the cumulative source. PowerShell commands reviewed, not executed on Windows.

Outstanding: actual Android/iOS, touch/browser chrome/safe areas/keyboards, live map/search and provider badge, Gemini/OCR, deployed function routing/quota/rate limiting and live auth/sharing/recovery. No paid API, deployment, migration or external-account mutation occurred. See [the upgrade](../UPGRADE-v0.8.10-stable-preview-and-loading.md).

## Historical v0.8.9 evidence

# Verification for v0.8.9

164 automated tests pass with zero failures, skips or cancellations. One table-driven address case was added, covering exact Warsaw/Paris suffixes, semantic subtitles and unknown/different-city international formats. Existing first-place interaction coverage now checks the English illustration in both languages, stability while typing and after Change, omission during selection/import review, and the retained explicit save flows. Existing reader coverage checks removal of total place count and padding supplied once. Owner, guest, local, import/recovery, sharing, and disposable PostgreSQL coverage remains. The suite ran once after implementation, in 20.7 seconds. TypeScript/Vite production build passes with the retained main/MapLibre chunk-size warnings. No dependency upgrade.

Local Chromium rendered actual components and actual MapLibre WebGL at 320/390/768px in EN/PL. All six reader combinations passed ordering, lack of horizontal overflow, accessible attribution, disabled preview gestures/pins, single-canvas expansion, note/category/scroll/focus restoration, nested dialog Escape, contextual shortcut, simulated badge clearance, and one-place/empty-guide cases. Projected fixture pins fit within the preview's padding. The 320px Warsaw fixture frames at zoom 12.478 instead of the old double-padding calculation's 11.143, using 106 rather than 42 vertical pixels. Raster requests were intercepted with fixture images; this is not live map evidence.

All 18 first-place combinations passed: three approved graphics at three widths in two languages. Images loaded, the approved order held, search/upload stayed within the tested 844px viewport and there was no horizontal overflow. The English graphic and alt text stayed unchanged across a language toggle, typing and selection/Change. Explicit save produced the real editor row with its name and optional author note. Search responses were intercepted with fixtures. Existing automated cases also cover cloud/guest/local failures, retries, note retention and optional screenshot/message review. Browser creation QA used the actual Editor with a controlled local save callback, not a live backend or device keyboard.

A separate map-chunk failure browser case passed: the guide remained readable, and full-screen map fallback remained closable. EN/PL reader and all three onboarding variants were visually inspected. Provider badge checks use a simulated frame, not a live Netlify badge. Illustrations were losslessly encoded to WebP and pixel equality against the approved source images was verified. Only the chosen illustration loads during a visit; its compressed file is approximately 0.8 to 1.0 MB.

Package and lockfile are 0.8.9. Lockfile changes only the root version. All ten migrations, dependencies, netlify.toml, Vite configuration, server handlers, shared sharing/invitation copy and src/i18n.tsx are unchanged from v0.8.8. No credentials, dependencies, deployment output or browser harness are packaged. PowerShell update command reviewed, not executed on Windows here.

Still outstanding: real Android/iOS, touch/browser chrome/safe areas/keyboards, live Geoapify search/tiles and actual Netlify badge, Gemini/OCR, deployed function routing/quota/rate limiting and live auth/sharing/recovery. No paid API, deployment, live migration or external account mutation occurred. See [the v0.8.9 upgrade](../UPGRADE-v0.8.9-personal-start-and-guide.md).

## Historical v0.8.8 evidence

# Verification for v0.8.8

163 automated tests pass with zero failures, skips or cancellations. Three targeted reader interaction cases were added with an explicit MapLibre boundary fixture. They cover map-instance reuse and state/focus/position restoration, shortcut visibility, and readable fallback when WebGL is unavailable. The existing 160 cases remain. TypeScript/Vite production build passes with the known main/MapLibre chunk warnings.

Local Chromium rendered the actual reader and real MapLibre WebGL at 320/390/768px in EN/PL with raster requests intercepted to fixture images. All six combinations passed ordering, category/expanded-note/position/focus restoration, single-canvas expansion, dialog Escape, shortcut, simulated badge clearance and one-place/empty-guide checks. A separate failed map-chunk browser case passed. Final screenshots were visually inspected. This verifies browser geometry and the actual map renderer, not live tiles, OCR, provider quality or real phones.

Version files are 0.8.8. Dependency pins, all ten migrations, server/configuration files, shared copy and first-save/editor code are identical to v0.8.7. Existing dictionary entries are unchanged; two EN/PL reader-label pairs were added. No credentials, deployment output or test harness is packaged.

Still outstanding: real Android/iOS and touch/browser chrome/safe areas, live maps/search and the actual provider badge, Gemini/OCR, deployed Netlify routing/quota/rate limiting, live auth/sharing/recovery. No paid API or external account action occurred. See [the v0.8.8 upgrade](../UPGRADE-v0.8.8-inline-guide-map.md).

## Historical v0.8.7 evidence

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

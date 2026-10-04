# v0.8.4 inline first-place verification

## Checks executed

`npm test` passes **114 cases**, with zero failures or skips. `npm run build` passes TypeScript and Vite production compilation. Installed dependencies were reused; none was added or updated. Package and lockfile remain 0.8.4. No new advisory scan, live-provider or hosting check is claimed.

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

## Release verification

The patch is cumulative over the original complete v0.8.4 release. All ten migrations, dependency/package pins, shared sharing modules, PNG assets and AuthorStar source are compared with that baseline. First-place styles are scoped; original search attribution spacing and bottom List/Map/map-footer rules remain. Patch archive entries are compared with source bytes. Only changed/new source, tests and current documentation are included; credentials, Git metadata, dependencies, build output and caches are excluded.

The unchanged static social image assets retain their v083 suffix. The known lazy MapLibre chunk warning remains; production compilation succeeds. Author-written punctuation is untouched and system copy avoids em dashes.

## Remaining device/hosting acceptance

The local Chromium runner failed to start, so no browser screenshot or viewport check is claimed. Test the actual first screen on a phone: tapping search keeps the same route and instruction, keyboard/input/results stay reachable, provider credits do not overlap, selecting closes the keyboard, optional note remains editable, and manual Save shows the real editor row afterwards. Check EN/PL, long content, reload and blocked storage. See [upgrade acceptance](../UPGRADE-v0.8.4-inline-first-place.md).

No live database/deployment, provider/authentication or WhatsApp/Messenger share was performed. Retained short links, metadata and sharing require the same hosted/device acceptance as before. Cloud first place plus optional note use existing separate operations; failure/retry is tested, not advertised as a new atomic backend transaction.

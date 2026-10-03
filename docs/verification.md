# v0.8.4 verification

## Checks executed

`npm test` passes **104 cases**, with zero failures or skips. `npm run build` passes TypeScript and Vite production compilation. Installed dependencies were reused from the verified earlier workspace; no dependency was added or updated. Package and lockfile identify 0.8.4. No new advisory scan or live-provider test is claimed.

Six additional actual React editor/store flow tests cover:

- Empty editor in EN/PL: all categories, Eat selected, one appropriate prompt, collapsed optional note, one primary action, no input autofocus and no premature Preview/Share.
- Guest additions in the chosen category, return to the actual row with focus, preserved requester context, and notes/stars surviving draft reopening.
- Owner cloud add failure retaining search; successful retry saving the chosen category before return.
- Pending guide-note failure blocking navigation; retry preserving authored writing before search.
- Duplicate-place selection returning to the original category without rewriting notes/stars or creating another row.
- Legacy Stay/custom category support, invalid navigation hint fallback, and unchanged public-reader category filtering.

These tests use actual Editor, AddPlaces and owner/guest stores; only config and remote service boundaries are fixtures. Existing first-guide/invitation assertions now expect the editor route. DOM tests disable local env-file loading. The bundled search interaction uses fixed demo configuration and a bounded wait for results instead of a fixed debounce sleep. Tests remain independent of local API keys. The previously reported Windows error was not supplied in full, so these changes are not presented as a confirmed diagnosis of that particular failure.

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

All ten migration files, dependency pins, the supplied star-motion component and social PNGs are compared byte-for-byte or structurally with the latest baseline. The mobile search attribution retains positive spacing and line wrapping. The consistent bottom selector and map footer patch remain. Full archive contents are compared with source bytes; source, tests, assets, Netlify/shared modules, migrations and current documentation are included. Credentials, Git metadata, dependencies, build output and caches are excluded.

The four unchanged EN/PL request/guide PNGs are 1200×630 RGB, approximately 71–73KB each. They retain their v083 asset names because their content has not changed. Earlier visual inspection covered full landscape and central square crops. The optional maintenance renderer is not part of the npm build.

The production build retains the existing lazy MapLibre chunk-size warning; compilation succeeds. No dependency rewrite was made to suppress it. System copy avoids em dashes, while user-authored punctuation is untouched.

## Checks still requiring deployment/devices

No live database change, deployment, provider/auth test, hosted crawler fetch, real phone viewport test or WhatsApp/Messenger share was performed here. jsdom checks interaction and data behavior; it does not establish viewport geometry, soft-keyboard behavior or actual motion. Check the new empty editor, chosen-category return, notes, stars, draft reopening and attribution spacing on mobile. Check a long-list star toggle with normal and reduced motion. See [the upgrade acceptance list](../UPGRADE-v0.8.4.md).

Messaging apps control wrapping, card layout and caching. Test fresh named/anonymous invitations in EN/PL through native share and copy/paste, plus a public guide and an old UUID invitation. Confirm personal title/image, one left-aligned message, one URL, requester/destination/language and draft continuity. Check image URLs return PNG rather than SPA HTML. After asynchronous invitation creation some browsers may deny native-share activation; retry retains the existing record. Native cancellation must not copy or send anything.

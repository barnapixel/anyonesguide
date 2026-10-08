# Anyone’s Guide v0.8.9. Fully integrated source

v0.8.9 gives the first-place screen one of three approved illustrated maps, selected once per visit. English graphics are used in both language versions. Existing EN/PL question and reassurance, direct search, optional screenshot import and the explicit first-save moment are preserved. The graphic replaces the examples paragraph without an extra onboarding step.

The reader has a smaller title, tighter spacing and no total place-count line. The exact author note remains below the title. The compact inline map fits relevant pins with padding counted once, then comes categories, the quieter existing starred-spots legend and recommendations. Reliable address suffixes are condensed in rows while full addresses remain in place details. Preview expansion, category/note/scroll/focus restoration and badge clearance remain. See [the upgrade and one-line VS Code command](UPGRADE-v0.8.9-personal-start-and-guide.md).

Google Gemini extracts visible names and exact source text. Authors confirm each venue through the existing city-scoped Geoapify search, then choose what to save. Nothing enters a guide before explicit Save. Notes start empty; source text can be copied into a note and edited. There are no imported ratings, automatic stars, generated recommendations or rewritten notes.

The same review works for account owners, invited guests before sign-in, local guides and subsequent Add place visits. Existing category intent is retained for later additions. Partial saves and edited notes can be recovered in the same browser. Screenshots and full original messages are not persisted by the app.

v0.8.6 fixes familiar city labels for existing and new guides. A small, exact, country-aware alias table turns Greater London into London and handles eight other administrative aliases. Existing guide IDs, routes, coordinates and author-written notes stay intact. Labels are shared by destination selection, cloud guides and summaries, old guest drafts/recovery, local guides, saved shortcuts and Netlify guide previews. Unknown cities and distinct regions keep their names. This is targeted coverage, not a verified top-100-city provider audit.

Netlify now documents a supported per-project badge Off switch. We recommend it for this app: Project configuration > General > Powered by Netlify badge > Off > Save. No redeploy is needed for that hosting setting. We did not change the account. If the public badge stays on, the app conditionally reserves a separate 104px bottom lane and moves fixed controls/map framing above it. The lane disappears when the public frame is absent or dismissed. Modals and primary fixed controls have priority over the badge. The fallback depends on observed provider markup and requires real-phone acceptance.

Venue photos remain a researched proposal. No photo provider, schema change, account, paid API call or venue photo rendering was added. See [the proposal](docs/venue-photo-proposal.md).

## Complete source package

The archive contains one `anyones-guide-v0.8.9-integrated/` folder with the complete cumulative source, tests, configuration, all ten unchanged migrations and existing static assets. No earlier patch is needed. Package and lockfile are **0.8.9**. Dependency pins are unchanged.

Merge its contents into your existing project root, keeping local credentials, Git metadata and Netlify settings. Review any overlapping manual edits. No new SQL or auth redirects are required on a working v0.8.4 database.

**For screenshot/message import, existing server setup is required:** set `GEMINI_API_KEY` and `RECOMMENDATION_IMPORT_ENABLED=true` in Netlify’s environment settings with Functions included in scope (Free defaults to all scopes). The key must never have a `VITE_` prefix. See [setup and acceptance](UPGRADE-v0.8.9-personal-start-and-guide.md) before deployment. Changing function variables requires a new deploy. Deploy the source project so the included Netlify Function is included; uploading only `dist` does not install it.

```sh
npm ci
npm test
npm run build
npm run dev
```

`npm run dev` runs the frontend. For local import requests, use `npx netlify dev` with the server environment configured, and open the URL it reports. No Gemini key is included in this archive.

**164 automated tests pass**, with no failures, skips or cancellations. The TypeScript/Vite build passes with the known main/MapLibre chunk-size warnings. See [verification](docs/verification.md) for local browser evidence and outstanding live/mobile checks. Nothing was deployed or migrated live.

See [the current handover](docs/anyones-guide-handover-v0.8.9.md) for scope and working style. Earlier upgrade notes remain as history and are superseded by this release.

## Copy locations

Existing English/Polish copy is preserved. New screenshot/message and recovery wording lives under `import.*` in `src/i18n.tsx`; the additional first-screen reassurance is `first.reassurance`. Sharing and invitation previews still use `shared/share-copy.mjs`. Author-written text is never translated or rewritten. System copy avoids em dashes.

## Features retained from v0.8

- New account guides and invitation responses start with inline selection and one explicit first save. The normal editor follows. Subsequent additions retain category intent, duplicate protection and existing autosave. Historical direct Add places routes remain supported.
- Authors can star places in the editor or immediately after adding them. Starred places appear first within their category in editing and reading, with a small star beside the name and on the map pin. Multiple stars are allowed. Stars belong to the guide entry, not the venue or reader.
- Starring preserves underlying author order. Removing the star returns the place to that order. Dragging and Move up/down operate within the same category and star group. Category changes retain the star and append to the destination category’s underlying order.
- Cloud stars use the existing durable save queue, retry and save-before-navigation behavior. Guest stars survive local reopen, recovery snapshots and publication. Older guides and guest drafts start unstarred.
- EN/PL share messages distinguish sharing your own guide from passing along someone else’s. Browser and Netlify crawler previews share one copy module. Author-written note excerpts remain untouched. Shared guide URLs carry a language hint while retaining their original handles and paths.
- System copy uses full stops rather than em dashes. User-authored writing is never rewritten or translated.
- The supplied v0.7.1 baseline also includes the two later manual changes: final drag-handle padding is 3px, and Ask for recommendations appears on Home rather than Your guides.

## Local setup

Use Node 22.12 or later. Production and development dependency versions are unchanged from v0.7.1.

```sh
npm ci
cp .env.example .env.local
npm test
npm run build
npm run dev
```

Fill the existing browser-safe `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy anon naming also supported) and `VITE_GEOAPIFY_API_KEY`. Never expose a service-role key. These are browser configuration variables. Screenshot extraction additionally requires the server-only variables described above. Without cloud credentials, the local demo remains available; provider failures never become demo search results.

`predev` and `prebuild` copy the matching MapLibre 6.10 worker and sibling shared module into `public/vendor/maplibre/`. Both must remain in the build.

## Preserved behavior

Unlisted is the default and is absent from Explore, but remains anonymously readable through the existing Data API model. Draft is owner-only; Public discovery is opt-in. Saved Guides are browser/device-local shortcuts to live guides. Localhost and the live domain keep separate lists.

Guide notes stay optional and collapsed under From [author]. Legacy intro and Stay entries remain intact. The roughly 200-character place-note counter remains soft guidance. Guest snapshots keep the seven-day, 200KB, 100-place, 5,000-character place-note and 10,000-character guide-note limits. Atomic claims preserve existing city guides, clear snapshot payloads and retain retry receipts.

Cloud edits are journalled before transmission and serialised per account/guide. Failed saves retain pending values and offer Retry; reopening applies and retries them. This is pending-edit recovery, not offline editing or collaborative merging. Concurrent devices still use the last successful write.

Maps retain category icons, camera behavior, same-origin worker, user-initiated location and attribution. The list footer remains in normal document flow; the map site footer is hidden. The view selector sits 16px above the safe area in both views when the public badge is absent. When present, its reserved lane is added to bottom controls and map framing. Map provider credits remain visible. Native sharing cancellation does not trigger clipboard copying. Requests still use manual messages in an existing conversation.

## Verification and rollout

See [docs/verification.md](docs/verification.md) and [the v0.8.6 upgrade note](UPGRADE-v0.8.6-city-labels-and-badge.md) for current evidence and limitations. All existing migrations and dependency pins remain unchanged. v0.8.6 adds no migration; 0010 belongs to the earlier short-link release. Private draft recovery, stars, notes, existing edit RPCs, publication and consent-only analytics are retained. First-place creation and its optional note use separate existing writes with retry protection.

Stored invitations remain public by link, with no listing or direct browser table access. Short codes are random, unique, case-sensitive and immutable for a record; they are not account IDs or private draft recovery keys. Account-linked invitations disappear when their account is deleted. Anonymous invitation retention and existing creation quotas remain unchanged. This release adds no inbox, tracking, automatic sending or public directory.

Preserve existing auth redirects, service-role draft cleanup, consent-only analytics and factual privacy configuration. Hosting CSP remains report-only.

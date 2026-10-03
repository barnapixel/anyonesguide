# Anyone’s Guide v0.8.4

A category-led start inside the existing guide editor. New account guides and invitation responses open with all categories visible and Eat selected. One prompt asks where you would take your friends for dinner, with a clear Find a place action and a little reassurance. Other empty categories have their own prompts. There are no fake places, required checklists or extra onboarding screens.

Searching from the editor adds to the selected category and returns to the actual recommendation row. Notes and stars are optional. The optional guide-level note starts collapsed when blank; existing authored notes remain intact. Empty categories use one inline action instead of a competing floating Add place button. Preview and Share/Finish become available after the first place.

This is the **complete source release**, including the smoother star movement and mobile search-credit spacing patches. It also retains v0.8.3 short invitation links, personal EN/PL sharing, branded previews and the consistent bottom List/Map controls. Dependencies and all ten SQL migrations are unchanged.

## Upgrade from a working v0.8.3

**No new SQL is required.** Merge the contents of `anyones-guide-v0.8.4/` into the existing project root. Keep `.env.local`, Git metadata and Netlify settings. Review any matching files you edited manually. The ZIP does not contain secrets, node_modules or dist.

```sh
npm ci
npm test
npm run build
```

Deploy the complete source through your existing Netlify workflow. Keep `netlify/edge-functions/`, `shared/` and `public/social/` included. A dist-only upload does not update the Edge Function. See [UPGRADE-v0.8.4.md](UPGRADE-v0.8.4.md) for the short upgrade and mobile acceptance checks.

If your database is still on v0.8.2, apply only the missing **0010_short_invitation_links.sql** once before using short invitation URLs. On an older project, apply only missing migrations in order. Do not rerun the earlier private-schema repair on a working database. No new keys, dependencies or auth redirects are required.

**104 automated cases and the TypeScript/Vite production build pass.** These are local checks, including disposable database fixtures. No live database change, deployment or real-phone test was performed. Messaging apps control their own wrapping, preview layout and caching.

## Copy locations

Invitation headings, share messages and crawler wording have one source: **`shared/share-copy.mjs`**. Polish request headings are in `requestShareContent()`. The optional destination line and form/status labels are in **`src/i18n.tsx`**. Category prompts and their Find a place action are also in `src/i18n.tsx`, under `creation.prompt*`, `creation.findPlace` and `creation.startEnough`. The author-picks explanation remains `star.legend` there; its decorative fire emoji is in `PublicGuide.tsx`. Author-written names/notes are never translated or rewritten, and system copy avoids em dashes.

## Features retained from v0.8

- Account guides and invitation responses now start in the familiar editor. Explicit category intent is preserved during search. Selecting an existing place returns to its original category without duplicating it or rewriting its notes and stars. Historical direct Add places routes remain supported.
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

Fill the existing browser-safe `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy anon naming also supported) and `VITE_GEOAPIFY_API_KEY`. Never expose a service-role key. No new environment variables are required. Without cloud credentials, the local demo remains available; provider failures never become demo search results.

`predev` and `prebuild` copy the matching MapLibre 6.10 worker and sibling shared module into `public/vendor/maplibre/`. Both must remain in the build.

## Preserved behavior

Unlisted is the default and is absent from Explore, but remains anonymously readable through the existing Data API model. Draft is owner-only; Public discovery is opt-in. Saved Guides are browser/device-local shortcuts to live guides. Localhost and the live domain keep separate lists.

Guide notes stay optional and collapsed under From [author]. Legacy intro and Stay entries remain intact. The roughly 200-character place-note counter remains soft guidance. Guest snapshots keep the seven-day, 200KB, 100-place, 5,000-character place-note and 10,000-character guide-note limits. Atomic claims preserve existing city guides, clear snapshot payloads and retain retry receipts.

Cloud edits are journalled before transmission and serialised per account/guide. Failed saves retain pending values and offer Retry; reopening applies and retries them. This is pending-edit recovery, not offline editing or collaborative merging. Concurrent devices still use the last successful write.

Maps retain category icons, camera behavior, same-origin worker, user-initiated location and attribution. The list footer remains in normal document flow; the map site footer is hidden. The view selector sits 16px above the safe area in both views, and map provider credits remain visible. Native sharing cancellation does not trigger clipboard copying. Requests still use manual messages in an existing conversation.

## Verification and rollout

See [docs/verification.md](docs/verification.md) for current evidence and limitations. All existing migrations and dependency pins remain unchanged. v0.8.4 adds no migration; 0010 belongs to the earlier short-link release. Private draft recovery, stars, notes, atomic saving, publication and consent-only analytics are retained.

Stored invitations remain public by link, with no listing or direct browser table access. Short codes are random, unique, case-sensitive and immutable for a record; they are not account IDs or private draft recovery keys. Account-linked invitations disappear when their account is deleted. Anonymous invitation retention and existing creation quotas remain unchanged. This release adds no inbox, tracking, automatic sending or public directory.

Preserve existing auth redirects, service-role draft cleanup, consent-only analytics and factual privacy configuration. Hosting CSP remains report-only.

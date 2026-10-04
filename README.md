# Anyone’s Guide v0.8.4. Inline first-place patch

The first recommendation now starts with one friendly question and inline place search. No category is preselected, no keyboard opens automatically, and there are no premature Preview/Finish controls. Selecting a result stays on this screen, with its name, address and optional note. The explicit Save place button adds it to the guide. After a successful save, the normal editor shows the real row, focuses its title and confirms the first save.

Unfinished selections and exact note text are recovered on the same device where storage is available. Checkpoints are scoped to an owner/account plus guide, or one independent guest draft, and have a seven-day recovery limit. Search/selection does not write a recommendation to the guide. Cloud saves use the existing add RPC and durable note queue; guest saves require a successful device write. Failed or partial saves retain the first-place task and Retry.

This update builds on the complete v0.8.4 source and its first-place encouragement patch. Existing editing autosave, category-aware subsequent additions, stars, sharing, bottom controls, drafts and migration files remain. Package and lockfile remain **0.8.4**; no dependency or SQL update is introduced.

## Upgrade an existing v0.8.4 installation

Merge the patch’s project-relative `src`, `tests` and documentation files into your existing project root, replacing matching files. Keep `.env.local`, Git metadata and Netlify settings. Review matching files if you edited them manually. The patch contains new components/services as well as replacements, so copy the entire patch, not just Editor.tsx.

```sh
npm test
npm run build
npm run dev
```

If dependencies are not installed, run `npm ci` first. Deploy through your existing Netlify source workflow when ready. No new SQL, keys or auth redirects are needed on a working v0.8.3/v0.8.4 database. The short-link migration 0010 remains necessary only on an older database that has not already received it. Do not rerun earlier migrations or the private-schema repair on a working project.

See [the inline-first-place upgrade](UPGRADE-v0.8.4-inline-first-place.md) for scope and acceptance checks. **114 automated cases and the TypeScript/Vite build pass.** The local Chromium runner could not start, so real viewport/keyboard behavior is not certified by these tests. No live deployment, database change, provider/auth test or phone share was performed.

## Copy locations

Invitation headings, share messages and crawler wording have one source: **`shared/share-copy.mjs`**. Polish request headings are in `requestShareContent()`. The optional destination line and form/status labels are in **`src/i18n.tsx`**. First-place wording is in `src/i18n.tsx`, under `first.*`. Subsequent empty-category prompts remain under `creation.prompt*`, `creation.findPlace` and `creation.startEnough`. The author-picks explanation remains `star.legend` there; its decorative fire emoji is in `PublicGuide.tsx`. Author-written names/notes are never translated or rewritten, and system copy avoids em dashes.

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

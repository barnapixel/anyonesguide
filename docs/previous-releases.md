# Historical v0.6.9 README

This is the original baseline README for reference. Use the root README and docs/deployment.md for the current release and upgrade procedure.

# Anyone's Guide v0.6.9

A small React/Vite product for creating, keeping and sharing personal city guides.

## v0.6.9 — ask a friend for recommendations

- Home and Your guides have an **Ask for recommendations** action. Add your name and an optional city, then share a friendly invitation. The request link and messaging-app preview mention the person asking.
- The recipient chooses a city, adds places and notes, reorders them, and previews the list or map before signing in. Invited drafts are kept separately from demo/account guides. Reopening the invitation in the same browser offers to resume the latest draft.
- **Finish** asks for Google or email magic-link sign-in only when the guide has at least one recommendation. Before sign-in, a private snapshot is saved using a random recovery key, so an email link can restore the draft in another browser. New users confirm their public profile through the existing onboarding form.
- **Create share link** saves the complete guide in one transaction as **Unlisted**. It never overwrites an existing guide for the same city. Retries return the same guide. **Send to [name]** opens native sharing or copies a friendly message and public link; the author sends it in their existing conversation. There is no automatic message or request inbox.
- English and Polish copy is included. Privacy and beta terms now explain invited drafts and sign-in recovery. Existing v0.6.8 footer behavior is retained.

### Upgrade from v0.6.8

1. Apply **only** `supabase/migrations/0006_guide_requests.sql` in the existing Supabase project. The earlier migrations should already be applied. The new private table has RLS enabled and no direct browser access; the three RPCs require the random draft key, and claiming a guide also requires a signed-in user with a completed profile. No service-role key belongs in this app.
2. In Supabase **Authentication → URL Configuration → Redirect URLs**, keep the existing `/creator` entry and add your deployed origin followed by `/finish-request**`, for example `https://anyones.guide/finish-request**`. The callback carries a draft ID and recovery key in its query string. Add the equivalent development/preview origin if used. The app accepts only its own `/creator` and `/finish-request` paths as auth returns. Keep the normal Supabase magic-link email template using `{{ .ConfirmationURL }}` (or an equivalent template that honors the requested redirect).
3. Keep `.env.local` and Git metadata. Run `npm ci`, `npm test`, and `npm run build`, then deploy through the existing Netlify workflow. The existing Edge Function now also renders request previews; deploy the source rather than dragging only `dist/` into Netlify. No new environment variable is needed.
4. For predictable cleanup, schedule `select public.purge_expired_guest_guides();` daily in Supabase Cron or run it during beta maintenance. Unclaimed snapshots cannot be read or claimed after seven days; new snapshot saves also remove expired unclaimed rows. The snapshot payload is cleared immediately after a successful claim. A small receipt remains with the account so even a much later retry cannot create a duplicate or recreate a deleted guide; deleting the account removes its receipts.

### Check the request flow before inviting testers

1. Share an invitation with a name containing an accent or apostrophe, with and without a city. Open it as a signed-out recipient; check English and Polish and the messaging-app card.
2. Add several categories, reorder places, write place notes and a guide note, preview List/Map, and refresh. Reopen the original invitation and resume the draft. Confirm no account is required during these steps.
3. Choose Finish. Test Google sign-in, magic-link sign-in in the same browser, and opening the magic link in a second browser/device. Confirm the destination, places, order and notes survive. Complete profile onboarding for a new account.
4. Create the link, retry once, and confirm only one new Unlisted guide exists. Check that an older guide for the same city is unchanged. Send or copy the response to the person asking; it must contain the public guide link, never the recovery key.
5. Check recovery failures, cancelled sign-in/sharing, blocked browser storage, expired snapshots and another account trying to use an already-claimed recovery link. SQL/auth integration and real-device rendering need these checks against your deployed Supabase configuration; local unit tests cover link escaping, redirect validation and browser draft persistence.

## v0.6.8 — consistent footer layout

- A single footer stays mounted across routes. Short pages fill the viewport and place it 24 px above the bottom safe area. On longer pages it follows the content, so it never floats over guide rows or editor fields.
- Fullscreen map keeps the footer in the page layout; the contributor band, List/Map switch and Locate control sit above it. The map hides its underlying list header from layout so the footer stays at the viewport bottom.
- New guide stays above the footer, while the editor's Add place control remains accessible above the temporary Netlify badge.
- No database migration or new environment variable is needed when upgrading from v0.6.7. Keep `.env.local`, run `npm ci`, `npm test` and `npm run build`, then deploy through the existing Netlify workflow.

## v0.6.7 revised — mobile layout, sharing, guide note and map badges

- The map uses compact terracotta badges with white utensil, coffee, beer, landmark and cart symbols. Other/custom and previously saved Stay places use a neutral dot. The raster layer is gently muted (`raster-brightness-max: 0.78`); the symbols stay crisp. MapLibre's worker and camera behavior are unchanged.
- Authors can write an optional guide-level note in the editor. On the public list it appears as a one-line preview under “From [author]”, collapsed by default; opening it reveals the full text. Empty notes do not appear. English and Polish interface text is supplied.
- Newly created guides have five main categories plus Other. The migration removes unused Stay categories, while retaining historical Stay places and their category to avoid losing data.
- The Share action sends a short author-and-city message with the guide URL. On devices without native sharing, Copy includes both the message and link. Public guide URLs get author-and-city social preview text through a small Netlify Edge Function; draft guides do not.
- The map's List/Map switch is centered just above a full-width contributor credit at the bottom. The editor and public guide category selectors fill their available width. Error/location messages appear below the map title and filters.
- Explore, Feedback, Privacy and Beta terms live together in the footer. Short pages stretch to keep it near the bottom above the temporary Netlify badge; long pages scroll normally. New guide sits above the footer in page flow, and Add place clears the badge on phones.

### Upgrade from v0.6.6

1. If upgrading from v0.6.6, apply **only** `supabase/migrations/0005_guide_note_categories.sql` to the Supabase project before deploying. If v0.6.7 is already running, that migration is already applied; do not rerun it.
2. Keep your `.env.local` and Git metadata. Install and check with `npm ci`, `npm test`, and `npm run build`.
3. In Netlify, make the existing `VITE_SUPABASE_URL` and browser-safe `VITE_SUPABASE_PUBLISHABLE_KEY` available to the **Functions** scope as well as Build. The preview function can also read the older `VITE_SUPABASE_ANON_KEY`. Never use a service-role or secret key. Deploy the source via the usual Git build or Netlify CLI; dragging just `dist/` into Netlify omits the Edge Function.
4. On a phone, check both languages on the editor and guide preview; switch List/Map, expand attribution, tap Locate, and scroll short pages until the footer, New guide and Add place positions are visible. Check one shared Unlisted or Public guide in a messaging app. Link preview services may cache older cards.


## v0.6.6 mobile and closed-beta patch

- Public List and Map category filters fill their available width in English and Polish. The same layout rules apply in both languages; narrow screens can use two rows rather than squeezing labels.
- Guide and Explore header actions keep fixed positions while switching languages. On phones the Edit / Your Guides actions use icons with accessible labels; desktop keeps visible text.
- On phones the List / Map switch, Locate control and attribution sit above the lower-left Netlify badge area. Check the actual badge on an iPhone because its size is outside this app's control.
- Map pins retain the working MapLibre setup and terracotta pin shape, now with category symbols: utensils (Eat), cup (Coffee), glass (Drink), landmark (See), bag (Shop), bed (Stay), and a generic symbol for Other/custom categories.
- Adds English and Polish Privacy and Beta terms pages at `/privacy` and `/terms`, with small footer links. Optional session usage analytics now stays off until the visitor enables it on Privacy; it can be switched off there later. Existing account, guide and feedback features keep working.

### Before inviting beta testers

1. **Complete the privacy draft:** replace the generic operator wording with the actual person or legal entity and add a direct privacy contact. Confirm your Supabase/Netlify hosting regions, international transfer wording, and a real retention/deletion schedule. The draft does not invent these details.
2. Review the terms and privacy basis against your actual operating location and provider agreements. The copy is a first pass, not legal sign-off.
3. Run `npm ci`, `npm test` and `npm run build`. No new database migration or environment variable is required beyond v0.6.5. If your database has not received `0004_saved_guides_analytics.sql`, apply it separately.
4. On a real phone at 375–390 px and 320 px, switch EN ⇄ PL on a guide and Explore, check the filter widths, navigate List ⇄ Map, tap every pin and confirm the Netlify badge does not cover the view switch or Locate. Check Google/email sign-in and both legal links.

Analytics recorded by previous deployments is not automatically deleted when consent is switched off; deal with existing records under your final retention policy.

## v0.6.5 maintenance release

- Fixes the save/unsave analytics constraint with additive migration `0004_saved_guides_analytics.sql`.
- Keeps public guides readable if browser storage is blocked; a failed Save or Remove action shows a message and does not emit a success event.
- Explains an unavailable saved link and offers to remove its local shortcut. Unavailable guides still follow normal visibility rules.
- Stops live place search from substituting demo results when the provider fails. Demo search remains available in local demo mode without a key.
- Adds `npm test` checks and a dependency lockfile. TypeScript 5.9.3 uses the JavaScript compiler for a reproducible build in restricted environments. The MapLibre worker script and map UI remain unchanged.

### Upgrade from v0.6.4

1. Copy this source over your existing app, keeping your own `.env.local` and any local Git metadata. From the app root, run `npm ci`.
2. In your existing Supabase project, run **only** `supabase/migrations/0004_saved_guides_analytics.sql` once. Do not rerun migrations 0001–0003.
3. Run `npm test` and `npm run build`; check `dist/vendor/maplibre/` contains both `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs`.
4. Deploy the built source through your existing Netlify workflow. Verify an anonymous Unlisted guide can be saved, reopened and viewed on Map, and confirm `guide_saved` / `guide_unsaved` events reach `app_events` after migration 0004.

No new environment variable is required. The production deployment and database migration are not performed by this source bundle.

v0.6 is the **soft-launch readiness** release. It keeps the core proposition deliberately narrow — a knowledgeable person creates a guide once and shares it when somebody asks — while adding the minimum infrastructure needed to test that behavior with real users.


## v0.6.4 saved guides + home navigation patch

This patch keeps the proven v0.6.3 map implementation unchanged and adds one recipient utility before the first Netlify/mobile deployment.

- Public guide recipients can **Save guide** from the guide header without signing in.
- Saved guides are stored locally in that browser/device only; no Supabase table or account is required.
- `/saved` lists saved guides and links back to the original live guide. Removing a saved guide only removes the local shortcut.
- The landing page now has exactly three product entry points: **Your Guides**, **Saved Guides**, and **Public Guides**. The redundant top-right Guides/Create action has been removed from the landing page.
- Saving/unsaving emits lightweight `guide_saved` / `guide_unsaved` analytics events when cloud analytics is enabled.
- No dependency, environment-variable, or Supabase migration change is required.

### v0.6.4 routes

The existing routes remain unchanged, with one addition:

- `/saved` — device-local saved guides

### v0.6.4 QA

1. Open a friend's Unlisted or Public guide while signed out.
2. Tap **Save guide** and verify it changes to **Saved**.
3. Return to `/` and open **Saved Guides**; the guide should be listed.
4. Refresh the browser and confirm it remains listed.
5. Open the saved guide and confirm it still loads from its original live URL.
6. Remove it from Saved Guides and verify it disappears without affecting the original guide.
7. Confirm the landing page shows only the three main entry buttons plus the language control.
8. Re-test List → Map to confirm the v0.6.3 map worker behavior is unchanged.
9. Run `npm run build` before deployment.

## v0.6.3 map reliability patch

This patch keeps all v0.6.2 UI fixes and restores the proven v0.6 map behavior, while making MapLibre's worker independent of Vite's optimized-dependency cache.

- The map canvas, marker logic, framing, location behavior and raster styles remain the same as the working v0.6 implementation.
- `predev` and `prebuild` now copy MapLibre's matching worker **and** shared module from `node_modules` into `public/vendor/maplibre/`; the app points MapLibre at that same-origin worker before constructing a map.
- Attribution is back on MapLibre's native `AttributionControl`, forced compact and positioned bottom-left above the List / Map switch. There is no permanent contributor strip over or under the map.
- No Supabase migration or environment-variable change is required.

After replacing v0.6.2, stop the old Vite process and start normally:

```powershell
npm run dev -- --port 5173
```

`npm run dev` now prepares the worker automatically. The same happens before `npm run build`, so the production `dist/` contains the matching worker files as well.

## What changed in v0.6

### Creator UX

- **Share directly from Your Guides** using the native Web Share API where supported, with copy-link fallback.
- Guide cards now use a **system-generated destination tile** (city initial + restrained generated accent). There is no image upload/configuration burden.
- Reordering is smoother: a lifted drag preview follows the pointer/touch while surrounding rows animate into their new positions.
- Drag handles, venue titles and row menus now share a cleaner top-line alignment.
- The existing note-length convention remains: `x / 200`, shown only while editing.

### Visibility model

Guides now have three explicit states:

- **Draft** — owner only.
- **Unlisted** — anyone with the link can view it; it does not appear in Explore.
- **Public** — link-accessible and eligible to appear in Explore.

New guides start **Unlisted** so the core share-with-a-friend workflow remains frictionless. Existing v0.5.1 published guides are migrated to Unlisted, preserving their shared links without unexpectedly making them discoverable.

Draft guides can still be previewed by their owner at `/preview/:guideId`.

### Small public Explore surface

`/explore` shows only guides whose creators explicitly set them to **Public**. It is intentionally simple:

- grouped by city
- individual creator guides
- creator display name, place count and intro
- no rankings, stars, likes, follows, comments, reviews, feed or recommendation algorithm

This is a secondary acquisition/demo surface; direct sharing remains the primary product behavior.

### Polish UI

Core recipient and creator surfaces now support **English and Polish**. Language preference is kept in the browser.

User-written recommendations are never translated automatically.

Known default category names are localized in the UI while their database keys stay stable (`eat`, `coffee`, `drink`, etc.).

### Soft-launch measurement

v0.6 adds a small `app_events` table for privacy-light funnel learning. It records product events such as:

- guide created/shared
- visibility changed
- public guide opened
- venue opened
- map opened
- Google Maps handoff
- recipient clicked Create guide
- Explore opened / guide opened from Explore
- feedback submitted

The browser sends a random session-scoped anonymous ID; it resets when the browser session ends. The event table deliberately does not contain names or emails. Browser roles can insert events but cannot read the analytics table. Review it from Supabase SQL Editor/dashboard.

### Feedback

`/feedback` is a minimal feedback/bug/report form backed by Supabase. It is linked quietly from creator/home surfaces rather than interrupting guide recipients.

### Map + performance cleanup

- Provider attribution moved away from the bottom List/Map switcher.
- Existing sensible map framing/location behavior is retained.
- MapLibre is now **lazy-loaded only when Map is opened**.
- Major route surfaces are also lazy-loaded, so creator/editor code does not need to be part of the first homepage bundle.

The goal is to address the previous large-bundle warning through useful code splitting rather than hiding it by raising Vite's warning threshold.

## Upgrade from v0.5.1

No new environment variables are required and no new npm package was added.

There **is one new Supabase migration**. On your existing database run exactly once:

```text
supabase/migrations/0003_soft_launch.sql
```

Do not rerun `0001_initial.sql` or `0002_private_identity.sql` on the existing database.

The migration is additive. It:

1. adds `guides.visibility`
2. migrates old published guides to `unlisted` and drafts to `draft`
3. updates RLS so Unlisted/Public guides are link-readable while Draft remains owner-only
4. creates the write-only-from-browser `app_events` analytics table
5. creates the feedback table
6. reserves new route names (`explore`, `feedback`, `preview`) from profile handles

## Requirements

Node **22.12+**.

```powershell
node -v
npm -v
```

Then:

```powershell
npm install
npm run dev -- --port 5173
```

No dependency changed from v0.5.1, so if you copy these source files over an existing working v0.5.1 checkout you do not strictly need to reinstall `node_modules`.

## Environment variables

Same as v0.5.1:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_BROWSER_SAFE_PUBLISHABLE_KEY
VITE_GEOAPIFY_API_KEY=YOUR_GEOAPIFY_KEY
```

Never put a Supabase service-role/secret key in a `VITE_...` variable.

## Routes

### Supabase mode

- `/` — landing page
- `/explore` — opt-in Public guides grouped by city
- `/saved` — device-local saved guides
- `/feedback` — lightweight feedback / bug / report form
- `/creator` — sign-in / profile setup / creator home
- `/edit/:guideId` — editor
- `/edit/:guideId/add` — add places
- `/preview/:guideId` — authenticated owner preview, including Drafts
- `/:profileSlug/:guideSlug` — anonymous public link for Unlisted or Public guides

### Local demo mode

The existing local demo still works for UI development without Supabase.

## Identity model retained

- email is private authentication only
- display name is compulsory and human-facing
- handle is randomly generated and non-personal by default
- handle customization is optional
- future handle changes preserve old non-sensitive handles as aliases

## Sharing

On mobile browsers that support `navigator.share`, Share opens the native share sheet (WhatsApp, Messages, etc.). Otherwise the public URL is copied to the clipboard.

Drafts cannot be shared publicly until they are changed to Unlisted or Public.

## Social link previews

`index.html` contains clean generic Open Graph/Twitter metadata for Anyone's Guide.

A fully dynamic preview card containing the **specific creator + city** cannot be reliably produced by a purely client-rendered Vite SPA because WhatsApp/social crawlers generally read server-returned metadata rather than executing the app. Add per-guide server/edge-rendered metadata when the production domain/deployment layer is introduced; do not add a heavyweight SSR stack just for local soft-launch testing.

## Suggested soft-launch setup

The intended sequence is:

1. run the v0.6 migration
2. create/test guides as Unlisted
3. recruit a small warm cohort and share direct links
4. selectively mark strong guides Public
5. use `/explore` as a small credible browse surface
6. inspect event rows and concrete user feedback rather than optimizing for traffic

## Useful analytics queries

Recent events:

```sql
select event_name, guide_id, properties, created_at
from public.app_events
order by created_at desc
limit 200;
```

Simple event counts:

```sql
select event_name, count(*)
from public.app_events
group by event_name
order by count(*) desc;
```

Feedback:

```sql
select kind, message, page_path, created_at
from public.feedback
order by created_at desc;
```

## v0.6 QA checklist

After applying `0003_soft_launch.sql`:

1. Sign in and confirm existing guides show as **Unlisted**.
2. Create a new guide; confirm it starts Unlisted.
3. Share from **Your Guides**; verify native share / copy fallback.
4. Open the shared URL in Incognito; verify no login is required.
5. Change the guide to Draft; verify the public URL no longer loads for an anonymous visitor.
6. Verify **Preview** still works for the signed-in owner while Draft.
7. Set it to Public and verify it appears at `/explore`.
8. Set it back to Unlisted and verify it disappears from Explore but the direct URL still works.
9. Switch EN / PL on home, public guide, auth and creator flows; verify author-written notes remain unchanged.
10. Drag-reorder several venues with mouse and touch emulation; confirm the drag preview follows smoothly and surrounding rows animate.
11. Open Map; confirm the map is downloaded on demand, pins frame sensibly, attribution does not collide with List/Map, and the locate control still works.
12. Submit feedback and inspect the row in Supabase.
13. Exercise a public guide and inspect `app_events` in Supabase.
14. Run:

```powershell
npm run build
```

With v0.6 code splitting, expect MapLibre to appear in a separate lazy chunk. A large lazy map chunk is acceptable; the important improvement is that list-first recipients no longer download it before asking for Map.


## v0.6.1 quality patch

This patch is intentionally feature-neutral. It addresses the six issues found in the v0.6 QA pass:

- drag-and-drop cleanup now listens at window level and always clears the floating preview on pointer up/cancel, window blur, tab visibility change, or Escape;
- Polish public navigation and category chips are more compact, while the public guide title remains in the consistent `Boris’s Gdańsk` form;
- homepage copy is shorter and gives the eyebrow, headline, and body distinct jobs;
- map attribution is rendered in a slim non-overlay strip below the map canvas, so it no longer competes with guide controls;
- the Anyone’s Guide wordmark is a canonical two-line, left-aligned lockup with the wave underneath wherever it appears;
- intentional autocomplete aborts are swallowed cleanly rather than surfacing as uncaught console errors.

No Supabase migration, dependency change, or new environment variable is required for v0.6.1. If you are already on v0.6, replace the source files and restart Vite.

### v0.6.1 QA

1. Drag a venue repeatedly in Chrome and Edge desktop plus mobile emulation; release both inside and outside the row and confirm the floating preview always disappears.
2. Start a drag, then press Escape; start another and switch tabs; confirm the editor returns to its normal state.
3. Switch to Polish on a ~375–390 px viewport; confirm the public category pills stay on one row and the masthead controls remain comfortable.
4. Confirm the public title stays `Name’s City` in both EN and PL.
5. Confirm the wordmark is always `Anyone’s` / `Guide` on two lines, left aligned, with the wave underneath.
6. Open Map; confirm attribution sits below the map content and does not overlap List/Map or the locate button.
7. Type quickly into Add places, then clear/change the query; confirm there is no uncaught `AbortError` in the console.
8. Run `npm run build`.


## v0.6.3 map QA

1. Stop any existing Vite process.
2. Run `npm run dev -- --port 5173` and confirm the predev worker-preparation step completes without error.
3. Open a guide in List mode, switch to Map, and confirm tiles, pins and initial framing render.
4. Pan and zoom; confirm pins remain geographically anchored.
5. Tap the compact attribution control at bottom-left; confirm credits are accessible and do not permanently cover map content.
6. Confirm List / Map remains bottom-centre and Locate remains bottom-right.
7. Run `npm run build`; confirm `dist/vendor/maplibre/maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` exist.

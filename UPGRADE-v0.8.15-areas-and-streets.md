# Upgrade to v0.8.15

This patch merges into v0.8.14. It contains changed/new files only, with one outer folder. Use `UPDATE-v0.8.15.txt` from the existing project root. It does not delete files or replace credentials, Git metadata, dependency installs, or build output.

## Database and release order

1. Merge the patch locally.
2. Apply `supabase/migrations/0012_area_recommendations.sql` once, after migrations 0001 through 0011, using your normal Supabase migration process or SQL editor. Do not reapply earlier migrations.
3. Run `npm test` and `npm run build` locally.
4. Deploy the frontend with the existing Netlify setup. This deliverable does not run a production migration or deployment.

No dependency or environment changes. Geoapify uses the existing frontend key. Without a working reverse lookup, the author can enter a title manually. Optional map search is biased toward the guide city but has no hard city-distance filter, so nearby towns can be reached; they are added as an Area recommendation, not a second destination guide.

The additive migration defaults existing places to `venue`, adds an `areas` category without rewriting old categories, and updates the existing add/edit/guest-claim RPCs. Existing IDs, stars, notes, visibility, routes, and legacy Stay records remain. New geographic edits require the guide owner and a guide-scoped manual entry; users cannot rename a shared venue through the new editor.

Deploying this frontend before 0012 will fail cloud guide reads because `recommendation_kind` is selected. If frontend rollback is needed, retain the additive migration; do not drop it after authors have saved area/street recommendations. An older frontend will not render their distinct types.

## Product behavior

The original input remains for venues. The new bar below it opens a map with a fixed central pin. Pan/zoom or optionally search to move the camera, confirm the spot, choose Area or Street, review/edit the name, add an optional personal note, then explicitly save. Reverse lookup supplies geographic names, excludes businesses/full addresses, and does not move the pin. Typing your own title protects it from a late response. A distant snapped street is not suggested.

Canceled writing stays available when the author opens the map again. Only an attempted, incomplete save reopens automatically. Drafts expire after seven days and are scoped to the guide/account. Stable manual IDs make retries idempotent; two intentionally separate pins can have the same title.

Owner, guest and local creation/edit paths retain coordinates, title, type, notes and stars. The existing row menu exposes Edit name and pin for geographic entries. The guide has one Areas to explore subsection and one shared map: area/street pins use outlined rounded squares with grid/road symbols, venues retain their existing markers, and stars retain the same meaning. Areas appears in category chips only when occupied. Open in Maps uses the selected starting coordinates.

Walks, drawn boundaries, routes, photos and Gemini troubleshooting remain deferred.

## Verification

Production build and complete automated suite are run against this version. Database tests apply all twelve migrations to PostgreSQL via PGlite, including checks that 0012 preserves historical records, owner permissions, idempotent additions, atomic edits, and guest claims. UI/service tests cover exact coordinates, late naming responses, interrupted save recovery and retry, canceled drafts, failed map startup, and unchanged venue entry.

A real Chromium browser with MapLibre was checked in EN/PL at 320, 390 and 1280px: first-place map flow, geographic creation, mixed reader markers, details, and coordinate links. Tiles and geocoding were intercepted with fixtures, so this validates layout and application behavior, not the live Geoapify/Supabase credentials or production services. Test files label their service boundaries. Live smoke testing is still needed after applying the migration and deploying.

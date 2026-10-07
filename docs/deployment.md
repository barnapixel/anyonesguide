# Deploying v0.8.5

Use [UPGRADE-v0.8.5-screenshot-import.md](../UPGRADE-v0.8.5-screenshot-import.md) for current environment setup and acceptance. Merge the complete source, retain local credentials and repository metadata, run `npm ci`, `npm test`, and `npm run build`, then deploy through the existing Netlify source workflow.

This release adds one Netlify Function. Set `GEMINI_API_KEY` and `RECOMMENDATION_IMPORT_ENABLED=true` in the Functions environment before trying import. An optional `GEMINI_IMPORT_MODEL` overrides the documented default. No dependency, database migration or auth-redirect change is required on working v0.8.4. Source deployment is necessary; `dist` alone does not include Functions or Edge Functions.

Nothing has been deployed or migrated live by the assistant. The prior database and sharing instructions remain below for older installations.

## Historical v0.8.4 deployment instructions

# Deploying v0.8.4

These instructions describe the local deliverable. No live migration or deployment was performed by the assistant.

On a **working v0.8.3 database**, no SQL is required for this release. All migrations are identical to the existing source. Merge the full v0.8.4 folder into your project, retaining `.env.local`, Git metadata and Netlify settings. Review overlapping manual edits. Run `npm ci`, `npm test` and `npm run build`, then deploy through the existing Netlify source workflow.

If the database is still on v0.8.2, apply only its missing **0010_short_invitation_links.sql** once for the retained short-link functionality. Do not rerun 0001–0009 or the old private-schema repair on a working project. Older projects should apply only their missing migrations in order.

Follow [UPGRADE-v0.8.4.md](../UPGRADE-v0.8.4.md) for the mobile acceptance sequence. Keep the Edge Function, shared module and four social PNGs together. Dist-only deployment does not update edge metadata. No dependency, environment variable or auth redirect change is required.

## Database and compatibility

0010 retains `create_guide_invitation(uuid,text,text,text)` and `read_guide_invitation(uuid)`, adding a shortCode field to their results. Older clients ignore that additive field. `read_guide_invitation_by_code(text)` returns the same original UUID/context. Codes are 12 URL-safe, case-sensitive characters representing 72 random bits. A unique constraint rejects collisions; creation retries them. The generator uses built-in PostgreSQL UUID/random-byte operations and requires no extension setup or browser EXECUTE permission.

The private table keeps RLS and revoked direct browser permissions. Only the bounded creation and exact-match public lookup RPCs are granted to anon/authenticated. No listing, prefix search, account UUID, creation key or recovery capability is exposed. Lookup codes resolve public invitation context, not private drafts. The original UUID continues to index draft responses. Approved-name snapshots, owner-bound private retry keys, account deletion, optional anonymous names and 10/source/minute plus 120/global/minute quotas remain unchanged. Anonymous retention still has no automatic expiry.

New code-aware app deployment must remain available after short links are shared; rolling back to an older app would strand those short links. UUID and legacy query links remain supported by v0.8.4.

## Hosting and operations retained

Use the existing browser-safe Supabase key and URL for the Edge Function. No service-role frontend key is allowed. No dependency, environment variable, auth return URL or maintenance change is required. The matching MapLibre worker/shared modules remain prepared by the normal npm build. Keep the existing service-role/admin daily guest-draft cleanup, same/different-browser Google/email acceptance and consent-only analytics.

Shared route metadata is rendered in initial HTML for all user agents, using only public-key, RLS-governed data. This adds lookup work to direct public-page loads. Lookups time out; failures pass through the ordinary app response. Private routes receive no personalized public metadata. Successful metadata responses preserve other headers, remove stale transport/ETag headers and use no-store. Messaging apps can still cache cards independently. PNGs are static same-origin assets with no personalized data or third-party renderer.

Keep the existing referrer/framing/nosniff/device-permission headers and report-only CSP. Existing provider/legal operational facts are unchanged; this patch makes no additional compliance claim.

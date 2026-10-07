# v0.8.5: screenshots and existing recommendations

The import behaviour below remains applicable to v0.8.7. For current Gemini environment scopes and redeployment steps, use [the v0.8.7 setup reminder](UPGRADE-v0.8.7-personal-recommendations.md). The badge anchor and test count describe the historical v0.8.5 release and are superseded by [the v0.8.6 upgrade note](UPGRADE-v0.8.6-city-labels-and-badge.md).

This is a complete integrated source release built from the supplied v0.8.4 archive. Package and lockfile are 0.8.5. No dependency pins or SQL migrations changed. No live deployment was performed.

## What changes

- The first-place screen retains direct search and the latest English/Polish question and examples. It adds “Start with one. You can add more later.” and the optional “Upload a screenshot to get started” link.
- One screenshot can come from reviews, saved lists, a message or notes. PNG/JPG/WebP uploads and clipboard images are supported. Pasted messages/lists are available inside the same inline flow.
- The import flow temporarily replaces the search area on that screen. There is no mandatory extra onboarding route.
- Gemini extracts up to 20 explicitly named places and short source quotations. It does not recommend places, assign coordinates, translate, rewrite notes, import ratings or choose stars.
- Each venue must be confirmed using the existing Geoapify city search. All extracted entries start unchecked. Choosing a venue checks that entry; it can be unchecked or omitted before saving. Unmatched or unwanted entries are left out.
- Notes start empty. A source quotation can be explicitly copied into a note, edited or omitted. Exact English/Polish source language is retained.
- Explicit Save uses the existing individual save paths in sequence. Account owners, signed-out invited guests and local/demo guides are supported. Later Add place visits use the same importer and retain an explicit category prompt.
- Duplicate venue choices and already-present matches are rejected. Existing guide notes, categories and stars are not changed by choosing a duplicate.
- Saved rows are marked after each completed save. Failed remaining writes keep the review and latest notes. The very first pin’s failed note also restores the review. Retrying uses the existing idempotent add path and durable note queue, rather than creating another pin.
- Once a venue has had a save attempt, its inclusion and match are fixed during retry because a pin might already exist. Its note remains editable. The normal editor follows a successful first import with All selected.
- The current injected Netlify public badge iframe is anchored 64 px above the viewport bottom, plus the device safe area. Netlify still owns the frame’s content, sizing and open popover.

## Setup before trying the import

In Netlify, open this project’s environment variables and add these with **Functions** scope:

| Variable | Value |
| --- | --- |
| `GEMINI_API_KEY` | Your Gemini API key, set directly in Netlify |
| `RECOMMENDATION_IMPORT_ENABLED` | `true` |
| `GEMINI_IMPORT_MODEL` | Optional. Defaults to `gemini-3.8-flash` |

Use a Gemini project with the model/API enabled and suitable billing, quota and data-processing settings. The API key stays on the server. Never use a `VITE_` prefix for it, put it in client code or commit it to Git. Existing `VITE_GEOAPIFY_API_KEY` remains necessary for live venue matching.

Redeploy the **source project**, including `netlify/functions/recommendation-import.mjs`, `netlify.toml` and the existing Edge Function/shared assets. A dist-only upload does not deploy the new server function. `/api/recommendation-import` is routed to the default function endpoint before the SPA catch-all.

To pause extraction without changing guides, set `RECOMMENDATION_IMPORT_ENABLED=false`. Missing/disabled server configuration returns a recoverable message; direct search still works. No new Google sign-in scopes, Supabase keys, auth redirects or database migrations are required on a working v0.8.4 installation.

For frontend-only local work:

```sh
npm ci
npm test
npm run build
npm run dev
```

For local import calls, configure the server variables in your local environment and run `npx netlify dev`. Open its reported URL, normally port 8888. Plain Vite development/preview does not run Netlify Functions. Do not share or commit local credentials.

## Data handling and limits

The browser re-encodes screenshots locally as JPEG, strips original metadata and limits the submitted image to 2 MiB. Input files are capped at 12 MiB and 24 million pixels; output dimensions are bounded at 1800 by 6000 while retaining aspect ratio. Crop oversized or long screenshots to the relevant recommendations. HEIC and animated formats are not accepted in this version.

Pasted text is capped at 12,000 characters. Server request bodies are streamed with a 3 MiB bound; image MIME/signature, input and provider output are validated. There is one Gemini request per extraction and no Files API upload. Requests are stateless (`store:false`), do not include guide/account IDs, and are not logged by application code. Google’s API terms still govern its own processing. Crop/remove private information before submitting.

The Netlify Function declares a six-request/minute limit per IP and returns `no-store` responses. The native host limit and actual provider quota must be checked after deployment; the automated tests do not prove their enforcement on your Netlify account. The enable switch can pause the endpoint.

Original screenshots and full pasted messages live only in component memory and are discarded after successful extraction, cancellation or leaving the screen. Pending extracted names, quotations, venue matches and edited notes use the existing browser-storage approach, scoped by account/guide or independent guest draft. Reviews expire after seven days and are removed when the app next opens. A storage warning is shown if the review cannot be kept. Only explicitly saved venues and notes enter the guide database.

Batch saving is sequential, not a new atomic database transaction. A cloud pin may exist before its note finishes saving. A failed note is kept in the durable queue and the import review remains available for retry. Once saving starts, already-attempted entries stay selected for retry; already-added places can be removed in the editor.

## Verified locally

**150 automated tests pass, with no failures or skips.** TypeScript/Vite production compilation passes. The existing lazy MapLibre chunk warning remains; the frontend main chunk also crosses the 500 kB warning threshold.

The new coverage executes actual client/review/Editor/AddPlaces/store code with extraction, search and remote database fixtures. It verifies English/Polish, explicit selection/save, notes, duplicates, categories, guest durability, local batches, partial cloud saves, reopening and expiry. Direct handler tests use the documented Gemini REST request/response shape. Image-upload/clipboard assembly uses a fixture decoder and canvas.

No real Gemini extraction or OCR-quality check was performed because no Gemini key was available. The browser installation failed, so no visual/mobile/browser validation is claimed. No live Netlify or Supabase change was made.

## Outstanding live and phone checks

1. Set the server variables and verify extraction from a real EN and PL screenshot, a Google review/list screenshot, a message screenshot and pasted recommendation text. Check that visible names and quotations are accurate, private/unrelated conversation is excluded, and negative reviews or wish-list places are not treated as automatic recommendations.
2. Confirm actual Geoapify matches for the guide city, same-name venues, another-city screenshots and unclear names. Correct the query or leave uncertain entries out. Check slow/offline, empty/unreadable input and provider-quota errors.
3. Save one and several choices as an owner and as an invited guest before sign-in. Check later category-specific additions, partial save/retry, refresh, failed device storage and existing notes/stars. Finish/sign in/share a guest guide through the retained flow.
4. Check Android Chrome and iPhone Safari photo picking, clipboard paste, keyboard dismissal, reachability of results and notes, English/Polish wrapping, narrow screens and long review lists.
5. Check the real Netlify badge on short/long pages and full-screen maps, including scrolling, browser bars opening/closing, portrait/landscape, keyboard and its open popover. The CSS targets the currently observed `nl-badge-frame` ID, not a documented Netlify positioning API; provider markup changes can require an update. It does not hide the badge or move Netlify’s owner toolbar.
6. Verify the deployed function redirect, same-origin guard, runtime environment and native rate limit. Recheck retained auth, messaging previews and sharing on their real services/devices.

## Implementation references

- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini Interactions REST reference](https://ai.google.dev/api/interactions-api)
- [Netlify Functions configuration](https://docs.netlify.com/build/functions/configuration/)

The live homepage and injected public HUD script were inspected read-only to identify the badge frame. No Netlify account setting was changed.

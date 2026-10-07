# v0.8.7: personal recommendations first

Complete cumulative source built on v0.8.6. Package and lockfile are 0.8.7. This is a small reader presentation change. No deployment was performed.

## Changes

- List cards show the venue name, then the exact author note, then quieter location/distance information. Notes retain the existing two-line limit. A place without a note has no placeholder or empty note space.
- Place details, whether opened from the list or map, show the exact author note ahead of category/distance/address. Existing star meaning, full note, directions action and accessible dialog behaviour remain.
- The collapsed From [author] introduction shows up to two lines, preserving line breaks and wrapping long words. Expanding reveals the full original text. It remains collapsed initially and absent when empty.

The first-save flow is unchanged, as requested. English/Polish dictionaries and shared invitation/sharing copy are byte-identical to v0.8.6. No photos, Google data integration, onboarding steps, new dependencies, SQL or hosting configuration were added. The v0.8.6 city-label and badge fixes and v0.8.5 screenshot/message importer remain included.

## Upgrade

Merge the contents of the integrated folder into your existing project root. Retain your local credentials and Git metadata; review any manual changes that overlap. No new migration or environment variable is needed for these reader changes on the working v0.8.6 app.

Use the normal source deployment through your existing GitHub/Netlify workflow. Build command: `npm run build`. Publish directory: `dist`. The complete source also contains the Netlify Functions and Edge Function configuration.

## Enable screenshot/message interpretation with Gemini

This uses the existing server API, rather than a ChatGPT connector or extra Google sign-in permissions.

1. Create a project/API key in [Google AI Studio](https://aistudio.google.com/api-keys). Check that Gemini API access, quota and billing/data-processing settings are suitable for the app before public use. Google currently lists `gemini-3.8-flash` as a stable model. No live request from your project has been verified here.
2. In your Netlify project's environment-variable settings, enter:

| Variable | Value |
| --- | --- |
| `GEMINI_API_KEY` | The API key from AI Studio |
| `RECOMMENDATION_IMPORT_ENABLED` | `true` |
| `GEMINI_IMPORT_MODEL` | Optional. Leave unset to use `gemini-3.8-flash` |

Set values for Production and any preview context where you want to test. If Netlify offers a scope selector, include Functions, preferably Functions only for the secret. On Free, the default all-scopes setting includes Functions. Keep the key in Netlify settings, never under a `VITE_` name, in browser code, in `netlify.toml` or committed to Git. Your existing `VITE_GEOAPIFY_API_KEY` is still needed to match extracted names to actual venues.

3. Deploy the complete source project after setting the variables. Netlify Functions use environment values from deployment time, so setting or changing them requires a new deploy. Uploading only a locally built `dist` folder does not install this server function.
4. Try one cropped English screenshot and one Polish screenshot, plus pasted text. Review the extracted names, confirm actual venues, choose what to include, then press Save. Check one invited guest before sign-in as well as an owner.

To disable extraction later, set `RECOMMENDATION_IMPORT_ENABLED=false` and redeploy. Direct search and saved guides remain available. No new Supabase migration, auth redirect or Google sign-in scope is required for the importer on the existing working installation.

For local extraction, use `npx netlify dev` with the server variables configured, then open its reported URL. Plain `npm run dev` runs the frontend only.

The app does not persist screenshots or complete original messages. It submits input to Google for interpretation; the existing provider terms still apply. Crop unrelated/private information. See the retained v0.8.5 setup note for limits, review recovery and failure behaviour.

Official setup references, checked 7 October 2026:

- [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Gemini model catalogue](https://ai.google.dev/gemini-api/docs/models)
- [Netlify scopes and deploy contexts](https://docs.netlify.com/build/environment-variables/overview/)
- [Netlify Functions environment and redeployment](https://docs.netlify.com/build/functions/environment-variables/)

## Verification

The existing 160 automated tests pass with zero failures or skips. No new tests were added for this reversible presentation change. TypeScript/Vite production build passes. Existing main/MapLibre chunk-size warnings remain.

A local headless Chromium check rendered the actual PublicGuide, PlaceRow and PlaceSheet components with fixture guide data in EN and PL at 320, 390 and 768 px. All six layouts passed checks for no page horizontal overflow, note-before-location positioning, compact note-free rows, a two-line collapsed introduction, expand/collapse, absent empty introductions, dialog focus/Escape, full long notes and reachable directions. English and Polish screenshots were visually inspected. This is desktop Chromium at simulated viewport widths, not actual phone acceptance or a live backend/API integration test.

Still outstanding: Android Chrome/iPhone Safari layout and device behaviour, live Gemini extraction and OCR quality, deployed function routing/rate limiting, actual Geoapify matching, live map/badge behaviour and retained sharing/auth/recovery checks. No paid API call, live Supabase change, hosting setting or deployment was made.

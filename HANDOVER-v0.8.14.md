# Anyone’s Guide: new-chat handover

10 October 2026. Current source: **0.8.14**. Use `anyones-guide-v0.8.14-integrated.zip`, the complete cumulative application, not a patch. Package and lockfile agree. All earlier changes are integrated. The live site's version is not established by this archive; these patches were not deployed by the assistant.

## Proposition and working style

Anyone’s Guide helps people collect and share their favourite places with friends. The value is who recommends a place and what they say about it. Keep it mobile-first, personal, warm, clean and slightly playful, with a considered desktop layout.

Preserve the latest English/Polish copy in `src/i18n.tsx` and `shared/share-copy.mjs`. These files are authoritative. Keep Polish natural and author words exact. Avoid em dashes in new system copy and conversation.

Brainstorm and agree significant changes before building. Once authorised, finish the work and deliver a patch ZIP with a one-line VS Code PowerShell merge command that handles the outer folder and preserves credentials/Git metadata. Keep explanations concise; challenge ideas when useful. Reuse affected tests for small fixes rather than routinely expanding/rerunning everything. Do not deploy or change external accounts without authorisation.

## Decisions to preserve

- Creation: inline search, select a venue, optional note, explicit Save, then the normal editor. No extra onboarding screen or mandatory three-place target. Later additions retain category intent and duplicate protection.
- Cold start: one of three approved horizontal illustrations, selected once per visit and stable through typing/Change. English artwork stays in EN/PL. The screenshot alternative is hidden on the first-place screen for the current user-test release. Later Add place import remains available; Gemini currently fails live with HTTP 502 and troubleshooting is deferred. Screenshot/message imports require review before saving. Notes start empty; copying source wording is optional, never automatic rewriting.
- Categories: Eat, Coffee, Drink, See, Shop. Stay is replaced by an optional personal guide note; preserve legacy records. Stars are the author's top picks, first within their category and highlighted on pins.
- Mobile guide: title, personal note, inline map, categories, recommendations. No total-place-count line. The note previews one line; its header stays stationary while the body expands over 200ms, respecting reduced motion. Only the header toggles it; text stays selectable.
- Map: fit the pins. The preview retains all places when list filters change, with transparent clickable credits and Explore map at the bottom edge. Full map inherits filters and reuses the canvas. Back restores note/category/scroll/focus. Its arrow-only Back sits beside scrollable categories; no guide-title panel or site footer.
- Rows: venue name, star, exact personal note and street. Omit city/postcode, but retain the full address in details. Never invent numbers. The supplied Gdańsk records yield Garncarska, Księdza Jerzego Popiełuszki 5 and Wałowa without refreshing stored data.
- Footer: centred, discreet, in normal document flow. Fixed Map/Add controls clear the visible footer and conditional Netlify badge lane. Initial visual reveal coordinates map/illustration and content, with a bounded 2.5-second wait and usable failure recovery. Filtering/map return do not restart loading.

Google Maps migration, venue-photo providers and user-uploaded venue photos remain proposals. Avoid Google-style ratings, generic AI recommendations and unnecessary information density. Preserve owner/guest/local recovery, sharing/invitations and explicit saving.

## Desktop in v0.8.14

At 1,024px+, a frame capped at 1,140px pairs the guide's introduction/list with a larger sticky map. The editor pairs the guide note with one sortable venue list; Add place sits in the open left area. Home pairs existing copy/actions. Your guides, Saved guides and Explore use two-column cards, preserving order/city grouping. First-place illustration sits beside search; selection/import remain focused forms. Venue details are centred scrollable dialogs. Smaller layouts and copy remain unchanged.

## Architecture and setup

React/TypeScript/Vite, MapLibre with Geoapify/OSM, Supabase database/auth, Netlify hosting/functions. Preserve dependency pins and all eleven migrations. Google Sign-in, author notes, stars and recovery remain. Saved Guides are browser/device-local shortcuts. Unlisted is the default; public discovery is opt-in.

Credentials are excluded: retain existing `.env.local` and hosting settings. Screenshot extraction uses server-only `GEMINI_API_KEY` and `RECOMMENDATION_IMPORT_ENABLED=true`, never a VITE-prefixed Gemini key. The function is included in source; no manual function creation is needed. Frontend preview: `npm run dev`. Local function requests: `npx netlify dev`. Deploy source to include functions.

The previously reported map-loading warning despite visible tiles remains unresolved. Unsupported/incomplete street formats can still need review. v0.8.14 adds confirmed invitation destinations. Apply 0011 before deploying. Recipients skip city selection when a structured destination exists; older/no-city invitations keep the picker. Existing responses resume. Next: user tests; Gemini diagnostics deferred.

## Starting prompt

```text
We’re continuing Anyone’s Guide. Read the attached handover and full integrated v0.8.14 code, including source, tests, migrations and configuration. First confirm the actual version, flag material discrepancies and briefly summarise the current state. Preserve our agreed product decisions, latest English/Polish copy and working style. Avoid em dashes. Don’t implement anything yet. Once you understand the project, we’ll agree the next task.
```

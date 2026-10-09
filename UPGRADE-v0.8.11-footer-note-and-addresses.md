# v0.8.11 patch for v0.8.10

Apply the contents of `anyones-guide-v0.8.11-patch/` to your existing v0.8.10 project root. `UPDATE-v0.8.11.txt` contains a one-line PowerShell command for VS Code. It checks the starting version, handles the archive's outer folder and preserves `.env.local` and Git metadata. Review any overlapping manual edits. The command does not push or deploy. The pack contains changed and added files only, not a complete application.

No new dependencies, SQL migrations, environment variables, Netlify settings or Gemini setup changes are required. Package and lockfile become 0.8.11. Existing predev/prebuild scripts continue preparing the pinned MapLibre worker. To check locally after applying: `npm run build`, then `npm run dev`.

## Changes

1. The legal footer stays centred in normal document flow. On short pages the app shell keeps it near the bottom; on long pages it follows the content. Legacy guide-footer offsets are removed and its shadow is removed. Both the contextual Map shortcut and the editor Add place action move above the footer while it is visible, using its actual position and height rather than a fixed guessed offset. The same mechanism handles label wrapping and resize. Full-map view still hides the footer. The existing conditional Netlify badge lane and safe-area spacing remain.
2. Map attribution has a transparent background with no border, radius or shadow box in the preview and full map. All existing attribution text and links remain. A small light text halo supports contrast, and credits keep their own nonoverlapping space beside Explore map and above an enabled badge.
3. The personal note has a persistent author header and chevron. A single paragraph expands from two visible lines to the full exact note underneath the same header. Only the header button toggles it; the note is selectable. Keyboard operation, aria-expanded and aria-controls are retained. Map return preserves expansion; opening another guide resets it. The header is stable within its card, not sticky while scrolling.
4. Street extraction now handles numbered street names, spaced house letters, multiple slash numbers, en-dash ranges, common unit suffixes, translated/diacritic city differences, district suffixes and a different provider venue prefix. It considers the initial address fields, rejects recognisable postcodes/geography and avoids displaying an unknown city or semantic subtitle as a fallback. New Geoapify search results keep structured street/house-number data in the existing persisted subtitle field, retaining the complete formatted address for details and directions. No schema change, backfill, network refresh or extra provider call is added.
5. Full map has a 44px arrow-only Back button with the existing translated accessible name. The guide-title pill is removed. Category filters remain below it on mobile. Map fitting uses the measured toolbar bottom, including wrapped categories and safe-area position, with clearance for markers. Existing badge/bottom clearance and map state behaviour remain.

## What is preserved

All-place preview with no reload/refit when list filters change, full-map filtering, stars, exact author notes, full stored addresses, place sheets, category/position/focus restoration, bounded initial loading and failure recovery, the three approved English graphics in EN/PL, screenshot/message review, explicit Save and owner/guest/local draft recovery remain. No i18n entries are changed. Google migration and venue photos remain paused.

## Address limitation and acceptance

The screenshots show which rows are missing streets, but do not include those venues' full saved address values. This patch fixes verified parser limitations and provider data retention. It does not invent a street or query a new service when an old record has none. After applying, check Masło Maślane, Restauracja Pueblo and Pierogarnia Stary Młyn in the Gdańsk guide. If a row is still blank, compare its place-detail full address with the expected street to distinguish absent data from an unhandled format. Preserve the old record and exact author note when investigating.

## Verification and rollout

See `docs/verification.md` for executed checks and outstanding live/device acceptance. Real Android/iOS browser chrome, safe areas, keyboard/touch behaviour, actual Netlify badge and live provider data still need checking. Existing Gemini/function and auth/sharing/recovery live checks remain outstanding. No deployment or account change occurred.

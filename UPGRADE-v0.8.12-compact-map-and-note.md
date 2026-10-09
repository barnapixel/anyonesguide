# v0.8.12 patch for v0.8.11

Apply the contents of `anyones-guide-v0.8.12-patch/` to your existing v0.8.11 project root. `UPDATE-v0.8.12.txt` contains the one-line PowerShell command for VS Code. It checks the starting version, handles the ZIP's outer folder and preserves `.env.local` and Git metadata. Review overlapping manual edits. It does not push or deploy. This is a changed-files patch, not a complete application.

Package and lockfile become 0.8.12. No new dependencies, SQL migrations, environment variables, provider setup or hosting changes. After applying, use `npm run build` and `npm run dev` for your local preview.

## Changes

1. Full-map Back and categories share one row. Back remains a 44px arrow-only button with the existing EN/PL accessible label. Categories retain their labels and comfortable 44px heights; they scroll horizontally when necessary, while Back stays visible. An inherited or changed active category is brought into view without scrolling the whole page. Keyboard focus also brings its category into view within the strip. Camera padding uses actual toolbar height, and the smaller fallback padding reflects a single row. Existing warning text is positioned beneath the compact toolbar; its error-handling logic is unchanged.
2. The note starts with one line. Its author header and chevron remain stationary; one exact note paragraph expands/collapses through a measured height transition over 200ms. Clamping returns after collapse instead of cutting the text before the transition. The chevron rotates gently. Reduced-motion preferences disable transitions. Responsive width changes, short notes, rapid toggling and map return retain correct state and height. Note text remains selectable and does not toggle the card.
3. Plain street names can display without a number when the saved address supplies recognised postcode/city context. The exact screenshot records now produce Garncarska, Księdza Jerzego Popiełuszki 5 and Wałowa. City comparisons tolerate diacritics, and existing numbered/prefixed street support remains. No number is invented. Full addresses, venue names and exact notes are unchanged, and there is no new request, stored-data refresh or backfill. Plain ambiguous subtitles, postcodes, city-only values and recognised district-only labels are still omitted.

## What is preserved

The all-pin preview stays stable when list filters change. Full-map filters, pin selection, same map instance, stars, detail sheets and return category/note/position/focus behaviour remain. Footer centring and measured action clearance, transparent attribution, the conditional badge lane, coordinated initial loading and failure recovery, three approved English graphics in EN/PL, screenshot review, explicit Save and owner/guest/local recovery remain. No i18n dictionary entries change.

## Acceptance

See `docs/verification.md` for executed checks. On your phone, check the single map toolbar and horizontal category gestures, the selected category after opening the map, the one-line note and expansion/collapse, and the two previously blank streets. No house number will appear for Garncarska or Wałowa unless it exists in the saved record. Unknown international address formats can still require individual review.

The map-loading warning seen in the earlier screenshot is a separate existing issue. This patch changes its position with the toolbar, but does not diagnose a live tile/provider error or change when warnings are shown. Real phones, live providers/badge, Gemini/functions, auth/sharing and hosted recovery remain outstanding. No deployment or account change occurred.

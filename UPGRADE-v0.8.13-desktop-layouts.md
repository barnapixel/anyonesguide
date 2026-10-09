# v0.8.13 desktop patch for v0.8.12

Apply the contents of `anyones-guide-v0.8.13-patch/` to your existing v0.8.12 project root. `UPDATE-v0.8.13.txt` contains the one-line PowerShell command for VS Code, including the ZIP's outer folder and a starting-version check. It preserves `.env.local` and Git metadata. Review any overlapping manual edits. The command neither pushes nor deploys. This archive contains changed/new files, not a complete application.

Package and lockfile become 0.8.13. No dependency, SQL migration, environment variable, provider setting or hosting change is required. Use `npm run build` and `npm run dev` after applying.

## Desktop layouts

At viewport widths of 1,024px or more, pages use a shared frame up to 1,140px with comfortable margins.

- Guide: title, personal note, categories and recommendations form the left reading column. A larger overview stays alongside on the right as you scroll. It still shows all places when list filters change. Explore map opens the existing full map with the selected category, reusing the same canvas; Back restores the reading state.
- Home: the existing proposition and actions share the width. Ask for recommendations keeps its accent, and navigation destinations and copy are unchanged.
- Editor: the optional guide note sits beside the single sortable venue list and stays within reach while scrolling. Existing category filters, saving, stars, menus and ordering remain. Desktop Add place sits in the open left area, clear of venue controls and the footer/badge lane.
- Your guides, Saved guides and Explore: two-column cards retain their existing data order. Explore retains its city grouping. New-guide destination search stays a comfortable form width.
- First place: one of the three approved horizontal illustrations sits beside the question/search area. It is not cropped or duplicated. Selection and screenshot review return to a focused single column, preserving Change and explicit Save. English artwork remains in both languages.
- Place details: a centred desktop dialog, with scrolling note/address content and a visible directions action. Keyboard focus and Escape remain. Short screens and long names/notes are bounded to the viewport. Login, profile, Add place, feedback and legal forms retain their readable widths.

Mobile and tablet layouts below 1,024px keep the existing order, dimensions and copy. Resizing across the breakpoint retains note/filter state and the same map. No new photo, rating, recommendation feed, font or asset is loaded. A larger desktop map may request more of the existing provider's tiles to fill its viewport; there is no second map instance or new API integration.

## Checks and acceptance

See `docs/verification.md` for executed component, browser and mobile comparison checks. The automated full suite was not rerun for this presentation patch. On real devices, check laptop browser zoom, scrolling/sticky map behaviour, category/keyboard navigation, dialog focus, the editor's Add place action and the first-place search/Save sequence. Real mobile devices, Safari/Firefox, live tile/search services, the actual Netlify badge and deployed functions/auth/recovery remain outstanding. Nothing is deployed or changed in your accounts.

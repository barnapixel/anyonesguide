# v0.8.8: personal note and inline map

Complete cumulative source built on v0.8.7. Package and lockfile are 0.8.8. No deployment was performed.

## Reader experience

The guide opens with its title, optional From [author] note, compact map, category filters and places. The author note retains the two-line collapsed excerpt, exact original text and expansion. Legacy introductions and the place count/save action are retained.

The whole map preview opens the full viewport map. Its small Explore map cue sits at the bottom right, leaving the centre clear. Preview pins and gestures are disabled so ordinary page scrolling works. Provider attribution appears below the tap target and remains clickable. Phone-width previews are 170px high; wider previews are 180px.

The persistent List/Map switch is removed. A small Map shortcut appears only after the preview has passed above the viewport. Back to guide or Escape returns to the previous reading position with the category and expanded note retained. Changing a category in the full map also changes the list. If the shorter filtered list cannot accommodate the old position, the browser naturally clamps to its available height. Escape from a place dialog closes the dialog first.

Only one MapLibre map is mounted. Resizing between preview and full map updates its camera and interaction handlers. Preview framing includes the filtered recommendations rather than centring on a nearby user. The existing full-map location behaviour is retained. Loading, tile errors, unavailable WebGL and a failed map chunk leave the guide accessible. MapLibre remains a lazy chunk, but is now requested when a nonempty guide opens because its map is immediately visible. That means tile requests also start in the initial guide view.

The v0.8.6 badge fallback is retained. The new shortcut uses the same conditional 104px lane; inline attribution stays in document flow and full-map controls remain above it. This depends on observed Netlify frame markup. Actual phones and the live provider badge still need acceptance.

## Update in VS Code

Download `anyones-guide-v0.8.8-integrated.zip` to your Windows Downloads folder. Open the existing project root in VS Code, with `package.json` visible, select a PowerShell terminal, and paste this single line:

```powershell
& { $ErrorActionPreference='Stop'; if (!(Test-Path .\package.json)) { throw 'Run this from your existing project folder.' }; $agTmp=Join-Path $env:TEMP ([guid]::NewGuid().ToString()); try { Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\anyones-guide-v0.8.8-integrated.zip" -DestinationPath $agTmp; Copy-Item -Path "$agTmp\anyones-guide-v0.8.8-integrated\*" -Destination . -Recurse -Force } finally { if (Test-Path -LiteralPath $agTmp) { Remove-Item -LiteralPath $agTmp -Recurse -Force } } }
```

This merges the archive contents and updates matching source files. Your `.env.local`, Git metadata and Netlify settings are preserved because they are not included in the ZIP. Review any overlapping manual source edits. The command does not commit, push or deploy. If your Downloads folder is redirected elsewhere, replace the ZIP path with its actual location.

Dependencies and all ten migrations are unchanged. No new SQL, environment variable, auth redirect or manually created Netlify Function is needed for the reader update. Use the existing source deployment workflow when ready. The build command remains `npm run build`, with `dist` as publish directory.

## Gemini reminder

The screenshot/message importer is retained. Production needs both `GEMINI_API_KEY` and `RECOMMENDATION_IMPORT_ENABLED=true` saved in Netlify, with Functions included in scope and values set for Production. An API key only in `.env.local` does not configure the deployed function. Save both variables before the same source deploy to avoid an extra build. The function is already supplied in `netlify/functions` and the existing configuration; no manual function setup is required. Plain `npm run dev` runs only the frontend; use `npx netlify dev` for local server requests.

No live Gemini extraction or production setup has been verified here. The optional model setting and earlier setup detail remain in [the v0.8.7 reminder](UPGRADE-v0.8.7-personal-recommendations.md).

## Preserved decisions and copy

The value remains a friend's selection, notes and stars. Google Maps migration and venue photos remain paused proposals. No creation flow or first-save moment changed. Existing EN/PL dictionary entries and shared sharing/invitation copy are unchanged. Only these reader labels were added:

| English | Polish |
| --- | --- |
| Explore map | Zobacz na mapie |
| Back to guide | Wróć do przewodnika |

## Verification

163 automated tests pass with no failures or skips. Three focused cases were added for preview/full-map state, the contextual shortcut and unsupported WebGL. They use an explicit MapLibre API boundary fixture and do not claim real rendering. The existing database, import, guest, recovery and sharing tests remain. TypeScript/Vite production build passes with the known main/MapLibre chunk-size warnings.

Six local Chromium viewport/language combinations pass at 320, 390 and 768px in EN/PL using actual reader components and the actual MapLibre WebGL renderer. Raster tile requests are fulfilled with fixture images; no live provider call is claimed. Checks include layout order, attribution reachability, one canvas across expansion, category/note/scroll/focus restoration, place dialogs, contextual shortcut, simulated late badge injection/dismissal, and one-place/empty guides. A separate browser check verifies a failed map chunk leaves the guide readable and the full map closable. Final EN/PL screenshots were inspected.

Outstanding: real Android Chrome/iPhone Safari, touch scrolling and pinch/rotation, browser chrome/safe areas and keyboards, live Geoapify tiles/search, the actual Netlify badge, Gemini/OCR, deployed function routing/rate limiting, and retained live sharing/auth/recovery acceptance. Nothing was deployed, migrated or changed in an external account.

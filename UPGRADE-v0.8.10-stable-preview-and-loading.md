# v0.8.10: stable overview, coordinated reveal and street-only rows

Built on v0.8.9. Package and lockfile are 0.8.10. No deployment was performed.

## Approved changes

The main-guide map always shows all places. List category changes do not rebuild its markers or alter the camera. Full-screen map inherits the selected category and retains map filtering. Return restores the list state and the all-place preview. Real guide/viewport changes still update its overview; language changes adjust space for the translated Explore cue.

Attribution is now inside the preview at the bottom, on an ivory background with dark clickable credits. The bottom-right Explore map cue remains. Its actual translated width determines the credit space, and credit height determines camera clearance, so the links, cue and pins stay clear. The previous separate credit line and reserved space are removed. Full-map credits now sit near the bottom, above safe-area and conditional Netlify-badge clearance. The location action sits above them. Back and the noninteractive title panel are both 44px high; long titles truncate visually but retain their full accessible text/title.

Rows now show name, optional author star, exact author note and an identifiable street/house number. City, postcode, country, semantic venue subtitle and distance are absent from rows. Unknown address structures are omitted rather than guessed. Full stored addresses and detail/directions behaviour are retained. Existing addresses are parsed locally; no backfill, geocoding call, data rewrite or SQL change is performed.

The guide content is measured and rendered behind one initial loading state while the map module, first fitted frame and tiles become ready. It then reveals together. Navigation remains available. One bounded initial wait lasts at most 2.5 seconds: map errors release immediately; a stalled map/module reveals the guide with the existing readable map fallback. A late map can recover without hiding the guide again. Empty guides have no map wait. Categories, expansion, return and dialogs never restart the page loading state. Navigating to another guide starts its own initial reveal and map lifecycle, even in the same city.

First-place content waits for its chosen, eagerly requested illustration to load and decode. Failed images release the screen without the image. After the 2.5-second limit, search/import remain usable and the late illustration stays omitted to avoid layout shifts. Selection/import/recovery and Change do not restart the screen wait. The random image stays fixed during the visit. Only the chosen asset loads; the three approved English illustrations are unchanged and intentionally shared by EN and PL.

The first-place screenshot entry is now one line:

| English | Polish |
| --- | --- |
| You can also start with a screenshot | Możesz też zacząć od zrzutu ekranu |

The Google Maps/message/notes helper beneath that first-screen entry is removed. Later Add place help and the screenshot/pasted-message review capabilities remain. Existing EN/PL dictionary entries and shared copy are otherwise unchanged. Author-written text is never rewritten or translated.

## Update your existing folder

Use the small `anyones-guide-v0.8.10-patch.zip` only when your existing folder is already v0.8.9. It contains every changed and added file. It needs the three illustration assets already supplied in v0.8.9. In a VS Code PowerShell terminal opened at your existing project root:

```powershell
& { $ErrorActionPreference='Stop'; if (!(Test-Path .\package.json)) { throw 'Run this from your existing project folder.' }; $agTmp=Join-Path $env:TEMP ([guid]::NewGuid().ToString()); try { Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\anyones-guide-v0.8.10-patch.zip" -DestinationPath $agTmp; Copy-Item -Path "$agTmp\anyones-guide-v0.8.10-patch\*" -Destination . -Recurse -Force } finally { if (Test-Path -LiteralPath $agTmp) { Remove-Item -LiteralPath $agTmp -Recurse -Force } } }
```

Alternatively, use the complete `anyones-guide-v0.8.10-integrated.zip` to update an earlier source folder or start fresh. It includes all cumulative source, illustrations, tests, configuration and ten migrations. For an existing folder:

```powershell
& { $ErrorActionPreference='Stop'; if (!(Test-Path .\package.json)) { throw 'Run this from your existing project folder.' }; $agTmp=Join-Path $env:TEMP ([guid]::NewGuid().ToString()); try { Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\anyones-guide-v0.8.10-integrated.zip" -DestinationPath $agTmp; Copy-Item -Path "$agTmp\anyones-guide-v0.8.10-integrated\*" -Destination . -Recurse -Force } finally { if (Test-Path -LiteralPath $agTmp) { Remove-Item -LiteralPath $agTmp -Recurse -Force } } }
```

Both commands merge matching files and preserve `.env.local`, Git metadata and installed dependencies because they are absent from the archives. Review overlapping manual edits. Replace the Downloads path if yours is redirected. Neither command commits, pushes or deploys. Commands reviewed but not executed on Windows here. Dependencies are unchanged; an existing installation can run `npm run dev` or `npm run build`. A fresh installation needs `npm ci`.

No new SQL, environment variable, auth redirect or manually created Netlify Function is needed. All ten migrations and existing server/hosting configuration are unchanged. Screenshot/message import still needs the existing server-only `GEMINI_API_KEY` and `RECOMMENDATION_IMPORT_ENABLED=true` in Netlify, with Functions in scope for Production. These are unchanged requirements, not a newly introduced setup. See [the earlier detailed reminder](UPGRADE-v0.8.7-personal-recommendations.md).

## Verification and acceptance

166 automated tests pass, including two additional loading/fallback cases and updated preview/address/copy coverage. Production compilation passes with the known main/MapLibre chunk warnings. Actual local Chromium rendered both screens at 320/390/768px in EN/PL, including all three illustrations. All 24 screen combinations pass. Six additional delayed/failing visual scenarios pass. Source assets and services are fixtures or intercepted responses; no live provider call is claimed. See [verification](docs/verification.md).

Real Android/iOS, touch/browser chrome/safe areas/keyboards, live Geoapify search/tiles and actual Netlify badge, Gemini/OCR, deployed function/rate limits and live auth/sharing/recovery remain outstanding. No paid API, deployment, live migration or external account change occurred.

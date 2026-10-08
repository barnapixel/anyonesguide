# v0.8.9: a personal start and a compact guide

Complete cumulative source built on v0.8.8. Package and lockfile are 0.8.9. No deployment was performed.

## Two updated screens

The first-place screen keeps the existing question, then shows one of the three approved illustrated maps, the existing reassurance, direct place search and optional screenshot upload. The artwork replaces the examples paragraph. A random choice is made once per first-place visit and stays stable through typing, selection and Change, import review and language changes. English labels are used in both English and Polish, as explicitly agreed. The rest of the existing EN/PL copy is unchanged. Images are locally hosted, losslessly encoded WebP files, with reserved aspect ratios and English alt text. There is no rotation, animation, selection step, extra screen or mandatory three-place target.

The shared screen covers account owners, invited guests and local guides. It hides the illustration while a place is selected or import review is open. The optional note and explicit first Save, draft recovery, cloud/guest save handling and subsequent editor/import flows remain unchanged.

The reader uses a smaller serif title and tighter introductory spacing. The total place-count line is gone, including its empty layout space. The optional From [author] note remains directly below the title with its exact text and two-line collapsed preview. Legacy introductions and the existing Save guide action remain. The order is title, author note, compact map, categories, quieter existing starred-spots legend and category-grouped recommendations. Existing category counts and author stars remain.

The map now counts camera padding once when fitting pins. Previously persistent edge padding and fitBounds padding were added together by MapLibre, leaving only 42 usable vertical pixels in the 170px mobile preview instead of 106. All relevant pins remain included. Category changes and container resizing refit the preview. Empty, single-place and coincident-pin guides retain sensible existing camera limits. The same map expands full-screen; category, note, scroll and focus return behaviour and badge clearance remain.

Venue location lines remove only exact city/country suffixes and familiar numeric postcodes where that structure is clear. Unrecognised international formats and semantic subtitles remain unchanged. Full stored addresses remain in place details and directions. No data is rewritten.

## Update the existing folder

Download `anyones-guide-v0.8.9-integrated.zip`. In VS Code, open a PowerShell terminal in your existing project root and paste this single line:

```powershell
& { $ErrorActionPreference='Stop'; if (!(Test-Path .\package.json)) { throw 'Run this from your existing project folder.' }; $agTmp=Join-Path $env:TEMP ([guid]::NewGuid().ToString()); try { Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\anyones-guide-v0.8.9-integrated.zip" -DestinationPath $agTmp; Copy-Item -Path "$agTmp\anyones-guide-v0.8.9-integrated\*" -Destination . -Recurse -Force } finally { if (Test-Path -LiteralPath $agTmp) { Remove-Item -LiteralPath $agTmp -Recurse -Force } } }
```

This merges the complete source and updates matching files. The ZIP contains no `.env.local`, Git metadata, installed dependencies or build output, so those stay in your folder. Review overlapping manual source edits. If Downloads is redirected, replace the ZIP path. The command does not commit, push or deploy. Dependency pins are unchanged; an existing installation can run `npm run dev` or `npm run build` without reinstalling dependencies. A fresh folder needs `npm ci` first. PowerShell command reviewed; not executed on Windows here.

No new SQL, environment variable, auth redirect or manually created Netlify Function is needed. All ten migrations and hosting/server configuration are unchanged. Deploy source through your existing Netlify workflow when ready; uploading only `dist` does not install server functions.

## Gemini reminder

The optional screenshot/message importer still needs `GEMINI_API_KEY` and `RECOMMENDATION_IMPORT_ENABLED=true` in Netlify, with Functions in scope and values available for Production. Do not prefix the server key with `VITE_`. A key only in `.env.local` does not configure production. Save both variables before the same source deploy to avoid an additional deployment. The function is already supplied and configured. Use `npx netlify dev` for local server requests; plain `npm run dev` runs the frontend only. See [the earlier detailed setup](UPGRADE-v0.8.7-personal-recommendations.md).

## Verification

Verification results are recorded in [verification.md](docs/verification.md). Real Android/iOS, touch/browser chrome/safe areas/keyboards, live maps/search and the actual Netlify badge, Gemini/OCR and deployed function/auth/sharing/recovery checks remain outstanding. No live provider request, paid API, deployment, migration or account setting change was made.

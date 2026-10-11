# Anyone’s Guide v0.8.14

Requesters can select a confirmed city through the existing Geoapify destination search. The invitation carries its city, country, provider result identifier and coordinates. Typed non-empty city text must be resolved before sharing; leaving the city blank remains supported.

Recipients see the requested destination and Add your recommendations / Dodaj swoje rekomendacje. That action starts the existing first-place screen directly. An existing response instead presents Resume and retains its places, notes and coordinates. UUID and short links share the invitation's stable draft identity. Legacy invitations without structured destinations keep city selection. No automatic city lookup or guessing is performed on receipt.

The screenshot alternative is hidden on the first-place screen. The import implementation and later Add place entry remain intact. Gemini troubleshooting is deferred; this release does not fix the observed live 502.

## Install

1. Download the patch to Downloads and merge it from your existing v0.8.13 project root using the command below. It handles the archive's outer folder and preserves .env.local and Git metadata. Review any overlapping manual changes.
2. In Supabase SQL Editor, run the entire `supabase/migrations/0011_invitation_destinations.sql` file once, after migrations 0001–0010. Apply this migration BEFORE deploying the updated frontend. It is additive, retains existing invitations and the old creation function, and adds a separate destination-bearing creation function. No guide/place migration or dependency/environment change.
3. Run `npm run build`, then commit/push through your existing GitHub/Netlify workflow. `npm run dev` previews locally with your existing .env.local.

```powershell
& { $ErrorActionPreference='Stop'; if (!(Test-Path .\package.json)) { throw 'Run this from your existing project folder.' }; $agVersion=(Get-Content .\package.json -Raw | ConvertFrom-Json).version; if ($agVersion -notin @('0.8.13','0.8.14')) { throw 'This patch requires v0.8.13.' }; $agTmp=Join-Path $env:TEMP ([guid]::NewGuid().ToString()); try { Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\anyones-guide-v0.8.14-patch.zip" -DestinationPath $agTmp; Copy-Item -Path "$agTmp\anyones-guide-v0.8.14-patch\*" -Destination . -Recurse -Force } finally { if (Test-Path -LiteralPath $agTmp) { Remove-Item -LiteralPath $agTmp -Recurse -Force } } }
```

Nothing was deployed and no live migration was applied by the assistant.

## Quick acceptance on the deployed app

- Ask for recommendations: select Gdynia, Poland and share the link. Editing/clearing the selection must not share stale coordinates.
- Open that link in a private window or another device: city search is absent. Add your recommendations opens venue search for Gdynia.
- Save a place with your own note, return to the invitation and resume. The place/note must remain.
- Finish the response, sign in, create the guide link and share it back. Verify in a signed-out window.
- A request without a city, and an old invitation, still allow city selection.
- First-place creation shows no screenshot alternative in EN or PL.

## Verification

Affected React/DOM, database and service tests are run against controlled fixtures and local PGlite; live authentication, Geoapify quality and hosted migration state are not certified. The TypeScript/Vite build retains the known bundle-size warnings. SQL migration and the final frontend must be deployed together in the order above.

## Existing architecture and setup

React/TypeScript/Vite, MapLibre with Geoapify/OSM, Supabase database/auth, Netlify functions/hosting. Preserve credentials and dependency pins. Run `npm ci` for a clean installation; use Node 22.12 or later. Unlisted is the default, public discovery is opt-in, and Saved Guides are browser-local. All personal notes and EN/PL copy remain unchanged except the added invitation action. Existing detailed setup is in `docs/README-v0.8.13.md` and `docs/deployment.md`.

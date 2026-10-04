# v0.8.4 inline first-place patch

## Merge

Stop the dev server. Extract the patch ZIP and copy its project-relative files into your existing v0.8.4 project root. Merge folders and replace matching files. Keep `.env.local`, Git metadata and Netlify settings. Review replacements where you made manual source edits. Include the new FirstPlace component and firstPlaceDraft service; replacing Editor alone will not work.

The patch is cumulative over the complete v0.8.4 source, so it works whether or not you applied the smaller first-place encouragement patch. It is not a complete app ZIP. Package and lockfile remain 0.8.4. No dependencies are changed.

```sh
npm test
npm run build
npm run dev
```

Run `npm ci` first only if dependencies are missing. On a working v0.8.3/v0.8.4 database, **no SQL is required**. Do not rerun earlier migrations or the old private-schema repair. Deploy through your normal Netlify source workflow when ready.

## Short acceptance check

1. Start an account guide or an invitation response. Check the city/requester context, one broad question, examples and search field. No category should be selected; Preview/Finish and the guide note should be absent. The keyboard should stay closed until you tap.
2. Search. Results should stay below the input on this screen, with provider credits separated from it. Select a result. Its name/address, optional note and Save place appear. The heading remains, the keyboard closes, and no recommendation is added yet.
3. Write a short note, reload, and check that the selection/text return. Check Choose another place stays inline. Nothing should be sent or published by these actions.
4. Save. During saving, controls should prevent a second submission. After success, check the real row in the normal editor, inferred category, exact note and first-save confirmation. Guest confirmation says it is saved on this device. Finish/sign-in/publication remain separate.
5. Add another place, edit a note and star it. Existing autosave and category-aware additions should work as before. Reopen the draft and check its content. Removing the final place should return to a fresh first-place start without deleting the guide note.
6. On mobile, check keyboard/input/results visibility, long names/addresses and Save after entering a note. Check EN/PL. In a browser with storage blocked, guest Save must retain the task and show an error instead of claiming success.

## Recovery and save behavior

The selected-place checkpoint is independent of the guide: owner/account+guide scoped, guest-draft scoped, browser-local, bounded and ignored after seven days. It contains the search query, selected place and note, not auth credentials or a private recovery key. It is removed after a successful first save. Blocked storage retains values only during the visit and reports that limit. This is not full offline editing or synchronisation between devices.

Cloud first Save uses the existing add RPC, then the existing durable queue for an optional note. These are two existing operations, not a new atomic database endpoint. If the add succeeds but the note fails, the first-place screen stays open with the note and Retry. The persisted row is reused, the note journal survives reopening, and success is shown only once required writes finish. Existing server duplicate checks handle retries after an ambiguous response. Guest first Save requires a durable local draft write; regular guest editing retains its existing warning behavior.

114 local automated cases and TypeScript/Vite production compilation pass. The existing lazy-map chunk warning remains. The Chromium runner could not launch, so automated DOM checks are not real phone geometry or keyboard tests. No live database, auth/provider, deployment or messaging-app changes were performed.

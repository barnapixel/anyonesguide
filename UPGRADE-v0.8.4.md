# v0.8.4 full source release

## Merge and check

Extract the ZIP. Copy the **contents of `anyones-guide-v0.8.4/`** into your existing project root, merging folders and replacing matching files. Do not nest that folder inside your old app. Keep your `.env.local`, Git metadata and Netlify settings. The archive excludes secrets, dependencies, build output and caches. If you manually changed a matching source file, review that replacement first.

```sh
npm ci
npm test
npm run build
```

Use Node 22.12 or later. Dependency versions are unchanged. The tests do not require your Supabase or Geoapify keys. Development and production still use your normal environment settings.

## Database

A working v0.8.3 installation needs **no SQL update** for v0.8.4. Do not rerun earlier migrations or the private-schema repair.

If you have not applied the earlier short-link migration on v0.8.2, apply only `supabase/migrations/0010_short_invitation_links.sql` once. Projects older than v0.8.2 should apply only their missing migrations in order. See the historical [v0.8.3 instructions](UPGRADE-v0.8.3.md) for that migration, not for merging this full release.

## Deploy and check on mobile

Deploy through your existing Netlify source workflow, including `netlify/edge-functions/`, `shared/` and `public/social/`. A dist-only upload cannot update edge metadata.

1. Create a new guide. It should open the normal editor with Eat active, all categories visible, one dinner prompt, a Find a place action and a collapsed optional note. The keyboard should stay closed until you open search.
2. Find a place. Provider credits should sit below the input without overlapping it. Choose a result; it should appear in Eat, return you to the editor and receive focus. Add a note or star if you like. Preview and Share are now available.
3. Select Coffee or another empty category. Its prompt should change, with one inline action and no competing floating button. Add a place and check that its chosen category survives reopening the guide. Selecting an existing place must not duplicate it or overwrite its writing.
4. Open a fresh invitation response. Check the requester and city context, the same editor start, local draft reopening and the existing Finish/sign-in/publication flow.
5. Star a place lower in a long list. Check smooth movement/scrolling and focus; also check reduced-motion mode. Check List/Map controls sit at the same bottom position, with no site footer in map view and readable provider credits.
6. Share a fresh named or anonymous invitation and a guide in WhatsApp/Messenger. Retained short URLs, personal EN/PL copy and branded previews should work as before. Old UUID invitations must still open.

104 automated cases and the production build pass locally. Device keyboard behavior, real viewport geometry, live authentication, hosted metadata and messaging-app rendering remain deployment acceptance checks. No live database or hosting changes were made while preparing this release.

# v0.8.3 sharing patch

This archive contains only files added or changed from v0.8.2. Keep the folder paths when copying them into your existing project. It does not contain a CSS replacement, credentials, node_modules or dist. Your recent selector/footer CSS and unrelated manual edits stay in place.

## 1. Update the database

On your working v0.8.2 database, open **Supabase → SQL Editor → New query**. Paste the entire **`supabase/migrations/0010_short_invitation_links.sql`** file and run it **once**.

Do not rerun earlier migrations or the old repair. If the database has not received 0009 yet, apply that existing migration first. 0010 adds short codes to stored invitations, leaving their UUIDs and context intact. Its transaction rolls back if a step fails.

Optional read-only confirmation. All values should be true:

```sql
select
  exists (select 1 from information_schema.columns
    where table_schema='private' and table_name='guide_invitations' and column_name='short_code') as short_codes_exist,
  to_regprocedure('public.read_guide_invitation_by_code(text)') is not null as lookup_exists,
  not exists (select 1 from private.guide_invitations
    where short_code is null or short_code !~ '^[A-Za-z0-9_-]{12}$') as codes_valid;
```

## 2. Update and deploy the app

Copy the archive contents into the project root, merging folders and replacing the matching files. Preserve `.env.local`, Git metadata and any other local work. Review replacements if you edited the same sharing files manually.

Run:

```sh
npm test
npm run build
```

Deploy through your existing Netlify source workflow. Include `netlify/edge-functions/guide-preview.mjs`, `shared/share-copy.mjs` and all four `public/social/` PNGs. A dist-only upload cannot update the Edge Function. No new keys, dependencies or auth redirects are required.

## 3. Check one fresh share in each app

- Refresh the app. Make a named invitation and an anonymous one. New links end with a 12-character code rather than a UUID. No name, city, language, account UUID or recovery key is in a new invitation URL.
- Send through WhatsApp and Messenger. Check the message starts at the left edge, the URL is on its own paragraph and appears once, and the personal preview title and branded image appear. Also test copy/paste. Native cancellation must not copy or send anything.
- Open the received link. Check the right requester/city/language. Open an old UUID link too. Old and short links for one invitation must resume the same draft.
- Check a Polish invitation and an ordinary public guide share. Guide URLs retain readable handles and language hints. Private recovery links are never shared by these actions.

Some phones require a second tap after the first invitation creation if the network step consumes native-share activation. The invitation is retained, so retrying does not create another record. If a preview looks stale, test a newly created invitation first. Messaging apps cache cards independently of our no-store response; their wrapping, card layout and previews cannot be forced by site CSS.

## What changed

Native and clipboard sharing use the same complete text. The short code is a public alias for an invitation, not a private draft key. Migration 0010 is backwards compatible with older UUID readers, but an old app cannot resolve newly shared short links. Keep this app version deployed once short links have been sent.

The Edge Function now supplies metadata to all visitors on shared routes. That avoids depending on crawler user-agent names and adds a public database lookup to direct public-guide/invitation page loads. Lookups are bounded by timeouts; failures allow the normal app HTML through. Navigation inside the app is unchanged.

98 automated checks and the production build passed locally. Actual hosted headers, provider routing and WhatsApp/Messenger phone rendering remain the final deployment checks. No live database or hosting change was made by the assistant.

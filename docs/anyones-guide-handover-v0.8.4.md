# Anyone’s Guide: conversation and engineering handover

Prepared 4 October 2026. Owner: Boris. Product: https://anyones.guide/.

This is a continuation brief for a new chat, not a request to redesign the product. Read this together with the latest complete attached codebase. The attached source is authoritative for implementation; preserve these product decisions unless Boris explicitly changes them. His latest manual copy edits take precedence over older assistant wording.

## 1. Actual version and current state

The latest assistant working source is **0.8.4** in both `package.json` and `package-lock.json`. Boris sometimes calls this “v0.84”. Recent refinements are patches on 0.8.4, not releases numbered 0.8.5 or 0.8.7.

The cumulative working state includes:

1. v0.8.3 sharing and short invitation links.
2. Complete v0.8.4 and earlier mobile search attribution/star-motion/bottom-control fixes.
3. Inline first-place creation with explicit Save and recovery.
4. Editor refinements: All after first save, one-row category chips, compact expandable guide note, proper visually hidden labels.
5. Boris’s latest uploaded `i18n.tsx`, retaining his custom EN/PL copy.
6. The final three-screenshot patch: less selected-place copy, full-width place suggestions and deduplicated/ranked city suggestions.

Latest full-source archive: `anyones-guide-v0.8.4-integrated.zip`. It contains the complete project with the refinements already integrated.

The preceding changed-files archive was `anyones-guide-v0.8.4-search-refinement-patch.zip`. It contains nine changed/new files, not a complete app. It must be merged into the existing complete current project, including the prior inline-first-place and editor patches. Boris acknowledged delivery; installation, live deployment and real-device acceptance of this final patch have not been confirmed.

Older README/handover/verification documents can still say “114 tests”, “Choose another place”, or describe earlier category-led onboarding. Those descriptions are stale where they conflict with this document and the latest code. The historical category/Eat-first approach was explicitly superseded.

**Latest verified evidence:** 131 automated tests pass; TypeScript and the Vite production build pass. The existing large MapLibre chunk warning remains. Actual Geoapify responses, Android keyboard/viewport behavior and real WhatsApp/Messenger sharing were not verified in this environment. No live deployment or live database modification was performed by the assistant for the recent patches.

## 2. Product purpose and principles

Anyone’s Guide helps people collect places they personally recommend in a city and share those recommendations with friends. It also lets someone ask friends for a guide through an invitation link. The value is personal taste and useful recommendations, rather than a comprehensive travel directory.

Boris’s five principles:

- Deliver value to users.
- Keep whatever can be simple, simple.
- Clean, friendly interface. No unnecessary clutter, special effects or crude presentation.
- Follow best practices of product design.
- Follow best practices of software development.

Use a calm, warm editorial design: cream/ivory surfaces, dark green text and controls, restrained terracotta accents, serif headings/wordmark and the existing signature. Preserve the established brand rather than introducing a new visual system.

One guide covers one destination. Core categories are Eat, Coffee, Drink, See, Shop and Other. Stay was deliberately excluded as a dedicated category; accommodation/context can go in the optional guide note. Multiple author stars are allowed. One useful recommendation is enough to start.

Avoid unrequested AI generation, AI rewriting of notes, invented venues, onboarding checklists, forced category quotas, new sign-in steps, automatic sending, social feeds, inboxes, tracking or a wider feature redesign. AI guides were discussed as an idea, not approved for implementation here.

## 3. Current first-place experience: preserve this sequence

The first-place screen is an adaptive state of the existing editor route, implemented through `FirstPlace.tsx` and `Editor.tsx`. It is not a separate wizard or permanent alternative editor.

### Empty guide

Show the city, concise requester context when applicable, one broad question, a short examples sentence and inline place search. There is no category preselection and no Eat heading. Hide category chips, guide-level note, Preview and Finish at this stage. Do not open the mobile keyboard automatically on initial entry.

Current examples of Boris-approved copy:

- EN question: “What’s one place you’d recommend?”
- PL question: “Co polecisz znajomym?”
- PL examples: “Dobra kawa, ulubiony lokal albo miejsce, które warto zobaczyć.”

Searching stays on this screen. Suggestions must be below the input, with Geoapify/OpenStreetMap attribution in its own correctly spaced area. Provider credits must never overlap the input.

### Selected place

Selecting a suggestion stays on the same screen. Keep the main question visible. Hide the examples sentence after selection to reduce repetition. Show the actual selected place name/address, a compact **Change / Zmień** action beside its name, an optional personal note and the big Save button.

The short Change control retains a descriptive accessible label. It returns to inline search and focuses the input. Selecting a different result resets the old place’s unsaved note; verify the actual code before changing this behavior.

Search and selection do not add a recommendation to the guide. No automatic saving or publishing on selection. Do not restore the removed visible sentences about “one place is enough”, “unfinished selection”, or “Save this place, then keep building your guide”. During a save, screen-reader status remains available. The guest privacy explanation remains because it distinguishes saving a draft from sending it.

### Explicit Save

Save the first recommendation and its note. Prevent duplicate taps while saving. A failed or partial save retains the selected place, exact note and retry action.

After all required writes succeed, switch to the normal editor on the same editor flow. Select **All categories**, regardless of the inferred first-place category or an older category query parameter. Focus/scroll to the real saved row and show the existing first-save confirmation. Guest confirmation is truthful about being saved on this device.

A guest’s Save does not send a guide. Finish, sign-in where required and publication/sharing are separate later actions. Subsequent adding/editing uses the established editor and AddPlaces flow.

Removing the final recommendation returns to a fresh first-place screen without deleting the existing guide note.

## 4. Recovery, saving and duplicate protection

`src/services/firstPlaceDraft.ts` checkpoints the query, selection and exact note. Scope is owner/account plus guide, an independent guest draft, or a local demo guide. It validates/bounds data and has a seven-day recovery limit. Memory fallback and truthful warnings handle blocked storage. Successful saving clears only the matching checkpoint. It does not store auth credentials or a private recovery capability.

Cloud first Save uses the existing idempotent add RPC followed by the existing durable edit queue for the optional note. These are two operations, **not a new atomic first-place transaction**. If the place is created but its note fails, stay on the first-place task and retry against the same row. Success requires the relevant writes to finish. A recovered selected checkpoint can therefore coexist with a row already created in the cloud.

Guest/local first Save requires a successful durable device write. Do not claim a successful first save when storage is blocked. Ordinary subsequent guest edits retain their existing warning/memory behavior.

Protect existing recommendations from duplicate additions. The normal AddPlaces duplicate flow must preserve existing notes, category, stars and order. Do not silently overwrite an existing recommendation as a side effect of searching/selecting it again. Review recovery-specific first-save behavior separately from subsequent additions.

Standard owner edits use the durable save queue, visible saving/error states, retry and flushing before relevant navigation/sharing. Do not weaken these safeguards for a cosmetic change.

## 5. Normal editor and retained UI decisions

- After first Save, All is selected.
- Category chips occupy one row. On narrow screens they scroll horizontally with full readable labels and usable touch targets. This explicitly supersedes the earlier wrapping/no-horizontal-scroll approach.
- The guide note is initially a compact native expandable card. When empty, it encourages a short personal tip. When populated, it shows a short preview of the author’s actual note. Opening it reveals the textarea.
- Keep the note help short. EN: “What would you tell a friend before they go?” PL: “Co podpowiesz znajomym przed wyjazdem?” Placeholder examples already provide the extra guidance.
- A proper `.sr-only` utility hides accessible labels visually. Do not hide real headers or fix the historical duplicate-heading appearance with arbitrary transforms/negative margins.
- New guide and floating Add place buttons are text-only. Do not reintroduce plus icons. The main Add place text is centered.
- Drag handles align with the place title rather than floating halfway down the row.
- Author stars move recommendations to the top within their respective category in list views and are visible on map pins. The smooth repositioning/focus behavior prevents a starred row simply disappearing from a long list. Respect reduced-motion preferences.
- Stars belong to a guide entry, not a venue globally or a reader bookmark. Preserve underlying author order. Unstarring restores that order. Reordering operates within the same category/star group.
- Keep List/Map controls at the same bottom position in both views, using the existing safe-area-aware spacing. The site footer is hidden in full-screen map view. Map/provider attribution remains visible.
- Preserve the established footer behavior on short and long non-map pages and clearance around controls. The externally supplied Netlify badge can overlap mobile controls; verify real devices before claiming this is solved everywhere.
- Ask for recommendations remains an important home entry point, with restrained color emphasis. It was deliberately removed from Saved Guides.
- The error-page primary action is Go home. Do not reintroduce the redundant Try again action there. Specific failed save/search tasks can still offer contextual retry.

## 6. Latest city-search refinement

The previous service displayed every provider row, often turning multiple representations of Paris into identical “Paris / France” buttons. Boris wants a single obvious city match by default. Lesser-known namesakes should be discoverable by adding a country or region, such as “Paris, Canada”.

The current implementation in `destinationSuggestions.ts` and `placeSearch.ts`:

- Validates coordinates and ignores explicit non-city subdivisions instead of using their parent city with the wrong coordinates.
- Uses the actual name of a genuine city/town ahead of a parent municipality label.
- Normalizes accents, case, punctuation and Polish ł for matching/deduplication.
- Shows one suggestion per normalized city name. Country stays visible. Partial queries retain up to six distinct suggestions, including other useful prefix matches.
- Uses autocomplete for partial names, requesting 20 candidate rows before cleaning/deduplication.
- Uses forward city geocoding when a complete name is ambiguous across countries/regions or a qualifier needs resolution. There are also fallback resolution cases for subdivision-only results and unmatched multiword queries. The provider’s ranked order is retained for resolved matches.
- Accepts comma-separated country/region qualifiers and recognized city-plus-context queries without commas. English/Polish country labels are derived from provider country codes using Intl.DisplayNames where available.
- Does not use a Paris-specific dictionary or browser-location bias. Selection remains explicit.
- Preserves debounce, AbortController cancellation and stale-result guards. An optional ranking failure keeps usable cleaned autocomplete matches; initial search failure remains an error. The intended “most obvious city” result depends on provider coverage/ranking, so do not describe fixture tests as a worldwide guarantee.

This shared service is used by both the invitation destination picker and the account new-guide flow.

The place-result width bug was separate: global `.search-results button` had an icon/text grid with a 38px first column, but FirstPlace supplied a single text span. The scoped fix uses one full-width column only in FirstPlace. Regular AddPlaces retains its icon/text grid. Names wrap; addresses can occupy two lines.

## 7. Copy ownership and sharing

Most interface copy is in `src/i18n.tsx`. Boris supplied an updated copy file during this conversation. It is now the base, not an older assistant version. Do not overwrite his custom language during future patches.

Examples to retain unless he edits them:

- EN landing title: “Your places, ready to share.”
- EN landing body: “Your favourite café, that little bar, the spot you always recommend. Bring them together in a guide for your friends.”
- PL landing title: “Twoje miasto. Twoimi oczami.”
- PL landing body: “Gdzie na kawę, gdzie na drinka, co warto zobaczyć? Zbierz swoje ulubione miejsca w przewodniku i podziel się ze znajomymi.”
- PL first Save label: “Zapisz”.

The editor patch shortened only the two guide-note help values. The final search patch added only `first.change` in EN/PL relative to that copy base. Removed UI sentences can still have unused translation keys; do not restore their rendering just because a key exists. An old copy-update script may still exist in some folders; it is unnecessary and should not be run over Boris’s custom copy.

Copy should be natural, warm and personal, with occasional restrained emoji where already agreed. No generic AI-style paragraphs, excessive reassurance or forced playfulness. **No em dashes in system/UI copy.** Use short sentences and sensible punctuation; do not sprinkle exclamation marks everywhere. Preserve author-written names and notes exactly, including their punctuation.

Invitation headings, shared messages and preview wording use `shared/share-copy.mjs`, with its TypeScript declarations. Polish named invitation heading: **“{Name} prosi o Twoje rekomendacje”**. This avoids Polish name-ending complications. Anonymous wording is supported.

New request URLs are `/request/<12-character case-sensitive short code>`. They resolve a stored invitation and its original UUID/context. They are not account identifiers, private recovery keys or codes to use for draft authorization. Old UUID and legacy query links remain compatible. Guest drafts stay indexed by the underlying invitation UUID so either URL resumes the same draft.

Native sharing sends one combined text payload, with deliberate paragraphs and the URL once. Clipboard fallback uses the same bytes. Native cancellation does not trigger copying. Keep message formatting free of indentation. Do not promise that plain WhatsApp/Messenger text can hide a unique destination URL behind only “anyones.guide”. The platform controls wrapping and previews; short URLs and good metadata are the implemented approach.

Netlify Edge preview metadata uses public/RLS-governed data and branded static EN/PL PNGs. Preserve the Edge function, shared copy and image assets together. Private draft/recovery routes must not expose personalized public metadata. Messaging apps can cache old cards. No real-device sharing acceptance is claimed for the recent work.

## 8. Architecture and useful file map

React/TypeScript/Vite SPA with a lightweight existing router in `src/App.tsx`. Supabase provides Postgres/auth/RPCs; Google and email sign-in exist. Netlify hosts the app and preview Edge function. Geoapify supplies city/place search and map-related provider services; MapLibre renders maps. EN/PL translation state is in `src/i18n.tsx`.

| Area | Files |
| --- | --- |
| Routes, app/config | `src/App.tsx`, `src/config.ts`, `src/types.ts` |
| First recommendation | `src/components/FirstPlace.tsx`, `src/components/Editor.tsx`, `src/services/firstPlaceDraft.ts` |
| Account/guest editing | `src/components/CloudEditorPage.tsx`, `src/components/GuestResponsePage.tsx`, `src/hooks/useCloudGuideStore.ts`, `src/hooks/useGuestGuideStore.ts`, `src/hooks/useGuideStore.ts` |
| Existing editor/add flow | `src/components/Editor.tsx`, `src/components/AddPlaces.tsx`, `src/components/CategoryChips.tsx` |
| Durable cloud edits/data | `src/services/guideSaves.ts`, `src/services/guideRepository.ts`, `src/services/guestDrafts.ts` |
| City/place search | `src/services/placeSearch.ts`, `src/services/destinationSuggestions.ts`, `src/hooks/useSearch.ts`, `src/components/DestinationPicker.tsx`, `src/components/CloudCreatorHome.tsx` |
| Public reading/map/stars | `src/components/PublicGuide.tsx`, `src/components/GuideMap.tsx`, `src/components/AuthorStar.tsx`, `src/utils/guideEditing.ts` |
| Invitations/sharing | `src/services/requestRepository.ts`, `src/utils/requestLinks.ts`, `src/utils/share.ts`, `shared/share-copy.mjs` |
| Public previews | `netlify/edge-functions/guide-preview.mjs`, `public/social/`, `netlify.toml` |
| Styling and interface copy | `src/styles.css`, `src/i18n.tsx` |
| Database | `supabase/migrations/0001_initial.sql` through `0010_short_invitation_links.sql` |
| Latest regression coverage | `tests/editor-start.test.mjs`, `tests/destination-search.test.mjs`, `tests/search-layout.test.mjs`, `tests/first-place-draft.test.mjs` |

Current pins include React/ReactDOM 19.3.0, TypeScript 5.9.3, Vite 8.3.0, Supabase JS 2.117.1 and MapLibre 6.10.0. Node requires at least 22.12.0. Check the actual attached package/lockfile before changing dependencies. No dependency changes accompanied the recent patches.

## 9. Database, deployment and security boundaries

All ten existing SQL migrations are retained. The v0.8.4 first-place/editor/search patches require **no new SQL** on a working current database. Migration 0010 was introduced earlier for short invitation codes; apply it only if an older database is actually missing it.

Boris previously encountered `save_guide_edits` HTTP 400 with SQL error `3F000`, “schema private does not exist”. He applied the repair and confirmed saving works. Do not rerun that repair or earlier migrations on a working database because an old instruction mentions them.

Preserve RLS, RPC ownership checks, bounded validation, quotas, public/unlisted/draft visibility and private guest recovery semantics. Public short codes give invitation context, not private draft access. Do not expose a service-role key in frontend or preview code. VITE values are browser-visible; use only appropriate browser-safe keys there. Auth/operator/provider settings belong to the existing environment, not source patches.

Retain consent-only analytics and existing retention/account-deletion behavior. Do not claim an anonymous invitation expiry mechanism exists if it does not. Headers currently include referrer/framing/nosniff/device permissions and a **report-only** CSP, not a fully enforced CSP.

Local maps/search can be unavailable because of missing keys or provider origin restrictions. A local demo working does not certify production search/auth. Dist-only deployment does not update Netlify Edge metadata. Preserve `.env.local`, Git metadata, Netlify settings and manual source edits when merging. Do not ask for secrets or bundle them in deliverables.

No deployment, production migration, external message, account change or Git force push is authorized by this handover. Do local, reversible implementation work within subsequent requests; ask separately before genuinely irreversible or external actions when necessary.

## 10. Delivery and collaboration style

Boris wants thoughtful product judgment and careful completion, rather than plans that never turn into code. For an approved task, carry it through implementation, appropriate tests/build and a concrete deliverable. Avoid repeated permission questions for already authorized ordinary work.

- Read the actual current files before giving edit instructions or naming selectors. Do not invent paths or diagnose an unseen screenshot as fact.
- Explain outcomes, rationale and meaningful limitations briefly. Make clear what was tested locally versus on the live site/phone.
- Keep patches focused. Return only required changed/new files with project-relative paths when requested. For a full release request, provide the complete cumulative source instead of a patch mislabeled as a full app.
- Include new imports’ dependencies in the patch. Preserve package/lockfile consistency and existing migrations.
- Prefer fixing layout causes to piling on overrides. The current stylesheet already has layered historical rules, so review the cascade and verify effects on related screens.
- Preserve accessibility, usable touch targets, keyboard/focus behavior, reduced motion and EN/PL consistency.
- Meaningful tests should cover user behavior and failure/recovery paths, not merely copy the implementation. Run the relevant checks and production build. Avoid claiming unsupported browser geometry.
- Do not bump the version or introduce features without agreeing the scope.
- Boris often works in VS Code’s integrated terminal and wants a direct command that merges ZIP contents into the existing folder. VS Code is the terminal host, not a special ZIP-aware semantic merge tool. Choose the command for his actual shell/OS. Extraction replaces matching files while preserving unrelated files; it does not automatically resolve overlapping manual code edits. Do not prescribe force pushing as a default merge strategy.
- Keep communication concise, warm and candid. Avoid em dashes and canned AI phrasing.

## 11. Remaining checks and next step

There is no additional feature implementation approved at this handover point. First establish that the attached complete code includes the latest patches and Boris’s manual edits. Flag any material mismatch before proposing further changes.

Focused live/manual checks for the final patch:

1. City search: Paris appears once with the intended France match; Paris Canada / Paris, Ontario finds the Canadian namesake. Check Gdansk, New York, prefix searches and Polish country qualifiers.
2. Android/iOS: long place names and addresses fill the result row sensibly; provider attribution does not overlap; keyboard/input/results and Save stay reachable.
3. Selected first place: compact Change, no redundant save-help sentence, question retained, optional note editable. Save must be explicit.
4. After saving: normal editor, All selected, saved row visible/focused and exact note preserved. Check retries/blocked storage without inventing a success state.
5. Existing stars, category chips/note expansion, map/footer controls and share previews still behave as intended.

Read the latest upgrade note for the exact final patch scope. The code/source may have changed manually after this handover; treat attached newer edits as evidence rather than overwriting them with this historical snapshot.

## 12. Suggested opening instruction for the new chat

We’re continuing Anyone’s Guide. I’ve attached the handover and my latest complete codebase. Read the handover and the codebase in full, including source, tests, migrations and configuration, before proposing changes. Generated build files and dependencies do not need to be read. Confirm the actual version, identify any material discrepancies between the code and handover, and briefly summarize the current state. Preserve the agreed product decisions, my latest EN/PL copy and our working style. Do not revert to the earlier Eat-led onboarding or introduce new features. Distinguish verified local tests from live/mobile checks. Then wait for my next task. For approved changes, implement carefully and return the requested full source or focused patch, with appropriate validation.

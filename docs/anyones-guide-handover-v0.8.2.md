# Anyone’s Guide. Starter prompt and project handover

Prepared 2 October 2026. Latest packaged source: **v0.8.2**. This document preserves prior decisions and release history; section 14 describes the current release; sections 12 and 13 record v0.8 and v0.8.1.

**How to use:** Attach the latest codebase to the new chat, then paste everything below the horizontal rule. You can also attach this document and ask the assistant to read it in full. The attached source may include my subsequent manual changes; inspect it before editing.

---

We are continuing development of **Anyone’s Guide**, a mobile-first web app for personal city recommendations. Please read the attached codebase and this handover before making changes. Use the actual source for implementation details, this memo for agreed product intent, and my latest instructions to resolve changes in direction. Flag material discrepancies instead of silently undoing a decision. The latest packaged version is **v0.8.2**, built on the delivered v0.8.1 source and preserving the two specified manual UI changes. The user confirmed cloud saving works after repairing missing v0.7 database infrastructure. This release requires only additive migration 0009 on that working database. Do not rerun previous migrations or the repair. Other edits in the user’s local Git folder or remote repository were not available for comparison; the Git remote was supplied as https://github.com/barnapixel/anyonesguide.git, but its current contents and deployed version were not verified.

## 1. What we are building and why

The original use case is: “I know a city well. Friends keep asking for recommendations. I want to maintain one good personal guide and send one link whenever someone asks.”

We have now added the reverse use case: “I want someone’s recommendations. I send them an invitation to make me a guide.” The recipient should be able to do the useful work first and create an account only when ready to share it.

The product should feel like a thoughtfully organised note from someone whose taste you trust. Its value is the author’s personal selection and commentary, convenient sharing, and reuse. Keep that purpose clear when considering features.

One guide has one destination, one author, and a collection of places. A place has one primary category and an optional personal note. POI search supplies venue/location information; the author supplies the reason to go.

We are preparing a closed beta and learning from real use. Direct sharing remains the core behaviour. Explore is a small supporting discovery surface, grouped by city, with guides whose authors explicitly choose Public visibility.

Avoid adding scope casually: ratings/reviews, followers, comments, rankings, itinerary scheduling, bookings, mandatory photos, uploaded covers, automated translation, monetisation, and account-synced/offline saved guides are deferred. The request feature is another way to start a personal exchange, not a reason to build a social network or messaging system.

## 2. Agreed product behaviour

- **Categories:** Eat, Coffee, Drink, See, Shop, plus Other as an escape hatch. **Do not introduce Stay.** I explicitly rejected it as a category. Historical Stay data is retained where needed to avoid losing existing recommendations.
- **Guide note:** An optional freeform introduction can cover where to stay, how long to visit, what to do, or similar advice. Do not turn it into mandatory structured sections. Empty notes must not render.
- **Public presentation of that note:** A compact box above the places, headed “From [author]”, with a short excerpt. It is collapsed by default and expands inline. This was chosen over a separate screen so readers immediately reach the place list.
- **Place notes:** Short excerpts in the public list; full text in the place detail sheet. The whole place row is tappable. The editing counter around 200 characters is writing guidance, not a new hard 200-character limit.
- **Reading:** Public/Unlisted guides can be opened without an account. Saving a guide anonymously stores a shortcut in that browser/device; reopening it loads the live guide. It is not an offline snapshot or account sync.
- **Visibility:** Draft is owner-only; Unlisted is link-accessible and absent from Explore; Public is link-accessible and eligible for Explore. Unlisted is the default sharing state. Public discovery is opt-in.
- **Identity:** Google OAuth and email magic links, no password flow. New authors choose a public display name. Handles are generated from non-personal words/numbers and can be edited; never derive public handles from an email address. Preserve existing handle/alias behaviour.
- **Languages:** English and Polish interface text. Never automatically translate the author’s writing. Both languages should have equally polished layouts.
- **Location:** Ask for permission only after the user taps Locate. Distances are straight-line; no automatic proximity ordering or invented walking times. Google Maps handoff uses the venue’s name and address, with coordinates as a fallback.

Home now has four entry actions: **Your Guides, Saved Guides, Public Guides, Ask for recommendations**. An older memo’s “exactly three actions” decision predates the request feature.

## 3. Design direction and mobile lessons

Our chosen direction is **Warm Editorial**: a warm ivory canvas, dark green-black text, restrained terracotta accents, generous but disciplined spacing, and an edited personal-notebook feel.

Use serif typography for the brand, guide titles, venue names and editorial reading; sans serif for controls, addresses and functional labels. Follow the actual CSS tokens rather than copying approximate colours from an older discussion.

The brand is a left-aligned, two-line “Anyone’s / Guide” wordmark with a small terracotta wave beneath it. Keep the wave sparse. Public guides use clean rows and light dividers rather than heavy cards or repeated category icons. Guide cards use automatically generated destination tiles, without creating photo-upload work for authors.

Category selectors must fill the available width and distribute evenly in **both EN and PL**, including the editor, public list and preview/map surfaces. Avoid normal horizontal scrolling. Very narrow screens may wrap sensibly. Changing language must feel smooth: controls such as Edit and Your Guides should not jump because their labels change length. Mobile icon controls need accessible labels.

The user often checks changes on real phones and sends screenshots. These are valuable evidence, especially for browser chrome, safe areas and the Netlify widget. Inspect an available screenshot; if it cannot be opened, say so and do not describe it as though you saw it.

### Settled map appearance

We brainstormed emoji symbols, then moved to the current **round terracotta badges with white SVG line icons** for clearer, consistent contrast across iOS, Android and desktop:

| Category | Symbol | Reason/decision |
| --- | --- | --- |
| Eat | Utensils | Quickly recognisable at phone size |
| Coffee | Cup | Clear coffee/café cue |
| Drink | Beer | My explicit choice |
| See | Landmark | Covers museums and places of interest |
| Shop | Cart | Preferred shopping alternative |
| Other / legacy categories | Neutral dot | Avoid inventing another primary category |

Do not revert to ivory emoji pins as if that were the latest decision. We experimented with darker map tiles, including a manual brightness adjustment to 0.7, then lightened the base with the terracotta/white badges. The current packaged map uses `raster-brightness-max: 0.78`; inspect my attached file because I sometimes adjust styling manually.

Keep the map legible and restrained. Preserve marker anchoring, camera/framing behaviour, user-initiated location and the proven MapLibre worker setup.

### Settled footer behaviour. please do not repeat earlier mistakes

We spent several iterations correcting this. The footer should have the same natural relationship to the page on Home, Your Guides, Saved Guides, editor, preview and other relevant screens.

- On a short page, the page stretches to at least the viewport height, placing the footer a little above the bottom.
- On a long page, the footer follows the content at the document bottom, with the same bottom padding. It must not float over the content while scrolling.
- The agreed implementation uses a shared footer outside route Suspense, a flex-column root with `min-height: 100dvh`, and growing page content. Its bottom margin is 24px plus the safe-area inset.
- Earlier screen-height measurement/fixed-versus-flow switching caused jumps. A globally fixed footer floated over long pages and sat too high. Those approaches were rejected.
- Footer links are **Explore, Feedback, Privacy, Beta terms**. Do not scatter Explore/Feedback elsewhere as loose links above blank space.
- New Guide belongs in normal page flow above the footer. Editor Add place remains accessible without being covered by the hosting badge.

Fullscreen map needs its own layout treatment: hide the underlying list masthead/hero from layout, keep the map canvas fullscreen, and preserve the footer arrangement. The contributor/attribution field is a **full-width bottom band**. The List/Map selector is horizontally centred **close above it**, with Locate above the lower controls.

The free Netlify “Powered by Netlify” widget has covered important controls on phones and appears in different corners across devices. Keep primary controls clear of it, reserving lower space around attribution. Provider attribution must remain available. Check the actual device result rather than assuming a desktop offset solves it.

## 4. Sharing and link previews

Shared guides should send a short friendly message and identify author and destination clearly, for example **“Boris’s Guide to Warsaw”**, rather than presenting only an opaque URL.

Native sharing is used where supported; clipboard fallback includes the friendly message and URL. Cancelling native sharing should not unexpectedly copy something.

Per-guide and per-request messaging-app previews are implemented through a Netlify Edge Function. Client-only metadata changes are insufficient for many crawlers. Preserve server-rendered, safely escaped preview text, public visibility rules, and separation from private recovery links. Preview services may cache old cards.

## 5. Latest feature: asking someone for a guide (v0.6.9)

The intended invitation wording is along the lines of **“Share your recommendations with [name] via Anyone’s Guide.”** Copy should sound personal and inviting, in EN and PL.

The implementation now follows this flow:

1. The asker opens **Ask for recommendations**, enters their name and optionally a city, and shares an invitation. No account is mandatory for the asker. A signed-in name can be prefilled.
2. The recipient opens a personalised invitation, chooses a city, and starts adding recommendations immediately.
3. The recipient can add/reorder places, write place and guide notes, and preview List/Map while signed out. This is a separate local guest draft, not a replacement for an existing demo or account guide. Reopening the invitation in the same browser offers to resume it.
4. **Finish** is available once there is at least one recommendation. Before Google/email sign-in, the app saves a private recovery snapshot to Supabase. A random recovery key allows the magic link to restore the draft even if email opens in another browser/device.
5. A new user completes the existing public-name/handle onboarding. An already signed-in recipient does not need another login.
6. **Create share link** atomically creates a complete **Unlisted** guide under that author’s account, preserving destination, notes, categories and ordering. It must not overwrite an existing guide for the same city. Retries return the same result instead of creating duplicates.
7. **Send to [name]** opens sharing or copies a friendly response with the public guide link. The author sends it through their existing conversation.

There is **no automatic email/message delivery, requester inbox, invitation-account matching or new in-app messaging system**. Invitations are stateless links containing name, optional city and language; the name is personalisation, not verified identity. Do not silently expand this scope.

Recovery links are private capabilities and must never appear in the public response or social preview. Unclaimed snapshots expire after seven days. After claim, the snapshot payload is cleared; a small account-linked receipt prevents late retries from duplicating or recreating a deleted guide. Account deletion removes receipts. Local drafts persist in the browser until cleared/published. Read the code and migration for exact ownership/access rules.

## 6. Technical orientation and safeguards (baseline plus refinement below)

The app uses **React + TypeScript + Vite**, **Supabase Postgres/Auth/RLS**, **Geoapify search/raster tiles**, **MapLibre GL JS**, **Lucide icons**, and **Netlify**. Node 22.12+ is required. Keep the dependency lockfile and avoid unrelated upgrades or architectural rewrites.

Important areas:

| Area | Main files |
| --- | --- |
| Routes and shared footer mounting | `src/App.tsx` |
| Visual layout and final CSS cascade | `src/styles.css` |
| English/Polish UI | `src/i18n.tsx` |
| List, editing, adding places and map | Components under `src/components/`, especially `PublicGuide`, `Editor`, `AddPlaces`, `GuideMap` |
| Request creation/invitation/guest/finish | `AskForGuide`, `RequestInvitation`, `DestinationPicker`, `GuestResponsePage`, `FinishRequestPage` |
| Guest persistence and handoff | `useGuestGuideStore`, `guestDrafts`, `requestRepository`, `requestLinks` |
| Account auth | `src/hooks/useAuth.tsx` and safe auth-return URL handling |
| Cloud guides, search, saved shortcuts, consent analytics | `src/services/` |
| Map worker preparation | `scripts/prepare-maplibre-worker.mjs` |
| Social preview response | `netlify/edge-functions/guide-preview.mjs` |
| Database changes | `supabase/migrations/` |

Some CSS accumulated through patches. Trace the **final cascade** before editing; do not pile on another contradictory override without understanding what currently wins.

The map broke in earlier v0.6.1/v0.6.2 worker experiments. The user confirmed the v0.6.3 fix worked: predev/prebuild copy the matching MapLibre **worker and sibling shared module** into `public/vendor/maplibre/`; the app sets that same-origin worker URL before map construction. Preserve this arrangement and verify the build contains both files.

Preserve anonymous read access to Unlisted/Public guides and owner-only write access. UI hiding is not a substitute for RLS. Real provider failures must not masquerade as successful demo search results. Flush pending note saves before leaving/sharing where required.

Keep `.env.local` and existing Git metadata when replacing source. Frontend variables are browser-safe only: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy anon-key naming is supported), and `VITE_GEOAPIFY_API_KEY`. **Never put a Supabase service-role key in the frontend.** Do not invent credentials, Git remotes or deployment access.

### Historical v0.6.9 rollout prerequisites

The historical v0.7 baseline runs from `0001` through `0007`; current v0.8 adds `0008`. Apply only unapplied migrations in order. Do not rerun the initial schema or private-identity migration as a normal upgrade.

For an existing v0.6.8 database, the new migration is **`supabase/migrations/0006_guide_requests.sql`**, after `0005_guide_note_categories.sql` has already been applied. It adds the private guest-draft handoff table and key-protected save/read/claim RPCs. Direct browser access to the table is revoked; claiming also requires authentication and a completed profile. Server ownership comes from the authenticated user, not client-provided ownership.

The v0.6.9 deployment instructions in README include:

- Keep the existing Supabase `/creator` auth redirect and add the deployed `/finish-request**` redirect, e.g. `https://anyones.guide/finish-request**`, plus development/preview equivalents where needed. Magic-link templates must honour the requested redirect.
- Schedule `select public.purge_expired_guest_guides();` daily in Supabase Cron or run it during beta maintenance. Expiry already denies access; physical cleanup scheduling is separate.
- Deploy the source through the existing Netlify build workflow so the Edge Function is deployed too. Uploading only `dist/` omits it.
- Existing browser-safe Supabase variables must be available to the preview function as well as the build. No new environment variable is required for v0.6.9.

These are rollout requirements, **not confirmed external actions**. Do not say a migration, cleanup job or auth configuration has been applied without evidence.

## 7. Privacy, terms and measurement

Simple EN/PL Privacy and Beta terms pages exist, linked quietly in the shared footer. They were drafted as a first pass for the closed beta, not treated as legal sign-off. The request feature added explanations of guest drafts and sign-in recovery.

Before broader rollout, check that the actual operator/privacy contact, provider regions and retention/deletion details are completed accurately. Do not invent legal/entity details or present generic draft wording as a completed policy.

Lightweight usage analytics are **off until the visitor opts in through Privacy**. They use a random session identifier; browser roles cannot read the analytics table. Preserve consent behaviour. Saved guides remain device/browser-local. Do not introduce invasive tracking or treat small beta samples as proof of demand.

The earlier soft-launch thinking was a small warm cohort of roughly 10–20 creators, genuine guides across a few cities, and more independent feedback from friends-of-friends. Observe actual creation, sharing, recipient use and reuse. The new request flow also lets us test whether people ask for tips and whether recipients finish a guide. Broader promotion comes after usable supply and reliable mobile flows; no fabricated guides, community spam or premature monetisation.

## 8. Historical v0.6.9 evidence and remaining uncertainty

Previous baseline package: **`anyones-guide-v0.6.9.zip`**. That later historical package was **`anyones-guide-v0.7.1.zip`**; current checks and limits are recorded in section 13 and docs/verification.md. It includes the request feature, updated legal copy, new migration and README rollout instructions, while retaining the v0.6.8 footer behaviour.

The v0.6.9 production build passed and **21 automated unit tests were executed and passed**. Coverage includes invitation/link handling, safe auth redirects, local draft persistence/recovery and preview escaping. This is not proof of live SQL/Auth integration or real-phone layout.

The following were **not verified end to end in the implementation session**: live application of migration 0006, deployed RLS/RPC behaviour, Google/magic-link completion, cross-browser recovery against Supabase, and latest phone/browser rendering. The app has been used at `anyones.guide`, but the exact latest production version and Git remote are not established here.

Priority live QA when rolling out v0.6.9:

- Invitation with/without a city, names containing accents/apostrophes, both languages and messaging-app cards.
- Signed-out drafting, refresh/resume, notes/order preservation, List/Map preview, and storage/error handling.
- Google sign-in, magic link in the same and a different browser, new-profile onboarding, cancelled sign-in and recovery failure.
- Atomic creation/retry, same-city existing guide preservation, another account trying a claimed recovery link, and expired snapshots.
- Friendly public response sharing with no recovery key leakage; deep-link refresh on Netlify.
- Real mobile controls, EN/PL stability, full-width filters/credits, footer position on short and long pages, and the Netlify badge.

Use `npm ci`, `npm test`, and `npm run build` as the normal local verification commands. Choose additional tests that exercise meaningful risk. Report what actually ran and what remains a manual/live check.

## 9. How I want us to work

Please be a thoughtful product-and-engineering partner. Think through behaviour and edge cases, preserve the personal-guide purpose, and make sensible routine choices without repeated permission requests once I have authorised the work.

When I ask for implementation, complete it and return usable files. Do not stop at advice or an offer to proceed. Work in coherent batches and version the deliverable. If I ask for a small replacement, return the changed files or the exact line with its filename and replacement instructions. If I ask for a full release, package the complete source ZIP with concise upgrade instructions. I often copy changes into my local setup and deploy them myself.

When I explicitly say “suggest in chat first, then we’ll implement”, respect that discussion step. Otherwise, resolve routine reversible implementation choices yourself. Challenge unnecessary scope or a conflicting requirement clearly, without reopening settled decisions on every task.

Listen closely to mobile QA and exact layout requirements. I care about small inconsistencies: language-switch jumps, selectors not filling the screen, obscured controls, and footers that change position across routes. Fix the shared cause across relevant screens instead of patching only the screenshot’s route.

Preserve working code and user data. Avoid broad rewrites, unrelated dependency changes, destructive migrations and regressions in map/auth/sharing. Explain new SQL plainly: what it changes, why it is needed, and which migration I should actually run.

Keep communication concise and practical. Give brief progress updates for substantial work. Final delivery should state what changed, provide the files, identify relevant rollout steps, and distinguish verified checks from pending ones. Do not claim deployment or phone testing that did not happen. My attached code can contain manual edits newer than a previous package; compare before replacing.

**Start by inspecting the attachments and giving a brief grounded status: actual version, any material differences from this memo, and what matters for my next instruction. Continue from the existing product; do not redesign it or implement deferred ideas just because they appear in this handover.**


## 10. Historical v0.7.0 refinement

This is the approved no-new-feature refinement, rebuilt from the reattached v0.6.9 source after the earlier workspace was lost. The version in package metadata/lockfile is 0.7.0. Existing production dependency versions and migrations 0001–0006 are preserved. New development-only PGlite 0.5.8 and jsdom 26.1.0 support meaningful database/component checks.

Cloud editing now uses `src/services/guideSaves.ts`: a serial queue per account/guide, revision-aware acknowledgements and a synchronous browser journal of pending guide-note/place-note/category/order/removal edits. `useCloudGuideStore` applies recovered pending edits before retrying, keeps optimistic content on failure and offers Retry. Editor/AddPlaces and root navigation flush all relevant edits before leaving or sharing. Inactive journals for an unavailable guide remain recoverable without trapping unrelated navigation. Storage failure warns the author to keep the page open; unload delivery is not the persistence mechanism. Saved Guides remain unrelated browser shortcuts. Concurrent devices/tabs still use last successful write; no collaboration/offline feature was added.

`guideEditing` provides shared same-category ordering and append-on-category-move helpers while cloud/guest/demo persistence stays separate. `useSearch` debounces and ignores aborted/stale responses and distinguishes search failure from no matches. Duplicate create/add/share operations are guarded. Route parsing handles malformed encoding; route errors retain the shared footer. Auth startup rejection and guide/provider failures have friendly localised states. Heading focus avoids active typing.

Native `AccessibleDialog` is used for PlaceSheet and optional profile settings; mandatory onboarding remains a page. The sheet has a labelled bounded title, scrollable full note and reachable close/Maps actions, focus handling and cancellation/restoration. Existing Finish is explicit and follows the one-place rule in editor/preview. EN/PL labels, status/error copy, distance suffix formatting, Google Maps coordinate fallback, reduced motion, small-control targets/contrast and long-text/narrow-header reflow were refined. Home balances four existing actions in two columns at wider widths and one on phones. Targeted CSS consolidation removes superseded declarations only. Established map icons/brightness/worker/camera and footer-flow rules remain the baseline; current rendered layout needs QA.

Guest recovery validates complete local shapes and UTF-8/jsonb snapshot budget before OAuth, retaining oversized drafts for editing. Recovered keys are cleared from the URL only after durable local storage. Local draft remains until claim and resulting cloud read succeed. Manual response sending, atomic retry receipt, Unlisted default and same-city preservation stay unchanged.

### Additive migration 0007. actual upgrade

Apply **only `supabase/migrations/0007_refinement.sql` after confirming 0006**, with a backup and preflight. The new migration redacts incomplete public identities without mass-wiping legacy names/links/aliases, preserves approved identities, keeps future OAuth suggestions in private auth metadata, explicitly restricts helper/maintenance RPC grants, checks atomic owner-only mutation batches, scopes new browser-supplied POIs to a guide and bounds successful writes/payloads/guest storage. Existing legacy place references remain intact. Guide visibility is the remaining direct update grant; new edits/additions use RPCs. Ordinary guide creation requires completed onboarding.

Read `docs/deployment.md` for NOT VALID constraint preflight, exact quotas, Data API header/compute limitations, aggregate 50MB/1,000 active-snapshot cap, cleanup and coordinated frontend rollout. Old open editor tabs use revoked direct write paths, so finish/save before rollout and refresh afterward. Frontend-only rollback is not adequate after the migration. Do not claim this migration was applied live.

Netlify source configuration adds no-referrer/type/framing/device protections, private-route no-store/noindex and a staged report-only CSP. Preview identity uses the redacted alias-aware RPC. Hosted headers/logs/cron require checks. Optional verified privacy operator/contact variables replace drafting instructions with actual facts when supplied; Feedback remains the fallback. Provider regions/retention/legal basis remain unverified, and beta text is not legal sign-off.

### Evidence for this recovered source

The suite has 47 passing individual cases: 21 retained original cases, 11 save/helper regressions, 10 actual PostgreSQL migration/role cases and 5 React DOM interaction cases. TypeScript/Vite production build and production-only dependency advisory checks passed. Migration preservation, pinned production dependencies, dictionary parity and packaged matching map modules are checked.

**Do not reuse earlier rendered-screen evidence as evidence for this release.** Current Chromium 153 could not launch (SIGTRAP before opening a page), so no current rendered viewport checks completed. jsdom component checks verify DOM behavior with dialog-method/rectangle fixtures; they do not verify geometry, native inertness or real-phone keyboards. See `docs/verification.md` for exact methods and limits.

Still required before inviting testers: real browser/phone EN/PL layout and keyboard/reflow checks, Netlify badge/safe areas, real tiles/Locate/attribution, live Google/email auth and cross-browser recovery, production Supabase/PostgREST permissions/quotas, actual hosted headers/logging/cleanup, and verified privacy operational facts. No external deployment or configuration action was performed.

Deliverables are the complete source ZIP, this handover, README, CHANGELOG and deployment/verification documents inside the source. Preserve the working style and all product decisions above when continuing.


## 11. v0.7.1 screenshot-driven UI patch

The user requested a text-only New guide button and centred text-only floating Add place, consistent email-field alignment, drag glyph alignment with the place title, a lightly colour-coded Ask for recommendations action, a local Saved Guides check, and only Home on full-page errors. All five attached crops were opened and inspected.

The patch removes the two plus glyphs; simplifies sign-in to a plain full-width email input; keeps the drag handle’s 40px hit area while aligning its glyph with the first title line; gives the existing Home request action a light terracotta tint/darker text; and uses `PageError` for full-page load, crash and missing-draft errors. Its only exit is Home. Inline Retry for pending saves, search/form errors and recoverable work remains. No new feature or changed product decision is introduced.

The actual `/saved` route opens with cloud credentials absent and supports removing a local shortcut. Saved Guides is independent of authentication, but localhost and the live domain have separate browser-origin lists. Opening a cloud guide requires the matching Supabase configuration/network; this patch adds no sync/offline behavior.

Version metadata is 0.7.1. All 51 individual tests and the TypeScript/Vite build pass; four new React DOM cases cover navigation, email submission, EN/PL Home-only errors and actual local Saved Guides. Dependencies and all seven migration files are unchanged from 0.7.0. No new migration/environment variable is required. If 0007 is already applied, do not run it again; deploy the matching source through Netlify, preserving `.env.local` and Git metadata.

Current browser rendering, physical-phone layout, live Supabase/auth and hosted behavior remain unverified. Prior screenshot-driven corrections and DOM checks do not establish final viewport geometry. No deployment was performed. Use `docs/verification.md` and `docs/deployment.md` for limits and acceptance checks.


## 12. v0.8.0 feature release

The user approved three improvements: fast first-guide creation with unobtrusive help, author stars for especially recommended places, and natural personal sharing. System-authored copy must avoid em dashes. Use full stops or another natural sentence break. Never rewrite user-authored notes to enforce this style.

### Creation

Successful city creation in CloudCreatorHome goes directly to `/edit/{id}/add?start=1`. A new invitation draft goes to `/respond/{id}/add?start=1`. Existing guides and resumed drafts open their normal editor. The query enables short contextual guidance on the AddPlaces screen, rather than an onboarding wizard. The first instruction asks for a place you would recommend to a friend. After one place, authors can preview and open the guide or finish the guest response; notes and stars are optional. Guidance fades after the first few places. Account exits wait for pending saves. No checklist, minimum category count or mandatory note is introduced.

### Author recommendations

`Place.isStarred` is an optional boolean at the compatibility boundary. Cloud rows use `guide_places.is_starred`, default false. A star describes this author’s recommendation in this guide. It is separate from reader Saved Guides and does not modify the underlying venue. Multiple stars per category are allowed; one is a useful habit rather than an enforced limit.

Authors toggle stars beside place titles in the editor or recent-add card. The editor keeps focus on the same button after its row moves. Readers see starred places first in each category, a small filled star beside the name, one quiet legend where relevant and the same description in the place sheet. Map badges retain their category glyph and center anchoring, with a small star badge and an accessible label. Star toggles do not reframe the camera.

`orderCategoryPlaces` presents starred entries first and preserves author sort order within both groups. Toggling does not modify stored order; removing a star restores that underlying position. Drag and keyboard Move up/down remain within a category and priority group, without silently toggling stars. Category changes retain stars and append in the destination category’s underlying order. Shared helpers keep cloud, guest and demo ordering consistent.

Cloud stars use the existing journalled save queue, merge with note/category edits, survive failed/in-flight saves and retry on reopen. Guest stars survive local reopen, key-protected snapshot recovery and atomic publication. Legacy flags may be absent and default false; malformed supplied flags are rejected.

### Personal links and copy

`shared/share-copy.mjs` and its declaration file provide browser and Netlify Edge wording. EN keeps the established author/city Guide title; PL uses a natural city/author sentence. Owner messages say this is my guide; reader messages pass along the author’s guide. Invitation/response messages are short and personal in both languages. Public preview descriptions may use author-written guide-note/legacy-intro excerpts, safely escaped by the Edge Function. No AI-generated place notes, automatic rewriting or translation is added.

Public guide share URLs retain their handles and paths and add `?lang=en` or `?lang=pl`. The receiving interface uses this initial hint and still permits later language changes. Old URLs and profile aliases remain valid. Crawler previews honor the same hint. Private guest recovery URLs remain excluded. Native share cancellation and manual sending remain unchanged.

### Preserved manual UI fixes

The final `.drag-handle` rule has `padding-top: 3px` and keeps its 40px hit area. Ask for recommendations remains prominent on Home and is removed from both cloud and demo Your guides screens. Text-only New guide/Add place, plain aligned email input and Home-only full-page errors remain intact.

### Upgrade and current evidence

Version metadata is 0.8.0. From a database already on 0007, apply only `supabase/migrations/0008_author_stars.sql` once, before deploying the new frontend. It adds the guide-entry flag and extends owner saves, guest validation and claim. Earlier migrations are byte-for-byte unchanged. Old v0.7.1 save payloads omit the flag and preserve it. Keep local credentials/Git metadata and deploy source through Netlify with the shared copy module and Edge Function. No new dependencies or environment variables are required. No live migration/deployment was performed.

68 automated cases pass, including 17 additions for stars, persistence/security, guided creation, actual React interactions and Polish escaped previews. Crawler substitutions use callbacks so dollar replacement sequences in authored text remain literal. TypeScript/Vite build passes. The production-only npm advisory check reports zero known vulnerabilities at execution time. All eight migrations run in the disposable PostgreSQL fixture and preserve historical guide/link content.

The cloud browser could not reach the local app (`ERR_BLOCKED_BY_CLIENT`). No current rendered viewport pass is claimed. DOM tests establish behavior, not phone geometry, WebGL marker positions or native dialog inertness. Physical-phone EN/PL layout, live Google/email recovery, hosted Supabase/PostgREST, real map tiles, Netlify badges/headers/crawler execution and cleanup remain acceptance checks. See README and deployment/verification documents for exact instructions.

Continue within the agreed scope. Avoid adding imports, AI generation, reader shortlists, social feeds, ratings, photos, itinerary planning, messaging, offline storage or account sync without a new product decision. Product value should come from an author quickly making a useful personal guide and sharing it with someone they know.


## 13. Historical v0.8.1 copy patch (requested as v0.81)

The user found the author-star explanation too dry and asked for restrained emoji plus a review of user-facing copy. Preserve the Warm Editorial UI. Personality comes from ordinary, useful language and a couple of small decorations. No animations, confetti, new features, AI-written venue notes or automatic rewriting are introduced.

The screenshot text is `star.legend` in `src/i18n.tsx`. EN now says “Starred spots? The author’s top picks!”; PL says “Gwiazdki? To najmocniejsze polecenia autora!”. PublicGuide renders a small decorative fire emoji next to it. The completed, shareable invitation-guide heading has a sparkle. Reopened Draft guides have a neutral heading and do not get that decoration. Both decorations have `aria-hidden="true"`; the text carries the meaning. The existing SVG stars beside places and category map glyphs remain unchanged.

Seventy EN/PL interface strings were refined across Home, guided creation, invitations, empty states, note prompts, search, sign-in and feedback. Existing concise action labels, recoverable error messages, privacy explanations and author identity remain clear. Owner sharing and invitation sharing use warmer text in `shared/share-copy.mjs`, which also supplies crawler wording. Reader sharing already had friendly copy and is retained. Polish messages avoid gendered first-person verbs and forced inflection of user names/cities. No system-authored em dashes. Authored text, including its punctuation, is never rewritten.

The recent-add helper no longer says “Saved automatically” while a save may still be pending. It suggests an optional note and the next search. Actual Saving/Saved/error status continues to come from the existing indicator.

### Database continuity

After v0.8 delivery, the user reported a `save_guide_edits` 400 error: schema `private` did not exist. Checks showed missing private schema and scoped-place column but an existing star column. The database had received 0008 without 0007. A guarded atomic repair supplied the v0.7 infrastructure and restored the v0.8 functions without adding the star column again. The repair was checked in a disposable PostgreSQL fixture that reproduced the failure and verified preservation, owner saves, access denial and guest claims. The user applied it, reported true/true/true checks, then confirmed saving works.

This is user-reported live confirmation, not an assistant-run live provider acceptance test. **The working database needs no SQL for v0.8.1. Do not rerun the repair or migrations.** Fresh/older installations still need only their missing migrations in order, including 0007 before 0008. All eight migration files in this patch are byte-for-byte unchanged from v0.8.0. No new variables or dependency changes.

### Verification and delivery

Package and lockfile version are 0.8.1. The 68 existing automated cases and TypeScript/Vite build pass against this source. The existing reader-picks interaction case checks the new decorative emoji’s accessibility treatment. Translation keys, placeholders and references, system-copy punctuation, unchanged migrations/dependency pins, matching map assets and archive contents are checked. See docs/verification.md for results and limits.

The available browser could not reach the local app in the earlier session; no current rendered viewport or phone pass is claimed. Test current EN/PL wrapping and mobile text before broader beta rollout. Source is packaged in `anyones-guide-v0.8.1.zip` with this handover, README, CHANGELOG, deployment notes, verification notes and the complete application. Preserve `.env.local` and Git metadata when replacing source. Deploy through the existing Netlify source workflow so shared crawler copy is included. No external deployment is performed here.


## 14. Current release. v0.8.2 stored invitations

The user approved independent stored invitation IDs, account association kept internal, name snapshots, optional anonymous requests, draft separation and legacy-link compatibility. Polish copy must use “{Name} prosi o Twoje rekomendacje”, anonymous “Podziel się swoimi rekomendacjami”, and optional city “Kierunek: {city}”. This avoids inflecting user-entered names/cities. Implementation uses the delivered v0.8.1 source; any user’s later manual copy edits outside the supplied source were unavailable. Do not overwrite reattached manual edits blindly in future work.

New public links are `/request/<server-generated UUID>`. They contain no name/city/language, account UUID, creation key or private recovery key. The stored locale sets initial UI language; later toggles remain available. Query fields cannot replace stored identity/context. Browser form preview, invitation heading, shared title and crawler preview use the same wording in `shared/share-copy.mjs`. The destination label and form/status/anonymous-completion copy live in `src/i18n.tsx`.

Migration `0009_stored_invitations.sql` adds `private.guide_invitations` (RLS enabled; no direct browser listing/writes) and two explicitly granted RPCs. Creation derives account identity from `auth.uid()` and snapshots only approved public profile names; incomplete OAuth/profile names remain hidden. Guests may supply a self-declared name or leave it empty. Read-by-ID returns only id/name/city/locale. Separate random creation retry keys stay in the current form session and are never shared. Account deletion cascades associated invitation records. Anonymous records have no automatic expiry in this release; lifetime storage/retention must be monitored before increasing scale.

Creation uses the existing rate helper: 10 successful creations/source/minute, 120 globally/minute. Forwarded-header identification is best-effort with a shared anonymous fallback, and requires live PostgREST verification. Failed transactions roll back counters. Sequential same-key retries return the original immutable record without another row; the current form reuses its cached record after preview, sharing or cancellation. Changed name/city/locale/account context and a new page visit start a distinct invitation. Async account changes discard stale share responses. Native cancellation does not copy. The new async creation step can affect browser activation: a denied share/copy attempt retains the record for an explicit retry; real-phone acceptance is still required.

New guest drafts carry optional invitationId/requesterAnonymous fields and index by invitation ID. Identical name/city records stay separate, including anonymous invitations and language changes. Legacy query links and drafts retain their historical name/city index and old snapshot compatibility. One invitation supports multiple independent responses; publication never consumes it. Public invitation IDs cannot restore/claim private drafts. Seven-day keyed recovery, stars/notes, atomic publication, receipts and manual response sharing remain. Anonymous completion copy survives recovery and publication without a fake recipient name. There is no inbox, notification, response-tracking or automatic sending feature.

The privacy page was updated factually for stored invitation context/account association and optional names, dated 2 October 2026. Existing legal/operator/provider facts remain unverified; no new compliance claim is made.

### Upgrade and evidence

On the user’s previously repaired working v0.8 database, run **only migration 0009 once before deploying v0.8.2**. Never rerun 0001–0008 or the repair as part of this release. All eight earlier migration files, dependencies and CSS are byte-for-byte unchanged from v0.8.1. No new environment variables or auth redirects. Preserve `.env.local` and Git metadata; deploy complete source through the existing Netlify workflow so shared crawler modules are included.

All 87 automated cases and the TypeScript/Vite production build pass. Nineteen new cases cover actual PostgreSQL invitation permissions, identity/snapshot/retry rules, quotas, independent publications, draft separation, actual React form/invitation/recovery/publication flows, account changes and crawler behavior. Static checks verify EN/PL keys/placeholders/references, system-copy punctuation, version, preserved migration/dependency/CSS bytes, map assets and archive contents. See docs/verification.md and docs/deployment.md for exact methods, read-only migration confirmation and acceptance checks.

No live migration, deployment, real-phone rendering, provider authentication or hosted crawler acceptance was performed by the assistant. Previous user-confirmed cloud saving remains evidence for the repaired v0.8 baseline, not live verification of 0009. The complete deliverable is `anyones-guide-v0.8.2.zip`, containing this handover, README, CHANGELOG, deployment/verification notes and all application source/migrations/tests.

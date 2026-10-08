# v0.8.9. A personal first place and a compact reader

- Replace first-place examples with one of three approved illustrations, stable for the visit. Use English graphics in EN and PL. Keep the existing question, reassurance, direct search and optional import.
- Reduce the reader title and introductory whitespace; remove the total place-count line while retaining Save guide, author notes, category counts and stars.
- Correct double-counted map padding so the preview fits its pins usefully, including category changes and resizing. Preserve one-map expansion and return state.
- Condense only reliable address suffixes in venue rows and retain complete stored addresses in details and directions.
- 164 automated tests and production build pass. No dependency, SQL, environment, server or hosting change. No deployment.

# v0.8.8. Inline guide map

- Place the optional author note below the title, then an inline map, categories and recommendations.
- Expand the same map full-screen and restore category, expanded note, position and focus on return. Keep a contextual Map shortcut and readable failure fallback.
- 163 automated tests and production build passed; six simulated EN/PL browser layouts and map-chunk failure passed. Live/mobile checks remained outstanding.

# v0.8.7. Personal recommendations first

- Show exact author notes directly beneath venue names, ahead of location details, in list cards and list/map place details.
- Show up to two lines of the collapsed From [author] introduction; preserve full text on expansion and omit empty notes.
- Leave first-save flow and latest EN/PL copy unchanged. No new photos, provider integration, dependencies, SQL or hosting configuration.
- 160 existing automated tests and production build pass. Six local Chromium EN/PL layouts at 320/390/768 px pass with fixture data. Real phone and live Gemini/provider/hosting checks remain outstanding.
- Include current Gemini/Netlify setup reminder. No live deployment.

# v0.8.4. Integrated editor and search refinements

- Integrate all prior v0.8.4 patches and the latest user-supplied EN/PL copy into one complete source archive.
- Select All after first Save. Keep category chips in one row and the optional guide note compact and expandable, with shorter help copy.
- Replace the selected-place change prompt with Change / Zmień beside the name. Hide examples after selection and remove the redundant sentence below Save while preserving the main question and save/privacy semantics.
- Fix text-only first-place suggestions using a scoped full-width grid. Normal AddPlaces icon rows remain unchanged.
- Validate and deduplicate city suggestions. Resolve complete ambiguous names and geographic qualifiers through the existing provider, preserving prefix search, cancellation and graceful ranking fallback.
- 131 tests and the TypeScript/Vite production build pass. No dependency, SQL or environment-variable changes. Live provider/mobile/messaging checks remain outstanding.

Earlier entries below document historical steps; the latest entry supersedes conflicting earlier onboarding descriptions.

# v0.8.4 inline first-place patch

- Replace the empty guide’s categories, repeated encouragement and disabled completion actions with one question, concrete examples and inline search in EN/PL.
- Keep search and selection on the same route. Show a selected-place card, optional note, Choose another place and one explicit Save place action.
- Save only after the author presses Save. Infer a supported category through the existing store behavior. Then show the regular editor with the real row focused and a truthful cloud/device confirmation.
- Recover unfinished selections and exact author text using bounded, scoped device checkpoints with a seven-day recovery limit. Clear the checkpoint after success. Report blocked storage and do not claim a durable guest save after failure.
- Preserve original guide-level writing, retry failed/partial cloud saves without duplicating a place, guard repeated taps and retain the latest note across reopening. Existing editor autosave and guest Finish/publication stay unchanged.
- 114 automated cases and production build pass. No new SQL, dependency, auth redirect or hosting change. Local Chromium launch failed; actual phone keyboard/layout acceptance remains.

# v0.8.4. Start in your guide

- New owner guides and invitation responses open the existing editor, with all categories visible and Eat selected for an empty guide.
- Give each empty category one friendly EN/PL prompt and Find a place action. Keep the blank guide-level note collapsed and remove the competing floating add action in empty categories.
- Preserve the chosen category during search. Save the added place before returning to its real editor row, with focus and optional notes/stars. Existing duplicates retain their original category and writing.
- Retain guest context, local draft recovery, cloud save retries, legacy categories and direct Add places routes. Preview and Share/Finish require one place.
- Include both earlier small patches: smoother star movement with reduced-motion support, and positive spacing for place-search attribution. Keep bottom controls, map footer behavior and sharing refinements.
- Isolate DOM search tests from local API settings and use bounded result waits. Add six owner/guest/editor flow checks in EN/PL.
- 104 automated cases and production build pass. No new migrations, dependency changes, environment settings or deployment. Real mobile layout and hosted sharing still require device acceptance.

# v0.8.3. Cleaner sharing

- Send one plain-text payload, with deliberate paragraphs and one link, through native sharing and clipboard. Keep native cancellation behavior.
- Shorten new invitation links with server-generated 12-character codes. Preserve UUID links, query invitations, retry keys, approved names, anonymous context, quotas and original draft identities.
- Add migration 0010: backfill existing records, enforce format/uniqueness, retry code collisions and expose a public-by-link lookup without revealing account IDs or private keys.
- Add EN/PL branded 1200×630 PNG cards. Render public preview metadata in initial HTML for all visitors rather than relying on crawler user-agent detection. Keep draft/private-route exclusion, escaping and public-key RLS lookups.
- Preserve the approved bottom-controls CSS patch. The change-only archive does not replace CSS or other unrelated manual edits.
- 98 automated cases pass. Production build passes. No live migration/deployment or real-device messenger acceptance performed.

# v0.8.2. Stored invitations

- Give new invitations independent server-generated UUIDs and `/request/<id>` links. Keep owner UUIDs, names, city, locale, creation retry keys and recovery keys out of the public URL.
- Store minimal context in a private RLS-enabled table with no browser listing/direct writes. Add bounded creation and ID-only read RPCs; identity comes from the authenticated session.
- Snapshot approved account names and support optional anonymous guest names. Reuse unchanged-form links after retries, preview and share cancellation; discard stale account-change responses.
- Use the agreed Polish named/anonymous headings and uninflected destination label from shared EN/PL copy.
- Resume new guest drafts by invitation ID; preserve legacy name/city indexes and old invitation URLs. Retain anonymous context through sign-in and publication. Keep public invitation and private recovery capabilities separate.
- Use the same record for browser and Netlify crawler previews, with escaped text, canonical links and no query-field override.
- Migration 0009 is additive; all earlier migration bytes, dependencies, CSS, map/drag/footer fixes and guide behavior remain unchanged.
- Update privacy wording to reflect stored invitation records. No automatic expiry, notifications, inbox or deployment.
- 87 automated cases and production build pass. Real-phone sharing/rendering, live PostgREST/auth and hosted previews remain acceptance checks.

# v0.8.1. Warmer copy

- Refine 70 interface strings across EN/PL, keeping useful instructions and the author’s voice.
- Add a decorative fire emoji to the author-picks explanation and a sparkle to a completed, shareable invitation guide. Meaning stays in text; emoji are hidden from assistive technology.
- Warm owner share messages, invitation messages and invitation crawler descriptions using the existing shared module. Preserve note excerpts, escaping, aliases and language hints.
- Replace the recent-add “Saved automatically” sentence with optional-note/next-place guidance. The existing save indicator remains responsible for reporting actual save status.
- Keep the reopened Draft heading neutral and align the Polish privacy page’s Explore label with navigation.
- Preserve the first-guide flow, star ordering, map icons, layout, manual UI fixes and all database migrations. No em dashes in system copy; author-written text is untouched.
- Version package and lockfile as 0.8.1. No new features, dependencies, environment variables or SQL.
- Run the existing 68-case suite and production build; see docs/verification.md for release results and limits.

# v0.8.0. First guides and author picks

- New account guides and invitation responses open guided place search directly. Brief guidance, optional notes and Preview/Open guide/Finish actions help authors share a small useful guide.
- Authors can star multiple recommendations. Stars sort first within each category, appear beside names and on the existing map pins, and remain separate from reader Saved Guides.
- Underlying author order survives toggles. Reordering stays within a category and star group; category moves keep the star.
- Additive migration 0008 extends owner saves and atomic guest publication. Existing guides and old guest snapshots remain unstarred; old migration files are unchanged.
- Crawler HTML substitutions keep dollar replacement sequences in authored text literal while escaping markup.
- EN/PL sharing is personal, owner-aware and shared with crawler metadata. Guide links retain aliases and carry a language hint. Author-written notes are untouched. System copy avoids em dashes.
- Carry forward the requested 3px drag-handle adjustment and removal of Ask for recommendations from Your guides.
- 68 automated cases and TypeScript/Vite build pass. Browser/phone rendering, live auth and hosting still require acceptance checks.
- No dependency upgrades, new environment variables or live migration/deployment.

# v0.7.1. UI patch

- New guide and floating Add place use centred text without plus icons.
- Email sign-in uses a plain full-width field, with consistent inset and visible focus.
- Drag glyph aligns with the first place-title line; the 40px tap area remains.
- Ask for recommendations has a light terracotta background and darker label.
- Full-page load/crash/missing-draft errors offer only Home; inline save/recovery retries remain.
- Actual Saved Guides route is checked without cloud credentials, including removing a shortcut. Saved lists remain browser/origin-local.
- 51 automated cases pass, including four new interaction regressions; TypeScript/Vite build passes. Current browser/phone/live-auth QA remains outstanding.
- No migration, environment variable, production dependency change, new feature or external deployment.

# v0.7.0. refinement

- Serial, recoverable cloud saves; all pending edits flush before leaving or sharing, with truthful status and Retry.
- Atomic ordering/category/note/removal batches; deterministic category moves and shared editing helpers.
- Additive migration 0007 protects unapproved names and callable permissions, scopes new POIs and bounds writes/storage while preserving historical data.
- Native labelled dialogs with focus entry/loop/restoration and reachable controls for long notes.
- Visible guest Finish action and consistent one-place requirement.
- EN/PL status, error and accessibility copy; locale distance formatting, Maps coordinate fallback, stale-search and duplicate-action guards.
- Narrow-header/long-text reflow, balanced Home grid, improved control targets/contrast and reduced motion. Original map/footer behavior remains the design baseline.
- Targeted CSS consolidation, route/auth failure containment, recovery-key/header policy and factual privacy configuration.
- 47 automated cases and a passing production build. Current visual/browser QA remains outstanding because the renderer could not launch. No new product features or external deployment.

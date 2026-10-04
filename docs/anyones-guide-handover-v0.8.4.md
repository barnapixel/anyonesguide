# Anyone’s Guide v0.8.4 current handover

Actual package and lockfile version: **0.8.4**. Current source includes the full v0.8.4 release, first-place encouragement patch and latest inline-first-place patch. The latest patch overrides earlier category-led empty-guide decisions. Read v0.8.3/v0.8.2 handovers for retained architecture/sharing behavior, and [the current upgrade](../UPGRADE-v0.8.4-inline-first-place.md) for delivery scope.

## Current first-place experience

Use the existing editor route with an adaptive first-place state. Empty owner guides and guest responses show the city, compact requester context when applicable, one broad question, three memory cues and inline search. Hide category chips, Eat headings, Preview/Finish and guide-level notes. No automatic keyboard activation.

Selecting a result stays on the same screen and shows its real name/address, Choose another place, an optional note and Save place. Selection does not add it to the guide. Save is the commitment. On success the editor shows the real saved row, focuses/scrolls to it and gives a first-save confirmation. Stars, categories, the optional guide-level note and subsequent adding/editing are available there. Guest confirmation is device-local; Finish/publication is separate. Removing all places returns to the first-place state while retaining existing guide writing.

Keep the warm editorial design and natural EN/PL copy, no em dashes in system text, no fake venue records, forced checklist, extra sign-in, automatic sending or rewritten author notes. One recommendation is sufficient.

## Implementation and recovery

`src/components/FirstPlace.tsx` handles inline search/selection/manual saving; `Editor.tsx` keeps this state active through failed or partial saves. All actual owner, guest and demo callers provide `onSaveFirstPlace`. The normal AddPlaces flow remains for subsequent and historical direct additions.

`src/services/firstPlaceDraft.ts` checkpoints query/selection/exact note in local storage, with in-memory fallback and truthful warnings. Keys are scoped to owner/account+guide, one independent guest draft, or local demo guide. Data is validated/bounded, malformed coordinates/providers/text are rejected, recovery has a seven-day limit, and success clears only that scope. No auth credentials/private recovery capability is stored in this checkpoint. A selected checkpoint can recover an incomplete cloud first save even if the row was already created. Blocked storage does not falsely claim persistence.

Cloud first Save uses the existing idempotent add RPC and durable note queue, with required flushing before showing success. The two writes are not one new atomic transaction. Partial failures retain the first-place task and latest note; retries reuse the row. Guest/local demo first Save requires a successful device write. Existing ordinary guest edits keep their memory fallback and storage warnings. All backend migrations/RLS/quotas and dependency pins remain unchanged.

After the first addition, category-aware search, duplicate protection, standard autosave, stars and drag ordering remain. The prior star-motion/search-credit patches, same-bottom List/Map controls, hidden map site footer, provider attribution, personal sharing, short links and static PNGs are preserved.

## Evidence and deliverable

114 automated cases pass. Ten added cases cover actual owner/guest explicit first saves, recovery, slow/repeated taps, partial note failures/latest writing, blocked guest storage, inline replacement, removing the final row, and fresh-module checkpoint bytes/scope/validation/cleanup. Earlier editor cases are adjusted for the intended new first-screen behavior. TypeScript/Vite production build passes with the existing lazy MapLibre warning. Dependencies were reused. Earlier SQL, sharing modules/assets and star-motion source are compared with the v0.8.4 baseline.

No live database, deployment, auth/provider or phone share was performed. Two local Chromium launch attempts failed in this environment; do not claim actual browser geometry/keyboard verification. The upgrade includes a focused mobile acceptance check.

Deliverable: `anyones-guide-v0.8.4-inline-first-place-patch.zip`, containing project-relative changed/new source, tests and current documentation. Merge the entire patch into an existing complete v0.8.4 project. It is cumulative over the smaller encouragement patch and excludes secrets, Git metadata, dependencies, build output and unchanged SQL/assets. No SQL upgrade is needed on working v0.8.3/v0.8.4.

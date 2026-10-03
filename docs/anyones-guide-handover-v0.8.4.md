# Anyone’s Guide v0.8.4 handover

Actual package and lockfile version: **0.8.4**. This is a complete source archive, built from the v0.8.3 sharing release plus its star-motion and search-spacing patches. Read [v0.8.3](anyones-guide-handover-v0.8.3.md) and [v0.8.2](anyones-guide-handover-v0.8.2.md) for retained architecture and earlier decisions. This document overrides their first-guide behavior and patch-only delivery instructions.

## Product decisions

Use one editor that adapts to content. New owner guides and invitation responses open there, not in a blank search screen. All existing categories are shown, with Eat initially selected when empty. Show one real category heading and one prompt card. Eat asks where you would take your friends for dinner. Other categories have their own questions. Find a place is the clear primary action. One good recommendation is enough to start.

Blank guide-level notes start collapsed. Existing authored notes open with their content intact. Keep notes and stars optional, no forced checklist, no fake recommendation records, no extra onboarding or sign-in requirements. Hide the floating Add place action when the active category has no places. Disable Preview and Share/Finish until one place exists. Keep the guest requester and destination context visible.

Keep the warm cream/green/terracotta design, familiar serif headings, simple controls and friendly EN/PL copy. System copy contains no em dashes. Never rewrite author notes or names. Preserve agreed Polish invitation headings and all existing sharing/privacy decisions.

## Implementation

`CategoryChips.showEmpty` is enabled only in the editor. Reader category navigation is unchanged. Editor chips wrap naturally on small screens. Prompts are `creation.prompt*`, `creation.findPlace` and `creation.startEnough` in `src/i18n.tsx`; `src/utils/category.ts` chooses validated categories and safe prompt keys, including legacy Stay/custom categories.

Editor search uses `?return=guide&category=<id>`. All three stores accept an optional validated category for `addSearchResult`; explicit author intent wins over provider inference. Existing duplicates return their original row/category without rewriting notes, stars or order. Successful search saves and returns to the editor with `category` and `added` hints, then focuses and scrolls to the actual title. These query fields are navigation hints, not capabilities or data records.

Cloud add failure keeps search open. Pending note edits flush before navigation and retain the existing Retry behavior. Guest storage warnings and local recovery remain truthful. Older direct Add places routes keep their recent-card behavior. No new SQL, API endpoint, dependency, auth redirect or environment variable is introduced.

The supplied AuthorStar component includes the previously delivered smooth star movement: preserve focus, scroll an offscreen moved row into view, animate short visible movement and briefly highlight the row. Respect reduced motion and cancel outstanding animations. Search attribution uses a positive `8px 2px 14px` margin and wrapping, removing the former negative-margin overlap.

Bottom controls remain 16px above the safe area in both list and map, with the site footer hidden on the map and provider credits visible. v0.8.3 short links, original UUID draft identities, plain-text sharing paragraphs and four static branded PNGs remain. The unchanged image asset names retain their v083 suffix deliberately.

## Evidence and delivery

104 automated cases pass, including six new actual owner/guest/editor flow tests with remote services replaced at their boundaries. DOM tests disable local env-file loading, and the bundled-search test uses fixed demo configuration plus a bounded result wait. This removes reliance on local API keys; it is not a claim about the precise cause of the previously reported Windows failure, whose full error was not supplied.

TypeScript/Vite production build passes. Disposable PGlite tests execute existing migration, permission, star, invitation and short-code behavior. Dependencies were reused from the prior verified workspace. No new advisory scan, live provider/auth check, deployment or real-phone geometry test is claimed. See [verification](verification.md) for limits.

Deliverable: `anyones-guide-v0.8.4.zip`, containing the full project under one matching folder, including source, tests, public assets, Netlify files, shared modules, ten unchanged migrations, lockfile and documentation. It excludes credentials, Git metadata, node_modules, dist, logs and build caches. On a working v0.8.3 database, no SQL is needed. Merge folder contents into the existing project, retaining local environment and Git settings. See [upgrade](../UPGRADE-v0.8.4.md).

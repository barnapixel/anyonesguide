# Anyone’s Guide v0.8.3 handover

Continue from [the full v0.8.2 handover](anyones-guide-handover-v0.8.2.md), treating this document as the current override. Version is **0.8.3** in package and lockfile. The release is a sharing refinement, not a general product redesign.

## Decisions preserved

Keep the app useful, simple, friendly and uncluttered. Preserve the Warm Editorial palette/serif wordmark/signature. System copy avoids em dashes; author-written notes and names are not rewritten. Preserve agreed Polish `{Name} prosi o Twoje rekomendacje` and anonymous `Podziel się swoimi rekomendacjami` headings. No automatic sending, new inbox, tracking or AI copy generation.

The latest user-authorized CSS patch puts the List/Map selector 16px above the bottom safe area in both views, hides the site footer in map view, leaves provider attribution above the selector, and gives the list footer clearance. This CSS is in the working source but excluded from this change-only sharing archive. Preserve the user's installed CSS and unrelated manual edits.

## New sharing behavior

`src/utils/share.ts` sends a single `{text: message}` native payload. The same message goes to clipboard/fallback textarea, with a blank line before its only URL. Native cancellation never copies. Shared EN/PL request copy in `shared/share-copy.mjs` uses intentional sentence/paragraph breaks and a named signature. Anonymous requests omit it. Owner/reader/response guide messages and readable guide aliases/language hints remain.

New invitation URLs use `/request/<12-character code>`, rather than the proposed `/r/` namespace, keeping the existing reserved route and avoiding any profile-handle collision. Migration 0010 adds random URL-safe, unique, case-sensitive short codes to all records. Server generation uses 72 random bits; unique collisions retry. A code resolves to the original UUID and snapshot. UUID and query links continue working. Drafts still index by the UUID, so opening either URL resumes one draft. The code is public invitation context, never a recovery or creation key. RPC permissions, approved account naming, optional anonymous guests, rate limits and deletion/retention behavior remain.

Netlify preview metadata is now served to every user agent on matching public routes rather than a crawler regex. Metadata includes the same personal text, a localized same-origin raster image, alt/dimensions/locale and a large-image card hint. The four small PNGs reuse the existing brand; the person/destination remain in the card text, not image URLs or an external renderer. The `/` homepage also receives branded metadata. Public guide data remains governed by anonymous RLS visibility. Private/draft/recovery paths receive no personalized preview. Normal app HTML passes through on lookup failure. This adds public lookup latency to direct shared-page requests; app navigation is unchanged.

## Upgrade, evidence and limits

On a working v0.8.2 database, apply **only 0010 once**, then deploy complete source including Edge/shared modules/PNG assets. No dependencies, env variables, auth redirects or changes to earlier migration bytes. Older clients tolerate additive RPC result fields; an older app cannot resolve new short URLs, so keep the code-aware app deployed once links are sent.

98 automated cases and the production build pass. New tests cover actual migration/backfill/permissions/collisions, actual request service, actual React draft continuity, unified share bytes and edge metadata. Images were visually inspected. See [verification](verification.md), [deployment](deployment.md) and [short upgrade steps](../UPGRADE-v0.8.3.md).

No live database/deployment or real-device WhatsApp/Messenger acceptance was performed. These apps decide wrapping and card layout and may cache old previews. A fresh invitation/device share is the final acceptance check. Keep the existing async-creation retry/cancellation guards and do not present fixture tests as real phone tests.

Deliverable: `anyones-guide-v0.8.3-sharing-patch.zip`. It contains only new/changed files with project-relative paths and upgrade notes. It is not a standalone complete app archive; merge into v0.8.2.

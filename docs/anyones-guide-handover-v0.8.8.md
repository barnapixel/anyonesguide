# Anyone’s Guide handover, 7 October 2026, v0.8.8

Continue from the complete cumulative v0.8.8 source built on v0.8.7. Package and lockfile are 0.8.8. See [the current upgrade](../UPGRADE-v0.8.8-inline-guide-map.md) and [verification](verification.md). No deployment occurred.

## Current implementation

PublicGuide orders title, exact optional author note, compact inline map, categories and list. The two-line note preview and venue-note hierarchy from v0.8.7 remain. A bottom-right Explore map cue makes the entire preview tappable. The preview has no map gestures or selectable pins. Attribution is clickable below it. MapLibre stays lazy but loads on initial nonempty-guide reading.

The same MapLibre instance changes between preview and full viewport map. The old persistent List/Map selector is gone. Back to guide or Escape restores scroll position, category, note expansion and focus. A Map shortcut appears only when the preview has gone above the viewport. Place-dialog Escape closes the dialog first. A changed category carries back into the list. Shorter lists naturally clamp unavailable old scroll positions. Empty guides omit the map. Loading, WebGL, tile and chunk failures preserve readable content.

The new shortcut and existing full-map controls honour conditional public-badge clearance. Provider credits are outside the preview tap target. No Netlify account setting was changed.

Only PublicGuide.tsx, GuideMap.tsx, reader CSS and two new i18n label pairs changed in application source. Dependencies, configuration, server handlers, shared copy, all ten migrations, first-save/editor, import, stars and sharing data are unchanged. Tests add one MapLibre boundary fixture and three focused interaction cases.

## Product and working decisions

The core value is sharing a friend's favourite spots, with their selection, exact words and optional stars. Google migration is paused after Boris challenged its cost, clutter and value. Photos are proposals, not an accepted implementation. Keep screenshot/message import optional alongside direct search. Do not add obligatory onboarding, extra creation screens, a first-save animation or a completion target. Preserve the explicitly unchanged first-save moment.

Boris added a Google key locally and discussed production variables in Netlify. Do not assume that Gemini is live or verified. Production needs the two existing server variables, saved before one source deploy; no manually created function. See the upgrade reminder.

Preserve existing English/Polish copy and author-written text. Only Explore map / Zobacz na mapie and Back to guide / Wróć do przewodnika are new in this release. Avoid em dashes in new system copy. Keep clean editorial design and optional inputs. Think through product value before integration work. Reuse existing test coverage and add only meaningful interaction/data cases. Distinguish verified evidence from outstanding live/mobile work. Deliver cumulative source and concrete update instructions. Do not deploy or change external settings without authorisation.

## Evidence and remaining work

163 automated cases pass. Production compilation passes with the known chunk warnings. Real MapLibre rendered in local Chromium with intercepted fixture tiles across six EN/PL layouts at 320/390/768px. State restoration, controls/attribution, simulated badge clearance, empty/one-place guides and nested dialog behaviour passed. A failed map-chunk check passed. Final screenshots were inspected. These are simulated desktop-browser viewports, not devices or a live map provider.

Real phone/touch/browser-chrome acceptance, actual provider badge/tiles/search, Gemini/OCR and production function/rate limits, and retained auth/sharing/recovery live checks remain outstanding. No paid API call, deployment, live migration or external account mutation occurred.

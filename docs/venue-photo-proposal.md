# Venue photos: proposal, 5 October 2026

Research only. No provider integration, image rendering, paid account, API call, schema change or deployment has been added. v0.8.6 contains the city/badge fixes plus all of v0.8.5’s screenshot import.

## Suggested experience

After an author confirms a real place and saves it, try to enrich it in the background with one correctly matched, licensed venue photo. Use the same behaviour for manual additions, screenshot/text imports, owners, invited guests and later additions. Existing guides should be eligible too. Saving and recovery must never depend on image lookup succeeding.

Keep a compact photo beside the venue name and author’s note, with a larger single image inside the place detail sheet. Preserve the editorial text hierarchy and existing controls. Images should not imply that the author took the photo. Credits should be readable and inline, never another floating badge. The author can hide a wrong/unhelpful photo and report a mismatch. No gallery, ratings, new sign-in step or photo-choice onboarding is needed.

Without a verified photo, retain the existing clean text row. Do not show generic coffee/restaurant stock imagery as if it depicts that venue, generate a venue image, or substitute a nearby business. One openly licensed city cover could separately add warmth to mostly photo-free guides, but should be visibly city imagery and is not a substitute for venue coverage.

## Source comparison

| Source | Why consider it | Practical limits |
| --- | --- | --- |
| Foursquare Places API | Current dedicated place-photo endpoint, with venue matching by name and location. Candidate for commercial cafés, bars and restaurants. | Coverage/freshness in our cities is unmeasured. Paid Premium photo calls, branded source attribution, and account-specific caching requirements. Existing Geoapify IDs do not automatically identify a Foursquare venue. |
| Existing Geoapify plus Wikimedia Commons | Geoapify details expose Wikidata/Wikipedia/Commons references and image URLs. Can follow a verified Commons file and its licensing metadata without a second commercial venue database. | An image URL does not establish reuse rights. Expect better suitability for landmarks, museums and notable buildings than ordinary cafés; that is an inference, not measured coverage. Each file needs matching/licence/author checks. Many are Creative Commons, not public domain. |
| Google Places Photos (New) | Established photo service with resizing and required author attributions returned by the API. | Direct Places API content has restrictions with non-Google maps, which matters for our MapLibre guide/map experience. Google Maps/source credits, non-caching/expiring photo names and metered calls add complexity. It is not a public-domain image source. |

Foursquare’s published Premium photo rate is $18.75 per 1,000 calls in the first volume band. Default-field venue searches/details are Pro, with 500 free calls and $15 per 1,000 in the next band. These are API-call prices, not a complete cost per guide or per image view. Repeated resolution, matching and image access must be accounted for. Legacy V3 endpoints are deprecated; use the current Places API.

The current public Foursquare self-service EULA requires Powered by Foursquare attribution on screens/pages containing its data and delegates caching limits to usage guidelines. The current guideline pages retrieved during research contained no substantive limits. Confirm the account’s current image/reference caching, attribution and permitted resizing/cropping rules before designing storage or committing to rollout. Do not assume the open-source POI dataset makes the photos open-licensed. Do not borrow Personalization API caching rules for Places API.

For Wikimedia, verify the exact file’s author, licence and source page. Store/display the necessary credits and licence link, and honour applicable adaptation requirements. If Boris wants strictly public-domain-only photos, that is a narrower source pool than accepting suitable Creative Commons licences.

Google’s standard Service Specific Terms permit Places API content without a map but prohibit it in conjunction with a non-Google map. Places UI Kit has a separate exception, but its predefined provider UI is a different product route that would need a design and terms review. Applicable EEA billing terms also differ. Do not treat keeping photos only in the list as automatically resolving the map restriction.

## Recommended next task

Run a deliberately small Foursquare-versus-Geoapify/Commons coverage pilot on 20–30 representative existing recommendations in London, Warsaw and Katowice, including independent cafés, bars, restaurants, shops and landmarks. This is the best next evidence to collect, rather than adding several provider fallbacks immediately.

For each, record correct branch match, actual photo availability, whether the photo depicts the venue, approximate freshness if available, source/licence/credit requirements, latency and billable request count. Reject name-only matches. Check street/address and coordinates; chains need an exact branch. A confident venue match alone does not prove the first returned photo is suitable.

Choose a source only if the pilot supplies useful, trustworthy photos for the kinds of places our guides actually contain. A wrong photo is worse than a text row. No live coverage percentage has been measured. Obtain any required provider access through Boris’s own account; no account was connected during research.

If the pilot is good, implement one provider first behind a server flag with a bounded request budget. Keep credentials server-side, set strict timeouts/input limits/rate limits, and only send public venue identity/location needed for matching. Do not send screenshots, private messages, author notes, account IDs or guest recovery keys. Fetch/display the provider’s resized images under its terms; avoid rehosting or durable caching unless permitted. Plan negative-result caching only where permitted, and handle deletion/expired URLs without broken placeholders. Update factual privacy disclosure for the chosen provider.

Acceptance must include both additions and old guides, guest/local/cloud reads, correct branch matches, missing/stale photos, disabled enrichment, quota/timeouts, owner photo removal, readable credits, mobile row/detail layout and unaffected saving/recovery. No AI or Gemini connector is required to retrieve venue photos; Gemini’s separate role remains screenshot extraction.

## Primary references checked

- [Geoapify Place Details fields](https://apidocs.geoapify.com/docs/place-details/)
- [Wikimedia Commons reuse rules](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)
- [Foursquare current photo endpoint](https://docs.foursquare.com/fsq-developers-places/reference/place-photos)
- [Foursquare current pricing](https://foursquare.com/pricing/)
- [Foursquare endpoint/pricing changes](https://docs.foursquare.com/developer/reference/upcoming-changes)
- [Foursquare Places self-service EULA](https://foursquare.com/legal/terms/apilicenseagreement/)
- [Google Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos)
- [Google Places policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Service Specific Terms, sections 14 and 15](https://cloud.google.com/maps-platform/terms/maps-service-terms)

Primary documentation establishes available interfaces and published terms. It does not establish live venue-photo coverage, an account’s final permissions or actual mobile quality.

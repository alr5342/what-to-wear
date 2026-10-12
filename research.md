# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Research your context of use, references, weather guidance, technical options, and choices that will guide the specification.

## Instructions for the Developer

Judge sources and recommendations, make the consequential decisions, and keep this file current as the work develops.

To begin, open the project repository in a fresh chat and enter:

`Read ./research.md and help me begin Project 3 research.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, and this file. Ask one focused question at a time. Help investigate and compare options without deciding for the Developer. Verify sources directly and keep this file concise.

## Context of use

Primarily used on a phone in the morning, before leaving for class or heading out for the day. The interaction is quick — a glance rather than a browsing session — to answer three things fast: what's the weather, what should I wear, and do I need to bring anything (umbrella, etc.). A laptop version would be used opportunistically when already at a computer, but phone is the primary context. Because it's a quick morning check, the most important information (recommendation and key reminders) needs to be legible at a glance without scrolling or digging.

**Assumptions and limitations:** Normal home/dorm Wi-Fi or cell connection is assumed for the main use case; full offline support is not a design goal. If the weather service fails or there is no connection, the app must show a clear error state and let the user retry.

## User story

> As a college student getting ready in the morning, I want to quickly see what to wear and whether I need to bring anything based on today's (or a future day's) forecast, so that I can dress appropriately without checking multiple apps or overthinking it.

## References

Reference images are examples only, not to be reused in the app. All 7 images below and their design lessons are reviewed and approved.

1. [weatherfit-clothing-categories.jpg](../reference/weatherfit-clothing-categories.jpg) — Weather Fit app (App Store listing). Shows clothing options organized into named sub-categories (T-Shirts / Shirts / Sweaters) with labeled items ("Essential," "Flannel Check"). Observation: useful model for organizing outfit choices into categories, but their items are user-selected/customized rather than randomly assigned — our variation logic needs to be clearly algorithmic, not a wardrobe the user builds.

2. [thewear-main-screen.jpg](../reference/thewear-main-screen.jpg) — TheWear app (App Store listing). Main screen: location name + settings icon at top, a large faceless character centered, temperature/"feels like"/condition at the bottom, swipe dots suggesting multiple screens. Observation: strong candidate layout for our main screen — the faceless/featureless character avoids needing facial-expression art variations, simplifying the asset list.

3. [wearmatic-widgets.jpg](../reference/wearmatic-widgets.jpg) — WearMatic app (App Store marketing screenshot). Shows the same character+temperature concept scaled across different widget sizes; one variant lists the recommended items as text with small icons ("Blouse, Trousers, Sneakers"). Observation: closest precedent to our requirement that outfit, icons, and written recommendation all come from one shared state — also a useful model for how the layout could compress for a smaller/laptop-widget-like view.

4. [dribbble-grab-umbrella.png](../reference/dribbble-grab-umbrella.png) — Dribbble, weather app concept ("Grab an Umbrella"). A reminder is presented as a bold headline (not just an icon), with sunrise/sunset context below. Observation: useful model for making a reminder read as a clear instruction rather than a passive icon — relevant to our umbrella/sunscreen/hydration reminders.

5. [dribbble-playful-headlines.png](../reference/dribbble-playful-headlines.png) — Dribbble, weather app concept ("Sunny Day Walk" / "It's Raining Now"). Uses a human, playful phrase as the primary headline instead of leading with the numeric temperature; color-coded by condition; temperature range shown as a bar. Observation: directly relevant to the "playful, college-student" tone the brief asks for.

6. [dribbble-condition-color-cards.png](../reference/dribbble-condition-color-cards.png) — Dribbble, weather app concept (sunny/cloudy/rain cards). Each condition gets a distinct flat color + simple shape (sun circle, cloud, raindrops) with stats below a divider. Observation: labels are in Chinese, so the text isn't reusable, but the pattern of coding each condition with a consistent color+shape is a useful, accessible-friendly convention to adapt (shape, not just color, carries the meaning).

7. [weatherfit-watch-widget.jpg](../reference/weatherfit-watch-widget.jpg) — Weather Fit app (App Store listing, watch companion). An extremely minimal format: location, temperature, "feels like," one-word condition, and a small character — nothing else. Observation: useful stress-test for our "glance, don't browse" requirement — shows how little information is actually needed to answer "what's it like out and what should I wear."

**Noted but not saved as an image:** Brella, a weather-based outfit app built by Cornell undergraduates (reported by [Cornell College of Arts & Sciences](https://as.cornell.edu/news/students-app-helps-users-choose-wardrobe-based-weather)), is the closest real precedent to this brief — it recommends an outfit each morning from the forecast with a whimsical, personalized greeting. No public screenshot of its UI was available to save as a reference image, so it's recorded here as a source rather than in `reference/`.

## Weather and technical evidence

**Weather providers**

- [National Weather Service API (api.weather.gov)](https://weather-gov.github.io/api/general-faqs) — Free, no API key or registration (a descriptive User-Agent header is required), no meaningful rate limit (~5,000 requests/hour). Covers the United States only.
- [NWS gridpoints/forecast documentation](https://weather-gov.github.io/api/gridpoints) — The `/points/{lat},{lon}` endpoint resolves a location to a forecast grid; `/gridpoints/{office}/{x},{y}/forecast` returns a 7-day forecast in 12-hour periods, and `forecastHourly` returns the same 7-day range hourly. Confirms NWS supports our chosen 7-day range.
- **Limitation:** NWS does not provide a UV Index data field. Confirmed via NWS API discussion threads and gridpoint layer documentation — UV is not one of the available gridpoint properties. The Weather Company, OpenWeatherMap, and EPA each offer UV data, but each would mean a second provider.
- [OpenWeatherMap pricing](https://openweathermap.org/full-price) and [free-tier comparisons](https://jua.ai/articles/free-weather-api-comparison-2026/) — Free tier requires an API key and an email signup, ~1,000 calls/day, 60 calls/minute enforced. The newer One Call API 3.0 (needed for UV Index) requires a payment card on file even to stay within its free quota. Heavier to integrate than NWS for no benefit to a US-only app.

**Apparel/layering guidance**

- [REI: How to Dress in Cold Weather](https://www.rei.com/learn/expert-advice/how-to-dress-in-cold-weather.html) and related layering guides — Describe the standard three-layer system: base layer (moisture-wicking), middle layer (insulation), outer layer (wind/rain protection), plus the general principle that footwear and accessories (hat/gloves) are handled as separate decisions from the layers themselves. This is the basis for our 5 recommendation categories (see Decisions).

**Reminders**

- UV index risk categories (Low/Moderate/High/Very High/Extreme) and WHO guidance that sun protection is recommended from UV level 3 upward — found via UV-tracking app research (DanielLaunches UV app comparison; WHO guidance cited therein). Since NWS has no UV field, our "sun protection" reminder will use a sky-cover/forecast-high proxy rather than a measured UV number, clearly labeled as such.
- Hydration and heat reminders are a common pattern in weather/wellness apps (e.g., WaterMinder-style heat-triggered reminders), supporting a reminder tied to high forecast temperature or heat index.
- Umbrella/rain reminders are near-universal in weather apps and map directly to the NWS precipitation-probability field.
- No dedicated research source was needed for a cold/wind-chill reminder; it follows directly from the same layering guidance above (low temperature or high wind calls for an added layer).

**College-student precedent**

- Brella (Cornell undergraduate project, reported by [Cornell A&S](https://as.cornell.edu/news/students-app-helps-users-choose-wardrobe-based-weather)) — personalized daily outfit suggestions with a whimsical morning greeting; closest real precedent to this brief's audience and tone, though no technical details of its data source were published.

**Accessibility**

- [Section508.gov: Making Color Usage Accessible](https://www.section508.gov/create/making-color-usage-accessible/) and [WCAG contrast guidance](https://www.webability.io/blog/color-contrast-for-accessibility) — Meaningful icons/graphics need at least 3:1 contrast against their background, and color must never be the only way meaning is conveyed (a color-blind user must still understand a rain icon vs. a sun icon). **Applies to this project:** each weather condition and reminder needs a distinct shape/icon, not just a distinct color, and icon contrast needs checking once visual direction is finalized.

**Geocoding**

- [OpenStreetMap Nominatim Search API](https://nominatim.org/release-docs/latest/api/Search/) — Developer-approved replacement for Census on 2026-10-12. Supports city text and structured postal-code searches, with US filtering and no API key. [Census requires a building number and street name](https://www.census.gov/data/developers/data-sets/Geocoding-services.html), so the earlier standalone city/ZIP claim was incorrect. **Accepted trade-off:** the [public Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) requires submitted searches only, no autocomplete, caching, identifying Referer/User-Agent, visible attribution, a switchable service, and at most one request/second across the application. The app queues a tab's searches 1.1 seconds apart and caches repeats; the prototype's total traffic must stay within the application-wide limit. This client-side queue does not coordinate traffic from different users/devices. The compatible endpoint can be changed through `location-config.json` without changing application JavaScript.

**Privacy practices**

- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) — Browsers require explicit user permission before sharing location, and only work in a secure (HTTPS) context, which we already need for GitHub Pages deployment. Best practice is to explain why the location is needed before or at the permission prompt, and to handle a denied/revoked permission gracefully (already a brief requirement). **Applies to this project:** since the app is client-side only with no backend, the simplest honest privacy practice is: location stays in the browser (only the most recent one, per the brief), it's sent only to the NWS API to fetch a forecast, and nothing is transmitted to or stored on a server we control. That statement can go directly on the info screen.

**AI-art sourcing and licensing**

One general note that applies to all AI tools: as of a March 2026 U.S. Supreme Court ruling, purely AI-generated output has no copyright owner — the image itself isn't "ownable" the way hand-drawn art is. That means the real differences between tools are about usage permission and risk, not copyright attribution in the traditional sense. Disclosing the AI tool used on the info screen is still good practice for transparency, independent of what's legally required.

Three options were compared:

1. **OpenAI (ChatGPT image generation)** — Paid plans (Plus/Team) explicitly permit commercial use; OpenAI assigns all rights it holds in the output to the user. Free-tier usage allows OpenAI to use inputs/outputs for training; paid tiers opt out of this by default.
2. **Adobe Firefly** — Outputs from non-beta features are usable commercially. Trained on licensed Adobe Stock content and public-domain material rather than broadly scraped web images, which lowers (but doesn't eliminate) the risk of an output resembling someone else's copyrighted work. Full IP indemnification is enterprise-only.
3. **Leonardo.Ai** — Free tier grants a non-exclusive, royalty-free commercial-use license, but Leonardo retains ownership and free-tier generations are public, meaning the exact character art could be seen or remixed by other users. A paid tier grants full ownership/private generation.

**Decision:** Use ChatGPT's image generation to produce the artwork. Checked: the official OpenAI "ChatGPT" VS Code extension is a coding agent (chat sidebar, file edits, terminal commands) with no confirmed image-generation capability of its own — so images will be generated in the ChatGPT web/mobile app directly, downloaded as PNGs, and added to the project manually (no automated save-to-repo pipeline exists either way). To keep the character consistent across the planned asset set (current estimate in `spec.md` → Assets), a single master character design will be created first and reused as the visual reference for every subsequent outfit/icon generation, reducing the risk of the character's face, body, or style drifting between separate generations. The info screen will credit "character and outfit art generated with OpenAI's ChatGPT image tools."

## Decisions

- **Weather provider:** National Weather Service (`api.weather.gov`). Free, no API key, US-only (which matches our US-location requirement rather than limiting it). **Trade-off accepted:** no UV Index field, so the sun-protection reminder is based on a sky-cover/forecast-high proxy and will be clearly labeled as weather-condition-based, not a measured UV reading.
- **Geocoding provider:** OpenStreetMap Nominatim, approved by the Developer for this prototype on 2026-10-12 after live city/ZIP validation and review of its usage restrictions. NWS remains the weather provider. See Geocoding above for the accepted limits and endpoint configuration.
- **Forecast range:** 7 days, matching the maximum NWS provides in its standard forecast endpoint.
- **Recommendation categories (5):** Outerwear, Top, Bottom, Footwear, Accessory — based on the standard base/mid/outer layering model plus footwear and accessories as separate choices.
- **Reminder types (4):** Umbrella (rain probability), Sun protection (sky-cover/high-temp proxy), Hydration (high temperature/heat), Cold/extra layer (low temperature or wind chill).
- **Additional feature:** Shareable outfit card — generates an image of the character's current outfit and forecast to share/post. Chosen because it directly supports the client's social-engagement campaign goal without requiring a second data source.
- **Visual direction:** Playful and aimed at college students. The character should be polished, professional, distinctive, and nuanced, not a generic cartoon figure (refined 2026-10-05; see Revisions).
- **Artwork approach:** AI-generated using ChatGPT's image generation (web/app), with a single master character design created first and used as the visual reference for all outfit/icon generations to keep the character consistent. Images are generated outside the editor and added to the project manually. Hand-drawn replacement remains an option later if required. See AI-art sourcing and licensing above for the tool comparison.
- **Technical stack:** Plain HTML/CSS/JavaScript, no framework or build step — simplest reliable option for a small client-side app calling one REST API.
- **Deployment:** GitHub Pages, as recommended in the brief.
- **Screen structure (high-level only):** Two screens at minimum — a Main screen (character, recommendation, location/date controls, weather icon, reminders, and a share action for the outfit card) and an Info/credits screen reachable from it. Exact layout, hierarchy, and any additional screens are defined from the hand-drawn phone/laptop designs in the spec phase, not here.

**Art estimate:** The Phase 1 estimate of ~25 assets is superseded by the Developer's weather-matched clothing decision on 2026-10-12. See [spec.md → Assets](spec.md#assets) for the current count and pool breakdown. The expanded artwork volume continues to support the choice of AI-generated artwork within the project timeline.

## Revisions

Record new evidence or changed decisions and explain why they changed.

- **2026-10-04 (planning phase):** Added the US Census Bureau Geocoding Services API as the geocoding provider for typed city/zip entry. This was a missing dependency not caught during research/spec — NWS requires lat/lon and has no geocoding of its own. Chosen over OpenStreetMap Nominatim and Zippopotam.us for consistency with NWS's free/no-key/US-government profile and because it handles both city names and zips (Zippopotam.us is zip-only).
- **2026-10-05 (build, Checkpoint 1):** The Developer refined the visual direction. The original "simple cartoon/mascot style" is replaced by a character that is substantially more polished, professional, distinctive, and nuanced than a generic cartoon figure, while staying playful for the audience. The Developer is developing the seed character separately before the real art is wired in. The placeholder SVGs in `assets/placeholder/` are layout stand-ins only, not the visual target.
- **2026-10-12 (build handoff):** Replaced the outdated art estimate with a reference to the current asset budget in `spec.md`, following the Developer's choice of weather-matched clothing pools. The specification owns the pool rules and current asset count.
- **2026-10-12 (Checkpoint 3 provider validation; approval pending):** Corrected the earlier claim that Census handles standalone cities/ZIPs. Its [official documentation](https://www.census.gov/data/developers/data-sets/Geocoding-services.html) requires a building number and street name. Live read-only checks of OpenStreetMap Nominatim returned HTTP 200 for ZIP `10001` (New York, NY; 40.7485569, -73.9940252) and `Austin, TX` (30.2649261, -97.7474086), with `Access-Control-Allow-Origin: *` on both. Proposed replacement: Nominatim for explicitly submitted searches only, US-filtered results, cached repeated lookups, visible OpenStreetMap attribution, and requests spaced at least one second apart. Its [usage policy](https://operations.osmfoundation.org/policies/nominatim/) caps traffic at one request/second across the whole application, prohibits autocomplete, requires an identifying Referer/User-Agent and attribution, and requires the ability to switch services. Suitable only for a modest-traffic prototype within these limits; the Developer must make an informed choice before adoption. [Search API](https://nominatim.org/release-docs/latest/api/Search/). Open-Meteo also returned New York for `10001` and Austin for `Austin, TX`, but its [free-service terms](https://open-meteo.com/en/terms) exclude commercial products/promotional activities, so it is not the preferred option for this client campaign. NWS remains the approved weather provider.

## Approval

Checkpoint 3 provider update approved by the Developer on 2026-10-12: “Approve Nominatim for this prototype.” This supersedes the original Census decision and the pending-provider status in the validation revision above.

Approved by the Developer on 2026-10-04. The research phase is complete; specification begins in a separate conversation.

## Saving the transcript

After the Developer approves the research, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved research, project brief, and hand-drawn screen designs into testable requirements.

## Instructions for the Developer

Make and approve the product decisions, draw every proposed screen, provide the drawings to the Agent, and keep this file current as the intended result changes.

To begin, open the project repository in a fresh chat and enter:

`Read ./spec.md and help me begin the Project 3 specification.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, and this file. Review the screen drawings the Developer provides. Ask one focused question at a time, surface gaps and trade-offs without inventing requirements, and keep the specification concise and testable.

## Goal

Help a US college student, in a quick morning glance, answer three questions for today or an upcoming day: what's the weather, what should I wear, and what should I bring. Serves the user story in `research.md`:

> As a college student getting ready in the morning, I want to quickly see what to wear and whether I need to bring anything based on today's (or a future day's) forecast, so that I can dress appropriately without checking multiple apps or overthinking it.

## Screen designs

All 16 hand-drawn phone and laptop designs are saved in `reference/` and are the complete, approved visual baseline for this project. Where an implementation requirement below is more specific or slightly different than a sketch (e.g., a section a drawing omits), the written requirement governs — the drawings establish layout and hierarchy, not a pixel-exact contract.

| Screen / state | Phone | Laptop |
|---|---|---|
| Main — loaded | [main-phone-loaded.jpg](../reference/main-phone-loaded.jpg) | [main-laptop-loaded.jpg](../reference/main-laptop-loaded.jpg) |
| Main — first run (no saved location) | [main-phone-firstrun.jpg](../reference/main-phone-firstrun.jpg) | [main-laptop-firstrun.jpg](../reference/main-laptop-firstrun.jpg) |
| Main — loading | [main-phone-loading.jpg](../reference/main-phone-loading.jpg) | [main-laptop-loading.jpg](../reference/main-laptop-loading.jpg) |
| Main — service error | [main-phone-error.jpg](../reference/main-phone-error.jpg) | [main-laptop-error.jpg](../reference/main-laptop-error.jpg) |
| Main — location permission denied | [main-phone-permission-denied.jpg](../reference/main-phone-permission-denied.jpg) | [main-laptop-permission-denied.jpg](../reference/main-laptop-permission-denied.jpg) |
| Location & date selector | [selector-phone.jpg](../reference/selector-phone.jpg) | [selector-laptop.jpg](../reference/selector-laptop.jpg) |
| Share/outfit card ("Your Outfit Card") | [share-card-phone.jpg](../reference/share-card-phone.jpg) | [share-card-laptop.jpg](../reference/share-card-laptop.jpg) |
| Info/credits | [info-phone.jpg](../reference/info-phone.jpg) | [info-laptop.jpg](../reference/info-laptop.jpg) — single-column, same structure as phone (see note below) |

Layout notes carried from the drawings:
- Main screen: top bar (location `▾`, info icon), `Today ▾` + current/forecast label, headline, character, condition icon + temp + source, a **flexible "Wearing" list** showing only whichever of the 5 categories apply, a stacked reminders list, Share button. On phone, a **"Change" button sits beside Share** and opens the Location & date sheet, so date/location stay thumb-reachable (#18); this is not in the drawings, see Revisions. Laptop splits into two columns: character alone on the left, all text/data stacked on the right.
- Location & date selector: phone = bottom sheet (search field, "Use my location," horizontally-scrollable date chips, Done). Laptop = centered two-column modal (location controls left, full date list right).
- Share/outfit card: phone = bottom sheet with card preview + native **Share** button. Laptop = centered modal titled "Your Outfit Card" with card preview + **Download image** button (no native share on desktop).
- Info/credits: both phone and laptop use the same single scrolling column of 5 sections (Creator, Weather data, How recommendations work, Privacy, Art credits) — an accepted simplification over the sidebar-navigation layout originally proposed (see Out of scope). The `info-laptop.jpg` drawing doesn't show the Art credits row, but requirement #23 below requires it in the built app regardless.
- Minor states (first run, loading, error, permission denied) reuse the Main screen's frame/chrome; only the content region changes.

## Requirements

### Weather data
1. **Current and forecast data.** The app fetches live data from the National Weather Service (`api.weather.gov`): resolve the chosen location via `/points/{lat},{lon}`, then read the 12-hour-period forecast from `/gridpoints/{office}/{x},{y}/forecast`.
   *Acceptance check:* For a given location, the temperature, short forecast, precipitation probability, and sky cover shown on screen match the current NWS forecast for that location at the time of the request.
2. **Date range.** Users may select **today or any of the next 6 days (7 selectable days total)**, matching the Location & date selector drawings.
   *Acceptance check:* The selector displays exactly 7 date options; selecting any one loads that day's daytime forecast period.
3. **Current vs. forecast label.** Today is labeled "Current" (using today's daytime forecast period, since NWS has no separate live-observation feed in our data flow); any other selected day is labeled "Forecast."
   *Acceptance check:* The label switches correctly when the user changes the selected date.
4. **Units.** Temperature is always shown in Fahrenheit (°F), with no toggle (US-only app, per research decision).
   *Acceptance check:* Every temperature display includes the °F symbol; no Celsius control exists anywhere in the UI.

### Location
5. **Manual entry and device location.** Users can set location by typing a US city/zip or by using the device's geolocation. Typed entry is resolved to latitude/longitude via the US Census Bureau Geocoding Services API (see `research.md`) before being passed to NWS, since NWS itself requires lat/lon and does not geocode.
   *Acceptance check:* Both paths resolve to a valid NWS grid point and load a forecast.
6. **Most recent location only.** Only the single most-recently-selected location is saved (in `localStorage`); choosing a new location replaces it.
   *Acceptance check:* After selecting location B then reloading the page, location A is not shown or retained anywhere.
7. **First run.** With no saved location, the Main screen shows the first-run prompt (greyed character, "Set your location to get started," Search / Use my location buttons) instead of attempting a default location.
   *Acceptance check:* Clearing site data and reloading shows the first-run state, not an error or a stale forecast.

### Main screen content
8. **Single recommendation state.** The character's outfit, the weather icon, the written recommendation headline, and the reminders all read from one computed recommendation-state object for the selected location + date (see Recommendation state and data flow).
   *Acceptance check:* Changing any one of these independently (e.g., editing code to force a different icon without updating the state object) is not possible through normal use — all four always change together when the state changes, never independently.
9. **At-a-glance layout.** On phone, all of location, date, units, source, current/forecast label, character, headline, temperature, the Wearing list, and reminders are visible without scrolling past them to find any single one (the Wearing list and reminders may each wrap to multiple lines but the section itself must not require scrolling to discover it exists).
   *Acceptance check:* On a 375×667 viewport, no required element is hidden below an unscrolled fold in a way that a first-time user wouldn't notice it's there.
10. **Flexible Wearing list.** The "Wearing" section lists only the categories that apply to the current recommendation state (see Recommendation categories below), not a fixed 3 items.
    *Acceptance check:* A warm, dry, calm-wind forecast shows only Top/Bottom/Footwear; a cold, rainy, windy forecast also shows Outerwear and Accessory.

### Recommendation categories (5)
Based on the REI layering model cited in `research.md`. **Top, Bottom, and Footwear are always shown.** Outerwear and Accessory are conditional:

| Category | Shown when | Example variations (3 each) |
|---|---|---|
| Top | always | T-shirt, Long-sleeve tee, Flannel shirt |
| Bottom | always | Shorts, Jeans, Joggers |
| Footwear | always | Sneakers, Boots, Sandals |
| Outerwear | forecast low ≤ 60°F, OR windSpeed ≥ 15 mph (parsed, upper bound), OR precipitation probability ≥ 40% | Light jacket, Flannel overshirt, Raincoat |
| Accessory | the Sun protection reminder OR the Cold/extra layer reminder is active (see below) | Sunglasses, Baseball cap, Beanie |

*Acceptance check:* For each of the 5 categories, manually construct 3 qualifying forecasts and confirm the category appears/doesn't appear per the table, and that its displayed variation is one of its 3 defined options.

### Reminders (4)
Trigger thresholds proposed below, grounded in the REI/WHO/NWS guidance already cited in `research.md` — **please review and adjust any number you'd change.**

| Reminder | Trigger | 3 wording variations (example) |
|---|---|---|
| Umbrella | precipitation probability ≥ 40% | "Bring an umbrella — rain's likely." / "Don't forget your umbrella today." / "Showers expected, grab an umbrella." |
| Sun protection (proxy, not measured UV) | `shortForecast`/`icon` indicates clear/sunny conditions (keyword match: "sunny" or "clear") AND forecast high ≥ 60°F | "Sunny skies — wear sunscreen." / "UV's up there, don't skip the sunscreen." / "Clear and bright — protect your skin." |
| Hydration | forecast high ≥ 85°F | "It's hot — drink extra water." / "Stay hydrated out there today." / "Heat's up, keep that water bottle full." |
| Cold/extra layer | forecast low ≤ 45°F OR computed wind chill ≤ 40°F | "It's chilly — layer up." / "Cold one today, bundle up." / "Temps are dropping, add a layer." |

*Acceptance check:* For each reminder, construct a forecast that crosses its threshold and confirm it appears with one of its 3 wordings, and a forecast that doesn't cross it and confirm it's absent.

**Data-availability note:** The NWS `/gridpoints/{office}/{x},{y}/forecast` endpoint (confirmed by inspecting a live response) returns `temperature`, `temperatureTrend`, `probabilityOfPrecipitation`, `windSpeed`, `windDirection`, `icon`, `shortForecast`, and `detailedForecast` per period — it does **not** include a sky-cover percentage or a wind-chill field (those exist only on the separate raw gridpoint-data endpoint, which research.md deliberately avoided for its added parsing complexity). Two adjustments follow, using only fields already in this response:
- **Sun protection** uses a `shortForecast`/`icon` keyword match instead of a sky-cover percentage.
- **Wind chill** is computed client-side from `temperature` and `windSpeed` (parsed from strings like "10 mph" or "10 to 15 mph" by taking the upper bound) using the standard NWS wind chill formula: `35.74 + 0.6215T − 35.75(V^0.16) + 0.4275T(V^0.16)`, valid for T ≤ 50°F and V > 3 mph (outside that range, treat wind chill as equal to temperature, i.e., no wind-chill effect).

### Content variation and persistence
11. **Independent random selection.** Each shown category's outfit variation and each active reminder's wording variation are chosen independently at random (not as fixed pairs) whenever a location+date combination is loaded for the first time.
    *Acceptance check:* Load the same qualifying forecast conditions multiple times across different location/date combinations and confirm variation choices differ independently across categories/reminders, not in lockstep.
12. **Persistence.** The chosen variation indexes are saved to `localStorage`, keyed by location + date. Returning to a previously selected date — including after a full page reload — shows the same variations.
    *Acceptance check:* Select a date, note the outfit/reminders shown, reload the page, reselect the same date, and confirm identical variations appear.

### Share/outfit card
13. **Shareable card.** A "Your Outfit Card" overlay shows the character in the selected day's outfit, temperature + condition icon, location + date, and the recommendation headline — identical content on phone and laptop.
    *Acceptance check:* Card content matches the Main screen's current recommendation state exactly.
14. **Platform-specific action.** Phone shows a "Share" button invoking the native Web Share API; laptop shows a "Download image" button that saves the card as a PNG (desktop browsers lack reliable native share support).
    *Acceptance check:* On a phone browser, Share opens the OS share sheet. On a desktop browser, Download saves a PNG file.

### Error and permission handling
15. **Loading state.** While fetching weather data, the Main screen's content region shows a loading placeholder instead of stale or blank content.
16. **Service error.** If the NWS request fails or returns no usable data, the content region shows an error message and a Retry button; Retry re-attempts the fetch.
17. **Location permission denied.** If geolocation is denied, the content region shows a message explaining this and a path to manual entry (does not silently fail or retry forever).
    *Acceptance check (15–17):* Simulate each condition (slow/throttled network, a mocked failed fetch, and denying the browser's location prompt) and confirm the matching drawing's layout appears with working recovery actions.

### Responsive and accessible layout
18. **Phone, one-handed.** Primary actions (date, location, Share) are reachable in the lower two-thirds of a typical phone screen; the Location/date and Share overlays are bottom sheets reachable by thumb.
19. **Laptop, distinct layout.** The laptop Main screen uses a two-column layout (character left, data right) rather than a stretched phone layout; the Location/date selector uses a two-column modal showing all 7 dates at once.
20. **Icons carry shape, not just color.** Each weather condition and each reminder has a distinct icon shape, not color alone (per the Section508/WCAG guidance in `research.md`).
    *Acceptance check:* View the app with a color-blindness simulator (e.g., browser dev tools' vision-deficiency emulation); every condition/reminder remains distinguishable.
21. **Contrast.** Icons and text meet at least 3:1 contrast against their background.

### Privacy and credits
22. **Privacy statement.** The Info screen states: location is stored only in the browser (most recent only), sent only to the NWS API to fetch a forecast, and nothing is transmitted to or stored on a server the app controls.
23. **Info screen completeness.** The Info screen includes all 5 sections: Creator, Weather data source, How recommendations work (methodology + sources), Privacy, Art credits.
    *Acceptance check:* Each of the 5 sections is present and non-empty on both phone and laptop.

### Deployment
24. **Public HTTPS deployment.** The app is deployed to a public HTTPS URL (GitHub Pages) and matches this specification.

## Recommendation state and data flow

**Weather inputs** (from the NWS forecast endpoint, for the selected day's daytime period, plus its paired overnight period for the low): `temperature` (high and, from the adjacent night period, low), `shortForecast`/`icon`, `probabilityOfPrecipitation`, `windSpeed` (parsed to a number), and a client-computed wind chill derived from temperature + wind speed (see Reminders table note — the endpoint has no sky-cover or wind-chill field of its own).

**Shared state shape** (one object per location+date, computed once per fetch, driving every visual and written output):
```
{
  location: { name, lat, lon },
  date: "YYYY-MM-DD",
  isForecast: boolean,       // false = today ("Current"), true = future day
  tempF: number,
  conditionIcon: string,
  outfit: {
    top: variationIndex,
    bottom: variationIndex,
    footwear: variationIndex,
    outerwear: variationIndex | null,   // null = category not shown
    accessory: variationIndex | null
  },
  reminders: [
    { type: "umbrella" | "sun" | "hydration" | "cold", active: boolean, variationIndex }
  ]
}
```
This object is computed from live weather data using the category/reminder rules above, persisted to `localStorage` keyed by `location+date`, and is the single source every UI element (character, icons, headline, Wearing list, reminders, share card) reads from.

## Content variation

See Reminders and Recommendation categories tables above for the required 3 variations each, and Persistence (#11–12) for the independent-random-selection and reload-persistence rules.

## Assets

| Asset | Appears | Format | Source | Credit/license |
|---|---|---|---|---|
| Base character (neutral pose) | Main, Share card | PNG | AI-generated (ChatGPT image tools) | Credited on Info screen |
| 15 outfit pieces (5 categories × 3 variations) | Main, Share card | PNG, layered onto character | AI-generated (ChatGPT image tools), using the base character as visual reference | Credited on Info screen |
| 5–6 weather condition icons (sunny, cloudy, rain, snow, storm/wind) | Main, Share card | SVG or PNG | AI-generated (ChatGPT image tools) | Credited on Info screen |
| 4 reminder icons (umbrella, sun, hydration, cold) | Main reminders list | SVG or PNG | AI-generated (ChatGPT image tools) | Credited on Info screen |
| UI chrome icons (location pin, info, back arrow, close ×, search, drag handle, share/download) | Top bar, modals, Info screen | SVG | Lucide icon library | ISC license (some icons derive from Feather, MIT). The license requires its notice to ship with the icons: copy kept at `assets/licenses/lucide-ISC.txt`; credit on Info screen |
| Nunito font (variable, Latin subset) | All text | WOFF2, self-hosted | Nunito Project via Fontsource | SIL Open Font License 1.1: copy kept at `assets/licenses/nunito-OFL.txt`; credit on Info screen |

~25 character/outfit/weather/reminder assets, consistent with the art estimate in `research.md`.

## Out of scope

- Celsius toggle (fixed to Fahrenheit).
- UV Index as a measured value (proxy-based sun reminder only; labeled as such).
- Offline support (brief assumes normal connectivity; errors are handled, not worked around).
- Locations outside the United States (NWS coverage is US-only, matching the brief's US-location requirement).
- Sidebar/jump-link navigation on the Info screen (accepted simplification — laptop Info screen reuses the phone's single-column structure rather than a two-column layout).
- User accounts, saved location history beyond the single most-recent location, or any backend/server component.

## Revisions

After implementation or testing, record requirement changes and the evidence that prompted them. Update the screen drawings when a material layout or interaction changes.

- **2026-10-05 (Checkpoint 1): phone thumb reach (#18).** The phone Main drawings put the location and date controls only in the top bar, in the top third of the screen, so they missed #18's lower-two-thirds requirement. Developer decision: keep the top bar exactly as drawn (still shows and opens location/date) and add a "Change" button beside Share that opens the same Location & date sheet. No requirement text changed. The phone Main drawings omit this button; update them if you want the drawings to match.
- **2026-10-05 (Checkpoint 1): asset licenses.** Corrected the UI icon license from MIT to ISC after checking Lucide's LICENSE file. Added the self-hosted Nunito font (OFL) to the asset list. It's self-hosted so the app contacts no font server, which keeps the #22 privacy statement accurate.

## Approval

Approved by the Developer on 2026-10-04. The specification and all 16 screen designs are final; planning begins in a separate conversation.

## Saving the transcript

After the Developer approves the specification, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

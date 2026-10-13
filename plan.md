# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved specification into an ordered, trackable build and verification plan.

## Instructions for the Developer

Set priorities, review the checklist, verify results rather than relying only on the Agent's report, and keep the project documents current as the work changes. Expect the build to take many rounds of testing and fixing; record material changes under Revisions.

To begin planning, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me create the Project 3 implementation plan.`

After approving the plan, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me implement the approved Project 3 plan in working checkpoints.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, `spec.md`, and this file, then inspect the relevant project files. Propose concrete tasks and checks without expanding the approved scope.

During implementation, follow the approved plan in working checkpoints and keep it current. Never mark approvals or items requiring Developer verification complete on the Developer's behalf.

## Approach

**Structure:** Plain HTML/CSS/JS, no framework, no build step (per `research.md`). Module split: `app.js` (wiring/render loop), `location.js` (Nominatim/device/saved location), `weather.js` (NWS/date normalization), `state.js` (recommendations/independent persisted choices), `ui.js` (DOM), `art.js` (generated PNG layers/fitting/colorways shared with export), and `share.js` (prepared PNG, native file sharing/download/recovery). `location-config.json` supplies the compatible geocoder endpoint. One `index.html`, responsive via CSS; no runtime image-generation service.

**Data flow:** Submitted US city/ZIP → Nominatim → lat/lon, *or* device Geolocation API → lat/lon directly → NWS `/points/{lat},{lon}` → returned forecast URL → location-timezone dates and daytime/night pairs → recommendation state → live `location+date` persistence → Main and Share preview. Normal operation never falls back to Austin or mock weather; explicit mocks use separate storage.

**Dependencies:** `api.weather.gov` (NWS, no key), `nominatim.openstreetmap.org` (accepted usage limits in `research.md`), browser geolocation/localStorage, Web Share and Canvas PNG export, Lucide UI icons (ISC), and locally served generated PNG artwork. Art production used the Agent's built-in image tool and a PowerShell/System.Drawing crop/mask utility; neither is needed to run or deploy the app.

**Current task order:** Exactly six checkpoints. Checkpoints 1–5 are approved and committed. Checkpoint 6's peer-supported revision is approved, committed, deployed, and publicly verified. The debrief is complete and saved. The Developer has authorized final submission housekeeping, including the commit log, remaining commits, push to main, and final repository/deployment checks. No application changes are requested; residual clothing alignment issues remain accepted. See the final submission audit below for current evidence and limitations; earlier pending/handoff entries are historical.

## Six-checkpoint schedule

| Checkpoint | Scope and completion evidence | Status |
|---|---|---|
| 1 | Static UI shell, screens/states, responsive layout | Approved; `ec95a08` |
| 2 | Weather-matched recommendations, independent variations/persistence, approved interface refinements | Approved; `81e6f41` |
| 3 | Working city/ZIP/device location, live NWS weather, saved location, recovery | Approved; `d753f48` |
| 4 | Illustrated character/13-piece wardrobe, weather/reminder artwork, three colorways, phone Share/laptop PNG download, and strict development-only mocks | Approved as-is; committed `997036c`; residual alignment limitation accepted |
| 5 | Essential responsive/accessibility and Info/credits/privacy polish, GitHub Pages setup and deployed checks, safe project-size optimization, peer-test readiness | Approved; committed/pushed `d3854f6`; public HTTPS verified |
| 6 | Three real peer sessions and findings, supported improvement/redeployment, completed debrief and transcript, implementation transcripts, commit-log.txt, final pushed repository and GitHub Download ZIP audit | Approved peer revision deployed; debrief and submission records complete; GitHub ZIP/extracted app verified; final export commit/push reported in handoff |

**Review and commit rule:** The Developer verifies and approves each checkpoint before its commit. The Developer explicitly authorized the public repository and separate site-only `gh-pages` deployment, approved Checkpoint 5 (`d3854f6`), and approved the Checkpoint 6 usability revision (`cbce6f9`). In the finalization request, the Developer confirmed the completed/saved debrief and explicitly authorized committing remaining submission files and pushing main. This authorizes the documentation/status reconciliation and commit-log export; no further application pass is planned. Exactly six checkpoints.

**Main risks:**
- NWS grid resolution can fail or return unexpected shapes near coastal/territory boundaries — covered by the existing service-error state (#16).
- Nominatim can return ambiguous/no city matches. Use the first/best US-filtered match; ask for city and state in the input guidance. No matches or failed lookups show feedback in the selector and do not claim success. Follow the accepted public-service usage limits in `research.md`; the per-tab queue does not coordinate traffic across different users/devices.
- NWS can omit expired daytime periods or incomplete final day/night pairs. Those dates show missing-forecast feedback with date selection/retry, never another day's data or mock values.
- Wind-speed strings ("10 to 15 mph") need upper-bound parsing for both the outerwear rule and the wind-chill formula — isolate this in one helper function and unit-check it directly.
- Generated atlases need fitting and masking to preserve the reference style while avoiding sleeve bleed, obscured faces, and hidden top/bottom differences. Agent-owned generation and preparation are now implemented; source PNGs/prompts are retained, and the Developer reviews the finished visual result before commit. `spec.md` owns the actual asset count.
- File sharing depends on browser/device capability and user activation. Generate the card before the tap, check file support, offer PNG-download recovery, and verify a real OS share sheet on the Developer's phone. Headless tests instrument the API call; they do not establish native target-app behavior.
- The hidden developer override is for testing only, not a security boundary — acceptable for a client-side prototype with no real user data, but it must be removed or clearly gated before peer usability testing so testers don't stumble into it.
- Live recommendations retain only the current location's date entries; choosing a new live location removes the previous location's entries. Historical dates within that location have no cap — acceptable for this prototype. Mock selections remain separate.

## Checklist

### Approvals

- [x] Research approved (2026-10-04)
- [x] Specification approved (2026-10-04)
- [x] Plan approved (2026-10-04)

### Build

- [x] Initialize the local git repository and add a `.gitignore` (2026-10-05; GitHub remote and Pages setup moved to the deploy step, see Revisions)
- [x] **Checkpoint 4:** Illustrated master/wardrobe and three colorways implemented; Developer approved as-is on 2026-10-12 with remaining alignment issues accepted.
- [x] Build the static UI shell for every screen/state from the approved drawings (Main: loaded, first-run, loading, error, permission-denied; Location & date selector; Share/outfit card; Info/credits), phone and laptop layouts, using placeholders for any asset not yet generated. *Checkpoint 1 — tested and approved by the Developer on laptop and phone, 2026-10-05; committed as `ec95a08`.*
- [x] Implement the recommendation-state object, reusable wardrobe eligibility, priority-based headline, and category/reminder rules from `spec.md` against hand-written mock forecast data, including the hidden developer override for injecting temp/wind/precip values. *Checkpoint 2 — tested and approved by the Developer on 2026-10-12, including the interface revisions. Includes this task and the next two; at least 4 distinct garment combinations per weather category before colors.*
- [x] Wire character art, condition icon, headline, Wearing list, and reminders to read only from the recommendation-state object (spec #8) — confirmed against mock data; temporary artwork pending the later art checkpoint
- [x] Implement independent random garment, colorway, reminder, and headline selection, with `localStorage` persistence keyed by `location+date` (spec #11–12)
- [x] **Checkpoint 3 — live location and weather:** Nominatim city/ZIP search (approved replacement), device location, and NWS grid/forecast integration implemented. New York ZIP `10001` and city `Austin, TX` passed live browser checks; coordinates, weather, and recommendations update. *Includes this task and the next two; Developer tested different ZIP codes, city searches, dates, and page reloads and approved the checkpoint on 2026-10-12.*
- [x] Most-recent-live-location persistence and first-run state implemented (spec #6–7); included in Developer's Checkpoint 3 approval
- [x] Loading, service-error, permission-denied, invalid-search, and unavailable-date recovery implemented (spec #15–17); included in Developer's Checkpoint 3 approval; automated recovery coverage recorded below
- [x] **Checkpoint 4:** PNG Share/Download and fallback/recovery implemented; shared selected outfit and colors across Main/card/export. Included in as-is approval. Actual native receiving-app behavior remains a deployment smoke check, not a claimed completed manual test.
- [x] **Checkpoint 4:** All 13 garments, five weather icons, four reminder icons integrated; four same-color combinations per tested profile. Remaining visual alignment imperfections accepted.
- [x] **Checkpoint 4:** Developer approved the checkpoint as-is and directed its commit and cumulative transcript save on 2026-10-12.
- [x] **Checkpoint 5:** Responsive/accessibility pass: one-handed phone reachability, laptop two-column layout, icon shape-plus-color distinction, 3:1 contrast check (spec #18–21)
- [x] **Checkpoint 5:** Build out the Info/credits screen's 5 sections with real content (spec #22–23), including final art source/tool attribution
- [x] **Checkpoint 5:** Gate or remove the developer override from the normal UI path before peer testing
- [x] **Checkpoint 5:** Audit package size, optimize safely, preserve required deliverables/source/transcripts, and verify the GitHub-generated ZIP contents (see release preparation below)
- [x] **Checkpoint 5:** Prepare the public GitHub repository/remote and approved `gh-pages` root target; Developer approval and commit/publication recorded below.
- [ ] **Checkpoint 5:** Publish to GitHub Pages, verify live assets/location/weather/share/privacy and HTTPS behavior on phone/laptop, and prepare the existing peer-test protocol; report the deployed URL and save the transcript. Keep deployment corrections within this checkpoint, with review before committing fixes.

### Verify and revise

- [ ] Check every specification requirement (#1–24) against the deployed app, not only the local copy
- [ ] Using the developer override, test every recommendation-category and reminder threshold in `spec.md` (both just-crossing and just-under each boundary), across multiple locations and both current and forecast dates
- [ ] Verify weather-matched clothing, reminder, and headline variations are chosen independently, not as fixed pairs, by holding forecast conditions fixed (via the override) across repeated/different location+date loads; include overlapping conditions to verify headline priority and pool suitability
- [x] Verify that returning to a previously selected date — including after a full page reload — shows the same variations
- [x] Test the three failure states (slow/throttled network, a forced failed fetch, and a denied location prompt) and confirm each recovery action works
- [ ] Test the deployed app, independently of the local version, on a real phone and a real laptop: one-handed reachability of date/location/Share, the laptop two-column layouts, the native Share sheet on phone, PNG download on laptop, a color-blindness simulation, and contrast
- [x] Confirm the developer override is gated/removed before peer sessions
- [x] Prepare the usability test below
- [x] **Checkpoint 6:** Three brief peer reviews completed per Developer report; aggregate findings and limits of supplied session details recorded below
- [x] **Checkpoint 6:** Record the peer-supported recommendation/date-recovery improvements and update spec.md; implementation review pending
- [x] **Checkpoint 6:** Implement and verify at least one meaningful revision; obtain Developer review/approval before committing and redeploying it

### Deliver

- [x] **Checkpoint 6:** Confirm all brief deliverables, public URL, peer notes/revision evidence, sources, privacy information, and asset credits; prepare submission materials
- [x] **Checkpoint 6:** Complete the debrief using the provided `debrief.md` instructions when available, with the Developer's own decisions and verification reflected accurately
- [x] **Checkpoint 6:** Save the completed debrief conversation in `transcripts/`, retain implementation transcripts, and generate plain-text `commit-log.txt` with full commit IDs, dates, and complete commit messages, without patches/code
- [x] **Checkpoint 6:** Commit and push all final project files after approval; audit the completed repository's **Code → Download ZIP** archive as the submission artifact
- [x] **Checkpoint 6:** Obtain Developer verification/approval of final documentation/submission readiness before the final commit; save all implementation/debrief transcripts. Actual submission follows the Developer's explicit direction.

## Usability testing

**Purpose:** Confirm a first-time user can, in a quick morning glance, tell what the forecast is, what to wear, and what to bring — and can change location/date and use the share card without guidance beyond what's on screen.

**Tasks (non-leading):**
1. "You just woke up and want to know what to wear today. Open the app and tell me what you'd wear and whether you need to bring anything."
2. "You're curious about the weather this weekend. Check a different day using the app."
3. "You want to send a friend a picture of today's outfit."
4. "The app couldn't find your location automatically. Show me how you'd set it a different way."

**Note format (per session):** Task | what the tester did/said | success (Y/N) | barrier or question raised | possible change. Record only observations in the first four columns; keep interpretation/possible changes in the last column only.

**Logistics:** Non-identifying labels (P1/P2/P3). Use the deployed HTTPS link on the tester's own phone where possible, and the Developer's laptop for the laptop task, rather than a local build — matches real conditions.

After all three sessions, summarize the strongest findings below and the one improvement they support.

### Peer session records - three brief reviews reported complete

The Developer reports completing three relatively brief peer usability reviews on the deployed app. The findings below are their aggregate summary. Individual dates, devices/browsers, task outcomes, quotes, and attribution of each finding to a particular peer were not supplied; do not infer them or assign the aggregate findings to P1/P2/P3 separately.

| Peer | Session status | Detail available |
|---|---|---|
| P1 | Completed, per Developer report | Individual session details not supplied |
| P2 | Completed, per Developer report | Individual session details not supplied |
| P3 | Completed, per Developer report | Individual session details not supplied |

| Reported feedback / observation | Developer decision | Resulting action |
|---|---|---|
| Recurring concern that garments do not always fit/layer naturally | Accept the known visual limitation given prior effort and low functional impact | Document only; no artwork or alignment changes |
| Some outfits seemed unsuitable for the displayed weather, including long sleeves above 70 F | Prioritize recommendation accuracy; account for rain, wind and other conditions; preserve real outfit variations | Restrict warm tops to T-shirts, use three bottoms for three garment combinations, retain weather protection and avoid insulated warm-day gear caused only by overnight lows |
| Use My Location sometimes failed or did not show the expected forecast for Today; later dates appeared to resolve it | Fix location/date handling and provide a sensible fallback if Today is unavailable | Reproduced the missing-daytime-data path in code/fixtures; select the first available real future forecast when Today is missing, visibly explain the change, and keep header/card/outfit on the actual date |

**Findings synthesis:** The Developer prioritized recommendation accuracy and usable location/date recovery as central to the app. Garment alignment remains an accepted visual limitation. These are reported peer observations and Developer decisions, not direct Agent observations of the sessions. No additional comments or session metrics are invented.

**Resulting improvement (Checkpoint 6, approved and deployed):** Before, warm pools explicitly allowed long sleeves, and a cold overnight low could select insulated daytime gear. Warm profiles now select a T-shirt with shorts/chinos/joggers (three combinations independent of colors); cool/snow profiles retain two tops x two bottoms (four). Rain, wind, overnight-layer triggers, snow, and independent reminders remain. Saved ineligible choices are replaced on recomputation. Before, a missing Today pair made a successful device lookup look like a weather failure; now the next available real date is selected and explained. Explicit future dates remain exact, with an error if unavailable; there is no mock substitution.

**Changed files:** js/state.js, js/weather.js, js/app.js; the existing Weather data explanation in index.html; corresponding targeted tests and spec.md. No artwork files changed. Verification and approval status are recorded below; The Developer has approved the fixes and peer documentation for commit/push/redeployment; verify the updated public Pages app before the fresh-chat debrief.

## Revisions

Record material plan changes and why they were made.

- **2026-10-04:** During planning, found that typed city/zip entry (spec #5) has no geocoding path — NWS requires lat/lon and does not geocode. Added the US Census Bureau Geocoding Services API as the geocoding provider (recorded in `research.md`) and updated `spec.md` requirement #5 to name the step.
- **2026-10-05 (Checkpoint 1):** Developer chose to defer creating the GitHub remote and configuring GitHub Pages until the deployment stage so they don't block local work; that setup moved into its own task just before the deploy step. Git is initialized locally on `main`.
- **2026-10-05 (Checkpoint 1):** The phone drawings put the location/date controls only in the top third, which conflicts with spec #18. Developer chose to keep the top bar as drawn and add a "Change" button beside Share on phone (recorded in `spec.md` Revisions).
- **2026-10-05 (Checkpoint 1):** Visual starting point approved by the Developer (not locked): rounded type (Nunito, self-hosted so no third-party font server is contacted, which keeps the privacy statement accurate) and weather-tinted backgrounds. The character is drawn as stacked same-size layers from the start (placeholder SVGs in `assets/placeholder/`), so the generated PNGs drop into the same structure.
- **2026-10-12 (handoff):** Corrected the Checkpoint 1 checkbox to reflect the Developer's existing approval and commit `ec95a08`. Recorded the recovered recommendation decisions in `spec.md` and aligned the Checkpoint 2 tasks here. The Developer authorized transcript snapshots after every checkpoint and at chat handoffs; no separate `save transcript` request is needed for those saves.
- **2026-10-12 (Checkpoint 2 implementation):** Developer authorized the 13-piece wardrobe, 3 extra colorways, weather overlaps, snow exception, and headline wording/priority, conditional on at least 3 distinct garment combinations per weather category. Implemented against 7 mock daily forecasts with injectable weather controls, independent persisted selections, and 13 distinct temporary SVG garment shapes. The specification owns the current wardrobe/rules and 23–24-image art budget. Final PNG art, live data, and Share/Download remain later work. Developer verification is pending; no Checkpoint 2 approval is recorded.
- **2026-10-12 (Checkpoint 2 Developer review):** Developer tested and accepted the recommendation logic. Requested the interface revisions recorded in `spec.md` and reaffirmed that the finished character must be polished generated illustration, with artwork deferred to a later checkpoint. The observed New York ZIP leaving Austin unchanged is an unwired mock input, to be resolved and explicitly tested in Checkpoint 3. Overall Checkpoint 2 approval and commit remain pending verification of the interface revisions; do not start live-data implementation yet.
- **2026-10-12 (Checkpoint 2 approval):** Developer verified the revised interface, approved Checkpoint 2 in full, and directed the Agent to commit it and save the transcript. Marked the three completed build tasks above accordingly. Next: present a concise Checkpoint 3 scope and test overview, with location search emphasized, before beginning live-data implementation.
- **2026-10-12 (Checkpoint 3 authorized):** Developer approved the live location/weather scope and testing approach, with an explicit approval gate for changing the geocoding provider. Census validation found the original city/ZIP claim incorrect; evidence and the proposed replacement are recorded in `research.md`. Provider adoption and dependent wiring await Developer choice. Independent NWS work is authorized; do not treat provider research as checkpoint completion.
- **2026-10-12 (Checkpoint 3 implementation):** Developer explicitly approved Nominatim for this prototype after reviewing the documented limits. Implemented the live flow and recovery actions, isolated explicit mock previews, and added lookup attribution/privacy content. Research owns the provider decision; spec owns behavior. Automated and live-provider checks pass as recorded below. Overall Checkpoint 3 approval and commit await Developer verification.
- **2026-10-12 (Checkpoint 3 approval / next priority):** Developer tested different ZIP codes, city searches, forecast dates, and reloads, approved Checkpoint 3, and directed the Agent to commit it and save the transcript. Character artwork takes priority in Checkpoint 4 before the remaining features. The workflow below is a proposal for review, not approval of a new character design or a change to the 13-piece wardrobe.
- **2026-10-12 (six-checkpoint scope / artwork workflow approval):** Developer approved grouped wardrobe sheets and a small hand-position adjustment, directed the Agent to preserve the selected indie illustration style closely, and will supply the master/long-sleeve seed PNGs in `assets/art/`. Consolidated remaining work into Checkpoint 4 (artwork plus Share/Download), Checkpoint 5 (polish plus Pages deployment), and Checkpoint 6 (peer-informed revisions, debrief, submission). Routine work stays within these checkpoints; each checkpoint still requires Developer verification before its commit. Earlier proposals to defer Share until after the art checkpoint are superseded.
- **2026-10-12 (Checkpoint 4 Agent-owned production):** Developer superseded manual seed/image transfer, authorized the Agent to choose the practical implementation and finish the entire checkpoint, and reaffirmed the approved textured indie style and at least three real outfit variations. Generated one master, three wardrobe atlases, and one weather/reminder atlas with the built-in image tool; prepared/fitted PNG layers and implemented shared compositing/colorways plus native PNG Share/laptop download/recovery. No app dependency/build step added. Preserved source images, prompts, old placeholders, and the Developer's original reference. Keep all work uncommitted for Developer review; six-checkpoint structure unchanged.

## Checkpoint 2 verification

- **Rule checks:** `node --test tests/state.test.mjs`: 16 tests pass, including a 4,800-forecast eligibility grid. Every case has at least 4 distinct garment combinations before color changes. Tests cover exact thresholds, wind ranges/chill, headline priority, snow-only/mixed precipitation, independent random choices, date/location separation, reloading saved choices, changed forecasts, and corrupt/denied storage.
- **Browser checks after interface revisions:** `node tests/browser-check.mjs <path-to-playwright/index.mjs>`: 49 checks pass, covering the single labeled selector control, read-only header, garment-type-only labels, date/reload persistence, rerolls, main/share-card parity, existing states, denied storage, and phone/laptop layouts. With the Developer-approved 80px character minimum in the crowded four-reminder phone state, all 18 headlines paired with the longest reminder wording fit within 375×667. The sampled phone render has no horizontal overflow and its actions end at y=653. Twenty rerolls produced 3 distinct garment combinations without counting color changes.
- **Evidence:** Checkpoint 2 screenshots remain in Git history (`81e6f41`); redundant generated copies were removed in Checkpoint 5. The browser suite can regenerate them.
- **Developer verification:** Developer tested and accepted the recommendation logic, then reviewed the revised single Location & date control and garment-type-only labels and approved Checkpoint 2 in full on 2026-10-12. All three Checkpoint 2 build tasks are complete. Final illustration quality, live location/weather, and Share/Download actions remain later work.

## Checkpoint 3 verification

- **Unit/rule checks:** `node --test tests/state.test.mjs tests/weather.test.mjs tests/location.test.mjs`: 28 tests pass, including the existing 4,800-forecast grid. New coverage includes city/ZIP query fields, US filtering, lookup caching/spacing/cancellation, denied storage, most-recent-location cleanup, device permission/errors, location timezone/DST date keys, NWS day/night pairing, missing data, invalid grid links, HTTP/JSON failures and timeouts.
- **Browser checks:** existing mock/interface suite: 49 checks pass with explicit `?mock&dev`. `node tests/live-browser-check.mjs <path-to-playwright/index.mjs>`: 40 checks pass against controlled provider responses through the actual app, covering all three search submission paths, location/weather/outfit updates, date/reload stability, Share-preview parity, invalid/unmatched/failed searches, real retry wiring, expired daytime recovery, allowed/denied geolocation, device-location persistence/retry after an initial forecast failure, denied storage, and stale-response protection. Long NWS wording plus all headline variants and longest reminders fits 375×667 (worst action bottom y=658.22; no horizontal overflow).
- **Real providers:** `node tests/live-weather-check.mjs` loaded distinct NY/TX NWS grids with seven complete dates in each response. `node tests/live-browser-check.mjs <path-to-playwright/index.mjs> --live`: 8 checks pass through actual browser requests to Nominatim and NWS. At verification, `10001` selected New York, NY (73°F, Sunny); `Austin, TX` selected Austin (93°F, Chance Showers And Thunderstorms), with a different recommendation and saved city restored after reload. These are observations at verification time, not fixed expected temperatures.
- **Evidence:** Checkpoint 3 screenshots remain in Git history (`d753f48`); redundant generated copies were removed in Checkpoint 5. The live browser suite can regenerate them.
- **Developer tests:** use the normal local URL, without mock/condition/view parameters. On first run, search `10001` via Enter/Search, then `Austin, TX` via Done; verify place, NWS weather and suitable outfit update. Also try city `New York, NY` and another ZIP, change dates, reload/reselect a date, check the Share preview, and test `99999`/invalid input. Test device location with allow and deny, and network failure/Retry. If today's daytime period has expired or another date lacks a full pair, verify the message and choose another date. Use `?mock&dev` only for synthetic recommendation tests; plain `?dev` starts live. Approve before committing.
- **Developer approval:** On 2026-10-12 the Developer reported successful ZIP, city, forecast-date, and reload testing and approved Checkpoint 3. Other recovery cases have automated coverage above; no additional manual testing is implied by this record.

## Checkpoint 4 — illustrated artwork and Share/Download

**Goal and scope:** Replace temporary art with generated illustration matching the approved reference, preserving the 13-piece wardrobe, weather rules, independent colors, layout, and Main/card/export parity. Complete weather/reminder art and phone Share/laptop PNG download within this checkpoint. The Developer has authorized Agent-owned production and routine technical choices; present the full result for review before commit.

**Implemented workflow under the latest authorization:**
1. Built-in image generation created a transparent master preserving the selected indie identity/style with visible hands; three transparent wardrobe atlases and one nine-icon atlas use the master/original reference. Exact prompts/provenance are in `assets/art/prompts.md`; `project-3-character/seed-prompts.md` is retained historical guidance, not a current Developer task.
2. `scripts/prepare-art.ps1` crops the generated pieces and derives illustrated base/foreground-hand masks. All visible art pixels are generated; masks and fitting metadata do not draw replacement geometric characters. `js/art.js` handles fitting, outerwear occlusion, head/hat visibility, and cached navy/olive/rust recoloring through the original shading.
3. Main and preview use the same PNG composition as Canvas export. Non-loaded states show a muted complete illustration; no temporary character art is loaded. Existing eligibility, independent selections, and persistence remain in `state.js`.
4. `share.js` prepares a full-resolution PNG when the card opens, waits for fonts/art, and enables actions only when ready. Native Share is called directly from the phone tap with the prepared file; desktop and unsupported/failed phone sharing use actual PNG download. Cancellation, asset failure/retry, and stale async completion are handled.
5. Run rule/interface/live-flow/art-export checks, inspect screenshots/gallery and the downloaded PNG, then request Developer verification of the illustrated result and actual phone share sheet. Keep Checkpoint 4 uncommitted until approval.

**Artwork responsibility:** Agent generation/preparation is complete for the base, existing 13 pieces, and required icons; the Developer reviews the result instead of supplying files. Source/runtime counts remain owned by `spec.md`; no separate garment color images are needed.

**Why retain reusable pieces:** Read-only enumeration of the current rules found 21 distinct clothing-eligibility profiles across temperature, wetness, overnight cold, outerwear, and hat overlaps. Complete-outfit pictures would remove layer alignment but would require more coverage than three pictures for each headline situation, or an approved simplification of the current rules/independent selection. Reuse is possible across profiles, so 21 profiles is not a minimum image count. Grouped garment sheets preserve the existing requirements while shifting preparation work from the Developer to the Agent. The current reference cannot simply be cropped into production layers: it has a painted background and the product drawings differ from the worn character's pose.

## Checkpoint 4 verification

- **Rules/location/weather:** 28 tests pass, including the 4,800-forecast eligibility grid. No weather thresholds, wardrobe eligibility, or independent-choice rules changed.
- **Existing browser regressions after corrections:** 49 interface/mock checks and 41 controlled live-flow checks pass. Synthetic URLs explicitly include `dev`; ordinary browsing ignores all preview overrides even with a saved location. Crowded 375×667 phone layouts remain within the fold (worst tested action bottom y=658.22).
- **Artwork/Share suite:** `node tests/art-share-browser-check.mjs <path-to-playwright/index.mjs>`: 48 checks pass after the Developer-requested integration corrections. Covers all 13 transparent/shaded garments, four same-color combinations across six profiles, three palettes, DOM/export pixel parity within rounding tolerance, actual PNG download, and existing share/recovery behavior. Total controlled browser checks: 138. Top changes affect at least 1,117 clearly different pixels at 200×300 even beneath outerwear. Visual review separately inspected all 24 complete gallery outfits and larger contrasting-color hot/rain/snow outfits, including necklines, waist hems, cuffs/hands, boot overlap, and isolated edge slivers. The earlier passing asset tests did not establish acceptable outfit fit; the Developer rejected that assembly, and these corrections await renewed review.
- **Real data trace:** Normal search → Nominatim coordinates → NWS points → returned NWS grid forecast → selected date's daytime/paired night → recommendation rules. The defect was ungated preview parameters, not a mock fallback in the NWS adapter. Both app mode selection and dev injection now require `dev`. Live browser run: 23 checks passed using actual providers, comparing exact NWS temperature/wording and eligible garments for New York Oct 13/15/18 and Austin Oct 12/13/15/18, 2026. New York's expired Oct 12 daytime forecast correctly showed unavailable feedback. Separate direct NWS smoke check confirmed different OKX/EWX grids. Evidence with source URLs, update timestamps, dates, forecasts, UI values, and outfits: [live-weather.json](verification/checkpoint-4-live-weather.json).
- **Evidence:** Retained [same-color wardrobe combinations](verification/checkpoint-4-wardrobe.png) and [sample downloaded PNG](verification/checkpoint-4-card.png). Other generated screenshots remain in Git history (`997036c`) and are reproducible; see [verification notes](verification/README.md).
- **Developer approval (2026-10-12):** Approved Checkpoint 4 as-is after reviewing the corrections, explicitly accepting remaining clothing-fit/overlap imperfections to conserve time and credits. No further artwork pass is planned. This approval does not imply every suggested manual device test was performed. Commit authorized; final polish/deployment remain Checkpoint 5 and peer revisions/debrief/submission remain Checkpoint 6.

## Checkpoint 5 preparation — essential release work

1. Address only essential responsiveness/accessibility and unfinished Info content/credits/privacy. Keep the approved design and accepted art; verify the existing explicit `dev` gate. Smoke-test Share/Download on available real devices and record any verification gaps honestly.
2. Publish the authorized site-only snapshot to `alr5342/what-to-wear`, branch `gh-pages` at root. Verify relative assets/modules, HTTPS, and normal live weather on the public project URL while holding the main checkpoint commit for review.
3. Optimize the package using the inventory below, then check the app and release archive. The initial audit did not authorize deletion; the subsequent Checkpoint 5 direction explicitly authorized safe removal of unnecessary files. Preserve required files; prefer lossless optimization and excluding reproducible diagnostic output from the submission archive while preserving it in Git. Source art, required references/designs, implementation source, transcripts, licenses, and deliverables must remain available in the final project.
4. Verify the deployed HTTPS release and save the cumulative transcript, then request Developer review before the main Checkpoint 5 commit. After approval, commit/push the checkpoint. Deployment follow-ups remain inside Checkpoint 5.

### Initial size inventory (2026-10-12; uncompressed, excluding .git)

| Material | Approximate size | Proposed treatment in Checkpoint 5 |
|---|---:|---|
| Required reference images and screen drawings | 21.34 MiB | Preserve; investigate reversible/lossless optimization without reducing design legibility |
| Assets (art, fonts, licenses, historical placeholders) | 15.93 MiB | Preserve source and active runtime assets; losslessly optimize PNGs if practical, then verify alpha, texture, layering, and export |
| Character reference and historical prompt notes | 2.14 MiB | Preserve approved source reference and provenance |
| Generated verification screenshots/cards/gallery/JSON | 2.86 MiB | Reproducible evidence; consider archive-only exclusion of nonrequired diagnostic images, retaining evidence in Git and adjusting document links appropriately |
| All transcripts | 0.50 MiB | Preserve, including recovered Claude history and cumulative checkpoints; do not prune required conversations for minor savings |
| Code, documents, tests, scripts | About 0.28 MiB | Preserve sources and useful reproducibility tools; negligible savings from pruning |

Total working project content is approximately **43 MiB before ZIP compression**, not the final download size. SHA-256 comparison found no byte-identical duplicates among assets, reference, character-reference, and verification files. Source atlases (7.22 MiB) and their cropped runtime assets serve different purposes and are not disposable duplicates. The unused `assets/art/hands.png`, `js/placeholder-art.js`, `assets/placeholder/`, and superseded prompt notes are cleanup candidates only after dependency/provenance review and explicit removal approval; expected savings are small. `debug.log`, editor clutter, dependencies, credentials, and local tooling caches are already ignored and must stay untracked. GitHub Download ZIP omits `.git`; `.gitignore` alone does not exclude already tracked files from that ZIP. If archive exclusions are used, test `.gitattributes export-ignore` on the actual downloaded archive and preserve all required material. Do not add generated project ZIPs to the repository.

## Checkpoint 5 implementation and verification

- **Polish:** Completed the five About sections, using Git author name Alex Rosemann for the creator credit pending any Developer correction. Explained daytime forecasts and missing periods, independent recommendations/persistence, method sources, service/storage privacy, and linked bundled licenses. Fixed reference-image links in spec.md. Added a README and `.nojekyll` for a plain static Pages site.
- **Accessibility:** Constrained the existing character container to avoid horizontal overflow with 200% text sizing. No illustration pixels, fit metadata, or approved outfit rules changed. Release audit passed 52 checks across 320×568, 375×667, 390×844, 768×1024, and 1280×900, covering modal focus return, keyboard date changes, About heading focus, download availability, repository-subpath assets, and enlarged text. Sampled text contrast was at least 5.74:1 across the five weather themes; deuteranopia screenshots were visually inspected. This is targeted verification, not a claim of complete accessibility certification.
- **Regression evidence:** 28 unit tests, 49 interface checks, 41 controlled live-flow checks, 48 artwork/share checks, and the 52 release checks passed (190 controlled browser checks total). A further 23 checks against real Nominatim/NWS providers passed, including ZIP/city searches, future dates, exact displayed NWS values, and eligible outfits. Reports: [release audit](verification/checkpoint-5-release.json), [live data evidence](verification/checkpoint-5-local-live-weather.json). These are local/subpath runs; public HTTPS verification is still pending. Physical phone share-sheet/receiving-app verification is not claimed.
- **Lossless optimization:** `scripts/optimize-png.mjs` processed 33 PNGs, reducing 19,573,631 bytes to 17,682,074 bytes (1,891,557 bytes saved). The script verified exact decoded pixel equality and retained metadata, source masters/atlases, and reference art. No lossy resizing, new artwork, or history rewrite occurred.
- **Authorized cleanup:** Removed the unused hand-mask PNG, geometric placeholder JS/six SVGs, local debug output, and 15 reproducible older screenshot files. The active base includes the hands. Retained the representative wardrobe gallery/card, compact JSON evidence, all artwork sources, required references/designs, licenses, documents, tests, and every transcript. Git history preserves removed tracked files. Browser screenshots, diagnostic logs, local staging, and generated ZIPs are ignored to avoid reintroducing clutter.
- **Package verification:** A 117-file local candidate measured 41,300,510 bytes uncompressed and 40,418,781 bytes zipped (38.5 MiB / 40.4 MB). Required app/source/document files were present; no Git database, credentials, dependencies, nested ZIPs, or diagnostic logs were included. The extracted candidate ran over HTTP, loaded its modules/assets, downloaded a PNG, and showed all five About sections without errors. This is an approximate final repository ZIP size, not a GitHub-downloaded archive; final transcript/report additions may change it slightly. Evidence: [package report](verification/checkpoint-5-package.json). Temporary archive/extraction staging was removed after verification.
- **Deployment status:** Created the Developer-authorized public repository [alr5342/what-to-wear](https://github.com/alr5342/what-to-wear), pushed approved Checkpoint 4 main (`997036c`), and published a separate site-only `gh-pages` snapshot (`04c44ba`), followed by the enlarged-text accessibility fix (`e2c186d`). GitHub reports Pages built successfully from `gh-pages` root with HTTPS enforced. Public URL: https://alr5342.github.io/what-to-wear/. The public real-provider suite passed 23 checks for ZIP/city search, distinct NWS forecasts, selected future days, and reload persistence. The public release audit exposed an enlarged-text action-button overflow; corrected button shrinking/wrapping, then passed all 52 release checks on the updated public site (five viewport sizes, keyboard/focus, downloads, enlarged text, licenses, asset loading, and sampled contrast minimum 5.74:1). Evidence: [public release report](verification/checkpoint-5-release.json) and [live forecast comparisons](verification/checkpoint-5-public-live-weather.json). Native OS sharing still needs a supported physical phone; instrumented coverage and actual PNG download passed previously. The Developer reviewed and approved Checkpoint 5; committed/pushed to main as `d3854f6`. The public HTTPS app returned HTTP 200 after the push, and Pages continues to use `gh-pages` (`e2c186d`). No additional device-specific testing is inferred from approval.
- **Interrupted-run recovery:** Resumed from the existing working tree and retained passing checks; did not repeat completed implementation, research, or testing merely because reasoning effort changed.

## Checkpoint 6 preparation — evidence and submission

1. Three brief peer reviews are reported complete; aggregate findings and the limits of supplied individual details are recorded above. Review the targeted recommendation/date-recovery fixes, then obtain Developer approval before committing/redeployment. Update `spec.md` only if intended behavior changes; record implementation findings and revision evidence here.
2. The authoritative `debrief.md` protocol is now present; preserve it unchanged. After peer testing and the supported revision, start a fresh chat with: `Read ./debrief.md in full and follow it as the authoritative protocol. Begin the Project 3 debrief now. If you cannot locate or read that file, say so and stop.` Conduct the real conversation and save its transcript; do not invent responses or mark the debrief complete now.
3. Audit updated `spec.md` and `plan.md`, three peer notes/findings/improvement, public HTTPS URL, source/reference/license files, implementation transcripts, completed debrief and transcript, and `commit-log.txt`.
4. A provisional `commit-log.txt` now records main history through Checkpoint 5 (`d3854f6`) with full IDs, dates, and messages, without patches/code. Regenerate it after the final approved substantive work. Export plain text using `git log --date=iso-strict --format="Commit: %H%nAuthor date: %aI%nCommit date: %cI%n%B%n"` with UTF-8 output; no `--patch`, diff, or source code. Generate after the approved substantive commits. The export records history through its stated source HEAD; its own subsequent metadata-only commit cannot contain its own hash. Record that cutoff honestly and retain complete history on GitHub.
5. Obtain final checkpoint approval before commit, push every final project file and verify remote HEAD/clean status. Download **Code → Download ZIP** from the completed repository; inspect deliverables, size, and working assets, and test the extracted app over HTTP. The GitHub archive, rather than a hand-pruned local ZIP, is the submission. Actual submission remains under Developer direction. Keep completion and export housekeeping within these same six checkpoints.

## Approval

Approved by the Developer on 2026-10-04, along with the supporting updates to `research.md` (geocoding provider) and `spec.md` (requirement #5). The planning phase is complete; implementation begins in a separate conversation.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

**Standing Developer instruction (2026-10-12; applies to future conversations):** Save a complete, cumulative implementation-conversation snapshot after every checkpoint and at the end of an implementation chat or handoff. Save when reporting a checkpoint ready for Developer verification, and again after receiving its approval, corrections, or follow-up decisions. Do not wait for a separate `save transcript` request. Also honor that request whenever the Developer makes it.

Use a new timestamped Markdown file in `transcripts/`, such as `build-codex-YYYY-MM-DD_HHMMSS.md` or `build-claude-YYYY-MM-DD_HHMMSS.md`, using America/Chicago time and a unique suffix if necessary. Preserve earlier snapshots. Label chat messages `Developer` and `Agent`; include all recorded chat text from the current conversation's beginning, structured questions/options/answers, verification reports, approvals, and subsequent decisions. Keep verbatim text rather than replacing the conversation with a summary. Disclose omitted image binaries and routine tool logs.

Prefer the local session history when accessible. Verify that the opening request and latest decisions are present, and confirm the saved path. If the history is unavailable or incomplete, explicitly report the gap and request the missing conversation/export; never claim a complete transcript from a summary. Before ending a chat, include the final report in the snapshot where possible. This is an Agent workflow instruction, not an installed background autosave service.

- **Checkpoint 5 approval:** Developer reviewed and approved Checkpoint 5, authorized committing/pushing its remaining changes to main, and directed preparation of Checkpoint 6 without another major implementation pass. Keep the existing six-checkpoint structure and accepted artwork. Peer reviews have now been reported; revision approval, debrief, and final archive audit remain pending.

- **Checkpoint 6 preparation:** Existing P1/P2/P3 task/observation templates are ready; the Developer has now reported three brief reviews and aggregate findings; targeted revisions are approved, committed, and deployed. The supplied debrief protocol is present and unchanged. Start its required fresh chat after testing/revision. Cumulative implementation transcripts are retained; refresh the provisional commit log and audit the final GitHub Download ZIP after final approval/push. Usability documentation and the unchanged debrief protocol are committed; final debrief/log/ZIP housekeeping remains pending.

## Checkpoint 6 targeted verification

- `node --test tests/state.test.mjs tests/weather.test.mjs`: **24 tests passed**, including 4,800 weather/threshold combinations with at least three real garment combinations, warm dry/rainy/windy days, cold overnight lows, snow, saved-choice revalidation, timezone dates, and missing-Today/future selection.
- Controlled `tests/live-browser-check.mjs`: **47 checks passed** through the actual app, including device coordinates with available Today, expired Today automatic fallback and explicit notice, chosen future dates, location labels, reload/retry, denied permission recovery, and actual-date weather selection. The existing crowded-phone check still fits at y=658.22 in 375x667 with no horizontal overflow. This run used intercepted provider responses to reproduce the failure efficiently; it is not a new live-provider or physical-device verification.
- Initial browser assertion failed because the new degree symbol was corrupted by the shell encoding; corrected assertions to Unicode escapes and the rerun passed. No additional implementation change was needed for that failure.
- Evidence: [targeted verification report](verification/checkpoint-6-targeted.json). Updated the existing art-suite combination enumerator to support three warm combinations; did not rerun the full artwork/share audit or alter accepted art.
- **Review status:** The Developer reviewed and approved these usability revisions and authorized commit/push/redeployment. Verify the public HTTPS app after deployment, including new recommendation rules and device-location date handling. Browser permission, connectivity, NWS service errors, and absence of all complete forecasts still require honest error/retry feedback; no software change can guarantee provider availability. After approval: commit/redeploy the supported revision, conduct the required fresh-chat debrief, refresh commit-log.txt, and audit the final pushed GitHub ZIP. Exactly six checkpoints remain.

**Checkpoint 6 usability revision approval:** The Developer approved the fixes and peer documentation, directed their commit/push and Pages redeployment, and will start the required debrief in a fresh chat following debrief.md exactly. This approval does not complete the debrief, final commit-log export, or submission ZIP audit. Artwork remains unchanged.

## Checkpoint 6 public deployment verification

- Approved usability fixes and peer documentation committed/pushed to main as `cbce6f9683470f587a6c2a8b61c2a4cfc35d2a97`. Runtime deployed on gh-pages as `861404a97ce23887d58ad5e9d950743504c45783`; public URL: https://alr5342.github.io/what-to-wear/.
- All four changed public files returned HTTP 200 and exactly matched approved source after newline normalization. No artwork changed.
- Public controlled browser suite: **47 checks passed**, including device location with available Today, expired Today fallback, future selection, and location/date recovery. Public real-provider suite: **24 checks passed**, including actual New York/Austin NWS forecasts, outfit eligibility, selected future days, reload, and an actual missing-Today response in Austin with correctly labeled next-date fallback. Physical phone permission/share behavior was not newly verified.
- Updated the live test expectation that previously required an error for missing Today; the first run stopped on this obsolete expectation, and the updated rerun passed. No new app changes were required. Evidence: [deployment/source matches](verification/checkpoint-6-public-deployment.json), [real forecast comparisons](verification/checkpoint-6-public-live-weather.json).
- **Debrief handoff:** Do not conduct the debrief in this implementation conversation. The Developer will open a fresh chat and use the exact start command in the unchanged debrief.md. The debrief conversation/transcript, final commit-log.txt refresh, final push, and GitHub Code -> Download ZIP audit remain pending within Checkpoint 6. Do not mark the full checkpoint or submission complete yet.

## Final submission audit — 2026-10-12

**Authorization and scope:** The Developer confirmed the completed/saved debrief and directed verification, generation of commit-log.txt, remaining commits, push to main, clean-tree/remote checks, and public HTTPS verification. This is submission housekeeping within Checkpoint 6. No application code, artwork, or behavior was changed.

**Required materials verified:** brief.md, research.md, updated spec.md and plan.md, debrief.md, seven visual references and sixteen phone/laptop screen drawings, character reference, production/source artwork and provenance, fonts/licenses, implementation source, research/specification/planning transcripts, cumulative implementation transcripts, and the completed [debrief transcript](transcripts/debrief-2026-10-12_224129.md) are present. Three peer reviews and their aggregate findings/approved improvements are documented in this plan. The debrief was checked against its local session record: all discussion and save-direction messages are present; only the later file-path confirmation lies outside its disclosed snapshot. Preserve the original transcript unchanged.

**Fresh verification:** All 30 location/weather/recommendation unit tests passed, including 4,800 forecast combinations. The public HTTPS release suite passed all 52 checks with minimum sampled text contrast 5.74:1, across phone/laptop viewports, keyboard/focus, enlarged text, share-card preparation, and asset/license loading. Prior public real-provider verification is retained in checkpoint-6-public-live-weather.json; this final release run did not repeat geocoder searches. The public runtime remains the approved gh-pages deployment at 861404a97ce23887d58ad5e9d950743504c45783.

**Debrief evidence and limits:** The Developer reports successful laptop PNG downloads and mobile sharing with an image received by a friend. This updates earlier pending manual-share notes without claiming Agent observation. Individual peer dates/devices/task results were not supplied. Thorough one-handed testing, personal keyboard/screen-reader verification, direct source checking, and recorded before/after forecast examples remain limited. Automated keyboard/focus/contrast checks are separate evidence. Garment alignment remains accepted. The additional share feature's justification is already recorded in research.md → Project decisions: it supports the client's social-engagement campaign without a second data source; the debrief's uncertainty does not imply that documentation is missing. The proposed “Today” label remains a future idea.

**History and final delivery checks:** Export full commit IDs, author/commit dates, and complete messages for all fetched branches, with no patches/code, after the substantive submission-record commit. State the exact main and gh-pages cutoffs in commit-log.txt. Its containing metadata commit cannot include its own hash; GitHub retains that final history. Push main, compare remote/local HEAD and clean status, then download GitHub's main ZIP, compare its files with the committed tree, and run the extracted app over HTTP. Final push/archive results are reported in the finalization handoff; unchecked checklist entries above are retained wherever broader manual verification or that final handoff was not yet established at this snapshot. Actual submission remains the Developer's action.

**GitHub archive result:** Downloaded main's GitHub-generated ZIP after submission-record commit a44d422751a15d8e1a14aa9400629d7208f91986. All 132 files matched the committed tree byte for byte (41,845,448 bytes uncompressed); no Git database, credential filenames, dependencies, nested archives, or diagnostic logs were present. The extracted app passed all 52 release checks over local HTTP (minimum sampled contrast 5.74:1). The commit log is added in the subsequent metadata commit, so the final ZIP is downloaded again after that push and checked against the final committed tree. Runtime files remain unchanged.

**Final history export:** commit-log.txt now contains all 11 unique available commits across main and the fetched gh-pages history, including full IDs, author/commit dates, and complete messages without code. Main cutoff: a44d422751a15d8e1a14aa9400629d7208f91986; deployment cutoff: 861404a97ce23887d58ad5e9d950743504c45783. The export's own metadata commit is necessarily outside that cutoff. Remaining evidence limitations above are disclosed rather than fabricated. No required deliverable file is missing; final remote/clean-tree/archive checks are reported in the handoff, and actual submission remains with the Developer.

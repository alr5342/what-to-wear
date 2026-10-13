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

**Current task order:** Exactly six checkpoints. Checkpoints 1–3 are committed; the Developer approved Checkpoint 4 as-is on 2026-10-12 and authorized its commit. Residual clothing alignment issues are an accepted visual limitation; do not spend further time or credits on artwork. Checkpoint 5 covers essential polish, GitHub Pages deployment, and project-size optimization. Checkpoint 6 covers three real peer sessions, a supported improvement, debrief, transcripts, commit log, and final repository/ZIP submission audit. Each remaining checkpoint still requires Developer approval before committing. No new major implementation is authorized by this documentation/commit handoff.

## Six-checkpoint schedule

| Checkpoint | Scope and completion evidence | Status |
|---|---|---|
| 1 | Static UI shell, screens/states, responsive layout | Approved; `ec95a08` |
| 2 | Weather-matched recommendations, independent variations/persistence, approved interface refinements | Approved; `81e6f41` |
| 3 | Working city/ZIP/device location, live NWS weather, saved location, recovery | Approved; `d753f48` |
| 4 | Illustrated character/13-piece wardrobe, weather/reminder artwork, three colorways, phone Share/laptop PNG download, and strict development-only mocks | Approved as-is 2026-10-12; residual alignment limitation accepted; commit authorized |
| 5 | Essential responsive/accessibility and Info/credits/privacy polish, GitHub Pages setup and deployed checks, safe project-size optimization, peer-test readiness | Prepared; implementation pending |
| 6 | Three real peer sessions and findings, supported improvement/redeployment, completed debrief and transcript, implementation transcripts, commit-log.txt, final pushed repository and GitHub Download ZIP audit | Prepared; sessions and deliverables pending |

**Review and commit rule:** The Developer verifies and approves each checkpoint before its commit. Seed reviews, routine fixes, tests, transcript snapshots, and deployment follow-ups stay within their owning checkpoint; do not create additional numbered checkpoints. For Checkpoint 5, present the local release candidate and concrete repository/Pages target for review before committing/publishing, then verify the deployed version with the Developer. Checkpoint 6 revisions must also be reviewed before their commit/redeployment. No checkpoint is complete merely because a subset is ready.

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
- [ ] **Checkpoint 5:** Responsive/accessibility pass: one-handed phone reachability, laptop two-column layout, icon shape-plus-color distinction, 3:1 contrast check (spec #18–21)
- [ ] **Checkpoint 5:** Build out the Info/credits screen's 5 sections with real content (spec #22–23), including final art source/tool attribution
- [ ] **Checkpoint 5:** Gate or remove the developer override from the normal UI path before peer testing
- [ ] **Checkpoint 5:** Audit package size, optimize safely, preserve required deliverables/source/transcripts, and verify the GitHub-generated ZIP contents (see release preparation below)
- [ ] **Checkpoint 5:** Prepare the GitHub repository/remote and Pages target (proposed: `main` branch, repo root — no build step); obtain Developer verification/approval of the local release candidate and concrete target before commit/publication
- [ ] **Checkpoint 5:** Publish to GitHub Pages, verify live assets/location/weather/share/privacy and HTTPS behavior on phone/laptop, and prepare the existing peer-test protocol; report the deployed URL and save the transcript. Keep deployment corrections within this checkpoint, with review before committing fixes.

### Verify and revise

- [ ] Check every specification requirement (#1–24) against the deployed app, not only the local copy
- [ ] Using the developer override, test every recommendation-category and reminder threshold in `spec.md` (both just-crossing and just-under each boundary), across multiple locations and both current and forecast dates
- [ ] Verify weather-matched clothing, reminder, and headline variations are chosen independently, not as fixed pairs, by holding forecast conditions fixed (via the override) across repeated/different location+date loads; include overlapping conditions to verify headline priority and pool suitability
- [ ] Verify that returning to a previously selected date — including after a full page reload — shows the same variations
- [ ] Test the three failure states (slow/throttled network, a forced failed fetch, and a denied location prompt) and confirm each recovery action works
- [ ] Test the deployed app, independently of the local version, on a real phone and a real laptop: one-handed reachability of date/location/Share, the laptop two-column layouts, the native Share sheet on phone, PNG download on laptop, a color-blindness simulation, and contrast
- [ ] Confirm the developer override is gated/removed before peer sessions
- [ ] Prepare the usability test below
- [ ] **Checkpoint 6:** Test the approved deployed version with three peers and record each session
- [ ] **Checkpoint 6:** Add the chosen evidence-supported improvement to this checklist, and update `spec.md` if the intended result changes
- [ ] **Checkpoint 6:** Implement and verify at least one meaningful revision; obtain Developer review/approval before committing and redeploying it

### Deliver

- [ ] **Checkpoint 6:** Confirm all brief deliverables, public URL, peer notes/revision evidence, sources, privacy information, and asset credits; prepare submission materials
- [ ] **Checkpoint 6:** Complete the debrief using the provided `debrief.md` instructions when available, with the Developer's own decisions and verification reflected accurately
- [ ] **Checkpoint 6:** Save the completed debrief conversation in `transcripts/`, retain implementation transcripts, and generate plain-text `commit-log.txt` with full commit IDs, dates, and complete commit messages, without patches/code
- [ ] **Checkpoint 6:** Commit and push all final project files after approval; audit the completed repository's **Code → Download ZIP** archive as the submission artifact
- [ ] **Checkpoint 6:** Obtain Developer verification/approval of final documentation/submission readiness before the final commit; save all implementation/debrief transcripts. Actual submission follows the Developer's explicit direction.

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

### Peer session records — not yet conducted

| Peer | Date / deployed URL or revision | Device / browser | Task observations and quotes | Success / barrier | Finding supported by observation |
|---|---|---|---|---|---|
| P1 | Pending | Pending | Pending — record each task above | Pending | Pending |
| P2 | Pending | Pending | Pending — record each task above | Pending | Pending |
| P3 | Pending | Pending | Pending — record each task above | Pending | Pending |

**Findings synthesis:** Pending all three real sessions. Record recurring issues, affected tasks, and peer evidence; distinguish observations from interpretation.

**Resulting improvement:** Pending findings. Record the chosen issue and supporting peer/task notes, before/after behavior, files changed, verification result, Developer approval, revision commit, and redeployed URL. Do not invent sessions, quotes, results, or an improvement before evidence exists.

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
- **Evidence:** [Phone screenshot](verification/checkpoint-2-phone.png), [laptop screenshot](verification/checkpoint-2-laptop.png), regenerated after the passing expanded check. These use temporary art; the developer toolbar is hidden in the phone screenshot so the application layout is visible.
- **Developer verification:** Developer tested and accepted the recommendation logic, then reviewed the revised single Location & date control and garment-type-only labels and approved Checkpoint 2 in full on 2026-10-12. All three Checkpoint 2 build tasks are complete. Final illustration quality, live location/weather, and Share/Download actions remain later work.

## Checkpoint 3 verification

- **Unit/rule checks:** `node --test tests/state.test.mjs tests/weather.test.mjs tests/location.test.mjs`: 28 tests pass, including the existing 4,800-forecast grid. New coverage includes city/ZIP query fields, US filtering, lookup caching/spacing/cancellation, denied storage, most-recent-location cleanup, device permission/errors, location timezone/DST date keys, NWS day/night pairing, missing data, invalid grid links, HTTP/JSON failures and timeouts.
- **Browser checks:** existing mock/interface suite: 49 checks pass with explicit `?mock&dev`. `node tests/live-browser-check.mjs <path-to-playwright/index.mjs>`: 40 checks pass against controlled provider responses through the actual app, covering all three search submission paths, location/weather/outfit updates, date/reload stability, Share-preview parity, invalid/unmatched/failed searches, real retry wiring, expired daytime recovery, allowed/denied geolocation, device-location persistence/retry after an initial forecast failure, denied storage, and stale-response protection. Long NWS wording plus all headline variants and longest reminders fits 375×667 (worst action bottom y=658.22; no horizontal overflow).
- **Real providers:** `node tests/live-weather-check.mjs` loaded distinct NY/TX NWS grids with seven complete dates in each response. `node tests/live-browser-check.mjs <path-to-playwright/index.mjs> --live`: 8 checks pass through actual browser requests to Nominatim and NWS. At verification, `10001` selected New York, NY (73°F, Sunny); `Austin, TX` selected Austin (93°F, Chance Showers And Thunderstorms), with a different recommendation and saved city restored after reload. These are observations at verification time, not fixed expected temperatures.
- **Evidence:** [Phone with long forecast/reminders](verification/checkpoint-3-phone.png), [laptop](verification/checkpoint-3-laptop.png), [real-provider phone](verification/checkpoint-3-live-phone.png). All still use temporary artwork.
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
- **Evidence:** [Laptop](verification/checkpoint-4-laptop.png), [phone](verification/checkpoint-4-phone.png), [same-color wardrobe combinations](verification/checkpoint-4-wardrobe.png), [actual downloaded PNG](verification/checkpoint-4-card.png), [laptop card](verification/checkpoint-4-share-laptop.png), [phone fallback](verification/checkpoint-4-share-phone.png).
- **Developer approval (2026-10-12):** Approved Checkpoint 4 as-is after reviewing the corrections, explicitly accepting remaining clothing-fit/overlap imperfections to conserve time and credits. No further artwork pass is planned. This approval does not imply every suggested manual device test was performed. Commit authorized; final polish/deployment remain Checkpoint 5 and peer revisions/debrief/submission remain Checkpoint 6.

## Checkpoint 5 preparation — essential release work

1. Address only essential responsiveness/accessibility and unfinished Info content/credits/privacy. Keep the approved design and accepted art; verify the existing explicit `dev` gate. Smoke-test Share/Download on available real devices and record any verification gaps honestly.
2. Establish the intended GitHub owner/repository and Pages target; no Git remote is currently configured. Prepare the concrete local release candidate and deployment settings for Developer approval before the checkpoint commit/publication. Use relative asset/module paths, HTTPS, and normal live weather on the Pages project URL.
3. Optimize the package using the inventory below, then check the app and release archive. No deletion is authorized by this audit. Confirm specific removals before deleting; prefer lossless optimization and excluding reproducible diagnostic output from the submission archive while preserving it in Git. Source art, required references/designs, implementation source, transcripts, licenses, and deliverables must remain available in the final project.
4. After approval, commit/push, configure Pages, verify the public phone/laptop location/date/weather/card flows, and provide the deployed HTTPS URL for peer sessions. Save the cumulative transcript; deployment follow-ups remain inside Checkpoint 5.

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

## Checkpoint 6 preparation — evidence and submission

1. Run and record P1/P2/P3 above on the deployed app. Summarize findings and implement at least one supported improvement, with verification and Developer review before committing/redeployment. Update `spec.md` only if intended behavior changes; record implementation findings and revision evidence here.
2. Obtain the provided `debrief.md` instructions (file currently absent), conduct the actual reflective conversation with the Developer, complete its required responses, and save the full debrief transcript. Do not substitute an Agent-written fictional conversation.
3. Audit updated `spec.md` and `plan.md`, three peer notes/findings/improvement, public HTTPS URL, source/reference/license files, implementation transcripts, completed debrief and transcript, and `commit-log.txt`.
4. Export plain text using `git log --date=iso-strict --format="Commit: %H%nAuthor date: %aI%nCommit date: %cI%n%B%n"` with UTF-8 output; no `--patch`, diff, or source code. Generate after the approved substantive commits. The export records history through its stated source HEAD; its own subsequent metadata-only commit cannot contain its own hash. Record that cutoff honestly and retain complete history on GitHub.
5. Obtain final checkpoint approval before commit, push every final project file and verify remote HEAD/clean status. Download **Code → Download ZIP** from the completed repository; inspect deliverables, size, and working assets, and test the extracted app over HTTP. The GitHub archive, rather than a hand-pruned local ZIP, is the submission. Actual submission remains under Developer direction. Keep completion and export housekeeping within these same six checkpoints.

## Approval

Approved by the Developer on 2026-10-04, along with the supporting updates to `research.md` (geocoding provider) and `spec.md` (requirement #5). The planning phase is complete; implementation begins in a separate conversation.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

**Standing Developer instruction (2026-10-12; applies to future conversations):** Save a complete, cumulative implementation-conversation snapshot after every checkpoint and at the end of an implementation chat or handoff. Save when reporting a checkpoint ready for Developer verification, and again after receiving its approval, corrections, or follow-up decisions. Do not wait for a separate `save transcript` request. Also honor that request whenever the Developer makes it.

Use a new timestamped Markdown file in `transcripts/`, such as `build-codex-YYYY-MM-DD_HHMMSS.md` or `build-claude-YYYY-MM-DD_HHMMSS.md`, using America/Chicago time and a unique suffix if necessary. Preserve earlier snapshots. Label chat messages `Developer` and `Agent`; include all recorded chat text from the current conversation's beginning, structured questions/options/answers, verification reports, approvals, and subsequent decisions. Keep verbatim text rather than replacing the conversation with a summary. Disclose omitted image binaries and routine tool logs.

Prefer the local session history when accessible. Verify that the opening request and latest decisions are present, and confirm the saved path. If the history is unavailable or incomplete, explicitly report the gap and request the missing conversation/export; never claim a complete transcript from a summary. Before ending a chat, include the final report in the snapshot where possible. This is an Agent workflow instruction, not an installed background autosave service.

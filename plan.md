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

**Structure:** Plain HTML/CSS/JS, no framework, no build step (per `research.md`). Rough module split: `app.js` (wiring/render loop), `weather.js` (Census geocoding + NWS calls), `state.js` (recommendation-state computation, variation selection, localStorage persistence), `ui.js` (DOM rendering for all screens/states), `share.js` (outfit card + Share/Download). One `index.html`, responsive via CSS (no separate phone/laptop builds).

**Data flow:** Typed city/zip → US Census Bureau Geocoding Services API → lat/lon, *or* device Geolocation API → lat/lon directly → NWS `/points/{lat},{lon}` → `/gridpoints/{office}/{x},{y}/forecast` → recommendation-state object (per `spec.md`) → persisted to `localStorage` keyed by `location+date` → renders Main, Share card, and (independently) Info screens, all reading only from that one state object.

**Dependencies:** `api.weather.gov` (NWS, no key), `geocoding.geo.census.gov` (Census geocoder, no key — added during planning, see `research.md` Revisions), browser Geolocation API, `localStorage`, Web Share API (phone) and Canvas-based PNG export (laptop) for the share card, an SVG icon library (e.g., Lucide, MIT) for UI chrome only, AI-generated art for character/outfit/weather/reminder assets.

**Current task order:** static UI shell (Checkpoint 1 approved), recommendation logic against mock data with developer overrides (Checkpoint 2 approved), then live location/weather (Checkpoint 3; present scope and verification steps before implementation). The Developer has deferred actual artwork to a later checkpoint: approve and validate an illustrated seed set before generating the remaining art. See Build checklist below.

**Main risks:**
- NWS grid resolution can fail or return unexpected shapes near coastal/territory boundaries — covered by the existing service-error state (#16).
- The Census geocoder can return multiple or zero matches for an ambiguous/misspelled place name — plan is to use the first/best match and fall through to the existing error state on zero matches, rather than building a disambiguation UI (keeps scope as specified).
- Wind-speed strings ("10 to 15 mph") need upper-bound parsing for both the outerwear rule and the wind-chill formula — isolate this in one helper function and unit-check it directly.
- Asset generation is a fully manual, non-automated pipeline (download from ChatGPT, add to repo by hand) — sequencing a seed set first (base character + one weather-matched clothing pool) de-risks the layering approach before committing to the expanded asset set. The current estimate is maintained in `spec.md` → Assets.
- The hidden developer override is for testing only, not a security boundary — acceptable for a client-side prototype with no real user data, but it must be removed or clearly gated before peer usability testing so testers don't stumble into it.
- `localStorage` grows one entry per location+date visited with no cap — acceptable for a prototype/demo; not worth building cleanup logic for an out-of-scope concern.

## Checklist

### Approvals

- [x] Research approved (2026-10-04)
- [x] Specification approved (2026-10-04)
- [x] Plan approved (2026-10-04)

### Build

- [x] Initialize the local git repository and add a `.gitignore` (2026-10-05; GitHub remote and Pages setup moved to the deploy step, see Revisions)
- [ ] In the later artwork checkpoint, generate the polished illustrated seed set (base character, neutral pose, + one reusable clothing piece), obtain Developer approval of the visual direction, and validate transparent layering and 3 renderer-applied colorways before producing the remaining art. Follow `spec.md` → Assets; replace the geometric placeholders completely.
- [x] Build the static UI shell for every screen/state from the approved drawings (Main: loaded, first-run, loading, error, permission-denied; Location & date selector; Share/outfit card; Info/credits), phone and laptop layouts, using placeholders for any asset not yet generated. *Checkpoint 1 — tested and approved by the Developer on laptop and phone, 2026-10-05; committed as `ec95a08`.*
- [x] Implement the recommendation-state object, reusable wardrobe eligibility, priority-based headline, and category/reminder rules from `spec.md` against hand-written mock forecast data, including the hidden developer override for injecting temp/wind/precip values. *Checkpoint 2 — tested and approved by the Developer on 2026-10-12, including the interface revisions. Includes this task and the next two; at least 4 distinct garment combinations per weather category before colors.*
- [x] Wire character art, condition icon, headline, Wearing list, and reminders to read only from the recommendation-state object (spec #8) — confirmed against mock data; temporary artwork pending the later art checkpoint
- [x] Implement independent random garment, colorway, reminder, and headline selection, with `localStorage` persistence keyed by `location+date` (spec #11–12)
- [ ] **Checkpoint 3 — live location and weather:** integrate typed city/ZIP lookup, device Geolocation API, and NWS `/points` + `/gridpoints/.../forecast`, replacing Austin mock data. First verify the planned Census geocoder supports city-only and ZIP-only input from the browser; if a provider change is needed, bring the evidence and proposed replacement to the Developer before implementation. Verify a New York ZIP changes the location label, coordinates, forecast, and recommendation persistence key; invalid input must give feedback rather than silently keeping Austin.
- [ ] Implement most-recent-location-only persistence and the first-run state (spec #6–7)
- [ ] Implement loading, service-error, and permission-denied states with working recovery actions (spec #15–17)
- [ ] Implement the Share/outfit card overlay with the platform-specific action: native Web Share on phone, PNG download on laptop (spec #13–14)
- [ ] After Developer approval of the illustrated seed set, generate and swap in the remaining reusable wardrobe pieces, weather condition icons, and reminder icons from the asset list in `spec.md`; verify consistent illustration quality, alignment, and visible outfit differences. No geometric character or garment placeholders remain in the finished app.
- [ ] Responsive/accessibility pass: one-handed phone reachability, laptop two-column layout, icon shape-plus-color distinction, 3:1 contrast check (spec #18–21)
- [ ] Build out the Info/credits screen's 5 sections with real content (spec #22–23)
- [ ] Gate or remove the developer override from the normal UI path before peer testing
- [ ] Commit at each working checkpoint above
- [ ] Create the GitHub repository, connect the remote, and confirm the GitHub Pages target (proposed: `main` branch, repo root — no build step)
- [ ] Deploy to GitHub Pages once the core flow (location → forecast → recommendation) works end-to-end locally, then redeploy after each later checkpoint

### Verify and revise

- [ ] Check every specification requirement (#1–24) against the deployed app, not only the local copy
- [ ] Using the developer override, test every recommendation-category and reminder threshold in `spec.md` (both just-crossing and just-under each boundary), across multiple locations and both current and forecast dates
- [ ] Verify weather-matched clothing, reminder, and headline variations are chosen independently, not as fixed pairs, by holding forecast conditions fixed (via the override) across repeated/different location+date loads; include overlapping conditions to verify headline priority and pool suitability
- [ ] Verify that returning to a previously selected date — including after a full page reload — shows the same variations
- [ ] Test the three failure states (slow/throttled network, a forced failed fetch, and a denied location prompt) and confirm each recovery action works
- [ ] Test the deployed app, independently of the local version, on a real phone and a real laptop: one-handed reachability of date/location/Share, the laptop two-column layouts, the native Share sheet on phone, PNG download on laptop, a color-blindness simulation, and contrast
- [ ] Confirm the developer override is gated/removed before peer sessions
- [ ] Prepare the usability test below
- [ ] Test with three peers and record each session
- [ ] Add the chosen improvement to this checklist, and update `spec.md` if the intended result changes
- [ ] Implement, verify, and redeploy at least one meaningful revision

### Deliver

- [ ] Confirm all brief deliverables, sources, privacy information, and asset credits
- [ ] Save all chat transcripts
- [ ] Complete the debrief

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

## Checkpoint 2 verification

- **Rule checks:** `node --test tests/state.test.mjs`: 16 tests pass, including a 4,800-forecast eligibility grid. Every case has at least 4 distinct garment combinations before color changes. Tests cover exact thresholds, wind ranges/chill, headline priority, snow-only/mixed precipitation, independent random choices, date/location separation, reloading saved choices, changed forecasts, and corrupt/denied storage.
- **Browser checks after interface revisions:** `node tests/browser-check.mjs <path-to-playwright/index.mjs>`: 49 checks pass, covering the single labeled selector control, read-only header, garment-type-only labels, date/reload persistence, rerolls, main/share-card parity, existing states, denied storage, and phone/laptop layouts. With the Developer-approved 80px character minimum in the crowded four-reminder phone state, all 18 headlines paired with the longest reminder wording fit within 375×667. The sampled phone render has no horizontal overflow and its actions end at y=653. Twenty rerolls produced 3 distinct garment combinations without counting color changes.
- **Evidence:** [Phone screenshot](verification/checkpoint-2-phone.png), [laptop screenshot](verification/checkpoint-2-laptop.png), regenerated after the passing expanded check. These use temporary art; the developer toolbar is hidden in the phone screenshot so the application layout is visible.
- **Developer verification:** Developer tested and accepted the recommendation logic, then reviewed the revised single Location & date control and garment-type-only labels and approved Checkpoint 2 in full on 2026-10-12. All three Checkpoint 2 build tasks are complete. Final illustration quality, live location/weather, and Share/Download actions remain later work.

## Approval

Approved by the Developer on 2026-10-04, along with the supporting updates to `research.md` (geocoding provider) and `spec.md` (requirement #5). The planning phase is complete; implementation begins in a separate conversation.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

**Standing Developer instruction (2026-10-12; applies to future conversations):** Save a complete, cumulative implementation-conversation snapshot after every checkpoint and at the end of an implementation chat or handoff. Save when reporting a checkpoint ready for Developer verification, and again after receiving its approval, corrections, or follow-up decisions. Do not wait for a separate `save transcript` request. Also honor that request whenever the Developer makes it.

Use a new timestamped Markdown file in `transcripts/`, such as `build-codex-YYYY-MM-DD_HHMMSS.md` or `build-claude-YYYY-MM-DD_HHMMSS.md`, using America/Chicago time and a unique suffix if necessary. Preserve earlier snapshots. Label chat messages `Developer` and `Agent`; include all recorded chat text from the current conversation's beginning, structured questions/options/answers, verification reports, approvals, and subsequent decisions. Keep verbatim text rather than replacing the conversation with a summary. Disclose omitted image binaries and routine tool logs.

Prefer the local session history when accessible. Verify that the opening request and latest decisions are present, and confirm the saved path. If the history is unavailable or incomplete, explicitly report the gap and request the missing conversation/export; never claim a complete transcript from a summary. Before ending a chat, include the final report in the snapshot where possible. This is an Agent workflow instruction, not an installed background autosave service.

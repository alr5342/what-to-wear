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

**Task order (agreed this session):** seed a small asset set first to validate the art pipeline, then build the static UI shell, then recommendation logic against mock data (using a hidden developer override to hit every threshold on demand), then live data, then the remaining polish/asset items — see Build checklist below.

**Main risks:**
- NWS grid resolution can fail or return unexpected shapes near coastal/territory boundaries — covered by the existing service-error state (#16).
- The Census geocoder can return multiple or zero matches for an ambiguous/misspelled place name — plan is to use the first/best match and fall through to the existing error state on zero matches, rather than building a disambiguation UI (keeps scope as specified).
- Wind-speed strings ("10 to 15 mph") need upper-bound parsing for both the outerwear rule and the wind-chill formula — isolate this in one helper function and unit-check it directly.
- Asset generation is a fully manual, non-automated pipeline (download from ChatGPT, add to repo by hand) — sequencing a seed set first (base character + one outfit category) de-risks the layering approach before committing to the full ~25-asset set.
- The hidden developer override is for testing only, not a security boundary — acceptable for a client-side prototype with no real user data, but it must be removed or clearly gated before peer usability testing so testers don't stumble into it.
- `localStorage` grows one entry per location+date visited with no cap — acceptable for a prototype/demo; not worth building cleanup logic for an out-of-scope concern.

## Checklist

### Approvals

- [x] Research approved (2026-10-04)
- [x] Specification approved (2026-10-04)
- [x] Plan approved (2026-10-04)

### Build

- [x] Initialize the local git repository and add a `.gitignore` (2026-10-05; GitHub remote and Pages setup moved to the deploy step, see Revisions)
- [ ] Generate the seed asset set in ChatGPT (base character, neutral pose, + one full outfit category's 3 variations) and add to an `assets/` folder
- [ ] Build the static UI shell for every screen/state from the approved drawings (Main: loaded, first-run, loading, error, permission-denied; Location & date selector; Share/outfit card; Info/credits), phone and laptop layouts, using placeholders for any asset not yet generated. *Checkpoint 1 — verified by the Developer on laptop and phone, 2026-10-05.*
- [ ] Implement the recommendation-state object and the category/reminder rules from `spec.md` against hand-written mock forecast data, including the hidden developer override (e.g. a URL query param) for injecting temp/wind/precip values to test every threshold on demand
- [ ] Wire character art, condition icon, headline, Wearing list, and reminders to read only from the recommendation-state object (spec #8) — confirm by changing the state and watching all four update together
- [ ] Implement independent random variation selection and `localStorage` persistence keyed by `location+date` (spec #11–12)
- [ ] Integrate live data: Census geocoding for typed entry, device Geolocation API, NWS `/points` + `/gridpoints/.../forecast`, replacing the mock data from the previous step
- [ ] Implement most-recent-location-only persistence and the first-run state (spec #6–7)
- [ ] Implement loading, service-error, and permission-denied states with working recovery actions (spec #15–17)
- [ ] Implement the Share/outfit card overlay with the platform-specific action: native Web Share on phone, PNG download on laptop (spec #13–14)
- [ ] Generate and swap in the remaining assets (4 more outfit categories, weather condition icons, reminder icons) — in parallel with the tasks above once the seed set has validated the approach
- [ ] Responsive/accessibility pass: one-handed phone reachability, laptop two-column layout, icon shape-plus-color distinction, 3:1 contrast check (spec #18–21)
- [ ] Build out the Info/credits screen's 5 sections with real content (spec #22–23)
- [ ] Gate or remove the developer override from the normal UI path before peer testing
- [ ] Commit at each working checkpoint above
- [ ] Create the GitHub repository, connect the remote, and confirm the GitHub Pages target (proposed: `main` branch, repo root — no build step)
- [ ] Deploy to GitHub Pages once the core flow (location → forecast → recommendation) works end-to-end locally, then redeploy after each later checkpoint

### Verify and revise

- [ ] Check every specification requirement (#1–24) against the deployed app, not only the local copy
- [ ] Using the developer override, test every recommendation-category and reminder threshold in `spec.md` (both just-crossing and just-under each boundary), across multiple locations and both current and forecast dates
- [ ] Verify outfit and reminder variations are chosen independently, not as fixed pairs, by holding forecast conditions fixed (via the override) across repeated/different location+date loads
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

## Approval

Approved by the Developer on 2026-10-04, along with the supporting updates to `research.md` (geocoding provider) and `spec.md` (requirement #5). The planning phase is complete; implementation begins in a separate conversation.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.

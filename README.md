# What to Wear

A browser app for US weather, illustrated outfit suggestions, and a shareable outfit card. Plain HTML, CSS, and JavaScript; no build step or API keys.

Public app: [What to Wear](https://alr5342.github.io/what-to-wear/). GitHub Pages publishes the separate `gh-pages` runtime branch; project source and required deliverables are on `main`.

## Run locally

Run `npx serve .` from this folder and open the printed localhost URL. Serve over HTTP; JavaScript modules do not run by double-clicking `index.html`.

Search a US ZIP or city and state, or grant device-location permission. Choose today or one of the next six days. The app uses real National Weather Service forecasts; if NWS has omitted a complete daytime/night pair, choose another date. Share offers an image download when native file sharing is unavailable.

## Project records

- `brief.md`, `research.md`, `spec.md`, and `plan.md` record scope, evidence, decisions, checkpoint verification, and remaining work.
- `transcripts/` preserves research, planning, implementation, approvals, and subsequent debrief conversations when completed.
- `reference/` contains required visual references and screen drawings; `project-3-character/` contains the approved character reference.
- `assets/art/source/`, the character master, and `assets/art/prompts.md` preserve source artwork and provenance. The app loads only the prepared runtime layers/icons.
- `verification/` retains compact machine-readable checks and representative outfit evidence. Other screenshots are reproducible local outputs and are ignored.

The remaining clothing alignment imperfections were explicitly accepted at Checkpoint 4. Checkpoints 5 and 6, deployment status, peer testing, and final submission readiness are tracked in `plan.md`; pending peer/debrief records must not be treated as completed work.

## Verification and maintenance

Run `node --test tests/state.test.mjs tests/weather.test.mjs tests/location.test.mjs` for provider, persistence, and recommendation tests. Browser checks accept the path to an installed Playwright `index.mjs`; see `AGENTS.md`. `tests/release-browser-check.mjs` checks a repository subpath by default and accepts `--url=https://.../` for a public deployment. The live browser suite accepts `--live --url=https://.../`; it submits only two sequential geocoder searches.

Normal URLs always use live weather. `?mock&dev` explicitly enables development forecasts; do not use development links for peer testing. Nominatim's accepted usage limits and its switchable endpoint are documented in `research.md` and `location-config.json`.

`scripts/optimize-png.mjs` is an optional offline utility that losslessly recompresses PNGs, verifies exact decoded pixel equality, and replaces only smaller outputs. It is not an app dependency. Generated ZIPs and local release staging belong in ignored `.release/`, never in the submitted repository.

Submit the final approved and pushed repository using GitHub's **Code → Download ZIP**, after completing the deliverable audit in `plan.md`. Git history remains on GitHub; `commit-log.txt` will provide the required readable history in the final ZIP.

// Run with an installed Playwright module: node tests/browser-check.mjs <path-to-playwright/index.mjs>
// No app dependency or build step is introduced by this verification script.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : 'playwright');
const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
const errors = [];
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const snapshot = (page) => page.evaluate(() => ({
  headline: document.querySelector('#headline').textContent,
  wearing: document.querySelector('#wearing-list').textContent,
  reminders: document.querySelector('#reminder-list').textContent,
  garments: [...document.querySelectorAll('#character [data-item]')].map((node) => [node.dataset.item, node.dataset.color]),
}));
async function loaded(page) {
  await page.locator('#headline').filter({ hasText: /\S/ }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#character[data-art-ready="true"]').waitFor();
}

try {
  browser = await chromium.launch({ headless: true });
  console.log('Browser launched; checking controls and date/reload persistence.');
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, timezoneId: 'America/Chicago' });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (entry) => { if (entry.type() === 'error') errors.push(entry.text()); });
  await page.goto(`${origin}/?mock&dev`);
  await loaded(page);
  const first = await snapshot(page);
  const firstTemp = await page.locator('#temp').textContent();
  check(first.garments.length >= 3, 'garment layers render');
  check(await page.locator('#main-screen button[aria-controls="selector"]').count() === 1, 'one shared location/date control');
  check(await page.locator('#change-btn').textContent().then((text) => text.trim()) === 'Location & date', 'combined control has a visible label');
  check(await page.locator('.topbar button').count() === 1, 'header location and date are read-only; only Info is a button');
  check(!/navy|olive|rust/i.test(first.wearing), 'Wearing list describes garment types without colors');
  await page.reload(); await loaded(page);
  assert.deepEqual(await snapshot(page), first); checks++;

  // Date changes must come back to identical choices, including after reload.
  await page.locator('#change-btn').click();
  check(await page.locator('#selector').evaluate((node) => node.open), 'phone selector opens');
  await page.locator('.chip').nth(1).click(); await page.locator('#selector-done').click();
  check(await page.locator('#period-label').textContent() === 'Forecast', 'future-day label');
  const future = await snapshot(page);
  check(await page.locator('#temp').textContent() !== firstTemp, '?mock&dev preserves different daily mock forecasts');
  await page.reload(); await loaded(page);
  await page.locator('#change-btn').click(); await page.locator('.chip').nth(1).click(); await page.locator('#selector-done').click();
  assert.deepEqual(await snapshot(page), future); checks++;
  await page.locator('#change-btn').click(); await page.locator('.chip').first().click(); await page.locator('#selector-done').click();
  assert.deepEqual(await snapshot(page), first); checks++;

  // Exercise the actual interactive controls, not only URL previews.
  await page.locator('.devbar summary').click();
  for (const name of ['Sunny', 'Hot', 'Rain', 'Snow', 'Storm', 'Mild', 'Jacket']) {
    await page.getByRole('button', { name, exact: true }).click();
    check(/garment combinations/.test(await page.locator('#dev-status').textContent()), `${name} combination count`);
  }
  await page.getByRole('button', { name: 'Snow', exact: true }).click();
  const snow = await snapshot(page);
  check(snow.garments.some(([id]) => id === 'winterboots'), 'snow uses insulated boots');
  check(snow.garments.some(([id]) => id === 'beanie'), 'snow uses beanie');
  check(!/umbrella/i.test(snow.reminders), 'snow-only suppresses umbrella');
  const form = page.locator('.dev-forecast');
  await form.locator('[name=weather]').selectOption('mixed');
  await form.getByRole('button', { name: 'Apply forecast' }).click();
  check(/umbrella/i.test((await snapshot(page)).reminders), 'mixed precipitation retains umbrella');
  await page.reload(); await loaded(page);
  check(/umbrella/i.test((await snapshot(page)).reminders), 'mixed URL survives reload');
  await page.locator('.devbar summary').click();
  await form.locator('[name=high]').fill('25'); await form.locator('[name=low]').fill('30');
  await form.getByRole('button', { name: 'Apply forecast' }).click();
  check(await page.locator('#dev-status').textContent() === 'Low must be at or below high.', 'invalid forecast is explained');

  // New choices is deliberately dev-only; randomized choices may occasionally repeat.
  await page.getByRole('button', { name: 'Sunny', exact: true }).click();
  const variants = new Set();
  for (let index = 0; index < 20; index++) {
    await page.getByRole('button', { name: 'New choices for this date' }).click();
    variants.add(JSON.stringify((await snapshot(page)).garments.map(([id]) => id)));
  }
  check(variants.size >= 3, 'at least three different actual outfits are reachable through controls');

  // Busiest forecast: four active reminders, five garments, long headline.
  console.log('Controls passed; checking the busiest phone layout and share mirror.');
  await page.goto(`${origin}/?dev&condition=sunny&high=90&low=40&wind=15&precip=70`);
  await loaded(page);
  check(await page.locator('#reminder-list li').count() === 4, 'all four applicable reminders render');
  check(!(await snapshot(page)).garments.some(([id]) => id === 'beanie'), 'hot day/cold night keeps sun hat');
  check(!(await snapshot(page)).garments.some(([id]) => id === 'shorts'), 'cold night uses full-length bottoms');
  const fit = await page.evaluate(() => ({
    sideways: document.documentElement.scrollWidth > innerWidth,
    shareBottom: document.querySelector('#share-btn').getBoundingClientRect().bottom,
    characterHeight: document.querySelector('#character').getBoundingClientRect().height,
    reminderTop: document.querySelector('.reminders').getBoundingClientRect().top,
  }));
  check(!fit.sideways, 'phone has no sideways scrolling');
  check(fit.shareBottom <= 667, `phone actions fit: ${JSON.stringify(fit)}`);
  check(fit.characterHeight >= 80, 'phone character remains visible with four reminders');
  check(fit.reminderTop < 667, 'reminder section discoverable without scrolling');
  // Check all headline lengths against the longest reminder text combination.
  const worstFit = await page.evaluate(async () => {
    const { createRecommendation, REMINDERS, HEADLINES } = await import('/js/state.js');
    const { renderLoaded } = await import('/js/ui.js');
    const state = createRecommendation({ highF: 90, lowF: 40, windSpeed: 15, precipProbability: 70, shortForecast: 'Sunny' }, {
      location: { name: 'Austin, TX', lat: 30.2672, lon: -97.7431 }, date: '2026-10-12', today: '2026-10-12', random: () => 0,
    });
    state.reminders.forEach((entry) => { entry.text = REMINDERS[entry.type].reduce((a, b) => a.length > b.length ? a : b); });
    let maximum = 0;
    for (const text of Object.values(HEADLINES).flat()) {
      renderLoaded({ ...state, headline: { ...state.headline, text }, dateLong: 'Oct 12, 2026' });
      maximum = Math.max(maximum, document.querySelector('#share-btn').getBoundingClientRect().bottom);
    }
    return maximum;
  });
  check(worstFit <= 667, `all 18 headline lengths and longest reminder wordings fit on phone: ${worstFit}`);
  // Restore the real state before screenshots and mirror checks.
  await page.reload(); await loaded(page);
  await mkdir('verification', { recursive: true });
  await page.locator('.devbar').evaluate((node) => { node.style.visibility = 'hidden'; });
  await page.screenshot({ path: 'verification/checkpoint-2-phone.png' });
  await page.locator('.devbar').evaluate((node) => { node.style.visibility = ''; });

  await page.locator('#share-btn').click();
  check(await page.locator('#share-headline').textContent() === (await snapshot(page)).headline, 'share headline matches main');
  const mainLayers = await page.locator('#character').innerHTML();
  check(await page.locator('#share-character').innerHTML() === mainLayers, 'share garments and colors match main');
  await page.keyboard.press('Escape');
  await page.locator('#info-btn').click();
  await page.locator('#info-screen').waitFor({ state: 'visible' });
  check(await page.locator('#info-screen').isVisible(), 'info opens');
  await page.locator('#info-back').click();
  await page.locator('#main-screen').waitFor({ state: 'visible' });

  // Existing shell states must retain a neutral base silhouette.
  for (const view of ['firstrun', 'loading', 'error', 'denied']) {
    await page.goto(`${origin}/?dev&view=${view}&condition=snow`);
    await page.waitForFunction((value) => document.querySelector('#main').dataset.view === value, view);
    check(await page.locator('body').getAttribute('data-condition') === 'neutral', `${view} neutral theme`);
    check(await page.locator('#character').evaluate((node) => getComputedStyle(node).opacity === '0.2'), `${view} shows muted illustration`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${origin}/?dev&condition=snow`); await loaded(page);
  check(await page.locator('.devbar').count() === 1, 'explicit dev preview exposes developer controls');
  const columns = await page.evaluate(() => ({
    characterRight: document.querySelector('.stage').getBoundingClientRect().right,
    panelLeft: document.querySelector('.panel').getBoundingClientRect().left,
  }));
  check(columns.characterRight <= columns.panelLeft, 'laptop uses distinct columns');
  await page.locator('#change-btn').click();
  check(await page.locator('.chip').count() === 7, 'laptop has seven dates');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'verification/checkpoint-2-laptop.png' });

  // Denied localStorage still produces usable, stable tab-local recommendations.
  const restricted = await browser.newContext();
  await restricted.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Denied'); } }));
  const blocked = await restricted.newPage();
  blocked.on('pageerror', (error) => errors.push(error.message));
  await blocked.goto(`${origin}/?mock&dev`); await loaded(blocked);
  check(/tab only/.test(await blocked.locator('#dev-status').textContent()), 'denied storage fallback is reported');
  await restricted.close();
  check(errors.length === 0, `no browser errors: ${errors.join('; ')}`);
  console.log(`Browser verification: ${checks} checks passed. Phone fit: ${JSON.stringify(fit)}. Distinct rerolled outfits: ${variants.size}.`);
  console.log('Screenshots: verification/checkpoint-2-phone.png and verification/checkpoint-2-laptop.png');
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}

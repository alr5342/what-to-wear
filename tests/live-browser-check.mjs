// Deterministic end-to-end coverage through the real app. External requests are
// intercepted here; use --live for a small, sequential real-provider smoke check.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HEADLINES, REMINDERS, analyzeForecast } from '../js/state.js';
import { buildForecastDays, normalizePeriods } from '../js/weather.js';

const { chromium } = await import(pathToFileURL(resolve(process.argv[2])).href);
const live = process.argv.includes('--live');
const evidencePrefix = process.argv.find((arg) => arg.startsWith('--evidence='))?.slice(11) ?? 'checkpoint-4';
const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try { response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = (process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? `http://127.0.0.1:${server.address().port}`).replace(/\/$/, '');
let browser;
let checks = 0;
const errors = [];
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const view = async (page, name) => page.waitForFunction((expected) => document.querySelector('#main').dataset.view === expected, name);
const snapshot = (page) => page.evaluate(() => ({
  temp: document.querySelector('#temp').textContent,
  condition: document.querySelector('#condition-label').textContent,
  headline: document.querySelector('#headline').textContent,
  outfit: document.querySelector('#character').innerHTML,
}));
async function search(page, input, action = 'Search') {
  if (!await page.locator('#selector').evaluate((node) => node.open)) {
    const entry = page.locator('#main').getByRole('button', { name: /Change location and date|Search city or zip|Location & date|Enter location/ }).first();
    await entry.click();
  }
  await page.locator('#search-input').fill(input);
  if (action === 'Enter') await page.locator('#search-input').press('Enter');
  else if (action === 'Done') await page.locator('#selector-done').click();
  else await page.locator('.search-submit').click();
}

const places = {
  ny: { lat: '40.7485569', lon: '-73.9940252', address: { city: 'New York', state: 'New York', 'ISO3166-2-lvl4': 'US-NY', country_code: 'us' } },
  tx: { lat: '30.2649261', lon: '-97.7474086', address: { city: 'Austin', state: 'Texas', 'ISO3166-2-lvl4': 'US-TX', country_code: 'us' } },
};
const fixtures = {
  ny: { office: 'OKX', high: 73, low: 58, text: 'Sunny', wind: '9 mph', probability: 1, zone: 'America/New_York' },
  tx: { office: 'EWX', high: 93, low: 77, text: 'Chance Showers And Thunderstorms', wind: '5 to 10 mph', probability: 26, zone: 'America/Chicago' },
};
let failSearch = false;
let failForecast = false;
let missingToday = false;
let longForecast = false;
let holdPoint = null;
const requests = [];
function periods(fixture) {
  const result = [];
  for (let index = 0; index < 7; index++) {
    const date = `2026-10-${12 + index}`;
    const next = `2026-10-${13 + index}`;
    if (index === 0 && missingToday) continue;
    result.push({ isDaytime: true, startTime: `${date}T06:00:00-04:00`, endTime: `${date}T18:00:00-04:00`,
      temperature: longForecast ? 90 : fixture.high - index, temperatureUnit: 'F',
      shortForecast: longForecast ? 'Slight Chance Showers And Thunderstorms then Mostly Sunny' : fixture.text,
      windSpeed: longForecast ? '15 mph' : fixture.wind,
      probabilityOfPrecipitation: { value: longForecast ? 70 : fixture.probability } });
    result.push({ isDaytime: false, startTime: `${date}T18:00:00-04:00`, endTime: `${next}T06:00:00-04:00`,
      temperature: longForecast ? 40 : fixture.low - index, temperatureUnit: 'F', shortForecast: 'Partly Cloudy' });
  }
  return result;
}
async function context(options = {}) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, timezoneId: 'America/Chicago', ...options });
  if (!live) {
    // Date construction is fixed for fixtures; Date.now still advances for throttling.
    await ctx.addInitScript(() => {
      const NativeDate = Date;
      window.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : ['2026-10-12T15:00:00Z'])); } };
    });
    await ctx.route('https://nominatim.openstreetmap.org/**', async (route) => {
      const url = new URL(route.request().url()); requests.push(url.href);
      if (failSearch) return route.fulfill({ status: 503, json: {} });
      const query = url.searchParams.get('postalcode') || url.searchParams.get('q');
      const result = query === '10001' || query === 'New York, NY' ? places.ny : query === 'Austin, TX' || query === '78701' ? places.tx : null;
      await route.fulfill({ json: result ? [result] : [] });
    });
    await ctx.route('https://api.weather.gov/**', async (route) => {
      const url = new URL(route.request().url()); requests.push(url.href);
      if (url.pathname.startsWith('/points/')) {
        if (holdPoint) await holdPoint;
        const latitude = Number(url.pathname.split('/').at(-1).split(',')[0]);
        const key = latitude > 35 ? 'ny' : 'tx';
        const fixture = fixtures[key];
        return route.fulfill({ json: { properties: { forecast: `https://api.weather.gov/gridpoints/${fixture.office}/1,1/forecast`, timeZone: fixture.zone,
          relativeLocation: { properties: { city: key === 'ny' ? 'New York' : 'Austin', state: key === 'ny' ? 'NY' : 'TX' } } } } });
      }
      if (failForecast) return route.fulfill({ status: 503, json: {} });
      const fixture = url.pathname.includes('OKX') ? fixtures.ny : fixtures.tx;
      return route.fulfill({ json: { properties: { periods: periods(fixture), updateTime: '2026-10-12T14:00:00Z' } } });
    });
  }
  ctx.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)));
  return ctx;
}

try {
  browser = await chromium.launch({ headless: true });
  const ctx = await context();
  const page = await ctx.newPage();
  const settleLiveForecast = async () => {
    await page.waitForFunction(() => !['loading', 'firstrun'].includes(document.querySelector('#main').dataset.view));
    if (await page.locator('#main').getAttribute('data-view') === 'error') {
      check(/complete daytime forecast/.test(await page.locator('#error-detail').textContent()), 'expired today is reported honestly');
      await page.locator('.view-error [data-action=search]').click();
      await page.locator('.chip').nth(1).click(); await page.locator('#selector-done').click();
    }
    await view(page, 'loaded');
  };
  const liveResponses = [];
  if (live) page.on('response', (response) => {
    if (response.url().startsWith('https://api.weather.gov/gridpoints/') && response.url().endsWith('/forecast')) {
      liveResponses.push(response.json().then((json) => ({ url: response.url(), json })));
    }
  });
  // Old preview links cannot turn ordinary browsing into invented weather.
  const unguarded = '?mock&view=loaded&condition=snow&high=-50&low=-60&wind=80&precip=100';
  await page.goto(origin + unguarded); await view(page, 'firstrun');
  check(!/Austin/.test(await page.locator('#location-name').textContent()), 'fresh live app has no Austin default');
  check(requests.length === 0, 'first run makes no provider calls before a location is chosen');
  await search(page, '10001', 'Enter');
  if (live) await settleLiveForecast();
  await view(page, 'loaded');
  check(await page.locator('#location-name').textContent() === 'New York, NY', 'ZIP selects New York');
  check((await page.locator('#weather-source').textContent()).endsWith('NWS forecast'), 'live source label permits an explicit Today fallback notice');
  check(await page.locator('#temp').textContent() !== '', 'live temperature renders');
  if (live) {
    await mkdir('verification', { recursive: true });
    const evidence = [];
    const verifyDates = async (zone, indexes) => {
      const response = await liveResponses.at(-1);
      const daily = normalizePeriods(response.json.properties.periods);
      const dates = buildForecastDays(new Date(), zone);
      for (const index of indexes) {
        await page.locator('#change-btn').click(); await page.locator('.chip').nth(index).click();
        await page.locator('#selector-done').click();
        const expected = daily.get(dates[index].key);
        if (!expected) {
          await view(page, 'error');
          check(/complete daytime forecast/.test(await page.locator('#error-detail').textContent()), 'unavailable selected date is explicitly reported');
          evidence.push({ location: await page.locator('#location-name').textContent(), date: dates[index].key, forecastURL: response.url, unavailable: true });
          // Reopen the same selector via the error state's recovery control.
          await page.locator('.view-error [data-action=search]').click();
          const availableIndex = dates.findIndex((date) => daily.has(date.key));
          await page.locator('.chip').nth(availableIndex).click(); await page.locator('#selector-done').click();
          continue;
        }
        await view(page, 'loaded');
        const actual = await snapshot(page);
        check(actual.temp === `${expected.highF}\u00b0F` && actual.condition === expected.shortForecast, 'selected date matches the actual NWS response exactly');
        const garments = await page.locator('#character [data-item]').evaluateAll((nodes) => nodes.map((node) => ({ category: node.className.split('layer-')[1], id: node.dataset.item })));
        const eligible = analyzeForecast(expected).eligible;
        check(garments.every((item) => eligible[item.category]?.includes(item.id)), 'outfit categories match rules for this actual forecast');
        evidence.push({ location: await page.locator('#location-name').textContent(), date: dates[index].key,
          forecastURL: response.url, updated: response.json.properties.updateTime,
          forecast: expected, displayed: { temp: actual.temp, condition: actual.condition }, garments });
      }
    };
    await verifyDates('America/New_York', [1, 3, 6]);
    await page.locator('#character[data-art-ready="true"]').waitFor();
    await page.screenshot({ path: `verification/${evidencePrefix}-live-new-york.png` });
    console.log('LIVE ZIP:', JSON.stringify(await snapshot(page), (key, value) => key === 'outfit' ? undefined : value));
    await search(page, 'Austin, TX', 'Done'); await view(page, 'loaded');
    check(await page.locator('#location-name').textContent() === 'Austin, TX', 'live city search applies through Done');
    await verifyDates('America/Chicago', [0, 1, 3, 6]);
    console.log('LIVE CITY:', JSON.stringify(await snapshot(page), (key, value) => key === 'outfit' ? undefined : value));
    await page.reload(); await settleLiveForecast();
    check(await page.locator('#location-name').textContent() === 'Austin, TX', 'live city survives reload');
    await page.locator('#character[data-art-ready="true"]').waitFor();
    await page.screenshot({ path: `verification/${evidencePrefix}-live-austin.png` });
    await writeFile(`verification/${evidencePrefix}-live-weather.json`, JSON.stringify(evidence, null, 2) + '\n');
    check(errors.length === 0, `no live page errors: ${errors.join('; ')}`);
    console.log(`Live provider/browser smoke: ${checks} checks passed.`);
  } else {
    await page.goto(origin + unguarded); await view(page, 'loaded');
    check(await page.locator('#weather-source').textContent() === 'NWS forecast' && await page.locator('.devbar').count() === 0, 'all preview overrides are ignored without dev, including with a saved location');
    check(await page.locator('#temp').textContent() === '73°F', 'NY temperature comes from its forecast');
    check(await page.locator('#condition-label').textContent() === 'Sunny', 'exact NWS short forecast displays');
    check(!/Waterproof boots/.test(await page.locator('#wearing-list').textContent()), 'dry NY outfit uses dry footwear');
    const first = await snapshot(page);
    await page.locator('#change-btn').click(); await page.locator('.chip').nth(1).click(); await page.locator('#selector-done').click();
    check(await page.locator('#temp').textContent() === '72°F', 'selected future date uses its own forecast');
    const future = await snapshot(page);
    await page.reload(); await view(page, 'loaded');
    assert.deepEqual(await snapshot(page), first); checks++;
    await page.locator('#change-btn').click(); await page.locator('.chip').nth(1).click(); await page.locator('#selector-done').click();
    assert.deepEqual(await snapshot(page), future); checks++;
    await page.locator('#share-btn').click();
    check(await page.locator('#share-location').textContent() === 'New York, NY', 'share location matches live data');
    check(await page.locator('#share-character').innerHTML() === future.outfit, 'share outfit mirrors live selection');
    await page.keyboard.press('Escape');
    await search(page, '99999'); await page.locator('#search-status').filter({ hasText: 'No US location' }).waitFor();
    check(await page.locator('#selector').evaluate((node) => node.open), 'unmatched search stays open with feedback');
    check(await page.locator('#location-name').textContent() === 'New York, NY', 'unmatched search does not claim another location');
    const beforeInvalid = requests.length;
    await search(page, '1000'); await page.locator('#search-status').filter({ hasText: 'five-digit ZIP' }).waitFor();
    check(requests.length === beforeInvalid, 'invalid input is rejected without an API call');
    failSearch = true;
    await search(page, 'Chicago, IL'); await page.locator('#search-status').filter({ hasText: 'Unable to reach location search' }).waitFor();
    check(await page.locator('#location-name').textContent() === 'New York, NY', 'failed search retains confirmed location with explicit feedback');
    failSearch = false;
    await search(page, 'Austin, TX', 'Done'); await view(page, 'loaded');
    check(await page.locator('#location-name').textContent() === 'Austin, TX', 'Done applies unsubmitted city input');
    check(await page.locator('#temp').textContent() === '92°F', 'location change fetches TX weather for selected future day');
    check(/Thunderstorms/.test(await page.locator('#condition-label').textContent()), 'location change updates weather description');
    check(/Waterproof boots/.test(await page.locator('#wearing-list').textContent()), 'location change recomputes wet-weather outfit');
    check(requests.some((url) => url.includes('/points/30.2649,-97.7474')), 'city coordinates drive NWS request');
    const saved = await page.evaluate(() => Object.keys(localStorage));
    check(saved.some((key) => key.startsWith('what-to-wear:live:v1:30.2649')), 'TX selections use their own location key');
    check(!saved.some((key) => key.startsWith('what-to-wear:live:v1:40.7485')), 'previous live-location selections are removed');
    await page.reload(); await view(page, 'loaded');
    check(await page.locator('#location-name').textContent() === 'Austin, TX', 'most recent city restores');
    await search(page, 'New York, NY', 'Enter'); await view(page, 'loaded');
    check(await page.locator('#temp').textContent() === '73°F', 'city-only New York lookup updates forecast');

    failForecast = true;
    await page.reload(); await view(page, 'error');
    check(/service is unavailable/.test(await page.locator('#error-detail').textContent()), 'forecast failure has useful feedback');
    check(await page.locator('#main').getAttribute('aria-busy') === 'false', 'failed request ends loading state');
    failForecast = false;
    await page.locator('[data-action=retry]').click(); await view(page, 'loaded');
    check(await page.locator('#temp').textContent() === '73°F', 'Retry refetches actual forecast');
    missingToday = true;
    await page.reload(); await view(page, 'loaded');
    check(await page.locator('#temp').textContent() === '72\u00b0F', 'expired Today automatically uses the next actual NWS day');
    check(/Today.*unavailable.*Tue/.test(await page.locator('#weather-source').textContent()), 'fallback clearly explains the date change');
    check(await page.locator('#date-label').textContent() !== 'Today', 'future fallback is never labeled Today');
    missingToday = false;
    longForecast = true;
    await page.reload(); await view(page, 'loaded');
    await page.evaluate(() => document.fonts.ready);
    const worst = await page.evaluate(async ({ HEADLINES, REMINDERS }) => {
      const { createRecommendation } = await import('./js/state.js');
      const { renderLoaded } = await import('./js/ui.js');
      const state = createRecommendation({ highF: 90, lowF: 40, windSpeed: 15, precipProbability: 70, shortForecast: 'Slight Chance Showers And Thunderstorms then Mostly Sunny' }, {
        location: { name: 'New York, NY', lat: 40.7485569, lon: -73.9940252 }, date: '2026-10-12', today: '2026-10-12', random: () => 0,
      });
      state.reminders.forEach((entry) => { entry.text = REMINDERS[entry.type].reduce((a, b) => a.length > b.length ? a : b); });
      let bottom = 0;
      for (const text of Object.values(HEADLINES).flat()) {
        renderLoaded({ ...state, headline: { ...state.headline, text }, dateLong: 'Oct 12, 2026' });
        bottom = Math.max(bottom, document.querySelector('#share-btn').getBoundingClientRect().bottom);
      }
      return { bottom, sideways: document.documentElement.scrollWidth > innerWidth };
    }, { HEADLINES, REMINDERS });
    check(!worst.sideways && worst.bottom <= 667, `long live wording plus four reminders fits phone: ${JSON.stringify(worst)}`);
    await page.reload(); await view(page, 'loaded');
    await mkdir('verification', { recursive: true });
    await page.screenshot({ path: 'verification/checkpoint-3-phone.png' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: 'verification/checkpoint-3-laptop.png' });
    longForecast = false;

    const allowed = await context({ geolocation: { latitude: 40.7485569, longitude: -73.9940252 }, permissions: ['geolocation'] });
    const device = await allowed.newPage(); await device.goto(origin); await view(device, 'firstrun');
    const searches = requests.filter((url) => url.includes('nominatim')).length;
    failForecast = true;
    await device.locator('.view-firstrun [data-action=geolocate]').click(); await view(device, 'error');
    await device.reload(); await view(device, 'error');
    check(await device.locator('#location-name').textContent() === 'Your location', 'device point persists even when the initial NWS forecast fails');
    failForecast = false;
    await device.locator('[data-action=retry]').click(); await view(device, 'loaded');
    check(await device.locator('#location-name').textContent() === 'New York, NY', 'device coordinates get an NWS place label');
    check(requests.filter((url) => url.includes('nominatim')).length === searches, 'device coordinates are not sent to Nominatim');
    check(await device.locator('#temp').textContent() === '73\u00b0F', 'device location loads available Today');
    missingToday = true;
    await device.locator('#change-btn').click(); await device.locator('.chip').first().click();
    await device.locator('#selector [data-action=geolocate]').click(); await view(device, 'loaded');
    check(await device.locator('#temp').textContent() === '72\u00b0F', 'device location with expired Today loads next actual forecast');
    check(/Today.*unavailable/.test(await device.locator('#weather-source').textContent()), 'device fallback is explicit');
    await device.locator('#change-btn').click(); await device.locator('.chip').nth(3).click();
    await device.locator('#selector [data-action=geolocate]').click(); await view(device, 'loaded');
    check(await device.locator('#temp').textContent() === '70\u00b0F', 'device location preserves requested future day');
    check(await device.locator('#weather-source').textContent() === 'NWS forecast', 'explicit future selection clears fallback notice');
    missingToday = false;
    await allowed.close();
    const deniedContext = await context();
    const denied = await deniedContext.newPage(); await denied.goto(origin); await view(denied, 'firstrun');
    await denied.locator('.view-firstrun [data-action=geolocate]').click(); await view(denied, 'denied');
    check(await denied.locator('.view-denied [data-action=search]').isVisible(), 'denied location offers manual recovery');
    await search(denied, '10001'); await view(denied, 'loaded');
    check(await denied.locator('#location-name').textContent() === 'New York, NY', 'manual search recovers after denied location');
    await deniedContext.close();
    const restricted = await context();
    await restricted.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Denied'); } }));
    const blocked = await restricted.newPage(); await blocked.goto(origin); await view(blocked, 'firstrun');
    await search(blocked, '10001'); await view(blocked, 'loaded');
    check(await blocked.locator('#temp').textContent() === '73°F', 'denied storage does not prevent live weather');
    await restricted.close();
    let release;
    holdPoint = new Promise((resolve) => { release = resolve; });
    await page.goto(`${origin}/?dev`); await view(page, 'loading');
    await page.locator('.devbar summary').click();
    await page.getByRole('button', { name: 'Sunny', exact: true }).click(); await view(page, 'loaded');
    release(); holdPoint = null;
    await page.waitForTimeout(200);
    check(await page.locator('#weather-source').textContent() === 'Mock forecast', 'late live response cannot overwrite a newer preview');
    check(errors.length === 0, `no page errors: ${errors.join('; ')}`);
    console.log(`Live-flow browser verification: ${checks} checks passed. Worst phone fit: ${JSON.stringify(worst)}.`);
  }
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}

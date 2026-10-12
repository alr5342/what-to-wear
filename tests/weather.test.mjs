import test from 'node:test';
import assert from 'node:assert/strict';
import { buildForecastDays, normalizePeriods, fetchNWSForecast, fetchJSON, forecastForDate } from '../js/weather.js';

function periods({ high = 72, low = 48, probability = 40 } = {}) {
  return [
    { isDaytime: true, startTime: '2026-10-12T06:00:00-04:00', endTime: '2026-10-12T18:00:00-04:00', temperature: high, temperatureUnit: 'F', shortForecast: 'Rain Showers', windSpeed: '10 to 15 mph', probabilityOfPrecipitation: { value: probability } },
    { isDaytime: false, startTime: '2026-10-12T18:00:00-04:00', endTime: '2026-10-13T06:00:00-04:00', temperature: low, temperatureUnit: 'F', shortForecast: 'Partly Cloudy' },
  ];
}

test('seven dates use the selected location timezone, including month/year and DST boundaries', () => {
  const now = new Date('2027-01-01T02:00:00Z');
  const days = buildForecastDays(now, 'America/New_York');
  assert.equal(days.length, 7);
  assert.equal(days[0].key, '2026-12-31');
  assert.equal(days[6].key, '2027-01-06');
  assert.equal(days[0].chipLabel, 'Today');
  assert.equal(buildForecastDays(now, 'Pacific/Honolulu')[0].key, '2026-12-31');
  assert.deepEqual(buildForecastDays(new Date('2026-11-01T04:30:00Z'), 'America/New_York').map((day) => day.key),
    ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
});

test('daytime temperature, subsequent low, wind range, probability and exact wording come from NWS', () => {
  const forecast = normalizePeriods(periods()).get('2026-10-12');
  assert.deepEqual(forecast, { highF: 72, lowF: 48, windSpeed: '10 to 15 mph', precipProbability: 40, shortForecast: 'Rain Showers', icon: '' });
  assert.equal(normalizePeriods(periods({ probability: null })).get('2026-10-12').precipProbability, null);
  assert.equal(normalizePeriods(periods({ high: 40, low: 50 })).get('2026-10-12').lowF, 40);
  const celsius = periods({ high: 20, low: 10 });
  celsius.forEach((period) => { period.temperatureUnit = 'C'; });
  assert.equal(normalizePeriods(celsius).get('2026-10-12').highF, 68);
  assert.equal(normalizePeriods(celsius).get('2026-10-12').lowF, 50);
});

test('missing daytime/night data never becomes a different date or mock forecast', () => {
  assert.throws(() => normalizePeriods(periods().slice(1)), /no complete/);
  const incomplete = periods(); incomplete[1].temperature = null;
  assert.throws(() => normalizePeriods(incomplete), /no complete/);
  const gap = periods(); gap[1].startTime = '2026-10-13T18:00:00-04:00';
  assert.throws(() => normalizePeriods(gap), /no complete/);
  assert.throws(() => forecastForDate({ daily: normalizePeriods(periods()) }, '2026-10-13'), /Choose another date/);
});

test('location coordinates determine the NWS grid and its returned forecast URL', async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(url);
    return { ok: true, json: async () => url.includes('/points/')
      ? { properties: { forecast: 'https://api.weather.gov/gridpoints/OKX/33,37/forecast', timeZone: 'America/New_York', relativeLocation: { properties: { city: 'New York', state: 'NY' } } } }
      : { properties: { periods: periods(), updateTime: '2026-10-12T15:00:00Z' } } };
  };
  const result = await fetchNWSForecast({ lat: 40.7485569, lon: -73.9940252 }, { fetchImpl });
  assert.deepEqual(requested, ['https://api.weather.gov/points/40.7486,-73.9940', 'https://api.weather.gov/gridpoints/OKX/33,37/forecast']);
  assert.equal(result.location.name, 'New York, NY');
  assert.equal(result.timeZone, 'America/New_York');
  assert.equal(result.daily.get('2026-10-12').highF, 72);
  const retry = await fetchNWSForecast({ name: 'Your location', lat: 40.7485569, lon: -73.9940252 }, { fetchImpl });
  assert.equal(retry.location.name, 'New York, NY', 'a saved device point gets its city label after a failed initial forecast');
});

test('invalid coordinates, missing grid and off-provider links fail with useful feedback', async () => {
  await assert.rejects(fetchNWSForecast({ lat: 91, lon: 0 }), /valid US location/);
  for (const forecast of [undefined, 'https://example.com/forecast']) {
    await assert.rejects(fetchNWSForecast({ lat: 40, lon: -74 }, { fetchImpl: async () => ({ ok: true, json: async () => ({ properties: { forecast } }) }) }), /No NWS forecast/);
  }
});

test('HTTP failures, malformed JSON and timeouts fail without a mock fallback', async () => {
  await assert.rejects(fetchJSON('https://api.weather.gov/test', { fetchImpl: async () => ({ ok: false }) }), /unavailable/);
  await assert.rejects(fetchJSON('https://api.weather.gov/test', { fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } }) }), /Unable to reach/);
  await assert.rejects(fetchJSON('https://api.weather.gov/test', {
    timeoutMs: 5,
    fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })),
  }), /Unable to reach/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeocoder, getDeviceLocation, readSavedLocation, saveLocation } from '../js/location.js';
import { createRecommendationStore } from '../js/state.js';

const endpoint = 'https://nominatim.openstreetmap.org/search';
const place = { lat: '40.7485569', lon: '-73.9940252', address: { city: 'New York', state: 'New York', 'ISO3166-2-lvl4': 'US-NY', country_code: 'us' } };
function fakeGeocoder(fetchImpl) {
  let clock = 0;
  return createGeocoder({ endpoint, fetchImpl, now: () => clock, wait: async (ms) => { clock += ms; } });
}
function storage() {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key), get length() { return data.size; }, key: (index) => [...data.keys()][index] };
}

test('ZIP and city use US-filtered requests, correct query fields and normalized names/coordinates', async () => {
  const urls = [];
  const geocoder = fakeGeocoder(async (url) => { urls.push(new URL(url)); return { ok: true, json: async () => [place] }; });
  const location = await geocoder.search('10001');
  assert.deepEqual(location, { lat: 40.7485569, lon: -73.9940252, name: 'New York, NY' });
  await geocoder.search('Austin, TX');
  await geocoder.search('10001-1234');
  assert.equal(urls[0].searchParams.get('postalcode'), '10001');
  assert.equal(urls[0].searchParams.has('q'), false);
  assert.equal(urls[1].searchParams.get('q'), 'Austin, TX');
  assert.equal(urls[2].searchParams.get('postalcode'), '10001');
  assert.ok(urls.every((url) => url.searchParams.get('countrycodes') === 'us'));
});

test('repeat searches are cached; submitted requests queue at least 1.1 seconds apart', async () => {
  let clock = 100;
  const starts = [];
  const geocoder = createGeocoder({ endpoint, now: () => clock, wait: async (ms) => { clock += ms; }, fetchImpl: async () => {
    starts.push(clock); return { ok: true, json: async () => [place] };
  } });
  await Promise.all([geocoder.search('10001'), geocoder.search('Austin, TX'), geocoder.search('  AUSTIN, TX  ')]);
  assert.deepEqual(starts, [100, 1200]);
});

test('invalid, empty, non-US, malformed and failed results never substitute a default city', async () => {
  const geocoder = fakeGeocoder(async () => { throw new Error('Should not request'); });
  for (const input of ['', 'a', '1000', '123456', 'x'.repeat(121)]) await assert.rejects(geocoder.search(input), /Enter a US city/);
  for (const result of [[], null, [{ ...place, address: { country_code: 'ca' } }], [{ ...place, lat: 'bad' }]]) {
    const invalid = fakeGeocoder(async () => ({ ok: true, json: async () => result }));
    await assert.rejects(invalid.search('10001'), /No US location|valid US location/);
  }
  await assert.rejects(fakeGeocoder(async () => ({ ok: false })).search('10001'), /Unable to reach location/);
});

test('cancelled search does not request data or block the following search', async () => {
  const geocoder = fakeGeocoder(async () => ({ ok: true, json: async () => [place] }));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(geocoder.search('10001', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal((await geocoder.search('Austin, TX')).name, 'New York, NY');
});

test('only the most recent live location is retained; mock selections stay isolated', () => {
  const saved = storage();
  const austin = { name: 'Austin, TX', lat: 30, lon: -97 };
  const ny = { name: 'New York, NY', lat: 40, lon: -74 };
  saveLocation(saved, austin); saveLocation(saved, ny);
  assert.deepEqual(readSavedLocation(saved), ny);
  const forecast = { highF: 73, lowF: 58, windSpeed: '9 mph', shortForecast: 'Sunny' };
  const mock = createRecommendationStore(saved);
  const live = createRecommendationStore(saved, { namespace: 'live' });
  const options = { location: austin, date: '2026-10-12', today: '2026-10-12' };
  mock.get(forecast, options); live.get(forecast, options);
  live.retainLocation(ny);
  live.get(forecast, { ...options, location: ny });
  assert.ok(![...saved.data.keys()].some((key) => key.startsWith('what-to-wear:live:v1:30,-97:')));
  assert.ok([...saved.data.keys()].some((key) => key.startsWith('what-to-wear:mock:v1:30,-97:')));
  assert.equal(readSavedLocation({ getItem() { throw new Error('denied'); } }), null);
  assert.doesNotThrow(() => saveLocation({ setItem() { throw new Error('denied'); } }, ny));
  assert.equal(readSavedLocation({ getItem: () => '{broken' }), null);
});

test('device location succeeds without geocoding, and denial/timeouts provide manual recovery', async () => {
  const point = await getDeviceLocation({ getCurrentPosition(success) { success({ coords: { latitude: 40, longitude: -74 } }); } });
  assert.deepEqual(point, { lat: 40, lon: -74 });
  await assert.rejects(getDeviceLocation({ getCurrentPosition(_, fail) { fail({ code: 1 }); } }), { code: 'denied' });
  await assert.rejects(getDeviceLocation({ getCurrentPosition(_, fail) { fail({ code: 3 }); } }), /enter a city or ZIP/);
  await assert.rejects(getDeviceLocation(null), /unavailable/);
});

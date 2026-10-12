// Read-only NWS smoke check; run explicitly when network access is available.
// Deterministic response/error coverage lives in weather.test.mjs.
import assert from 'node:assert/strict';
import { fetchNWSForecast, buildForecastDays } from '../js/weather.js';

const grids = new Set();
for (const location of [
  { name: 'New York, NY', lat: 40.7485569, lon: -73.9940252 },
  { name: 'Austin, TX', lat: 30.2649261, lon: -97.7474086 },
]) {
  const bundle = await fetchNWSForecast(location);
  grids.add(bundle.forecastURL);
  const days = buildForecastDays(new Date(), bundle.timeZone);
  const available = days.filter((day) => bundle.daily.has(day.key));
  assert.ok(available.length > 0, `${location.name} has an upcoming complete forecast`);
  const sample = bundle.daily.get(available[0].key);
  console.log(JSON.stringify({
    location: bundle.location, forecastURL: bundle.forecastURL,
    updated: bundle.updated, availableDates: available.map((day) => day.key),
    sample: { date: available[0].key, ...sample },
  }));
}
assert.equal(grids.size, 2, 'New York and Austin must resolve to different NWS grids');
console.log('Live NWS smoke check passed: both locations loaded their own forecast grids.');

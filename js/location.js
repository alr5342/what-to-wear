// Submitted US searches only: no autocomplete or background geocoding.
import { fetchJSON, validateCoordinates, WeatherError } from './weather.js';

const SAVED_LOCATION = 'what-to-wear:location:v1';

export function readSavedLocation(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(SAVED_LOCATION));
    if (saved?.version !== 1 || typeof saved.location?.name !== 'string') return null;
    validateCoordinates(saved.location);
    return saved.location;
  } catch { return null; }
}

export function saveLocation(storage, location) {
  try { storage?.setItem(SAVED_LOCATION, JSON.stringify({ version: 1, location })); }
  catch { /* The app still works when storage is denied or full. */ }
}

const delay = (ms, signal) => new Promise((resolve, reject) => {
  const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
  const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
});

export function createGeocoder({ endpoint, fetchImpl = fetch, now = Date.now, wait = delay } = {}) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password) throw new WeatherError('search', 'The location-search service is not configured correctly.');
  const cache = new Map();
  let queue = Promise.resolve();
  let lastRequest = -Infinity;
  return {
    search(input, { signal } = {}) {
      const query = input.trim();
      if (query.length < 2 || query.length > 120 || (/^[\d\s-]+$/.test(query) && !/^\d{5}(?:-\d{4})?$/.test(query))) {
        return Promise.reject(new WeatherError('search', 'Enter a US city (include its state) or a five-digit ZIP code.'));
      }
      const key = query.toLowerCase();
      const operation = queue.then(async () => {
        if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        if (cache.has(key)) return cache.get(key);
        await wait(Math.max(0, lastRequest + 1100 - now()), signal);
        if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        const request = new URL(url);
        request.searchParams.set('format', 'jsonv2');
        request.searchParams.set('countrycodes', 'us');
        request.searchParams.set('addressdetails', '1');
        request.searchParams.set('limit', '1');
        request.searchParams.set('accept-language', 'en');
        const isZIP = /^\d{5}(?:-\d{4})?$/.test(query);
        request.searchParams.set(isZIP ? 'postalcode' : 'q', isZIP ? query.slice(0, 5) : query);
        lastRequest = now();
        let results;
        try { results = await fetchJSON(request.href, { signal, fetchImpl }); }
        catch (error) {
          if (signal?.aborted) throw error;
          throw new WeatherError('search', 'Unable to reach location search. Check your connection and try again.');
        }
        const result = Array.isArray(results) ? results[0] : null;
        if (!result || result.address?.country_code !== 'us') throw new WeatherError('search', 'No US location found. Check the ZIP or include the city and state.');
        const address = result.address;
        const city = address.city || address.town || address.village || address.hamlet || address.municipality || address.county || address.postcode;
        const state = address['ISO3166-2-lvl4']?.replace(/^US-/, '') || address.state;
        const location = { lat: Number(result.lat), lon: Number(result.lon), name: [city, state].filter(Boolean).join(', ') };
        validateCoordinates(location);
        if (!location.name) throw new WeatherError('search', 'Location search returned an incomplete place. Try another city or ZIP.');
        cache.set(key, location);
        return location;
      });
      // Failed or cancelled requests must not poison the next search.
      queue = operation.then(() => {}, () => {});
      return operation;
    },
  };
}

export function getDeviceLocation(geolocation = globalThis.navigator?.geolocation) {
  return new Promise((resolve, reject) => {
    if (!geolocation) { reject(new WeatherError('location', 'Device location is unavailable. Enter a city or ZIP instead.')); return; }
    geolocation.getCurrentPosition(({ coords }) => {
      const location = { lat: coords.latitude, lon: coords.longitude };
      try { validateCoordinates(location); resolve(location); } catch (error) { reject(error); }
    }, (error) => {
      reject(new WeatherError(error.code === 1 ? 'denied' : 'location', error.code === 1
        ? 'Location access denied. Enter a city or ZIP instead.'
        : 'Unable to get your device location. Try again or enter a city or ZIP.'));
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  });
}

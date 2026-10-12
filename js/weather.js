// NWS response handling. Location-search provider adoption awaits approval.
// All network and provider-data validation stays outside the renderer.

export class WeatherError extends Error {
  constructor(code, message) { super(message); this.name = 'WeatherError'; this.code = code; }
}

/** Fetch JSON with a finite timeout and caller cancellation. */
export async function fetchJSON(url, { signal, fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/geo+json, application/json' } });
    if (!response.ok) throw new WeatherError('service', 'The weather service is unavailable. Please try again.');
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof WeatherError) throw error;
    throw new WeatherError('service', 'Unable to reach the weather service. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export function validateCoordinates(location) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lon)
    || Math.abs(location.lat) > 90 || Math.abs(location.lon) > 180) {
    throw new WeatherError('location', 'Choose a valid US location.');
  }
}

/** Date keys follow the chosen location's clock, not the device's timezone. */
export function buildForecastDays(now = new Date(), timeZone = 'America/Chicago') {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now);
  const part = (name) => Number(parts.find((entry) => entry.type === name).value);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(part('year'), part('month') - 1, part('day') + index));
    const format = (options) => date.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
    return {
      key: date.toISOString().slice(0, 10),
      chipLabel: index === 0 ? 'Today' : format({ weekday: 'short' }),
      short: format({ month: 'short', day: 'numeric' }),
      long: format({ month: 'short', day: 'numeric', year: 'numeric' }),
      buttonLabel: index === 0 ? 'Today' : format({ weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });
}

function temperatureF(period) {
  if (!Number.isFinite(period?.temperature)) return null;
  if (period.temperatureUnit === 'F') return period.temperature;
  if (period.temperatureUnit === 'C') return period.temperature * 9 / 5 + 32;
  return null;
}

/** Pair each daytime period with its following night; never substitute mock data. */
export function normalizePeriods(periods) {
  if (!Array.isArray(periods)) throw new WeatherError('service', 'The weather service returned an incomplete forecast.');
  const daily = new Map();
  for (let index = 0; index < periods.length; index++) {
    const day = periods[index];
    const night = periods[index + 1];
    if (day?.isDaytime !== true || night?.isDaytime !== false) continue;
    const highF = temperatureF(day);
    const nightF = temperatureF(night);
    if (highF === null || nightF === null || typeof day.shortForecast !== 'string' || !day.shortForecast.trim()) continue;
    const key = typeof day.startTime === 'string' ? day.startTime.slice(0, 10) : '';
    const start = Date.parse(day.startTime);
    const end = Date.parse(day.endTime);
    const nightStart = Date.parse(night.startTime);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(start) || !Number.isFinite(end)
      || !Number.isFinite(nightStart) || nightStart !== end || end <= start) continue;
    const probability = day.probabilityOfPrecipitation?.value;
    daily.set(key, {
      highF,
      // A warm front can make the following night warmer than the daytime.
      // Use the lower of these two actual forecast temperatures as the minimum.
      lowF: Math.min(highF, nightF),
      windSpeed: day.windSpeed ?? '',
      precipProbability: Number.isFinite(probability) && probability >= 0 && probability <= 100 ? probability : null,
      shortForecast: day.shortForecast,
      icon: typeof day.icon === 'string' ? day.icon : '',
    });
  }
  if (!daily.size) throw new WeatherError('service', 'The weather service returned no complete daytime forecasts.');
  return daily;
}

/** Resolve the NWS grid each load, then follow its forecast link. */
export async function fetchNWSForecast(location, options = {}) {
  validateCoordinates(location);
  const lat = location.lat.toFixed(4);
  const lon = location.lon.toFixed(4);
  const point = await fetchJSON(`https://api.weather.gov/points/${lat},${lon}`, options);
  const properties = point?.properties;
  let forecastURL;
  try { forecastURL = new URL(properties.forecast); } catch { /* Invalid links are rejected below. */ }
  if (!forecastURL || forecastURL.origin !== 'https://api.weather.gov' || !forecastURL.pathname.endsWith('/forecast')) {
    throw new WeatherError('location', 'No NWS forecast is available for this location. Try another US city or ZIP.');
  }
  const timeZone = properties.timeZone;
  try { new Intl.DateTimeFormat('en-US', { timeZone }).format(); }
  catch { throw new WeatherError('service', 'The weather service returned an invalid location timezone.'); }
  if (typeof timeZone !== 'string') throw new WeatherError('service', 'The weather service returned no location timezone.');
  const relative = properties.relativeLocation?.properties;
  const resolved = { ...location, timeZone };
  if ((!resolved.name || resolved.name === 'Your location') && relative?.city && relative?.state) resolved.name = `${relative.city}, ${relative.state}`;
  resolved.name ||= 'Your location';
  const response = await fetchJSON(forecastURL.href, options);
  return {
    location: resolved, timeZone, daily: normalizePeriods(response?.properties?.periods),
    updated: response?.properties?.updateTime ?? null, forecastURL: forecastURL.href,
  };
}

export function forecastForDate(bundle, date) {
  const forecast = bundle?.daily.get(date);
  if (!forecast) throw new WeatherError('unavailable', 'A complete daytime forecast is not available for this date. Choose another date or try again later.');
  return forecast;
}

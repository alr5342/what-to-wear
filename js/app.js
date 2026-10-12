// App wiring. Normal use is live; explicit mock previews never replace saved live data.
import * as ui from './ui.js';
import { initDevTools } from './dev.js';
import { createRecommendationStore } from './state.js';
import { MOCK_LOCATION, MOCK_FORECASTS } from './mock.js';
import { buildForecastDays, fetchNWSForecast, forecastForDate, fetchJSON } from './weather.js';
import { readSavedLocation, saveLocation, createGeocoder, getDeviceLocation } from './location.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(window.location.search);
let mockMode = ['mock', 'view', 'condition', 'high', 'low', 'wind', 'precip', 'weather'].some((key) => params.has(key));
let days = buildForecastDays();
let selectedDay = 0;
let forecastOverride = null;
let currentScreen = 'main';
let cameFromApp = false;
let storage;
try { storage = window.localStorage; } catch { /* Storage is optional. */ }
const mockRecommendations = createRecommendationStore(storage);
const liveRecommendations = createRecommendationStore(storage, { namespace: 'live' });
let location = readSavedLocation(storage);
let bundle = null;
let pending = null;
let requestVersion = 0;
let geocoderPromise = null;
let view = mockMode ? 'loaded' : location ? 'loading' : 'firstrun';
let devTools;

const currentForecast = () => mockMode ? forecastOverride ?? MOCK_FORECASTS[selectedDay] : forecastForDate(bundle, days[selectedDay].key);
const recommendations = () => mockMode ? mockRecommendations : liveRecommendations;
const selectedLocation = () => mockMode ? MOCK_LOCATION : location;

function render() {
  const day = days[selectedDay];
  let state = null;
  let forecast = null;
  if (view === 'loaded') {
    try {
      forecast = currentForecast();
      state = recommendations().get(forecast, { location: selectedLocation(), date: day.key, today: days[0].key });
      ui.renderLoaded({ ...state, dateLong: day.long });
    } catch (error) {
      view = 'error';
      $('error-detail').textContent = error.message;
    }
  }
  ui.renderTopBar({ locationName: view === 'firstrun' ? '' : selectedLocation()?.name, dateLabel: day.buttonLabel, isForecast: selectedDay > 0 });
  $('weather-source').textContent = mockMode ? 'Mock forecast' : 'NWS forecast';
  if (view !== 'loaded') ui.renderCharacter($('character'), []);
  ui.setView(view);
  ui.setCondition(view === 'loaded' ? state.condition : 'neutral');
  devTools?.update({ forecast, state, persistent: recommendations().persistent });
}

function setSearchBusy(busy) {
  $('search-form').setAttribute('aria-busy', String(busy));
  $('search-input').disabled = busy;
  $('search-form').querySelector('button').disabled = busy;
  $('selector-done').disabled = busy;
  document.querySelector('.selector-dates').disabled = busy;
  document.querySelectorAll('[data-action="geolocate"]').forEach((button) => { button.disabled = busy; });
}

async function geocode(query, signal) {
  if (!geocoderPromise) {
    geocoderPromise = fetchJSON(new URL('../location-config.json', import.meta.url).href)
      .then((config) => createGeocoder({ endpoint: config.geocoderEndpoint }))
      .catch((error) => { geocoderPromise = null; throw error; });
  }
  const geocoder = await geocoderPromise;
  return geocoder.search(query, { signal });
}

function leaveMockPreview() {
  mockMode = false;
  forecastOverride = null;
  const url = new URL(window.location.href);
  for (const key of ['mock', 'view', 'condition', 'high', 'low', 'wind', 'precip', 'weather']) url.searchParams.delete(key);
  history.replaceState(null, '', url);
}

// A single request owns the screen; older responses cannot replace newer data.
async function changeLocation(resolveLocation, { dateIndex = selectedDay, message = 'Loading forecast…' } = {}) {
  pending?.abort();
  const controller = new AbortController();
  pending = controller;
  const version = ++requestVersion;
  const previousView = view === 'loading' ? (bundle || mockMode ? 'loaded' : 'firstrun') : view;
  let chosen = false;
  view = 'loading';
  $('search-status').textContent = message;
  setSearchBusy(true);
  render();
  try {
    const next = await resolveLocation(controller.signal);
    if (version !== requestVersion) return;
    chosen = true;
    leaveMockPreview();
    location = { ...next, name: next.name || 'Your location' };
    bundle = null;
    saveLocation(storage, location);
    liveRecommendations.retainLocation(location);
    render();
    const result = await fetchNWSForecast(location, { signal: controller.signal });
    if (version !== requestVersion) return;
    bundle = result;
    location = result.location;
    days = buildForecastDays(new Date(), result.timeZone);
    selectedDay = dateIndex;
    saveLocation(storage, location);
    $('search-input').value = '';
    $('search-status').textContent = '';
    if ($('selector').open) $('selector').close();
    view = 'loaded';
    render();
  } catch (error) {
    if (version !== requestVersion || controller.signal.aborted) return;
    if (error.code === 'denied') {
      if ($('selector').open) $('selector').close();
      view = 'denied';
    } else if (!chosen && error.code !== 'location') {
      view = previousView;
      $('search-status').textContent = error.message;
    } else {
      if ($('selector').open) $('selector').close();
      view = 'error';
      $('error-detail').textContent = error.message;
    }
    render();
  } finally {
    if (version === requestVersion) { pending = null; setSearchBusy(false); }
  }
}

function submitSearch() {
  const query = $('search-input').value.trim();
  if (!query) { $('search-status').textContent = 'Enter a US city and state or a ZIP code.'; $('search-input').focus(); return; }
  return changeLocation((signal) => geocode(query, signal), { dateIndex: ui.getCheckedDateIndex(), message: 'Finding location…' });
}

function openSelector({ focusSearch = false } = {}) {
  ui.renderDateChips(days, selectedDay);
  $('search-input').value = '';
  $('search-status').textContent = '';
  $('selector').showModal();
  if (focusSearch) $('search-input').focus();
}

for (const dialog of document.querySelectorAll('dialog.sheet')) {
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
}
$('change-btn').addEventListener('click', () => openSelector());
$('selector-done').addEventListener('click', () => {
  // Done submits typed input too, so entering a ZIP cannot be silently ignored.
  if ($('search-input').value.trim()) { submitSearch(); return; }
  selectedDay = ui.getCheckedDateIndex();
  $('selector').close();
  if (mockMode || bundle) view = 'loaded';
  render();
});
$('search-form').addEventListener('submit', (event) => { event.preventDefault(); submitSearch(); });
$('share-btn').addEventListener('click', () => $('share-dialog').showModal());
// Native Share and PNG download arrive in their own checkpoint.

document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'search') openSelector({ focusSearch: true });
  if (action === 'retry') {
    if (mockMode) { view = 'loaded'; render(); }
    else if (location) changeLocation(() => Promise.resolve(location));
    else openSelector({ focusSearch: true });
  }
  if (action === 'geolocate') changeLocation(() => getDeviceLocation(), {
    dateIndex: $('selector').open ? ui.getCheckedDateIndex() : selectedDay, message: 'Getting device location…',
  });
});

// Info uses a hash route so browser/phone Back returns to the forecast.
$('info-btn').addEventListener('click', () => { cameFromApp = true; window.location.hash = 'info'; });
$('info-back').addEventListener('click', () => {
  if (cameFromApp) window.history.back();
  else window.location.hash = '';
});
function syncScreen() {
  const screen = window.location.hash === '#info' ? 'info' : 'main';
  if (screen === currentScreen) return;
  ui.showScreen(screen);
  if (screen === 'main') $('info-btn').focus();
  currentScreen = screen;
}
window.addEventListener('hashchange', syncScreen);

devTools = initDevTools({
  onView: (next) => { view = next; render(); },
  onForecast: (next) => {
    pending?.abort(); requestVersion++; setSearchBusy(false);
    mockMode = true; forecastOverride = next; view = 'loaded'; render();
  },
  onReroll: () => {
    if (view !== 'loaded') return;
    recommendations().reroll(currentForecast(), { location: selectedLocation(), date: days[selectedDay].key, today: days[0].key });
    render();
  },
});
view = devTools.view ?? view;
forecastOverride = devTools.forecast;
render();
syncScreen();
if (!mockMode && location) changeLocation(() => Promise.resolve(location));

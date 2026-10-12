// App wiring: owns the current screen/view/date and connects controls to the UI.
//
// Checkpoint 2 uses mock forecasts. Live location/weather arrives next.

import * as ui from './ui.js';
import { initDevTools } from './dev.js';
import { createRecommendationStore } from './state.js';
import { MOCK_LOCATION, MOCK_FORECASTS } from './mock.js';

const $ = (id) => document.getElementById(id);

// ---- App state ----

const days = buildDays(new Date());
let selectedDay = 0;
let view = 'loaded';
let forecastOverride = null;
let currentScreen = 'main';
let cameFromApp = false; // true once the in-app info button pushed a history entry
let storage;
try { storage = window.localStorage; } catch { /* Private/restricted contexts can deny access. */ }
const recommendations = createRecommendationStore(storage);
let devTools;

const currentForecast = () => forecastOverride ?? MOCK_FORECASTS[selectedDay];

/** Today plus the next 6 days (spec #2). */
function buildDays(today) {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const fmt = (options) => date.toLocaleDateString('en-US', options);
    return {
      date,
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      chipLabel: offset === 0 ? 'Today' : fmt({ weekday: 'short' }),
      short: fmt({ month: 'short', day: 'numeric' }),
      long: fmt({ month: 'short', day: 'numeric', year: 'numeric' }),
      buttonLabel: offset === 0 ? 'Today' : fmt({ weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });
}

function render() {
  const day = days[selectedDay];
  const state = recommendations.get(currentForecast(), {
    location: MOCK_LOCATION, date: day.key, today: days[0].key,
  });
  ui.renderTopBar({
    locationName: view === 'firstrun' ? '' : state.location.name,
    dateLabel: day.buttonLabel,
    isForecast: selectedDay > 0,
  });
  ui.renderLoaded({
    ...state,
    dateLong: day.long,
  });
  ui.setView(view);
  // Only a loaded forecast tints the page; other states stay neutral.
  ui.setCondition(view === 'loaded' ? state.condition : 'neutral');
  devTools?.update({ forecast: currentForecast(), state, persistent: recommendations.persistent });
}

// ---- Dialogs ----

function openSelector({ focusSearch = false } = {}) {
  // Re-sync chips each time so a dismissed sheet doesn't keep an unapplied pick.
  ui.renderDateChips(days, selectedDay);
  $('selector').showModal();
  if (focusSearch) $('search-input').focus();
}

for (const dialog of document.querySelectorAll('dialog.sheet')) {
  // Clicking the dimmed backdrop (the dialog element itself) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
}

$('change-btn').addEventListener('click', () => openSelector());

$('selector-done').addEventListener('click', () => {
  selectedDay = ui.getCheckedDateIndex();
  $('selector').close();
  render();
});

$('search-form').addEventListener('submit', (event) => {
  event.preventDefault(); // Census geocoding is wired in the live-data checkpoint.
});

$('share-btn').addEventListener('click', () => $('share-dialog').showModal());
// Share (phone) and Download image (laptop) are wired in the share-card checkpoint.

// Buttons that appear in more than one view use data-action.
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'search') openSelector({ focusSearch: true });
  if (action === 'retry') simulateRetry();
  // 'geolocate' is wired in the live-data checkpoint.
});

/** Shell only: stands in for a real re-fetch until weather.js exists. */
function simulateRetry() {
  view = 'loading';
  render();
  setTimeout(() => {
    view = 'loaded';
    render();
  }, 900);
}

// ---- Info screen (hash route so the browser/phone Back button works) ----

$('info-btn').addEventListener('click', () => {
  cameFromApp = true;
  window.location.hash = 'info';
});

$('info-back').addEventListener('click', () => {
  // Pop our own history entry when we pushed one; a deep link to #info just goes home.
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

// ---- Start ----

devTools = initDevTools({
  onView: (next) => { view = next; render(); },
  onForecast: (next) => { forecastOverride = next; render(); },
  onReroll: () => {
    recommendations.reroll(currentForecast(), { location: MOCK_LOCATION, date: days[selectedDay].key, today: days[0].key });
    render();
  },
});
view = devTools.view ?? view;
forecastOverride = devTools.forecast;

render();
syncScreen(); // honors a deep link straight to #info

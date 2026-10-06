// App wiring: owns the current screen/view/date and connects controls to the UI.
//
// Checkpoint 1 (static shell): the loaded view is painted from SAMPLE, a
// placeholder shaped like a rendered recommendation. The next checkpoints
// replace it with the recommendation state computed in state.js from live
// NWS data (weather.js).

import * as ui from './ui.js';
import { initDevTools } from './dev.js';

const $ = (id) => document.getElementById(id);

// ---- Placeholder content (removed once state.js exists) ----

const SAMPLE = {
  locationName: 'Austin, TX',
  tempF: 58,
  feelsLikeF: 54,
  headline: 'Grab a jacket!',
  wearing: [
    { category: 'outerwear', label: 'Light jacket' },
    { category: 'top', label: 'T-shirt' },
    { category: 'bottom', label: 'Jeans' },
    { category: 'footwear', label: 'Sneakers' },
    { category: 'accessory', label: 'Baseball cap' },
  ],
  reminders: [
    { type: 'umbrella', text: "Don't forget your umbrella today." },
    { type: 'cold', text: "It's chilly — layer up." },
  ],
};

const SAMPLE_CONDITION_LABEL = {
  sunny: 'Sunny',
  cloudy: 'Mostly cloudy',
  rain: 'Rain showers',
  snow: 'Light snow',
  storm: 'Thunderstorms',
};

// ---- App state ----

const days = buildDays(new Date());
let selectedDay = 0;
let view = 'loaded';
let condition = 'cloudy';
let currentScreen = 'main';
let cameFromApp = false; // true once the in-app info button pushed a history entry

/** Today plus the next 6 days (spec #2). */
function buildDays(today) {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const fmt = (options) => date.toLocaleDateString('en-US', options);
    return {
      date,
      chipLabel: offset === 0 ? 'Today' : fmt({ weekday: 'short' }),
      short: fmt({ month: 'short', day: 'numeric' }),
      long: fmt({ month: 'short', day: 'numeric', year: 'numeric' }),
      buttonLabel: offset === 0 ? 'Today' : fmt({ weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });
}

function render() {
  const day = days[selectedDay];
  ui.renderTopBar({
    locationName: view === 'firstrun' ? '' : SAMPLE.locationName,
    dateLabel: day.buttonLabel,
    isForecast: selectedDay > 0,
  });
  ui.renderLoaded({
    ...SAMPLE,
    condition,
    conditionLabel: SAMPLE_CONDITION_LABEL[condition],
    dateLong: day.long,
  });
  ui.setView(view);
  // Only a loaded forecast tints the page; other states stay neutral.
  ui.setCondition(view === 'loaded' ? condition : 'neutral');
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

$('location-btn').addEventListener('click', () => openSelector());
$('date-btn').addEventListener('click', () => openSelector());
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

const overrides = initDevTools({
  onView: (next) => { view = next; render(); },
  onCondition: (next) => { condition = next; render(); },
});
view = overrides.view ?? view;
condition = overrides.condition ?? condition;

render();
syncScreen(); // honors a deep link straight to #info

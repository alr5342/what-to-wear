// DOM rendering for every screen and state. Nothing here decides *what* to
// show — callers pass in display data and this module only paints it.

import { garmentLayer } from './placeholder-art.js';

const $ = (id) => document.getElementById(id);

// Drawing order for the layered character, bottom to top.
const LAYER_ORDER = ['base', 'bottom', 'footwear', 'top', 'outerwear', 'accessory'];

const BASE_SRC = 'assets/placeholder/base.svg';

// Icon sprite ids (see the <svg> sprite in index.html).
const CONDITION_ICON = {
  sunny: 'sun',
  cloudy: 'cloud',
  rain: 'cloud-rain',
  snow: 'snowflake',
  storm: 'cloud-lightning',
};
const REMINDER_ICON = { umbrella: 'umbrella', sun: 'sun', hydration: 'droplet', cold: 'thermometer' };
const CATEGORY_ICON = { top: 'shirt', bottom: 'pants', footwear: 'shoe', outerwear: 'jacket', accessory: 'cap' };

const STATUS_TEXT = {
  firstrun: 'Set your location to get started.',
  loading: 'Loading the forecast…',
  loaded: 'Forecast loaded.',
  error: 'Unable to load weather data. Please try again.',
  denied: 'Location access denied. Enter a city or zip code instead.',
};

/** Returns an <svg> element that references a sprite symbol. */
export function icon(name, className = 'icon') {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

/** Stacks the base layer plus one layer per worn category. */
export function renderCharacter(container, wearing) {
  const worn = new Set(wearing.map((item) => item.category));
  const layers = LAYER_ORDER
    .filter((layer) => layer === 'base' || worn.has(layer))
    .map((layer) => {
      if (layer !== 'base') return garmentLayer(wearing.find((item) => item.category === layer));
      const img = document.createElement('img');
      img.src = BASE_SRC;
      img.alt = '';
      img.className = `layer layer-${layer}`;
      img.draggable = false;
      return img;
    });
  container.replaceChildren(...layers);

  const list = wearing.map((item) => `${item.colorName} ${item.label}`.toLowerCase());
  const described = list.length > 1
    ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`
    : list.join('');
  container.setAttribute('aria-label', described ? `Character wearing ${described}` : 'Character');
}

/** Paints the loaded Main view and the share card from one display object. */
export function renderLoaded(data) {
  $('headline').textContent = data.headline.text;

  $('condition-icon').replaceChildren(icon(CONDITION_ICON[data.condition]));
  $('temp').textContent = `${data.tempF}°F`;
  // Only show "feels like" when it actually differs from the temperature.
  $('feels').textContent = data.feelsLikeF !== data.tempF ? `(feels ${data.feelsLikeF}°F)` : '';
  $('condition-label').textContent = data.conditionLabel;

  $('wearing-list').replaceChildren(...data.wearing.map((item) => {
    const li = document.createElement('li');
    li.className = 'wearing-item';
    const tile = document.createElement('span');
    tile.className = 'wearing-icon';
    tile.append(icon(CATEGORY_ICON[item.category]));
    const label = document.createElement('span');
    label.textContent = item.label;
    li.append(tile, label);
    return li;
  }));

  const activeReminders = data.reminders.filter((reminder) => reminder.active);
  $('main').dataset.reminders = String(activeReminders.length);
  const reminders = activeReminders.length
    ? activeReminders.map((reminder) => {
      const li = document.createElement('li');
      li.className = 'reminder';
      li.append(icon(REMINDER_ICON[reminder.type]), reminder.text);
      return li;
    })
    : [Object.assign(document.createElement('li'), {
      className: 'reminder reminder-none',
      textContent: 'Nothing extra to bring today.',
    })];
  $('reminder-list').replaceChildren(...reminders);

  renderCharacter($('character'), data.wearing);

  // Share card mirrors the same data (spec #13).
  renderCharacter($('share-character'), data.wearing);
  $('share-headline').textContent = data.headline.text;
  $('share-icon').replaceChildren(icon(CONDITION_ICON[data.condition]));
  $('share-temp-value').textContent = `${data.tempF}°F`;
  $('share-condition').textContent = data.conditionLabel;
  $('share-location').textContent = data.location.name;
  $('share-date').textContent = data.dateLong;
}

/** Read-only top bar: selected location/date and Current/Forecast badge. */
export function renderTopBar({ locationName, dateLabel, isForecast }) {
  $('location-name').textContent = locationName || 'Set your location';
  $('date-label').textContent = dateLabel;
  $('period-label').textContent = isForecast ? 'Forecast' : 'Current';
}

/** Switches the Main content region between loaded/firstrun/loading/error/denied. */
export function setView(view) {
  const main = $('main');
  main.dataset.view = view;
  main.setAttribute('aria-busy', String(view === 'loading'));
  for (const section of main.querySelectorAll('.view')) {
    section.hidden = section.dataset.view !== view;
  }
  // The Current/Forecast label only makes sense once a forecast is showing.
  $('period-label').hidden = view !== 'loaded';
  $('status').textContent = STATUS_TEXT[view] ?? '';
}

/** Tints the page for a weather condition (or 'neutral'). */
export function setCondition(condition) {
  document.body.dataset.condition = condition;
}

/** Builds the 7 date chips as a radio group. */
export function renderDateChips(days, selectedIndex) {
  $('date-chips').replaceChildren(...days.map((day, index) => {
    const label = document.createElement('label');
    label.className = 'chip';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'forecast-date';
    input.value = String(index);
    input.checked = index === selectedIndex;
    const face = document.createElement('span');
    const sub = document.createElement('small');
    sub.textContent = day.short;
    face.append(day.chipLabel, sub);
    label.append(input, face);
    return label;
  }));
}

export function getCheckedDateIndex() {
  const checked = document.querySelector('input[name="forecast-date"]:checked');
  return checked ? Number(checked.value) : 0;
}

/** Shows either the Main screen or the Info screen and moves focus sensibly. */
export function showScreen(name) {
  const isInfo = name === 'info';
  $('main-screen').hidden = isInfo;
  $('info-screen').hidden = !isInfo;
  window.scrollTo(0, 0);
  if (isInfo) $('info-title').focus();
}

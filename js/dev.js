// Developer-only mock injection. These controls exercise the real rules in
// state.js; they never independently change just an icon or headline.
import { MOCK_FORECASTS, CONDITION_DEFAULTS } from './mock.js';

export const VIEWS = ['loaded', 'firstrun', 'loading', 'error', 'denied'];
export const CONDITIONS = ['sunny', 'cloudy', 'rain', 'snow', 'storm'];

export function initDevTools({ onView, onForecast, onReroll }) {
  const params = new URLSearchParams(window.location.search);
  const view = VIEWS.includes(params.get('view')) ? params.get('view') : null;
  let forecast = CONDITION_DEFAULTS[params.get('condition')] ?? null;
  const hasWeatherInputs = ['high', 'low', 'wind', 'precip', 'weather'].some((name) => params.has(name));
  if (params.has('dev') && hasWeatherInputs) {
    const candidate = { ...(forecast ?? MOCK_FORECASTS[0]) };
    for (const [query, field] of [['high', 'highF'], ['low', 'lowF'], ['precip', 'precipProbability']]) {
      const raw = params.get(query);
      if (query === 'precip' && raw === '') candidate[field] = null;
      else if (raw !== null && raw !== '' && Number.isFinite(Number(raw))) candidate[field] = Number(raw);
    }
    if (params.has('wind')) candidate.windSpeed = params.get('wind');
    if (params.get('weather') === 'mixed') candidate.shortForecast = 'Rain and snow';
    if (candidate.lowF <= candidate.highF) forecast = candidate;
  }
  if (!params.has('dev')) return { view, forecast, update() {} };
  const bar = document.createElement('details');
  bar.className = 'devbar';
  bar.innerHTML = '<summary>dev preview · mock weather</summary>';
  const views = buttonGroup('View', VIEWS, onView);
  const presets = buttonGroup('Mock forecast', MOCK_FORECASTS.map((entry) => entry.name), (name) => {
    const next = MOCK_FORECASTS.find((entry) => entry.name === name);
    saveForecastURL(next);
    onForecast(next);
  });
  const form = document.createElement('form');
  form.className = 'dev-forecast';
  form.innerHTML = `
    <label>High °F<input name="high" type="number" step="any" min="-100" max="140" required></label>
    <label>Low °F<input name="low" type="number" step="any" min="-100" max="140" required></label>
    <label>Wind (mph/range)<input name="wind" type="text" required></label>
    <label>Precip %<input name="precip" type="number" min="0" max="100" step="any"></label>
    <label>Weather<select name="weather">
      <option value="cloudy">Mostly cloudy</option><option value="sunny">Sunny</option>
      <option value="rain">Rain showers</option><option value="snow">Snow</option>
      <option value="storm">Thunderstorms</option><option value="mixed">Rain and snow</option>
    </select></label>
    <button type="submit">Apply forecast</button>`;
  const status = document.createElement('p');
  status.id = 'dev-status';
  status.setAttribute('role', 'status');
  const reroll = document.createElement('button');
  reroll.type = 'button';
  reroll.textContent = 'New choices for this date';
  reroll.addEventListener('click', onReroll);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = form.elements;
    const next = {
      highF: Number(fields.high.value), lowF: Number(fields.low.value),
      windSpeed: fields.wind.value,
      precipProbability: fields.precip.value === '' ? null : Number(fields.precip.value),
      shortForecast: fields.weather.selectedOptions[0].textContent,
    };
    if (next.lowF > next.highF) { status.textContent = 'Low must be at or below high.'; return; }
    saveForecastURL(next, fields.weather.value);
    onForecast(next);
  });
  bar.append(views, presets, form, reroll, status);
  document.body.append(bar);
  return {
    view, forecast,
    update({ forecast: current, state, persistent }) {
      form.elements.high.value = current.highF;
      form.elements.low.value = current.lowF;
      form.elements.wind.value = current.windSpeed;
      form.elements.precip.value = current.precipProbability ?? '';
      const wording = current.shortForecast;
      form.elements.weather.value = [...form.elements.weather.options].find((option) => option.textContent === wording)?.value ?? 'cloudy';
      for (const button of views.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button.textContent === document.getElementById('main').dataset.view));
      }
      for (const button of presets.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button.textContent === current.name));
      }
      status.textContent = `${state.combinationCount} garment combinations · ${persistent ? 'saved on this browser' : 'choices saved for this tab only'}`;
    },
  };
}

function saveForecastURL(forecast, weather) {
  const url = new URL(window.location.href);
  const condition = Object.entries(CONDITION_DEFAULTS).find(([, entry]) => entry.shortForecast === forecast.shortForecast)?.[0] ?? 'cloudy';
  url.searchParams.set('condition', condition);
  url.searchParams.set('high', forecast.highF);
  url.searchParams.set('low', forecast.lowF);
  url.searchParams.set('wind', forecast.windSpeed);
  // Empty probability represents missing data, not zero.
  url.searchParams.set('precip', forecast.precipProbability ?? '');
  if (weather === 'mixed') url.searchParams.set('weather', 'mixed');
  else url.searchParams.delete('weather');
  window.history.replaceState(null, '', url);
}

function buttonGroup(title, values, onPick) {
  const group = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = title;
  group.append(legend);

  const buttons = values.map((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;
    button.addEventListener('click', () => {
      onPick(value);
    });
    return button;
  });
  group.append(...buttons);
  return group;
}

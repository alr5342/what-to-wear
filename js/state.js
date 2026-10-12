// Pure recommendation rules. Every visual and written output derives from this
// state; the renderer never selects clothing, wording, or colors itself.

export const COLORS = [
  { name: 'Navy', value: '#405b86' },
  { name: 'Olive', value: '#74834b' },
  { name: 'Rust', value: '#bb6545' },
];

export const WARDROBE = {
  tee: { category: 'top', label: 'T-shirt' },
  longsleeve: { category: 'top', label: 'Light long-sleeve' },
  sweater: { category: 'top', label: 'Sweater' },
  shorts: { category: 'bottom', label: 'Shorts' },
  chinos: { category: 'bottom', label: 'Chinos' },
  joggers: { category: 'bottom', label: 'Joggers' },
  sneakers: { category: 'footwear', label: 'Sneakers' },
  ankleboots: { category: 'footwear', label: 'Waterproof boots' },
  winterboots: { category: 'footwear', label: 'Insulated boots' },
  shell: { category: 'outerwear', label: 'Rain shell' },
  coat: { category: 'outerwear', label: 'Insulated coat' },
  sunhat: { category: 'accessory', label: 'Sun hat' },
  beanie: { category: 'accessory', label: 'Beanie' },
};

export const HEADLINES = {
  wet: ['Rain-ready layers.', 'Keep your raincoat handy.', 'A rain layer kind of day.'],
  cold: ['Bundle-up weather.', 'Warm layers, good call.', 'Keep the cozy layers close.'],
  hot: ['Keep it light today.', 'Dress light, bring water.', 'Stay cool out there.'],
  jacket: ['Grab a jacket!', 'A light layer goes a long way.', 'Keep a jacket handy.'],
  sunny: ['Sunglasses weather!', 'Bring a little shade.', 'Sunny skies, sun-ready style.'],
  mild: ['An easy outfit kind of day.', 'Keep it comfy today.', 'Ready, dressed, out the door.'],
};

export const REMINDERS = {
  umbrella: ["Bring an umbrella — rain's likely.", "Don't forget your umbrella today.", 'Showers expected, grab an umbrella.'],
  sun: ['Sunny skies — wear sunscreen.', "Bright skies — don't skip the sunscreen.", 'Clear and bright — protect your skin.'],
  hydration: ["It's hot — drink extra water.", 'Stay hydrated out there today.', "Heat's up, keep that water bottle full."],
  cold: ["It's chilly — layer up.", 'Cold one today, bundle up.', 'Temps are dropping, add a layer.'],
};

const CONDITION_LABEL = { sunny: 'Sunny', cloudy: 'Mostly cloudy', rain: 'Rain showers', snow: 'Snow', storm: 'Thunderstorms' };

/** NWS strings include ranges; use their upper bound, never the sum. */
export function parseWind(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, value) : 0;
  const speeds = String(value ?? '').match(/\d+(?:\.\d+)?/g);
  return speeds ? Math.max(...speeds.map(Number)) : 0;
}

export function windChill(tempF, windMph) {
  if (tempF > 50 || windMph <= 3) return tempF;
  return 35.74 + 0.6215 * tempF - 35.75 * windMph ** 0.16 + 0.4275 * tempF * windMph ** 0.16;
}

/** Returns only weather-derived facts/eligibility, without random selection. */
export function analyzeForecast(forecast) {
  const { highF, lowF } = forecast;
  if (!Number.isFinite(highF) || !Number.isFinite(lowF) || lowF > highF) {
    throw new Error('A usable forecast needs a high and low, with low ≤ high.');
  }
  const windMph = parseWind(forecast.windSpeed);
  const feelsLikeF = windChill(highF, windMph);
  const text = `${forecast.shortForecast ?? ''} ${forecast.icon ?? ''}`.toLowerCase();
  const snow = /snow|sleet|ice|freezing rain|fzra/.test(text);
  // "Freezing rain" remains wet; snow/sleet alone must not imply rain.
  const rain = /rain|drizzle|\bshra\b|\bra\b/.test(text) || (!snow && /showers/.test(text));
  const storm = /thunder|storm|\btsra\b/.test(text);
  const snowOnly = snow && !rain && !storm;
  const sunny = /sunny|clear|\bfew\b|\bskc\b/.test(text);
  const probability = Number.isFinite(forecast.precipProbability) ? forecast.precipProbability : null;
  const wet = rain || storm || (!snowOnly && probability !== null && probability >= 40);
  const cold = lowF <= 45 || feelsLikeF <= 40 || snow;
  const daytimeCold = highF <= 45 || feelsLikeF <= 40 || snow;
  const warm = highF >= 70 && !daytimeCold;
  const outerwear = lowF <= 60 || windMph >= 15 || (probability !== null && probability >= 40) || wet || snow;
  const active = {
    umbrella: probability !== null && probability >= 40 && !snowOnly,
    sun: sunny && highF >= 60,
    hydration: highF >= 85,
    cold,
  };
  const condition = storm ? 'storm' : snow ? 'snow' : wet ? 'rain' : sunny ? 'sunny' : 'cloudy';
  const situation = wet ? 'wet' : daytimeCold ? 'cold' : active.hydration ? 'hot'
    : outerwear ? 'jacket' : active.sun ? 'sunny' : 'mild';
  const eligible = {
    top: warm ? ['tee', 'longsleeve'] : ['longsleeve', 'sweater'],
    bottom: warm && !cold ? ['shorts', 'chinos'] : ['chinos', 'joggers'],
    footwear: daytimeCold ? ['winterboots'] : wet ? [cold ? 'winterboots' : 'ankleboots']
      : !warm || cold ? ['sneakers', 'ankleboots'] : ['sneakers'],
    outerwear: outerwear ? [cold ? 'coat' : 'shell'] : [],
    accessory: daytimeCold ? ['beanie'] : active.sun ? ['sunhat'] : [],
  };
  return { highF, lowF, windMph, feelsLikeF, condition, situation, active, eligible };
}

/** Counts actual garment combinations; colors deliberately don't contribute. */
export function countGarmentCombinations(eligible) {
  return Object.values(eligible).reduce((count, items) => count * Math.max(1, items.length), 1);
}

const validIndex = (value, length) => Number.isInteger(value) && value >= 0 && value < length;
const pickIndex = (length, random) => Math.floor(random() * length);

export function createRecommendation(forecast, { location, date, today, previous = null, random = Math.random }) {
  const facts = analyzeForecast(forecast);
  const outfit = {};
  for (const [category, eligible] of Object.entries(facts.eligible)) {
    if (!eligible.length) { outfit[category] = null; continue; }
    const old = previous?.outfit?.[category];
    const itemId = eligible.includes(old?.itemId) ? old.itemId : eligible[pickIndex(eligible.length, random)];
    const colorIndex = validIndex(old?.colorIndex, COLORS.length) ? old.colorIndex : pickIndex(COLORS.length, random);
    outfit[category] = { itemId, colorIndex };
  }
  const oldHeadline = previous?.headline;
  const variationIndex = oldHeadline?.situation === facts.situation && validIndex(oldHeadline.variationIndex, 3)
    ? oldHeadline.variationIndex : pickIndex(3, random);
  const headline = { situation: facts.situation, variationIndex, text: HEADLINES[facts.situation][variationIndex] };
  const reminders = Object.entries(facts.active).map(([type, active]) => {
    const old = Array.isArray(previous?.reminders) ? previous.reminders.find((entry) => entry?.type === type) : null;
    const index = validIndex(old?.variationIndex, 3) ? old.variationIndex : pickIndex(3, random);
    return { type, active, variationIndex: index, text: REMINDERS[type][index] };
  });
  const wearing = Object.entries(outfit).filter(([, selection]) => selection).map(([category, selection]) => ({
    category, ...selection, label: WARDROBE[selection.itemId].label,
    color: COLORS[selection.colorIndex].value, colorName: COLORS[selection.colorIndex].name,
  }));
  return {
    location, date, isForecast: date !== today, tempF: facts.highF,
    feelsLikeF: Math.round(facts.feelsLikeF), lowF: facts.lowF,
    condition: facts.condition, conditionLabel: forecast.shortForecast || CONDITION_LABEL[facts.condition],
    headline, outfit, wearing, reminders,
    combinationCount: countGarmentCombinations(facts.eligible),
  };
}

/** Local storage is optional. Keep a tab-local fallback if access/quota fails. */
export function createRecommendationStore(storage, { namespace = 'mock' } = {}) {
  const memory = new Map();
  const prefix = `what-to-wear:${namespace}:v1:`;
  let persistent = Boolean(storage);
  return {
    get persistent() { return persistent; },
    get(forecast, options) {
      const { location, date } = options;
      const key = `${prefix}${location.lat},${location.lon}:${date}`;
      let previous = memory.get(key);
      if (!previous && storage) {
        try {
          const saved = JSON.parse(storage.getItem(key));
          if (saved?.version === 1 && saved.state && typeof saved.state === 'object') previous = saved.state;
        } catch { /* Invalid JSON or unavailable storage: generate valid choices. */ }
      }
      const state = createRecommendation(forecast, { ...options, previous });
      memory.set(key, state);
      if (storage) {
        try { storage.setItem(key, JSON.stringify({ version: 1, state })); }
        catch { persistent = false; }
      }
      return state;
    },
    // Preview-only reroll: replace just this recommendation, never clear site data.
    reroll(forecast, options) {
      const key = `${prefix}${options.location.lat},${options.location.lon}:${options.date}`;
      const state = createRecommendation(forecast, options);
      memory.set(key, state);
      if (storage) {
        try { storage.setItem(key, JSON.stringify({ version: 1, state })); }
        catch { persistent = false; }
      }
      return state;
    },
    // Live mode saves only the current location; mock previews use another namespace.
    retainLocation(location) {
      const keep = `${prefix}${location.lat},${location.lon}:`;
      for (const key of memory.keys()) if (!key.startsWith(keep)) memory.delete(key);
      if (storage) {
        try {
          const remove = [];
          for (let index = 0; index < storage.length; index++) {
            const key = storage.key(index);
            if (key?.startsWith(prefix) && !key.startsWith(keep)) remove.push(key);
          }
          remove.forEach((key) => storage.removeItem(key));
        } catch { persistent = false; }
      }
    },
  };
}

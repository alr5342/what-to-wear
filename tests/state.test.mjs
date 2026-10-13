import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeForecast, createRecommendation, createRecommendationStore, countGarmentCombinations, parseWind, windChill, WARDROBE, COLORS, HEADLINES } from '../js/state.js';
import { MOCK_FORECASTS, MOCK_LOCATION } from '../js/mock.js';

const base = { highF: 75, lowF: 65, windSpeed: '5 mph', precipProbability: 0, shortForecast: 'Mostly cloudy' };
const options = { location: MOCK_LOCATION, date: '2026-10-12', today: '2026-10-12' };
const analyze = (patch = {}) => analyzeForecast({ ...base, ...patch });
const make = (patch = {}, extra = {}) => createRecommendation({ ...base, ...patch }, { ...options, ...extra });
const memoryStorage = () => {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('wind ranges, calm/missing input, and wind-chill validity limits', () => {
  assert.equal(parseWind('10 to 15 mph'), 15);
  assert.equal(parseWind('Calm'), 0);
  assert.equal(parseWind(null), 0);
  assert.equal(parseWind(9), 9);
  assert.equal(windChill(51, 20), 51);
  assert.equal(windChill(30, 3), 30);
  assert.ok(Math.abs(windChill(30, 15) - 19.0) < 0.2);
});

test('exact boundaries: warm 70, coat low 45, shell low 60, wind 15, precipitation 40, sun 60, hot 85', () => {
  assert.deepEqual(analyze({ highF: 69.9 }).eligible.top, ['longsleeve', 'sweater']);
  assert.deepEqual(analyze({ highF: 70 }).eligible.top, ['tee']);
  assert.deepEqual(analyze({ highF: 65, lowF: 45 }).eligible.outerwear, ['coat']);
  assert.deepEqual(analyze({ lowF: 45.1 }).eligible.outerwear, ['shell']);
  assert.deepEqual(analyze({ lowF: 60 }).eligible.outerwear, ['shell']);
  assert.deepEqual(analyze({ lowF: 60.1 }).eligible.outerwear, []);
  assert.deepEqual(analyze({ windSpeed: '14.9 mph' }).eligible.outerwear, []);
  assert.deepEqual(analyze({ windSpeed: '10 to 15 mph' }).eligible.outerwear, ['shell']);
  assert.equal(analyze({ precipProbability: 39.9 }).active.umbrella, false);
  assert.equal(analyze({ precipProbability: 40 }).active.umbrella, true);
  assert.equal(analyze({ highF: 59.9, lowF: 55, shortForecast: 'Sunny' }).active.sun, false);
  assert.equal(analyze({ highF: 60, lowF: 55, shortForecast: 'Sunny' }).active.sun, true);
  assert.equal(analyze({ highF: 84.9 }).active.hydration, false);
  assert.equal(analyze({ highF: 85 }).active.hydration, true);
});

test('daytime cold boundary and wind chill select insulated footwear and beanie', () => {
  assert.deepEqual(analyze({ highF: 45, lowF: 44, windSpeed: '0 mph' }).eligible.accessory, ['beanie']);
  assert.deepEqual(analyze({ highF: 45.1, lowF: 44, windSpeed: '0 mph' }).eligible.accessory, []);
  assert.deepEqual(analyze({ highF: 45.5, lowF: 45.2, windSpeed: '20 mph' }).eligible.footwear, ['winterboots']);
  assert.equal(analyze({ highF: 50, lowF: 46, windSpeed: '0 mph' }).active.cold, false);
  const windAt40 = ((40 - 35.74 - 0.6215 * 50) / (-35.75 + 0.4275 * 50)) ** (1 / 0.16);
  assert.equal(analyze({ highF: 50, lowF: 46, windSpeed: windAt40 * 0.9999 }).active.cold, false);
  assert.equal(analyze({ highF: 50, lowF: 46, windSpeed: windAt40 * 1.0001 }).active.cold, true);
});

test('snow-only suppresses umbrella; mixed rain/snow and freezing rain remain wet', () => {
  for (const text of ['Snow', 'Light snow', 'Snow showers', 'Scattered snow showers', 'Sleet']) {
    const facts = analyze({ highF: 30, lowF: 20, precipProbability: 90, shortForecast: text });
    assert.equal(facts.active.umbrella, false);
    assert.equal(facts.situation, 'cold');
    assert.deepEqual(facts.eligible.footwear, ['winterboots']);
    assert.deepEqual(facts.eligible.accessory, ['beanie']);
  }
  for (const text of ['Rain and snow', 'Freezing rain']) {
    const facts = analyze({ highF: 35, lowF: 25, precipProbability: 90, shortForecast: text });
    assert.equal(facts.active.umbrella, true);
    assert.equal(facts.situation, 'wet');
    assert.deepEqual(facts.eligible.outerwear, ['coat']);
  }
});

test('hot afternoon/cold night uses daytime garments, a light layer, and independent reminders', () => {
  const facts = analyze({ highF: 90, lowF: 40, shortForecast: 'Sunny' });
  assert.deepEqual(facts.eligible.top, ['tee']);
  assert.deepEqual(facts.eligible.bottom, ['shorts', 'chinos', 'joggers']);
  assert.deepEqual(facts.eligible.outerwear, ['shell']);
  assert.deepEqual(facts.eligible.accessory, ['sunhat']);
  assert.equal(facts.situation, 'hot');
  assert.equal(facts.active.cold, true);
  assert.equal(facts.active.sun, true);
  assert.equal(facts.active.hydration, true);
});

test('wet hot weather remains rain-first with a shell and waterproof shoes', () => {
  const facts = analyze({ highF: 90, lowF: 72, shortForecast: 'Thunderstorms', precipProbability: 80 });
  assert.equal(facts.situation, 'wet');
  assert.equal(facts.active.hydration, true);
  assert.deepEqual(facts.eligible.outerwear, ['shell']);
  assert.deepEqual(facts.eligible.footwear, ['ankleboots']);
});

test('a rain condition forces waterproof gear even without precipitation probability', () => {
  const facts = analyze({ precipProbability: null, shortForecast: 'Rain showers' });
  assert.deepEqual(facts.eligible.outerwear, ['shell']);
  assert.deepEqual(facts.eligible.footwear, ['ankleboots']);
  assert.equal(facts.active.umbrella, false);
  assert.equal(analyze({ precipProbability: null }).condition, 'cloudy');
});

test('all six headline categories have three wordings and appropriate priority', () => {
  const found = new Set(MOCK_FORECASTS.map((fixture) => analyzeForecast(fixture).situation));
  assert.deepEqual(found, new Set(Object.keys(HEADLINES)));
  for (const wordings of Object.values(HEADLINES)) assert.equal(wordings.length, 3);
  assert.equal(analyze({ highF: 90, lowF: 58 }).situation, 'hot');
  assert.equal(analyze({ highF: 40, lowF: 30, shortForecast: 'Rain' }).situation, 'wet');
  assert.equal(analyze({ highF: 40, lowF: 30 }).situation, 'cold');
});

test('13 source garments; independent palettes add three choices to every visible slot', () => {
  assert.equal(Object.keys(WARDROBE).length, 13);
  assert.equal(COLORS.length, 3);
  assert.deepEqual(Object.values(WARDROBE).reduce((counts, item) => {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
    return counts;
  }, {}), { top: 3, bottom: 3, footwear: 3, outerwear: 2, accessory: 2 });
});

test('weather grid proves at least three garment combinations for every forecast, excluding colors', () => {
  let forecasts = 0;
  for (const highF of [20, 40, 45, 50, 60, 69.9, 70, 84.9, 85, 95]) {
    for (const lowF of [20, 45, 45.1, 60, 60.1, 70].filter((low) => low <= highF)) {
      for (const windSpeed of [0, 3, 15, 25]) {
        for (const precipProbability of [null, 0, 39.9, 40, 80]) {
          for (const shortForecast of ['Sunny', 'Mostly cloudy', 'Rain', 'Snow', 'Rain and snow', 'Thunderstorms']) {
            const facts = analyzeForecast({ highF, lowF, windSpeed, precipProbability, shortForecast });
            const outfits = new Set();
            for (const top of facts.eligible.top) for (const bottom of facts.eligible.bottom) {
              outfits.add(`${top}/${bottom}/${facts.eligible.footwear[0]}`);
            }
            assert.ok(outfits.size >= 3);
            assert.ok(countGarmentCombinations(facts.eligible) >= 3);
            if (facts.highF < 70 || facts.condition === 'snow') assert.ok(!facts.eligible.bottom.includes('shorts'));
            if (facts.condition === 'snow') assert.deepEqual(facts.eligible.footwear, ['winterboots']);
            forecasts++;
          }
        }
      }
    }
  }
  console.log(`Combination/eligibility grid: ${forecasts} forecasts passed (minimum three garment combinations).`);
});

test('selection can produce all four snow outfits without color changes', () => {
  const snow = { highF: 30, lowF: 20, shortForecast: 'Snow' };
  const combinations = new Set();
  for (const topRoll of [0, 0.99]) for (const bottomRoll of [0, 0.99]) {
    const rolls = [topRoll, 0, bottomRoll, 0];
    const state = make(snow, { random: () => rolls.shift() ?? 0 });
    assert.equal(state.outfit.top.colorIndex, 0);
    assert.equal(state.outfit.bottom.colorIndex, 0);
    combinations.add(`${state.outfit.top.itemId}/${state.outfit.bottom.itemId}`);
  }
  assert.equal(combinations.size, 4);
});

test('each garment, color, headline, and reminder gets its own random choice', () => {
  const rolls = [0, 0.99, 0.99, 0, 0, 0.5, 0, 0.99, 0.5, 0, 0.99, 0.5, 0.99];
  const state = make({ shortForecast: 'Sunny' }, { random: () => rolls.shift() ?? 0 });
  assert.equal(state.outfit.top.itemId, 'tee');
  assert.equal(state.outfit.top.colorIndex, 2);
  assert.equal(state.outfit.bottom.itemId, 'joggers');
  assert.equal(state.outfit.bottom.colorIndex, 0);
  assert.equal(state.outfit.footwear.colorIndex, 1);
  assert.equal(state.outfit.accessory.colorIndex, 2);
  assert.equal(state.headline.variationIndex, 1);
  assert.equal(state.reminders.find((entry) => entry.type === 'sun').variationIndex, 2);
});

test('stored choices survive fresh store/reload, date roundtrip, and location separation', () => {
  const storage = memoryStorage();
  const first = createRecommendationStore(storage).get(base, { ...options, random: () => 0 });
  const store = createRecommendationStore(storage);
  store.get(base, { ...options, date: '2026-10-13', random: () => 0.99 });
  const restored = store.get(base, { ...options, random: () => { throw new Error('Restored choice should not reroll'); } });
  assert.deepEqual(restored, first);
  const other = store.get(base, { ...options, location: { name: 'Other', lat: 40, lon: -90 }, random: () => 0.99 });
  assert.notDeepEqual(other.outfit, first.outfit);
  assert.equal(storage.data.size, 3);
});

test('weather updates replace ineligible pieces while retaining valid choices and colors', () => {
  const first = make({ shortForecast: 'Sunny' }, { random: () => 0 });
  assert.equal(first.outfit.bottom.itemId, 'shorts');
  const cold = make({ highF: 30, lowF: 20, shortForecast: 'Snow' }, { previous: first, random: () => 0.99 });
  assert.ok(['chinos', 'joggers'].includes(cold.outfit.bottom.itemId));
  assert.equal(cold.outfit.footwear.itemId, 'winterboots');
  assert.equal(cold.outfit.accessory.itemId, 'beanie');
  assert.equal(cold.outfit.bottom.colorIndex, first.outfit.bottom.colorIndex);
  assert.equal(cold.headline.situation, 'cold');
});

test('broken/denied storage and malformed saved values recover without crashing', () => {
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
  const store = createRecommendationStore(denied);
  const first = store.get(base, { ...options, random: () => 0 });
  assert.equal(store.persistent, false);
  assert.deepEqual(store.get(base, { ...options, random: () => 0.99 }), first);
  for (const invalid of ['{broken', 'null', '{"version":1,"state":{"outfit":{"top":{"itemId":"alien","colorIndex":99}},"reminders":[null]}}']) {
    const storage = { getItem: () => invalid, setItem() {} };
    const recovered = createRecommendationStore(storage).get(base, options);
    assert.ok(WARDROBE[recovered.outfit.top.itemId]);
    assert.ok(recovered.outfit.top.colorIndex < 3);
  }
});

test('missing/reversed temperatures are rejected instead of inventing recommendations', () => {
  assert.throws(() => analyze({ highF: null }), /usable forecast/);
  assert.throws(() => analyze({ lowF: 80 }), /usable forecast/);
});

test('warm dry, rainy and windy days use tees and retain three actual outfits; saved long sleeves are replaced', () => {
  for (const highF of [70, 75, 85, 95]) for (const patch of [{}, {shortForecast:'Rain',precipProbability:80}, {windSpeed:20}, {lowF:40}]) {
    const forecast={...base,highF,...patch}; const facts=analyzeForecast(forecast);
    assert.deepEqual(facts.eligible.top,['tee']);
    assert.ok(countGarmentCombinations(facts.eligible)>=3);
    assert.ok(!facts.eligible.footwear.includes('winterboots'));
    assert.ok(!facts.eligible.outerwear.includes('coat'));
    if(patch.shortForecast==='Rain') {assert.deepEqual(facts.eligible.footwear,['ankleboots']);assert.deepEqual(facts.eligible.outerwear,['shell']);}
    if(patch.windSpeed===20) assert.deepEqual(facts.eligible.outerwear,['shell']);
  }
  const previous=make({highF:65,lowF:55},{random:()=>0});
  const updated=make({}, {previous,random:()=>0});
  assert.equal(updated.outfit.top.itemId,'tee');
  const outfits=new Set([0,.4,.9].map(roll=>make({}, {random:()=>roll}).wearing.map(x=>x.itemId).join('/')));
  assert.equal(outfits.size,3);
});

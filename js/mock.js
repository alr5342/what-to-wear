// Checkpoint 2 fixtures, replaced with provider data in the live-data checkpoint.
export const MOCK_LOCATION = { name: 'Austin, TX', lat: 30.2672, lon: -97.7431 };
export const MOCK_FORECASTS = [
  { name: 'Jacket', highF: 64, lowF: 50, windSpeed: '8 mph', precipProbability: 10, shortForecast: 'Mostly cloudy' },
  { name: 'Sunny', highF: 78, lowF: 65, windSpeed: '5 mph', precipProbability: 0, shortForecast: 'Sunny' },
  { name: 'Hot', highF: 90, lowF: 72, windSpeed: '5 mph', precipProbability: 0, shortForecast: 'Sunny' },
  { name: 'Rain', highF: 76, lowF: 64, windSpeed: '10 to 15 mph', precipProbability: 70, shortForecast: 'Rain showers' },
  { name: 'Snow', highF: 30, lowF: 22, windSpeed: '15 mph', precipProbability: 80, shortForecast: 'Snow' },
  { name: 'Storm', highF: 82, lowF: 68, windSpeed: '15 to 25 mph', precipProbability: 90, shortForecast: 'Thunderstorms' },
  { name: 'Mild', highF: 68, lowF: 62, windSpeed: '5 mph', precipProbability: 10, shortForecast: 'Mostly cloudy' },
];

export const CONDITION_DEFAULTS = {
  sunny: MOCK_FORECASTS[1], cloudy: MOCK_FORECASTS[0], rain: MOCK_FORECASTS[3],
  snow: MOCK_FORECASTS[4], storm: MOCK_FORECASTS[5],
};

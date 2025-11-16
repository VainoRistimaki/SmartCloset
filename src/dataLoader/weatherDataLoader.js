const weatherApiKey = '94ba5e59f3634f53a25233841251411';
const buildWeatherUrl = (location) =>
  `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${encodeURIComponent(
    location
  )}&aqi=yes`;

const options = {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

export async function getWeatherData(location = 'Daejeon') {
  const weatherData = await fetch(buildWeatherUrl(location), options).then((response) =>
    response.json()
  );

  if (weatherData.error) {
    console.error(
      'API Error:',
      weatherData.error.code,
      weatherData.error.message
    );
    return null;
  }

  const city = weatherData.location.name;
  const country = weatherData.location.country;

  const tempC = weatherData.current.temp_c;
  const feelsLikeC = weatherData.current.feelslike_c;
  const cloud = weatherData.current.cloud;
  const windMph = weatherData.current.wind_mph;
  const windKph = weatherData.current.wind_kph;

  const conditionText = weatherData.current.condition.text;
  const humidity = weatherData.current.humidity;
  const currentPrecipMm = weatherData.current.precip_mm;
  const uv = weatherData.current.uv;

  const aq = weatherData.current.air_quality;

  console.log('City:', city, `(${country})`);
  // console.log('Temperature:', tempC, '°C');
  console.log('Feels like:', feelsLikeC, '°C');
  // console.log('Cloud:', cloud, '%');
  // console.log('Wind:', windMph, 'mph /', windKph, 'kph');
  // console.log('Condition:', conditionText);
  // console.log('Humidity:', humidity, '%');
  // console.log('Precipitation (current):', currentPrecipMm, 'mm');
  // console.log('UV:', uv);

  // if (aq) {
  //   console.log('--- Air Quality ---');
  //   console.log('CO (µg/m3):', aq.co); //carbon monoxide
  //   console.log('O3 (µg/m3):', aq.o3); //ozone
  //   console.log('NO2 (µg/m3):', aq.no2); //nitrogen oxide
  //   console.log('SO2 (µg/m3):', aq.so2); //sulpur oxide
  // } else {
  //   console.log('No air quality data returned');
  // }

  const output = `
    City: ${city} (${country})
    Temperature: ${tempC} °C
    Feels like: ${feelsLikeC} °C
    Cloud: ${cloud} %
    Wind: ${windMph} mph / ${windKph} kph
    Condition: ${conditionText}
    Humidity: ${humidity} %
    Precipitation (current): ${currentPrecipMm} mm
    UV: ${uv}
    ${aq
      ? `--- Air Quality ---
    CO (µg/m3): ${aq.co}
    O3 (µg/m3): ${aq.o3}
    NO2 (µg/m3): ${aq.no2}
    SO2 (µg/m3): ${aq.so2}`
      : 'No air quality data returned'}
    `;

  return weatherData.current;
}

// const weather = await getWeatherData();
// console.log(weather);
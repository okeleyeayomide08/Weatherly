// =========================
// GLOBAL SELECTORS
// =========================
const body = document.body;
const searchInput = document.getElementById("city");
const searchBtn = document.getElementById("search");

// Main weather
const cityName = document.getElementById("city-name");
const dateEl = document.getElementById("date");
const tempEl = document.getElementById("temperature");
const weatherIcon = document.getElementById("weather-icon");

// Sub details
const feelsEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const precipitationEl = document.getElementById("precipitation");

// Weekly forecast
const dailyContainer = document.getElementById("daily-forcast");
const dailyTemplate = document.getElementById("daily-template");

// =========================
// CONFIG
// =========================
const API_KEY = "a6cba0c6162589cee27420fdb5e216c6";
const API_URL = "https://api.openweathermap.org/data/2.5/";

// =========================
// THEME LOGIC
// =========================
function getWeatherTheme(weatherMain) {
  switch (weatherMain) {
    case "Clear":
      return "sunny";
    case "Clouds":
      return "cloudy";
    case "Rain":
    case "Drizzle":
      return "rainy";
    case "Thunderstorm":
      return "stormy";
    case "Snow":
      return "snowy";
    case "Mist":
    case "Fog":
    case "Haze":
      return "foggy";
    default:
      return "cloudy";
  }
}

function isNight(current, sunrise, sunset) {
  return current < sunrise || current > sunset;
}

function applyTheme(theme) {
  body.classList.remove(
    "weather-sunny",
    "weather-cloudy",
    "weather-rainy",
    "weather-stormy",
    "weather-snowy",
    "weather-foggy",
    "weather-night"
  );
  body.classList.add(`weather-${theme}`);
}

// =========================
// HELPER FUNCTIONS
// =========================
function formatDate(unix) {
  const date = new Date(unix * 1000);
  const options = { weekday: "short", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function kelvinToCelsius(k) {
  return Math.round(k - 273.15);
}

function clearMainWeather() {
  cityName.textContent = "";
  dateEl.textContent = "";
  tempEl.textContent = "";
  weatherIcon.hidden = true;
  feelsEl.textContent = "";
  humidityEl.textContent = "";
  windEl.textContent = "";
  precipitationEl.textContent = "";
}

function clearDailyForecast() {
  dailyContainer.innerHTML = "";
}

// =========================
// RENDER MAIN WEATHER
// =========================
function renderMainWeather(data) {
  const weather = data.weather[0];
  const main = data.main;
  const wind = data.wind;
  const dt = data.dt;
  const sys = data.sys;

  // Determine day/night for theme
  if (weather.main === "Clear" && isNight(dt, sys.sunrise, sys.sunset)) {
    applyTheme("night");
  } else {
    const theme = getWeatherTheme(weather.main);
    applyTheme(theme);
  }

  // Fill main content
  cityName.textContent = `${data.name}, ${data.sys.country}`;
  dateEl.textContent = formatDate(dt);
  tempEl.textContent = `${kelvinToCelsius(main.temp)}°`;

  // Icon
  weatherIcon.src = `assets/images/icon-${weather.main.toLowerCase()}.webp`;
  weatherIcon.alt = weather.main;
  weatherIcon.hidden = false;

  // Sub details
  feelsEl.textContent = `${kelvinToCelsius(main.feels_like)}°`;
  humidityEl.textContent = `${main.humidity}%`;
  windEl.textContent = `${wind.speed} km/hr`;
  precipitationEl.textContent = data.rain
    ? `${data.rain["1h"] ?? 0} mm`
    : "0 mm";
}

// =========================
// RENDER WEEKLY FORECAST
// =========================
function renderWeeklyForecast(data) {
  clearDailyForecast();
  data.daily.forEach((day) => {
    const clone = dailyTemplate.content.cloneNode(true);
    const dayEl = clone.querySelector(".daily-day");
    const iconEl = clone.querySelector(".icon");
    const tempEl = clone.querySelector(".temp");
    const windEl = clone.querySelector(".wind");

    dayEl.textContent = formatDate(day.dt).split(",")[0]; // weekday only
    iconEl.src = `assets/images/icon-${day.weather[0].main.toLowerCase()}.webp`;
    iconEl.alt = day.weather[0].main;
    iconEl.hidden = false;

    tempEl.textContent = `${kelvinToCelsius(day.temp.day)}°`;
    windEl.textContent = `${day.wind_speed} km/hr`;

    dailyContainer.appendChild(clone);
  });
}

// =========================
// FETCH WEATHER DATA
// =========================
async function fetchWeatherByCoords(lat, lon) {
  body.dataset.state = "loading";
  try {
    const [currentRes, weeklyRes] = await Promise.all([
      fetch(`${API_URL}weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
      fetch(
        `${API_URL}onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${API_KEY}`
      ),
    ]);

    const currentData = await currentRes.json();
    const weeklyData = await weeklyRes.json();

    renderMainWeather(currentData);
    renderWeeklyForecast(weeklyData);

    body.dataset.state = "ready";
  } catch (err) {
    console.error(err);
    body.dataset.state = "idle";
    alert("Failed to fetch weather data.");
  }
}

async function fetchWeatherByCity(city) {
  body.dataset.state = "loading";
  try {
    const currentRes = await fetch(
      `${API_URL}weather?q=${city}&appid=${API_KEY}`
    );
    const currentData = await currentRes.json();
    const { coord } = currentData;
    // Fetch weekly forecast using coordinates
    await fetchWeatherByCoords(coord.lat, coord.lon);
  } catch (err) {
    console.error(err);
    body.dataset.state = "idle";
    alert("City not found.");
  }
}

// =========================
// LOCATION PERMISSION
// =========================
function getLocationWeather() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    (err) => {
      console.warn("Location denied:", err.message);
      // fallback: remain idle, user can search manually
    }
  );
}

// =========================
// EVENT LISTENERS
// =========================
searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (!city) return;
  clearMainWeather();
  clearDailyForecast();
  fetchWeatherByCity(city);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// =========================
// ON PAGE LOAD
// =========================
window.addEventListener("load", () => {
  clearMainWeather();
  clearDailyForecast();
  getLocationWeather();
});

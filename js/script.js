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

// Daily forecast
const dailyContainer = document.getElementById("daily-forcast");
const dailyTemplate = document.getElementById("daily-template");

// =========================
// CONFIG
// =========================
const API_KEY = "147437c80d2510a08584ba9606801aef";
const API_URL = "https://api.openweathermap.org/data/2.5/";

// =========================
// ICON MAPPING
// =========================
function getIconName(main) {
  switch (main) {
    case "Clear":
      return "clear";
    case "Clouds":
      return "clouds";
    case "Rain":
    case "Drizzle":
      return "rain";
    case "Thunderstorm":
      return "thunderstorm";
    case "Snow":
      return "snow";
    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke":
    case "Dust":
    case "Sand":
    case "Ash":
      return "fog";
    default:
      return "clouds";
  }
}

// =========================
// THEME LOGIC
// =========================
function getWeatherTheme(main) {
  switch (main) {
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
    case "Smoke":
    case "Dust":
    case "Sand":
    case "Ash":
      return "foggy";
    default:
      return "cloudy";
  }
}

function applyTheme(theme) {
  body.className = "";
  body.classList.add(`weather-${theme}`);
}

// =========================
// HELPERS
// =========================
function kelvinToCelsius(k) {
  return Math.round(k - 273.15);
}

function formatDate(unix) {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  cityName.textContent = `${data.name}, ${data.sys.country}`;
  dateEl.textContent = formatDate(data.dt);
  tempEl.textContent = `${kelvinToCelsius(data.main.temp)}°`;

  weatherIcon.src = `assets/images/icon/${getIconName(weather.main)}.webp`;
  weatherIcon.alt = weather.main;
  weatherIcon.hidden = false;

  feelsEl.textContent = `${kelvinToCelsius(data.main.feels_like)}°`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${data.wind.speed} km/hr`;
  precipitationEl.textContent =
    data.rain && data.rain["1h"] ? `${data.rain["1h"]} mm` : "0 mm";

  applyTheme(getWeatherTheme(weather.main));
}

// =========================
// RENDER WEEKLY FORECAST
// =========================
function renderWeeklyForecast(data) {
  clearDailyForecast();

  // OpenWeather 5-day forecast has 3-hour intervals
  const dailyMap = {};

  data.list.forEach((item) => {
    const day = new Date(item.dt * 1000).toDateString();
    if (!dailyMap[day]) dailyMap[day] = item;
  });

  Object.values(dailyMap)
    .slice(0, 5)
    .forEach((day) => {
      const clone = dailyTemplate.content.cloneNode(true);

      clone.querySelector(".daily-day").textContent = new Date(
        day.dt * 1000
      ).toLocaleDateString("en-US", { weekday: "short" });

      const icon = clone.querySelector(".icon");
      icon.src = `assets/images/icon/${getIconName(day.weather[0].main)}.webp`;
      icon.hidden = false;
      icon.alt = day.weather[0].main;

      clone.querySelector(".temp").textContent = `${kelvinToCelsius(
        day.main.temp
      )}°`;

      clone.querySelector(".wind").textContent = `${day.wind.speed} km/hr`;

      dailyContainer.appendChild(clone);
    });
}

// =========================
// FETCH WEATHER
// =========================
async function fetchWeeklyForecast(lat, lon) {
  const res = await fetch(
    `${API_URL}forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
  const data = await res.json();
  renderWeeklyForecast(data);
}

async function fetchWeatherByCity(city) {
  body.dataset.state = "loading";
  try {
    const res = await fetch(`${API_URL}weather?q=${city}&appid=${API_KEY}`);

    if (!res.ok) throw new Error("City not found");

    const data = await res.json();
    renderMainWeather(data);

    await fetchWeeklyForecast(data.coord.lat, data.coord.lon);
    body.dataset.state = "ready";
  } catch (err) {
    console.error(err);
    body.dataset.state = "idle";
    alert("City not found.");
  }
}

function getLocationWeather() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `${API_URL}weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`
      );
      const data = await res.json();

      renderMainWeather(data);
      fetchWeeklyForecast(latitude, longitude);
    },
    () => {
      // user denied location — stay idle
    }
  );
}

// =========================
// EVENTS
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
// ON LOAD
// =========================
window.addEventListener("load", () => {
  clearMainWeather();
  clearDailyForecast();
  getLocationWeather();
});

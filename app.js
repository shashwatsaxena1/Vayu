const APP_CONFIG = window.VAYU_CONFIG || {};
const API_ENDPOINTS = APP_CONFIG.endpoints || {};
const API_BASE = (APP_CONFIG.apiBase || "").replace(/\/$/, "");
const AUTH_TOKEN_KEY = "vayu-auth-token";

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

function setAuthSession(payload) {
  if (!payload) return;
  if (payload.token) localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
  if (payload.user) {
    state.authUser = payload.user;
    writeJsonStorage("vayu-auth-user", state.authUser);
  }
  if (payload.profile && Object.keys(payload.profile).length) {
    state.profile = payload.profile;
    writeJsonStorage("vayu-profile", state.profile);
  }
  if (Array.isArray(payload.exposureLogs)) {
    state.exposureLogs = payload.exposureLogs;
    writeJsonStorage("vayu-exposure-logs", state.exposureLogs);
  }
}

async function apiRequest(path, options = {}) {
  if (!API_BASE) throw new Error("Backend API is not configured");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) throw new Error(payload?.error || "VAYU backend request failed");
  return payload;
}

async function syncServerSession() {
  if (!getAuthToken()) return;
  try {
    const payload = await apiRequest("/me");
    setAuthSession(payload);
    loadProfileForm();
    updateAuthUI();
    renderDashboard();
  } catch (error) {
    console.warn("VAYU backend session sync failed", error);
  }
}

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`VAYU storage reset for ${key}`, error);
    localStorage.removeItem(key);
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`VAYU could not save ${key}`, error);
  }
}

const cityData = {
  Delhi: {
    lat: 28.6139,
    lon: 77.209,
    source: "Demo fallback",
    aqi: 178,
    status: "Unhealthy",
    mainPollutant: "PM2.5",
    condition: "foggy",
    conditionLabel: "Hazy",
    temp: 31,
    humidity: 61,
    wind: 7,
    pollutants: { "PM2.5": 96, PM10: 142, NO2: 38, SO2: 13, O3: 42, CO: 0.9 },
    forecast: [165, 174, 181, 176, 168]
  },
  Patna: {
    lat: 25.5941,
    lon: 85.1376,
    source: "Demo fallback",
    aqi: 154,
    status: "Unhealthy for Sensitive Groups",
    mainPollutant: "PM10",
    condition: "windy",
    conditionLabel: "Windy",
    temp: 32,
    humidity: 58,
    wind: 21,
    pollutants: { "PM2.5": 72, PM10: 158, NO2: 30, SO2: 10, O3: 37, CO: 0.7 },
    forecast: [148, 151, 156, 160, 154]
  },
  Mumbai: {
    lat: 19.076,
    lon: 72.8777,
    source: "Demo fallback",
    aqi: 82,
    status: "Moderate",
    mainPollutant: "O3",
    condition: "rainy",
    conditionLabel: "Light Rain",
    temp: 28,
    humidity: 78,
    wind: 16,
    pollutants: { "PM2.5": 32, PM10: 65, NO2: 24, SO2: 8, O3: 58, CO: 0.5 },
    forecast: [78, 74, 80, 84, 82]
  },
  Bengaluru: {
    lat: 12.9716,
    lon: 77.5946,
    source: "Demo fallback",
    aqi: 54,
    status: "Satisfactory",
    mainPollutant: "PM2.5",
    condition: "sunny",
    conditionLabel: "Sunny",
    temp: 26,
    humidity: 52,
    wind: 13,
    pollutants: { "PM2.5": 24, PM10: 45, NO2: 18, SO2: 6, O3: 40, CO: 0.4 },
    forecast: [52, 55, 57, 53, 50]
  },
  Kolkata: {
    lat: 22.5726,
    lon: 88.3639,
    source: "Demo fallback",
    aqi: 132,
    status: "Unhealthy for Sensitive Groups",
    mainPollutant: "PM2.5",
    condition: "cloudy",
    conditionLabel: "Cloudy",
    temp: 30,
    humidity: 70,
    wind: 10,
    pollutants: { "PM2.5": 68, PM10: 110, NO2: 34, SO2: 11, O3: 35, CO: 0.8 },
    forecast: [126, 130, 137, 142, 132]
  },
  Chennai: {
    lat: 13.0827,
    lon: 80.2707,
    source: "Demo fallback",
    aqi: 68,
    status: "Moderate",
    mainPollutant: "PM10",
    condition: "windy",
    conditionLabel: "Coastal Wind",
    temp: 33,
    humidity: 66,
    wind: 24,
    pollutants: { "PM2.5": 28, PM10: 72, NO2: 21, SO2: 7, O3: 44, CO: 0.4 },
    forecast: [70, 72, 69, 65, 68]
  }
};


const CITY_DIRECTORY = [
  { name: "Delhi", lat: 28.6139, lon: 77.2090 },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { name: "Surat", lat: 21.1702, lon: 72.8311 },
  { name: "Kanpur", lat: 26.4499, lon: 80.3319 },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { name: "Indore", lat: 22.7196, lon: 75.8577 },
  { name: "Bhopal", lat: 23.2599, lon: 77.4126 },
  { name: "Patna", lat: 25.5941, lon: 85.1376 },
  { name: "Vadodara", lat: 22.3072, lon: 73.1812 },
  { name: "Ghaziabad", lat: 28.6692, lon: 77.4538 },
  { name: "Ludhiana", lat: 30.9010, lon: 75.8573 },
  { name: "Agra", lat: 27.1767, lon: 78.0081 },
  { name: "Nashik", lat: 19.9975, lon: 73.7898 },
  { name: "Faridabad", lat: 28.4089, lon: 77.3178 },
  { name: "Meerut", lat: 28.9845, lon: 77.7064 },
  { name: "Rajkot", lat: 22.3039, lon: 70.8022 },
  { name: "Varanasi", lat: 25.3176, lon: 82.9739 },
  { name: "Srinagar", lat: 34.0837, lon: 74.7973 },
  { name: "Aurangabad", lat: 19.8762, lon: 75.3433 },
  { name: "Dhanbad", lat: 23.7957, lon: 86.4304 },
  { name: "Amritsar", lat: 31.6340, lon: 74.8723 },
  { name: "Navi Mumbai", lat: 19.0330, lon: 73.0297 },
  { name: "Allahabad", lat: 25.4358, lon: 81.8463 },
  { name: "Prayagraj", lat: 25.4358, lon: 81.8463 },
  { name: "Ranchi", lat: 23.3441, lon: 85.3096 },
  { name: "Howrah", lat: 22.5958, lon: 88.2636 },
  { name: "Coimbatore", lat: 11.0168, lon: 76.9558 },
  { name: "Jabalpur", lat: 23.1815, lon: 79.9864 },
  { name: "Gwalior", lat: 26.2183, lon: 78.1828 },
  { name: "Vijayawada", lat: 16.5062, lon: 80.6480 },
  { name: "Jodhpur", lat: 26.2389, lon: 73.0243 },
  { name: "Madurai", lat: 9.9252, lon: 78.1198 },
  { name: "Raipur", lat: 21.2514, lon: 81.6296 },
  { name: "Kota", lat: 25.2138, lon: 75.8648 },
  { name: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { name: "Guwahati", lat: 26.1445, lon: 91.7362 },
  { name: "Solapur", lat: 17.6599, lon: 75.9064 },
  { name: "Hubballi", lat: 15.3647, lon: 75.1240 },
  { name: "Mysuru", lat: 12.2958, lon: 76.6394 },
  { name: "Bareilly", lat: 28.3670, lon: 79.4304 },
  { name: "Gurugram", lat: 28.4595, lon: 77.0266 },
  { name: "Noida", lat: 28.5355, lon: 77.3910 },
  { name: "Dehradun", lat: 30.3165, lon: 78.0322 }
];

function createCityFallback(name, lat, lon) {
  const base = cityData.Delhi;
  return {
    ...base,
    lat,
    lon,
    displayName: name,
    source: "City search fallback",
    condition: "cloudy",
    conditionLabel: "Loading live weather",
    forecast: [base.aqi - 8, base.aqi - 3, base.aqi + 2, base.aqi - 1, base.aqi - 6].map(value => Math.max(20, Math.round(value)))
  };
}

function normalizeCityName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function findCityDirectoryMatch(value) {
  const query = normalizeCityName(value).toLowerCase();
  if (!query) return null;
  return CITY_DIRECTORY.find(city => city.name.toLowerCase() === query)
    || CITY_DIRECTORY.find(city => city.name.toLowerCase().startsWith(query))
    || CITY_DIRECTORY.find(city => city.name.toLowerCase().includes(query));
}

function ensureCityDirectoryLoaded() {
  CITY_DIRECTORY.forEach(city => {
    if (!cityData[city.name]) cityData[city.name] = createCityFallback(city.name, city.lat, city.lon);
  });
}

ensureCityDirectoryLoaded();

const pollutantInfo = {
  "PM2.5": "Fine particles that can enter deep into the lungs.",
  PM10: "Dust particles that can irritate the nose, throat, and lungs.",
  NO2: "Mostly linked with traffic and fuel burning pollution.",
  SO2: "Often linked with industrial fuel burning.",
  O3: "Ground-level ozone can irritate breathing, especially in heat.",
  CO: "Carbon monoxide can reduce oxygen delivery in the body."
};

const state = {
  city: localStorage.getItem("vayu-city") || "Delhi",
  easyMode: localStorage.getItem("vayu-easy") === "true",
  theme: localStorage.getItem("vayu-theme") || "auto",
  animation: localStorage.getItem("vayu-animation") !== "false",
  profile: readJsonStorage("vayu-profile", {}),
  authUser: readJsonStorage("vayu-auth-user", null),
  currentPage: "dashboard",
  weatherMetric: localStorage.getItem("vayu-weather-metric") || "temperature",
  weatherView: localStorage.getItem("vayu-weather-view") || "hourly",
  liveApi: localStorage.getItem("vayu-live-api") !== "false",
  liveStatus: "Demo fallback",
  location: readJsonStorage("vayu-location", null),
  locationStatus: localStorage.getItem("vayu-location-status") || "Manual city selected",
  exposureLogs: readJsonStorage("vayu-exposure-logs", []),
  remedyLogs: readJsonStorage("vayu-remedy-logs", {}),
  selectedWeatherDay: Number(localStorage.getItem("vayu-selected-weather-day") || 0),
  notificationsEnabled: localStorage.getItem("vayu-notifications-enabled") === "true"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let aqiAnimationFrame = null;
let tempAnimationFrame = null;
let dashboardInsightTimer = null;
let citySuggestionTimer = null;
let lastCitySuggestionQuery = "";


function getAQIStatus(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function mapWeatherCode(code) {
  if ([0, 1].includes(code)) return { condition: "sunny", label: "Sunny" };
  if ([2, 3].includes(code)) return { condition: "cloudy", label: "Cloudy" };
  if ([45, 48].includes(code)) return { condition: "foggy", label: "Foggy" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { condition: "rainy", label: "Rainy" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: "snowy", label: code === 85 || code === 86 ? "Snow Showers" : "Snow" };
  if ([95, 96, 99].includes(code)) return { condition: "stormy", label: "Thunderstorm" };
  return { condition: "cloudy", label: "Changing" };
}

function getMainPollutant(pollutants) {
  const scores = {
    "PM2.5": pollutants["PM2.5"] / 60,
    PM10: pollutants.PM10 / 100,
    NO2: pollutants.NO2 / 80,
    SO2: pollutants.SO2 / 50,
    O3: pollutants.O3 / 100,
    CO: pollutants.CO / 2
  };
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

async function loadLiveData(showToast = false) {
  if (!state.liveApi) return;
  const data = currentData();
  if (!data.lat || !data.lon) return;
  const refreshButton = $("#refreshApiButton");
  if (refreshButton) {
    refreshButton.textContent = "Loading...";
    refreshButton.classList.add("loading");
  }

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${data.lat}&longitude=${data.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,sunrise,sunset&timezone=auto&forecast_days=8`;
    const airBase = API_ENDPOINTS.airQuality || "https://air-quality-api.open-meteo.com/v1/air-quality";
    const airUrl = `${airBase}?latitude=${data.lat}&longitude=${data.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&hourly=us_aqi&timezone=auto&forecast_days=1`;

    const [weatherRes, airRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
    if (!weatherRes.ok || !airRes.ok) throw new Error("Live API unavailable");
    const weather = await weatherRes.json();
    const air = await airRes.json();
    const mapped = mapWeatherCode(weather.current.weather_code);

    const pollutants = {
      "PM2.5": Math.round(air.current.pm2_5 || data.pollutants["PM2.5"]),
      PM10: Math.round(air.current.pm10 || data.pollutants.PM10),
      NO2: Math.round(air.current.nitrogen_dioxide || data.pollutants.NO2),
      SO2: Math.round(air.current.sulphur_dioxide || data.pollutants.SO2),
      O3: Math.round(air.current.ozone || data.pollutants.O3),
      CO: Number(((air.current.carbon_monoxide || data.pollutants.CO * 1000) / 1000).toFixed(2))
    };    const hourlyAqi = air.hourly?.us_aqi?.filter(value => Number.isFinite(value)).slice(0, 5);

    const nowHour = new Date().getHours();
    const hourlyTimes = weather.hourly?.time || [];
    const hourlyTemps = weather.hourly?.temperature_2m || [];
    const hourlyPrecip = weather.hourly?.precipitation_probability || [];
    const hourlyWind = weather.hourly?.wind_speed_10m || [];
    const hourlyCodes = weather.hourly?.weather_code || [];
    const currentIdx = hourlyTimes.findIndex(time => new Date(time).getHours() >= nowHour);
    const startIdx = currentIdx >= 0 ? currentIdx : 0;
    const pick = [];
    for (let i = startIdx; i < hourlyTimes.length && pick.length < 8; i += 3) pick.push(i);
    while (pick.length < 8 && pick.length > 0) {
      const next = pick[pick.length - 1] + 3;
      if (next >= hourlyTimes.length) break;
      pick.push(next);
    }
    const hourlySeries = pick.length ? {
      labels: pick.map(i => new Date(hourlyTimes[i]).toLocaleTimeString([], { hour: "numeric" })),
      temperature: pick.map(i => Math.round(hourlyTemps[i])),
      precipitation: pick.map(i => Math.round(hourlyPrecip[i] ?? 0)),
      wind: pick.map(i => Math.round(hourlyWind[i])),
      iconTypes: pick.map(i => getWeatherIconType(mapWeatherCode(hourlyCodes[i]).condition, Math.round(hourlyPrecip[i] ?? 0), Math.round(hourlyWind[i] ?? 0)))
    } : null;

    const dailySeries = weather.daily?.time?.slice(0, 8)?.map((time, i) => {
      const code = weather.daily?.weather_code?.[i];
      const mappedDay = code != null ? mapWeatherCode(code) : mapped;
      const precipitation = Math.round(weather.daily?.precipitation_probability_max?.[i] ?? 0);
      const precipitationSum = Number(weather.daily?.precipitation_sum?.[i] ?? 0);
      const windMax = Math.max(3, Math.round(weather.daily?.wind_speed_10m_max?.[i] ?? ((weather.current.wind_speed_10m || data.wind) + ((i % 3) - 1) * 3)));
      const iconType = iconTypeFromWeatherCode(code, mappedDay.condition, precipitation, precipitationSum, windMax);
      const condition = iconConditionFromType(iconType);
      return {
        day: new Date(time).toLocaleDateString([], { weekday: "short" }),
        dateKey: String(time).slice(0, 10),
        condition,
        conditionLabel: labelForIconType(iconType),
        iconType,
        high: Math.round(weather.daily?.temperature_2m_max?.[i] ?? data.temp),
        low: Math.round(weather.daily?.temperature_2m_min?.[i] ?? (data.temp - 2)),
        precipitation,
        precipitationSum: Number(precipitationSum.toFixed(1)),
        wind: windMax,
        hourlySeries: buildHourlySeriesForDate(String(time).slice(0, 10), hourlyTimes, hourlyTemps, hourlyPrecip, hourlyWind, hourlyCodes, i === 0),
        active: i === 0
      };
    }) || null;

    cityData[state.city] = {
      ...data,
      aqi: Math.round(air.current.us_aqi || data.aqi),
      status: getAQIStatus(Math.round(air.current.us_aqi || data.aqi)),
      mainPollutant: getMainPollutant(pollutants),
      condition: mapped.condition === "snowy" && weather.current.wind_speed_10m >= 22 ? "blizzard" : (weather.current.wind_speed_10m >= 22 && mapped.condition !== "snowy" ? "windy" : mapped.condition),
      conditionLabel: mapped.condition === "snowy" && weather.current.wind_speed_10m >= 22 ? "Blizzard" : (weather.current.wind_speed_10m >= 22 && mapped.condition !== "snowy" ? "Windy" : mapped.label),
      temp: Math.round(weather.current.temperature_2m),
      humidity: Math.round(weather.current.relative_humidity_2m),
      wind: Math.round(weather.current.wind_speed_10m),
      pollutants,
      forecast: hourlyAqi?.length >= 5 ? hourlyAqi.map(Math.round) : data.forecast,
      hourlySeries: hourlySeries || data.hourlySeries,
      dailySeries: dailySeries || data.dailySeries,
      sunrise: weather.daily?.sunrise?.[0] || data.sunrise,
      sunset: weather.daily?.sunset?.[0] || data.sunset,
      source: "Live Open-Meteo API"
    };
    state.liveStatus = "Live Open-Meteo API";
    renderDashboard();
    renderSafetyModule();
    if (showToast) addMessage($("#chatMessages"), "bot", `Live data loaded for ${getLocationLabel()} using Open-Meteo weather and air quality APIs.`);
  } catch (error) {
    state.liveStatus = "Demo fallback";
    if (showToast) addMessage($("#chatMessages"), "bot", "Live API could not load, so VAYU is using demo fallback data.");
  } finally {
    if (refreshButton) {
      refreshButton.textContent = state.liveStatus.includes("Live") ? "Live API ✓" : "Demo Data";
      refreshButton.classList.remove("loading");
    }
  }
}

function currentData() {
  return cityData[state.city] || cityData.Delhi;
}


function isCoordinateLabel(label) {
  if (!label || typeof label !== "string") return false;
  const clean = label.trim();
  return /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(clean) || /^lat/i.test(clean) || clean.includes("undefined");
}

function sanitizeLocationLabel(label) {
  if (!label || isCoordinateLabel(label)) return "Your Area";
  const clean = String(label).replace(/\s+/g, " ").replace(/,\s*,/g, ",").trim();
  if (!clean || isCoordinateLabel(clean)) return "Your Area";
  const parts = clean.split(",").map(part => part.trim()).filter(Boolean);
  const unique = [];
  parts.forEach(part => {
    if (!unique.some(item => item.toLowerCase() === part.toLowerCase())) unique.push(part);
  });
  return unique.slice(0, 2).join(", ") || "Your Area";
}

function getLocationLabel() {
  const data = currentData();
  return sanitizeLocationLabel(data.displayName || state.location?.label || state.city);
}

function ensureCurrentLocationOption(label = "Current Location") {
  label = sanitizeLocationLabel(label) || "Your Area";
  const input = $("#citySelect");
  if (!input) return;
  if (input.tagName === "INPUT") {
    if (state.city === "Current Location") input.value = "Current Location";
    renderCitySuggestions();
    return;
  }
  let option = input.querySelector('option[value="Current Location"]');
  if (!option) {
    option = document.createElement("option");
    option.value = "Current Location";
    input.prepend(option);
  }
  option.hidden = false;
  option.textContent = label;
}

function restoreSavedLocation() {
  if (!state.location?.lat || !state.location?.lon) return;
  const safeLabel = sanitizeLocationLabel(state.location.label);
  ensureCurrentLocationOption(safeLabel);
  cityData["Current Location"] = {
    ...cityData.Delhi,
    lat: state.location.lat,
    lon: state.location.lon,
    displayName: safeLabel,
    source: "Saved live location"
  };
  if (safeLabel === "Your Area" || isCoordinateLabel(state.location.label)) {
    reverseGeocodeLocation(state.location.lat, state.location.lon).then(label => {
      const cleanLabel = sanitizeLocationLabel(label);
      state.location = { ...state.location, label: cleanLabel, updatedAt: new Date().toISOString() };
      writeJsonStorage("vayu-location", state.location);
      cityData["Current Location"].displayName = cleanLabel;
      ensureCurrentLocationOption(cleanLabel);
      renderDashboard();
      updateLocationUI();
    }).catch(() => {});
  }
}

function setLocationStatus(title, text, busy = false) {
  state.locationStatus = text;
  localStorage.setItem("vayu-location-status", text);
  const titleEl = $("#locationStatusTitle");
  const textEl = $("#locationStatusText");
  const button = $("#locationButton");
  const cardButton = $("#locationCardButton");
  if (titleEl) titleEl.textContent = title;
  if (textEl) textEl.textContent = text;
  [button, cardButton].forEach(btn => {
    if (!btn) return;
    btn.textContent = busy ? "Locating..." : "📍 Use My Location";
    btn.disabled = busy;
    btn.classList.toggle("loading", busy);
  });
}

function updateLocationUI() {
  const label = getLocationLabel();
  if (state.city === "Current Location" && state.location?.lat && state.location?.lon) {
    ensureCurrentLocationOption(label);
    setLocationStatus("Live location active", `${label} • AQI, weather, hospitals, and route help are using your detected location.`);
  } else {
    setLocationStatus("Using selected city", `Current data is based on ${label}. VAYU will request live location automatically when available.`);
  }
}

function renderCitySuggestions(extraNames = []) {
  const list = $("#citySuggestions");
  if (!list) return;
  const names = Array.from(new Set([
    "Current Location",
    ...extraNames.filter(Boolean),
    ...CITY_DIRECTORY.map(city => city.name),
    ...Object.keys(cityData).filter(name => name !== "Current Location")
  ])).sort((a, b) => a.localeCompare(b));
  list.innerHTML = names.slice(0, 140).map(name => `<option value="${name}"></option>`).join("");
}

async function updateCitySuggestionsLive(query) {
  const clean = normalizeCityName(query);
  if (!clean || clean.length < 2) {
    renderCitySuggestions();
    return;
  }
  const localMatches = CITY_DIRECTORY
    .filter(city => city.name.toLowerCase().includes(clean.toLowerCase()))
    .slice(0, 12)
    .map(city => city.name);
  renderCitySuggestions(localMatches);
  if (clean === lastCitySuggestionQuery) return;
  lastCitySuggestionQuery = clean;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=8&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) return;
    const payload = await response.json();
    const liveNames = (payload.results || []).map(item => {
      const parts = [item.name, item.admin1, item.country].filter(Boolean);
      return parts.join(", ");
    });
    renderCitySuggestions([...localMatches, ...liveNames]);
  } catch (error) {
    renderCitySuggestions(localMatches);
  }
}

async function geocodeCitySearch(query) {
  const clean = normalizeCityName(query);
  if (!clean) return null;
  const primaryName = clean.split(",")[0].trim();
  const directoryMatch = findCityDirectoryMatch(primaryName || clean);
  if (directoryMatch) return directoryMatch;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(primaryName || clean)}&count=5&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("City search unavailable");
  const payload = await response.json();
  const item = payload.results?.[0];
  if (!item) return null;
  const label = [item.name, item.admin1, item.country].filter(Boolean).join(", ");
  return { name: label || item.name || clean, lat: item.latitude, lon: item.longitude };
}

async function handleCitySearch(value) {
  const clean = normalizeCityName(value);
  if (!clean) return;
  if (clean.toLowerCase() === "current location") {
    state.city = "Current Location";
    localStorage.setItem("vayu-city", state.city);
    if ($("#citySelect")) $("#citySelect").value = "Current Location";
    askForLiveLocation(true);
    return;
  }
  const exactKey = Object.keys(cityData).find(name => name.toLowerCase() === clean.toLowerCase());
  if (exactKey) {
    state.city = exactKey;
    localStorage.setItem("vayu-city", state.city);
    if ($("#citySelect")) $("#citySelect").value = exactKey;
    setLocationStatus("Using selected city", `Current data is based on ${exactKey}. Loading latest AQI and weather.`);
    renderDashboard();
    loadLiveData(false);
    return;
  }
  try {
    setLocationStatus("Searching city", `Finding closest match for ${clean}...`, true);
    const found = await geocodeCitySearch(clean);
    if (!found) throw new Error("No city found");
    const name = found.name;
    cityData[name] = createCityFallback(name, found.lat, found.lon);
    state.city = name;
    localStorage.setItem("vayu-city", state.city);
    if ($("#citySelect")) $("#citySelect").value = name;
    renderCitySuggestions();
    setLocationStatus("Using searched city", `Current data is based on ${name}. Loading live AQI and weather.`);
    renderDashboard();
    loadLiveData(false);
  } catch (error) {
    setLocationStatus("City not found", `I could not find ${clean}. Try a nearby city name or use Current Location.`);
    if ($("#citySelect")) $("#citySelect").value = state.city;
  }
}

async function reverseGeocodeLocation(lat, lon) {
  const buildAreaCity = (address = {}, fallbackName = "") => {
    const city = address.city || address.town || address.village || address.municipality || address.county || address.state_district || "";
    let area = address.neighbourhood || address.suburb || address.city_district || address.quarter || address.residential || address.locality || address.hamlet || address.road || "";
    if (!area || String(area).toLowerCase() === String(city || fallbackName).toLowerCase()) area = city ? "Nearby Area" : fallbackName;
    const parts = [];
    if (area) parts.push(area);
    if (city && city.toLowerCase() !== String(area || "").toLowerCase()) parts.push(city);
    if (!city && address.state && String(address.state).toLowerCase() !== String(area || "").toLowerCase()) parts.push(address.state);
    return sanitizeLocationLabel(parts.join(", "));
  };

  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const osmResponse = await fetch(osmUrl);
    if (osmResponse.ok) {
      const osm = await osmResponse.json();
      const label = buildAreaCity(osm.address || {}, osm.name || "");
      if (label && label !== "Your Area") return label;
    }
  } catch (error) {
    // Fallback below.
  }

  try {
    const reverseBase = API_ENDPOINTS.reverseGeocode || "https://geocoding-api.open-meteo.com/v1/reverse";
    const url = `${reverseBase}?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Reverse geocoding unavailable");
    const json = await response.json();
    const item = json.results?.[0];
    if (!item) throw new Error("No location name found");
    const city = item.admin2 || item.name || item.admin1 || "";
    const rawArea = item.locality || item.suburb || item.village || item.hamlet || item.name || "";
    const area = rawArea && rawArea.toLowerCase() !== String(city).toLowerCase() ? rawArea : "Nearby Area";
    const label = sanitizeLocationLabel([area, city].filter(Boolean).join(", "));
    if (label && label !== "Your Area") return label;
  } catch (error) {
    // Final fallback below.
  }

  return "Your Area";
}

function askForLiveLocation(showChatMessage = true) {
  if (!navigator.geolocation) {
    setLocationStatus("Location not supported", "Your browser does not support live location. Please use manual city selection.");
    if (showChatMessage) addMessage($("#chatMessages"), "bot", "Live location is not supported in this browser. You can still select a city manually.");
    return;
  }

  setLocationStatus("Detecting location", "Please allow location permission so VAYU can load your local AQI, weather, hospitals, and route guidance.", true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = Number(position.coords.latitude.toFixed(5));
      const lon = Number(position.coords.longitude.toFixed(5));
      const label = sanitizeLocationLabel(await reverseGeocodeLocation(lat, lon));
      state.location = { lat, lon, label, updatedAt: new Date().toISOString() };
      writeJsonStorage("vayu-location", state.location);
      localStorage.setItem("vayu-location-prompted", "true");

      cityData["Current Location"] = {
        ...cityData.Delhi,
        lat,
        lon,
        displayName: label,
        source: "Live location detected"
      };

      state.city = "Current Location";
      localStorage.setItem("vayu-city", state.city);
      ensureCurrentLocationOption(label);
      if ($("#citySelect")) $("#citySelect").value = "Current Location";
      setLocationStatus("Live location active", `${label} • Loading local AQI and weather now.`);
      renderDashboard();
      await loadLiveData(showChatMessage);
      updateLocationUI();
      if (showChatMessage) addMessage($("#chatMessages"), "bot", `Live location enabled for ${label}. VAYU will now use this area for AQI, weather, hospital search, and safer route help.`);
    },
    (error) => {
      localStorage.setItem("vayu-location-prompted", "true");
      const reason = error.code === 1
        ? "Location permission was denied. Using selected city data instead."
        : "VAYU could not detect your location. Using selected city data instead.";
      setLocationStatus("Location unavailable", reason);
      if (showChatMessage) addMessage($("#chatMessages"), "bot", reason);
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 10 * 60 * 1000 }
  );
}

function maybeAutoAskLocation() {
  if (!navigator.geolocation) return;
  if (state.location?.lat && state.location?.lon) {
    setTimeout(() => loadLiveData(false), 350);
    return;
  }
  setTimeout(() => askForLiveLocation(false), 900);
}

function dateAtLocalTime(hours, minutes = 0) {
  const now = new Date();
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function parseLocalSunTime(value, fallbackHour, fallbackMinute) {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return dateAtLocalTime(fallbackHour, fallbackMinute);
}

function getSunWindow() {
  const data = currentData();
  const sunrise = parseLocalSunTime(data.sunrise, 5, 45);
  const sunset = parseLocalSunTime(data.sunset, 18, 55);
  const dawnStart = new Date(sunrise.getTime() - 25 * 60 * 1000);
  const now = new Date();
  return { now, dawnStart, sunrise, sunset };
}

function getTimeMode() {
  const { now, sunrise, sunset } = getSunWindow();
  return now >= sunrise && now < sunset ? "morning" : "night";
}

function getAmbienceLabel() {
  const { now, dawnStart, sunrise, sunset } = getSunWindow();
  const duskEnd = new Date(sunset.getTime() + 35 * 60 * 1000);

  if (now < dawnStart) return "Night mode";
  if (now < sunrise) return "Pre-sunrise night";
  if (now < new Date(sunrise.getTime() + 70 * 60 * 1000)) return "Sunrise mode";
  if (now < sunset) return "Daylight mode";
  if (now < duskEnd) return "Evening mode";
  return "Night mode";
}

function shouldUseDarkTheme() {
  if (state.theme === "dark") return true;
  if (state.theme === "light") return false;
  return getTimeMode() === "night";
}

function applyTheme() {
  const isDark = shouldUseDarkTheme();
  const timeMode = getTimeMode();
  document.body.classList.toggle("dark", isDark);
  document.body.classList.toggle("easy", state.easyMode);
  document.body.classList.toggle("morning", timeMode === "morning");
  document.body.classList.toggle("night", timeMode === "night");
  $("#timeIcon").textContent = timeMode === "morning" ? "☀️" : "🌙";
  $("#timeIcon").title = getAmbienceLabel();
  $("#themeToggle").textContent = `Theme: ${capitalize(state.theme)}`;
  $("#easyModeToggle").textContent = `Easy Mode: ${state.easyMode ? "On" : "Off"}`;
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#101111" : "#dff3dc");
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getAQIColor(aqi) {
  if (aqi <= 50) return "#66a96b";
  if (aqi <= 100) return "#b4b454";
  if (aqi <= 150) return "#d9a64d";
  if (aqi <= 200) return "#d8783f";
  if (aqi <= 300) return "#c94c4c";
  return "#8e3f68";
}


function getTempColor(temp) {
  if (temp <= 10) return { color: "#69A7D8", label: "Cold" };
  if (temp <= 20) return { color: "#6FC4B8", label: "Cool" };
  if (temp <= 28) return { color: "#7FBE63", label: "Mild" };
  if (temp <= 35) return { color: "#E0B24A", label: "Warm" };
  if (temp <= 42) return { color: "#E3833F", label: "Hot" };
  return { color: "#D85A4C", label: "Extreme" };
}

function calculateRisk(data) {
  const profile = state.profile || {};
  let score = 15;
  const reasons = [];

  if (data.aqi > 300) { score += 70; reasons.push("AQI is hazardous."); }
  else if (data.aqi > 200) { score += 55; reasons.push("AQI is very unhealthy."); }
  else if (data.aqi > 150) { score += 40; reasons.push("AQI is unhealthy."); }
  else if (data.aqi > 100) { score += 28; reasons.push("AQI is unhealthy for sensitive users."); }
  else if (data.aqi > 50) { score += 12; reasons.push("AQI is moderate."); }
  else reasons.push("AQI is currently in a safer range.");

  if (data.pollutants["PM2.5"] > 60) { score += 12; reasons.push("PM2.5 is high."); }
  if (data.pollutants.PM10 > 100) { score += 6; reasons.push("PM10 dust exposure is elevated."); }
  if (data.humidity > 70) { score += 8; reasons.push("Humidity is high."); }
  if (data.wind < 8 && data.aqi > 100) { score += 8; reasons.push("Low wind may trap pollution."); }
  if (data.temp >= 40) { score += 12; reasons.push("Heat stress risk is high."); }
  else if (data.temp >= 35) { score += 6; reasons.push("Temperature is warm enough to increase discomfort."); }

  if (profile.age === "Senior") { score += 14; reasons.push("Senior citizens are more vulnerable."); }
  if (profile.age === "Child") { score += 12; reasons.push("Children are more vulnerable."); }
  if (profile.condition && profile.condition !== "None") { score += 18; reasons.push(`${profile.condition} increases sensitivity.`); }
  if (profile.sensitivity === "Sensitive") { score += 10; reasons.push("Sensitivity level is marked sensitive."); }
  if (profile.sensitivity === "Highly Sensitive") { score += 18; reasons.push("Sensitivity level is highly sensitive."); }
  if (profile.activity === "High") { score += 8; reasons.push("High outdoor activity increases exposure."); }

  const todayExposure = getTodayExposureLog?.();
  if (todayExposure) {
    const exposureScore = scoreExposureLog(todayExposure, data);
    if (exposureScore >= 76) { score += 16; reasons.push("Today’s exposure log adds extra risk."); }
    else if (exposureScore >= 51) { score += 10; reasons.push("Outdoor exposure today increases risk."); }
    else if (exposureScore >= 26) { score += 5; reasons.push("Moderate exposure today is recorded."); }
    if (todayExposure.discomfort) { score += 10; reasons.push("Breathing discomfort was logged today."); }
  }
  if (profile.exposure === "Medium") { score += 4; reasons.push("Daily exposure is moderate."); }
  if (profile.exposure === "High") { score += 10; reasons.push("Daily exposure is high."); }
  if (profile.duration === "1–2 hours") { score += 6; reasons.push("Outdoor exposure duration is long."); }
  if (profile.duration === "3+ hours") { score += 10; reasons.push("Outdoor exposure duration is very long."); }
  if (["Runner", "Cyclist", "Outdoor worker"].includes(profile.routine)) { score += 8; reasons.push(`${profile.routine} routine increases outdoor exposure.`); }
  if (profile.mask === "No" && data.aqi > 100) { score += 8; reasons.push("Mask usage is marked no during polluted conditions."); }
  if (profile.mask === "Sometimes" && data.aqi > 150) { score += 3; reasons.push("Mask usage is inconsistent during high AQI."); }
  if (profile.mask === "Yes" && data.aqi > 100) { score -= 5; reasons.push("Regular mask usage reduces exposure risk."); }
  if (profile.purifier === "Yes" && data.aqi > 150) { score -= 5; reasons.push("Indoor purifier helps reduce indoor exposure."); }

  score = Math.max(0, Math.min(100, Math.round(score)));
  let level = "Low";
  if (score >= 81) level = "Critical";
  else if (score >= 61) level = "High";
  else if (score >= 31) level = "Moderate";

  return { score, level, reasons };
}

function simplifyAirLabel(aqi) {
  return aqi > 100 ? "Unhealthy" : "Healthy";
}

function getMetricMeta(metric) {
  return {
    temperature: { title: "Temperature trend", unit: "°C", summary: "Track warmth through the day to understand outdoor comfort and heat stress.", chip: "Peak", formatter: (v) => `${v}°` },
    precipitation: { title: "Precipitation chance", unit: "%", summary: "Rain can improve air quality temporarily, but humidity may still affect breathing comfort.", chip: "Rain peak", formatter: (v) => `${v}%` },
    wind: { title: "Wind trend", unit: "km/h", summary: "Wind helps disperse pollutants. Lower wind often means pollution remains trapped for longer.", chip: "Wind peak", formatter: (v) => `${v} km/h` }
  }[metric];
}

function iconConditionFromType(type) {
  if (type === "stormy") return "stormy";
  if (type === "blizzard") return "blizzard";
  if (type === "snowy" || type === "light-snow") return "snowy";
  if (type === "rainy" || type === "light-rain") return "rainy";
  if (type === "foggy") return "foggy";
  if (type === "windy") return "windy";
  if (type === "cloudy" || type === "partly") return "cloudy";
  return "sunny";
}

function labelForIconType(type) {
  return {
    sunny: "Sunny",
    partly: "Partly Cloudy",
    cloudy: "Cloudy",
    "light-rain": "Light Rain",
    rainy: "Heavy Rain",
    stormy: "Storm",
    "light-snow": "Light Snow",
    snowy: "Snow",
    blizzard: "Blizzard",
    windy: "Windy",
    foggy: "Haze"
  }[type] || "Cloudy";
}

function getWeatherIconType(condition, precipitation = 0, wind = 0, precipitationSum = 0) {
  const prob = Number(precipitation || 0);
  const rainMm = Number(precipitationSum || 0);
  if (wind >= 30 && prob < 25 && rainMm < 0.5) return "windy";
  if (condition === "stormy") return (prob >= 55 || rainMm >= 1) ? "stormy" : "cloudy";
  if (condition === "blizzard") return "blizzard";
  if (condition === "snowy") return wind >= 28 ? "blizzard" : (prob >= 50 ? "snowy" : "light-snow");
  if (condition === "rainy") {
    if (rainMm >= 8) return "rainy";
    if (rainMm >= 0.2 || prob >= 25) return "light-rain";
    return "cloudy";
  }
  if (condition === "foggy") return "foggy";
  if (condition === "cloudy") return prob >= 30 || rainMm >= 0.2 ? "light-rain" : "partly";
  if (condition === "windy") return "windy";
  if (condition === "sunny") return prob >= 35 || rainMm >= 0.2 ? "light-rain" : "sunny";
  return "partly";
}

function iconTypeFromWeatherCode(code, condition, precipitationProbability = 0, precipitationSum = 0, wind = 0) {
  const c = Number(code);
  const prob = Number(precipitationProbability || 0);
  const rainMm = Number(precipitationSum || 0);
  if (wind >= 30 && prob < 25 && rainMm < 0.5) return "windy";
  if ([95, 96, 99].includes(c)) return (prob >= 55 || rainMm >= 1) ? "stormy" : "cloudy";
  if ([65, 82].includes(c)) return rainMm >= 8 ? "rainy" : "light-rain";
  if ([71, 77, 85].includes(c)) return wind >= 28 ? "blizzard" : "light-snow";
  if ([73, 75, 86].includes(c)) return wind >= 22 ? "blizzard" : "snowy";
  if ([51, 53, 55, 61, 63, 80, 81].includes(c)) {
    if (rainMm >= 8) return "rainy";
    if (rainMm >= 0.2 || prob >= 25) return "light-rain";
    return "cloudy";
  }
  if ([45, 48].includes(c)) return "foggy";
  if (c === 0) return prob >= 35 || rainMm >= 0.2 ? "light-rain" : "sunny";
  if ([1, 2].includes(c)) return prob >= 35 || rainMm >= 0.2 ? "light-rain" : "partly";
  if (c === 3) return prob >= 35 || rainMm >= 0.2 ? "light-rain" : "cloudy";
  return getWeatherIconType(condition, prob, wind, rainMm);
}

function getPrecipitationIconType(value, condition = "cloudy", wind = 0, precipitationSum = 0) {
  const prob = Number(value || 0);
  const rainMm = Number(precipitationSum || 0);
  if (wind >= 30 && prob < 20 && rainMm < 0.5) return "windy";
  if (condition === "stormy") return (prob >= 55 || rainMm >= 1) ? "stormy" : "cloudy";
  if (condition === "blizzard") return "blizzard";
  if (condition === "snowy") return wind >= 28 ? "blizzard" : (prob >= 55 ? "snowy" : "light-snow");
  if (rainMm >= 8) return "rainy";
  if (rainMm >= 0.2 || prob >= 30 || condition === "rainy") return "light-rain";
  if (condition === "sunny") return "sunny";
  if (condition === "foggy") return "foggy";
  return "cloudy";
}

function weatherIconForCondition(condition) {
  return getWeatherIconType(condition);
}

function weatherIconMarkup(type, compact = false) {
  return `<span class="wx-icon ${compact ? "compact" : ""} wx-${type}" aria-hidden="true">
    <span class="wx-sun"></span>
    <span class="wx-cloud"><i></i><b></b></span>
    <span class="wx-rain"><i></i><i></i><i></i></span>
    <span class="wx-snow"><i></i><i></i><i></i></span>
    <span class="wx-bolt"></span>
    <span class="wx-wind"><i></i><i></i><i></i></span>
    <span class="wx-fog"><i></i><i></i><i></i></span>
  </span>`;
}

function buildHourlySeriesForDate(dateKey, hourlyTimes, hourlyTemps, hourlyPrecip, hourlyWind, hourlyCodes, fromCurrent = false) {
  const nowHour = new Date().getHours();
  const matches = hourlyTimes
    .map((time, index) => ({ time, index }))
    .filter(item => item.time?.slice(0, 10) === dateKey)
    .filter(item => !fromCurrent || new Date(item.time).getHours() >= nowHour);

  const picked = [];
  for (let i = 0; i < matches.length && picked.length < 8; i += 3) picked.push(matches[i].index);
  if (!picked.length) {
    for (let i = 0; i < matches.length && picked.length < 8; i += 3) picked.push(matches[i].index);
  }

  return picked.length ? {
    labels: picked.map(i => new Date(hourlyTimes[i]).toLocaleTimeString([], { hour: "numeric" })),
    temperature: picked.map(i => Math.round(hourlyTemps[i] ?? 0)),
    precipitation: picked.map(i => Math.round(hourlyPrecip[i] ?? 0)),
    wind: picked.map(i => Math.round(hourlyWind[i] ?? 0)),
    iconTypes: picked.map(i => iconTypeFromWeatherCode(hourlyCodes[i], mapWeatherCode(hourlyCodes[i]).condition, Math.round(hourlyPrecip[i] ?? 0), 0, Math.round(hourlyWind[i] ?? 0)))
  } : null;
}

function getDailyConditionIcon(condition, precipitation = 0, wind = 0) {
  return getWeatherIconType(condition, precipitation, wind);
}

function getWeatherSeries(data) {
  if (data.hourlySeries?.labels?.length) {
    return {
      labels: data.hourlySeries.labels,
      temperature: data.hourlySeries.temperature,
      precipitation: data.hourlySeries.precipitation,
      wind: data.hourlySeries.wind,
      iconTypes: data.hourlySeries.iconTypes || data.hourlySeries.labels.map(() => weatherIconForCondition(data.condition))
    };
  }

  const labels = ["2 am", "5 am", "8 am", "11 am", "2 pm", "5 pm", "8 pm", "11 pm"];
  const tempBase = data.temp;
  const temperature = [tempBase + 2, tempBase + 1, tempBase + 2, tempBase + 5, tempBase + 7, tempBase + 7, tempBase + 4, tempBase + 3];

  const precipitationMap = {
    rainy: [36, 34, 18, 22, 44, 40, 26, 30],
    cloudy: [14, 12, 18, 22, 24, 20, 16, 15],
    foggy: [8, 5, 4, 6, 8, 6, 5, 4],
    windy: [6, 8, 10, 14, 12, 10, 8, 6],
    sunny: [2, 1, 2, 4, 6, 5, 3, 2]
  };

  const windBase = data.wind;
  const wind = [Math.max(2, windBase - 3), Math.max(2, windBase - 2), windBase, windBase + 3, windBase + 6, windBase + 5, windBase + 1, Math.max(3, windBase - 1)];

  return {
    labels,
    temperature,
    precipitation: precipitationMap[data.condition] || precipitationMap.cloudy,
    wind,
    iconTypes: labels.map(() => weatherIconForCondition(data.condition))
  };
}

function getDailyForecast(data) {
  if (data.dailySeries?.length) return data.dailySeries;

  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const start = new Date().getDay();
  const conditions = {
    sunny: ["sunny", "sunny", "partly", "cloudy", "sunny", "partly", "sunny", "cloudy"],
    rainy: ["light-rain", "cloudy", "partly", "light-rain", "cloudy", "sunny", "partly", "light-rain"],
    cloudy: ["partly", "cloudy", "cloudy", "partly", "cloudy", "light-rain", "partly", "cloudy"],
    windy: ["partly", "windy", "cloudy", "windy", "partly", "cloudy", "windy", "partly"],
    stormy: ["light-rain", "stormy", "cloudy", "light-rain", "partly", "cloudy", "light-rain", "cloudy"],
    foggy: ["foggy", "partly", "foggy", "cloudy", "foggy", "partly", "cloudy", "partly"]
  };
  const iconSet = conditions[data.condition] || conditions.cloudy;
  const deltaHigh = [1, 0, -1, 2, 1, -1, 0, 1];
  const deltaLow = [-2, -1, -1, -3, -2, -2, -1, -2];
  return iconSet.map((iconType, i) => {
    const condition = iconConditionFromType(iconType);
    const precipitation = iconType === "stormy" ? 65 : iconType === "rainy" ? 70 : iconType === "light-rain" ? 35 : iconType === "cloudy" ? 18 : iconType === "foggy" ? 10 : 5;
    const wind = Math.max(3, data.wind + ((i % 3) - 1) * 3);
    const labels = ["12 am", "3 am", "6 am", "9 am", "12 pm", "3 pm", "6 pm", "9 pm"];
    const tempBase = data.temp + deltaHigh[i] - 2;
    return {
      day: names[(start + i) % 7],
      iconType,
      condition,
      conditionLabel: labelForIconType(iconType),
      high: data.temp + deltaHigh[i],
      low: Math.max(16, data.temp + deltaLow[i]),
      precipitation,
      wind,
      hourlySeries: {
        labels,
        temperature: labels.map((_, idx) => Math.round(tempBase + Math.sin(idx / 7 * Math.PI) * 4)),
        precipitation: labels.map((_, idx) => Math.max(0, Math.round(precipitation + (idx % 3 - 1) * 5))),
        wind: labels.map((_, idx) => Math.max(3, wind + (idx % 3 - 1) * 2)),
        iconTypes: labels.map(() => iconType)
      },
      active: i === 0
    };
  });
}

function getChartSeries(data) {
  const daily = getDailyForecast(data);
  const selected = daily[Math.min(Math.max(state.selectedWeatherDay || 0, 0), daily.length - 1)] || daily[0];

  if (state.weatherView === "daily") {
    return {
      labels: daily.map(day => day.day),
      temperature: daily.map(day => day.high),
      precipitation: daily.map(day => day.precipitation ?? 8),
      precipitationSum: daily.map(day => day.precipitationSum ?? 0),
      wind: daily.map((day, index) => day.wind ?? Math.max(3, data.wind + ((index % 3) - 1) * 3)),
      iconTypes: daily.map(day => day.iconType || getWeatherIconType(day.condition || data.condition, day.precipitation || 0, day.wind || data.wind))
    };
  }

  if ((state.selectedWeatherDay || 0) > 0 && selected?.hourlySeries?.labels?.length) {
    return selected.hourlySeries;
  }
  return getWeatherSeries(data);
}

function createSmoothLinePath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` Q ${p0.x},${p0.y} ${cx},${(p0.y + p1.y) / 2}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x},${last.y}`;
  return d;
}

function renderWeatherExplorer(data) {
  const metric = state.weatherMetric;
  const dailyForecast = getDailyForecast(data);
  const safeSelectedIndex = Math.min(Math.max(state.selectedWeatherDay || 0, 0), dailyForecast.length - 1);
  state.selectedWeatherDay = safeSelectedIndex;
  const selectedDay = dailyForecast[safeSelectedIndex] || dailyForecast[0];
  const allSeries = getChartSeries(data);
  const series = allSeries[metric];
  const meta = getMetricMeta(metric);
  const viewLabel = state.weatherView === "daily" ? "Daily" : "Hourly";
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(1, max - min);
  const width = 720;
  const height = 220;
  const left = 24;
  const right = width - 24;
  const top = 24;
  const bottom = 172;
  const step = (right - left) / (series.length - 1);
  const points = series.map((value, idx) => {
    const x = left + idx * step;
    const y = bottom - ((value - min) / range) * (bottom - top);
    return { x, y, value, label: allSeries.labels[idx] };
  });
  const linePath = createSmoothLinePath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x},${bottom} L ${points[0].x},${bottom} Z`;
  const peak = Math.max(...series);

  $("#weatherNowCity").textContent = getLocationLabel();
  $("#weatherNowCondition").textContent = state.weatherView === "daily" ? selectedDay.conditionLabel : data.conditionLabel;
  const baseTemp = state.weatherView === "daily" ? selectedDay.high : data.temp;
  const baseWind = state.weatherView === "daily" ? selectedDay.wind : data.wind;
  const basePrecip = state.weatherView === "daily" ? selectedDay.precipitation : Math.round(series[Math.min(4, series.length - 1)]);
  const feelsLike = state.weatherView === "daily" ? Math.round(selectedDay.high + Math.max(0, data.humidity - 45) / 10) : calculateFeelsLike(data.temp, data.humidity);
  $("#weatherMainValue").textContent = metric === "temperature" ? `${baseTemp}°` : metric === "precipitation" ? `${basePrecip}%` : `${baseWind}`;
  $("#weatherMainUnit").textContent = metric === "temperature" ? `Feels like ${feelsLike}°` : metric === "precipitation" ? "chance" : "km/h";
  $("#weatherMetricSummary").textContent = metric === "temperature" ? `${meta.summary} Feels like ${feelsLike}° ${state.weatherView === "daily" ? `on ${selectedDay.day}` : `right now`}.` : meta.summary;
  $("#weatherMetricTitle").textContent = `${viewLabel} ${meta.title.toLowerCase()}`;
  $("#weatherMetricPeak").textContent = `${meta.chip} ${meta.formatter(peak)}`;
  $("#weatherSafetyLabel").textContent = metric === "temperature" ? "Heat + comfort note" : metric === "precipitation" ? "Rain + air note" : "Wind + AQI note";
  const activeCondition = state.weatherView === "daily" ? selectedDay.condition : data.condition;
  $("#weatherSafetyNote").textContent = metric === "temperature"
    ? `${baseTemp >= 35 ? `Higher daytime heat can increase stress and make outdoor exposure feel tougher. Feels like ${feelsLike}°.` : `Moderate temperatures are easier on the body, but AQI still matters before going out. Feels like ${feelsLike}°.`}`
    : metric === "precipitation"
      ? `${activeCondition === "rainy" || activeCondition === "stormy" ? "Rain may temporarily wash pollutants down, but humidity can still affect breathing comfort." : "Low rain chance means pollution may persist if wind stays weak."}`
      : `${baseWind < 8 ? "Low wind may trap pollution close to the ground, so air may feel heavier." : "Better wind flow can help disperse pollutants and improve comfort outdoors."}`;

  const gridValues = Array.from({ length: 4 }, (_, idx) => Math.round(max - (range * idx) / 3));
  const gridSpacing = (bottom - top) / 3;
  $("#weatherGridGroup").innerHTML = gridValues.map((value, idx) => {
    const y = top + idx * gridSpacing;
    return `<g class="weather-grid-row"><line x1="${left}" y1="${y}" x2="${right}" y2="${y}"></line><text x="${left}" y="${y - 8}">${value}</text></g>`;
  }).join("");
  $("#weatherLinePath").setAttribute("d", linePath);
  $("#weatherAreaPath").setAttribute("d", areaPath);
  const metricIcons = metric === "precipitation"
    ? series.map((value, idx) => getPrecipitationIconType(value, iconConditionFromType(allSeries.iconTypes?.[idx] || selectedDay.iconType || selectedDay.condition || data.condition), allSeries.wind?.[idx] || selectedDay.wind || data.wind, allSeries.precipitationSum?.[idx] || selectedDay.precipitationSum || 0))
    : (allSeries.iconTypes || series.map(() => weatherIconForCondition(data.condition)));
  $("#weatherPointGroup").innerHTML = points.map((point, idx) => `
    <g class="weather-point">
      <circle class="weather-point-outer" cx="${point.x}" cy="${point.y}" r="6.5"></circle>
      <circle class="weather-point-inner" cx="${point.x}" cy="${point.y}" r="4.3"></circle>
      <text class="weather-point-value" x="${point.x}" y="${point.y - 16}" text-anchor="middle">${Math.round(point.value)}</text>
      <foreignObject class="weather-point-icon" x="${point.x - 15}" y="${Math.min(bottom + 12, point.y + 14)}" width="30" height="30">
        <div xmlns="http://www.w3.org/1999/xhtml" class="wx-fo">${weatherIconMarkup(metricIcons[idx] || weatherIconForCondition(data.condition), true)}</div>
      </foreignObject>
    </g>
  `).join("");

  const labelsEl = $("#weatherChartLabels");
  labelsEl.style.gridTemplateColumns = `repeat(${allSeries.labels.length}, minmax(0, 1fr))`;
  labelsEl.innerHTML = allSeries.labels.map(label => `<span>${label}</span>`).join("");
  $$(".weather-tab").forEach(button => button.classList.toggle("active", button.dataset.weatherMetric === metric));
  $$(".chart-view-tab").forEach(button => button.classList.toggle("active", button.dataset.weatherView === state.weatherView));

  $("#dailyForecastRow").innerHTML = dailyForecast.map((day, index) => `
    <article class="daily-forecast-item ${index === safeSelectedIndex ? "active" : ""}" data-forecast-day="${index}">
      <strong>${day.day}</strong>
      <span class="daily-icon">${weatherIconMarkup(day.iconType || getWeatherIconType(day.condition || data.condition, day.precipitation || 0, day.wind || data.wind))}</span>
      <div class="daily-temp"><span>${day.high}°</span><small>${day.low}°</small></div>
    </article>
  `).join("");
  $$("[data-forecast-day]").forEach(card => card.addEventListener("click", () => {
    state.selectedWeatherDay = Number(card.dataset.forecastDay || 0);
    localStorage.setItem("vayu-selected-weather-day", String(state.selectedWeatherDay));
    state.weatherView = "hourly";
    localStorage.setItem("vayu-weather-view", state.weatherView);
    renderWeatherExplorer(data);
    renderDashboard();
  }));
}

function getSafetyAdvice(data, risk) {
  const profile = state.profile || {};
  const advice = [];

  if (data.aqi <= 50) {
    advice.push("Air is good. Normal outdoor activity is okay for most people.");
  } else if (data.aqi <= 100) {
    advice.push("Air is moderate. Sensitive users should avoid long outdoor exposure.");
  } else if (data.aqi <= 150) {
    advice.push("Reduce outdoor workout time and take breaks indoors.");
  } else if (data.aqi <= 200) {
    advice.push("Avoid heavy outdoor activity. Use a well-fitted mask if travel is needed.");
  } else {
    advice.push("Stay indoors as much as possible and avoid unnecessary travel.");
  }

  if (data.mainPollutant === "PM2.5") advice.push("Keep windows closed when outdoor PM2.5 is high.");
  if (data.humidity > 70) advice.push("High humidity can increase discomfort. Stay hydrated and avoid overexertion.");
  if (data.wind < 8 && data.aqi > 100) advice.push("Low wind may keep pollution trapped. Prefer indoor activity today.");
  if (data.temp >= 35) advice.push("Because temperature is high, avoid outdoor exposure during peak afternoon heat.");
  if (profile.condition && profile.condition !== "None") advice.push("Keep prescribed medicines or inhaler accessible if advised by your doctor.");
  if (profile.mask === "No" && data.aqi > 100) advice.push("Use an N95/anti-pollution mask if outdoor travel cannot be avoided.");
  if (profile.purifier === "No" && data.aqi > 150) advice.push("If possible, use indoor air cleaning and reduce smoke/dust indoors.");
  if (["Runner", "Cyclist"].includes(profile.routine) && data.aqi > 100) advice.push("Move running/cycling indoors today or choose a shorter low-exertion session.");
  if (risk.level === "Critical") advice.push("If breathing discomfort, chest pain, or severe symptoms occur, seek medical help immediately.");

  return advice;
}

function animateAQIMeter(target, color) {
  const valueElement = $("#aqiValue");
  const circle = $("#aqiProgressCircle");
  if (!valueElement || !circle) return;

  if (aqiAnimationFrame) cancelAnimationFrame(aqiAnimationFrame);

  const circumference = 2 * Math.PI * 104;
  const cappedTarget = Math.max(0, Math.min(500, Number(target) || 0));
  const maxForMeter = 300;
  const duration = 1100;
  const start = performance.now();

  circle.style.stroke = color;
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = `${circumference}`;
  valueElement.textContent = "0";

  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(cappedTarget * eased);
    const meterPercent = Math.min(1, (cappedTarget / maxForMeter) * eased);

    valueElement.textContent = currentValue;
    circle.style.strokeDashoffset = `${circumference * (1 - meterPercent)}`;

    if (progress < 1) {
      aqiAnimationFrame = requestAnimationFrame(step);
    }
  }

  aqiAnimationFrame = requestAnimationFrame(step);
}

function animateTempMeter(target, color) {
  const valueElement = $("#heroTemp");
  const circle = $("#tempProgressCircle");
  if (!valueElement || !circle) return;

  if (tempAnimationFrame) cancelAnimationFrame(tempAnimationFrame);

  const circumference = 2 * Math.PI * 92;
  const cappedTarget = Math.max(-10, Math.min(55, Number(target) || 0));
  const maxForMeter = 50;
  const startValue = 0;
  const duration = 950;
  const start = performance.now();

  circle.style.stroke = color;
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = `${circumference}`;
  valueElement.textContent = `${startValue}°`;

  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + (cappedTarget - startValue) * eased);
    const meterPercent = Math.min(1, (Math.max(0, cappedTarget) / maxForMeter) * eased);

    valueElement.textContent = `${currentValue}°`;
    circle.style.strokeDashoffset = `${circumference * (1 - meterPercent)}`;

    if (progress < 1) tempAnimationFrame = requestAnimationFrame(step);
  }

  tempAnimationFrame = requestAnimationFrame(step);
}

function updateHeroTemperatureMeter(data) {
  const dailyForecast = getDailyForecast(data);
  const selectedIndex = Math.min(Math.max(state.selectedWeatherDay || 0, 0), dailyForecast.length - 1);
  const selectedDay = dailyForecast[selectedIndex] || dailyForecast[0];
  const displayTemp = selectedIndex > 0 ? selectedDay.high : data.temp;
  const tempMeta = getTempColor(displayTemp);
  animateTempMeter(displayTemp, tempMeta.color);
  if ($("#heroTempStatus")) $("#heroTempStatus").textContent = tempMeta.label;
  if ($("#tempOrb")) {
    $("#tempOrb").style.boxShadow = `0 26px 58px ${tempMeta.color}22, inset 0 0 38px rgba(255,255,255,0.16)`;
  }
}

function buildDailyPlan(data, risk, advice) {
  const profile = state.profile || {};
  const highAqi = data.aqi > 150;
  const moderateAqi = data.aqi > 100;
  const hot = data.temp >= 35;
  const humid = data.humidity >= 70;
  const lowWind = data.wind < 8;
  const sensitive = profile.age === "Senior" || profile.age === "Child" || (profile.condition && profile.condition !== "None") || profile.sensitivity === "Sensitive" || profile.sensitivity === "Highly Sensitive";
  const routine = profile.routine || "your routine";

  const bestTime = !moderateAqi
    ? "Best outdoor time: short outdoor activity is okay"
    : lowWind
      ? "Best outdoor time: avoid unnecessary outdoor exposure today"
      : "Best outdoor time: choose a short evening window if AQI improves";
  const maskAdvice = data.aqi > 100 ? "Mask: recommended outdoors" : "Mask: optional for most users";
  const windowAdvice = data.aqi > 150 || lowWind ? "Windows: keep closed during high AQI" : "Windows: open briefly if air feels fresh";

  const timeline = [
    {
      time: "Morning",
      icon: "🌅",
      title: highAqi ? "Start indoors" : "Check air before stepping out",
      text: highAqi ? "Avoid outdoor workout. Check AQI again before commuting." : "Short outdoor activity is okay for most users; sensitive users should keep it brief."
    },
    {
      time: "Afternoon",
      icon: "☀️",
      title: hot ? "Heat + pollution caution" : "Travel only if needed",
      text: hot ? "Avoid peak heat. Hydrate well and reduce outdoor exertion." : "If you need to travel, keep exposure short and use a mask when AQI is high."
    },
    {
      time: "Evening",
      icon: "🌆",
      title: routine === "Runner" || routine === "Cyclist" ? "Shift exercise indoors" : "Choose a safer window",
      text: moderateAqi ? "Prefer indoor movement. Outdoor walks should be short and low intensity." : "Evening activity is okay, but keep monitoring AQI changes."
    },
    {
      time: "Night",
      icon: "🌙",
      title: "Recover and reduce exposure",
      text: highAqi || lowWind ? "Keep windows closed and avoid smoke, incense, or dust indoors." : "Ventilate briefly if AQI is acceptable and wind is helping dispersion."
    }
  ];

  const checklist = [
    { label: "Check AQI before leaving", done: true },
    { label: data.aqi > 100 ? "Carry/use mask outdoors" : "Mask optional unless dusty/crowded", done: data.aqi <= 100 || profile.mask === "Yes" },
    { label: sensitive ? "Sensitive user caution enabled" : "Normal sensitivity profile", done: true },
    { label: humid || hot ? "Hydrate and avoid overexertion" : "Normal hydration routine", done: true },
    { label: profile.condition && profile.condition !== "None" ? "Keep prescribed support accessible" : "No condition-specific reminder", done: true }
  ];

  return {
    summary: `${risk.level} risk plan for ${getLocationLabel()}`,
    reason: advice[0] || "VAYU is using your profile and local environment to build today's safety plan.",
    bestTime,
    maskAdvice,
    windowAdvice,
    timeline,
    checklist
  };
}

function renderDailyPlan(data, risk, advice) {
  const plan = buildDailyPlan(data, risk, advice);
  if ($("#dailyPlanSummary")) $("#dailyPlanSummary").textContent = plan.summary;
  if ($("#dailyPlanReason")) $("#dailyPlanReason").textContent = plan.reason;
  if ($("#dailyBestTime")) $("#dailyBestTime").textContent = plan.bestTime;
  if ($("#dailyMaskAdvice")) $("#dailyMaskAdvice").textContent = plan.maskAdvice;
  if ($("#dailyWindowAdvice")) $("#dailyWindowAdvice").textContent = plan.windowAdvice;
  if ($("#dailyPlanRiskChip")) $("#dailyPlanRiskChip").textContent = `${risk.level} • ${risk.score}/100`;
  if ($("#dailyPlanTimeline")) {
    $("#dailyPlanTimeline").innerHTML = plan.timeline.map(item => `
      <article class="daily-time-card">
        <span>${item.icon}</span>
        <div>
          <strong>${item.time}</strong>
          <h4>${item.title}</h4>
          <p>${item.text}</p>
        </div>
      </article>
    `).join("");
  }
  if ($("#dailyChecklist")) {
    $("#dailyChecklist").innerHTML = plan.checklist.map(item => `
      <label class="daily-check-item">
        <input type="checkbox" ${item.done ? "checked" : ""} />
        <span>${item.label}</span>
      </label>
    `).join("");
  }
}


function classifyHealthReport(kind, value, data, risk) {
  if (kind === "aqi") {
    if (data.aqi > 200) return { level: "Critical", score: 92, text: "Very unhealthy air. Outdoor exposure should be minimized." };
    if (data.aqi > 150) return { level: "High", score: 76, text: "Unhealthy air. Avoid heavy outdoor activity." };
    if (data.aqi > 100) return { level: "Caution", score: 58, text: "Sensitive users should reduce exposure." };
    if (data.aqi > 50) return { level: "Moderate", score: 38, text: "Generally manageable with basic caution." };
    return { level: "Good", score: 18, text: "Air is safer for most users." };
  }
  if (kind === "pm25") {
    if (value > 90) return { level: "High", score: 82, text: "Fine particles are elevated and can affect lungs." };
    if (value > 60) return { level: "Caution", score: 62, text: "PM2.5 is high enough for respiratory caution." };
    if (value > 35) return { level: "Moderate", score: 42, text: "Fine particle levels need monitoring." };
    return { level: "Low", score: 20, text: "PM2.5 is comparatively manageable." };
  }
  if (kind === "heat") {
    if (data.temp >= 42) return { level: "Critical", score: 88, text: "Extreme heat risk. Avoid outdoor exertion." };
    if (data.temp >= 35) return { level: "High", score: 72, text: "Heat may increase fatigue and pollution discomfort." };
    if (data.temp >= 30) return { level: "Moderate", score: 48, text: "Warm conditions need hydration." };
    return { level: "Low", score: 22, text: "Temperature is comfortable for most users." };
  }
  if (kind === "humidity") {
    if (data.humidity >= 80) return { level: "High", score: 74, text: "High humidity can increase breathing discomfort." };
    if (data.humidity >= 70) return { level: "Caution", score: 58, text: "Humidity may worsen comfort for sensitive users." };
    return { level: "Low", score: 25, text: "Humidity is not a major risk right now." };
  }
  if (kind === "wind") {
    if (data.wind < 8 && data.aqi > 100) return { level: "High", score: 72, text: "Low wind may trap pollution close to the ground." };
    if (data.wind < 12) return { level: "Moderate", score: 44, text: "Limited dispersion. Keep monitoring AQI." };
    return { level: "Good", score: 22, text: "Wind can help disperse pollutants." };
  }
  if (kind === "outdoor") {
    if (risk.score >= 76) return { level: "Not recommended", score: 86, text: "Avoid unnecessary outdoor exposure today." };
    if (risk.score >= 51) return { level: "Limited", score: 62, text: "Keep outdoor time short and low intensity." };
    return { level: "Manageable", score: 30, text: "Outdoor activity is manageable with normal caution." };
  }
  return { level: "Info", score: 40, text: "Monitor this category." };
}

function buildHealthReport(data, risk, advice) {
  const profile = state.profile || {};
  const pm25 = data.pollutants["PM2.5"] || 0;
  const sensitive = profile.age === "Senior" || profile.age === "Child" || (profile.condition && profile.condition !== "None") || profile.sensitivity === "Sensitive" || profile.sensitivity === "Highly Sensitive";
  const maskNeed = data.aqi > 150 ? "Strongly recommended" : data.aqi > 100 ? "Recommended" : sensitive ? "Optional but useful" : "Optional";
  const categories = [
    { icon: "🌫️", title: "AQI Risk", value: `${data.aqi} • ${data.status}`, ...classifyHealthReport("aqi", data.aqi, data, risk) },
    { icon: "🫁", title: "PM2.5 Risk", value: `${pm25}`, ...classifyHealthReport("pm25", pm25, data, risk) },
    { icon: "🌡️", title: "Heat Risk", value: `${data.temp}°C`, ...classifyHealthReport("heat", data.temp, data, risk) },
    { icon: "💧", title: "Humidity Risk", value: `${data.humidity}%`, ...classifyHealthReport("humidity", data.humidity, data, risk) },
    { icon: "🌬️", title: "Wind Dispersion", value: `${data.wind} km/h`, ...classifyHealthReport("wind", data.wind, data, risk) },
    { icon: "🚶", title: "Outdoor Safety", value: risk.score >= 76 ? "Avoid" : risk.score >= 51 ? "Short only" : "Manageable", ...classifyHealthReport("outdoor", risk.score, data, risk) },
    { icon: "😷", title: "Mask Need", value: maskNeed, level: maskNeed, score: data.aqi > 150 ? 80 : data.aqi > 100 ? 62 : 30, text: data.aqi > 100 ? "Use a well-fitted mask outdoors, especially near traffic and dust." : "Mask is optional unless the place is dusty or crowded." },
    { icon: "👥", title: "Sensitive Group", value: sensitive ? "Caution" : "Normal", level: sensitive ? "Caution" : "Normal", score: sensitive ? 62 : 28, text: sensitive ? "Your profile indicates higher sensitivity, so use stricter precautions." : "No major sensitivity marker selected in profile." }
  ];
  const actions = [
    advice[0] || "Check AQI before outdoor plans.",
    maskNeed.includes("recommended") || data.aqi > 100 ? "Carry a mask before stepping outside." : "Mask is optional unless dusty or crowded.",
    data.aqi > 150 || data.wind < 8 ? "Keep windows closed during pollution peaks." : "Ventilate briefly when air feels fresh.",
    data.temp >= 35 || data.humidity >= 70 ? "Hydrate and avoid overexertion." : "Maintain normal hydration and monitor symptoms.",
    profile.condition && profile.condition !== "None" ? "Keep prescribed support accessible if advised by your doctor." : "Save your full profile for sharper guidance."
  ];
  return { categories, actions, sensitive };
}

function renderHealthReport(data, risk, advice) {
  const report = buildHealthReport(data, risk, advice);
  const ring = $("#reportScoreRing");
  if ($("#reportScoreValue")) $("#reportScoreValue").textContent = risk.score;
  if ($("#reportScoreLevel")) $("#reportScoreLevel").textContent = `${risk.level} Risk`;
  if (ring) ring.style.setProperty("--report-score", `${risk.score}%`);
  if ($("#reportSummaryText")) $("#reportSummaryText").textContent = `${risk.level} preventive risk for ${getLocationLabel()}. ${advice[0] || "Follow general precautions today."}`;
  if ($("#reportLocationChip")) $("#reportLocationChip").textContent = getLocationLabel();
  if ($("#reportUpdatedChip")) $("#reportUpdatedChip").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if ($("#reportReasonList")) {
    $("#reportReasonList").innerHTML = risk.reasons.slice(0, 6).map(reason => `<div class="report-reason-item"><span>•</span><p>${reason}</p></div>`).join("");
  }
  if ($("#healthReportGrid")) {
    $("#healthReportGrid").innerHTML = report.categories.map(card => `
      <article class="health-report-card">
        <span class="report-card-icon">${card.icon}</span>
        <div>
          <small>${card.title}</small>
          <strong>${card.value}</strong>
          <em>${card.level}</em>
          <p>${card.text}</p>
        </div>
        <div class="mini-score-track"><span style="width:${Math.max(8, Math.min(100, card.score))}%"></span></div>
      </article>
    `).join("");
  }
  if ($("#reportActionList")) {
    $("#reportActionList").innerHTML = report.actions.map((action, index) => `<div class="report-action-item"><strong>${index + 1}</strong><span>${action}</span></div>`).join("");
  }
}


function getRemedyLogForToday() {
  const key = todayKey();
  if (!state.remedyLogs || typeof state.remedyLogs !== "object") state.remedyLogs = {};
  if (!state.remedyLogs[key]) state.remedyLogs[key] = {};
  return state.remedyLogs[key];
}

function updateRemedyStatus(id, status) {
  const key = todayKey();
  if (!state.remedyLogs || typeof state.remedyLogs !== "object") state.remedyLogs = {};
  if (!state.remedyLogs[key]) state.remedyLogs[key] = {};
  state.remedyLogs[key][id] = { status, time: new Date().toISOString() };
  writeJsonStorage("vayu-remedy-logs", state.remedyLogs);
  renderDashboard();
  const label = status === "done" ? "marked complete" : "paused for today";
  const chatBox = $("#chatMessages");
  if (chatBox) addMessage(chatBox, "bot", `Remedy ${label}. I will use this in today's wellness monitoring.`);
}

function buildRemedyMonitor(data, risk) {
  const highAqi = data.aqi > 150;
  const polluted = data.aqi > 100;
  const humid = data.humidity > 70;
  const hot = data.temp >= 35;
  const profile = state.profile || {};
  const sensitive = profile.age === "Senior" || profile.age === "Child" || profile.condition && profile.condition !== "None" || profile.sensitivity === "Highly Sensitive";
  const log = getRemedyLogForToday();

  const items = [
    {
      id: "hydration",
      title: hot ? "Cooling hydration breaks" : "Warm hydration support",
      time: hot ? "Every 2–3 hours" : "Morning + evening",
      priority: hot || humid ? "High" : "Normal",
      text: hot ? "Take water breaks and avoid peak heat exposure." : "Sip water steadily; warm water is fine if comfortable."
    },
    {
      id: "breathing",
      title: highAqi ? "Gentle indoor breathing only" : "Gentle pranayama window",
      time: highAqi ? "Indoors only" : "Clean-air time",
      priority: highAqi || sensitive ? "High" : "Normal",
      text: highAqi ? "Avoid forceful pranayama such as intense Kapalabhati/Bhastrika during high AQI." : "Short, gentle breathing practice is okay if you feel comfortable."
    },
    {
      id: "indoorAir",
      title: polluted ? "Indoor air protection" : "Ventilation check",
      time: polluted ? "Now" : "Midday",
      priority: polluted ? "High" : "Normal",
      text: polluted ? "Keep windows closed during pollution spikes; avoid incense, smoke, and dust cleaning." : "Ventilate when outdoor AQI is comfortable and wind is not carrying dust."
    },
    {
      id: "movement",
      title: highAqi ? "Low-exposure movement" : "Light activity",
      time: "Evening check",
      priority: highAqi ? "High" : "Normal",
      text: highAqi ? "Choose indoor stretching instead of outdoor workout near traffic." : "Light walking or stretching is okay if AQI stays manageable."
    }
  ];

  if (sensitive) {
    items.push({
      id: "medicalSupport",
      title: "Sensitive-user safety check",
      time: "Before travel",
      priority: "High",
      text: "Keep prescribed support accessible and follow doctor guidance for asthma, heart issues, or breathing symptoms."
    });
  }

  return items.map(item => ({ ...item, status: log[item.id]?.status || "pending", completedAt: log[item.id]?.time || null }));
}

function getRemedyProgress(items) {
  if (!items.length) return 0;
  return Math.round((items.filter(item => item.status === "done").length / items.length) * 100);
}

function renderRemedyMonitor(data, risk) {
  const items = buildRemedyMonitor(data, risk);
  const progress = getRemedyProgress(items);
  if ($("#remedyMonitorChip")) $("#remedyMonitorChip").textContent = `${progress}% complete`;
  if ($("#remedyMonitorSummary")) {
    const high = items.filter(item => item.priority === "High").length;
    $("#remedyMonitorSummary").textContent = `${items.length} preventive actions for today • ${high} high-priority based on AQI, weather, and profile.`;
  }
  const markup = items.map(item => `
    <article class="remedy-monitor-item ${item.status} ${item.priority.toLowerCase()}">
      <div class="remedy-monitor-top">
        <strong>${item.title}</strong>
        <span>${item.priority}</span>
      </div>
      <p>${item.text}</p>
      <small>${item.time}${item.status === "done" ? " • completed" : item.status === "skipped" ? " • paused" : ""}</small>
      <div class="remedy-monitor-actions">
        <button type="button" data-remedy-status="done" data-remedy-id="${item.id}" ${item.status === "done" ? "disabled" : ""}>Done</button>
        <button type="button" data-remedy-status="skipped" data-remedy-id="${item.id}" ${item.status === "skipped" ? "disabled" : ""}>Skip</button>
      </div>
    </article>
  `).join("");
  if ($("#ayushRemedyMonitor")) $("#ayushRemedyMonitor").innerHTML = markup;
  if ($("#dashboardRemedyChip")) $("#dashboardRemedyChip").textContent = `${progress}% complete`;
  if ($("#dashboardRemedyMonitor")) $("#dashboardRemedyMonitor").innerHTML = items.slice(0, 4).map(item => `
    <article class="remedy-monitor-item ${item.status} ${item.priority.toLowerCase()}">
      <div class="remedy-monitor-top"><strong>${item.title}</strong><span>${item.status === "done" ? "Done" : item.status === "skipped" ? "Skipped" : item.priority}</span></div>
      <p>${item.text}</p>
      <small>${item.time}${item.status === "done" ? " • completed" : item.status === "skipped" ? " • paused" : ""}</small>
      <div class="remedy-monitor-actions">
        <button type="button" data-remedy-status="done" data-remedy-id="${item.id}" ${item.status === "done" ? "disabled" : ""}>Done</button>
        <button type="button" data-remedy-status="skipped" data-remedy-id="${item.id}" ${item.status === "skipped" ? "disabled" : ""}>Skip</button>
      </div>
    </article>
  `).join("");
}

function buildChatContext(data, risk, care) {
  const daily = getDailyForecast(data);
  const selected = daily[Math.min(Math.max(state.selectedWeatherDay || 0, 0), daily.length - 1)] || daily[0] || {};
  const remedyItems = buildRemedyMonitor(data, risk);
  const remedyProgress = getRemedyProgress(remedyItems);
  const exposureLog = getTodayExposureLog();
  const exposureScore = scoreExposureLog(exposureLog, data);
  return {
    location: getLocationLabel(),
    aqi: data.aqi,
    air: simplifyAirLabel(data.aqi),
    temp: data.temp,
    humidity: data.humidity,
    wind: data.wind,
    condition: data.conditionLabel,
    risk: risk.level,
    score: risk.score,
    selected,
    remedies: remedyItems,
    remedyProgress,
    exposureLog,
    exposureScore,
    care
  };
}

function summarizeRemedyMonitor(items) {
  const pending = items.filter(item => item.status === "pending");
  const done = items.filter(item => item.status === "done");
  const high = pending.filter(item => item.priority === "High");
  if (!pending.length) return `All ${done.length} remedies are completed for today.`;
  const focus = (high[0] || pending[0]);
  return `${done.length}/${items.length} remedies completed. Next focus: ${focus.title} — ${focus.text}`;
}

function buildAyushCare(data, risk) {
  const profile = state.profile || {};
  const highAqi = data.aqi > 150;
  const moderateAqi = data.aqi > 100;
  const hot = data.temp >= 35;
  const humid = data.humidity >= 70;
  const dailyForecast = getDailyForecast(data);
  const selectedIndex = Math.min(Math.max(state.selectedWeatherDay || 0, 0), dailyForecast.length - 1);
  const selectedDay = dailyForecast[selectedIndex] || dailyForecast[0] || {};
  const snow = data.condition === "snowy" || data.condition === "blizzard" || selectedDay.condition === "snowy" || selectedDay.condition === "blizzard";
  const cold = snow || data.temp <= 12 || (Number.isFinite(selectedDay.low) && selectedDay.low <= 8);
  const sensitive = profile.age === "Senior" || profile.age === "Child" || (profile.condition && profile.condition !== "None") || profile.sensitivity === "Highly Sensitive";
  const modeTitle = cold ? "Winter AYUSH care mode" : highAqi ? "Indoor respiratory care mode" : moderateAqi ? "Gentle preventive care mode" : "Balanced wellness mode";
  const modeText = cold
    ? "Snow or cold weather is active, so focus on warmth, gentle indoor movement, and steady hydration. Avoid cold outdoor breathing strain."
    : highAqi
      ? "AQI is high, so keep practices gentle and indoors in clean air. Avoid intense breathing outdoors."
      : moderateAqi
        ? "Use light indoor routines and avoid long outdoor exertion, especially if you are sensitive."
        : "Outdoor movement is more manageable, but keep routines comfortable and non-strenuous.";
  const caution = sensitive
    ? "Because your profile is sensitive, keep routines gentle and stop immediately if there is discomfort."
    : "These are preventive wellness tips, not treatment. Stop if you feel dizziness, chest pain, or breathing discomfort.";
  const routine = [
    { time: "Morning", icon: cold ? "❄️" : "🌅", title: cold ? "Warm indoor start" : (highAqi ? "Indoor start" : "Fresh start"), text: cold ? "Start with gentle indoor mobility, warm layers, and avoid forceful breathing in cold outdoor air." : (highAqi ? "Do light stretching indoors. Avoid outdoor pranayama until AQI improves." : "Try gentle stretching and short breathing awareness in a clean area.") },
    { time: "Afternoon", icon: "☀️", title: hot ? "Cooling care" : "Hydration check", text: hot || humid ? "Hydrate well and avoid exertion. Prefer calm indoor movement." : "Take water breaks and avoid dusty roadside exposure." },
    { time: "Evening", icon: "🌆", title: cold ? "Warm recovery movement" : "Gentle mobility", text: cold ? "Prefer indoor stretching or yoga. Avoid running/cycling on slippery snowy routes." : (moderateAqi ? "Choose indoor yoga or a short low-intensity walk only if AQI improves." : "Light walk or yoga is okay for most users.") },
    { time: "Night", icon: "🌙", title: "Recovery routine", text: "Keep sleep area clean, avoid smoke/incense, and maintain comfortable ventilation based on AQI." }
  ];
  const practices = [
    cold ? "Gentle indoor breathing awareness after warming up; avoid cold-air forceful pranayama." : (highAqi ? "Gentle indoor breathing awareness, not forceful pranayama." : "Gentle pranayama in clean air for a short duration."),
    "Light yoga/stretching indoors when AQI is high.",
    cold ? "Warm water sips if comfortable; avoid smoke exposure and sudden cold-air exposure." : "Steam-free warm hydration if comfortable; avoid smoke exposure.",
    "Use nasal/respiratory hygiene only as personally suitable and safe."
  ];
  const avoid = [
    "Avoid intense Kapalabhati/Bhastrika outdoors during high AQI.",
    "Avoid outdoor workout near traffic or dust.",
    cold ? "Avoid sudden outdoor exertion in cold air or snow." : (hot ? "Avoid peak afternoon heat exposure." : "Avoid sudden heavy exertion if air quality worsens."),
    humid ? "Avoid overexertion in high humidity." : "Avoid incense, smoke, and indoor dust."
  ];
  const wellness = [
    "Keep hydration steady through the day.",
    "Prefer clean indoor air during high pollution periods.",
    "Use Easy Mode for larger, senior-friendly guidance if needed.",
    "Consult a healthcare professional for severe or persistent symptoms."
  ];
  const chips = [
    `${data.aqi} AQI`,
    `${data.temp}°C`,
    risk.level,
    highAqi ? "Indoor preferred" : "Monitor outdoors"
  ];
  const remedies = buildAyushRemedies(data, risk);
  return { modeTitle, modeText, caution, routine, practices, avoid, wellness, chips, remedies };
}

function buildAyushRemedies(data, risk) {
  const highAqi = data.aqi > 150;
  const humid = data.humidity > 70;
  const hot = data.temp >= 35;
  const dailyForecast = getDailyForecast(data);
  const selectedIndex = Math.min(Math.max(state.selectedWeatherDay || 0, 0), dailyForecast.length - 1);
  const selectedDay = dailyForecast[selectedIndex] || dailyForecast[0] || {};
  const snow = data.condition === "snowy" || data.condition === "blizzard" || selectedDay.condition === "snowy" || selectedDay.condition === "blizzard";
  const cold = snow || data.temp <= 12 || (Number.isFinite(selectedDay.low) && selectedDay.low <= 8);
  const remedies = [
    cold ? "Take warm water sips if suitable and keep your chest/neck protected from cold air." : (highAqi ? "Sip warm water through the day; avoid smoke, incense, and dusty cleaning." : "Hydrate steadily and keep indoor air fresh when AQI is comfortable."),
    cold ? "Do gentle indoor breathing awareness only after warming up; avoid forceful pranayama in cold air." : (highAqi ? "Practice gentle indoor breathing awareness only; avoid forceful pranayama." : "Short gentle pranayama in clean air is okay if comfortable."),
    cold ? "Choose indoor stretching/yoga. Avoid running or cycling on snow/slippery routes." : (humid ? "Choose light indoor stretching; high humidity can make breathing feel heavier." : "Do light yoga or stretching in a clean, ventilated room."),
    cold ? "Use winter routine: warm layers, warm fluids if suitable, and gentle indoor mobility." : (hot ? "Use cooling routine: water breaks, shade, and avoid peak afternoon heat." : "Keep a calm evening routine and avoid heavy outdoor exertion near traffic.")
  ];
  if (risk.level === "Critical" || risk.level === "High") remedies.push("For asthma, heart issues, or severe symptoms, follow doctor advice and keep prescribed support accessible.");
  else remedies.push("Use preventive care only; stop any practice that causes dizziness or discomfort.");
  return remedies;
}

function renderAyushCare(data, risk) {
  const care = buildAyushCare(data, risk);
  if ($("#ayushModeTitle")) $("#ayushModeTitle").textContent = care.modeTitle;
  if ($("#ayushModeText")) $("#ayushModeText").textContent = care.modeText;
  if ($("#ayushCautionText")) $("#ayushCautionText").textContent = care.caution;
  if ($("#ayushRiskChip")) $("#ayushRiskChip").textContent = `${risk.level} • ${risk.score}/100`;
  if ($("#ayushQuickChips")) $("#ayushQuickChips").innerHTML = care.chips.map(chip => `<span>${chip}</span>`).join("");
  if ($("#ayushRoutineGrid")) {
    $("#ayushRoutineGrid").innerHTML = care.routine.map(item => `
      <article class="ayush-routine-item">
        <span>${item.icon}</span>
        <strong>${item.time}</strong>
        <h4>${item.title}</h4>
        <p>${item.text}</p>
      </article>
    `).join("");
  }
  if ($("#ayushPracticeList")) $("#ayushPracticeList").innerHTML = care.practices.map(item => `<div><span>✓</span><p>${item}</p></div>`).join("");
  if ($("#ayushAvoidList")) $("#ayushAvoidList").innerHTML = care.avoid.map(item => `<div><span>!</span><p>${item}</p></div>`).join("");
  if ($("#ayushWellnessList")) $("#ayushWellnessList").innerHTML = [...care.wellness, ...care.remedies.slice(0, 3)].map(item => `<div><span>🌿</span><p>${item}</p></div>`).join("");
}


function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTodayExposureLog() {
  const key = todayKey();
  return state.exposureLogs.find(log => log.date === key) || null;
}

function getDurationScore(duration) {
  const values = {
    "None": 0,
    "Less than 30 min": 8,
    "30–60 min": 16,
    "1–2 hours": 28,
    "3+ hours": 42
  };
  return values[duration] ?? 10;
}

function scoreExposureLog(log, data = currentData()) {
  if (!log) return 0;
  let score = 0;
  score += getDurationScore(log.duration);
  if (log.travel) score += 10;
  if (log.exercise) score += data.aqi > 100 ? 22 : 12;
  if (log.smoke) score += 18;
  if (log.discomfort) score += 24;
  if (data.aqi > 200) score += 18;
  else if (data.aqi > 150) score += 12;
  else if (data.aqi > 100) score += 8;
  if (log.mask) score -= 12;
  if (log.indoors) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getExposureLevel(score) {
  if (score >= 76) return "Critical";
  if (score >= 51) return "High";
  if (score >= 26) return "Moderate";
  if (score > 0) return "Low";
  return "Not logged";
}

function buildExposureSuggestions(log, data, risk) {
  if (!log) {
    return [
      "Log your outdoor duration and mask use to make VAYU’s advice more personal.",
      data.aqi > 150 ? "AQI is unhealthy today, so avoid outdoor exercise if possible." : "AQI is manageable, but keep checking before long outdoor exposure.",
      "Your data stays in this browser in the V2 demo."
    ];
  }
  const score = scoreExposureLog(log, data);
  const suggestions = [];
  if (score >= 76) suggestions.push("Tomorrow, strongly prefer indoor activity and reduce outdoor travel if AQI remains high.");
  else if (score >= 51) suggestions.push("Tomorrow, reduce outdoor exposure and avoid exercise near traffic or dusty roads.");
  else if (score >= 26) suggestions.push("Tomorrow, keep outdoor time short and use a mask if pollution is high.");
  else suggestions.push("Exposure looks controlled. Keep monitoring AQI before long outdoor activity.");
  if (log.exercise && data.aqi > 100) suggestions.push("Avoid outdoor running/workout when AQI is above 100; choose indoor stretching or light yoga.");
  if (log.discomfort) suggestions.push("Because you logged breathing discomfort, stay cautious and contact a healthcare professional if symptoms persist or worsen.");
  if (!log.mask && (data.aqi > 100 || log.travel)) suggestions.push("Consider mask use during travel or dusty outdoor exposure.");
  if (risk.level === "High" || risk.level === "Critical") suggestions.push("Your health profile and current environment suggest extra caution.");
  return suggestions.slice(0, 5);
}

function renderExposureTracker() {
  const data = currentData();
  const risk = calculateRisk(data);
  const log = getTodayExposureLog();
  const score = scoreExposureLog(log, data);
  const level = getExposureLevel(score);
  const suggestions = buildExposureSuggestions(log, data, risk);
  const color = score >= 76 ? "#D85A4C" : score >= 51 ? "#E3833F" : score >= 26 ? "#E0B24A" : score > 0 ? "#7FBE63" : "var(--primary)";

  if ($("#exposureScoreValue")) $("#exposureScoreValue").textContent = score;
  if ($("#exposureScoreLabel")) $("#exposureScoreLabel").textContent = level;
  if ($("#exposureSummaryText")) $("#exposureSummaryText").textContent = log
    ? `${level} exposure today based on ${log.duration}, mask use, outdoor activity, and symptoms.`
    : "No exposure log saved for today yet.";
  if ($("#exposureScoreRing")) $("#exposureScoreRing").style.background = `conic-gradient(${color} ${score * 3.6}deg, rgba(120,125,120,0.14) 0deg)`;
  if ($("#exposureUpdatedChip")) $("#exposureUpdatedChip").textContent = log ? `Saved ${new Date(log.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No log yet";
  if ($("#exposureSuggestionList")) $("#exposureSuggestionList").innerHTML = suggestions.map(item => `<div><span>↳</span><p>${item}</p></div>`).join("");
  if ($("#exposureHistoryChip")) $("#exposureHistoryChip").textContent = `${state.exposureLogs.length} logs`;
  if ($("#exposureHistoryList")) {
    $("#exposureHistoryList").innerHTML = state.exposureLogs.length
      ? state.exposureLogs.slice(0, 7).map(item => {
          const itemScore = scoreExposureLog(item, data);
          return `<article class="exposure-history-item"><strong>${new Date(item.date).toLocaleDateString([], { day: "numeric", month: "short" })}</strong><span>${getExposureLevel(itemScore)} • ${itemScore}/100</span><p>${item.duration}${item.mask ? " • mask used" : ""}${item.discomfort ? " • discomfort" : ""}</p></article>`;
        }).join("")
      : `<p class="body-text">No history yet. Save today’s log to start tracking exposure.</p>`;
  }
  if (log) {
    if ($("#exposureDuration")) $("#exposureDuration").value = log.duration;
    if ($("#exposureIndoors")) $("#exposureIndoors").checked = Boolean(log.indoors);
    if ($("#exposureTravel")) $("#exposureTravel").checked = Boolean(log.travel);
    if ($("#exposureExercise")) $("#exposureExercise").checked = Boolean(log.exercise);
    if ($("#exposureMask")) $("#exposureMask").checked = Boolean(log.mask);
    if ($("#exposureSmoke")) $("#exposureSmoke").checked = Boolean(log.smoke);
    if ($("#exposureDiscomfort")) $("#exposureDiscomfort").checked = Boolean(log.discomfort);
    if ($("#exposureNotes")) $("#exposureNotes").value = log.notes || "";
    if ($("#exposureSaveButton")) $("#exposureSaveButton").textContent = "Update Today’s Log";
  }
}

async function saveExposureLog(event) {
  event.preventDefault();
  const log = {
    date: todayKey(),
    duration: $("#exposureDuration")?.value || "None",
    indoors: Boolean($("#exposureIndoors")?.checked),
    travel: Boolean($("#exposureTravel")?.checked),
    exercise: Boolean($("#exposureExercise")?.checked),
    mask: Boolean($("#exposureMask")?.checked),
    smoke: Boolean($("#exposureSmoke")?.checked),
    discomfort: Boolean($("#exposureDiscomfort")?.checked),
    notes: $("#exposureNotes")?.value.trim() || "",
    savedAt: new Date().toISOString()
  };
  state.exposureLogs = [log, ...state.exposureLogs.filter(item => item.date !== log.date)].slice(0, 30);
  writeJsonStorage("vayu-exposure-logs", state.exposureLogs);
  if (getAuthToken()) {
    try {
      const payload = await apiRequest("/exposure", { method: "POST", body: JSON.stringify(log) });
      if (Array.isArray(payload.exposureLogs)) {
        state.exposureLogs = payload.exposureLogs;
        writeJsonStorage("vayu-exposure-logs", state.exposureLogs);
      }
    } catch (error) {
      console.warn("Exposure backend sync failed", error);
    }
  }
  renderDashboard();
  const score = scoreExposureLog(log, currentData());
  addMessage($("#chatMessages"), "bot", `Exposure log saved. Today's exposure score is ${score}/100 (${getExposureLevel(score)}). I will use this in your safety guidance.`);
}

async function clearExposureHistory() {
  state.exposureLogs = [];
  localStorage.removeItem("vayu-exposure-logs");
  if (getAuthToken()) {
    try { await apiRequest("/exposure", { method: "DELETE" }); } catch (error) { console.warn("Exposure backend clear failed", error); }
  }
  if ($("#exposureForm")) $("#exposureForm").reset();
  if ($("#exposureSaveButton")) $("#exposureSaveButton").textContent = "Save Today’s Log";
  renderDashboard();
  addMessage($("#chatMessages"), "bot", "Exposure history cleared from this browser.");
}

function calculateFeelsLike(temp, humidity) {
  if (temp >= 27) {
    const hi = -8.784695 + 1.61139411 * temp + 2.338549 * humidity - 0.14611605 * temp * humidity - 0.012308094 * temp * temp - 0.016424828 * humidity * humidity + 0.002211732 * temp * temp * humidity + 0.00072546 * temp * humidity * humidity - 0.000003582 * temp * temp * humidity * humidity;
    return Math.round(hi);
  }
  return Math.round(temp);
}

function renderHeroScene(data) {
  const mode = getTimeMode();
  const scene = $("#heroWeatherScene");
  const stage = $("#sceneStage");
  if (!scene || !stage) return;
  const dailyForecast = getDailyForecast(data);
  const selectedIndex = Math.min(Math.max(state.selectedWeatherDay || 0, 0), dailyForecast.length - 1);
  const selected = dailyForecast[selectedIndex] || dailyForecast[0];
  const isFutureDay = selectedIndex > 0;
  const high = isFutureDay ? selected.high : (data.dailySeries?.[0]?.high ?? Math.round(data.temp + 2));
  const low = isFutureDay ? selected.low : (data.dailySeries?.[0]?.low ?? Math.round(data.temp - 3));
  const displayTemp = isFutureDay ? selected.high : Math.round(data.temp);
  const displayCondition = isFutureDay ? selected.condition : data.condition;
  const displayConditionLabel = isFutureDay ? selected.conditionLabel : data.conditionLabel;
  const feelsLike = isFutureDay ? Math.round(displayTemp + Math.max(0, data.humidity - 45) / 10) : calculateFeelsLike(data.temp, data.humidity);
  if ($("#sceneLocation")) $("#sceneLocation").textContent = getLocationLabel();
  if ($("#sceneTemp")) $("#sceneTemp").textContent = `${displayTemp}°`;
  if ($("#sceneCondition")) $("#sceneCondition").textContent = displayConditionLabel;
  if ($("#sceneHighLow")) $("#sceneHighLow").textContent = `↑ ${high}° / ↓ ${low}°`;
  if ($("#sceneFeelsLike")) $("#sceneFeelsLike").textContent = `Feels like ${feelsLike}°`;
  scene.className = `hero-weather-scene ${mode} ${displayCondition}`;
  stage.className = `scene-stage ${mode} ${displayCondition}`;
}

function renderDashboard() {
  const data = currentData();
  const risk = calculateRisk(data);
  const advice = getSafetyAdvice(data, risk);
  const aqiColor = getAQIColor(data.aqi);

  const locationLabel = getLocationLabel();
  const displayStatus = simplifyAirLabel(data.aqi);
  const dailyForecast = getDailyForecast(data);
  const selectedIndex = Math.min(Math.max(state.selectedWeatherDay || 0, 0), dailyForecast.length - 1);
  const selectedDay = dailyForecast[selectedIndex] || dailyForecast[0];
  if (selectedIndex > 0) {
    $("#heroHeadline").textContent = `${selectedDay.day} forecast for ${locationLabel}: ${selectedDay.conditionLabel || selectedDay.condition}`;
    $("#heroAdvice").textContent = `High ${selectedDay.high}°, low ${selectedDay.low}°, rain chance ${selectedDay.precipitation || 0}%, wind ${selectedDay.wind || data.wind} km/h. Current air status is ${displayStatus.toLowerCase()}.`;
  } else {
    $("#heroHeadline").textContent = `${locationLabel === "Your Area" ? "Your local" : locationLabel} air is ${displayStatus.toLowerCase()} today`;
    $("#heroAdvice").textContent = advice[0];
  }
  animateAQIMeter(data.aqi, aqiColor);
  $("#aqiStatus").textContent = displayStatus;
  $("#aqiOrb").style.borderColor = aqiColor;
  $("#aqiOrb").style.boxShadow = `0 30px 70px ${aqiColor}33, inset 0 0 45px rgba(255,255,255,0.18)`;

  $("#riskLevel").textContent = risk.level;
  $("#riskFill").style.width = `${risk.score}%`;
  $("#riskScoreText").textContent = `Risk Score: ${risk.score}/100`;
  $("#temperature").textContent = `${data.temp}°C`;
  $("#weatherSummary").textContent = `${data.conditionLabel} • ${data.humidity}% humidity • ${data.wind} km/h wind`;
  updateHeroTemperatureMeter(data);
  $("#mainPollutant").textContent = data.mainPollutant;
  $("#pollutantHint").textContent = pollutantInfo[data.mainPollutant];
  $("#alertTitle").textContent = data.aqi > 150 ? `High ${data.mainPollutant}` : data.aqi > 100 ? "Sensitive Alert" : "Normal Caution";
  $("#alertText").textContent = data.aqi > 150 ? "Sensitive users should reduce outdoor exposure." : "Monitor air quality before long outdoor activity.";
  $("#lastUpdated").textContent = `${data.source || state.liveStatus} • ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  renderPollutantBars(data);
  renderDashboardInsights(data, risk);
  renderSafetyPlan(advice, data, risk);
  renderAQIDetails(data);
  renderWeather(data);
  renderWeatherExplorer(data);
  renderHealth(data, risk, advice);
  renderDailyPlan(data, risk, advice);
  renderHealthReport(data, risk, advice);
  renderAyushCare(data, risk);
  renderRemedyMonitor(data, risk);
  renderExposureTracker();
  renderAlerts(data, risk);
  renderSafetyModule();
  updateLocationUI();
  renderForecast(data);
  renderWeatherAnimation(data.condition);
}

function renderPollutantBars(data) {
  const maxValues = { "PM2.5": 120, PM10: 200, NO2: 80, SO2: 50, O3: 100, CO: 2 };
  $("#pollutantBars").innerHTML = Object.entries(data.pollutants).map(([key, value]) => {
    const width = Math.min(100, Math.round((value / maxValues[key]) * 100));
    return `
      <div class="pollutant-row">
        <strong>${key}</strong>
        <div class="bar-track"><span style="width:${width}%"></span></div>
        <small>${value}</small>
      </div>
    `;
  }).join("");
}

function estimateUVIndex(data) {
  const hour = new Date().getHours();
  if (hour < 6 || hour > 18) return 0;
  const daylightFactor = hour >= 10 && hour <= 15 ? 1 : 0.58;
  const conditionFactor = data.condition === "sunny" ? 1 : data.condition === "cloudy" ? 0.64 : data.condition === "foggy" ? 0.42 : data.condition === "snowy" ? 0.34 : data.condition === "rainy" ? 0.32 : data.condition === "stormy" ? 0.22 : 0.56;
  const heatBoost = data.temp >= 36 ? 1 : data.temp >= 32 ? 0.5 : 0;
  return Math.max(0, Math.min(11, Math.round((7 * daylightFactor * conditionFactor) + heatBoost)));
}

function getActivityGuidance(data, risk, activity) {
  const rainChance = getDailyForecast(data)[state.selectedWeatherDay || 0]?.precipitation || 0;
  const hot = data.temp >= 35;
  const poorAir = data.aqi > 120 || risk.score >= 65;
  const veryPoor = data.aqi > 180 || risk.score >= 78;
  const rainy = data.condition === "rainy" || data.condition === "stormy" || rainChance >= 55;
  if (veryPoor) return { status: "Avoid", tone: "danger", note: "Air risk is high" };
  if (activity === "running" && (poorAir || hot || rainy)) return { status: "Limited", tone: "warning", note: poorAir ? "Prefer indoor cardio" : hot ? "Avoid peak heat" : "Rain risk" };
  if (activity === "cycling" && (data.aqi > 150 || data.wind >= 30 || rainy)) return { status: "Limited", tone: "warning", note: data.wind >= 30 ? "Windy route" : rainy ? "Wet roads" : "Use low-traffic route" };
  return { status: "Good", tone: "good", note: activity === "running" ? "Short easy run okay" : "Low-traffic ride okay" };
}

function getWindowGuidance(data) {
  if (data.aqi > 150) return { status: "Keep closed", tone: "danger", note: "Use clean indoor air" };
  if (data.aqi > 100 || data.wind < 7) return { status: "Short only", tone: "warning", note: "Ventilate briefly" };
  return { status: "Open okay", tone: "good", note: "Monitor dust nearby" };
}

function renderDashboardInsights(data, risk) {
  const target = $("#dashboardInsightCarousel");
  if (!target) return;
  const uv = estimateUVIndex(data);
  const selectedDay = getDailyForecast(data)[state.selectedWeatherDay || 0] || {};
  const running = getActivityGuidance(data, risk, "running");
  const cycling = getActivityGuidance(data, risk, "cycling");
  const windowGuide = getWindowGuidance(data);
  const maskStatus = data.aqi > 100 || risk.score >= 60 ? { status: "Recommended", tone: "warning", note: "Use in traffic/dust" } : { status: "Optional", tone: "good", note: "Carry if sensitive" };
  const hydration = data.temp >= 35 || data.humidity >= 70 ? { status: "High", tone: "warning", note: "Take frequent breaks" } : { status: "Normal", tone: "good", note: "Keep steady intake" };
  const cards = [
    { icon: "🌡️", label: "Temperature", value: `${data.temp}°C`, note: data.temp >= 35 ? "Heat caution" : "Comfort check", tone: data.temp >= 35 ? "warning" : "good" },
    { icon: "💧", label: "Humidity", value: `${data.humidity}%`, note: data.humidity >= 70 ? "Heavy air feel" : "Manageable", tone: data.humidity >= 70 ? "warning" : "good" },
    { icon: "🌫️", label: "AQI", value: `${data.aqi}`, note: simplifyAirLabel(data.aqi), tone: data.aqi > 150 ? "danger" : data.aqi > 100 ? "warning" : "good" },
    { icon: "☀️", label: "UV", value: `${uv}/11`, note: uv >= 8 ? "Use shade" : uv >= 5 ? "Sun care" : "Low-moderate", tone: uv >= 8 ? "danger" : uv >= 5 ? "warning" : "good" },
    { icon: "🏃", label: "Running", value: running.status, note: running.note, tone: running.tone },
    { icon: "🚴", label: "Cycling", value: cycling.status, note: cycling.note, tone: cycling.tone },
    { icon: "🪟", label: "Windows", value: windowGuide.status, note: windowGuide.note, tone: windowGuide.tone },
    { icon: "😷", label: "Mask", value: maskStatus.status, note: maskStatus.note, tone: maskStatus.tone },
    { icon: "🥤", label: "Hydration", value: hydration.status, note: hydration.note, tone: hydration.tone },
    { icon: "🌦️", label: selectedDay.day ? `${selectedDay.day} rain` : "Rain", value: `${selectedDay.precipitation || 0}%`, note: selectedDay.conditionLabel || data.conditionLabel, tone: (selectedDay.precipitation || 0) >= 60 ? "warning" : "good" }
  ];
  target.innerHTML = cards.map(card => `
    <article class="insight-slide-card ${card.tone}">
      <span>${card.icon}</span>
      <small>${card.label}</small>
      <strong>${card.value}</strong>
      <em>${card.note}</em>
    </article>
  `).join("");
  startDashboardInsightAutoScroll();
}

function startDashboardInsightAutoScroll() {
  const target = $("#dashboardInsightCarousel");
  if (!target) return;
  if (dashboardInsightTimer) clearInterval(dashboardInsightTimer);
  dashboardInsightTimer = setInterval(() => {
    if (document.hidden || state.currentPage !== "dashboard") return;
    const next = target.scrollLeft + 154;
    if (next >= target.scrollWidth - target.clientWidth - 8) {
      target.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      target.scrollTo({ left: next, behavior: "smooth" });
    }
  }, 2800);
}

function isSnowCondition(condition) {
  return condition === "snowy" || condition === "blizzard";
}

function renderSnowTravelSafety(data) {
  const dailyForecast = getDailyForecast(data);
  const selectedIndex = Math.min(Math.max(state.selectedWeatherDay || 0, 0), dailyForecast.length - 1);
  const selected = dailyForecast[selectedIndex] || dailyForecast[0] || {};
  const snowActive = isSnowCondition(data.condition) || isSnowCondition(selected.condition);
  const card = $("#snowTravelSafetyCard");
  if (!card) return;
  card.hidden = !snowActive;
  if (!snowActive) return;
  const blizzard = data.condition === "blizzard" || selected.condition === "blizzard";
  const wind = selected.wind || data.wind;
  const temp = selected.high ?? data.temp;
  $("#snowTravelTitle").textContent = blizzard ? "Blizzard travel caution" : "Snow travel safety";
  $("#snowTravelText").textContent = blizzard
    ? `Strong snow and wind may reduce visibility. Avoid two-wheel travel and unnecessary outdoor movement. Wind ${wind} km/h, temperature near ${temp}°C.`
    : `Snow conditions need warm clothing, careful walking, and route checks. Avoid slippery shortcuts and keep travel slow.`;
  const tips = [
    blizzard ? "Avoid cycling/two-wheel travel" : "Walk slowly on slippery paths",
    "Wear layered warm clothing",
    "Keep shoes dry with good grip",
    "Check roads before leaving"
  ];
  $("#snowTravelTips").innerHTML = tips.map(tip => `<span>${tip}</span>`).join("");
}

function renderSafetyPlan(advice, data, risk) {
  $("#safetyPlanTitle").textContent = state.easyMode ? "Simple safety steps" : "Protect your lungs today";
  $("#safetyPlanList").innerHTML = advice.slice(0, 4).map(item => `<li>${item}</li>`).join("");
  const remedies = buildAyushRemedies(data, risk).slice(0, 4);
  if ($("#dashboardAyushRemedies")) {
    $("#dashboardAyushRemedies").innerHTML = remedies.map(item => `<span>${item}</span>`).join("");
  }
  updateNotificationUI();
  renderSnowTravelSafety(data);
}

function renderAQIDetails(data) {
  $("#aqiDetailCards").innerHTML = Object.entries(data.pollutants).map(([key, value]) => `
    <article class="card detail-card ${key === data.mainPollutant ? "main-pollutant" : ""}">
      <span class="eyebrow">${key}</span>
      <h3>${pollutantInfo[key]}</h3>
      <div class="detail-value">${value}</div>
    </article>
  `).join("");
}

function renderWeather(data) {
  const feelsLike = calculateFeelsLike(data.temp, data.humidity);
  $("#weatherTemp").textContent = `${data.temp}°C`;
  if ($("#weatherTempFeelsLike")) $("#weatherTempFeelsLike").textContent = `Feels like ${feelsLike}°C`;
  $("#weatherHumidity").textContent = `${data.humidity}%`;
  $("#weatherWind").textContent = `${data.wind} km/h`;
  $("#weatherCondition").textContent = data.conditionLabel;
  $("#weatherAnimationText").textContent = `${capitalize(data.condition)} screen animation ${state.animation ? "active" : "off"}.`;
}

function renderHealth(data, risk, advice) {
  $("#healthRiskHeading").textContent = `${risk.level} Risk`;
  $("#healthRiskScore").textContent = `${risk.score}/100`;
  $("#healthRiskFill").style.width = `${risk.score}%`;
  $("#healthRiskReason").textContent = risk.reasons.join(" ");
  $("#healthAdviceList").innerHTML = advice.map(item => `<li>${item}</li>`).join("");
}

function renderAlerts(data, risk) {
  const alerts = [];
  if (data.aqi > 150) alerts.push({ title: "Unhealthy air warning", text: `AQI is ${data.aqi}. Avoid heavy outdoor activity and prefer indoor spaces.` });
  else if (data.aqi > 100) alerts.push({ title: "Sensitive user warning", text: `AQI is ${data.aqi}. Children, seniors, and asthma users should be careful.` });
  else alerts.push({ title: "Air quality is manageable", text: "Outdoor activity is generally okay, but check again before long exposure." });

  if (data.pollutants["PM2.5"] > 60) alerts.push({ title: "PM2.5 is elevated", text: "Fine particles can enter deep into the lungs. Use mask protection if needed." });
  if (data.humidity > 70) alerts.push({ title: "Humidity discomfort", text: "High humidity may increase breathing discomfort. Stay hydrated." });
  if (risk.score > 80) alerts.push({ title: "Critical personal risk", text: "Your profile and current environment suggest high caution today." });

  $("#alertsList").innerHTML = alerts.map(alert => `
    <article class="alert-item">
      <strong>${alert.title}</strong>
      <p>${alert.text}</p>
    </article>
  `).join("");
}


function renderSafetyModule() {
  const data = currentData();
  const label = getLocationLabel();
  const hasCoords = Number.isFinite(data.lat) && Number.isFinite(data.lon);
  const cityQuery = encodeURIComponent(label);
  const hospitalUrl = hasCoords
    ? `https://www.google.com/maps/search/hospitals/@${data.lat},${data.lon},14z`
    : `https://www.google.com/maps/search/hospitals+near+${cityQuery}`;
  const pharmacyUrl = hasCoords
    ? `https://www.google.com/maps/search/pharmacy/@${data.lat},${data.lon},14z`
    : `https://www.google.com/maps/search/pharmacy+near+${cityQuery}`;
  if ($("#safetyCityChip")) $("#safetyCityChip").textContent = label;
  if ($("#hospitalSearchLink")) $("#hospitalSearchLink").href = hospitalUrl;
  if ($("#pharmacySearchLink")) $("#pharmacySearchLink").href = pharmacyUrl;
  if ($("#hospitalCards")) {
    const cards = [
      { name: "Emergency hospital search", detail: hasCoords ? "Opens live map results around your detected location." : "Opens live map results near your selected city." },
      { name: "Pharmacy support", detail: "Useful for masks, basic medicine, inhaler refills, and health essentials." },
      { name: "AQI movement caution", detail: data.aqi > 150 ? "Avoid walking long distances; prefer vehicle travel with windows closed." : "Outdoor movement is more manageable, but keep checking AQI." }
    ];
    $("#hospitalCards").innerHTML = cards.map(card => `<div class="hospital-card"><strong>${card.name}</strong><small>${card.detail}</small></div>`).join("");
  }
  if ($("#routeAdvice")) {
    $("#routeAdvice").textContent = data.aqi > 150
      ? `AQI is ${data.aqi}. Prefer shortest low-exposure travel, avoid roadside walking, and wear a mask.`
      : `AQI is ${data.aqi}. You can plan a normal route, but avoid dusty roads and heavy traffic.`;
  }
}

function openSaferRoute() {
  const data = currentData();
  const hasCoords = Number.isFinite(data.lat) && Number.isFinite(data.lon);
  const start = $("#routeStart").value.trim() || (state.city === "Current Location" && hasCoords ? `${data.lat},${data.lon}` : getLocationLabel());
  const destination = $("#routeDestination").value.trim() || `hospital near ${getLocationLabel()}`;
  const url = `https://www.google.com/maps/dir/${encodeURIComponent(start)}/${encodeURIComponent(destination)}/`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function hideSplash() {
  const splash = $("#splashScreen");
  if (!splash) return;
  setTimeout(() => splash.classList.add("hide"), 850);
  setTimeout(() => splash.remove(), 1500);
}

function renderForecast(data) {
  const series = data.forecast;
  const width = 700;
  const left = 36;
  const right = width - 32;
  const top = 34;
  const bottom = 184;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const avg = Math.round(series.reduce((sum, value) => sum + value, 0) / series.length);
  const delta = series[series.length - 1] - series[0];
  const trendText = delta > 8 ? "Rising" : delta < -8 ? "Improving" : "Stable";
  const peakStatus = simplifyAirLabel(max);
  const chartMin = Math.max(0, Math.floor((min - 20) / 10) * 10);
  const chartMax = Math.ceil((max + 20) / 10) * 10;
  const range = Math.max(1, chartMax - chartMin);
  const slot = (right - left) / series.length;
  const barWidth = Math.min(72, slot * 0.56);
  const bars = series.map((value, idx) => {
    const barHeight = Math.max(12, ((value - chartMin) / range) * (bottom - top));
    const x = left + idx * slot + (slot - barWidth) / 2;
    const y = bottom - barHeight;
    return { x, y, width: barWidth, height: barHeight, value, label: `+${idx + 1}h` };
  });
  const gridValues = Array.from({ length: 4 }, (_, idx) => Math.round(chartMax - (range * idx) / 3));
  const gridSpacing = (bottom - top) / 3;

  if ($("#forecastTrendChip")) $("#forecastTrendChip").textContent = `${trendText} • Peak ${max}`;
  if ($("#forecastSummaryText")) {
    $("#forecastSummaryText").textContent = delta > 8
      ? "AQI may rise over the next few hours. Keep outdoor exposure short and monitor alerts."
      : delta < -8
        ? "AQI appears to improve in the short term, but sensitive users should still be careful."
        : "AQI is expected to stay mostly stable. Use the current risk level for planning.";
  }
  if ($("#forecastInsightCards")) {
    $("#forecastInsightCards").innerHTML = [
      { label: "Average", value: avg, note: "next 5h" },
      { label: "Peak", value: max, note: peakStatus },
      { label: "Trend", value: trendText, note: delta >= 0 ? `+${delta}` : `${delta}` },
      { label: "Lowest", value: min, note: "best window" }
    ].map(item => `<article><span>${item.label}</span><strong>${item.value}</strong><small>${item.note}</small></article>`).join("");
  }

  $("#forecastGrid").innerHTML = gridValues.map((value, idx) => {
    const y = top + idx * gridSpacing;
    return `<g class="forecast-grid-row"><line x1="${left}" y1="${y}" x2="${right}" y2="${y}"></line><text x="${left}" y="${y - 8}">${value}</text></g>`;
  }).join("");
  $("#forecastLinePath").setAttribute("d", "");
  $("#forecastAreaPath").setAttribute("d", "");
  $("#forecastPointGroup").innerHTML = bars.map((bar, idx) => `
    <g class="forecast-bar-group ${bar.value === max ? "peak" : ""}">
      <rect class="forecast-bar-bg" x="${bar.x}" y="${top}" width="${bar.width}" height="${bottom - top}" rx="16"></rect>
      <rect class="forecast-bar" x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" rx="16"></rect>
      <text class="forecast-point-value" x="${bar.x + bar.width / 2}" y="${bar.y - 12}" text-anchor="middle">${bar.value}</text>
      <text class="forecast-point-time" x="${bar.x + bar.width / 2}" y="${bottom + 32}" text-anchor="middle">${bar.label}</text>
    </g>
  `).join("");
  $("#forecastLabels").style.display = "none";
  runSafetyNotificationCheck(data);
}

function renderWeatherAnimation(condition) {
  const layer = $("#weatherLayer");
  layer.className = `weather-layer ${state.animation ? condition : "off"}`;
  layer.innerHTML = "";
  if (!state.animation) return;

  if (condition === "stormy") {
    for (let i = 0; i < 20; i += 1) {
      const bolt = document.createElement("span");
      bolt.className = "storm-flash";
      bolt.style.left = `${Math.random() * 100}%`;
      bolt.style.animationDelay = `${Math.random() * 6}s`;
      layer.appendChild(bolt);
    }
    for (let i = 0; i < 24; i += 1) {
      const drop = document.createElement("span");
      drop.className = "rain-drop";
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDelay = `${Math.random() * 2}s`;
      drop.style.animationDuration = `${0.6 + Math.random() * 0.45}s`;
      layer.appendChild(drop);
    }
    return;
  }

  if (condition === "blizzard") {
    for (let i = 0; i < 52; i += 1) {
      const flake = document.createElement("span");
      flake.className = "snow-dot blizzard-flake";
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.animationDuration = `${1.8 + Math.random() * 2.6}s`;
      flake.style.animationDelay = `${Math.random() * 3}s`;
      flake.style.opacity = `${0.6 + Math.random() * 0.4}`;
      layer.appendChild(flake);
    }
    for (let i = 0; i < 22; i += 1) {
      const line = document.createElement("span");
      line.className = "wind-line blizzard-wind";
      line.style.top = `${6 + Math.random() * 88}%`;
      line.style.animationDuration = `${1.7 + Math.random() * 2.8}s`;
      line.style.animationDelay = `${Math.random() * 2}s`;
      layer.appendChild(line);
    }
    return;
  }

  if (condition === "rainy") {
    for (let i = 0; i < 38; i++) {
      const drop = document.createElement("span");
      drop.className = "drop";
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDuration = `${0.7 + Math.random() * 0.8}s`;
      drop.style.animationDelay = `${Math.random() * 2}s`;
      layer.appendChild(drop);
    }
  }

  if (condition === "snowy") {
    for (let i = 0; i < 28; i++) {
      const flake = document.createElement("span");
      flake.className = "snow-dot";
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.animationDuration = `${4.2 + Math.random() * 4.5}s`;
      flake.style.animationDelay = `${Math.random() * 5}s`;
      flake.style.opacity = `${0.45 + Math.random() * 0.55}`;
      layer.appendChild(flake);
    }
  }

  if (condition === "windy") {
    for (let i = 0; i < 18; i++) {
      const line = document.createElement("span");
      line.className = "wind-line";
      line.style.top = `${8 + Math.random() * 84}%`;
      line.style.animationDuration = `${4 + Math.random() * 5}s`;
      line.style.animationDelay = `${Math.random() * 4}s`;
      layer.appendChild(line);
    }
  }

  if (condition === "foggy") {
    for (let i = 0; i < 7; i++) {
      const fog = document.createElement("span");
      fog.className = "fog-band";
      fog.style.top = `${12 + i * 12}%`;
      fog.style.animationDelay = `${i * 0.6}s`;
      layer.appendChild(fog);
    }
  }

  if (condition === "cloudy") {
    for (let i = 0; i < 7; i++) {
      const cloud = document.createElement("span");
      cloud.className = "cloud-dot";
      cloud.style.left = `${-20 - Math.random() * 40}%`;
      cloud.style.top = `${8 + Math.random() * 50}%`;
      cloud.style.animationDuration = `${18 + Math.random() * 16}s`;
      cloud.style.animationDelay = `${Math.random() * 9}s`;
      layer.appendChild(cloud);
    }
  }
}

function setPage(pageId) {
  state.currentPage = pageId;
  $$(".page").forEach(page => page.classList.toggle("active-page", page.id === pageId));
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === pageId));
  $$(".bottom-nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === pageId));

  const titles = {
    dashboard: ["Dashboard", "Your air quality and preventive health overview"],
    aqi: ["AQI Details", "Pollutant-level intelligence in simple language"],
    weather: ["Weather", "Forecast-first weather view with AQI and health context"],
    health: ["Health Advice", "Personalized preventive guidance"],
    daily: ["Daily Plan", "Morning-to-night safety routine"],
    report: ["Health Report", "Risk report card and action summary"],
    ayush: ["AYUSH Care", "Preventive wellness routine based on AQI and weather"],
    exposure: ["Exposure Tracker", "Daily exposure log and tomorrow guidance"],
    alerts: ["Alerts", "Early warning cards for your city and profile"],
    safety: ["Hospitals & Routes", "Emergency search and AQI-aware movement support"],
    assistant: ["AI Assistant", "Ask VAYU about AQI, health, and safety"],
    auth: ["Login / Sign Up", "Access your VAYU account"],
    profile: ["Profile", "Personalize your health risk calculation"],
    settings: ["Settings", "Control accessibility, themes, and animations"],
    about: ["About VAYU", "V3 platform summary and production scope"]
  };

  $("#pageTitle").textContent = titles[pageId]?.[0] || "VAYU";
  $("#pageSubtitle").textContent = titles[pageId]?.[1] || "Climate Health AI";
  $("#sidebar").classList.remove("open");
}


function normalizeChatInput(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[?.,!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text, words = []) {
  return words.some(word => text.includes(word));
}

function scoreIntent(text, words = []) {
  return words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
}

function inferChatIntent(text) {
  const intents = {
    emergency: ["chest pain", "severe", "can't breathe", "cannot breathe", "breathless", "blue lips", "faint", "emergency", "hospital"],
    symptoms: ["cough", "khansi", "breath", "breathing", "wheez", "chest", "dizzy", "throat", "irritation", "symptom", "asthma"],
    outdoor: ["outside", "go out", "bahar", "walk", "run", "running", "cycling", "cycle", "bike", "office", "college", "school", "travel", "commute", "morning walk", "evening walk"],
    rain: ["rain", "barish", "baarish", "storm", "umbrella", "thunder", "snow", "snowing", "snowfall", "snowy", "barf", "blizzard", "weather today", "aaj ka weather"],
    mask: ["mask", "n95", "wear", "cover face", "traffic", "dust"],
    remedy: ["remedy", "remedies", "ayurveda", "ayurvedic", "ayush", "home remedy", "kadha", "tulsi", "ginger", "haldi", "steam", "pranayama", "yoga", "breathing exercise"],
    monitor: ["monitor", "track", "progress", "done", "complete", "completed", "skip", "pending", "status"],
    aqi: ["aqi", "air quality", "pollution", "pm2", "pm 2", "pm10", "pollutant", "hawa", "air"],
    risk: ["risk", "safe", "unsafe", "health", "why", "reason", "problem", "danger"],
    plan: ["plan", "routine", "daily", "today", "kal", "tomorrow", "schedule", "what should i do"],
    exposure: ["exposure", "tracker", "history", "log", "outdoor duration", "discomfort"],
    alerts: ["notification", "alert", "notify", "warning", "alarm"],
    location: ["location", "city", "search city", "change city", "near me"],
    help: ["help", "what can you do", "commands", "how to use"]
  };
  return Object.fromEntries(Object.entries(intents).map(([name, words]) => [name, scoreIntent(text, words)]));
}

function makeActivityAdvice(activity, data, risk, ctx, plan) {
  const selected = ctx.selected || {};
  const rainChance = selected.precipitation || 0;
  const wind = selected.wind || data.wind;
  if (risk.score >= 76 || data.aqi > 200) {
    return `${activity} is not recommended right now. AQI is ${data.aqi} (${ctx.air}) and health risk is ${risk.level}. Prefer indoor movement, keep windows controlled, and complete the high-priority remedy monitor item.`;
  }
  if (data.aqi > 150) {
    return `Keep ${activity} very limited. AQI is ${data.aqi}, so avoid intense exertion and traffic roads. ${plan.bestTime}. ${plan.maskAdvice}. Rain chance is ${rainChance}%, wind ${wind} km/h.`;
  }
  if (rainChance >= 60) {
    return `${activity} is weather-limited because rain chance is ${rainChance}%. Choose a dry window, carry an umbrella, and avoid waterlogged roads. AQI is ${data.aqi}.`;
  }
  return `${activity} looks manageable with normal caution. AQI is ${data.aqi} (${ctx.air}), rain chance ${rainChance}%, wind ${wind} km/h. ${plan.bestTime}.`;
}

function botReply(message) {
  const data = currentData();
  const risk = calculateRisk(data);
  const advice = getSafetyAdvice(data, risk);
  const care = buildAyushCare(data, risk);
  const ctx = buildChatContext(data, risk, care);
  const text = normalizeChatInput(message);
  const intents = inferChatIntent(text);
  const profileName = state.profile.name ? `${state.profile.name}, ` : "";
  const exposureLog = getTodayExposureLog();
  const exposureScore = scoreExposureLog(exposureLog, data);
  const exposureLevel = getExposureLevel(exposureScore);
  const plan = buildDailyPlan(data, risk, advice);
  const nextRemedy = ctx.remedies.find(item => item.status === "pending") || ctx.remedies[0];
  const selected = ctx.selected || {};

  if (!text) return "Ask me about AQI, weather, going outside, mask, remedies, exposure, or alerts.";

  if (intents.help) {
    return `I understand natural questions like: “Can I go running?”, “Baarish hogi?”, “Should I wear mask?”, “What remedy is pending?”, “Why is my risk high?”, “Is cycling safe?”, “Show exposure status”, or “Enable alerts”. I answer using live AQI, weather, profile, forecast day, exposure log, and remedy monitor.`;
  }

  if (intents.emergency >= 1) {
    return `${profileName}this may need urgent attention. VAYU is not a doctor. If there is severe breathlessness, chest pain, fainting, blue lips, or worsening symptoms, seek medical help immediately. Move to clean indoor air, avoid exertion, and keep prescribed support accessible.`;
  }

  if (intents.symptoms >= 1) {
    const trigger = data.aqi > 150 ? "AQI is unhealthy, so pollution may worsen irritation for sensitive users." : "AQI is not in the severe range, but dust, humidity, or personal sensitivity can still cause discomfort.";
    return `${profileName}${trigger} Current AQI: ${data.aqi}, PM2.5: ${data.pollutants["PM2.5"]}. Preventive steps: stay indoors for now, avoid traffic/dust, hydrate, use your prescribed support if any, and seek medical advice if symptoms persist or worsen.`;
  }

  if (intents.location) {
    return `Location search now has two layers: a built-in city list for fast suggestions, plus live online city search when you type and press Enter. It does not store every city offline, but with internet it can find many Indian and global cities through geocoding.`;
  }

  if (intents.alerts) {
    if (!canUseNotifications()) return "This browser does not support device notifications, but in-app alerts still work.";
    if (Notification.permission === "granted" && state.notificationsEnabled) return `Device alerts are active. I will warn while VAYU is open for unhealthy AQI, storm, snow, rain, heat, and strong wind. Current AQI is ${data.aqi}.`;
    return "Open Dashboard and tap Enable Alerts. The browser will ask permission once, then VAYU can send safety notifications while the app is open.";
  }

  if (intents.monitor || (intents.remedy && hasAny(text, ["progress", "done", "pending", "status", "track"]))) {
    return `${profileName}Remedy monitoring status: ${summarizeRemedyMonitor(ctx.remedies)} Progress today: ${ctx.remedyProgress}%. Next action: ${nextRemedy.title} — ${nextRemedy.text}`;
  }

  if (intents.rain) {
    const chance = selected.precipitation || 0;
    const condition = selected.conditionLabel || data.conditionLabel;
    if (selected.condition === "blizzard") return `${profileName}blizzard risk is expected for the selected forecast day. Condition ${condition}, wind ${selected.wind || data.wind} km/h. Avoid two-wheel travel, reduce unnecessary outdoor movement, and keep alerts enabled.`;
    if (selected.condition === "snowy") return `${profileName}snow conditions are expected for the selected forecast day. Condition ${condition}, wind ${selected.wind || data.wind} km/h. Dress warm, use careful footing, and avoid two-wheel travel on slippery routes.`;
    if (selected.condition === "stormy") return `${profileName}storm risk is present for the selected forecast day. Rain chance ${chance}%, wind ${selected.wind || data.wind} km/h. Avoid cycling/running during storm windows and keep device alerts enabled.`;
    if (chance >= 60) return `${profileName}rain is likely. Chance ${chance}%, condition ${condition}. Carry an umbrella/raincoat and avoid waterlogged or dusty roadside routes.`;
    if (chance >= 30) return `${profileName}light or scattered rain is possible. Chance ${chance}%. Carry a compact umbrella if travelling far; outdoor exercise depends more on AQI (${data.aqi}) and wind (${data.wind} km/h).`;
    return `${profileName}rain or snow risk looks low right now. Chance ${chance}%, condition ${condition}. Keep checking if clouds build up.`;
  }

  if (hasAny(text, ["running", "run", "morning walk", "evening walk", "walk"])) {
    return `${profileName}${makeActivityAdvice("running/walking", data, risk, ctx, plan)}`;
  }

  if (hasAny(text, ["cycling", "cycle", "bike", "biking"])) {
    return `${profileName}${makeActivityAdvice("cycling", data, risk, ctx, plan)} Avoid traffic corridors when PM2.5 is high.`;
  }

  if (intents.outdoor) {
    return `${profileName}${makeActivityAdvice("outdoor activity", data, risk, ctx, plan)} ${nextRemedy ? `Remedy focus: ${nextRemedy.title}.` : ""}`;
  }

  if (intents.mask) {
    const sensitive = (state.profile.condition && state.profile.condition !== "None") || state.profile.sensitivity === "Highly Sensitive";
    if (data.aqi > 150 || sensitive) return `Yes. Wear a well-fitted mask for outdoor travel, traffic, dust, and crowded places. AQI is ${data.aqi}, main pollutant is ${data.mainPollutant}. Keep exposure short.`;
    if (data.aqi > 100) return `Mask is recommended for traffic/dust or long outdoor travel. AQI is ${data.aqi}.`;
    return `Mask is optional for most users right now, but still useful in dust, traffic, construction areas, or crowded places.`;
  }

  if (intents.remedy) {
    const pending = ctx.remedies.filter(item => item.status === "pending").slice(0, 3);
    const remedyText = pending.map((item, idx) => `${idx + 1}. ${item.title}: ${item.text}`).join(" ");
    return `${profileName}today’s AYUSH preventive plan: ${remedyText || "all remedies completed"} Progress: ${ctx.remedyProgress}%. Note: these are wellness actions, not medical treatment; avoid anything that conflicts with doctor advice.`;
  }

  if (intents.aqi) {
    return `${profileName}AQI is ${data.aqi} (${ctx.air}). Main pollutant: ${data.mainPollutant}. PM2.5: ${data.pollutants["PM2.5"]}, PM10: ${data.pollutants.PM10}. Main action: ${advice[0]} ${data.aqi > 100 ? "Reduce outdoor exertion and avoid traffic/dust." : "Normal activity is mostly manageable with awareness."}`;
  }

  if (intents.risk) {
    return `${profileName}health risk is ${risk.level} (${risk.score}/100). Why: ${risk.reasons.slice(0, 4).join(" ")} Best action: ${advice[0]} Remedy focus: ${summarizeRemedyMonitor(ctx.remedies)}`;
  }

  if (intents.plan) {
    const exposureLine = exposureLog ? ` Today’s exposure is ${exposureLevel} (${exposureScore}/100).` : " Log today’s exposure for smarter planning.";
    return `${profileName}${plan.summary}. ${plan.bestTime}. ${plan.maskAdvice}. ${plan.windowAdvice}. AYUSH focus: ${nextRemedy.title}. ${exposureLine}`;
  }

  if (intents.exposure) {
    const suggestions = buildExposureSuggestions(exposureLog, data, risk);
    if (!exposureLog) return `${profileName}you have not logged exposure today. Open Exposure Tracker and record outdoor duration, mask use, travel, exercise, dust/smoke, and discomfort. Remedy progress: ${ctx.remedyProgress}%.`;
    return `${profileName}today’s exposure score is ${exposureScore}/100 (${exposureLevel}). ${suggestions.slice(0, 2).join(" ")} Remedy progress: ${ctx.remedyProgress}%.`;
  }

  if (hasAny(text, ["weather", "temperature", "temp", "humidity", "wind", "heat", "cold"])) {
    const feelsLike = calculateFeelsLike(data.temp, data.humidity);
    return `${ctx.location} weather: ${data.temp}°C, feels like ${feelsLike}°C, humidity ${data.humidity}%, wind ${data.wind} km/h, condition ${data.conditionLabel}. Outdoor note: ${makeActivityAdvice("outdoor activity", data, risk, ctx, plan)}`;
  }

  return `${profileName}I understood this as a general safety question. Current ${ctx.location}: AQI ${data.aqi} (${ctx.air}), weather ${data.temp}°C / ${data.conditionLabel}, health risk ${risk.level}. Best action: ${advice[0]} Next remedy: ${nextRemedy.title} — ${nextRemedy.text}`;
}

function addMessage(container, role, text) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function seedChats() {
  const greeting = "Namaste, I am VAYU AI. Ask naturally: Can I go running? Baarish hogi? Snow hoga? Should I wear mask? What remedy is pending? I use AQI, weather, profile, exposure, and remedy monitor.";
  if (!$("#chatMessages").children.length) addMessage($("#chatMessages"), "bot", greeting);
  if (!$("#assistantPageMessages").children.length) addMessage($("#assistantPageMessages"), "bot", greeting);
}

function handleChatSubmit(event, inputSelector, containerSelector) {
  event.preventDefault();
  const input = $(inputSelector);
  const value = input.value.trim();
  if (!value) return;
  const container = $(containerSelector);
  addMessage(container, "user", value);
  input.value = "";
  setTimeout(() => addMessage(container, "bot", botReply(value)), 220);
}

function renderProfilePreview() {
  const profile = state.profile || {};
  const data = currentData();
  const risk = calculateRisk(data);
  const name = profile.name?.trim() || "Guest User";
  if ($("#profilePreviewName")) $("#profilePreviewName").textContent = name;
  if ($("#profilePreviewText")) $("#profilePreviewText").textContent = profile.savedAt
    ? `Current personal risk: ${risk.level} (${risk.score}/100). VAYU uses your profile for preventive advice.`
    : "Save your profile to unlock more personal AQI and weather safety guidance.";
  if ($("#profilePreviewAge")) $("#profilePreviewAge").textContent = profile.age || "Adult";
  if ($("#profilePreviewCondition")) $("#profilePreviewCondition").textContent = profile.condition && profile.condition !== "None" ? profile.condition : "No condition";
  if ($("#profilePreviewActivity")) $("#profilePreviewActivity").textContent = `${profile.activity || "Medium"} activity`;
  const chipBox = $(".profile-brand-chips");
  if (chipBox) {
    chipBox.innerHTML = [
      profile.age || "Adult",
      profile.condition && profile.condition !== "None" ? profile.condition : "No condition",
      `${profile.activity || "Medium"} activity`,
      profile.routine || "Routine not set",
      `${profile.sensitivity || "Normal"} sensitivity`,
      profile.language || "English"
    ].map(item => `<span>${item}</span>`).join("");
  }
}

function updateProfileSaveUI(saved = false) {
  const button = $("#profileSubmitButton");
  const note = $("#profileSaveNote");
  if (button) button.textContent = saved ? "Update Profile" : "Save Profile";
  if (note) {
    note.textContent = saved
      ? `Profile saved${state.profile.savedAt ? ` • ${new Date(state.profile.savedAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}`
      : "Your profile is stored only in this browser for personalized preventive guidance.";
  }
}

function loadProfileForm() {
  $("#profileName").value = state.profile.name || "";
  $("#profileAge").value = state.profile.age || "Adult";
  $("#profileCondition").value = state.profile.condition || "None";
  $("#profileActivity").value = state.profile.activity || "Medium";
  if ($("#profileRoutine")) $("#profileRoutine").value = state.profile.routine || "Student";
  if ($("#profileExposure")) $("#profileExposure").value = state.profile.exposure || "Medium";
  if ($("#profileDuration")) $("#profileDuration").value = state.profile.duration || "30–60 min";
  if ($("#profileMask")) $("#profileMask").value = state.profile.mask || "Sometimes";
  if ($("#profilePurifier")) $("#profilePurifier").value = state.profile.purifier || "No";
  if ($("#profileSensitivity")) $("#profileSensitivity").value = state.profile.sensitivity || "Normal";
  if ($("#profileLanguage")) $("#profileLanguage").value = state.profile.language || "English";
  const hasSavedProfile = Boolean(state.profile.name || state.profile.condition || state.profile.activity || state.profile.savedAt);
  updateProfileSaveUI(hasSavedProfile);
  renderProfilePreview();
}

async function saveProfile(event) {
  event.preventDefault();
  state.profile = {
    name: $("#profileName").value.trim(),
    age: $("#profileAge").value,
    condition: $("#profileCondition").value,
    activity: $("#profileActivity").value,
    routine: $("#profileRoutine")?.value || "Student",
    exposure: $("#profileExposure")?.value || "Medium",
    duration: $("#profileDuration")?.value || "30–60 min",
    mask: $("#profileMask")?.value || "Sometimes",
    purifier: $("#profilePurifier")?.value || "No",
    sensitivity: $("#profileSensitivity")?.value || "Normal",
    language: $("#profileLanguage")?.value || "English",
    savedAt: new Date().toISOString()
  };
  writeJsonStorage("vayu-profile", state.profile);
  if (getAuthToken()) {
    try {
      const payload = await apiRequest("/profile", { method: "PUT", body: JSON.stringify(state.profile) });
      if (payload.profile) {
        state.profile = payload.profile;
        writeJsonStorage("vayu-profile", state.profile);
      }
    } catch (error) {
      console.warn("Profile backend sync failed", error);
    }
  }
  updateProfileSaveUI(true);
  renderProfilePreview();
  renderDashboard();
  addMessage($("#chatMessages"), "bot", "Profile saved. I will use it for preventive risk guidance.");
}


function updateAuthUI() {
  const user = state.authUser;
  const navText = $("#authNavText");
  if (navText) navText.textContent = user ? "Account" : "Login / Sign Up";

  const title = $("#authStatusTitle");
  const text = $("#authStatusText");
  const logoutButton = $("#logoutButton");
  if (!title || !text || !logoutButton) return;

  if (user) {
    title.textContent = `Logged in as ${user.name || user.email}`;
    text.textContent = `${user.email} • Profile and exposure history sync with the VAYU backend when it is running.`;
    logoutButton.style.display = "inline-flex";
  } else {
    title.textContent = "You are not logged in";
    text.textContent = "Login or sign up to personalize VAYU guidance.";
    logoutButton.style.display = "none";
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const name = $("#signupName").value.trim();
  const email = $("#signupEmail").value.trim();
  const password = $("#signupPassword").value;

  if (!name || !email || !password) return;

  try {
    const payload = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    setAuthSession(payload);
    $("#signupForm").reset();
    updateAuthUI();
    loadProfileForm();
    renderDashboard();
    addMessage($("#chatMessages"), "bot", `Account created for ${name}. Your profile and exposure history can now sync with the backend.`);
  } catch (error) {
    state.authUser = { name, email, offline: true };
    writeJsonStorage("vayu-auth-user", state.authUser);
    $("#signupForm").reset();
    updateAuthUI();
    addMessage($("#chatMessages"), "bot", `Backend is not reachable, so ${name} was saved in offline browser mode. Start the backend to sync data.`);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;

  if (!email || !password) return;

  try {
    const payload = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setAuthSession(payload);
    $("#loginForm").reset();
    updateAuthUI();
    loadProfileForm();
    renderDashboard();
    addMessage($("#chatMessages"), "bot", `Logged in as ${email}. Synced profile and exposure history from the backend.`);
  } catch (error) {
    state.authUser = { name: email.split("@")[0], email, offline: true };
    writeJsonStorage("vayu-auth-user", state.authUser);
    $("#loginForm").reset();
    updateAuthUI();
    addMessage($("#chatMessages"), "bot", `Backend login failed, so VAYU opened offline browser mode for ${email}.`);
  }
}

function handleLogout() {
  state.authUser = null;
  localStorage.removeItem("vayu-auth-user");
  localStorage.removeItem(AUTH_TOKEN_KEY);
  updateAuthUI();
  addMessage($("#chatMessages"), "bot", "You are logged out.");
}


async function handleProviderLogin(provider) {
  try {
    const payload = await apiRequest("/auth/provider-demo", {
      method: "POST",
      body: JSON.stringify({ provider })
    });
    setAuthSession(payload);
    updateAuthUI();
    loadProfileForm();
    renderDashboard();
    addMessage($("#chatMessages"), "bot", `${provider} demo login connected through the backend. Replace this with real OAuth before public launch.`);
  } catch (error) {
    state.authUser = {
      name: `${provider} Demo User`,
      email: `${provider.toLowerCase()}-demo@vayu.local`,
      provider,
      offline: true
    };
    writeJsonStorage("vayu-auth-user", state.authUser);
    updateAuthUI();
    addMessage($("#chatMessages"), "bot", `${provider} demo login is running in offline browser mode because backend is not reachable.`);
  }
}


function canUseNotifications() {
  return "Notification" in window;
}

function updateNotificationUI() {
  const card = $("#notificationPermissionCard");
  const button = $("#notificationButton");
  const text = $("#notificationStatusText");
  if (!card || !button || !text) return;
  if (!canUseNotifications()) {
    text.textContent = "This browser does not support device notifications. In-app alerts still work.";
    button.disabled = true;
    button.textContent = "Not supported";
    return;
  }
  const permission = Notification.permission;
  if (permission === "granted" && state.notificationsEnabled) {
    text.textContent = "Device alerts are active for AQI, rain, storm, heat, and wind warnings.";
    button.textContent = "Alerts Enabled";
    button.disabled = true;
  } else if (permission === "denied") {
    text.textContent = "Notifications are blocked in browser settings. Enable them manually to receive device alerts.";
    button.textContent = "Blocked";
    button.disabled = true;
  } else {
    text.textContent = "Enable alerts for sudden AQI, rain, storm, heat, and wind warnings.";
    button.textContent = "Enable Alerts";
    button.disabled = false;
  }
}

async function requestDeviceNotifications() {
  if (!canUseNotifications()) {
    updateNotificationUI();
    return;
  }
  const permission = await Notification.requestPermission();
  state.notificationsEnabled = permission === "granted";
  localStorage.setItem("vayu-notifications-enabled", String(state.notificationsEnabled));
  updateNotificationUI();
  if (state.notificationsEnabled) {
    showDeviceNotification("VAYU alerts enabled", "You will receive AQI, rain, storm, heat, and wind alerts while VAYU is active.");
    runSafetyNotificationCheck(currentData(), true);
  }
}

function showDeviceNotification(title, body) {
  if (!state.notificationsEnabled || !canUseNotifications() || Notification.permission !== "granted") return;
  const options = { body, icon: "assets/vayu-logo.svg", badge: "assets/vayu-logo.svg", tag: "vayu-safety-alert" };
  if (navigator.serviceWorker?.ready) {
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options)).catch(() => new Notification(title, options));
  } else {
    new Notification(title, options);
  }
}

function runSafetyNotificationCheck(data, force = false) {
  if (!state.notificationsEnabled || !canUseNotifications() || Notification.permission !== "granted") return;
  const now = Date.now();
  const last = Number(localStorage.getItem("vayu-last-notification") || 0);
  if (!force && now - last < 90 * 60 * 1000) return;
  const daily = getDailyForecast(data);
  const today = daily[0] || {};
  let title = "VAYU Safety Alert";
  let body = "Check VAYU before outdoor plans.";
  if (data.aqi > 200) {
    title = "Critical AQI warning";
    body = `AQI is ${data.aqi} in ${getLocationLabel()}. Avoid outdoor exposure if possible.`;
  } else if (data.aqi > 150) {
    title = "Unhealthy air warning";
    body = `AQI is ${data.aqi}. Keep outdoor activity short and use protection if travelling.`;
  } else if (today.condition === "blizzard") {
    title = "Blizzard alert";
    body = "Strong snow and wind may reduce visibility. Avoid unnecessary travel and two-wheel movement.";
  } else if (today.condition === "snowy") {
    title = "Snow alert";
    body = "Snow or snow showers are expected. Use winter protection and travel carefully on slippery routes.";
  } else if (today.condition === "stormy") {
    title = "Storm warning";
    body = "Storm conditions are possible. Avoid unnecessary outdoor travel.";
  } else if ((today.precipitation || 0) >= 45 || data.condition === "rainy") {
    title = "Rain alert";
    body = `Rain chance is ${today.precipitation || "high"}%. Carry umbrella and check AQI after rain.`;
  } else if (data.temp >= 38) {
    title = "Heat alert";
    body = `Temperature is ${data.temp}°C. Hydrate and avoid peak heat exposure.`;
  } else if (data.wind >= 28) {
    title = "Wind alert";
    body = `Wind speed is ${data.wind} km/h. Be careful outdoors and watch dust exposure.`;
  } else if (!force) {
    return;
  }
  localStorage.setItem("vayu-last-notification", String(now));
  showDeviceNotification(title, body);
}

function bindEvents() {
  $$(".nav-item").forEach(button => button.addEventListener("click", () => setPage(button.dataset.page)));
  $$(".bottom-nav-item").forEach(button => button.addEventListener("click", () => setPage(button.dataset.page)));
  $$("[data-page-target]").forEach(button => button.addEventListener("click", () => setPage(button.dataset.pageTarget)));
  $$("[data-open-chat]").forEach(button => button.addEventListener("click", openChat));

  $("#menuButton").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#refreshApiButton")?.addEventListener("click", () => loadLiveData(true));
  $("#locationButton")?.addEventListener("click", () => askForLiveLocation(true));
  $("#locationCardButton")?.addEventListener("click", () => askForLiveLocation(true));
  $("#notificationButton")?.addEventListener("click", requestDeviceNotifications);

  const cityInput = $("#citySelect");
  cityInput?.addEventListener("input", (event) => {
    clearTimeout(citySuggestionTimer);
    const value = event.target.value;
    citySuggestionTimer = setTimeout(() => updateCitySuggestionsLive(value), 220);
  });
  cityInput?.addEventListener("change", (event) => handleCitySearch(event.target.value));
  cityInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCitySearch(event.target.value);
      event.target.blur();
    }
  });

  document.addEventListener("click", (event) => {
    const remedyButton = event.target.closest("[data-remedy-status][data-remedy-id]");
    if (!remedyButton) return;
    updateRemedyStatus(remedyButton.dataset.remedyId, remedyButton.dataset.remedyStatus);
  });

  $("#easyModeToggle").addEventListener("click", toggleEasyMode);
  $("#settingsEasyToggle").addEventListener("click", toggleEasyMode);

  $$("[data-weather-metric]").forEach(button => button.addEventListener("click", () => {
    state.weatherMetric = button.dataset.weatherMetric;
    localStorage.setItem("vayu-weather-metric", state.weatherMetric);
    renderDashboard();
  }));

  $("#themeToggle").addEventListener("click", () => {
    const order = ["auto", "light", "dark"];
    state.theme = order[(order.indexOf(state.theme) + 1) % order.length];
    localStorage.setItem("vayu-theme", state.theme);
    applyTheme();
  });

  $$("[data-weather-view]").forEach(button => button.addEventListener("click", () => {
    state.weatherView = button.dataset.weatherView;
    localStorage.setItem("vayu-weather-view", state.weatherView);
    renderDashboard();
  }));

  $$("[data-theme-choice]").forEach(button => button.addEventListener("click", () => {
    state.theme = button.dataset.themeChoice;
    localStorage.setItem("vayu-theme", state.theme);
    applyTheme();
  }));

  $("#animationToggle").addEventListener("click", () => {
    state.animation = !state.animation;
    localStorage.setItem("vayu-animation", String(state.animation));
    $("#animationToggle").textContent = `Animations: ${state.animation ? "On" : "Off"}`;
    renderDashboard();
  });

  $("#floatingChatButton").addEventListener("click", openChat);
  $("#closeChat").addEventListener("click", () => $("#chatWindow").classList.remove("open"));
  $("#chatForm").addEventListener("submit", (event) => handleChatSubmit(event, "#chatInput", "#chatMessages"));
  $("#assistantPageForm").addEventListener("submit", (event) => handleChatSubmit(event, "#assistantPageInput", "#assistantPageMessages"));
  $("#profileForm").addEventListener("submit", saveProfile);
  $("#exposureForm")?.addEventListener("submit", saveExposureLog);
  $("#exposureClearButton")?.addEventListener("click", clearExposureHistory);
  $("#loginForm").addEventListener("submit", handleLogin);
  $("#signupForm").addEventListener("submit", handleSignup);
  $("#logoutButton").addEventListener("click", handleLogout);
  if ($("#googleLoginButton")) $("#googleLoginButton").addEventListener("click", () => handleProviderLogin("Google"));
  if ($("#microsoftLoginButton")) $("#microsoftLoginButton").addEventListener("click", () => handleProviderLogin("Microsoft"));
  $("#openRouteButton").addEventListener("click", openSaferRoute);
}

function toggleEasyMode() {
  state.easyMode = !state.easyMode;
  localStorage.setItem("vayu-easy", String(state.easyMode));
  applyTheme();
  renderDashboard();
}

function openChat() {
  $("#chatWindow").classList.add("open");
  setTimeout(() => $("#chatInput").focus(), 80);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // Service worker may fail from file://, but works on localhost or deployment.
    });
  }
}

function init() {
  restoreSavedLocation();
  renderCitySuggestions();
  if ($("#citySelect")) $("#citySelect").value = state.city;
  $("#animationToggle").textContent = `Animations: ${state.animation ? "On" : "Off"}`;
  applyTheme();
  loadProfileForm();
  updateAuthUI();
  bindEvents();
  updateNotificationUI();
  renderDashboard();
  seedChats();
  hideSplash();
  loadLiveData(false);
  syncServerSession();
  maybeAutoAskLocation();
  registerServiceWorker();
  setInterval(applyTheme, 60 * 1000);
}

init();

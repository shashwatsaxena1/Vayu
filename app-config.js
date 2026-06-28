window.VAYU_CONFIG = {
  appName: "VAYU",
  version: "2.0.0-production-backend",
  apiBase: "http://localhost:5000/api",
  endpoints: {
    weatherProvider: "Open-Meteo",
    airQualityProvider: "Open-Meteo",
    reverseGeocodingProvider: "Open-Meteo"
  },
  privacy: {
    storeLocationLocally: true,
    storeProfileLocally: true,
    storeExposureLocally: true,
    syncProfileWhenLoggedIn: true,
    syncExposureWhenLoggedIn: true
  }
};

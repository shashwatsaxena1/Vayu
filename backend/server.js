const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = "3dde1cfbd7f35b112440f7d7a247a26b";

/* =========================
   ROUTE 1: AQI API
========================= */
app.get("/aqi", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/air_pollution",
      {
        params: { lat, lon, appid: API_KEY }
      }
    );

    const pm25 = response.data.list[0].components.pm2_5;
    const aqi = calculateAQI(pm25);

    res.json({ pm25, aqi });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "AQI fetch failed" });
  }
});

/* =========================
   ROUTE 2: CHATBOT
========================= */
app.get("/chat", (req, res) => {
  const q = req.query.q.toLowerCase();
  let reply = "Stay safe and monitor AQI regularly.";

  if (q.includes("mask")) reply = "Use N95 mask when AQI > 150.";
  if (q.includes("ayush")) reply = "Pranayama & steam inhalation help lungs.";
  if (q.includes("exercise")) reply = "Avoid outdoor exercise in high AQI.";

  res.json({ reply });
});

/* =========================
   AQI CALCULATION FUNCTION
   ⬇️⬇️ PUT IT HERE ⬇️⬇️
========================= */
function calculateAQI(pm25) {
  const breakpoints = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500, 301, 500]
  ];

  for (const [cLow, cHigh, aLow, aHigh] of breakpoints) {
    if (pm25 >= cLow && pm25 <= cHigh) {
      return Math.round(
        ((aHigh - aLow) / (cHigh - cLow)) * (pm25 - cLow) + aLow
      );
    }
  }

  return 500;
}

/* ===============================
   2️⃣ FUTURE AQI (MOCK PREDICTION)
   =============================== */
app.get("/predict", (req, res) => {
  const futureAQI = Math.floor(Math.random() * 5) + 1;
  res.json({ futureAQI });
});

/* ===============================
   3️⃣ AYUSH REMEDIES
   =============================== */
app.get("/ayush", (req, res) => {
  const remedies = [
    "Practice Pranayama daily",
    "Drink warm turmeric milk",
    "Use steam inhalation",
    "Avoid outdoor exercise during high AQI"
  ];
  res.json({ remedies });
});

/* ===============================
   SERVER START
   =============================== */
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});

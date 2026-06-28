# VAYU V3

Production-ready AQI, weather, preventive health, AYUSH, notifications, exposure tracking, and backend sync platform.

## Run frontend

```powershell
cd vayu-v3-production-ready
python -m http.server 5173
```

Open `http://localhost:5173`.

## Run backend

```powershell
cd vayu-v3-production-ready\backend
npm install
copy .env.example .env
npm run dev
```

Backend health check: `http://localhost:5000/api/health`

## V3 improvements

- Professional custom weather icon system
- Correct daily forecast icon logic using weather code, rain probability, rain amount, and wind
- Heavy rain appears only when the forecast actually supports heavy rain
- Clickable daily forecast cards
- Selected day updates dashboard and weather charts
- Professional AQI forecast line chart
- Advanced chatbot and AYUSH/remedy guidance
- Browser notification permission flow
- Node 24 friendly backend with JSON database

See `DEPLOYMENT_V3.md` for deployment.


## V3.3 Update
- Fixed carousel card text overflow.
- Added live city suggestion search with online geocoding fallback.
- Upgraded VAYU AI chatbot intent understanding for AQI, weather, outdoor activity, AYUSH remedies, symptoms, alerts, and location questions.

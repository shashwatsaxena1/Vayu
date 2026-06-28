# VAYU Backend API

This backend adds auth, profile sync, and exposure tracking for VAYU V2.

## Node 24 compatible

This version is adapted for **Node v24.17.0**. It does **not** use any native database package, so `npm install` does not need Visual Studio C++ Build Tools or Windows SDK.

Data is stored locally in:

```text
backend/data/vayu-db.json
```

## What it includes

- Email/password signup and login
- JWT-based protected APIs
- Local JSON database file
- Profile sync
- Exposure history sync
- Demo Google provider login endpoint
- Security middleware, CORS, and rate limiting

## Run locally

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

Then run frontend from the parent folder:

```bash
cd ..
python -m http.server 5173
```

## Production note

The JSON file database is good for local/demo/small testing. For real public launch, replace it with a hosted database such as PostgreSQL, Supabase, Neon, PlanetScale, or MongoDB Atlas, and replace demo Google login with real Google OAuth.

# VAYU Production Guide

## Current production level

This package now includes the frontend PWA and a backend/database layer.

## Local full-stack run

1. Start backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

2. Start frontend from project root:

```bash
python -m http.server 5173
```

3. Open:

```text
http://localhost:5173
```

## What syncs with backend

- User signup/login
- Profile
- Exposure history

## What remains external

- Real Google OAuth client IDs
- Real Microsoft OAuth client IDs
- Production hosted database if not using local JSON database
- HTTPS domain deployment
- Push notification service

## Production deployment suggestion

For a serious public launch:

- Frontend: Vercel/Netlify/Firebase Hosting
- Backend: Render/Railway/Fly.io
- Database: PostgreSQL on Supabase/Neon/Railway
- OAuth: Google Cloud Console + Microsoft Azure App Registration

The included local JSON database backend is good for local testing, demos, and small private deployment. For mass public use, migrate the schema to PostgreSQL.

# VAYU V3 Deployment Guide

## Local development

Terminal 1:
```powershell
cd vayu-v3-production-ready\backend
npm install
copy .env.example .env
npm run dev
```

Terminal 2:
```powershell
cd vayu-v3-production-ready
python -m http.server 5173
```

Open `http://localhost:5173`.

## Frontend deployment
Deploy the root folder to Netlify, Vercel, Firebase Hosting, Cloudflare Pages, or any HTTPS static host.

## Backend deployment
Deploy `backend/` to Render, Railway, Fly.io, or a Node.js VPS. Set these environment variables:

```text
NODE_ENV=production
PORT=5000
FRONTEND_ORIGIN=https://your-domain.com
JWT_SECRET=replace-with-long-random-secret
DB_PATH=./data/vayu-db.json
GOOGLE_CLIENT_ID=your-real-google-client-id-later
```

## Production database note
The included JSON database is Node 24 friendly and works for demos/small pilots. For mass public traffic, replace it with PostgreSQL/Supabase/Neon/MongoDB Atlas and keep the same API contracts.

## Notification note
Browser notifications require HTTPS and user permission. They cannot be enabled silently.

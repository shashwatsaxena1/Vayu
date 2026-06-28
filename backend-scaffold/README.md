# Optional Backend Scaffold Notes

VAYU V2 can run as a static PWA. For real production accounts and cross-device sync, add a backend using Firebase, Supabase, or Node/Express.

Recommended backend modules:
- OAuth login: Google
- User profile table
- Exposure logs table
- Notification preferences
- Push notification tokens
- Audit logs
- Account deletion endpoint

Never store API secrets in frontend code.

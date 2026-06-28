# VAYU Security Notes

## Added backend protections

- Password hashing with bcryptjs
- JWT authentication
- Rate limiting on API routes
- Helmet security middleware
- CORS origin configuration
- Input validation with Zod
- SQLite foreign keys enabled

## Required before public launch

- Set a strong `JWT_SECRET`
- Serve over HTTPS
- Use real OAuth for Google/Microsoft
- Move from SQLite to hosted PostgreSQL for mass usage
- Add database backups
- Add monitoring/logging
- Review privacy policy and medical disclaimer

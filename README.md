# FIABA

Wedding and events studio: API, public website, and logged-in app.

## Folders

- `backend/` — Express + Prisma + SQLite (TypeScript)
- `website/` — public Vue site (TypeScript)
- `frontend/` — Vue app for staff and clients (TypeScript)

## Run locally

In three terminals:

```bash
cd backend && npm install && npm run db:setup && npm run dev
cd website && npm install && npm run dev
cd frontend && npm install && npm run dev
```

- API: http://localhost:3000
- Website: http://localhost:5173
- App: http://localhost:5174

## Demo logins (local only)

Password: `fiaba123`

- `admin@fiaba.local`
- `manager@fiaba.local`
- `accountant@fiaba.local`
- `secretary@fiaba.local`
- `client@fiaba.local`

These users are created by `npm run db:setup`. They are not used in production.

## Production (Hostinger)

See [DEPLOY.md](DEPLOY.md). You need a Hostinger plan with **Node.js web apps**. One process serves the public site at `/`, the portal at `/app`, and the API at `/api`.

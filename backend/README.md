# FIABA backend

Express + Prisma + SQLite API for the FIABA website and frontend app.

## Setup

```bash
npm install
npm run db:setup
npm run dev
```

API: `http://localhost:3000` (TypeScript, run with `tsx`)

Production start: `npm run build && npm start` (compiled `dist/index.js`). Demo seed accounts are local only.

## Demo logins

Password for all seed users: `fiaba123`

- `admin@fiaba.local`
- `manager@fiaba.local`
- `accountant@fiaba.local`
- `secretary@fiaba.local`
- `client@fiaba.local`

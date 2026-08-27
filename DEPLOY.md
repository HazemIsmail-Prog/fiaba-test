# Deploy on Hostinger

This stack is a **Node.js** app (Express + two Vue builds). It will not run on PHP-only shared hosting.

You need a Hostinger plan that supports **Node.js web apps**: Business Web Hosting, or Cloud Startup and above. In hPanel that is **Websites → Add Website → Node.js web app**.

After deploy, one URL serves everything:

- `https://your-domain.com/` — public website
- `https://your-domain.com/app` — staff and client login
- `https://your-domain.com/api` — API
- `https://your-domain.com/uploads` — images

## 1. Build locally (recommended)

Shared hosting often runs out of memory if it builds Vue on the server. Build on your computer, then upload.

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix website
npm run build
```

That compiles the API and copies the website and portal into `backend/public/`.

## 2. Create the Node.js app in hPanel

1. **Websites → Add Website → Node.js web app**
2. Deploy from **GitHub** (whole repo) or **Upload** a zip of this project
3. Use **Node.js 20** or **22**
4. Application type: **express**
5. Build script: `build`
6. **Output directory: leave empty**
7. Entry file: `server.js`

## 3. Environment variables

Set these in hPanel (do not commit a production `.env`).

| Variable | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | Required |
| `PORT` | leave default | Hostinger sets this |
| `JWT_SECRET` | long random string, 32+ chars | Do not use the local demo secret |
| `DATABASE_URL` | `file:../data/fiaba.db` | SQLite file under `backend/data/` |
| `PUBLIC_ORIGIN` | `https://your-domain.com` | Your real https origin, no trailing slash |
| `BOOTSTRAP_ADMIN_EMAIL` | your email | Creates the first admin **only if the database is empty** |
| `BOOTSTRAP_ADMIN_PASSWORD` | 10+ characters | Same as above |
| `BOOTSTRAP_ADMIN_NAME` | `Admin` | Optional |

Generate a secret:

```bash
openssl rand -base64 48
```

Do **not** run `npm run db:seed` on Hostinger. That wipes data and recreates demo users.

## 4. After the first start

Open `https://your-domain.com/api/health` — you should see `{"ok":true}`.

Log in at `https://your-domain.com/app` with the bootstrap admin email and password.

Change that password after login (Users). Create staff and client accounts from the portal. Then you can clear `BOOTSTRAP_ADMIN_PASSWORD` from hPanel; the user already exists.

## 5. Files that must stay writable

SQLite and CMS uploads live on disk:

- `backend/data/` — database
- `backend/uploads/` — uploaded images (placeholders can be uploaded with the app)

If you redeploy, do not overwrite `data/` or `uploads/` with empty folders.

## 6. Local demo vs production

`npm run db:setup` on your laptop still creates demo logins (`fiaba123`). Those accounts are for local use only and are not created on Hostinger unless you seed there.

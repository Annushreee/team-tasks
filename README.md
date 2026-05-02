# Team Task Manager

Full-stack app: **signup/login**, **projects** with **Admin/Member** roles, **tasks** (assign, status, due dates), and a **dashboard** (counts, overdue, your open work).

- **API**: Express + Prisma + PostgreSQL (REST, validation with Zod, JWT session cookie).
- **Web UI**: React + Vite (same origin as API in production).

**Requirements:** Node **≥ 20.6** (for `npm run db:push` / `db:migrate`, which use `node --env-file=.env`).

## Local development

1. Create a PostgreSQL database and set `DATABASE_URL` in **`.env` at the repo root** (see `.env.example`).
   - From your **laptop**, use a URL that actually resolves (e.g. local Postgres, Docker, or Railway’s **public** / TCP connection string). Hostnames like `*.railway.internal` only work **inside** Railway, not on your machine.
2. Install and sync the schema (run from **repo root** so `.env` is loaded):

   ```bash
   cp .env.example .env
   npm install
   npm run db:push
   ```

   For migrations (closer to production): `npm run db:migrate` from the repo root, or `npm run start` (runs `prisma migrate deploy` then the server).

   **If Prisma says `DATABASE_URL` not found:** save `.env` in the repo root (unsaved buffers are not read). The line must be **`DATABASE_URL="..."`** (include the **`=`**). A typo like `DATABASE_URLpostgresql://...` defines no variable.

   **If Prisma says `P1001` / can’t reach `postgres.railway.internal`:** that hostname is **private to Railway**. Your laptop cannot resolve or connect to it. Do one of the following:
   - **Public URL (simplest):** In Railway → **Postgres** service → **Variables** (or **Connect**), copy **`DATABASE_PUBLIC_URL`** or the **public** / **TCP proxy** Postgres URL (host is usually something like `*.proxy.rlwy.net`, **not** `*.railway.internal`). Put that in your **local** `.env` as `DATABASE_URL`. If the client requires TLS, append `?sslmode=require` to the URL.
   - **Tunnel:** Install the [Railway CLI](https://docs.railway.com/develop/cli) and use `railway connect` for a local tunnel (see Railway docs).
   - **Local DB:** Use Docker or local Postgres and point `DATABASE_URL` at `localhost` (see `.env.example`).

3. Run API + UI:

   ```bash
   npm run dev
   ```

   - UI: http://localhost:5173  
   - API: http://localhost:4000  

## Deploy on Railway (live URL)

One **Node** service runs the API and serves the built React app on the **same** public URL (good for cookies and CORS).

### 1. Put the code on GitHub

Push this repo to GitHub (if it is not already). Railway will deploy from that repository.

### 2. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New project**.
2. Add **PostgreSQL** (template “Provision PostgreSQL”). Wait until it is healthy.

### 3. Add the web app service

1. In the same project → **New** → **GitHub Repo** → select this repository.
2. Railway should detect **Node** and use the repo **root** as the service root (do **not** set the root to `server/` only; `package.json` at the top must be used).
3. Under the new service → **Settings** → confirm **Build** / **Start** match the repo (see `railway.toml`: build `npm install && npm run build`, start `npm run start`).

**Avoid duplicate services:** If Railway (or you) created **two** deployments from this repo (for example both named like a “server” and “client” service), **each** one runs `npm run start` and needs **`DATABASE_URL`**. That is easy to miss and causes `Environment variable not found: DATABASE_URL`. Prefer **one** Node service that serves API + static UI; delete or disable the extra service unless you know you need it.

### 4. Wire the database to the app

1. Open your **Node (web)** service → **Variables**.
2. Add **`DATABASE_URL`**: click **Add variable** → **Variable reference** → choose the **Postgres** service → **`DATABASE_URL`** (Railway’s private URL is fine here; app and DB run inside Railway).

### 5. Expose a public URL

1. On the **Node** service → **Settings** → **Networking** → **Generate domain** (or attach a custom domain).
2. Copy the full site URL, e.g. `https://your-service-name.up.railway.app` (must be **`https://`**).

### 6. Set environment variables (Node service → Variables)

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Reference from Postgres (step 4), or paste if you prefer |
| `JWT_SECRET` | Long random secret (local: `openssl rand -hex 32`) |
| `CLIENT_ORIGIN` | **Exactly** your public app URL from step 5, e.g. `https://your-service-name.up.railway.app` (no trailing slash) |
| `NODE_ENV` | `production` |

If you generated the domain **after** the first deploy, set `CLIENT_ORIGIN` and **Redeploy** once so CORS and cookies match the live origin.

### 7. Deploy and verify

1. Railway will **build** (`npm install && npm run build`) then **start** (`npm run start` → `scripts/start.mjs`: `prisma migrate deploy` then `node server/dist/index.js`). If `DATABASE_URL` is missing, the start script prints a short fix hint and exits before Prisma’s cryptic error.
2. Open the **public URL** in a browser. You should see the login/signup UI.
3. **Sign up**, create a project, add tasks. To invite someone as **Member** or **Admin**, they must **sign up first**; then use **Admin** → invite by **email** on the project page.

### Troubleshooting

- **Build fails:** Check logs; ensure **Node ≥ 20.6** (see `engines` in root `package.json`). In Railway you can set a **Node version** if needed.
- **Boot fails on DB:** Confirm `DATABASE_URL` is set on the **same** service that runs `npm run start`.
- **401 / CORS / cookies:** `CLIENT_ORIGIN` must match the URL in the browser (scheme + host, no path).
- **Migrations:** First deploy applies `server/prisma/migrations`. If you only ever used `db:push` locally, production still runs `migrate deploy`; the shipped migration should match the schema.

## API overview

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/signup` | Body: `{ email, password, name }` |
| POST | `/api/auth/login` | Body: `{ email, password }` |
| POST | `/api/auth/logout` | Clears session cookie |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Totals, overdue list, your open tasks |
| GET/POST | `/api/projects` | List / create (creator = **ADMIN**) |
| GET/PATCH/DELETE | `/api/projects/:projectId` | **Admin** for PATCH/DELETE |
| POST | `/api/projects/:projectId/members` | **Admin**; `{ email, role }` |
| PATCH/DELETE | `/api/projects/:projectId/members/:userId` | **Admin** |
| POST/PATCH/DELETE | `/api/projects/:projectId/tasks` | Project members |

Session: HTTP-only cookie `ttm_session` (JWT). API also accepts `Authorization: Bearer <token>` if needed.

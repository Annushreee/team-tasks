# Team Task Manager

**Team Task Manager** (branded **Team Tasks** in the UI) is a full-stack web application for small teams who want a single place to organize work: accounts, shared **projects**, role-based access (**Admin** / **Member**), and a **task board** with statuses and due dates, plus a **dashboard** that highlights overdue work and your own open tasks.

---

## About the project

The goal is to keep collaboration simple. Each **project** is a workspace with its own members and tasks. The person who creates a project becomes an **Admin** and can invite others by email; invitees must **sign up first** with that email so they exist in the system before they can be added. **Members** can view and update tasks on projects they belong to; **Admins** can also manage project metadata (via the API) and manage membership—invite teammates, change roles, or remove people from the project.

Tasks follow a lightweight workflow—**To do**, **In progress**, and **Done**—without drag-and-drop complexity: you change status, assignee, and due date directly on each task card. A **dashboard** aggregates counts across all your projects, lists **overdue** items with links back to the right project, and shows **my open tasks** (tasks **assigned to you** or **created by you** that are not yet **Done**). In production, the **React** app and **Express** API are served from the **same origin**, which keeps **HTTP-only session cookies** and CORS configuration straightforward.

---

## Features

### Authentication & accounts

- **Sign up** with email, display name, and password (minimum length enforced server-side; optional **password strength** feedback in the UI).
- **Log in** / **log out**; protected routes redirect unauthenticated users to the login page.
- Passwords stored with **bcrypt**; login and signup errors use **generic messages** where appropriate to avoid leaking whether an email is registered.
- Session uses an **HTTP-only** cookie (`ttm_session`) carrying a **JWT**; the API can also accept `Authorization: Bearer <token>` if needed.

### Projects

- **List projects** you belong to, with **task counts** and your **role** (Admin or Member) on each.
- **Create a project** with a **name** and optional **description**; the creator is automatically the project **Admin**.
- **Project detail** page shows the description, your role, breadcrumbs, and splits the screen between **tasks** and **team** management.
- **Admins** can rename or update a project (or delete it) via the **REST API** (`PATCH` / `DELETE` on `/api/projects/:projectId`); the web UI centers on tasks and membership.

### Tasks & board

- **Three-column board**: *To do*, *In progress*, and *Done*—tasks are grouped by status with counts per column.
- **Create tasks** with a title and optional **due date** from the project page.
- On each **task card**: change **status**, **assignee** (any project member or unassigned), and **due date**; **delete** a task (with confirmation).
- **Search / filter** tasks by title, description text, or assignee name.
- Task model supports optional **description** (shown on the card when present; full create/update fields are available on the **REST API**).

### Team & roles

- **Admins** invite users by **email**, choosing **Member** or **Admin** at invite time.
- **Admins** can **change a member’s role** between Member and Admin, or **remove** someone from the project (with confirmation).
- **Members** see the team list but cannot invite, remove, or change roles unless they are promoted to Admin.

### Dashboard

- **Summary stats**: counts for *To do*, *In progress*, *Done*, and **overdue** tasks across all projects you can access.
- **Overdue** section with links into the owning project; **My open tasks** lists work that is still open and relevant to you, with due hints and status pills.
- **Empty state** when you have no active workload, with a shortcut to create or join projects.

### User experience

- App shell with **Dashboard** and **Projects** navigation, **user chip** (name / email), and **log out**.
- **Toast** notifications for success and errors; **loading** skeletons where appropriate; **empty states** with short guidance.
- Responsive **top bar** with a collapsible menu on smaller screens.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Web UI** | React, TypeScript, Vite, React Router |
| **API** | Node.js, Express, REST |
| **Data** | PostgreSQL, Prisma ORM (migrations in `server/prisma/migrations`) |
| **Validation** | Zod (request bodies and query shapes) |
| **Auth** | JWT in HTTP-only cookie, bcrypt for password hashes |
| **Monorepo** | npm **workspaces** (`client/`, `server/`), single `npm run build` and `npm run start` from the repo root |
| **Deploy** | One Node process serves the API and static client build (e.g. **Railway**); see `railway.toml` |

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
2. Add **`DATABASE_URL`**: use the variable picker to reference **Postgres → `DATABASE_URL`**, or in **Raw Editor** set  
   `DATABASE_URL=${{ YourPostgresServiceName.DATABASE_URL }}`  
   using the **exact Postgres service name** shown on the project canvas (Railway’s [reference syntax](https://docs.railway.com/variables#referencing-another-services-variable)).
3. If a purple **staged changes** banner appears on the canvas, open **Details** → **Deploy** so the new variables are applied (new env vars do not affect already-running containers until you deploy / redeploy).

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

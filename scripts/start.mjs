#!/usr/bin/env node
/**
 * Production start: optional root `.env`, then Prisma migrate, then API.
 * Railway must still set DATABASE_URL (and other secrets) on the service — this file only
 * loads `.env` when the file exists (local / custom images).
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(`
[team-task-manager] DATABASE_URL is not set.

Prisma reads the environment before migrations run. Railway does not load a committed .env file.

Fix on Railway:
  1. Open the Node service that runs this app (only ONE service should run "npm run start").
  2. Variables → Add DATABASE_URL → "Variable reference" → your Postgres service → DATABASE_URL
     (README → "Deploy on Railway" → step 4.)

If you added two services from the same repo (e.g. "server" and "client"), remove the extra one
or give each DATABASE_URL — usually you want a single web service + Postgres.
`);
  process.exit(1);
}

const prismaCli = join(root, "node_modules", "prisma", "build", "index.js");
const schema = "server/prisma/schema.prisma";

const migrate = spawnSync(
  process.execPath,
  [prismaCli, "migrate", "deploy", `--schema=${schema}`],
  { cwd: root, stdio: "inherit", env: process.env }
);
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

const api = spawnSync(process.execPath, [join(root, "server", "dist", "index.js")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(api.status ?? 0);

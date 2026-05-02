import "./env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { dashboardRouter } from "./routes/dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..");
const clientDist = path.join(rootDir, "client", "dist");

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/projects/:projectId/tasks", tasksRouter);
app.use("/api/projects", projectsRouter);

app.use(express.static(clientDist));
// Express 5 / path-to-regexp: bare "*" is invalid; use a named wildcard (see expressjs.com migrating to v5).
app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

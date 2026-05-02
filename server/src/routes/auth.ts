import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import {
  requireAuth,
  setSessionCookie,
  clearSessionCookie,
  type AuthedRequest,
} from "../middleware/auth.js";
import { signupSchema, loginSchema } from "../validation/schemas.js";

const SALT_ROUNDS = 12;

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({ error: "Invalid username or password" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true },
  });
  const token = signToken({ sub: user.id, email: user.email });
  setSessionCookie(res, token);
  res.status(201).json({ user });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const token = signToken({ sub: user.id, email: user.email });
  setSessionCookie(res, token);
  res.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

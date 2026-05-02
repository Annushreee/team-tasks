import type { Response, NextFunction } from "express";
import { ProjectRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { paramString } from "../lib/params.js";
import type { AuthedRequest } from "./auth.js";

export type ProjectScopedRequest = AuthedRequest & {
  projectId: string;
  membership: { role: ProjectRole; userId: string };
};

export async function loadProjectMember(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const projectId = paramString(req.params.projectId);
  if (!projectId) {
    res.status(400).json({ error: "Missing project id" });
    return;
  }
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  (req as ProjectScopedRequest).projectId = projectId;
  (req as ProjectScopedRequest).membership = membership;
  next();
}

export function requireProjectAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const m = (req as ProjectScopedRequest).membership;
  if (!m || m.role !== ProjectRole.ADMIN) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}

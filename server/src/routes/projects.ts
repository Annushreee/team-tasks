import { Router, type Request, type Response } from "express";
import { ProjectRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { paramString } from "../lib/params.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import {
  loadProjectMember,
  requireProjectAdmin,
  type ProjectScopedRequest,
} from "../middleware/projectAccess.js";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberSchema,
} from "../validation/schemas.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  res.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      updatedAt: p.updatedAt,
      taskCount: p._count.tasks,
      members: p.members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
      })),
      myRole: p.members.find((m) => m.userId === userId)?.role,
    })),
  });
});

projectsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const userId = req.user!.id;
  const { name, description } = parsed.data;
  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? null,
      members: { create: { userId, role: ProjectRole.ADMIN } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
    },
  });
  res.status(201).json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      members: project.members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
      })),
      myRole: ProjectRole.ADMIN,
    },
  });
});

projectsRouter.get("/:projectId", loadProjectMember, async (req: Request, res: Response) => {
  const ps = req as ProjectScopedRequest;
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: ps.projectId },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
      tasks: {
        orderBy: { updatedAt: "desc" },
        include: {
          assignee: { select: { id: true, email: true, name: true } },
          createdBy: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });
  res.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      updatedAt: project.updatedAt,
      myRole: project.members.find((m) => m.userId === ps.user!.id)?.role,
      members: project.members.map((m) => ({
        userId: m.user.id,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
      })),
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        dueDate: t.dueDate,
        assignee: t.assignee,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    },
  });
});

projectsRouter.patch(
  "/:projectId",
  loadProjectMember,
  requireProjectAdmin,
  async (req: Request, res: Response) => {
    const ps = req as ProjectScopedRequest;
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    const project = await prisma.project.update({
      where: { id: ps.projectId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        updatedAt: project.updatedAt,
      },
    });
  },
);

projectsRouter.delete(
  "/:projectId",
  loadProjectMember,
  requireProjectAdmin,
  async (req: Request, res: Response) => {
    const ps = req as ProjectScopedRequest;
    await prisma.project.delete({ where: { id: ps.projectId } });
    res.status(204).end();
  },
);

projectsRouter.post(
  "/:projectId/members",
  loadProjectMember,
  requireProjectAdmin,
  async (req: Request, res: Response) => {
    const ps = req as ProjectScopedRequest;
    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    const { email, role } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: "User not found for this email" });
      return;
    }
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: ps.projectId, userId: user.id } },
    });
    if (existing) {
      res.status(409).json({ error: "User is already a member" });
      return;
    }
    await prisma.projectMember.create({
      data: { projectId: ps.projectId, userId: user.id, role },
    });
    res.status(201).json({
      member: { userId: user.id, email: user.email, name: user.name, role },
    });
  },
);

projectsRouter.patch(
  "/:projectId/members/:userId",
  loadProjectMember,
  requireProjectAdmin,
  async (req: Request, res: Response) => {
    const ps = req as ProjectScopedRequest;
    const targetUserId = paramString(req.params.userId);
    if (!targetUserId) {
      res.status(400).json({ error: "Missing user id" });
      return;
    }
    const parsed = updateMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    const { role } = parsed.data;
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: ps.projectId, userId: targetUserId } },
    });
    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }
    if (member.role === ProjectRole.ADMIN && role === ProjectRole.MEMBER) {
      const adminCount = await prisma.projectMember.count({
        where: { projectId: ps.projectId, role: ProjectRole.ADMIN },
      });
      if (adminCount <= 1) {
        res.status(400).json({ error: "Project must have at least one admin" });
        return;
      }
    }
    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: ps.projectId, userId: targetUserId } },
      data: { role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    res.json({
      member: {
        userId: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
        role: updated.role,
      },
    });
  },
);

projectsRouter.delete(
  "/:projectId/members/:userId",
  loadProjectMember,
  requireProjectAdmin,
  async (req: Request, res: Response) => {
    const ps = req as ProjectScopedRequest;
    const targetUserId = paramString(req.params.userId);
    if (!targetUserId) {
      res.status(400).json({ error: "Missing user id" });
      return;
    }
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: ps.projectId, userId: targetUserId } },
    });
    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }
    if (member.role === ProjectRole.ADMIN) {
      const adminCount = await prisma.projectMember.count({
        where: { projectId: ps.projectId, role: ProjectRole.ADMIN },
      });
      if (adminCount <= 1) {
        res.status(400).json({ error: "Cannot remove the only admin" });
        return;
      }
    }
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: ps.projectId, userId: targetUserId } },
    });
    res.status(204).end();
  },
);

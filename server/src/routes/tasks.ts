import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { paramString } from "../lib/params.js";
import { requireAuth } from "../middleware/auth.js";
import { loadProjectMember, type ProjectScopedRequest } from "../middleware/projectAccess.js";
import { createTaskSchema, updateTaskSchema } from "../validation/schemas.js";

export const tasksRouter = Router({ mergeParams: true });

tasksRouter.use(requireAuth, loadProjectMember);

tasksRouter.post("/", async (req: Request, res: Response) => {
  const ps = req as ProjectScopedRequest;
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { title, description, status, dueDate, assigneeId } = parsed.data;
  if (!(await assertAssigneeInProject(ps.projectId, assigneeId ?? undefined))) {
    res.status(400).json({ error: "Assignee must be a project member" });
    return;
  }
  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      status: status ?? undefined,
      dueDate: dueDate ?? null,
      assigneeId: assigneeId ?? null,
      projectId: ps.projectId,
      createdById: ps.user!.id,
    },
    include: {
      assignee: { select: { id: true, email: true, name: true } },
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });
  res.status(201).json({ task: serializeTask(task) });
});

tasksRouter.patch("/:taskId", async (req: Request, res: Response) => {
  const ps = req as ProjectScopedRequest;
  const taskId = paramString(req.params.taskId);
  if (!taskId) {
    res.status(400).json({ error: "Missing task id" });
    return;
  }
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId: ps.projectId },
  });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const data = parsed.data;
  if (data.assigneeId !== undefined && !(await assertAssigneeInProject(ps.projectId, data.assigneeId))) {
    res.status(400).json({ error: "Assignee must be a project member" });
    return;
  }
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
    },
    include: {
      assignee: { select: { id: true, email: true, name: true } },
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });
  res.json({ task: serializeTask(task) });
});

tasksRouter.delete("/:taskId", async (req: Request, res: Response) => {
  const ps = req as ProjectScopedRequest;
  const taskId = paramString(req.params.taskId);
  if (!taskId) {
    res.status(400).json({ error: "Missing task id" });
    return;
  }
  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId: ps.projectId },
  });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  await prisma.task.delete({ where: { id: taskId } });
  res.status(204).end();
});

async function assertAssigneeInProject(
  projectId: string,
  assigneeId: string | null | undefined,
): Promise<boolean> {
  if (assigneeId == null) return true;
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
  });
  return !!m;
}

function serializeTask(task: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: { id: string; email: string; name: string } | null;
  createdBy: { id: string; email: string; name: string };
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate,
    assignee: task.assignee,
    createdBy: task.createdBy,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

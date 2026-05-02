import { Router } from "express";
import { TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const now = new Date();

  const projectIds = (
    await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    })
  ).map((p) => p.projectId);

  if (projectIds.length === 0) {
    res.json({
      totals: {
        todo: 0,
        inProgress: 0,
        done: 0,
        overdue: 0,
      },
      overdueTasks: [],
      myUpcoming: [],
    });
    return;
  }

  const [statusGroups, overdueTasks, myUpcoming] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: TaskStatus.DONE },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [{ assigneeId: userId }, { createdById: userId }],
        status: { not: TaskStatus.DONE },
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 20,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  const counts = {
    todo: 0,
    inProgress: 0,
    done: 0,
  };
  for (const row of statusGroups) {
    if (row.status === TaskStatus.TODO) counts.todo = row._count._all;
    if (row.status === TaskStatus.IN_PROGRESS) counts.inProgress = row._count._all;
    if (row.status === TaskStatus.DONE) counts.done = row._count._all;
  }

  const overdue = await prisma.task.count({
    where: {
      projectId: { in: projectIds },
      status: { not: TaskStatus.DONE },
      dueDate: { lt: now },
    },
  });

  res.json({
    totals: {
      ...counts,
      overdue,
    },
    overdueTasks: overdueTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      project: t.project,
      assignee: t.assignee,
    })),
    myUpcoming: myUpcoming.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      project: t.project,
      assignee: t.assignee,
    })),
  });
});

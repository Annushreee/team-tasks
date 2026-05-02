import { z } from "zod";
import { ProjectRole, TaskStatus } from "@prisma/client";

export const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const addMemberSchema = z.object({
  email: z.string().trim().email().max(255),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER),
});

export const updateMemberSchema = z.object({
  role: z.nativeEnum(ProjectRole),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
});

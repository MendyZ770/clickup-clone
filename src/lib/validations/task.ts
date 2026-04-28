import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(10000, "Description too long").optional(),
  priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  timeEstimate: z.number().int().min(0).optional().nullable(),
  listId: z.string().min(1, "List ID is required"),
  statusId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  position: z.number().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long").optional(),
  description: z.string().max(10000, "Description too long").optional().nullable(),
  priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  timeEstimate: z.number().int().min(0).optional().nullable(),
  statusId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  position: z.number().optional(),
  listId: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

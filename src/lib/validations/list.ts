import { z } from "zod";

export const createListSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  spaceId: z.string().min(1, "Space ID is required"),
  folderId: z.string().optional().nullable(),
});

export const updateListSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;

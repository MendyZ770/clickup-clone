import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

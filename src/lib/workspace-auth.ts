import { prisma } from "./prisma";

export type WorkspaceRole = "owner" | "admin" | "member";

export async function getWorkspaceRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  return (member?.role as WorkspaceRole | undefined) ?? null;
}

export async function isWorkspaceAdmin(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceRole(workspaceId, userId);
  return role === "owner" || role === "admin";
}

export async function getSpaceRole(
  spaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { workspaceId: true },
  });
  return space ? getWorkspaceRole(space.workspaceId, userId) : null;
}

export async function getListRole(
  listId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { space: { select: { workspaceId: true } } },
  });
  return list ? getWorkspaceRole(list.space.workspaceId, userId) : null;
}

export async function getFolderRole(
  folderId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { space: { select: { workspaceId: true } } },
  });
  return folder ? getWorkspaceRole(folder.space.workspaceId, userId) : null;
}

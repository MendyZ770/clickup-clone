import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    workspaceId: string;
    spaceId: string;
    listId: string;
  }>;
}

export default async function ListPage({ params }: PageProps) {
  const { workspaceId, spaceId, listId } = await params;
  redirect(
    `/workspace/${workspaceId}/space/${spaceId}/list/${listId}/list-view`
  );
}

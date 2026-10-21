// Noms de canaux partagés entre le client et le serveur.
// `NEXT_PUBLIC_PUSHER_PRIVATE=false` rétablit les anciens canaux publics
// (repli documenté si l'endpoint d'autorisation n'est pas déployé).
const privateMode = process.env.NEXT_PUBLIC_PUSHER_PRIVATE !== "false";
const prefix = privateMode ? "private-" : "";

export function chatChannelName(listId: string): string {
  return `${prefix}list-${listId}-chat`;
}

export function workspaceChannelName(workspaceId: string): string {
  return `${prefix}workspace-${workspaceId}`;
}

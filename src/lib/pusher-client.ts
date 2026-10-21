import PusherClient from "pusher-js";
import { storageGet } from "@/lib/storage";

// Singleton pour éviter de créer de multiples connexions
let pusherClientInstance: PusherClient | null = null;

type AuthorizeCallback = (error: Error | null, result: { auth: string } | null) => void;

async function authorizeChannel(
  socketId: string,
  channelName: string,
  callback: AuthorizeCallback
) {
    try {
      const token = await storageGet("mobile_auth_token");
      const res = await fetch("/api/pusher/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
      });
      if (!res.ok) {
        throw new Error(`Abonnement refusé (${res.status})`);
      }
      callback(null, await res.json());
    } catch (error) {
      callback(error instanceof Error ? error : new Error("Abonnement refusé"), null);
    }
}

// Forme « generator » attendue par pusher-js pour remplacer l'autoriseur intégré.
const authorizer = (channel: { name: string }) => ({
  authorize: (socketId: string, callback: AuthorizeCallback) => {
    void authorizeChannel(socketId, channel.name, callback);
  },
});

export const getPusherClient = () => {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || "",
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
        authorizer,
      }
    );
  }
  return pusherClientInstance;
};

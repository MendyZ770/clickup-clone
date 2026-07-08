import PusherClient from "pusher-js";

// Singleton pour éviter de créer de multiples connexions
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || "",
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
      }
    );
  }
  return pusherClientInstance;
};

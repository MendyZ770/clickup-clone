import Pusher from "pusher";

// Configuration du client Pusher côté serveur pour envoyer les événements
// Assurez-vous d'avoir configuré ces variables d'environnement dans votre projet (.env ou Vercel)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
  useTLS: true,
});

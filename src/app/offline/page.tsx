import Link from "next/link";
import { CloudOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <CloudOff className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Mode hors-ligne</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Vous êtes hors-ligne. Vos modifications seront renvoyées automatiquement
        dès la reconnexion.
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        Reconnectez-vous à Internet pour reprendre le travail.
      </p>
      <Link href="/dashboard" className="text-sm underline">
        Retour au tableau de bord
      </Link>
    </main>
  );
}

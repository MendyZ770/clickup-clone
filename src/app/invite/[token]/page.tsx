"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Users, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface InviteInfo {
  workspace: { id: string; name: string; color: string };
  email: string;
  role: string;
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${params.token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Invitation invalide");
        } else {
          setInvite(data);
        }
      } catch {
        setError("Erreur lors du chargement de l'invitation");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [params.token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${params.token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible d'accepter");
        setAccepting(false);
        return;
      }
      router.push(`/workspace/${data.workspaceId}`);
    } catch {
      setError("Erreur lors de l'acceptation");
      setAccepting(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold mb-1">Invitation invalide</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  const isLoggedIn = status === "authenticated";
  const emailMatches =
    isLoggedIn &&
    session?.user?.email?.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-5">
          <div className="text-center space-y-3">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl text-white font-bold text-xl"
              style={{ backgroundColor: invite.workspace.color }}
            >
              {invite.workspace.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">Rejoindre {invite.workspace.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {"Vous avez été invité comme "}
                <span className="font-medium">
                  {invite.role === "admin" ? "administrateur" : "membre"}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-xs text-center">
            <Users className="h-3.5 w-3.5 inline mr-1" />
            {"Cette invitation est pour "}
            <span className="font-mono font-medium">{invite.email}</span>
          </div>

          {!isLoggedIn ? (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() =>
                  signIn(undefined, {
                    callbackUrl: `/invite/${params.token}`,
                  })
                }
              >
                Se connecter pour accepter
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(
                    `/register?callbackUrl=${encodeURIComponent(`/invite/${params.token}`)}&email=${encodeURIComponent(invite.email)}`
                  )
                }
              >
                Créer un compte
              </Button>
            </div>
          ) : !emailMatches ? (
            <div className="space-y-2">
              <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-600 dark:text-yellow-400">
                {"Vous êtes connecté avec "}
                <span className="font-mono">{session?.user?.email}</span>
                {" mais l'invitation est pour "}
                <span className="font-mono">{invite.email}</span>
                {". Reconnectez-vous avec le bon compte."}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  signIn(undefined, { callbackUrl: `/invite/${params.token}` })
                }
              >
                Changer de compte
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {"Accepter l'invitation"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

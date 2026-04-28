"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Copy,
  Check,
  RefreshCw,
  Download,
  Link2,
  Unplug,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

export default function CalendarSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <CalendarSettingsContent />
    </Suspense>
  );
}

function CalendarSettingsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // ICS Feed state
  const [feedToken, setFeedToken] = useState<string | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Google Calendar state
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean;
    syncEnabled?: boolean;
    lastSyncAt?: string | null;
    calendarId?: string;
  } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const feedUrl = feedToken
    ? `${baseUrl}/api/calendar/feed/${feedToken}`
    : null;
  const webcalUrl = feedToken
    ? `webcal://${baseUrl.replace(/^https?:\/\//, "")}/api/calendar/feed/${feedToken}`
    : null;

  const fetchToken = useCallback(async () => {
    try {
      setFeedLoading(true);
      const res = await fetch("/api/calendar/token");
      if (res.ok) {
        const data = await res.json();
        setFeedToken(data.token);
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'URL du flux calendrier",
        variant: "destructive",
      });
    } finally {
      setFeedLoading(false);
    }
  }, [toast]);

  const fetchGoogleStatus = useCallback(async () => {
    try {
      setGoogleLoading(true);
      const res = await fetch("/api/calendar/google/sync");
      if (res.ok) {
        const data = await res.json();
        setGoogleStatus(data);
      }
    } catch {
      console.error("Failed to fetch Google Calendar status");
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
    fetchGoogleStatus();
  }, [fetchToken, fetchGoogleStatus]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      toast({
        title: "Google Calendar connecté",
        description:
          "Votre Google Calendar est maintenant connecté. Vous pouvez synchroniser vos tâches.",
      });
      fetchGoogleStatus();
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_denied: "L'autorisation Google Calendar a été refusée.",
        google_auth_missing_params: "Paramètres manquants dans la réponse Google.",
        google_not_configured:
          "L'intégration Google Calendar n'est pas configurée sur le serveur.",
        google_token_exchange_failed:
          "Échec de l'échange du code d'autorisation. Réessayez en déconnectant d'abord.",
        google_auth_error: "Une erreur est survenue lors de l'autorisation Google.",
      };
      toast({
        title: "Erreur Google Calendar",
        description: errorMessages[error] || "Une erreur inconnue est survenue.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast, fetchGoogleStatus]);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "URL copiée",
        description: "L'URL du flux calendrier a été copiée dans le presse-papiers",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copie impossible",
        description: "Impossible de copier l'URL. Sélectionnez-la et copiez-la manuellement.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await fetch("/api/calendar/token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFeedToken(data.token);
        setShowRegenerateConfirm(false);
        toast({
          title: "URL régénérée",
          description:
            "Votre URL de flux a été régénérée. Mettez-la à jour dans vos applications calendrier.",
        });
      } else {
        throw new Error("Failed to regenerate");
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de régénérer l'URL du calendrier",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/calendar/google/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Synchronisation terminée",
          description: `${data.synced} tâche${data.synced !== 1 ? "s" : ""} synchronisée${data.synced !== 1 ? "s" : ""} vers Google Calendar${data.errors > 0 ? ` (${data.errors} en échec)` : ""}`,
        });
        fetchGoogleStatus();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Sync failed");
      }
    } catch (error) {
      toast({
        title: "Échec de la synchronisation",
        description:
          error instanceof Error ? error.message : "Impossible de synchroniser avec Google Calendar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const res = await fetch("/api/calendar/google/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        setGoogleStatus({ connected: false });
        setShowDisconnectConfirm(false);
        toast({
          title: "Déconnecté",
          description: "Google Calendar a été déconnecté.",
        });
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter Google Calendar",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch("/api/calendar/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "devflow-taches.ics";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: "Export terminé",
          description: "Vos tâches ont été exportées au format .ics",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch {
      toast({
        title: "Échec de l'export",
        description: "Impossible d'exporter le fichier calendrier",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 md:h-6 md:w-6" />
          Sync calendrier
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {"Synchronisez vos tâches avec Apple Calendar, Samsung Calendar ou Google Calendar."}
        </p>
      </div>

      {/* Section 1: Subscribe to Calendar Feed */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {"S'abonner au flux calendrier"}
          </CardTitle>
          <CardDescription>
            {"Abonnez-vous à un flux calendrier qui se met à jour automatiquement. Fonctionne avec toutes les applications supportant les abonnements iCal."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {"Chargement de l'URL du flux..."}
            </div>
          ) : feedUrl ? (
            <>
              {/* Feed URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {"URL de votre flux calendrier"}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-xs break-all font-mono">
                    {webcalUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyUrl(webcalUrl!)}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Instructions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">{"Instructions d'installation"}</h4>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Apple Calendar (macOS / iOS)</p>
                      <ol className="mt-1 list-decimal list-inside text-xs text-muted-foreground space-y-0.5">
                        <li>{"Copiez l'URL ci-dessus"}</li>
                        <li>
                          {"Ouvrez Apple Calendar > Fichier > Nouvel abonnement calendrier"}
                        </li>
                        <li>{"Collez l'URL et cliquez sur S'abonner"}</li>
                        <li>{"Réglez l'actualisation sur « Toutes les heures »"}</li>
                      </ol>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Samsung Calendar</p>
                      <ol className="mt-1 list-decimal list-inside text-xs text-muted-foreground space-y-0.5">
                        <li>{"Copiez l'URL ci-dessus"}</li>
                        <li>
                          {"Ouvrez Samsung Calendar > Paramètres > Ajouter un calendrier > S'abonner via URL"}
                        </li>
                        <li>{"Collez l'URL et enregistrez"}</li>
                      </ol>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Autres applications</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {"La plupart des applications calendrier supportent les abonnements iCal. Cherchez « Ajouter un calendrier par URL » ou « S'abonner à un calendrier » dans les paramètres."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Regenerate */}
              <div>
                {showRegenerateConfirm ? (
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          {"Êtes-vous sûr de vouloir régénérer ?"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {"Cela invalidera votre URL actuelle. Vous devrez la mettre à jour dans toutes les applications abonnées."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={regenerating}
                      >
                        {regenerating && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {"Oui, régénérer"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRegenerateConfirm(false)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRegenerateConfirm(true)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {"Régénérer l'URL"}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {"Impossible de charger le flux calendrier. Veuillez rafraîchir la page."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Google Calendar Sync */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="#fff" />
              <path d="M18.316 23.368l5.052-5.052h-5.052v5.052z" fill="#1967D2" />
              <path d="M23.368 5.684h-5.052v12.632h5.052V5.684z" fill="#4285F4" />
              <path d="M18.316 18.316H5.684v5.052h12.632v-5.052z" fill="#34A853" />
              <path d="M0 18.316v3.789A1.263 1.263 0 001.263 23.368h4.421v-5.052H0z" fill="#188038" />
              <path d="M23.368 5.684V1.263A1.263 1.263 0 0022.105 0h-3.789v5.684h5.052z" fill="#1967D2" />
              <path d="M18.316 0H1.263A1.263 1.263 0 000 1.263v17.053h5.684V5.684h12.632V0z" fill="#4285F4" />
            </svg>
            {"Synchronisation Google Calendar"}
          </CardTitle>
          <CardDescription>
            {"Connectez Google Calendar pour synchroniser vos tâches en tant qu'événements. Fonctionne aussi avec Samsung Calendar lié à un compte Google."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {"Vérification de la connexion Google Calendar..."}
            </div>
          ) : googleStatus?.connected ? (
            <>
              {/* Connected status */}
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {"Google Calendar est connecté"}
                  </span>
                </div>
                {googleStatus.lastSyncAt && (
                  <p className="mt-1 text-xs text-muted-foreground ml-7">
                    {"Dernière synchronisation : "}
                    {new Date(googleStatus.lastSyncAt).toLocaleString("fr-FR")}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {"Synchroniser maintenant"}
                </Button>

                {showDisconnectConfirm ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                    >
                      {disconnecting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {"Confirmer la déconnexion"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDisconnectConfirm(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(true)}
                  >
                    <Unplug className="mr-2 h-4 w-4" />
                    Déconnecter
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {"Connectez votre Google Calendar pour créer automatiquement des événements à partir de vos tâches. Une fois connecté, synchronisez en un clic."}
              </p>
              <Button variant="default" size="sm" asChild>
                <a href="/api/calendar/google/auth">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {"Connecter Google Calendar"}
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                {"Note : l'intégration Google Calendar nécessite que le serveur soit configuré avec les identifiants OAuth Google."}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Export Calendar */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            {"Exporter le calendrier"}
          </CardTitle>
          <CardDescription>
            {"Téléchargez un fichier .ics contenant toutes vos tâches avec échéance. Importable dans n'importe quelle application calendrier."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {"Télécharger le fichier .ics"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

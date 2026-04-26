"use client";

import { useState, useEffect, useCallback } from "react";
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

  // Fetch the calendar token
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
        title: "Error",
        description: "Failed to load calendar feed token",
        variant: "destructive",
      });
    } finally {
      setFeedLoading(false);
    }
  }, [toast]);

  // Fetch Google Calendar status
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

  // Handle URL params from OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      toast({
        title: "Google Calendar Connected",
        description:
          "Your Google Calendar has been successfully connected. You can now sync your tasks.",
      });
      fetchGoogleStatus();
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_denied: "Google Calendar authorization was denied.",
        google_auth_missing_params: "Missing parameters from Google authorization.",
        google_not_configured: "Google Calendar integration is not configured on the server.",
        google_token_exchange_failed: "Failed to exchange authorization code for tokens.",
        google_auth_error: "An error occurred during Google authorization.",
      };
      toast({
        title: "Google Calendar Error",
        description: errorMessages[error] || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast, fetchGoogleStatus]);

  // Copy feed URL
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "URL Copied",
        description: "Calendar feed URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL. Please select and copy it manually.",
        variant: "destructive",
      });
    }
  };

  // Regenerate token
  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await fetch("/api/calendar/token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFeedToken(data.token);
        setShowRegenerateConfirm(false);
        toast({
          title: "URL Regenerated",
          description:
            "Your calendar feed URL has been regenerated. Update it in your calendar app.",
        });
      } else {
        throw new Error("Failed to regenerate");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to regenerate calendar URL",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  // Sync with Google Calendar
  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/calendar/google/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${data.synced} task${data.synced !== 1 ? "s" : ""} to Google Calendar${data.errors > 0 ? ` (${data.errors} failed)` : ""}`,
        });
        fetchGoogleStatus();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Sync failed");
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description:
          error instanceof Error ? error.message : "Failed to sync with Google Calendar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect Google Calendar
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
          title: "Disconnected",
          description: "Google Calendar has been disconnected.",
        });
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to disconnect Google Calendar",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // Export ICS file
  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch("/api/calendar/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "clickup-tasks.ics";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: "Export Complete",
          description: "Your tasks have been exported as an .ics file",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export calendar file",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Calendar Sync
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sync your tasks with external calendar apps like Apple Calendar,
          Samsung Calendar, and Google Calendar.
        </p>
      </div>

      {/* Section 1: Subscribe to Calendar Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Subscribe to Calendar Feed
          </CardTitle>
          <CardDescription>
            Subscribe to a live calendar feed that automatically updates when
            your tasks change. Works with any calendar app that supports iCal
            subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading calendar feed URL...
            </div>
          ) : feedUrl ? (
            <>
              {/* Feed URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Calendar Feed URL</label>
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
                <h4 className="text-sm font-medium">Setup Instructions</h4>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Apple Calendar (macOS / iOS)</p>
                      <ol className="mt-1 list-decimal list-inside text-xs text-muted-foreground space-y-0.5">
                        <li>Copy the URL above</li>
                        <li>
                          Open Apple Calendar &gt; File &gt; New Calendar
                          Subscription
                        </li>
                        <li>Paste the URL and click Subscribe</li>
                        <li>Set auto-refresh to &quot;Every hour&quot; for best results</li>
                      </ol>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Samsung Calendar</p>
                      <ol className="mt-1 list-decimal list-inside text-xs text-muted-foreground space-y-0.5">
                        <li>Copy the URL above</li>
                        <li>
                          Open Samsung Calendar &gt; Settings &gt; Add Calendar &gt;
                          Subscribe via URL
                        </li>
                        <li>Paste the URL and save</li>
                      </ol>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Other Calendar Apps</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Most calendar apps support iCal subscriptions. Look for
                        &quot;Add calendar by URL&quot; or &quot;Subscribe to calendar&quot; in your
                        app&apos;s settings and paste the URL above.
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
                          Are you sure you want to regenerate?
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This will invalidate your current feed URL. You will
                          need to update the URL in all calendar apps that are
                          subscribed to it.
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
                        Yes, Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRegenerateConfirm(false)}
                      >
                        Cancel
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
                    Regenerate URL
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Failed to load calendar feed. Please try refreshing the page.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Google Calendar Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.316 5.684H5.684v12.632h12.632V5.684z"
                fill="#fff"
              />
              <path
                d="M18.316 23.368l5.052-5.052h-5.052v5.052z"
                fill="#1967D2"
              />
              <path
                d="M23.368 5.684h-5.052v12.632h5.052V5.684z"
                fill="#4285F4"
              />
              <path
                d="M18.316 18.316H5.684v5.052h12.632v-5.052z"
                fill="#34A853"
              />
              <path
                d="M0 18.316v3.789A1.263 1.263 0 001.263 23.368h4.421v-5.052H0z"
                fill="#188038"
              />
              <path
                d="M23.368 5.684V1.263A1.263 1.263 0 0022.105 0h-3.789v5.684h5.052z"
                fill="#1967D2"
              />
              <path
                d="M18.316 0H1.263A1.263 1.263 0 000 1.263v17.053h5.684V5.684h12.632V0z"
                fill="#4285F4"
              />
              <path
                d="M8.073 16.421a3.2 3.2 0 01-1.39-.964l.78-.649c.295.39.706.698 1.17.893.465.196.968.239 1.454.127a2.07 2.07 0 001.007-.536 1.39 1.39 0 00.39-.993c0-.404-.144-.734-.432-.99-.288-.256-.68-.384-1.176-.384h-.73v-.906h.656c.427 0 .776-.116 1.047-.348.271-.232.407-.537.407-.915 0-.343-.12-.625-.36-.846-.24-.221-.547-.332-.922-.332-.363 0-.677.1-.943.3-.266.2-.468.452-.607.756l-.833-.347c.203-.459.518-.834.943-1.125.425-.29.931-.436 1.517-.436.433 0 .822.085 1.166.255.344.17.614.407.81.71.195.303.293.65.293 1.04 0 .402-.107.749-.32 1.04-.213.29-.484.497-.813.618v.064c.405.134.73.366.975.696.244.33.366.72.366 1.17 0 .44-.116.832-.347 1.176-.231.344-.552.614-.963.81-.41.197-.882.295-1.417.295-.627 0-1.137-.12-1.527-.377zm6.204-.168V9.108l-1.453 1.053-.498-.73 2.077-1.546h.83v8.368h-.956z"
                fill="#4285F4"
              />
            </svg>
            Google Calendar Sync
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to sync tasks as calendar events.
            This also works with Samsung Calendar when it&apos;s connected to a
            Google account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking Google Calendar connection...
            </div>
          ) : googleStatus?.connected ? (
            <>
              {/* Connected status */}
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Google Calendar is connected
                  </span>
                </div>
                {googleStatus.lastSyncAt && (
                  <p className="mt-1 text-xs text-muted-foreground ml-7">
                    Last synced:{" "}
                    {new Date(googleStatus.lastSyncAt).toLocaleString()}
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
                  Sync Now
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
                      Confirm Disconnect
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDisconnectConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(true)}
                  >
                    <Unplug className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Connect your Google Calendar to automatically create calendar
                events from your tasks. When connected, you can sync your tasks
                with a single click.
              </p>
              <Button variant="default" size="sm" asChild>
                <a href="/api/calendar/google/auth">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Note: Google Calendar integration requires the server to be
                configured with Google OAuth credentials. If the button above
                returns an error, contact your administrator.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Export Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Calendar
          </CardTitle>
          <CardDescription>
            Download a one-time .ics file export of all your tasks with due
            dates. You can import this file into any calendar app.
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
            Download .ics File
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

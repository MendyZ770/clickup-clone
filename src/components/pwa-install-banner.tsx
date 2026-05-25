"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (isInstalled || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:hidden">
      <div className="mx-auto max-w-sm rounded-2xl border bg-card/95 backdrop-blur-sm p-4 shadow-lg ring-1 ring-border/50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Installer Done</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Ajoutez Done à votre écran d&apos;accueil pour un accès rapide et hors ligne.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 -mt-1 -mr-1 p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1 gap-2 rounded-xl" onClick={handleInstall}>
            <Download className="h-4 w-4" />
            Installer
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xl" onClick={handleDismiss}>
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/providers/auth-provider";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { ModalProvider } from "@/providers/modal-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { CalendarAutoSync } from "@/components/calendar/calendar-auto-sync";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { OfflineIndicator } from "@/components/shared/offline-indicator";
import { PusherListener } from "@/components/pusher-listener";
import { SWRProvider } from "@/lib/swr-config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Done",
  description: "Outil de gestion de projets pour développeurs web",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Done",
    statusBarStyle: "black-translucent",
  },
};

// Script exécuté avant le rendu React pour éviter le flash de couleur au chargement
const themeInitScript = `
(function() {
  try {
    var mode = localStorage.getItem('done-theme') || 'system';
    var dark = false;
    if (mode === 'dark') dark = true;
    else if (mode === 'light') dark = false;
    else dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

// Intercepte fetch pour injecter le token mobile auth (web uniquement — sur Capacitor, géré par SWRProvider)
const fetchInterceptorScript = `
(function() {
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    init = init || {};
    var token = null;
    try { token = localStorage.getItem('mobile_auth_token'); } catch(e) {}
    if (token && (!init.headers || !init.headers.Authorization)) {
      var newHeaders = {};
      if (init.headers instanceof Headers) {
        init.headers.forEach(function(value, key) { newHeaders[key] = value; });
      } else if (init.headers) {
        for (var key in init.headers) { newHeaders[key] = init.headers[key]; }
      }
      if (!newHeaders['Authorization'] && !newHeaders['authorization']) {
        newHeaders['Authorization'] = 'Bearer ' + token;
      }
      init.headers = newHeaders;
    }
    return origFetch(input, init);
  };
})();
`;

// Enregistre le Service Worker PWA (désactivé dans Capacitor — casse la WebView).
// En développement, next-pwa ne génère pas le SW : l'enregistrement échouerait.
const swRegisterScript =
  process.env.NODE_ENV === "production"
    ? `
(function() {
  try {
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      return;
    }
  } catch (e) {}
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .catch(function(err) {
          console.error('[PWA] Échec enregistrement SW', err);
        });
    });
  }
})();
`
    : "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: fetchInterceptorScript }} />
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased overflow-x-hidden`}>
        <ThemeProvider>
          <SWRProvider>
            <AuthProvider>
              <WorkspaceProvider>
                <ModalProvider>
                  {children}
                  <ToastProvider />
                  <CalendarAutoSync />
                  <PWAInstallBanner />
                  <OfflineIndicator />
                  <PusherListener />
                </ModalProvider>
              </WorkspaceProvider>
            </AuthProvider>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

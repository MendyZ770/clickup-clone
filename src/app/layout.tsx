import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/providers/auth-provider";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { ModalProvider } from "@/providers/modal-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { CalendarAutoSync } from "@/components/calendar/calendar-auto-sync";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Done",
  description: "Outil de gestion de projets pour développeurs web",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Done",
    statusBarStyle: "black-translucent",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

// Script exécuté avant le rendu React pour éviter le flash de couleur au chargement
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('done-theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <ModalProvider>
                {children}
                <ToastProvider />
                <CalendarAutoSync />
              </ModalProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

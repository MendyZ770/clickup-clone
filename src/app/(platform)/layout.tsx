import { requireAuth } from "@/lib/auth-helpers";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QuickActionFab } from "@/components/layout/quick-action-fab";
import { SearchCommand } from "@/components/search/search-command";
import { CapacitorPushInit } from "@/components/capacitor-push-init";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <SidebarProvider>
      <div className="fixed inset-0 flex overflow-hidden bg-background">
        <div className="hidden md:block h-full z-30">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col min-w-0 h-full relative overflow-hidden bg-background/50 dark:bg-background/20">
          {/* Subtle Global Background Glows */}
          <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px] dark:bg-primary/10 z-0" />
          <div className="pointer-events-none absolute top-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px] dark:bg-blue-500/10 z-0" />

          <TopBar />
          <main className="flex-1 pb-20 md:pb-0 page-content overflow-y-auto min-h-0 relative z-10">
            {children}
          </main>
        </div>
        <SearchCommand />
        <MobileNav />
        <QuickActionFab />
        <CapacitorPushInit />
      </div>
    </SidebarProvider>
  );
}

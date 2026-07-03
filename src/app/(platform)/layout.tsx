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
        <div className="flex flex-1 flex-col min-w-0 h-full">
          <TopBar />
          <main className="flex-1 bg-background pb-20 md:pb-0 page-content overflow-y-auto min-h-0">
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

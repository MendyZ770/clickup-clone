import { requireAuth } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SearchCommand } from "@/components/search/search-command";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:contents">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      <SearchCommand />
    </div>
  );
}

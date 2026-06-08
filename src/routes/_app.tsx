import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { useApiKey } from "@/hooks/use-api-key";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { hasKey } = useApiKey();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasKey && typeof window !== "undefined") {
      const path = window.location.pathname;
      // Pages safe to browse without a connected API key (use demo data)
      const publicPaths = [
        "/onboarding", "/settings", "/docs", "/admin/api-keys",
        "/dashboard", "/analytics", "/logs", "/templates",
        "/messages", "/domains", "/usage", "/suppressions", "/webhooks",
        "/send-email", "/health",
      ];
      if (!publicPaths.some(p => path === p || path.startsWith(p + "/"))) {
        navigate({ to: "/login" });
      }
    }
  }, [hasKey, navigate]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopHeader />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

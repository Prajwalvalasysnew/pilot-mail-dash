import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Send, Globe, Mail, BarChart3, ShieldOff,
  Webhook, KeyRound, Settings, BookOpen, Rocket, Activity, Sparkles, ChevronRight,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const nav = [
  { group: "Overview", items: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Onboarding", url: "/onboarding", icon: Rocket },
  ]},
  { group: "Sending", items: [
    { title: "Send Email", url: "/send-email", icon: Send },
    { title: "Messages", url: "/messages", icon: Mail },
    { title: "Domains", url: "/domains", icon: Globe },
  ]},
  { group: "Monitor", items: [
    { title: "Usage & Quota", url: "/usage", icon: BarChart3 },
    { title: "Suppressions", url: "/suppressions", icon: ShieldOff },
    { title: "Webhooks", url: "/webhooks", icon: Webhook },
  ]},
  { group: "Account", items: [
    { title: "API Keys", url: "/admin/api-keys", icon: KeyRound },
    { title: "Settings", url: "/settings", icon: Settings },
    { title: "Docs", url: "/docs", icon: BookOpen },
    { title: "Health", url: "/health", icon: Activity },
  ]},
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-glow">
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">V-Mail Pilot</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/55">
              by Valasys Media
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar px-1.5 py-3">
        {nav.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="group/item relative h-9 rounded-md font-medium text-sidebar-foreground/85 transition-all data-[active=true]:bg-primary/15 data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_1px_oklch(0.58_0.22_22/0.35)] hover:bg-sidebar-accent hover:text-white"
                      >
                        <Link to={item.url}>
                          {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_oklch(0.58_0.22_22/0.6)]" />
                          )}
                          <item.icon className="h-[15px] w-[15px]" strokeWidth={active ? 2.4 : 2} />
                          <span className="text-[13px]">{item.title}</span>
                          {active && <ChevronRight className="ml-auto h-3 w-3 opacity-60 group-data-[collapsible=icon]:hidden" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar">
        <div className="m-2 overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary text-white shadow-glow">
              <Rocket className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold leading-tight text-white">Upgrade to Scale</p>
              <p className="text-[10.5px] text-sidebar-foreground/60">Unlock 1M sends / mo</p>
            </div>
          </div>
          <button className="mt-2.5 w-full rounded-md bg-white/95 px-2 py-1.5 text-[11.5px] font-semibold text-foreground transition hover:bg-white">
            View plans →
          </button>
        </div>
        <div className="px-3 pb-2 text-[10px] text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
          v1.0 · © Valasys Media
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

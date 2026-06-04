import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Send, Globe, Mail, BarChart3, ShieldOff,
  Webhook, KeyRound, Settings, BookOpen, Rocket, Activity, Sparkles,
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
    { title: "Admin API Keys", url: "/admin/api-keys", icon: KeyRound },
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
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-xl bg-white/10" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-[15px] font-bold tracking-tight">V-Mail Pilot</span>
            <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
              by Valasys Media
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1.5 py-3">
        {nav.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="px-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/80">
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
                        className="group/item relative h-9 rounded-lg font-medium transition-all data-[active=true]:bg-gradient-primary-soft data-[active=true]:text-primary data-[active=true]:shadow-sm hover:bg-sidebar-accent"
                      >
                        <Link to={item.url}>
                          {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                          )}
                          <item.icon className="h-4 w-4" strokeWidth={active ? 2.4 : 2} />
                          <span className="text-[13.5px]">{item.title}</span>
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
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="m-2 rounded-lg bg-gradient-primary-soft p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary text-white">
              <Rocket className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold leading-tight">Upgrade plan</p>
              <p className="text-[10.5px] text-muted-foreground">Unlock 1M sends/mo</p>
            </div>
          </div>
        </div>
        <div className="px-3 pb-2 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          v1.0 · © Valasys Media
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

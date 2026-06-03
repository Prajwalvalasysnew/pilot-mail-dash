import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Send, Globe, Mail, BarChart3, ShieldOff,
  Webhook, KeyRound, Settings, BookOpen, Rocket, Activity, Zap,
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">V-Mail Pilot</span>
            <span className="text-xs text-muted-foreground">Valasys Media</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {nav.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          v1.0 · © Valasys Media
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

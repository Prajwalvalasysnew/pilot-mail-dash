import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Send, Globe, Mail, BarChart3, ShieldOff,
  Webhook, KeyRound, Settings, BookOpen, Rocket, Activity, ChevronRight,
  FileText, ScrollText, ChevronsUpDown, Check, Zap, Sparkles,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { group: "Overview", items: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Valasys AI", url: "/ai", icon: Sparkles, badge: "Beta" },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Onboarding", url: "/onboarding", icon: Rocket },
  ]},
  { group: "Sending", items: [
    { title: "Send Email", url: "/send-email", icon: Send },
    { title: "Messages", url: "/messages", icon: Mail },
    { title: "Templates", url: "/templates", icon: FileText },
    { title: "Domains", url: "/domains", icon: Globe },
  ]},
  { group: "Monitor", items: [
    { title: "Event Logs", url: "/logs", icon: ScrollText },
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

const workspaces = [
  { id: "valasys", name: "Valasys Media", env: "Production", plan: "Scale" },
  { id: "acme", name: "Acme Inc.", env: "Production", plan: "Growth" },
  { id: "sandbox", name: "Sandbox", env: "Test", plan: "Free" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname === url || pathname.startsWith(url + "/");
  const current = workspaces[0];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar p-2">
        {/* Workspace switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group/ws flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition hover:bg-sidebar-accent">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-foreground ring-1 ring-white/10">
                <span className="font-display text-[17px] leading-none">V</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-display text-[16px] tracking-tight text-sidebar-foreground">{current.name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/50">
                  <span className="h-1 w-1 rounded-full bg-signal" />
                  {current.env} · {current.plan}
                </span>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 group-hover/ws:text-sidebar-foreground group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Workspaces</DropdownMenuLabel>
            {workspaces.map((w, i) => (
              <DropdownMenuItem key={w.id} className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-primary-soft text-[11px] font-bold text-primary">
                  {w.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold">{w.name}</p>
                  <p className="text-[10.5px] text-muted-foreground">{w.env} · {w.plan}</p>
                </div>
                {i === 0 && <Check className="mt-1 h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-primary"><Rocket className="mr-2 h-3.5 w-3.5" /> Create workspace</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                        className="group/item relative h-8 rounded-sm font-normal text-sidebar-foreground/80 transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:text-white hover:bg-sidebar-accent hover:text-white"
                      >
                        <Link to={item.url}>
                          {active && (
                            <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 bg-signal" />
                          )}
                          <item.icon className="h-[15px] w-[15px]" strokeWidth={active ? 2 : 1.6} />
                          <span className="text-[13px]">{item.title}</span>
                          {"badge" in item && item.badge && (
                            <span className="ml-auto rounded-sm border border-sidebar-border px-1.5 py-px font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
                              {item.badge}
                            </span>
                          )}
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
        <div className="m-2 rounded-sm border border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/50">Monthly sends</p>
            <p className="font-mono text-[10.5px] text-sidebar-foreground/80">26%</p>
          </div>
          <div className="mt-2 h-[3px] overflow-hidden bg-white/8">
            <div className="h-full w-[26%] bg-signal" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="font-mono text-[11px] text-sidebar-foreground/75">384,120<span className="text-sidebar-foreground/40"> / 1,500,000</span></p>
            <button className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-signal hover:underline">
              Upgrade
            </button>
          </div>
        </div>
        <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/35 group-data-[collapsible=icon]:hidden">
          v1.0 — Valasys Media
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

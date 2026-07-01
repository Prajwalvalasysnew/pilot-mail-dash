import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Send, Globe, Mail, BarChart3, ShieldOff,
  Webhook, KeyRound, Settings, BookOpen, Rocket, Activity, ChevronRight,
  FileText, ScrollText, ChevronsUpDown, Check, Zap,
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
    { title: "Analytics", url: "/analytics", icon: BarChart3, badge: "NEW" },
    { title: "Onboarding", url: "/onboarding", icon: Rocket },
  ]},
  { group: "Sending", items: [
    { title: "Send Email", url: "/send-email", icon: Send },
    { title: "Messages", url: "/messages", icon: Mail },
    { title: "Templates", url: "/templates", icon: FileText, badge: "NEW" },
    { title: "Domains", url: "/domains", icon: Globe },
  ]},
  { group: "Monitor", items: [
    { title: "Event Logs", url: "/logs", icon: ScrollText, badge: "LIVE" },
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
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar px-2 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group/ws flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-sidebar-accent">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-primary text-white ring-1 ring-white/10">
                <Zap className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[13px] font-semibold tracking-tight text-sidebar-foreground">{current.name}</span>
                <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-sidebar-foreground/55">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-success" />
                    {current.env}
                  </span>
                  <span className="text-sidebar-foreground/25">·</span>
                  {current.plan}
                </span>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/35 group-hover/ws:text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Workspaces</DropdownMenuLabel>
            {workspaces.map((w, i) => (
              <DropdownMenuItem key={w.id} className="flex items-start gap-2.5 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-foreground ring-1 ring-border">
                  {w.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-tight">{w.name}</p>
                  <p className="text-[11px] text-muted-foreground">{w.env} · {w.plan}</p>
                </div>
                {i === 0 && <Check className="mt-1 h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem><Rocket className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Create workspace</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar px-1.5 py-3">
        {nav.map((group) => (
          <SidebarGroup key={group.group} className="py-1">
            <SidebarGroupLabel className="mb-0.5 px-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-sidebar-foreground/40">
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
                        className="group/item relative h-8 rounded-md px-2 font-medium text-sidebar-foreground/75 transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:text-white hover:bg-sidebar-accent/60 hover:text-white"
                      >
                        <Link to={item.url}>
                          {active && (
                            <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
                          )}
                          <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.2 : 1.75} />
                          <span className="text-[13px] tracking-tight">{item.title}</span>
                          {"badge" in item && item.badge && (
                            <span className={`ml-auto rounded px-1.5 py-px text-[9.5px] font-semibold tracking-wide group-data-[collapsible=icon]:hidden ${
                              item.badge === "LIVE"
                                ? "bg-success/15 text-success"
                                : "bg-primary/15 text-primary-glow"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          {active && !("badge" in item && item.badge) && <ChevronRight className="ml-auto h-3 w-3 opacity-50 group-data-[collapsible=icon]:hidden" />}
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
        <div className="m-2 overflow-hidden rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/15 text-primary-glow">
                <Rocket className="h-3 w-3" />
              </div>
              <p className="text-[12px] font-semibold text-white">Scale plan</p>
            </div>
            <span className="text-[10px] font-medium text-sidebar-foreground/55 tabular">26%</span>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-[26%] rounded-full bg-primary" />
          </div>
          <p className="mt-1.5 text-[10.5px] text-sidebar-foreground/55 tabular">384,210 / 1,500,000 sends</p>
          <button className="mt-2.5 w-full rounded-md border border-sidebar-border bg-transparent px-2 py-1.5 text-[11.5px] font-medium text-white transition hover:bg-sidebar-accent">
            Manage plan
          </button>
        </div>
        <div className="px-3 pb-2 text-[10px] font-medium tracking-wide text-sidebar-foreground/35 group-data-[collapsible=icon]:hidden">
          v1.0 · Valasys Media
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

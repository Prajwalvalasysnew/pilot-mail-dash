import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Moon, Sun, KeyRound, LogOut, User, X, Settings as SettingsIcon, Search, Bell, Command, BookOpen, HelpCircle, Plus, Mail, ChevronDown } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useApiKey } from "@/hooks/use-api-key";
import { useTheme } from "@/hooks/use-theme";

export function TopHeader() {
  const { apiKey, setApiKey } = useApiKey();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const masked = apiKey ? apiKey.slice(0, 6) + "•••" + apiKey.slice(-4) : null;
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => { setCmdOpen(false); navigate({ to }); };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        {/* Env selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11.5px] font-semibold text-foreground transition hover:bg-muted md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" /> Production
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Environment</DropdownMenuLabel>
            <DropdownMenuItem><span className="h-1.5 w-1.5 rounded-full bg-success mr-2" /> Production</DropdownMenuItem>
            <DropdownMenuItem><span className="h-1.5 w-1.5 rounded-full bg-warning mr-2" /> Staging</DropdownMenuItem>
            <DropdownMenuItem><span className="h-1.5 w-1.5 rounded-full bg-info mr-2" /> Sandbox</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Command palette trigger */}
        <button
          onClick={() => setCmdOpen(true)}
          className="ml-1 hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-left text-[13px] text-muted-foreground transition hover:border-primary/40 hover:bg-muted md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Search messages, domains, events…</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium lg:inline-flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {apiKey ? (
            <Badge variant="outline" className="hidden h-8 items-center gap-1.5 rounded-full border-success/30 bg-success/5 px-2.5 font-mono text-[11.5px] font-medium sm:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              <span className="text-foreground">{masked}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="hidden h-8 items-center gap-1.5 rounded-full border-destructive/30 bg-destructive/5 px-2.5 text-[11.5px] font-medium text-destructive sm:inline-flex">
              <X className="h-3 w-3" /> Not connected
            </Badge>
          )}

          <Button asChild size="sm" className="hidden h-8 rounded-md bg-gradient-primary text-white shadow-sm hover:shadow-glow sm:inline-flex">
            <Link to="/send-email"><Plus className="mr-1 h-3.5 w-3.5" /> Send</Link>
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Docs" asChild>
            <Link to="/docs"><BookOpen className="h-4 w-4" /></Link>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative h-9 w-9 rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Notifications">
                <Bell className="mx-auto h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="outline" className="rounded-full text-[10px]">3 new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { icon: Mail, title: "Bounce rate above 2%", desc: "send.beta.app · 2 minutes ago", tone: "warning" as const },
                { icon: KeyRound, title: "New API key created", desc: "by sarah@valasys.io · 1 hour ago", tone: "info" as const },
                { icon: SettingsIcon, title: "DKIM verified", desc: "mail.acme.io · 3 hours ago", tone: "success" as const },
              ].map((n, i) => (
                <DropdownMenuItem key={i} className="flex items-start gap-2.5 py-2.5">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                    n.tone === "warning" ? "bg-warning/15 text-warning-foreground" :
                    n.tone === "success" ? "bg-success/15 text-success" : "bg-info/15 text-info"
                  }`}>
                    <n.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground">{n.desc}</p>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-[12px] text-primary">View all</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-[12px] font-bold text-white shadow-sm transition hover:shadow-glow" aria-label="Account">
                VM
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-[12px] font-bold text-white">VM</div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold">Valasys Media</span>
                    <span className="text-[11px] font-normal text-muted-foreground">admin@valasys.io</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/settings"><User className="mr-2 h-3.5 w-3.5" /> Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/admin/api-keys"><KeyRound className="mr-2 h-3.5 w-3.5" /> API keys</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/settings"><SettingsIcon className="mr-2 h-3.5 w-3.5" /> Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/docs"><HelpCircle className="mr-2 h-3.5 w-3.5" /> Help & support</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => { setApiKey(null); navigate({ to: "/login" }); }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command palette */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search or jump to anything…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => go("/dashboard")}>Dashboard</CommandItem>
            <CommandItem onSelect={() => go("/analytics")}>Analytics</CommandItem>
            <CommandItem onSelect={() => go("/messages")}>Messages</CommandItem>
            <CommandItem onSelect={() => go("/logs")}>Event Logs</CommandItem>
            <CommandItem onSelect={() => go("/templates")}>Templates</CommandItem>
            <CommandItem onSelect={() => go("/domains")}>Domains</CommandItem>
            <CommandItem onSelect={() => go("/webhooks")}>Webhooks</CommandItem>
            <CommandItem onSelect={() => go("/suppressions")}>Suppressions</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go("/send-email")}><Plus className="mr-2 h-3.5 w-3.5" /> Send new email</CommandItem>
            <CommandItem onSelect={() => go("/domains")}>Add a sending domain</CommandItem>
            <CommandItem onSelect={() => go("/admin/api-keys")}>Create API key</CommandItem>
            <CommandItem onSelect={() => go("/webhooks")}>Add a webhook</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={toggle}>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</CommandItem>
            <CommandItem onSelect={() => go("/settings")}>Open settings</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

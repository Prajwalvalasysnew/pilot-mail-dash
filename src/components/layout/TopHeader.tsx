import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, KeyRound, LogOut, User, Check, X, Settings as SettingsIcon, Search, Bell, Command } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApiKey } from "@/hooks/use-api-key";
import { useTheme } from "@/hooks/use-theme";

export function TopHeader() {
  const { apiKey, setApiKey } = useApiKey();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const masked = apiKey ? apiKey.slice(0, 6) + "•••" + apiKey.slice(-4) : null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      {/* Command palette mock */}
      <button className="ml-1 hidden h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-left text-[13px] text-muted-foreground transition hover:border-primary/40 hover:bg-muted md:flex">
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1">Search messages, domains, events…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium lg:inline-flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {apiKey ? (
          <Badge
            variant="outline"
            className="hidden h-8 items-center gap-1.5 rounded-full border-success/30 bg-success/5 px-2.5 font-mono text-[11.5px] font-medium text-success-foreground sm:inline-flex"
          >
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

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-white shadow-sm transition hover:shadow-glow" aria-label="Account">
              <User className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Workspace</span>
                <span className="text-[11px] font-normal text-muted-foreground">Valasys Media</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings"><SettingsIcon className="mr-2 h-4 w-4" /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/login"><KeyRound className="mr-2 h-4 w-4" /> Change API key</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { setApiKey(null); navigate({ to: "/login" }); }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

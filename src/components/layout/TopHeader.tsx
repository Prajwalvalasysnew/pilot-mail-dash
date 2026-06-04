import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, KeyRound, LogOut, User, Check, X, Settings as SettingsIcon } from "lucide-react";
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
  const masked = apiKey ? apiKey.slice(0, 8) + "…" + apiKey.slice(-4) : null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <SidebarTrigger />
      <div className="ml-1 hidden text-[13px] text-muted-foreground md:block">
        Email Delivery Platform
      </div>
      <div className="ml-auto flex items-center gap-2">
        {apiKey ? (
          <Badge
            variant="outline"
            className="hidden gap-1.5 rounded-full border-border bg-card px-2.5 py-1 font-mono text-[12px] font-medium text-foreground sm:inline-flex"
          >
            <Check className="h-3 w-3 text-success" aria-hidden /> {masked}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="hidden gap-1.5 rounded-full border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[12px] font-medium text-destructive sm:inline-flex"
          >
            <X className="h-3 w-3" aria-hidden /> No API key
          </Badge>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/login">
                <KeyRound className="mr-2 h-4 w-4" /> Change API key
              </Link>
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


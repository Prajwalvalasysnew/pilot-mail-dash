import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, KeyRound, LogOut, User, Check, X } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-4">
      <SidebarTrigger />
      <div className="ml-2 hidden text-sm text-muted-foreground md:block">
        Email Delivery Platform
      </div>
      <div className="ml-auto flex items-center gap-2">
        {apiKey ? (
          <Badge variant="outline" className="gap-1 font-mono text-xs">
            <Check className="h-3 w-3 text-success" /> {masked}
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" /> No API key
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
              <Link to="/settings"><Settings /></Link>
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

function Settings() {
  return <><User className="mr-2 h-4 w-4" /> Profile</>;
}

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataToolbar({
  search,
  onSearchChange,
  placeholder = "Search…",
  children,
  className,
}: {
  search?: string;
  onSearchChange?: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border bg-card/40 px-4 py-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      {onSearchChange !== undefined && (
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="h-8 pl-8 pr-8 text-[12.5px]"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{children}</div>
    </div>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-[13px] shadow-xs transition-[box-shadow,border-color,background] duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
          "placeholder:text-muted-foreground/70 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "hover:border-border/80",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/25",
          "disabled:cursor-not-allowed disabled:opacity-55 disabled:bg-muted/40",
          "md:text-[13px]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

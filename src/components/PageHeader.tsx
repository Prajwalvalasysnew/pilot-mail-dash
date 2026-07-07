import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title, description, actions, kicker, className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  kicker?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 border-b border-border pb-6 sm:mb-10", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {kicker && (
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
              {kicker}
            </p>
          )}
          <h1 className="page-title text-foreground">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[13.5px] leading-[1.6] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon, title, description, action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      {Icon && (
        <div className="mb-5 flex h-11 w-11 items-center justify-center border border-border bg-background text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="font-display text-[22px] leading-tight text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

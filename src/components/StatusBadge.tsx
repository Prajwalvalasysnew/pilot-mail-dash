import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-muted text-muted-foreground border-transparent",
  accepted: "bg-info/15 text-info border-info/30",
  sent: "bg-info/15 text-info border-info/30",
  delivered: "bg-success/15 text-success border-success/30",
  opened: "bg-success/15 text-success border-success/30",
  clicked: "bg-success/15 text-success border-success/30",
  soft_bounce: "bg-warning/15 text-warning-foreground border-warning/40",
  soft_bounced: "bg-warning/15 text-warning-foreground border-warning/40",
  hard_bounce: "bg-destructive/15 text-destructive border-destructive/30",
  hard_bounced: "bg-destructive/15 text-destructive border-destructive/30",
  complaint: "bg-destructive/15 text-destructive border-destructive/30",
  complained: "bg-destructive/15 text-destructive border-destructive/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  unsubscribed: "bg-muted text-muted-foreground border-transparent",
  verified: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-transparent";
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", cls, className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

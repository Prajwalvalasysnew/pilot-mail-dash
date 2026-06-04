import {
  CheckCircle2, Circle, Clock, AlertTriangle, XCircle,
  MailCheck, MailX, MousePointerClick, Eye, UserMinus, ShieldOff,
  HelpCircle, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "error" | "info" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  error:   "bg-destructive/10 text-destructive border-destructive/25",
  info:    "bg-info/10 text-info border-info/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

const MAP: Record<string, { tone: Tone; icon: LucideIcon; label?: string }> = {
  // messages
  queued:        { tone: "neutral", icon: Clock },
  accepted:      { tone: "info",    icon: Circle },
  sent:          { tone: "info",    icon: MailCheck },
  delivered:     { tone: "success", icon: CheckCircle2 },
  opened:        { tone: "success", icon: Eye },
  clicked:       { tone: "success", icon: MousePointerClick },
  soft_bounce:   { tone: "warning", icon: AlertTriangle, label: "soft bounce" },
  soft_bounced:  { tone: "warning", icon: AlertTriangle, label: "soft bounce" },
  hard_bounce:   { tone: "error",   icon: MailX, label: "hard bounce" },
  hard_bounced:  { tone: "error",   icon: MailX, label: "hard bounce" },
  complaint:     { tone: "error",   icon: ShieldOff },
  complained:    { tone: "error",   icon: ShieldOff },
  failed:        { tone: "error",   icon: XCircle },
  unsubscribe:   { tone: "warning", icon: UserMinus },
  unsubscribed:  { tone: "warning", icon: UserMinus },
  manual:        { tone: "info",    icon: ShieldOff },
  invalid:       { tone: "neutral", icon: HelpCircle },
  // domains
  verified:      { tone: "success", icon: CheckCircle2 },
  pending:       { tone: "warning", icon: Clock },
  unknown:       { tone: "neutral", icon: HelpCircle },
  // webhooks
  enabled:       { tone: "success", icon: CheckCircle2 },
  disabled:      { tone: "neutral", icon: Circle },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = MAP[status] ?? { tone: "neutral" as Tone, icon: HelpCircle };
  const Icon = entry.icon;
  const label = entry.label ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[12px] font-medium capitalize leading-none",
        TONE_CLASSES[entry.tone],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

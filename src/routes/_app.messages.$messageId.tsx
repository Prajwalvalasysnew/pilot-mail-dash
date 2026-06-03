import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Mail, Clock, Send, CheckCircle2, AlertTriangle, MousePointerClick, Eye, ShieldOff, X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { getMessage, type MessageEvent } from "@/lib/api-client";

export const Route = createFileRoute("/_app/messages/$messageId")({ component: MessageDetailPage });

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  queued: Clock, sent: Send, delivered: CheckCircle2,
  soft_bounce: AlertTriangle, hard_bounce: X, failed: X,
  complaint: ShieldOff, opened: Eye, clicked: MousePointerClick,
  unsubscribed: ShieldOff,
};

function MessageDetailPage() {
  const { messageId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["message", messageId],
    queryFn: () => getMessage(messageId),
  });
  const [active, setActive] = useState<MessageEvent | null>(null);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/messages"><ArrowLeft className="mr-1 h-4 w-4" /> Back to messages</Link>
      </Button>

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
      ) : error ? (
        <Card><CardContent className="p-6 text-destructive">{(error as Error).message}</CardContent></Card>
      ) : data && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Message</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <code className="block max-w-md truncate font-mono text-xs">{data.message.message_id}</code>
                    <CopyButton value={data.message.message_id} />
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={data.message.status} />
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Attempts</p>
                    <p className="text-lg font-semibold">{data.message.attempts}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event timeline</CardTitle>
              <CardDescription>{data.events.length} event{data.events.length === 1 ? "" : "s"}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.events.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No events recorded.</p>
              ) : (
                <ol className="relative space-y-4 border-l-2 border-border pl-6">
                  {data.events.map((evt, i) => {
                    const Icon = EVENT_ICONS[evt.event_type] ?? Clock;
                    return (
                      <li key={i} className="relative">
                        <div className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
                          <Icon className="h-3 w-3" />
                        </div>
                        <button onClick={() => setActive(evt)}
                          className="w-full rounded-lg border bg-card p-3 text-left transition hover:border-primary hover:shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={evt.event_type} />
                              {evt.ip && <span className="text-xs text-muted-foreground">IP: {evt.ip}</span>}
                            </div>
                            <span className="text-xs text-muted-foreground">{format(new Date(evt.occurred_at), "MMM d, yyyy HH:mm:ss")}</span>
                          </div>
                          {evt.user_agent && <p className="mt-1 truncate text-xs text-muted-foreground">{evt.user_agent}</p>}
                          {evt.payload && <p className="mt-1 text-xs text-muted-foreground">Click to view payload</p>}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="capitalize">{active?.event_type.replace(/_/g, " ")}</SheetTitle>
            <SheetDescription>{active && format(new Date(active.occurred_at), "PPpp")}</SheetDescription>
          </SheetHeader>
          {active && (
            <div className="mt-6 space-y-3">
              {active.ip && <Detail label="IP" value={active.ip} />}
              {active.user_agent && <Detail label="User agent" value={active.user_agent} />}
              {active.payload && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Payload</p>
                  <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                    {JSON.stringify(active.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-all text-sm">{value}</p>
    </div>
  );
}

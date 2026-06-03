import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Send, Mail, CheckCircle2, AlertTriangle, ShieldOff,
  Globe, Webhook, TrendingUp, Inbox,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getQuota, getUsage, listMessages } from "@/lib/api-client";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const quotaQ = useQuery({ queryKey: ["quota"], queryFn: getQuota });
  const usageQ = useQuery({ queryKey: ["usage"], queryFn: getUsage });
  const messagesQ = useQuery({ queryKey: ["messages", { limit: 10 }], queryFn: () => listMessages({ limit: 10 }) });

  const daily = usageQ.data?.daily ?? [];
  const today = daily[0];
  const totals = daily.reduce(
    (a, d) => ({ sent: a.sent + d.sent, delivered: a.delivered + d.delivered, bounced: a.bounced + d.bounced, complained: a.complained + d.complained }),
    { sent: 0, delivered: 0, bounced: 0, complained: 0 }
  );
  const deliveryRate = totals.sent ? (totals.delivered / totals.sent) * 100 : 0;
  const bounceRate = totals.sent ? (totals.bounced / totals.sent) * 100 : 0;

  const chartData = [...daily].reverse().map(d => ({
    date: d.usage_date.slice(5),
    sent: d.sent, delivered: d.delivered, bounced: d.bounced,
  }));

  const statusDist = [
    { name: "Delivered", value: totals.delivered, color: "var(--color-chart-2)" },
    { name: "Bounced", value: totals.bounced, color: "var(--color-chart-4)" },
    { name: "Complained", value: totals.complained, color: "var(--color-chart-3)" },
    { name: "Other", value: Math.max(0, totals.sent - totals.delivered - totals.bounced - totals.complained), color: "var(--color-chart-1)" },
  ].filter(s => s.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your email delivery."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/onboarding">Onboarding</Link></Button>
            <Button asChild size="sm"><Link to="/send-email"><Send className="mr-1.5 h-4 w-4" /> Send email</Link></Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Daily sent" value={today?.sent ?? 0} icon={Send} loading={usageQ.isLoading} />
        <KpiCard label="Delivered" value={today?.delivered ?? 0} icon={CheckCircle2} accent="success" loading={usageQ.isLoading} />
        <KpiCard label="Bounced" value={today?.bounced ?? 0} icon={AlertTriangle} accent="warning" loading={usageQ.isLoading} />
        <KpiCard label="Complained" value={today?.complained ?? 0} icon={ShieldOff} accent="destructive" loading={usageQ.isLoading} />
      </div>

      {/* Quotas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <QuotaCard
          title="Daily quota"
          loading={quotaQ.isLoading}
          used={quotaQ.data?.daily.used ?? 0}
          limit={quotaQ.data?.daily.limit ?? 0}
          remaining={quotaQ.data?.daily.remaining ?? 0}
        />
        <QuotaCard
          title="Monthly quota"
          loading={quotaQ.isLoading}
          used={quotaQ.data?.monthly.used ?? 0}
          limit={quotaQ.data?.monthly.limit ?? 0}
          remaining={quotaQ.data?.monthly.remaining ?? 0}
        />
      </div>

      {/* Rates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <RateCard label="Delivery rate" value={deliveryRate} accent="success" />
        <RateCard label="Bounce rate" value={bounceRate} accent="destructive" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily activity</CardTitle>
            <CardDescription>Sent vs Delivered vs Bounced over time</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {usageQ.isLoading ? <Skeleton className="h-full w-full" /> : chartData.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No usage yet" description="Send a test email to see activity here." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="var(--color-chart-1)" strokeWidth={2} />
                  <Line type="monotone" dataKey="delivered" stroke="var(--color-chart-2)" strokeWidth={2} />
                  <Line type="monotone" dataKey="bounced" stroke="var(--color-chart-4)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            {statusDist.length === 0 ? (
              <EmptyState title="No data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {statusDist.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent messages</CardTitle>
            <CardDescription>Latest 10 messages sent</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/messages">View all</Link></Button>
        </CardHeader>
        <CardContent>
          {messagesQ.isLoading ? <Skeleton className="h-40 w-full" />
            : (messagesQ.data?.messages?.length ?? 0) === 0 ? (
              <EmptyState icon={Inbox} title="No messages found" description="Send a test email to see delivery events." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messagesQ.data?.messages?.map((m) => (
                      <TableRow key={m.message_id} className="cursor-pointer">
                        <TableCell className="max-w-[280px] truncate font-medium">
                          <Link to="/messages/$messageId" params={{ messageId: m.message_id }} className="hover:underline">
                            {m.subject || "(no subject)"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.to ?? "—"}</TableCell>
                        <TableCell><StatusBadge status={m.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {m.created_at ? format(new Date(m.created_at), "MMM d, HH:mm") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction icon={Send} title="Send Email" to="/send-email" />
        <QuickAction icon={Globe} title="Add Domain" to="/domains" />
        <QuickAction icon={ShieldOff} title="Add Suppression" to="/suppressions" />
        <QuickAction icon={Webhook} title="Create Webhook" to="/webhooks" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent, loading }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>;
  accent?: "success" | "warning" | "destructive"; loading?: boolean;
}) {
  const color = accent === "success" ? "text-success" : accent === "warning" ? "text-warning-foreground" : accent === "destructive" ? "text-destructive" : "text-primary";
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-2 h-7 w-16" /> : <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function QuotaCard({ title, used, limit, remaining, loading }: { title: string; used: number; limit: number; remaining: number; loading?: boolean }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{loading ? "Loading…" : `${used.toLocaleString()} / ${limit.toLocaleString()} used`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{pct.toFixed(1)}% used</span>
          <span>{remaining.toLocaleString()} remaining</span>
        </div>
      </CardContent>
    </Card>
  );
}

function RateCard({ label, value, accent }: { label: string; value: number; accent: "success" | "destructive" }) {
  const color = accent === "success" ? "text-success" : "text-destructive";
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-semibold ${color}`}>{value.toFixed(2)}%</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, title, to }: { icon: React.ComponentType<{ className?: string }>; title: string; to: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">Quick action</p>
      </div>
    </Link>
  );
}

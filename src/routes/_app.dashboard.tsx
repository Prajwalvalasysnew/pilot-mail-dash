import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Send, CheckCircle2, AlertTriangle, ShieldOff, Globe, Webhook, TrendingUp,
  Inbox, ArrowUpRight, ArrowDownRight, Activity, Mail, MoreHorizontal, Zap,
} from "lucide-react";
import {
  Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Line, LineChart,
  RadialBarChart, RadialBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getQuota, getUsage, listMessages } from "@/lib/api-client";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const quotaQ = useQuery({ queryKey: ["quota"], queryFn: getQuota });
  const usageQ = useQuery({ queryKey: ["usage"], queryFn: getUsage });
  const messagesQ = useQuery({ queryKey: ["messages", { limit: 8 }], queryFn: () => listMessages({ limit: 8 }) });

  const daily = usageQ.data?.daily ?? [];
  const today = daily[0];
  const yesterday = daily[1];
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
  const sparkSent = chartData.map(d => ({ v: d.sent }));
  const sparkDelivered = chartData.map(d => ({ v: d.delivered }));
  const sparkBounced = chartData.map(d => ({ v: d.bounced }));
  const sparkComplained = chartData.map(d => ({ v: 0 }));

  const delta = (a?: number, b?: number) => {
    if (!a || !b) return 0;
    return ((a - b) / b) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Hero header with gradient mesh */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-primary opacity-10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
              <Activity className="h-3 w-3 text-success" />
              All systems operational
            </div>
            <h1 className="page-title">Good to see you 👋</h1>
            <p className="mt-1.5 max-w-xl text-[14px] text-muted-foreground">
              Real-time overview of your email delivery performance, deliverability health and recent activity.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="h-9 rounded-lg">
              <Link to="/onboarding">Onboarding</Link>
            </Button>
            <Button asChild size="sm" className="h-9 rounded-lg bg-gradient-primary shadow-glow hover:opacity-95">
              <Link to="/send-email"><Send className="mr-1.5 h-4 w-4" /> Send email</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards with sparklines */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Sent today" value={today?.sent ?? 0} delta={delta(today?.sent, yesterday?.sent)}
          icon={Send} tone="primary" spark={sparkSent} loading={usageQ.isLoading} />
        <KpiCard label="Delivered" value={today?.delivered ?? 0} delta={delta(today?.delivered, yesterday?.delivered)}
          icon={CheckCircle2} tone="success" spark={sparkDelivered} loading={usageQ.isLoading} />
        <KpiCard label="Bounced" value={today?.bounced ?? 0} delta={delta(today?.bounced, yesterday?.bounced)} invertDelta
          icon={AlertTriangle} tone="warning" spark={sparkBounced} loading={usageQ.isLoading} />
        <KpiCard label="Complaints" value={today?.complained ?? 0} delta={0} invertDelta
          icon={ShieldOff} tone="danger" spark={sparkComplained} loading={usageQ.isLoading} />
      </div>

      {/* Main grid: chart + health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Delivery activity</CardTitle>
              <CardDescription>Sent · Delivered · Bounced — last {chartData.length || 0} days</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <Legend swatch="var(--color-chart-1)" label="Sent" />
              <Legend swatch="var(--color-chart-2)" label="Delivered" />
              <Legend swatch="var(--color-chart-4)" label="Bounced" />
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-0">
            {usageQ.isLoading ? <Skeleton className="h-full w-full" /> : chartData.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No usage yet" description="Send a test email to see activity here." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBou" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.30} />
                      <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      boxShadow: "var(--shadow-md)",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#gSent)" />
                  <Area type="monotone" dataKey="delivered" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#gDel)" />
                  <Area type="monotone" dataKey="bounced" stroke="var(--color-chart-4)" strokeWidth={2} fill="url(#gBou)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Deliverability health — radial */}
        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Deliverability health</CardTitle>
            <CardDescription>Composite score over period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%" outerRadius="100%"
                  data={[{ name: "score", value: Math.max(0, Math.min(100, deliveryRate)), fill: "url(#gradHealth)" }]}
                  startAngle={220} endAngle={-40}
                >
                  <defs>
                    <linearGradient id="gradHealth" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" />
                      <stop offset="100%" stopColor="var(--color-chart-1)" />
                    </linearGradient>
                  </defs>
                  <RadialBar background={{ fill: "var(--color-muted)" }} dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Delivery</span>
                <span className="text-4xl font-bold tracking-tight text-gradient-primary">
                  {deliveryRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">Bounce</p>
                <p className="mt-0.5 text-base font-bold text-warning-foreground">{bounceRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">Complaints</p>
                <p className="mt-0.5 text-base font-bold text-destructive">
                  {totals.sent ? ((totals.complained / totals.sent) * 100).toFixed(2) : "0.00"}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotas + recent */}
      <div className="grid gap-4 lg:grid-cols-3">
        <QuotaCard
          title="Daily quota"
          icon={Zap}
          loading={quotaQ.isLoading}
          used={quotaQ.data?.daily.used ?? 0}
          limit={quotaQ.data?.daily.limit ?? 0}
          remaining={quotaQ.data?.daily.remaining ?? 0}
        />
        <QuotaCard
          title="Monthly quota"
          icon={Mail}
          loading={quotaQ.isLoading}
          used={quotaQ.data?.monthly.used ?? 0}
          limit={quotaQ.data?.monthly.limit ?? 0}
          remaining={quotaQ.data?.monthly.remaining ?? 0}
        />
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick actions</CardTitle>
            <CardDescription>Get more done in a click</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <QuickAction icon={Send} title="Send email" to="/send-email" />
            <QuickAction icon={Globe} title="Add domain" to="/domains" />
            <QuickAction icon={ShieldOff} title="Suppression" to="/suppressions" />
            <QuickAction icon={Webhook} title="Webhook" to="/webhooks" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent messages</CardTitle>
            <CardDescription>Latest activity across your account</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
            <Link to="/messages">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {messagesQ.isLoading ? <div className="p-6"><Skeleton className="h-40 w-full" /></div>
            : (messagesQ.data?.messages?.length ?? 0) === 0 ? (
              <div className="p-6">
                <EmptyState icon={Inbox} title="No messages yet" description="Send a test email to see delivery events." />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {messagesQ.data?.messages?.map((m) => (
                  <Link
                    key={m.message_id}
                    to="/messages/$messageId"
                    params={{ messageId: m.message_id }}
                    className="group flex items-center gap-4 px-5 py-3 transition hover:bg-muted/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary-soft text-primary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{m.subject || "(no subject)"}</p>
                      <p className="truncate text-[12px] text-muted-foreground">to {m.to ?? "—"}</p>
                    </div>
                    <StatusBadge status={m.status} />
                    <span className="hidden w-24 text-right text-[11.5px] tabular-nums text-muted-foreground sm:inline">
                      {m.created_at ? format(new Date(m.created_at), "MMM d, HH:mm") : "—"}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: swatch }} /> {label}
    </span>
  );
}

function KpiCard({ label, value, delta, icon: Icon, tone, spark, loading, invertDelta }: {
  label: string; value: number; delta: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "danger";
  spark: { v: number }[]; loading?: boolean; invertDelta?: boolean;
}) {
  const stroke = {
    primary: "var(--color-chart-1)",
    success: "var(--color-chart-2)",
    warning: "var(--color-chart-3)",
    danger: "var(--color-chart-4)",
  }[tone];
  const iconBg = {
    primary: "bg-gradient-primary",
    success: "bg-gradient-success",
    warning: "bg-gradient-warning",
    danger: "bg-gradient-danger",
  }[tone];
  const isUp = delta >= 0;
  const positive = invertDelta ? !isUp : isUp;
  const deltaColor = delta === 0 ? "text-muted-foreground" : positive ? "text-success" : "text-destructive";

  return (
    <Card className="group relative overflow-hidden border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 text-[28px] font-bold leading-none tracking-tight tabular-nums">
                {value.toLocaleString()}
              </p>
            )}
            {!loading && (
              <div className={`mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold ${deltaColor}`}>
                {delta === 0 ? "—" : (
                  <>
                    {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(delta).toFixed(1)}%
                  </>
                )}
                <span className="font-normal text-muted-foreground">vs yesterday</span>
              </div>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${iconBg}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="-mb-2 -mx-1 mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark.length ? spark : [{ v: 0 }, { v: 0 }]}>
              <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function QuotaCard({ title, used, limit, remaining, loading, icon: Icon }: {
  title: string; used: number; limit: number; remaining: number; loading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const tone = pct >= 90 ? "danger" : pct >= 75 ? "warning" : "primary";
  const fill = tone === "danger" ? "bg-gradient-danger" : tone === "warning" ? "bg-gradient-warning" : "bg-gradient-primary";
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary-soft text-primary">
              <Icon className="h-3.5 w-3.5" />
            </span>
            {title}
          </CardTitle>
          <Badge variant="outline" className="rounded-full text-[10.5px]">{pct.toFixed(0)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums">{loading ? "…" : used.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">/ {loading ? "—" : limit.toLocaleString()}</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${fill} transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex justify-between text-[11.5px] text-muted-foreground">
          <span>{remaining.toLocaleString()} remaining</span>
          <span className={pct >= 90 ? "font-semibold text-destructive" : pct >= 75 ? "font-semibold text-warning-foreground" : ""}>
            {pct >= 90 ? "Near limit" : pct >= 75 ? "Watch usage" : "Healthy"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, title, to }: { icon: React.ComponentType<{ className?: string }>; title: string; to: string }) {
  return (
    <Link to={to} className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary-soft text-primary transition group-hover:bg-gradient-primary group-hover:text-white">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[12.5px] font-semibold leading-tight">{title}</p>
    </Link>
  );
}

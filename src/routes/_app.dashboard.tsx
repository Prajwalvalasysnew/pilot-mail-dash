import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Send, CheckCircle2, AlertTriangle, ShieldOff, Globe, TrendingUp,
  Inbox, ArrowUpRight, ArrowDownRight, Activity, Mail, Zap,
  MousePointerClick, Eye, Server, MapPin, Clock, Sparkles,
} from "lucide-react";
import {
  Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Line, LineChart, RadialBarChart, RadialBar, Bar, BarChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getQuota, getUsage, listMessages } from "@/lib/api-client";
import {
  demoUsage, demoQuota, demoMessages, demoTopDomains, demoCountries,
  demoEventStream, demoIpReputation,
} from "@/lib/demo-data";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const quotaQ = useQuery({ queryKey: ["quota"], queryFn: getQuota, retry: false });
  const usageQ = useQuery({ queryKey: ["usage"], queryFn: getUsage, retry: false });
  const messagesQ = useQuery({ queryKey: ["messages", { limit: 6 }], queryFn: () => listMessages({ limit: 6 }), retry: false });

  // Fall back to dummy data when API not available / empty
  const daily = usageQ.data?.daily?.length ? usageQ.data.daily : demoUsage;
  const quota = quotaQ.data ?? demoQuota;
  const messages = messagesQ.data?.messages?.length ? messagesQ.data.messages : demoMessages.slice(0, 6);

  const today = daily[0];
  const yesterday = daily[1];
  const totals = daily.reduce(
    (a, d) => ({ sent: a.sent + d.sent, delivered: a.delivered + d.delivered, bounced: a.bounced + d.bounced, complained: a.complained + d.complained }),
    { sent: 0, delivered: 0, bounced: 0, complained: 0 }
  );
  const deliveryRate = totals.sent ? (totals.delivered / totals.sent) * 100 : 0;
  const bounceRate = totals.sent ? (totals.bounced / totals.sent) * 100 : 0;
  const openRate = 64.3;
  const clickRate = 18.7;

  const chartData = [...daily].reverse().map(d => ({
    date: d.usage_date.slice(5),
    sent: d.sent, delivered: d.delivered, bounced: d.bounced * 10,
  }));
  const sparkSent = chartData.map(d => ({ v: d.sent }));
  const sparkDelivered = chartData.map(d => ({ v: d.delivered }));
  const sparkOpen = chartData.map((d, i) => ({ v: Math.round(d.delivered * (0.6 + Math.sin(i / 2) * 0.08)) }));
  const sparkClick = chartData.map((d, i) => ({ v: Math.round(d.delivered * (0.18 + Math.cos(i / 2) * 0.04)) }));

  const delta = (a?: number, b?: number) => (!a || !b ? 0 : ((a - b) / b) * 100);

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="absolute inset-0 bg-mesh opacity-80" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-primary opacity-[0.07] blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/8 px-2.5 py-1 text-[11px] font-medium text-success">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              All systems operational · 99.99% uptime
            </div>
            <h1 className="page-title">Delivery Overview</h1>
            <p className="mt-1.5 max-w-xl text-[13.5px] text-muted-foreground">
              Real-time pulse of your sending performance, deliverability health and recent message activity across all domains.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="h-9 rounded-md">
              <Link to="/domains"><Globe className="mr-1.5 h-3.5 w-3.5" /> Domains</Link>
            </Button>
            <Button asChild size="sm" className="h-9 rounded-md bg-gradient-primary text-white shadow-glow hover:opacity-95">
              <Link to="/send-email"><Send className="mr-1.5 h-4 w-4" /> Send email</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Sent (24h)" value={today?.sent ?? 0} delta={delta(today?.sent, yesterday?.sent)}
          icon={Send} tone="primary" spark={sparkSent} suffix="" />
        <KpiCard label="Delivered" value={today?.delivered ?? 0} delta={delta(today?.delivered, yesterday?.delivered)}
          icon={CheckCircle2} tone="success" spark={sparkDelivered} suffix="" subValue={`${((today?.delivered ?? 0) / Math.max(1, today?.sent ?? 1) * 100).toFixed(2)}% rate`} />
        <KpiCard label="Open rate" value={openRate} delta={2.4}
          icon={Eye} tone="info" spark={sparkOpen} suffix="%" subValue="industry avg 21.3%" />
        <KpiCard label="Click rate" value={clickRate} delta={-0.8}
          icon={MousePointerClick} tone="warning" spark={sparkClick} suffix="%" subValue="industry avg 2.6%" />
      </div>

      {/* Chart + Health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border bg-muted/30 py-3">
            <div>
              <CardTitle className="text-[14px] font-semibold">Delivery activity</CardTitle>
              <CardDescription className="text-[12px]">Sent · Delivered · Bounced (10×) — last 14 days</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <Legend swatch="var(--color-chart-1)" label="Sent" />
              <Legend swatch="var(--color-chart-2)" label="Delivered" />
              <Legend swatch="var(--color-chart-3)" label="Bounced" />
            </div>
          </CardHeader>
          <CardContent className="h-72 p-3">
            {usageQ.isLoading && !daily.length ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
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
                      borderRadius: 8,
                      boxShadow: "var(--shadow-md)",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="var(--color-chart-1)" strokeWidth={2.25} fill="url(#gSent)" />
                  <Area type="monotone" dataKey="delivered" stroke="var(--color-chart-2)" strokeWidth={2.25} fill="url(#gDel)" />
                  <Area type="monotone" dataKey="bounced" stroke="var(--color-chart-3)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 py-3">
            <CardTitle className="text-[14px] font-semibold">Deliverability score</CardTitle>
            <CardDescription className="text-[12px]">Composite reputation index</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="72%" outerRadius="100%"
                  data={[{ name: "score", value: Math.max(0, Math.min(100, deliveryRate)), fill: "url(#gradHealth)" }]}
                  startAngle={220} endAngle={-40}
                >
                  <defs>
                    <linearGradient id="gradHealth" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-5)" />
                      <stop offset="100%" stopColor="var(--color-chart-1)" />
                    </linearGradient>
                  </defs>
                  <RadialBar background={{ fill: "var(--color-muted)" }} dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Score</span>
                <span className="text-[32px] font-bold leading-none tracking-tight text-gradient-primary">
                  {deliveryRate.toFixed(1)}
                </span>
                <span className="mt-1 text-[10.5px] text-success font-semibold">Excellent</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <MiniStat label="Bounce" value={`${bounceRate.toFixed(2)}%`} tone={bounceRate > 2 ? "danger" : "success"} />
              <MiniStat label="Complaint" value={`${(totals.complained / Math.max(1, totals.sent) * 100).toFixed(3)}%`} tone="success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top domains + Event stream */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 py-3">
            <div>
              <CardTitle className="text-[14px] font-semibold">Top recipient domains</CardTitle>
              <CardDescription className="text-[12px]">Performance by mailbox provider · last 30d</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full text-[10.5px] font-medium">6 ISPs</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5 text-left">Domain</th>
                    <th className="px-2 py-2.5 text-right">Sent</th>
                    <th className="px-2 py-2.5 text-right">Delivered</th>
                    <th className="px-2 py-2.5 text-right">Opened</th>
                    <th className="px-2 py-2.5 text-right">Clicked</th>
                    <th className="px-4 py-2.5 text-right">Deliverability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {demoTopDomains.map((d) => (
                    <tr key={d.domain} className="transition hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-primary-soft text-[10px] font-bold text-primary">
                            {d.domain[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{d.domain}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums">{d.sent.toLocaleString()}</td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{d.delivered.toLocaleString()}</td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{d.opened.toLocaleString()}</td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{d.clicked.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-gradient-success" style={{ width: `${d.deliverability}%` }} />
                          </div>
                          <span className="w-12 font-mono text-[11.5px] font-semibold tabular-nums text-success">{d.deliverability.toFixed(2)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Live event stream */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 py-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Live events
              </CardTitle>
              <CardDescription className="text-[12px]">Streaming in real-time</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] text-primary hover:text-primary">
              <Link to="/messages">All <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {demoEventStream.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-muted/40">
                  <StatusBadge status={e.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium">{e.subject}</p>
                    <p className="truncate text-[11px] text-muted-foreground">→ {e.to}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">{e.ago}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotas + IP reputation + Geo */}
      <div className="grid gap-4 lg:grid-cols-3">
        <QuotaCard title="Daily quota" icon={Zap}
          used={quota.daily.used} limit={quota.daily.limit} remaining={quota.daily.remaining} />
        <QuotaCard title="Monthly quota" icon={Mail}
          used={quota.monthly.used} limit={quota.monthly.limit} remaining={quota.monthly.remaining} />

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 py-3">
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Geographic reach
            </CardTitle>
            <CardDescription className="text-[12px]">Top sending regions</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {demoCountries.slice(0, 6).map((c) => (
                <div key={c.code} className="flex items-center gap-3 text-[12px]">
                  <span className="w-7 font-mono text-[10.5px] font-semibold text-muted-foreground">{c.code}</span>
                  <span className="flex-1 truncate">{c.country}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-primary" style={{ width: `${(c.share / 50) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono tabular-nums text-muted-foreground">{c.share.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IP reputation table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 py-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
              <Server className="h-3.5 w-3.5 text-primary" /> Dedicated IP reputation
            </CardTitle>
            <CardDescription className="text-[12px]">Sender reputation across your IP pools</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full text-[10.5px]">5 IPs · 3 pools</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 text-left">IP Address</th>
                  <th className="px-2 py-2.5 text-left">Pool</th>
                  <th className="px-2 py-2.5 text-right">Sent (24h)</th>
                  <th className="px-2 py-2.5 text-left">Reputation</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoIpReputation.map((ip) => {
                  const tone = ip.reputation >= 90 ? "success" : ip.reputation >= 75 ? "info" : ip.reputation >= 60 ? "warning" : "danger";
                  const fill = tone === "success" ? "bg-gradient-success" : tone === "warning" ? "bg-gradient-warning" : tone === "danger" ? "bg-gradient-danger" : "bg-gradient-primary";
                  return (
                    <tr key={ip.ip} className="transition hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-mono text-[12px] font-medium">{ip.ip}</td>
                      <td className="px-2 py-2.5">
                        <Badge variant="secondary" className="rounded-md text-[10.5px] font-medium">{ip.pool}</Badge>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums">{ip.sent24h.toLocaleString()}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full ${fill}`} style={{ width: `${ip.reputation}%` }} />
                          </div>
                          <span className="w-8 font-mono text-[11.5px] font-semibold tabular-nums">{ip.reputation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize ${
                          tone === "success" ? "bg-success/10 text-success" :
                          tone === "warning" ? "bg-warning/15 text-warning-foreground" :
                          tone === "danger" ? "bg-destructive/10 text-destructive" :
                          "bg-info/10 text-info"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : tone === "danger" ? "bg-destructive" : "bg-info"
                          }`} />
                          {ip.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 py-3">
          <div>
            <CardTitle className="text-[14px] font-semibold">Recent messages</CardTitle>
            <CardDescription className="text-[12px]">Latest delivery activity across your account</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 text-[11.5px] text-primary hover:text-primary">
            <Link to="/messages">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="p-6"><EmptyState icon={Inbox} title="No messages yet" description="Send a test email to see delivery events." /></div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((m) => (
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
                    <p className="truncate text-[13px] font-medium">{m.subject || "(no subject)"}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground">→ {m.to ?? "—"}</p>
                  </div>
                  <StatusBadge status={m.status} />
                  <span className="hidden w-24 text-right font-mono text-[11px] tabular-nums text-muted-foreground sm:inline">
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

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "danger" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning-foreground" : "text-destructive";
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-mono text-[13.5px] font-bold tabular-nums ${cls}`}>{value}</p>
    </div>
  );
}

function KpiCard({ label, value, delta, icon: Icon, tone, spark, suffix, subValue }: {
  label: string; value: number; delta: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "danger" | "info";
  spark: { v: number }[]; suffix?: string; subValue?: string;
}) {
  const stroke = {
    primary: "var(--color-chart-1)",
    success: "var(--color-chart-5)",
    warning: "var(--color-chart-3)",
    danger: "var(--color-chart-1)",
    info: "var(--color-chart-2)",
  }[tone];
  const iconBg = {
    primary: "bg-gradient-primary",
    success: "bg-gradient-success",
    warning: "bg-gradient-warning",
    danger: "bg-gradient-danger",
    info: "bg-[linear-gradient(135deg,oklch(0.62_0.15_200),oklch(0.55_0.18_220))]",
  }[tone];
  const isUp = delta >= 0;
  const deltaColor = delta === 0 ? "text-muted-foreground" : isUp ? "text-success" : "text-destructive";

  return (
    <Card className="group relative overflow-hidden border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-[26px] font-bold leading-none tracking-tight tabular-nums">
              {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}{suffix}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-0.5 rounded px-1 text-[10.5px] font-semibold ${deltaColor} ${delta !== 0 ? (isUp ? "bg-success/10" : "bg-destructive/10") : ""}`}>
                {delta !== 0 && (isUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />)}
                {delta === 0 ? "—" : `${Math.abs(delta).toFixed(1)}%`}
              </span>
              <span className="truncate text-[10.5px] text-muted-foreground">{subValue ?? "vs prior period"}</span>
            </div>
          </div>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="-mx-1 -mb-2 mt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark.length ? spark : [{ v: 0 }, { v: 0 }]}>
              <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function QuotaCard({ title, used, limit, remaining, icon: Icon }: {
  title: string; used: number; limit: number; remaining: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const tone = pct >= 90 ? "danger" : pct >= 75 ? "warning" : "primary";
  const fill = tone === "danger" ? "bg-gradient-danger" : tone === "warning" ? "bg-gradient-warning" : "bg-gradient-primary";
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border bg-muted/30 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
            <Icon className="h-3.5 w-3.5 text-primary" /> {title}
          </CardTitle>
          <Badge variant="outline" className="rounded-full text-[10.5px] font-semibold">{pct.toFixed(1)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[22px] font-bold leading-none tabular-nums">{used.toLocaleString()}</span>
            <span className="font-mono text-[11.5px] text-muted-foreground">/ {limit.toLocaleString()}</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${fill} transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{remaining.toLocaleString()} remaining</span>
          <span className={pct >= 90 ? "font-semibold text-destructive" : pct >= 75 ? "font-semibold text-warning-foreground" : "font-semibold text-success"}>
            {pct >= 90 ? "Near limit" : pct >= 75 ? "Watch usage" : "Healthy"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

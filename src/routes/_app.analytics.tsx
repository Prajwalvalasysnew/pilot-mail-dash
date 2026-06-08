import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, Download, Filter, Globe2, Mail, Smartphone, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import {
  demoUsage, demoDevices, demoMailClients, demoHeatmap, demoBounceReasons, demoCountries,
} from "@/lib/demo-data";

export const Route = createFileRoute("/_app/analytics")({ component: AnalyticsPage });

const RANGES = [
  { v: "24h", l: "Last 24 hours" },
  { v: "7d", l: "Last 7 days" },
  { v: "30d", l: "Last 30 days" },
  { v: "90d", l: "Last 90 days" },
];

function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const chart = [...demoUsage].reverse().map(d => ({
    date: d.usage_date.slice(5),
    delivered: d.delivered,
    opens: Math.round(d.delivered * 0.62),
    clicks: Math.round(d.delivered * 0.18),
    bounces: d.bounced * 8,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Engagement, deliverability and audience insights across every send."
        actions={
          <>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{RANGES.map(r => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9"><Filter className="mr-1.5 h-3.5 w-3.5" /> Filters</Button>
            <Button variant="outline" size="sm" className="h-9"><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
          </>
        }
      />

      {/* Metric pills */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricPill label="Total delivered" value="1,284,021" delta={+8.4} tone="success" />
        <MetricPill label="Unique opens" value="794,318" delta={+12.1} tone="info" subtitle="61.9% open rate" />
        <MetricPill label="Unique clicks" value="231,840" delta={+4.7} tone="primary" subtitle="18.0% CTOR" />
        <MetricPill label="Hard bounces" value="3,420" delta={-1.2} tone="warning" subtitle="0.27% rate" />
      </div>

      {/* Engagement chart */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between border-b border-border bg-muted/30 py-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Engagement over time
            </CardTitle>
            <CardDescription className="text-[12px]">Deliveries, opens, clicks and bounces (×8 scale)</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Legend swatch="var(--color-chart-2)" label="Delivered" />
            <Legend swatch="var(--color-chart-5)" label="Opens" />
            <Legend swatch="var(--color-chart-4)" label="Clicks" />
            <Legend swatch="var(--color-chart-1)" label="Bounces" />
          </div>
        </CardHeader>
        <CardContent className="h-80 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                {["Del", "Op", "Cl"].map((k, i) => (
                  <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={`var(--color-chart-${[2, 5, 4][i]})`} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={`var(--color-chart-${[2, 5, 4][i]})`} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="delivered" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#gDel)" />
              <Area type="monotone" dataKey="opens" stroke="var(--color-chart-5)" strokeWidth={2} fill="url(#gOp)" />
              <Area type="monotone" dataKey="clicks" stroke="var(--color-chart-4)" strokeWidth={2} fill="url(#gCl)" />
              <Area type="monotone" dataKey="bounces" stroke="var(--color-chart-1)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Heatmap + Devices + Mail clients */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 py-3">
            <CardTitle className="text-[14px] font-semibold">Send volume by hour & weekday</CardTitle>
            <CardDescription className="text-[12px]">Identifies your engagement window</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Heatmap data={demoHeatmap} />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 py-3">
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
              <Smartphone className="h-3.5 w-3.5 text-primary" /> Open by device
            </CardTitle>
            <CardDescription className="text-[12px]">Where opens happen</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={demoDevices} dataKey="value" innerRadius={42} outerRadius={66} paddingAngle={2}>
                    {demoDevices.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {demoDevices.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="flex-1 text-muted-foreground">{d.name}</span>
                  <span className="font-mono font-semibold tabular-nums">{d.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mail clients + Bounce reasons + Geo */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 py-3">
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
              <Mail className="h-3.5 w-3.5 text-primary" /> Top mail clients
            </CardTitle>
            <CardDescription className="text-[12px]">Open share by client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {demoMailClients.map(c => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{c.opens.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-primary" style={{ width: `${c.share}%` }} />
                  </div>
                  <span className="w-12 text-right font-mono text-[11px] font-semibold tabular-nums">{c.share}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 py-3">
            <CardTitle className="text-[14px] font-semibold">Bounce reasons</CardTitle>
            <CardDescription className="text-[12px]">Why messages failed delivery</CardDescription>
          </CardHeader>
          <CardContent className="p-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demoBounceReasons} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="reason" fontSize={11} width={108} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 py-3">
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
              <Globe2 className="h-3.5 w-3.5 text-primary" /> Geographic distribution
            </CardTitle>
            <CardDescription className="text-[12px]">Recipient region share</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {demoCountries.map(c => (
              <div key={c.code} className="flex items-center gap-3 text-[12px]">
                <div className="flex h-6 w-9 items-center justify-center rounded border border-border bg-muted/40 font-mono text-[10px] font-bold">{c.code}</div>
                <span className="flex-1 truncate">{c.country}</span>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-primary" style={{ width: `${(c.share / 50) * 100}%` }} />
                </div>
                <span className="w-12 text-right font-mono tabular-nums text-muted-foreground">{c.share.toFixed(1)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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

function MetricPill({ label, value, delta, tone, subtitle }: { label: string; value: string; delta: number; tone: "success" | "info" | "warning" | "primary"; subtitle?: string }) {
  const up = delta >= 0;
  const ring = { success: "ring-success/15", info: "ring-info/15", warning: "ring-warning/20", primary: "ring-primary/15" }[tone];
  const dot = { success: "bg-success", info: "bg-info", warning: "bg-warning", primary: "bg-primary" }[tone];
  return (
    <Card className={`relative overflow-hidden border-border shadow-sm ring-1 ${ring}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        </div>
        <p className="mt-1.5 text-[28px] font-bold leading-none tracking-tight tabular-nums">{value}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{subtitle}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {up ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Heatmap({ data }: { data: number[][] }) {
  const max = Math.max(...data.flat());
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-1 ml-10 grid grid-cols-24 gap-[2px] text-[9px] text-muted-foreground" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
          {Array.from({ length: 24 }).map((_, h) => (
            <span key={h} className="text-center">{h % 3 === 0 ? `${h}h` : ""}</span>
          ))}
        </div>
        {data.map((row, di) => (
          <div key={di} className="mb-[2px] flex items-center gap-2">
            <span className="w-8 text-right text-[10.5px] font-semibold text-muted-foreground">{days[di]}</span>
            <div className="grid flex-1 gap-[2px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
              {row.map((v, hi) => {
                const intensity = v / max;
                const a = Math.max(0.05, intensity);
                return (
                  <div
                    key={hi}
                    title={`${days[di]} ${hi}:00 — ${v.toLocaleString()} sends`}
                    className="aspect-square rounded-[3px] transition hover:ring-2 hover:ring-primary/40"
                    style={{ background: `oklch(0.58 0.22 22 / ${a.toFixed(3)})` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-3 ml-10 flex items-center gap-2 text-[10.5px] text-muted-foreground">
          <span>Less</span>
          {[0.1, 0.25, 0.45, 0.7, 1].map(a => (
            <span key={a} className="h-3 w-5 rounded-sm" style={{ background: `oklch(0.58 0.22 22 / ${a})` }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

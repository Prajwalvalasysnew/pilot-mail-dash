import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { getUsage, getQuota } from "@/lib/api-client";

export const Route = createFileRoute("/_app/usage")({ component: UsagePage });

function UsagePage() {
  const usageQ = useQuery({ queryKey: ["usage"], queryFn: getUsage });
  const quotaQ = useQuery({ queryKey: ["quota"], queryFn: getQuota });
  const daily = usageQ.data?.daily ?? [];
  const chartData = [...daily].reverse().map(d => ({ date: d.usage_date.slice(5), ...d }));
  const totalComplaints = daily.reduce((a, d) => a + d.complained, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Usage & Quota" description="Monitor sending volume and quota consumption." />

      <div className="grid gap-4 lg:grid-cols-2">
        <QuotaCard title="Daily quota" loading={quotaQ.isLoading}
          used={quotaQ.data?.daily.used ?? 0} limit={quotaQ.data?.daily.limit ?? 0}
          pct={(quotaQ.data?.daily.pct ?? 0) * 100} remaining={quotaQ.data?.daily.remaining ?? 0} />
        <QuotaCard title="Monthly quota" loading={quotaQ.isLoading}
          used={quotaQ.data?.monthly.used ?? 0} limit={quotaQ.data?.monthly.limit ?? 0}
          pct={(quotaQ.data?.monthly.pct ?? 0) * 100} remaining={quotaQ.data?.monthly.remaining ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily volume</CardTitle>
            <CardDescription>Delivered vs Bounced per day</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {usageQ.isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="delivered" fill="var(--color-chart-2)" radius={[4,4,0,0]} />
                  <Bar dataKey="bounced" fill="var(--color-chart-4)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Complaints</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-destructive">{totalComplaints}</p>
            <p className="mt-1 text-sm text-muted-foreground">Total complaints across visible period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Daily breakdown</CardTitle></CardHeader>
        <CardContent>
          {usageQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Sent</TableHead>
                  <TableHead>Delivered</TableHead><TableHead>Bounced</TableHead>
                  <TableHead>Complained</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daily.map(d => (
                  <TableRow key={d.usage_date}>
                    <TableCell>{d.usage_date}</TableCell>
                    <TableCell>{d.sent}</TableCell>
                    <TableCell className="text-success">{d.delivered}</TableCell>
                    <TableCell className="text-destructive">{d.bounced}</TableCell>
                    <TableCell>{d.complained}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuotaCard({ title, used, limit, pct, remaining, loading }: { title: string; used: number; limit: number; pct: number; remaining: number; loading?: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Skeleton className="h-16 w-full" /> : (<>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{used.toLocaleString()}</span>
            <span className="text-muted-foreground">/ {limit.toLocaleString()}</span>
          </div>
          <Progress value={Math.min(100, pct)} />
          <p className="text-xs text-muted-foreground">{remaining.toLocaleString()} remaining ({pct.toFixed(2)}% used)</p>
        </>)}
      </CardContent>
    </Card>
  );
}

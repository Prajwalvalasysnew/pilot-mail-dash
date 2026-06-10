import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getHealth, getApiBase, type HealthResponse } from "@/lib/api-client";

export const Route = createFileRoute("/health")({ component: HealthPage });

function HealthPage() {
  const [state, setState] = useState<{ loading: boolean; data?: HealthResponse; error?: string }>({ loading: true });

  const run = async () => {
    setState({ loading: true });
    try {
      const data = await getHealth();
      setState({ loading: false, data });
    } catch (e) {
      setState({ loading: false, error: (e as Error).message });
    }
  };
  useEffect(() => { run(); }, []);

  const online = !!state.data && state.data.status === "ok";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to dashboard
        </Link>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Platform Health
              </CardTitle>
              <Button variant="outline" size="sm" onClick={run} disabled={state.loading}>
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${state.loading ? "animate-spin" : ""}`} /> Re-check
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-card p-4">
              <span className="text-sm text-muted-foreground">Connection</span>
              {state.loading ? (
                <Badge variant="outline">Checking…</Badge>
              ) : online ? (
                <Badge className="gap-1 bg-success text-success-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Online</Badge>
              ) : (
                <Badge variant="destructive" className="gap-1"><XCircle className="h-3.5 w-3.5" /> Offline</Badge>
              )}
            </div>
            <Row label="API Base URL" value={getApiBase()} mono />
            <Row label="Status" value={state.data?.status ?? (state.error ? "error" : "—")} />
            <Row label="Server" value={state.data ? "reachable" : "—"} mono />
            {state.error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

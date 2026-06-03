import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";
import { useApiKey } from "@/hooks/use-api-key";
import { useTheme } from "@/hooks/use-theme";
import { apiRequest, setApiBase, getApiBase } from "@/lib/api-client";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { apiKey, setApiKey } = useApiKey();
  const { theme, setTheme } = useTheme();
  const [base, setBase] = useState(getApiBase());
  const [devMode, setDevMode] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("vmp_dev") === "1");
  const [reveal, setReveal] = useState(false);
  const navigate = useNavigate();

  const testMut = useMutation({
    mutationFn: () => apiRequest("/v1/usage/quota"),
    onSuccess: () => toast.success("Connected successfully"),
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your API connection and preferences." />

      <Card>
        <CardHeader>
          <CardTitle>API Connection</CardTitle>
          <CardDescription>Authentication status: {apiKey ? <Badge className="ml-1 bg-success text-success-foreground">Connected</Badge> : <Badge variant="destructive" className="ml-1">Disconnected</Badge>}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>API Key</Label>
            {apiKey ? (
              <div className="mt-1 flex gap-2">
                <Input value={reveal ? apiKey : apiKey.slice(0, 8) + "•".repeat(16) + apiKey.slice(-4)} readOnly className="font-mono text-xs" />
                <Button variant="outline" onClick={() => setReveal(!reveal)}>{reveal ? "Hide" : "Reveal"}</Button>
                <CopyButton value={apiKey} size="sm" label="Key" />
              </div>
            ) : <p className="mt-1 text-sm text-muted-foreground">No API key set.</p>}
          </div>
          <div>
            <Label>API Base URL</Label>
            <Input value={base} onChange={e => setBase(e.target.value)} placeholder="http://localhost:3000" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setApiBase(base.trim() || null); toast.success("Saved"); }}>Save base URL</Button>
            <Button variant="outline" onClick={() => testMut.mutate()} disabled={testMut.isPending}>
              {testMut.isPending ? "Testing…" : "Test connection"}
            </Button>
            <Button variant="destructive" onClick={() => { setApiKey(null); toast.success("API key cleared"); navigate({ to: "/login" }); }}>
              Clear API key
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Row label="Dark mode" description="Switch between light and dark theme">
            <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
          </Row>
          <Row label="Developer mode" description="Show extra request details and raw responses">
            <Switch checked={devMode} onCheckedChange={(c) => { setDevMode(c); window.localStorage.setItem("vmp_dev", c ? "1" : "0"); }} />
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

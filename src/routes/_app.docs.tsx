import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";

export const Route = createFileRoute("/_app/docs")({ component: DocsPage });

interface Endpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  auth: boolean;
  body?: object;
  response?: object;
  errors?: string[];
}

const SECTIONS: Array<{ id: string; title: string; intro?: string; endpoints?: Endpoint[]; extra?: React.ReactNode }> = [
  { id: "auth", title: "Authentication", intro: "All authenticated endpoints require an Authorization header.",
    extra: <pre className="overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">Authorization: Bearer mp_live_xxxxx</pre> },
  { id: "health", title: "Health",
    endpoints: [{ method: "GET", path: "/health", auth: false, response: { status: "ok", ts: "2026-06-03T12:00:00.000Z" } }] },
  { id: "signup", title: "Signup",
    endpoints: [{ method: "POST", path: "/v1/signup", auth: false,
      body: { email: "you@example.com", name: "Your Name" },
      response: { customer: { id: "uuid", email: "...", tier: "free", daily_quota: 100 }, api_key: "mp_live_xxxxxx", note: "Save this API key — it will not be shown again." } }] },
  { id: "send", title: "Send Email",
    endpoints: [{ method: "POST", path: "/v1/send", auth: true,
      body: { from: "hello@yourdomain.com", to: "user@example.com", subject: "Welcome", html: "<h1>Hi!</h1>", tracking: { opens: true, clicks: true } },
      response: { accepted: 1, rejected: 0, message_ids: ["<id@domain.com>"], suppressed: [] },
      errors: ["400 Validation error", "403 Domain not verified", "429 Quota exceeded"] }] },
  { id: "domains", title: "Domains",
    endpoints: [
      { method: "GET", path: "/v1/domains", auth: true },
      { method: "POST", path: "/v1/domains", auth: true, body: { domain: "example.com" } },
      { method: "POST", path: "/v1/domains/:id/verify", auth: true,
        response: { id: "uuid", results: { ownership: true, spf: true, dkim: true, dmarc: true }, verified: true } },
      { method: "DELETE", path: "/v1/domains/:id", auth: true },
    ]},
  { id: "messages", title: "Messages",
    endpoints: [
      { method: "GET", path: "/v1/messages", auth: true },
      { method: "GET", path: "/v1/messages/:messageId", auth: true },
    ]},
  { id: "usage", title: "Usage & Quota",
    endpoints: [
      { method: "GET", path: "/v1/usage", auth: true },
      { method: "GET", path: "/v1/usage/quota", auth: true,
        response: { daily: { used: 16, limit: 100, remaining: 84, pct: 0.16 }, monthly: { used: 17, limit: 3000, remaining: 2983, pct: 0.0057 } } },
    ]},
  { id: "suppressions", title: "Suppressions",
    endpoints: [
      { method: "GET", path: "/v1/suppressions", auth: true },
      { method: "POST", path: "/v1/suppressions", auth: true, body: { email: "blocked@example.com", reason: "manual", notes: "Requested removal" } },
      { method: "DELETE", path: "/v1/suppressions/:email", auth: true },
    ]},
  { id: "webhooks", title: "Webhooks",
    endpoints: [
      { method: "GET", path: "/v1/webhooks", auth: true },
      { method: "POST", path: "/v1/webhooks", auth: true, body: { url: "https://yourapp.com/webhook", events: ["delivered","hard_bounce","complaint","opened","clicked"] } },
      { method: "DELETE", path: "/v1/webhooks/:id", auth: true },
    ]},
  { id: "admin", title: "Admin",
    endpoints: [{ method: "POST", path: "/v1/admin/api-keys", auth: false,
      body: { customer_id: "uuid", admin_token: "dev-admin-token-change-me", name: "prod-key", scopes: ["send","domains"] } }] },
  { id: "events", title: "Event Types",
    extra: <div className="flex flex-wrap gap-2">{["queued","sent","delivered","soft_bounce","hard_bounce","complaint","opened","clicked","unsubscribed","failed"].map(e => <Badge key={e} variant="secondary" className="capitalize">{e.replace("_"," ")}</Badge>)}</div> },
];

function DocsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="API Documentation" description="V-Mail Pilot REST API reference." />
      <Tabs defaultValue="auth" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {SECTIONS.map(s => <TabsTrigger key={s.id} value={s.id}>{s.title}</TabsTrigger>)}
        </TabsList>
        {SECTIONS.map(s => (
          <TabsContent key={s.id} value={s.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{s.title}</CardTitle>
                {s.intro && <CardDescription>{s.intro}</CardDescription>}
              </CardHeader>
              {s.extra && <CardContent>{s.extra}</CardContent>}
            </Card>
            {s.endpoints?.map((e, i) => <EndpointCard key={i} endpoint={e} />)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const methodColor = endpoint.method === "GET" ? "bg-info text-info-foreground"
    : endpoint.method === "POST" ? "bg-success text-success-foreground"
    : "bg-destructive text-destructive-foreground";
  const curl = `curl -X ${endpoint.method} '${"${BASE}"}${endpoint.path}'${endpoint.auth ? ` \\\n  -H 'Authorization: Bearer ${"${API_KEY}"}'` : ""}${endpoint.body ? ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(endpoint.body)}'` : ""}`;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={methodColor}>{endpoint.method}</Badge>
          <code className="font-mono text-sm">{endpoint.path}</code>
          <Badge variant={endpoint.auth ? "outline" : "secondary"}>{endpoint.auth ? "Auth required" : "Public"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {endpoint.body && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Request body</p>
            <pre className="overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">{JSON.stringify(endpoint.body, null, 2)}</pre>
          </div>
        )}
        {endpoint.response && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Example response</p>
            <pre className="overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">{JSON.stringify(endpoint.response, null, 2)}</pre>
          </div>
        )}
        {endpoint.errors && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Error states</p>
            <ul className="space-y-1 text-sm">
              {endpoint.errors.map(e => <li key={e} className="rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">{e}</li>)}
            </ul>
          </div>
        )}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">cURL example</p>
            <CopyButton value={curl} label="cURL" size="sm" />
          </div>
          <pre className="overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">{curl}</pre>
        </div>
      </CardContent>
    </Card>
  );
}

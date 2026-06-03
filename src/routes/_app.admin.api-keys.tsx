import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { KeyRound, ShieldAlert, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";
import { createAdminApiKey, type AdminApiKeyResponse } from "@/lib/api-client";

export const Route = createFileRoute("/_app/admin/api-keys")({ component: AdminKeysPage });

const SCOPES = ["send", "domains", "messages", "usage", "suppressions", "webhooks"];

function AdminKeysPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<{
    customer_id: string; admin_token: string; name: string;
  }>();
  const [scopes, setScopes] = useState<string[]>(["send"]);
  const [result, setResult] = useState<AdminApiKeyResponse | null>(null);

  const mut = useMutation({
    mutationFn: (body: { customer_id: string; admin_token: string; name: string; scopes: string[] }) =>
      createAdminApiKey(body),
    onSuccess: (r) => { setResult(r); toast.success("API key created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Admin · API Keys" description="Provision additional API keys for customer accounts." />

      <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Administrator-only endpoint</p>
          <p className="text-destructive/80">Requires a valid admin token. Treat all credentials with care.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Create API key</CardTitle>
          <CardDescription>Generates a new key for an existing customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(v => mut.mutate({ ...v, scopes }))} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Customer ID</Label>
              <Input placeholder="uuid" {...register("customer_id", { required: "Required" })} />
              {errors.customer_id && <p className="mt-1 text-xs text-destructive">{errors.customer_id.message}</p>}
            </div>
            <div>
              <Label>Admin token</Label>
              <Input type="password" placeholder="dev-admin-token-change-me" {...register("admin_token", { required: "Required" })} />
              {errors.admin_token && <p className="mt-1 text-xs text-destructive">{errors.admin_token.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label>Key name</Label>
              <Input placeholder="prod-key" {...register("name", { required: "Required", maxLength: 64 })} />
            </div>
            <div className="md:col-span-2">
              <Label>Scopes</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {SCOPES.map(s => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent">
                    <Checkbox checked={scopes.includes(s)}
                      onCheckedChange={(c) => setScopes(c ? [...scopes, s] : scopes.filter(x => x !== s))} />
                    <span className="capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={mut.isPending || scopes.length === 0}>
                {mut.isPending ? "Creating…" : "Create API key"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-success/40 bg-success/5">
          <CardHeader>
            <CardTitle>Key created — {result.name}</CardTitle>
            <CardDescription>Copy the key now. It will not be shown again.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded-md border bg-card px-3 py-2 font-mono text-xs">{result.api_key}</code>
              <CopyButton value={result.api_key} label="API key" size="sm" />
            </div>
            <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />
              Store this key in a secret manager — never commit it to source control.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Mail, AlertTriangle, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { signup, setApiKey, type SignupResponse } from "@/lib/api-client";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; name: string }>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignupResponse | null>(null);
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async (vals) => {
    setLoading(true);
    try {
      const data = await signup(vals);
      setResult(data);
      toast.success("Account created");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/dashboard" className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          V-Mail Pilot
        </Link>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Start sending transactional email in minutes.</CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Jane Doe"
                    {...register("name", { required: "Name required", maxLength: 100 })} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com"
                    {...register("email", { required: "Email required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" }})} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating…" : "Create account"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Already have a key? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Account ready</CardTitle>
              <CardDescription>Your API key is shown only once. Save it now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 rounded-lg border bg-muted/40 p-4 text-sm">
                <Row k="Customer ID" v={result.customer.id} mono />
                <Row k="Email" v={result.customer.email} />
                <Row k="Tier" v={result.customer.tier} />
                <Row k="Daily quota" v={String(result.customer.daily_quota)} />
              </div>
              <div>
                <Label>API Key</Label>
                <div className="mt-1 flex gap-2">
                  <code className="flex-1 truncate rounded-md border bg-card px-3 py-2 font-mono text-xs">{result.api_key}</code>
                  <CopyButton value={result.api_key} label="API key" size="sm" />
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />
                <span>Save this API key — it will not be shown again.</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => { setApiKey(result.api_key); toast.success("API key saved"); navigate({ to: "/dashboard" }); }}>
                Continue to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{v}</span>
    </div>
  );
}

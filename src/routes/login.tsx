import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Zap, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { setApiKey, setApiBase, getApiBase, apiRequest, ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const [key, setKey] = useState("");
  const [base, setBase] = useState(getApiBase());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const save = () => {
    if (!key.trim()) return toast.error("Enter your API key");
    setApiBase(base.trim() || null);
    setApiKey(key.trim());
    toast.success("API key saved");
    navigate({ to: "/dashboard" });
  };

  const test = async () => {
    if (!key.trim()) return toast.error("Enter your API key first");
    setLoading(true);
    setApiBase(base.trim() || null);
    setApiKey(key.trim());
    try {
      await apiRequest("/v1/usage/quota");
      toast.success("Connection successful");
      navigate({ to: "/dashboard" });
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.status === 401 || err.status === 403
        ? "Invalid API key"
        : `Connection failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute inset-0 bg-mesh opacity-80" />
      <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-gradient-success opacity-15 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link to="/dashboard" className="mb-8 flex items-center justify-center gap-2.5 text-lg font-bold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
            <Zap className="h-5 w-5" />
          </div>
          V-Mail Pilot
        </Link>
        <Card className="border-border/60 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>Sign in with your API key to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key" className="text-[12.5px] font-semibold">API Key</Label>
              <Input id="key" type="password" placeholder="mp_live_xxxxxxxxxxxx" value={key} onChange={(e) => setKey(e.target.value)} className="h-10 font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base" className="text-[12.5px] font-semibold">API Base URL <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="base" placeholder="http://localhost:3000" value={base} onChange={(e) => setBase(e.target.value)} className="h-10 font-mono text-sm" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2.5 pt-2">
            <Button className="h-10 w-full rounded-lg bg-gradient-primary shadow-glow hover:opacity-95" onClick={test} disabled={loading}>
              <KeyRound className="mr-2 h-4 w-4" />
              {loading ? "Testing connection…" : "Test & continue"}
            </Button>
            <Button variant="outline" className="h-10 w-full rounded-lg" onClick={save}>Save API key</Button>
            <p className="pt-2 text-center text-xs text-muted-foreground">
              No account? <Link to="/signup" className="font-semibold text-primary hover:underline">Create one</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/dashboard" className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          V-Mail Pilot
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Sign in with API key</CardTitle>
            <CardDescription>V-Mail Pilot uses API key authentication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">API Key</Label>
              <Input id="key" type="password" placeholder="mp_live_xxxxxxxxxxxx" value={key} onChange={(e) => setKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base">API Base URL (optional)</Label>
              <Input id="base" placeholder="http://localhost:3000" value={base} onChange={(e) => setBase(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={test} disabled={loading}>
              {loading ? "Testing…" : "Test Connection"}
            </Button>
            <Button variant="outline" className="w-full" onClick={save}>Save API Key</Button>
            <p className="text-center text-xs text-muted-foreground">
              No account? <Link to="/signup" className="text-primary hover:underline">Create one</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, KeyRound, Globe, ShieldCheck, Send, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { useApiKey } from "@/hooks/use-api-key";
import { listDomains, listMessages } from "@/lib/api-client";

export const Route = createFileRoute("/_app/onboarding")({ component: OnboardingPage });

function OnboardingPage() {
  const { hasKey } = useApiKey();
  const domainsQ = useQuery({ queryKey: ["domains"], queryFn: listDomains, enabled: hasKey });
  const messagesQ = useQuery({ queryKey: ["messages", { limit: 1 }], queryFn: () => listMessages({ limit: 1 }), enabled: hasKey });

  const domains = domainsQ.data?.domains ?? [];
  const hasDomain = domains.length > 0;
  const hasVerified = domains.some(d => d.verified);
  const hasSent = (messagesQ.data?.messages?.length ?? 0) > 0;

  const steps = [
    { id: 1, title: "Connect API key", desc: "Sign up or paste an existing key", icon: KeyRound, done: hasKey, cta: { label: "Sign in", to: "/login" } },
    { id: 2, title: "Register sending domain", desc: "Add the domain you'll send from", icon: Globe, done: hasDomain, cta: { label: "Add domain", to: "/domains" } },
    { id: 3, title: "Verify DNS records", desc: "Publish SPF, DKIM, DMARC, and CNAMEs", icon: ShieldCheck, done: hasVerified, cta: { label: "Verify DNS", to: "/domains" } },
    { id: 4, title: "Send a test email", desc: "Trigger your first delivery", icon: Send, done: hasSent, cta: { label: "Send email", to: "/send-email" } },
  ];
  const completed = steps.filter(s => s.done).length;
  const pct = (completed / steps.length) * 100;

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding" description="Complete these 4 steps to start delivering email." />

      <Card>
        <CardHeader>
          <CardTitle>Setup progress</CardTitle>
          <CardDescription>{completed} of {steps.length} steps complete</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={pct} />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {steps.map((step, i) => (
          <Card key={step.id} className={step.done ? "border-success/40 bg-success/5" : ""}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step.done ? "bg-success text-success-foreground" : "bg-muted"}`}>
                  {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Step {i + 1}</p>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
              <div className="sm:ml-auto">
                <Button asChild variant={step.done ? "outline" : "default"}>
                  <Link to={step.cta.to}>
                    {step.done ? "Revisit" : step.cta.label} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <Check done={hasKey}>API key connected</Check>
            <Check done={hasDomain}>Domain added</Check>
            <Check done={hasVerified}>DNS verified</Check>
            <Check done={hasSent}>Test email sent</Check>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Check({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
      <span className={done ? "" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}

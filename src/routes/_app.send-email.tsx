import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Send, X, Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { sendEmail, type SendEmailBody, type SendEmailResponse, ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/_app/send-email")({ component: SendEmailPage });

type FormVals = {
  from: string; from_name?: string; to: string; reply_to?: string;
  subject: string; html?: string; text?: string;
  ip_pool: string; opens: boolean; clicks: boolean;
};

function SendEmailPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormVals>({
    defaultValues: { ip_pool: "default", opens: true, clicks: true },
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [meta, setMeta] = useState<Array<{ k: string; v: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendEmailResponse | null>(null);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const onSubmit = handleSubmit(async (vals) => {
    setLoading(true);
    setResult(null);
    const body: SendEmailBody = {
      from: vals.from, from_name: vals.from_name || undefined,
      to: vals.to, reply_to: vals.reply_to || undefined,
      subject: vals.subject, html: vals.html || undefined, text: vals.text || undefined,
      tags: tags.length ? tags : undefined,
      metadata: meta.length ? Object.fromEntries(meta.filter(m => m.k).map(m => [m.k, m.v])) : undefined,
      tracking_opens: vals.opens,
      tracking_clicks: vals.clicks,
      ip_pool: vals.ip_pool,
    };
    try {
      const data = await sendEmail(body);
      setResult(data);
      toast.success(`Sent! ${data.accepted} accepted${data.rejected ? `, ${data.rejected} rejected` : ""}`);
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 400) toast.error(`Validation error: ${err.message}`);
      else if (err.status === 403) toast.error("Domain not registered or verified");
      else if (err.status === 429) toast.error("Quota exceeded");
      else toast.error(err.message);
    } finally { setLoading(false); }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Send Email" description="Compose and dispatch a transactional or marketing email." />

      {result && (
        <Card className="border-success/40 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" /> Email sent
            </CardTitle>
            <CardDescription>
              {result.accepted} accepted · {result.rejected} rejected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {result.message_ids.map(id => (
              <div key={id} className="flex items-center justify-between rounded border bg-card px-3 py-2">
                <code className="truncate font-mono text-xs">{id}</code>
                <Button size="sm" variant="outline" onClick={() => navigate({ to: "/messages/$messageId", params: { messageId: id } })}>
                  View detail
                </Button>
              </div>
            ))}
            {result.results?.some(r => !r.accepted) && (
              <div className="rounded border border-warning/30 bg-warning/10 p-3 text-xs">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                {result.results.filter(r => !r.accepted).length} recipient(s) rejected
                {result.results.filter(r => !r.accepted).map(r => r.reason).filter(Boolean).join(", ") && (
                  <>: {result.results.filter(r => !r.accepted).map(r => r.reason).filter(Boolean).join(", ")}</>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From email" error={errors.from?.message}>
                <Input placeholder="hello@yourdomain.com" {...register("from", { required: "Required" })} />
              </Field>
              <Field label="From name">
                <Input placeholder="Your Brand" {...register("from_name")} />
              </Field>
              <Field label="To" error={errors.to?.message}>
                <Input placeholder="recipient@example.com" {...register("to", { required: "Required" })} />
              </Field>
              <Field label="Reply-To">
                <Input placeholder="support@yourdomain.com" {...register("reply_to")} />
              </Field>
            </div>
            <Field label="Subject" error={errors.subject?.message}>
              <Input placeholder="Welcome!" {...register("subject", { required: "Required", maxLength: 200 })} />
            </Field>
            <Field label="HTML body">
              <Textarea rows={8} placeholder="<h1>Hello!</h1>" className="font-mono text-xs" {...register("html")} />
            </Field>
            <Field label="Plain text body">
              <Textarea rows={4} placeholder="Hello!" {...register("text")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Options</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Tags</Label>
              <div className="mt-1 flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="welcome" />
                <Button type="button" size="icon" variant="outline" onClick={addTag}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map(t => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Metadata</Label>
              <div className="mt-1 space-y-2">
                {meta.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="key" value={m.k} onChange={(e) => setMeta(meta.map((x, j) => j === i ? { ...x, k: e.target.value } : x))} />
                    <Input placeholder="value" value={m.v} onChange={(e) => setMeta(meta.map((x, j) => j === i ? { ...x, v: e.target.value } : x))} />
                    <Button type="button" size="icon" variant="ghost" onClick={() => setMeta(meta.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setMeta([...meta, { k: "", v: "" }])}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add metadata
                </Button>
              </div>
            </div>

            <div>
              <Label>Tracking</Label>
              <div className="mt-2 space-y-3 rounded-lg border p-3">
                <Controller name="opens" control={control} render={({ field }) => (
                  <Toggle label="Track opens" value={field.value} onChange={field.onChange} />
                )}/>
                <Controller name="clicks" control={control} render={({ field }) => (
                  <Toggle label="Track clicks" value={field.value} onChange={field.onChange} />
                )}/>
              </div>
            </div>

            <div>
              <Label>IP Pool</Label>
              <Controller name="ip_pool" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              )}/>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Send className="mr-2 h-4 w-4" /> {loading ? "Sending…" : "Send email"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

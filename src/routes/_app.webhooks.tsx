import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Webhook, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import { CopyButton } from "@/components/CopyButton";
import { listWebhooks, createWebhook, deleteWebhook, type Webhook as WH } from "@/lib/api-client";

export const Route = createFileRoute("/_app/webhooks")({ component: WebhooksPage });

const EVENTS = ["delivered", "hard_bounce", "complaint", "opened", "clicked"];

function WebhooksPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["webhooks"], queryFn: listWebhooks });
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<WH | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ url: string }>();
  const [selected, setSelected] = useState<string[]>(["delivered"]);

  const createMut = useMutation({
    mutationFn: (body: { url: string; events: string[] }) => createWebhook(body),
    onSuccess: (wh) => {
      toast.success("Webhook created");
      setCreated(wh); setOpen(false); reset(); setSelected(["delivered"]);
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => { toast.success("Webhook deleted"); qc.invalidateQueries({ queryKey: ["webhooks"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Webhooks" description="Receive real-time delivery events on your endpoints."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> Create webhook</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create webhook</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(v => createMut.mutate({ url: v.url, events: selected }))} className="space-y-4">
                <div>
                  <Label>Endpoint URL</Label>
                  <Input placeholder="https://yourapp.com/webhook"
                    {...register("url", { required: "Required", pattern: { value: /^https?:\/\/.+/, message: "Must be a valid URL" } })} />
                  {errors.url && <p className="mt-1 text-xs text-destructive">{errors.url.message}</p>}
                </div>
                <div>
                  <Label>Events</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {EVENTS.map(e => (
                      <label key={e} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent">
                        <Checkbox checked={selected.includes(e)}
                          onCheckedChange={(c) => setSelected(c ? [...selected, e] : selected.filter(x => x !== e))} />
                        <span className="capitalize">{e.replace("_", " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending || selected.length === 0}>{createMut.isPending ? "Creating…" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {created?.secret && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning-foreground" /> Save your webhook secret</CardTitle>
            <CardDescription>This secret is shown only once and is used to verify <code>X-MP-Signature</code>.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded-md border bg-card px-3 py-2 font-mono text-xs">{created.secret}</code>
              <CopyButton value={created.secret} label="Secret" size="sm" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCreated(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><TableSkeleton columns={4} /></div>
            : (data?.webhooks?.length ?? 0) === 0 ? (
              <EmptyState icon={Webhook} title="No webhooks yet"
                description="Create your first webhook to receive delivery, bounce, and engagement events." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead><TableHead>Events</TableHead>
                    <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.webhooks?.map(wh => (
                    <TableRow key={wh.id}>
                      <TableCell className="max-w-md truncate font-mono text-xs">{wh.url}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {wh.events.map(e => <Badge key={e} variant="secondary" className="text-xs capitalize">{e.replace("_"," ")}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={wh.enabled ? "default" : "secondary"} className={wh.enabled ? "bg-success text-success-foreground" : ""}>
                          {wh.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
                              <AlertDialogDescription>You'll stop receiving events at this URL.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => delMut.mutate(wh.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payload example</CardTitle>
          <CardDescription>What your endpoint will receive on every event.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs">{`{
  "message_id": "<abc@happycubing.com>",
  "event_type": "delivered",
  "occurred_at": "2026-06-03T14:00:00.000Z",
  "smtp_response": "250 OK",
  "smtp_host": "mailosaur.net"
}`}</pre>
          <p className="mt-3 text-sm text-muted-foreground">
            Verify each request with header <code className="rounded bg-muted px-1 py-0.5 text-xs">X-MP-Signature: t=&lt;timestamp&gt;,v1=&lt;hmac&gt;</code> using HMAC-SHA256 of <code className="rounded bg-muted px-1 py-0.5 text-xs">{`${"`${t}.${rawBody}`"}`}</code> and your webhook secret.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

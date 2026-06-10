import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { KeyRound, Plus, RefreshCw, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import { CopyButton } from "@/components/CopyButton";
import {
  listApiKeys, createApiKey, rotateApiKey, deleteApiKey,
  type ApiKey, type ApiKeyScope,
} from "@/lib/api-client";

export const Route = createFileRoute("/_app/admin/api-keys")({ component: ApiKeysPage });

const ALL_SCOPES: ApiKeyScope[] = ["send", "domains", "suppressions", "messages", "templates", "webhooks"];

function ApiKeysPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["api-keys"], queryFn: listApiKeys, retry: false });
  const keys: ApiKey[] = data?.api_keys ?? [];

  const [open, setOpen] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<{ name: string; key: string; note: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; expires_at?: string }>();
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["send"]);

  const createMut = useMutation({
    mutationFn: (body: { name: string; scopes: ApiKeyScope[]; expires_at?: string }) => createApiKey(body),
    onSuccess: (k) => {
      setRevealedSecret({ name: k.name, key: k.key, note: k.note });
      setOpen(false); reset(); setScopes(["send"]);
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success(`Key '${k.name}' created`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rotateMut = useMutation({
    mutationFn: (id: string) => rotateApiKey(id),
    onSuccess: (r) => {
      const k = keys.find(k => k.id === r.id);
      setRevealedSecret({ name: k?.name ?? "rotated key", key: r.key, note: r.note });
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Key rotated — old secret valid for ~48h");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: () => {
      toast.success("Key revoked");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Manage account-level keys used to authenticate against the V-Mail Pilot REST API."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1.5 h-4 w-4" /> Create API key</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>Pick the minimum scopes required for the use-case.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(v => createMut.mutate({
                name: v.name,
                scopes,
                expires_at: v.expires_at || undefined,
              }))} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input placeholder="production-backend" {...register("name", { required: "Required", maxLength: 100 })} />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <Label>Scopes</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {ALL_SCOPES.map(s => (
                      <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent">
                        <Checkbox checked={scopes.includes(s)}
                          onCheckedChange={(c) => setScopes(c ? [...scopes, s] : scopes.filter(x => x !== s))} />
                        <span className="font-mono text-xs capitalize">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Expires at <span className="text-muted-foreground">(optional)</span></Label>
                  <Input type="datetime-local" {...register("expires_at")} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending || scopes.length === 0}>
                    {createMut.isPending ? "Creating…" : "Create key"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {revealedSecret && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-warning-foreground" /> Copy your new API key</CardTitle>
            <CardDescription>{revealedSecret.note}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">{revealedSecret.name}</Label>
              <div className="mt-1 flex gap-2">
                <code className="flex-1 truncate rounded-md border bg-card px-3 py-2 font-mono text-xs">{revealedSecret.key}</code>
                <CopyButton value={revealedSecret.key} label="API key" size="sm" />
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />
              This secret will not be shown again. Store it in a secret manager.
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRevealedSecret(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Active keys</CardTitle>
          <CardDescription>Keys appear here as soon as they are created. Secrets are only visible at creation or rotation time.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><TableSkeleton columns={5} /></div>
            : keys.length === 0 ? (
              <EmptyState icon={KeyRound} title="No API keys yet"
                description="Create your first key to start sending email through the V-Mail Pilot API." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map(k => (
                    <TableRow key={k.id}>
                      <TableCell>
                        <div className="font-medium">{k.name}</div>
                        {k.prefix && <code className="font-mono text-[11px] text-muted-foreground">{k.prefix}…</code>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map(s => <Badge key={s} variant="secondary" className="font-mono text-[10.5px]">{s}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {k.created_at ? format(new Date(k.created_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {k.expires_at ? format(new Date(k.expires_at), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => rotateMut.mutate(k.id)} disabled={rotateMut.isPending}>
                            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${rotateMut.isPending ? "animate-spin" : ""}`} /> Rotate
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke {k.name}?</AlertDialogTitle>
                                <AlertDialogDescription>This immediately invalidates the key. Any application using it will start failing with 401.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => delMut.mutate(k.id)} className="bg-destructive hover:bg-destructive/90">Revoke</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

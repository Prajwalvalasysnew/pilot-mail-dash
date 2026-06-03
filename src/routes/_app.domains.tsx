import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Plus, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/TableSkeleton";
import { CopyButton } from "@/components/CopyButton";
import { listDomains, createDomain, verifyDomain, deleteDomain, type Domain } from "@/lib/api-client";

export const Route = createFileRoute("/_app/domains")({ component: DomainsPage });

function DomainsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["domains"], queryFn: listDomains });
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Domain | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ domain: string }>();

  const createMut = useMutation({
    mutationFn: (d: string) => createDomain(d),
    onSuccess: (dom) => {
      toast.success("Domain added — set up DNS records below");
      setCreated(dom);
      setOpen(false); reset();
      qc.invalidateQueries({ queryKey: ["domains"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domains"
        description="Verify sending domains with SPF, DKIM, and DMARC."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> Add domain</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add sending domain</DialogTitle>
                <DialogDescription>You'll receive DNS records to publish in your zone.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit((v) => createMut.mutate(v.domain))} className="space-y-4">
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" placeholder="example.com"
                    {...register("domain", { required: "Required", pattern: { value: /^[a-z0-9.-]+\.[a-z]{2,}$/i, message: "Invalid domain" } })} />
                  {errors.domain && <p className="mt-1 text-xs text-destructive">{errors.domain.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Adding…" : "Add domain"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {created && <DnsSetup domain={created} onClose={() => setCreated(null)} />}

      <Card>
        <CardHeader><CardTitle>Sending domains</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton columns={4} /> :
            (data?.domains?.length ?? 0) === 0 ? (
              <EmptyState icon={Globe} title="No domains added yet"
                description="Add your first sending domain to start sending emails." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.domains?.map((d) => (
                    <DomainRow key={d.id} domain={d} onShowDns={() => setCreated(d)} />
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function DomainRow({ domain, onShowDns }: { domain: Domain; onShowDns: () => void }) {
  const qc = useQueryClient();
  const verifyMut = useMutation({
    mutationFn: () => verifyDomain(domain.id),
    onSuccess: (res) => {
      toast.success(res.verified ? "Domain verified" : "Verification incomplete — check DNS");
      qc.invalidateQueries({ queryKey: ["domains"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteDomain(domain.id),
    onSuccess: () => { toast.success("Domain deleted"); qc.invalidateQueries({ queryKey: ["domains"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{domain.domain}</TableCell>
      <TableCell><StatusBadge status={domain.verified ? "verified" : (domain.status || "pending")} /></TableCell>
      <TableCell className="text-xs text-muted-foreground">{domain.created_at ?? "—"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={onShowDns}>DNS</Button>
          <Button size="sm" variant="outline" onClick={() => verifyMut.mutate()} disabled={verifyMut.isPending}>
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${verifyMut.isPending ? "animate-spin" : ""}`} /> Verify
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {domain.domain}?</AlertDialogTitle>
                <AlertDialogDescription>This removes the domain and its DNS records from V-Mail Pilot.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMut.mutate()} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DnsSetup({ domain, onClose }: { domain: Domain; onClose: () => void }) {
  // Fallback DNS records if API doesn't provide them
  const records = domain.dns_records ?? [
    { type: "TXT", host: domain.domain, value: `mp-verify=${domain.id.slice(0, 16)}`, purpose: "Ownership", status: "pending" },
    { type: "TXT", host: domain.domain, value: "v=spf1 include:spf.vmailpilot.com ~all", purpose: "SPF", status: "pending" },
    { type: "TXT", host: `mp._domainkey.${domain.domain}`, value: "v=DKIM1; k=rsa; p=MIGfMA0...", purpose: "DKIM", status: "pending" },
    { type: "TXT", host: `_dmarc.${domain.domain}`, value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@vmailpilot.com", purpose: "DMARC", status: "pending" },
    { type: "CNAME", host: `bounces.${domain.domain}`, value: "bounces.vmailpilot.com", purpose: "Bounces", status: "pending" },
  ];
  const verified = domain.verification ?? { ownership: false, spf: false, dkim: false, dmarc: false };
  const checks = Object.values(verified).filter(Boolean).length;
  const pct = (checks / 4) * 100;
  const allText = records.map(r => `${r.type}\t${r.host}\t${r.value}`).join("\n");

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> DNS setup for {domain.domain}</CardTitle>
            <CardDescription>Add these records in your DNS provider, then click Verify.</CardDescription>
          </div>
          <div className="flex gap-2">
            <CopyButton value={allText} label="All records" size="sm" />
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Verification progress</span><span>{checks} / 4</span>
          </div>
          <Progress value={pct} />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r, i) => (
                <TableRow key={i}>
                  <TableCell><span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{r.type}</span></TableCell>
                  <TableCell className="font-mono text-xs">{r.host}</TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-xs" title={r.value}>{r.value}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.purpose}</TableCell>
                  <TableCell className="text-right"><CopyButton value={r.value} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          DNS changes can take a few minutes to propagate. Once added, click Verify on the domain row above.
        </div>
      </CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ShieldOff, Plus, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import { listSuppressions, addSuppression, deleteSuppression } from "@/lib/api-client";

export const Route = createFileRoute("/_app/suppressions")({ component: SuppressionsPage });

const REASONS = ["hard_bounce", "complaint", "unsubscribe", "manual", "invalid"];

const REASON_COLORS: Record<string, string> = {
  hard_bounce: "bg-destructive/15 text-destructive border-destructive/30",
  complaint: "bg-destructive/15 text-destructive border-destructive/30",
  unsubscribe: "bg-muted text-muted-foreground",
  manual: "bg-info/15 text-info border-info/30",
  invalid: "bg-warning/15 text-warning-foreground border-warning/40",
};

function SuppressionsPage() {
  const [reason, setReason] = useState("all");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["suppressions", { reason, email }],
    queryFn: () => listSuppressions({
      reason: reason === "all" ? undefined : reason,
      email: email || undefined,
    }),
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<{ email: string; reason: string; notes?: string }>({
    defaultValues: { reason: "manual" },
  });
  const reasonVal = watch("reason");

  const addMut = useMutation({
    mutationFn: addSuppression,
    onSuccess: () => { toast.success("Suppression added"); setOpen(false); reset(); qc.invalidateQueries({ queryKey: ["suppressions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (em: string) => deleteSuppression(em),
    onSuccess: () => { toast.success("Suppression removed"); qc.invalidateQueries({ queryKey: ["suppressions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Suppressions" description="Block addresses that bounced, complained, or unsubscribed."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> Add suppression</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add suppression</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(v => addMut.mutate(v))} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input {...register("email", { required: "Required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } })} />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div>
                  <Label>Reason</Label>
                  <Select value={reasonVal} onValueChange={v => setValue("reason", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REASONS.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_"," ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea rows={3} placeholder="Optional context" {...register("notes")} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addMut.isPending}>{addMut.isPending ? "Adding…" : "Add"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reasons</SelectItem>
              {REASONS.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_"," ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Search email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="outline" onClick={() => { setReason("all"); setEmail(""); }}>
            <Search className="mr-1.5 h-4 w-4" /> Reset filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><TableSkeleton columns={4} /></div>
            : (data?.suppressions?.length ?? 0) === 0 ? (
              <EmptyState icon={ShieldOff} title="No suppressions found"
                description="Suppressed addresses appear here automatically after bounces or complaints." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead><TableHead>Reason</TableHead>
                    <TableHead>Notes</TableHead><TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.suppressions?.map((s) => (
                    <TableRow key={s.email}>
                      <TableCell className="font-medium">{s.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${REASON_COLORS[s.reason] ?? ""}`}>
                          {s.reason.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{s.notes ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.created_at ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {s.email}?</AlertDialogTitle>
                              <AlertDialogDescription>Future emails to this address will no longer be blocked.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => delMut.mutate(s.email)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
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
    </div>
  );
}

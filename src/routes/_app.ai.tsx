import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, Send, Loader2, Plus, Trash2, MessageSquare, Wrench, CheckCircle2, XCircle,
  Mail, BarChart3, FileText, ThumbsUp, ThumbsDown, AlertTriangle, Search, Settings2,
  KeyRound, Plug, Activity, Clock, Zap, ShieldCheck, Copy, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  chatStream, confirmAction, cancelAction, sendFeedback, getAgentHealth,
  getAgentBase, setAgentBase, getAgentKey, setAgentKey,
  type AgentStep, type PendingConfirmation, type AgentHealth,
} from "@/lib/ai-agent-client";
import {
  loadThreads, upsertThread, deleteThread, newThread, deriveTitle, type Thread, type ThreadMessage,
} from "@/lib/ai-threads";

type Search = { q?: string };

export const Route = createFileRoute("/_app/ai")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: AiWorkspace,
});

const SUGGESTIONS = [
  { cat: "Analytics",      icon: BarChart3, label: "What was the open rate of campaign 1?" },
  { cat: "Analytics",      icon: Clock,     label: "What is the best time to send for opens?" },
  { cat: "Drafting",       icon: FileText,  label: "Draft a personalized outreach email for prospect_1" },
  { cat: "Drafting",       icon: Mail,      label: "Write a 3-line follow-up for a warm lead" },
  { cat: "Deliverability", icon: ShieldCheck, label: "Why did my bounce rate spike this week?" },
  { cat: "Docs",           icon: Sparkles,  label: "What is VAIS?" },
];

const toolIcon = (t: string) => {
  if (t.includes("send")) return Mail;
  if (t.includes("analytics") || t.includes("best_send")) return BarChart3;
  if (t.includes("draft")) return FileText;
  if (t.includes("faq")) return Sparkles;
  return Wrench;
};

function AiWorkspace() {
  const navigate = useNavigate();
  const { q: initialQ } = Route.useSearch();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [base, setBase] = useState(getAgentBase());
  const [key, setKey] = useState(getAgentKey() ?? "");
  const [filter, setFilter] = useState("");
  const stopRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Bootstrap threads (idempotent, StrictMode-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = loadThreads();
    if (existing.length === 0) {
      const t = newThread();
      upsertThread(t);
      setThreads([t]);
      setActiveId(t.id);
    } else {
      setThreads(existing);
      setActiveId(existing[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  // Preload query from ?q=
  const consumedQ = useRef(false);
  useEffect(() => {
    if (consumedQ.current || !initialQ || !active) return;
    consumedQ.current = true;
    submit(initialQ);
    navigate({ to: "/ai", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, active]);

  useEffect(() => { inputRef.current?.focus(); }, [activeId]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, active?.messages[active.messages.length - 1]?.text]);

  useEffect(() => {
    let cancelled = false;
    getAgentHealth().then((h) => { if (!cancelled) setHealth(h); }).catch(() => setHealth({ status: "down" }));
    return () => { cancelled = true; };
  }, [base, key]);

  const persist = (updater: (t: Thread) => Thread) => {
    setThreads((all) => {
      const next = all.map((t) => (t.id === activeId ? updater(t) : t));
      const changed = next.find((t) => t.id === activeId);
      if (changed) upsertThread(changed);
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  };

  const createThread = () => {
    stop();
    const t = newThread();
    upsertThread(t);
    setThreads((all) => [t, ...all]);
    setActiveId(t.id);
  };
  const removeThread = (id: string) => {
    deleteThread(id);
    setThreads((all) => {
      const next = all.filter((t) => t.id !== id);
      if (activeId === id) {
        if (next.length === 0) {
          const t = newThread();
          upsertThread(t);
          setActiveId(t.id);
          return [t];
        }
        setActiveId(next[0].id);
      }
      return next;
    });
  };

  const submit = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming || !active) return;

    const userMsg: ThreadMessage = { id: crypto.randomUUID(), role: "user", text: msg, ts: Date.now() };
    const asstId = crypto.randomUUID();
    const asst: ThreadMessage = { id: asstId, role: "assistant", text: "", steps: [], ts: Date.now() };
    persist((t) => ({
      ...t,
      title: t.messages.length === 0 ? deriveTitle(msg) : t.title,
      messages: [...t.messages, userMsg, asst],
    }));
    setInput("");
    setIsStreaming(true);

    let buf = "";
    const stop = chatStream({ message: msg, conversation_id: active.conversationId }, {
      onStatus: (s) => {
        if (s.tool) {
          persist((t) => ({
            ...t,
            messages: t.messages.map((m) => m.id === asstId
              ? { ...m, steps: [...(m.steps ?? []), { tool: String(s.tool) }] }
              : m),
          }));
        }
      },
      onStep: (step) => {
        persist((t) => ({
          ...t,
          messages: t.messages.map((m) => {
            if (m.id !== asstId) return m;
            const steps = [...(m.steps ?? [])];
            const i = steps.findIndex((s) => s.tool === step.tool && s.result === undefined && s.error === undefined);
            if (i >= 0) steps[i] = step; else steps.push(step);
            return { ...m, steps };
          }),
        }));
      },
      onToken: (tk) => {
        buf += tk;
        persist((t) => ({
          ...t,
          messages: t.messages.map((m) => m.id === asstId ? { ...m, text: buf } : m),
        }));
      },
      onPending: (p) => {
        persist((t) => ({
          ...t,
          messages: t.messages.map((m) => m.id === asstId ? { ...m, pending: p } : m),
        }));
      },
      onDone: (final) => {
        persist((t) => ({
          ...t,
          conversationId: final.conversation_id ?? t.conversationId,
          messages: t.messages.map((m) => m.id === asstId ? {
            ...m,
            text: final.reply ?? m.text ?? "",
            steps: final.steps ?? m.steps,
            pending: final.pending_confirmation ?? m.pending,
          } : m),
        }));
        setIsStreaming(false);
        stopRef.current = null;
      },
      onError: (err) => {
        persist((t) => ({
          ...t,
          messages: t.messages.map((m) => m.id === asstId ? {
            ...m, text: m.text || `⚠️ ${err}. Check the AI agent connection in settings.`,
          } : m),
        }));
        setIsStreaming(false);
        stopRef.current = null;
      },
    });
    stopRef.current = stop;
  };

  const stop = () => { stopRef.current?.(); stopRef.current = null; setIsStreaming(false); };

  const confirm = async (m: ThreadMessage) => {
    if (!m.pending) return;
    try {
      await confirmAction(m.pending.token);
      toast.success("Email send confirmed");
      persist((t) => ({
        ...t,
        messages: t.messages.map((x) => x.id === m.id
          ? { ...x, pending: undefined, text: x.text + "\n\n✅ Send confirmed and queued." } : x),
      }));
    } catch (e) { toast.error((e as Error).message); }
  };
  const cancel = async (m: ThreadMessage) => {
    if (!m.pending) return;
    try {
      await cancelAction(m.pending.token);
      toast.message("Pending send cancelled");
      persist((t) => ({
        ...t,
        messages: t.messages.map((x) => x.id === m.id
          ? { ...x, pending: undefined, text: x.text + "\n\n✖ Send cancelled." } : x),
      }));
    } catch (e) { toast.error((e as Error).message); }
  };
  const rate = async (m: ThreadMessage, r: 1 | -1) => {
    if (!active?.conversationId) return;
    persist((t) => ({
      ...t,
      messages: t.messages.map((x) => x.id === m.id ? { ...x, feedback: r } : x),
    }));
    try { await sendFeedback({ conversation_id: active.conversationId, rating: r }); } catch { /* silent */ }
  };
  const copyMsg = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  const saveSettings = () => {
    setAgentBase(base || null);
    setAgentKey(key || null);
    setShowSettings(false);
    toast.success("AI agent settings saved");
  };

  const filteredThreads = threads.filter((t) =>
    !filter || t.title.toLowerCase().includes(filter.toLowerCase()));

  const pendingCount = active?.messages.filter((m) => m.pending).length ?? 0;
  const stepCount = active?.messages.reduce((a, m) => a + (m.steps?.length ?? 0), 0) ?? 0;
  const statusTone = health?.status === "ok" ? "bg-success" : health?.status === "degraded" ? "bg-warning" : "bg-destructive";

  return (
    <div className="-m-4 md:-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left: threads */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
        <div className="border-b border-border p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary text-white shadow-glow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-bold">Valasys AI</p>
                <Badge variant="outline" className="h-4 rounded-full border-primary/30 bg-primary/10 px-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">Beta</Badge>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${statusTone}`} />
                {health ? (health.backend ?? health.status) : "checking…"}
              </p>
            </div>
          </div>
          <Button size="sm" className="h-8 w-full" onClick={createThread}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New chat
          </Button>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search chats" className="h-7 pl-7 text-[12px]" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredThreads.map((t) => (
              <div key={t.id} className={`group mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition ${
                t.id === activeId ? "bg-primary/10 text-foreground ring-1 ring-primary/20" : "hover:bg-muted"
              }`}>
                <button onClick={() => setActiveId(t.id)} className="flex flex-1 items-center gap-2 min-w-0 text-left">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.title}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeThread(t.id); }}
                  className="opacity-0 transition group-hover:opacity-100"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
            {filteredThreads.length === 0 && (
              <p className="px-2 py-6 text-center text-[11.5px] text-muted-foreground">No chats match.</p>
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-border p-2">
          <button onClick={() => setShowSettings((v) => !v)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
            <Settings2 className="h-3.5 w-3.5" /> Agent settings
          </button>
          {showSettings && (
            <div className="space-y-2 rounded-md border border-border bg-background p-2.5">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"><Plug className="h-3 w-3" /> Base URL</label>
                <Input value={base} onChange={(e) => setBase(e.target.value)} placeholder="http://localhost:8200" className="h-7 font-mono text-[11.5px]" />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"><KeyRound className="h-3 w-3" /> API key</label>
                <Input value={key} onChange={(e) => setKey(e.target.value)} type="password" placeholder="agent api key" className="h-7 font-mono text-[11.5px]" />
              </div>
              <Button size="sm" className="h-7 w-full text-[11.5px]" onClick={saveSettings}>Save</Button>
            </div>
          )}
        </div>
      </aside>

      {/* Center: transcript + composer */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border bg-background/60 px-4 py-2.5 backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{active?.title ?? "New conversation"}</p>
            <p className="text-[10.5px] text-muted-foreground">
              {active?.messages.length ?? 0} messages · {stepCount} tool calls{pendingCount ? ` · ${pendingCount} pending` : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-[11.5px]" onClick={createThread}>
            <RotateCcw className="mr-1 h-3 w-3" /> New
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
            {(!active || active.messages.length === 0) && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-gradient-to-br from-primary/8 via-card to-transparent p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-glow">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold">Ask anything about your sending</p>
                      <p className="text-[12px] text-muted-foreground">
                        Grounded answers from your real campaign data. Drafts and sends always wait for your confirmation.
                      </p>
                    </div>
                  </div>
                </div>
                {["Analytics", "Drafting", "Deliverability", "Docs"].map((cat) => (
                  <div key={cat}>
                    <p className="mb-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {SUGGESTIONS.filter((s) => s.cat === cat).map((s) => (
                        <button key={s.label} onClick={() => submit(s.label)}
                          className="group flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-[12.5px] transition hover:border-primary/40 hover:bg-muted">
                          <s.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="flex-1">{s.label}</span>
                          <Send className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {active?.messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-primary text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div className={`flex max-w-[85%] flex-col gap-2 ${m.role === "user" ? "items-end" : ""}`}>
                  {m.role === "user" ? (
                    <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-[13.5px] text-primary-foreground shadow-sm">{m.text}</div>
                  ) : (
                    <>
                      {(m.steps?.length ?? 0) > 0 && (
                        <div className="space-y-1">
                          {m.steps!.map((s, i) => {
                            const Icon = toolIcon(s.tool);
                            const done = s.result !== undefined;
                            const err = !!s.error;
                            return (
                              <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[11px]">
                                <Icon className="h-3 w-3 text-primary" />
                                <span className="font-mono font-semibold text-foreground">{s.tool}</span>
                                <span className="ml-auto">
                                  {err ? <XCircle className="h-3 w-3 text-destructive" />
                                    : done ? <CheckCircle2 className="h-3 w-3 text-success" />
                                    : <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-[13.5px] leading-relaxed text-foreground shadow-sm">
                        {m.text || (isStreaming ? <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</span> : "")}
                      </div>
                      {m.pending && (
                        <div className="rounded-xl border border-warning/40 bg-warning/5 p-3">
                          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-warning-foreground">
                            <AlertTriangle className="h-3 w-3" /> Confirmation needed
                          </div>
                          <div className="space-y-1 text-[12.5px]">
                            {m.pending.to && <div><span className="text-muted-foreground">To: </span><span className="font-mono">{m.pending.to}</span></div>}
                            {m.pending.subject && <div><span className="text-muted-foreground">Subject: </span><span className="font-semibold">{m.pending.subject}</span></div>}
                            {m.pending.body && <div className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-2 text-[12px] text-muted-foreground">{m.pending.body}</div>}
                          </div>
                          <div className="mt-2.5 flex gap-2">
                            <Button size="sm" className="h-7 flex-1 text-[11.5px]" onClick={() => confirm(m)}>
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Confirm send
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11.5px]" onClick={() => cancel(m)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                      {m.text && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => rate(m, 1)} className={`flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-muted ${m.feedback === 1 ? "text-success" : "text-muted-foreground"}`}><ThumbsUp className="h-3 w-3" /></button>
                          <button onClick={() => rate(m, -1)} className={`flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-muted ${m.feedback === -1 ? "text-destructive" : "text-muted-foreground"}`}><ThumbsDown className="h-3 w-3" /></button>
                          <button onClick={() => copyMsg(m.text)} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"><Copy className="h-3 w-3" /></button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-background p-3">
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-xl border border-border bg-card shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder="Ask about campaigns, drafts, sends…"
                className="min-h-[52px] max-h-40 resize-none border-0 bg-transparent px-3.5 py-3 pr-14 text-[13.5px] shadow-none focus-visible:ring-0"
                disabled={isStreaming}
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-2 h-9 w-9 rounded-lg"
                onClick={isStreaming ? stop : () => submit()}
                disabled={!isStreaming && !input.trim()}
                aria-label={isStreaming ? "Stop" : "Send"}
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
              Press <kbd className="rounded border border-border bg-muted px-1 font-mono">Enter</kbd> to send · <kbd className="rounded border border-border bg-muted px-1 font-mono">Shift+Enter</kbd> for newline · sends require confirmation
            </p>
          </div>
        </div>
      </section>

      {/* Right: insights */}
      <aside className="hidden w-72 shrink-0 flex-col border-l border-border bg-card/40 lg:flex">
        <div className="space-y-3 p-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><Activity className="h-3 w-3" /> Session</p>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Messages</span><span className="font-mono font-semibold">{active?.messages.length ?? 0}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Tool calls</span><span className="font-mono font-semibold">{stepCount}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Pending sends</span><span className="font-mono font-semibold">{pendingCount}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Conversation</span><span className="font-mono text-[10.5px] text-muted-foreground">{active?.conversationId?.slice(0, 8) ?? "—"}</span></div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><Zap className="h-3 w-3 text-primary" /> Capabilities</p>
            <ul className="space-y-1 text-[12px]">
              {[
                { i: BarChart3, t: "Campaign analytics (SQL-grounded)" },
                { i: FileText,  t: "Personalized outreach drafts" },
                { i: Mail,      t: "Send emails (with confirmation)" },
                { i: Clock,     t: "Best-time-to-send analysis" },
                { i: ShieldCheck, t: "Deliverability diagnostics" },
                { i: Sparkles,  t: "FAQ + product knowledge" },
              ].map((c) => (
                <li key={c.t} className="flex items-start gap-2"><c.i className="mt-0.5 h-3 w-3 shrink-0 text-primary" /><span>{c.t}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-warning-foreground"><AlertTriangle className="h-3 w-3" /> Safety</p>
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              The agent never sends email without your explicit confirmation. Every send has a token that expires and can be cancelled.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

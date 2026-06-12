import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Send, X, Loader2, Wrench, CheckCircle2, XCircle, Mail, BarChart3,
  Clock, FileText, AlertTriangle, ThumbsUp, ThumbsDown, RefreshCw, Settings2, KeyRound, Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  chatStream, confirmAction, cancelAction, sendFeedback, getAgentHealth,
  getAgentBase, setAgentBase, getAgentKey, setAgentKey,
  type AgentStep, type PendingConfirmation, type AgentHealth,
} from "@/lib/ai-agent-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps?: AgentStep[];
  pending?: PendingConfirmation;
  streaming?: boolean;
  feedback?: 1 | -1;
}

const SUGGESTIONS = [
  { icon: BarChart3, label: "What was the open rate of campaign 1?" },
  { icon: Clock,     label: "What is the best time to send for opens?" },
  { icon: Mail,      label: "Draft a personalized outreach email for prospect_1" },
  { icon: FileText,  label: "What is VAIS?" },
];

const toolIcon = (t: string) => {
  if (t.includes("send")) return Mail;
  if (t.includes("analytics") || t.includes("best_send")) return BarChart3;
  if (t.includes("draft")) return FileText;
  if (t.includes("faq")) return Sparkles;
  return Wrench;
};

export function AgentChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [convId, setConvId] = useState<string | undefined>(undefined);
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [base, setBase] = useState(getAgentBase());
  const [key, setKey] = useState(getAgentKey() ?? "");
  const stopRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    getAgentHealth().then(h => { if (!cancelled) setHealth(h); }).catch(() => setHealth({ status: "down" }));
    return () => { cancelled = true; };
  }, [base, key]);

  const submit = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: msg };
    const asstId = crypto.randomUUID();
    const asst: Message = { id: asstId, role: "assistant", text: "", streaming: true, steps: [] };
    setMessages(m => [...m, userMsg, asst]);
    setInput("");
    setIsStreaming(true);

    let buf = "";
    const stop = chatStream({ message: msg, conversation_id: convId }, {
      onStatus: (s) => {
        if (s.tool) {
          setMessages(m => m.map(x => x.id === asstId
            ? { ...x, steps: [...(x.steps ?? []), { tool: String(s.tool) }] }
            : x));
        }
      },
      onStep: (step) => {
        setMessages(m => m.map(x => {
          if (x.id !== asstId) return x;
          const steps = [...(x.steps ?? [])];
          const i = steps.findIndex(s => s.tool === step.tool && s.result === undefined && s.error === undefined);
          if (i >= 0) steps[i] = step; else steps.push(step);
          return { ...x, steps };
        }));
      },
      onToken: (t) => {
        buf += t;
        setMessages(m => m.map(x => x.id === asstId ? { ...x, text: buf } : x));
      },
      onPending: (p) => {
        setMessages(m => m.map(x => x.id === asstId ? { ...x, pending: p } : x));
      },
      onDone: (final) => {
        if (final.conversation_id) setConvId(final.conversation_id);
        setMessages(m => m.map(x => x.id === asstId ? {
          ...x,
          text: final.reply ?? x.text ?? "",
          steps: final.steps ?? x.steps,
          pending: final.pending_confirmation ?? x.pending,
          streaming: false,
        } : x));
        setIsStreaming(false);
        stopRef.current = null;
      },
      onError: (err) => {
        setMessages(m => m.map(x => x.id === asstId ? {
          ...x, streaming: false,
          text: x.text || `⚠️ ${err}. Check the AI agent connection in settings.`,
        } : x));
        setIsStreaming(false);
        stopRef.current = null;
      },
    });
    stopRef.current = stop;
  };

  const stop = () => { stopRef.current?.(); stopRef.current = null; setIsStreaming(false); };

  const handleConfirm = async (m: Message) => {
    if (!m.pending) return;
    try {
      await confirmAction(m.pending.token);
      toast.success("Email send confirmed");
      setMessages(ms => ms.map(x => x.id === m.id ? { ...x, pending: undefined, text: x.text + "\n\n✅ Send confirmed and queued." } : x));
    } catch (e) { toast.error((e as Error).message); }
  };
  const handleCancel = async (m: Message) => {
    if (!m.pending) return;
    try {
      await cancelAction(m.pending.token);
      toast.message("Pending send cancelled");
      setMessages(ms => ms.map(x => x.id === m.id ? { ...x, pending: undefined, text: x.text + "\n\n✖ Send cancelled." } : x));
    } catch (e) { toast.error((e as Error).message); }
  };
  const rate = async (m: Message, r: 1 | -1) => {
    if (!convId) return;
    setMessages(ms => ms.map(x => x.id === m.id ? { ...x, feedback: r } : x));
    try { await sendFeedback({ conversation_id: convId, rating: r }); }
    catch { /* silent */ }
  };

  const saveSettings = () => {
    setAgentBase(base || null);
    setAgentKey(key || null);
    setShowSettings(false);
    toast.success("AI agent settings saved");
  };
  const newConversation = () => {
    stop();
    setConvId(undefined);
    setMessages([]);
    inputRef.current?.focus();
  };

  const statusTone = health?.status === "ok" ? "bg-success" : health?.status === "degraded" ? "bg-warning" : "bg-destructive";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-gradient-to-r from-primary/10 via-background to-background px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-glow">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold leading-none">Valasys AI</h3>
            <Badge variant="outline" className="h-4 rounded-full border-primary/30 bg-primary/10 px-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">Beta</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${statusTone}`} />
            {health ? (health.backend ?? health.status) : "checking…"}
          </p>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={newConversation}><RefreshCw className="h-3.5 w-3.5" /></Button>
            </TooltipTrigger>
            <TooltipContent>New conversation</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(v => !v)}><Settings2 className="h-3.5 w-3.5" /></Button>
            </TooltipTrigger>
            <TooltipContent>Agent settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Settings drawer */}
      {showSettings && (
        <div className="space-y-2.5 border-b border-border bg-muted/40 p-4">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><Plug className="h-3 w-3" /> Agent base URL</label>
            <Input value={base} onChange={(e) => setBase(e.target.value)} placeholder="http://localhost:8200" className="h-8 font-mono text-[12px]" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><KeyRound className="h-3 w-3" /> X-API-Key</label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} type="password" placeholder="agent api key" className="h-8 font-mono text-[12px]" />
          </div>
          <Button size="sm" className="h-8 w-full" onClick={saveSettings}>Save</Button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-4 p-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-[13px] font-bold">Ask anything about your sending</p>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Grounded answers from your real campaign data. Drafts and sends always wait for your confirmation.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="px-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Try</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} onClick={() => submit(s.label)} className="group flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-[12.5px] transition hover:border-primary/40 hover:bg-muted">
                    <s.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="flex-1">{s.label}</span>
                    <Send className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-primary text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              )}
              <div className={`flex max-w-[85%] flex-col gap-2 ${m.role === "user" ? "items-end" : ""}`}>
                {m.role === "user" ? (
                  <div className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-[13px] text-primary-foreground shadow-sm">{m.text}</div>
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
                    <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground shadow-sm">
                      {m.text || (m.streaming ? <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</span> : "")}
                    </div>
                    {m.pending && (
                      <div className="rounded-xl border border-warning/40 bg-warning/5 p-3">
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-warning-foreground">
                          <AlertTriangle className="h-3 w-3" /> Confirmation needed
                        </div>
                        <div className="space-y-1 text-[12px]">
                          {m.pending.to && <div><span className="text-muted-foreground">To: </span><span className="font-mono">{m.pending.to}</span></div>}
                          {m.pending.subject && <div><span className="text-muted-foreground">Subject: </span><span className="font-semibold">{m.pending.subject}</span></div>}
                          {m.pending.body && <div className="mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-2 text-[11.5px] text-muted-foreground">{m.pending.body}</div>}
                        </div>
                        <div className="mt-2.5 flex gap-2">
                          <Button size="sm" className="h-7 flex-1 text-[11.5px]" onClick={() => handleConfirm(m)}>
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Confirm send
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[11.5px]" onClick={() => handleCancel(m)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    {!m.streaming && m.text && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => rate(m, 1)} className={`flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-muted ${m.feedback === 1 ? "text-success" : "text-muted-foreground"}`}><ThumbsUp className="h-3 w-3" /></button>
                        <button onClick={() => rate(m, -1)} className={`flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-muted ${m.feedback === -1 ? "text-destructive" : "text-muted-foreground"}`}><ThumbsDown className="h-3 w-3" /></button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t border-border bg-background p-3">
        <div className="relative rounded-xl border border-border bg-card shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Ask about campaigns, drafts, sends…"
            className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent px-3 py-2.5 pr-12 text-[13px] shadow-none focus-visible:ring-0"
            disabled={isStreaming}
          />
          <Button
            size="icon"
            className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg"
            onClick={isStreaming ? stop : () => submit()}
            disabled={!isStreaming && !input.trim()}
            aria-label={isStreaming ? "Stop" : "Send"}
          >
            {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
          Press <kbd className="rounded border border-border bg-muted px-1 font-mono">Enter</kbd> to send · <kbd className="rounded border border-border bg-muted px-1 font-mono">Shift+Enter</kbd> for newline · sends require confirmation
        </p>
      </div>
    </div>
  );
}

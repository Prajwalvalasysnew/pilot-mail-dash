import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { AgentChatPanel } from "./AgentChatPanel";

export function AgentLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("valasys-ai:open", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("valasys-ai:open", onCustom);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open Valasys AI"
        className="group fixed bottom-5 right-5 z-40 flex h-13 items-center gap-2 rounded-full bg-gradient-primary px-4 py-3 text-white shadow-glow transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        <span className="text-[12.5px] font-bold tracking-wide">{open ? "Close" : "Ask Valasys AI"}</span>
        <kbd className="hidden rounded border border-white/30 bg-white/10 px-1 font-mono text-[9.5px] sm:inline">⌘J</kbd>
      </button>
      {open && <AgentChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}

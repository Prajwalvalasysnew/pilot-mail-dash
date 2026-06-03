import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label, className, size = "icon" }: {
  value: string; label?: string; className?: string;
  size?: "icon" | "sm" | "default";
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(label ? `${label} copied` : "Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };
  if (size === "icon") {
    return (
      <Button variant="ghost" size="icon" onClick={copy} className={cn("h-7 w-7", className)} aria-label="Copy">
        <Copy className="h-3.5 w-3.5" />
      </Button>
    );
  }
  return (
    <Button variant="outline" size={size} onClick={copy} className={className}>
      <Copy className="mr-2 h-3.5 w-3.5" /> {label ?? "Copy"}
    </Button>
  );
}

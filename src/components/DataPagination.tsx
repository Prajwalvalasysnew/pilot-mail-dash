import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DataPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  entityLabel?: string;
};

export function DataPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  entityLabel = "results",
}: DataPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (clamped - 1) * pageSize + 1;
  const end = Math.min(total, clamped * pageSize);

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5 text-[12.5px] sm:flex-row",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>
          Showing <span className="font-semibold text-foreground">{start.toLocaleString()}</span>
          {" – "}
          <span className="font-semibold text-foreground">{end.toLocaleString()}</span>
          {" of "}
          <span className="font-semibold text-foreground">{total.toLocaleString()}</span> {entityLabel}
        </span>
        {onPageSizeChange && (
          <div className="hidden items-center gap-1.5 sm:flex">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-7 w-[70px] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-[12px]">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="mr-2 hidden text-muted-foreground sm:inline">
          Page <span className="font-semibold text-foreground">{clamped}</span> of{" "}
          <span className="font-semibold text-foreground">{totalPages}</span>
        </span>
        <Button variant="outline" size="icon-sm" disabled={clamped <= 1} onClick={() => onPageChange(1)} aria-label="First page">
          <ChevronsLeft />
        </Button>
        <Button variant="outline" size="icon-sm" disabled={clamped <= 1} onClick={() => onPageChange(clamped - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon-sm" disabled={clamped >= totalPages} onClick={() => onPageChange(clamped + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
        <Button variant="outline" size="icon-sm" disabled={clamped >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Last page">
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}

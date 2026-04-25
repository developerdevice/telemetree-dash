import { cn } from "@/lib/utils";
import type { Status } from "@/data/mock";

const MAP: Record<Status, { label: string; cls: string }> = {
  ok:   { label: "OK",       cls: "bg-status-ok/10 text-status-ok ring-status-ok/30" },
  warn: { label: "Warning",  cls: "bg-status-warn/10 text-status-warn ring-status-warn/30" },
  crit: { label: "Critical", cls: "bg-status-crit/10 text-status-crit ring-status-crit/30" },
};

export function StatusPill({ status, className, label }: { status: Status; className?: string; label?: string }) {
  const m = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        m.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full",
        status === "ok" && "bg-status-ok",
        status === "warn" && "bg-status-warn",
        status === "crit" && "bg-status-crit",
      )} />
      {label ?? m.label}
    </span>
  );
}

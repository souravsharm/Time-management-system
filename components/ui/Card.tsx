import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  title?: string;
  /** One plain sentence saying what this card is for. */
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Card({
  title,
  hint,
  action,
  children,
  className,
  bodyClassName
}: CardProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
            )}
            {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
          </div>
          {action && <div className="flex flex-wrap gap-2">{action}</div>}
        </div>
      )}
      <div className={cn("min-w-0", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-subtle px-6 py-10 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-faint ring-1 ring-line">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{children}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

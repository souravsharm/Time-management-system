import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent/80 focus-visible:ring-accent",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-subtle focus-visible:ring-ink-muted",
  ghost: "text-ink-soft hover:bg-fill hover:text-ink focus-visible:ring-ink-muted",
  danger:
    "border border-bad-strong/40 bg-surface text-bad-strong hover:bg-bad-soft focus-visible:ring-bad-strong"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

export function Button({
  children,
  className,
  icon,
  type = "button",
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-surface disabled:cursor-not-allowed disabled:opacity-45",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

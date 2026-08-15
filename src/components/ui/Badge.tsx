import type { ReactNode } from "react";

type Tone = "primary" | "danger" | "warning" | "success" | "neutral" | "orange";

const tones: Record<Tone, string> = {
  primary: "bg-primary-200/60 text-primary-900",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning/15 text-accent-orange-strong",
  success: "bg-primary-700/10 text-primary-700",
  neutral: "bg-bg-soft text-ink-700",
  orange: "bg-accent-orange/15 text-accent-orange-strong",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-caption font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

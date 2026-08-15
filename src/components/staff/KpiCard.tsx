import type { ReactNode } from "react";

export function KpiCard({
  icon,
  label,
  value,
  trend,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClasses =
    tone === "danger"
      ? "border-danger-soft bg-danger-soft/20"
      : tone === "warning"
        ? "border-line-strong bg-bg-soft"
        : "border-line bg-surface";

  return (
    <div className={`rounded-card border p-5 ${toneClasses}`}>
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-200/50 text-primary-700">
          {icon}
        </span>
        {trend ? (
          <span className="rounded-full bg-warning/15 px-2.5 py-1 text-caption font-bold text-accent-orange-strong">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-body text-ink-700">{label}</p>
      <p className={`text-h1 font-bold ${tone === "danger" ? "text-danger" : "text-ink-900"}`}>
        {value}
      </p>
    </div>
  );
}

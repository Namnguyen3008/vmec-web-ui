import { ShieldPlus } from "lucide-react";

export function Logo({
  subtitle,
  size = "md",
}: {
  subtitle?: string;
  size?: "sm" | "md";
}) {
  const textSize = size === "sm" ? "text-body-lg" : "text-h3";
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white">
        <ShieldPlus size={20} strokeWidth={2.25} />
      </span>
      <span className="leading-tight">
        <span className={`block font-bold text-primary-900 ${textSize}`}>
          MedAgent AI
        </span>
        {subtitle ? (
          <span className="block text-[11px] text-ink-500">{subtitle}</span>
        ) : null}
      </span>
    </div>
  );
}

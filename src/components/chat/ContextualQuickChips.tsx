"use client";

import type { ContextualChipOption } from "@/lib/ai/types";
import { Sparkles } from "lucide-react";

interface ContextualQuickChipsProps {
  chips: ContextualChipOption[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function ContextualQuickChips({
  chips,
  onSelect,
  disabled = false,
}: ContextualQuickChipsProps) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="mt-3 ml-0 sm:ml-12 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-800">
        <Sparkles size={14} className="text-primary-600 shrink-0" />
        <span>Gợi ý tình huống phổ biến (Chạm 1-chạm để gửi nhanh):</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(chip.fullText)}
            className="group flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3 text-left transition-all hover:border-primary-400 hover:bg-primary-50 hover:shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary-400 bg-white text-[10px] text-primary-700 font-bold group-hover:bg-primary-600 group-hover:text-white transition-colors">
              ✓
            </span>
            <div className="flex-1">
              <div className="text-xs font-bold text-ink-900 group-hover:text-primary-900">
                {chip.display}
              </div>
              <div className="mt-0.5 text-[11px] text-ink-500 line-clamp-1">
                {chip.fullText}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

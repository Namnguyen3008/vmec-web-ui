"use client";

import { Mic, Send } from "lucide-react";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <form
      className="flex items-center gap-3 border-t border-line bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-1 items-center gap-3 rounded-full border border-line px-5 py-3">
        <Mic size={18} className="shrink-0 text-ink-500" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          maxLength={5000}
          placeholder="Nhập câu hỏi hoặc mô tả triệu chứng..."
          className="w-full bg-transparent text-body outline-none placeholder:text-ink-500"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white hover:bg-primary-900"
        aria-label="Gửi"
      >
        <Send size={18} />
      </button>
    </form>
  );
}

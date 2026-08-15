import type { ReactNode } from "react";
import { Bot, BookOpen, ShieldCheck, User } from "lucide-react";

export interface CitationItem {
  sourceId?: string | null;
  documentId?: string | null;
  label: string;
  url?: string | null;
  sectionTitle?: string | null;
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-end gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div className="max-w-xl rounded-2xl rounded-tr-xs bg-primary-900 text-white px-5 py-3.5 text-body shadow-xs">
        {children}
      </div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-200 text-primary-900 font-bold text-caption">
        <User size={18} />
      </span>
    </div>
  );
}

export function AgentBubble({
  children,
  citations,
  confidenceScore,
}: {
  children: ReactNode;
  citations?: CitationItem[];
  confidenceScore?: number;
}) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white shadow-xs">
        <Bot size={18} />
      </span>
      <div className="max-w-xl space-y-2">
        <div className="rounded-2xl rounded-tl-xs border border-line bg-surface px-5 py-4 text-body text-ink-900 shadow-2xs">
          <div className="whitespace-pre-wrap">{children}</div>

          {/* Citations section */}
          {citations && citations.length > 0 && (
            <div className="mt-3.5 border-t border-line pt-3 text-caption text-ink-600">
              <span className="font-semibold text-primary-800 flex items-center gap-1.5 mb-1.5">
                <BookOpen size={13} className="text-primary-700" /> Trích nguồn y tế RAG đã kiểm duyệt:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {citations.map((cite, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-caption font-medium text-primary-800 border border-primary-200/60"
                  >
                    {cite.label} {cite.sectionTitle ? `(${cite.sectionTitle})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} export function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce" />
    </div>
  );
}

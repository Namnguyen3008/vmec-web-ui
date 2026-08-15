"use client";

import { useState, type ReactNode } from "react";
import { Bot, BookOpen, ShieldCheck, User, FileText, ChevronDown, ChevronUp, ExternalLink, Sparkles, HelpCircle } from "lucide-react";

export interface CitationItem {
  sourceId?: string | null;
  documentId?: string | null;
  label: string;
  url?: string | null;
  sectionTitle?: string | null;
  confidence?: number;
  snippet?: string | null;
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
  confidenceScore = 92,
  quickReplies,
  onSelectQuickReply,
}: {
  children: ReactNode;
  citations?: CitationItem[];
  confidenceScore?: number;
  quickReplies?: string[];
  onSelectQuickReply?: (text: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white shadow-xs">
        <Bot size={18} />
      </span>
      <div className="max-w-xl space-y-2">
        <div className="rounded-2xl rounded-tl-xs border border-line bg-surface px-5 py-4 text-body text-ink-900 shadow-2xs">
          <div className="whitespace-pre-wrap">{children}</div>

          {/* Quick Reply Chips for Clarification Intake */}
          {quickReplies && quickReplies.length > 0 && (
            <div className="mt-4 rounded-xl border border-line bg-primary-50/40 p-3.5 shadow-2xs">
              <p className="text-xs font-bold text-primary-900 flex items-center gap-1.5 mb-2.5">
                <HelpCircle size={14} className="text-primary-700 shrink-0" />
                <span>Gợi ý chọn nhanh để làm rõ thông tin:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectQuickReply?.(reply)}
                    className="rounded-full border border-primary-300 bg-white py-1.5 px-3.5 text-xs font-medium text-primary-900 shadow-2xs transition-all hover:bg-primary-700 hover:text-white hover:border-primary-700 active:scale-95 text-left"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Medical Citations Card */}
          {citations && citations.length > 0 && (
            <div className="mt-4 rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50/80 via-surface to-primary-100/30 p-3.5 text-caption shadow-2xs">
              <div className="flex items-center justify-between gap-2 border-b border-primary-200/70 pb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-primary-900">
                  <ShieldCheck size={16} className="text-primary-700 shrink-0" />
                  <span>Trích nguồn y tế RAG đã kiểm duyệt</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-200/70 px-2 py-0.5 text-2xs font-bold text-primary-900">
                  <Sparkles size={11} className="text-primary-700" />
                  Độ khớp: {confidenceScore}%
                </span>
              </div>

              <div className="mt-2.5 space-y-2">
                {citations.map((cite, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-primary-200/80 bg-surface/90 p-2.5 transition-all hover:border-primary-400 hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <FileText size={15} className="mt-0.5 text-primary-700 shrink-0" />
                        <div>
                          <p className="font-semibold text-ink-900 text-body-sm">
                            {cite.label}
                          </p>
                          {cite.sectionTitle && (
                            <p className="text-caption text-ink-700 mt-0.5">
                              📌 Mục: <span className="font-medium">{cite.sectionTitle}</span>
                            </p>
                          )}
                          {cite.documentId && (
                            <p className="text-2xs text-ink-500 font-mono mt-0.5">
                              Mã tài liệu: {cite.documentId} {cite.sourceId ? `· Nguồn: ${cite.sourceId}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      {cite.url && (
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-700 hover:text-primary-900 p-1"
                          title="Xem tài liệu gốc"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>

                    {/* Expandable Snippet Preview if present */}
                    {cite.snippet && (
                      <div className="mt-2 rounded bg-bg-muted/70 p-2 text-2xs text-ink-700 italic border-l-2 border-primary-500">
                        &quot;{cite.snippet}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-2.5 flex items-center justify-between text-2xs text-ink-500 pt-1">
                <span>Cơ sở dữ liệu: 2.670 Vector RAG Bộ Y Tế</span>
                <span className="font-medium text-primary-800">Chuẩn hóa VMEC 2026</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-bounce" />
    </div>
  );
}

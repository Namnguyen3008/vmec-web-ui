"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Bug, Activity, X } from "lucide-react";
import type { LivingClinicalContext } from "@/lib/ai/types";

interface AgentObservabilityButtonProps {
  context: LivingClinicalContext;
  messages: Array<{ id: string; sender: string; content: string }>;
  className?: string;
}

export function AgentObservabilityButton({
  context,
  messages,
  className = "",
}: AgentObservabilityButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const debugPromptText = `Hãy xây dựng một hệ thống **observability/debug recorder** cho tính năng **Trợ lý Khám bệnh AI Agent**, tự động thu thập và trực quan hóa toàn bộ luồng hoạt động thực tế: input/output, agent/sub-agent, tool calls, retrieval, state changes, errors, latency và trace/replay , và các nội dung đoạn chat để debug tìm confict trong logic đoạn chat.

---

### 📋 SNAPSHOT LOGIC & TRANSCRIPT ĐOẠN CHAT THỰC TẾ (DEBUG CONTEXT):
- **Session ID:** ${context.sessionId}
- **Lượt hội thoại:** ${context.turnCount}
- **Tiến độ phân tích:** ${context.progressPercentage}%
- **Mức độ Triage:** ${context.urgencyLevel}
- **Chuyên khoa đề xuất:** ${context.detectedSpecialtyName || "Chưa xác định"} (${context.detectedSpecialtyCode || "N/A"})
- **Bác sĩ phụ trách:** ${context.assignedDoctorName || "N/A"} - ${context.assignedRoom || "N/A"}

#### 🔍 TRẠNG THÁI 4 TRƯỜNG LÂM SÀNG (SLOT MATRIX):
1. **Vị trí & Triệu chứng chính:** [${context.slots.chiefComplaint.status}] "${context.slots.chiefComplaint.value || ""}" (Clarity: ${context.slots.chiefComplaint.clarityScore})
2. **Thời gian diễn tiến:** [${context.slots.duration.status}] "${context.slots.duration.value || ""}" (Clarity: ${context.slots.duration.clarityScore})
3. **Tính chất & Cường độ đau:** [${context.slots.characterTriggers.status}] "${context.slots.characterTriggers.value || ""}" (Clarity: ${context.slots.characterTriggers.clarityScore})
4. **Dấu hiệu kèm theo & Cảnh báo:** [${context.slots.associatedSigns.status}] "${context.slots.associatedSigns.value || ""}" (Clarity: ${context.slots.associatedSigns.clarityScore})

#### 💬 NỘI DUNG TOÀN BỘ ĐOẠN CHAT (TRANSCRIPT):
${messages
  .map(
    (m, idx) =>
      `[#${idx + 1}] ${m.sender === "PATIENT" ? "🧑 BỆNH NHÂN" : "🤖 AI AGENT"}: ${m.content}`
  )
  .join("\n\n")}
`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(debugPromptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy debug prompt:", err);
    }
  }

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Quick Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          title="Sao chép yêu cầu Observability / Debug Recorder kèm toàn bộ Trace đoạn chat"
          className="flex items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-50/80 px-2.5 py-1 text-xs font-bold text-primary-800 hover:bg-primary-100 hover:border-primary-400 transition-all shadow-2xs active:scale-95"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-600 shrink-0" />
              <span className="text-emerald-700">Đã copy prompt & trace!</span>
            </>
          ) : (
            <>
              <Copy size={13} className="text-primary-600 shrink-0" />
              <span>Copy Observability Prompt</span>
            </>
          )}
        </button>

        {/* Inspect Trace Modal Trigger */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          title="Xem trực tiếp luồng Observability & Debug Trace"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink-600 hover:text-primary-700 hover:border-primary-300 transition-colors"
        >
          <Activity size={14} />
        </button>
      </div>

      {/* Observability / Debug Inspector Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-700 text-white">
                  <Terminal size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-900">
                    Observability & Debug Trace Recorder
                  </h3>
                  <p className="text-[11px] text-ink-500">
                    Thu thập & trực quan hóa toàn bộ luồng hoạt động thực tế của AI Agent
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-800 transition-colors shadow-xs"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Đã copy!" : "Copy Trace"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-bg-muted hover:text-ink-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-sans">
                <div className="rounded-xl border border-line bg-bg-muted p-2.5">
                  <div className="text-[10px] font-bold text-ink-500 uppercase">Tiến độ Triage</div>
                  <div className="text-sm font-bold text-primary-800 mt-0.5">
                    {context.progressPercentage}%
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-bg-muted p-2.5">
                  <div className="text-[10px] font-bold text-ink-500 uppercase">Lượt Chat</div>
                  <div className="text-sm font-bold text-ink-900 mt-0.5">
                    {context.turnCount} lượt
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-bg-muted p-2.5">
                  <div className="text-[10px] font-bold text-ink-500 uppercase">Phân Tầng</div>
                  <div className="text-sm font-bold text-ink-900 mt-0.5">
                    {context.urgencyLevel}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-bg-muted p-2.5">
                  <div className="text-[10px] font-bold text-ink-500 uppercase">Chuyên Khoa</div>
                  <div className="text-sm font-bold text-emerald-700 truncate mt-0.5">
                    {context.detectedSpecialtyName || "Đang phân tích"}
                  </div>
                </div>
              </div>

              {/* Raw Prompt & Debug Payload Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-sans font-bold text-ink-700">
                  <span>Nội dung Debug Prompt & Telemetry Dump:</span>
                  <span className="text-ink-400 font-normal">Click &ldquo;Copy Trace&rdquo; để sao chép</span>
                </div>
                <pre className="rounded-xl border border-line bg-neutral-900 text-neutral-100 p-4 text-[11px] leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {debugPromptText}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

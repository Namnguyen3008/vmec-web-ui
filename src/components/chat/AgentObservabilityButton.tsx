"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Activity, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { LivingClinicalContext } from "@/lib/ai/types";
import { exportDetailedObservabilitySnapshot, getSessionEventStream } from "@/lib/ai/observabilityRecorder";

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

  const eventStream = getSessionEventStream(context.sessionId);
  const fullJsonSnapshot = exportDetailedObservabilitySnapshot(context, messages);

  const debugPromptText = `Hãy xây dựng một hệ thống **observability/debug recorder** cho tính năng **Trợ lý Khám bệnh AI Agent**, tự động thu thập và trực quan hóa toàn bộ luồng hoạt động thực tế: input/output, agent/sub-agent, tool calls, retrieval, state changes, errors, latency và trace/replay , và các nội dung đoạn chat để debug tìm confict trong logic đoạn chat.

---

### 📋 SNAPSHOT LOGIC & CLINICAL PROVENANCE TRACE (DEBUG CONTEXT):
- **Session ID:** ${context.sessionId}
- **Lượt hội thoại:** ${context.turnCount}
- **Tiến độ phân tích:** ${context.progressPercentage}%
- **Mức độ Triage:** ${context.urgencyLevel}
- **Chuyên khoa định tuyến:** ${context.detectedSpecialtyName || "Chưa xác định"} (${context.detectedSpecialtyCode || "N/A"})
- **Bác sĩ phụ trách:** ${context.assignedDoctorName || "N/A"} - ${context.assignedRoom || "N/A"}

#### 🔍 ATOMIC PATIENT FACTS (NGUỒN DỮ LIỆU ĐÃ KIỂM CHUẨN TỪ BỆNH NHÂN):
${
  context.atomicFacts && context.atomicFacts.length > 0
    ? context.atomicFacts
        .map(
          (f, i) =>
            `${i + 1}. [${f.category}] "${f.value}" (Severity: ${f.severity || "NORMAL"}, Provenance: ${f.provenance})`
        )
        .join("\n")
    : "Chưa có facts nguyên tử được trích xuất"
}

#### 📋 TRẠNG THÁI 4 TRƯỜNG LÂM SÀNG (SLOT MATRIX & SEVERITY):
1. **Vị trí & Triệu chứng chính:** [${context.slots.chiefComplaint.status}] "${context.slots.chiefComplaint.value || ""}" (Clarity: ${context.slots.chiefComplaint.clarityScore})
2. **Thời gian & Diễn tiến:** [${context.slots.duration.status}] "${context.slots.duration.value || ""}" (Clarity: ${context.slots.duration.clarityScore})
3. **Tính chất & Cường độ đau:** [${context.slots.characterTriggers.status}] "${context.slots.characterTriggers.value || ""}" (Severity: ${context.slots.characterTriggers.severityModifier || "NORMAL"}, Clarity: ${context.slots.characterTriggers.clarityScore})
4. **Dấu hiệu kèm theo & Cảnh báo:** [${context.slots.associatedSigns.status}] "${context.slots.associatedSigns.value || ""}" (Clarity: ${context.slots.associatedSigns.clarityScore})

#### 💬 NỘI DUNG TOÀN BỘ ĐOẠN CHAT (TRANSCRIPT):
${messages
  .map(
    (m, idx) =>
      `[#${idx + 1}] ${m.sender === "PATIENT" ? "🧑 BỆNH NHÂN" : "🤖 AI AGENT"}: ${m.content}`
  )
  .join("\n\n")}

---

### 🧬 EVENT STREAM & STATE DELTA TRACE (AUDIT LOG):
${JSON.stringify(eventStream, null, 2)}
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
          title="Sao chép yêu cầu Observability / Debug Recorder kèm toàn bộ Trace đoạn chat & Event Stream"
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
          title="Xem trực tiếp luồng Observability, State Deltas & Provenance Audit"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink-600 hover:text-primary-700 hover:border-primary-300 transition-colors"
        >
          <Activity size={14} />
        </button>
      </div>

      {/* Observability / Debug Inspector Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-700 text-white">
                  <Terminal size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-900">
                    Observability & Clinical Provenance Trace Recorder
                  </h3>
                  <p className="text-[11px] text-ink-500">
                    Thu thập luồng sự kiện, kiểm chuẩn nguồn dữ liệu (Provenance) và ngăn chặn ảo giác (Zero Hallucination)
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
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-line bg-bg-muted p-2.5">
                  <div className="text-[10px] font-bold text-ink-500 uppercase">Tiến độ Triage</div>
                  <div className="text-sm font-bold text-primary-800 mt-0.5">
                    {context.progressPercentage}%
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-bg-muted p-2.5">
                  <div className="text-[10px] font-bold text-ink-500 uppercase">Sự kiện Ghi nhận</div>
                  <div className="text-sm font-bold text-ink-900 mt-0.5">
                    {eventStream.length} Events
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-bg-muted p-2.5">
                  <div className="text-[10px] font-bold text-ink-500 uppercase">Data Provenance</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Enforced (Zero Hallucination)</span>
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-bg-muted p-2.5">
                  <div className="text-[10px] font-bold text-ink-500 uppercase">Chuyên Khoa Đề Xuất</div>
                  <div className="text-sm font-bold text-emerald-700 truncate mt-0.5">
                    {context.detectedSpecialtyName || "Chưa xác định"}
                  </div>
                </div>
              </div>

              {/* Atomic Patient Facts Table */}
              <div className="rounded-xl border border-line bg-bg-muted p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-ink-800 uppercase tracking-wider">
                  <span>Atomic Patient Facts (Nguồn Dữ Liệu Thực Tế):</span>
                  <span className="text-emerald-700 font-medium">Origin: PATIENT_EXPLICIT</span>
                </div>
                {context.atomicFacts && context.atomicFacts.length > 0 ? (
                  <div className="space-y-1.5">
                    {context.atomicFacts.map((fact) => (
                      <div
                        key={fact.id}
                        className="flex items-center justify-between rounded-lg border border-line bg-surface p-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-primary-800">[{fact.category}]</span>{" "}
                          <span className="font-medium text-ink-900">{fact.value}</span>
                          <span className="text-[11px] text-ink-500 ml-2 italic">
                            (Trích từ: &ldquo;{fact.rawSnippet}&rdquo;)
                          </span>
                        </div>
                        {fact.severity && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              fact.severity === "SEVERE"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {fact.severity}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-ink-400 italic text-xs">Chưa có facts nào được ghi nhận.</div>
                )}
              </div>

              {/* Event Stream Timeline */}
              <div className="rounded-xl border border-line bg-bg-muted p-3 space-y-2">
                <div className="text-[11px] font-bold text-ink-800 uppercase tracking-wider">
                  Event Stream & State Deltas:
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {eventStream.map((evt, idx) => (
                    <div
                      key={evt.eventId}
                      className="rounded-lg border border-line bg-surface p-2 text-[11px] flex items-start gap-2"
                    >
                      <div className="rounded bg-neutral-200 px-1 py-0.5 font-mono text-[9px] font-bold text-ink-700">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink-900">{evt.eventType}</span>
                          <span className="font-mono text-[9px] text-ink-400">
                            {evt.component} · {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-ink-600 mt-0.5">{evt.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Snapshot Dump */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-ink-700">
                  <span>Toàn bộ Payload JSON Telemetry:</span>
                  <span className="text-ink-400 font-normal">Click &ldquo;Copy Trace&rdquo; để sao chép</span>
                </div>
                <pre className="rounded-xl border border-line bg-neutral-900 text-neutral-100 p-4 text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {fullJsonSnapshot}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

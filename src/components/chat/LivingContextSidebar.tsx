"use client";

import type { LivingClinicalContext } from "@/lib/ai/types";
import {
  CheckCircle2,
  Clock,
  Activity,
  ShieldCheck,
  Zap,
  FileText,
  AlertTriangle,
  Flame,
  ArrowRight,
} from "lucide-react";

interface LivingContextSidebarProps {
  context: LivingClinicalContext;
  onForceComplete?: () => void;
  className?: string;
}

export function LivingContextSidebar({
  context,
  onForceComplete,
  className = "",
}: LivingContextSidebarProps) {
  const { slots, progressPercentage, isCompleted, isEmergency, urgencyLevel, activeCitations } =
    context;

  const slotItems = [
    {
      key: "chiefComplaint",
      data: slots.chiefComplaint,
      icon: Activity,
    },
    {
      key: "duration",
      data: slots.duration,
      icon: Clock,
    },
    {
      key: "characterTriggers",
      data: slots.characterTriggers,
      icon: Flame,
    },
    {
      key: "associatedSigns",
      data: slots.associatedSigns,
      icon: AlertTriangle,
    },
  ];

  return (
    <div
      className={`flex flex-col h-full bg-surface border-l border-line p-4 sm:p-5 overflow-y-auto ${className}`}
    >
      {/* Sidebar Header */}
      <div className="border-b border-line pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-ink-900">Hồ Sơ Ngữ Cảnh Sống</h3>
          </div>
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-800">
            {progressPercentage}% Hoàn tất
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Tự động bóc tách & phân tầng lâm sàng thời gian thực
        </p>

        {/* Progress Bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isEmergency
                ? "bg-red-600"
                : progressPercentage >= 100
                ? "bg-emerald-600"
                : "bg-primary-700"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 4 Clinical Slots Checklist */}
      <div className="mt-4 space-y-3">
        <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">
          Tiêu Chuẩn Lâm Sàng (4 Trường)
        </div>

        {slotItems.map((item, idx) => {
          const isDone = item.data.status === "COMPLETED";
          const isInProgress = item.data.status === "IN_PROGRESS";
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className={`rounded-xl border p-3 transition-all ${
                isDone
                  ? "border-emerald-200 bg-emerald-50/40"
                  : isInProgress
                  ? "border-primary-300 bg-primary-50/30"
                  : "border-line bg-surface/50 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isInProgress
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-200 text-ink-500"
                    }`}
                  >
                    {isDone ? "✓" : idx + 1}
                  </div>
                  <span className="text-xs font-bold text-ink-900">{item.data.label}</span>
                </div>

                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : isInProgress ? (
                  <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">
                    Đang làm rõ
                  </span>
                ) : (
                  <span className="text-[10px] text-ink-400">Đang chờ</span>
                )}
              </div>

              {/* Recorded Value */}
              {item.data.value ? (
                <div className="mt-2 pl-8 text-xs text-ink-700 italic bg-white/70 p-1.5 rounded border border-neutral-100">
                  &ldquo;{item.data.value}&rdquo;
                </div>
              ) : (
                <div className="mt-1 pl-8 text-[11px] text-ink-400">Chưa ghi nhận thông tin</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Triage Level Meter */}
      <div className="mt-5 rounded-xl border border-line bg-bg-muted p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-800">Phân Tầng Triage:</span>
          {isEmergency ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 animate-pulse">
              🚨 Cấp Cứu 115
            </span>
          ) : isCompleted ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
              Mức II: Ưu Tiên Khám Sớm
            </span>
          ) : (
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
              Đang Phân Tích
            </span>
          )}
        </div>
      </div>

      {/* Active Citations */}
      {activeCitations && activeCitations.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck size={13} className="text-primary-600" />
            <span>Phác Đồ BYT Đang Tham Chiếu</span>
          </div>
          {activeCitations.map((cite, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-line bg-surface p-2.5 text-xs shadow-2xs"
            >
              <div className="font-bold text-ink-900 text-[11px] flex items-center gap-1">
                <FileText size={12} className="text-primary-700 shrink-0" />
                <span className="truncate">{cite.label}</span>
              </div>
              {cite.documentId && (
                <div className="text-[10px] text-primary-700 font-mono mt-0.5">
                  Mã: {cite.documentId} ({cite.confidence || 96}% Khớp)
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skip / Force Complete Button if not completed */}
      {!isCompleted && !isEmergency && onForceComplete && (
        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={onForceComplete}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary-400 bg-primary-50/50 py-2.5 px-3 text-xs font-bold text-primary-800 hover:bg-primary-100 transition-colors shadow-2xs"
          >
            <Zap size={14} className="text-primary-600" />
            <span>Tôi muốn đặt khám ngay (Bỏ qua hỏi)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

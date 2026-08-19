"use client";

import type { LivingClinicalContext, SlotKey } from "@/lib/ai/types";
import { Zap, ArrowRight, CheckCircle2, Clock, HelpCircle, ShieldCheck } from "lucide-react";
import { SLOT_METADATA } from "@/lib/ai/prompts";

interface LivingContextSidebarProps {
  context: LivingClinicalContext;
  currentStep?: number;
  onForceComplete?: () => void;
  className?: string;
}

const FLOW_STEPS = [
  { step: 1, label: "Triệu chứng" },
  { step: 2, label: "Chuyên khoa" },
  { step: 3, label: "Khung giờ" },
  { step: 4, label: "Xác nhận" },
];

const SLOT_KEYS: SlotKey[] = ["chiefComplaint", "characterTriggers", "duration", "associatedSigns"];

export function LivingContextSidebar({
  context,
  currentStep = 1,
  onForceComplete,
  className = "",
}: LivingContextSidebarProps) {
  const { progressPercentage, isCompleted, isEmergency, slots, lastJudgeResult, activeTargetSlot } = context;

  return (
    <div
      className={`flex flex-col h-full bg-surface border-l border-line p-3.5 sm:p-4 overflow-y-auto ${className}`}
    >
      {/* 4-Step Mini Progress Indicator */}
      <div className="border-b border-line pb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-2">
          Quy Trình Khám (4 Bước)
        </div>
        <div className="grid grid-cols-4 gap-1">
          {FLOW_STEPS.map((s) => {
            const isPassed = currentStep > s.step;
            const isCurrent = currentStep === s.step;

            return (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                    isPassed
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-primary-700 text-white ring-2 ring-primary-200"
                      : "bg-neutral-100 text-ink-400"
                  }`}
                >
                  {isPassed ? "✓" : s.step}
                </div>
                <span
                  className={`mt-1 text-[9px] truncate w-full ${
                    isCurrent
                      ? "font-bold text-primary-900"
                      : isPassed
                      ? "font-semibold text-emerald-800"
                      : "text-ink-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Living Context Header */}
      <div className="border-b border-line py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold text-ink-900">4 Thông Tin Cốt Lõi (BYT)</h3>
          </div>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-800">
            {progressPercentage}% Đạt
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
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

      {/* 4 Core Slots Live Verification State */}
      <div className="py-3 space-y-2.5">
        {SLOT_KEYS.map((key) => {
          const slot = slots[key];
          const meta = SLOT_METADATA[key];
          const isDone = slot.status === "COMPLETED";
          const isCurrentActive = activeTargetSlot === key || (!isDone && key === activeTargetSlot);

          return (
            <div
              key={key}
              className={`rounded-xl border p-2.5 transition-all text-caption ${
                isDone
                  ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                  : isCurrentActive
                  ? "border-primary-300 bg-primary-50/30 text-primary-950 shadow-2xs ring-1 ring-primary-300"
                  : "border-line bg-bg-soft/40 text-ink-600 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-semibold">
                  {isDone ? (
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  ) : isCurrentActive ? (
                    <Clock size={13} className="text-primary-700 shrink-0 animate-pulse" />
                  ) : (
                    <HelpCircle size={13} className="text-ink-400 shrink-0" />
                  )}
                  <span className="text-[11px]">{meta.order}. {meta.label}</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    isDone
                      ? "bg-emerald-100 text-emerald-800"
                      : isCurrentActive
                      ? "bg-primary-100 text-primary-800"
                      : "bg-neutral-100 text-ink-400"
                  }`}
                >
                  {isDone ? "Đạt chuẩn" : isCurrentActive ? "Đang hỏi" : "Chờ"}
                </span>
              </div>
              {slot.value && (
                <p className="mt-1 text-[11px] font-medium text-ink-900 line-clamp-2 bg-white/80 p-1.5 rounded border border-line/60">
                  {slot.value}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Judge LLM Evaluation Badge */}
      {lastJudgeResult && (
        <div className="mt-2 rounded-xl border border-teal-200 bg-teal-50/60 p-2.5 text-[10px] text-teal-900">
          <div className="flex items-center gap-1 font-bold text-teal-950 mb-0.5">
            <ShieldCheck size={12} className="text-teal-700" />
            <span>Judge LLM Thẩm Định:</span>
          </div>
          <p className="text-teal-800 leading-tight">
            Slot <strong>{SLOT_METADATA[lastJudgeResult.targetSlot].label}</strong>: {lastJudgeResult.verdict === "SATISFIED" ? "Đã đạt chuẩn lâm sàng (100%)" : "Cần bổ sung làm rõ thêm"}
          </p>
        </div>
      )}

      {/* Skip / Force Complete Button if not completed */}
      {!isCompleted && !isEmergency && onForceComplete && (
        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={onForceComplete}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary-400 bg-primary-50/60 py-2 px-2.5 text-[11px] font-bold text-primary-800 hover:bg-primary-100 transition-colors shadow-2xs"
          >
            <Zap size={13} className="text-primary-600" />
            <span>Đặt khám ngay (Bỏ qua hỏi)</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

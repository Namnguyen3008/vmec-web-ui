"use client";

import type { LivingClinicalContext } from "@/lib/ai/types";
import { Zap, ArrowRight } from "lucide-react";

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

export function LivingContextSidebar({
  context,
  currentStep = 1,
  onForceComplete,
  className = "",
}: LivingContextSidebarProps) {
  const { progressPercentage, isCompleted, isEmergency } = context;

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

      {/* Tiến Độ Thu Thập Hồ Sơ section temporarily hidden per user request */}
      {/*
      <div className="border-b border-line py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold text-ink-900">Tiến Độ Thu Thập Hồ Sơ</h3>
          </div>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-800">
            {progressPercentage}% Đạt
          </span>
        </div>

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
      */}

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

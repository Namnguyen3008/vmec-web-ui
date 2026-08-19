"use client";

import type { PsychologicalSoothingPayload } from "@/lib/ai/types";
import { HeartHandshake, Sparkles, CheckCircle2, Shield } from "lucide-react";

interface PsychologicalSoothingCardProps {
  payload: PsychologicalSoothingPayload;
  doctorName?: string;
  specialtyName?: string;
}

export function PsychologicalSoothingCard({
  payload,
  doctorName,
  specialtyName,
}: PsychologicalSoothingCardProps) {
  if (!payload) return null;

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white p-5 sm:p-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-emerald-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
          <HeartHandshake size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
            Lời Nhắn An Tâm Từ Bác Sĩ AI
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              Chuẩn Tâm lý Y khoa PEARLS
            </span>
          </h4>
          <p className="text-[11px] text-emerald-700">
            Đồng hành & chia sẻ lo âu cùng bạn trước khi thăm khám
          </p>
        </div>
      </div>

      {/* Main Comforting Message */}
      <div className="mt-3.5 text-xs sm:text-sm text-emerald-950 leading-relaxed font-normal">
        {payload.comfortingMessage}
      </div>

      {/* Doctor Care Commitment */}
      {payload.doctorCarePromise && (
        <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-white/80 p-3 border border-emerald-100 text-xs text-emerald-900">
          <Shield size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Cam kết chăm sóc: </strong>
            <span>{payload.doctorCarePromise}</span>
          </div>
        </div>
      )}

      {/* Immediate Self-Care Tips */}
      {payload.immediateSelfCareTips && payload.immediateSelfCareTips.length > 0 && (
        <div className="mt-4 border-t border-emerald-100/80 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Lời khuyên tự chăm sóc tại nhà ngay lúc này:</span>
          </div>
          <ul className="space-y-1.5">
            {payload.immediateSelfCareTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

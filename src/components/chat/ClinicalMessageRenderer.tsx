"use client";

import React from "react";
import {
  Stethoscope,
  Building2,
  FileText,
  Sparkles,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  ClipboardList,
  Clock,
  FileBadge,
  UtensilsCrossed,
} from "lucide-react";
import type { PsychologicalSoothingPayload } from "@/lib/ai/types";

interface ClinicalMessageRendererProps {
  content: string;
  soothingPayload?: PsychologicalSoothingPayload | null;
}

/**
 * Parses markdown inline formatting (**bold**, *italic*, bullet points) into clean React elements
 */
export function formatMarkdownInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <>
      {tokens.map((token, index) => {
        if (token.startsWith("**") && token.endsWith("**")) {
          return (
            <strong key={index} className="font-bold text-ink-900">
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
          return (
            <em key={index} className="italic text-ink-700 font-medium">
              {token.slice(1, -1)}
            </em>
          );
        }
        return <span key={index}>{token}</span>;
      })}
    </>
  );
}

/**
 * Structured Clinical Recommendation Card (Rendered when AI provides final diagnosis & routing)
 */
function parseRoutingSection(content: string) {
  const isRoutingProposal =
    content.includes("CHUYÊN KHOA ĐỀ XUẤT") ||
    content.includes("CHUYÊN KHOA CHỈ ĐỊNH") ||
    content.includes("KẾT QUẢ ĐỊNH TUYẾN");

  if (!isRoutingProposal) return null;

  // Extract fields
  const soothingMatch = content.match(/LỜI NHẮN AN TÂM TỪ BÁC SĨ:?\s*\n\*?([^\n*]+(?:\n[^\n*]+)*)\*?/i);
  const specMatch = content.match(/(?:CHUYÊN KHOA (?:ĐỀ XUẤT|CHỈ ĐỊNH):?\s*)(?:\*\*)?([^\n*]+)(?:\*\*)?/i);
  const docMatch = content.match(/(?:BÁC SĨ PHỤ TRÁCH:?\s*)(?:\*\*)?([^\n*(]+)(?:\*\*)?(?:\s*\(([^)]+)\))?/i);
  const reasonMatch = content.match(/(?:NHẬN ĐỊNH LÂM SÀNG SƠ BỘ|CĂN CỨ CHUYÊN MÔN):?\s*([^\n]+(?:\n[^\n📚📋👇]+)*)/i);
  const guidelineMatch = content.match(/(?:PHÁC ĐỒ (?:THAM CHIẾU|ĐỐI CHIẾU)):?\s*(?:\*)?([^\n*]+)(?:\*)?/i);
  const footerMatch = content.match(/([^\n]*Mời bạn[^\n]*chọn 1 trong 3 khung giờ[^\n]*)/i);

  return {
    soothingMessage: soothingMatch ? soothingMatch[1].trim().replace(/\*/g, "") : "",
    specialtyName: specMatch ? specMatch[1].trim() : "Chuyên khoa chỉ định",
    doctorName: docMatch ? docMatch[1].trim() : "Bác sĩ chuyên khoa",
    doctorRoom: docMatch && docMatch[2] ? docMatch[2].trim() : "Phòng khám chuyên khoa",
    reasoning: reasonMatch ? reasonMatch[1].trim().replace(/\*\*/g, "") : "",
    guideline: guidelineMatch ? guidelineMatch[1].trim().replace(/\*/g, "") : "",
    footer: footerMatch ? footerMatch[1].trim() : "",
  };
}

export function ClinicalMessageRenderer({
  content,
  soothingPayload,
}: ClinicalMessageRendererProps) {
  const routingData = parseRoutingSection(content);

  // If this is a final routing proposal, render the Luxury Medical Routing Card
  if (routingData) {
    const soothingText =
      routingData.soothingMessage ||
      soothingPayload?.comfortingMessage ||
      `Bạn hãy yên tâm nhé, đội ngũ Bác sĩ chuyên khoa ${routingData.specialtyName} tại Bệnh viện VMEC luôn sẵn sàng đồng hành và chăm sóc sức khỏe tốt nhất cho bạn.`;

    return (
      <div className="space-y-4">
        {/* 1. TOP SECTION: Warm Reassurance & Psychological Soothing (Lời Nhắn An Tâm Được Tạo Bên Trên) */}
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-surface p-4 sm:p-5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                <HeartHandshake size={14} />
              </div>
              <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide">
                Lời Nhắn An Tâm Từ Bác Sĩ
              </span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              Đồng Cảm Y Khoa
            </span>
          </div>

          <p className="text-emerald-950 text-xs sm:text-sm leading-relaxed italic font-normal">
            &ldquo;{soothingText}&rdquo;
          </p>

          {soothingPayload?.immediateSelfCareTips && soothingPayload.immediateSelfCareTips.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/60">
              <div className="flex items-center gap-1 font-bold text-emerald-900 mb-1.5 text-2xs uppercase tracking-wider">
                <Sparkles size={11} className="text-emerald-600" />
                <span>Gợi ý tự chăm sóc tại nhà lúc này:</span>
              </div>
              <ul className="space-y-1 pl-1">
                {soothingPayload.immediateSelfCareTips.slice(0, 2).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-2xs text-emerald-950">
                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 2. MIDDLE SECTION: Structured Clinical Routing Card */}
        <div className="rounded-2xl border border-primary-300 bg-gradient-to-b from-primary-50/50 via-surface to-surface p-4 sm:p-5 shadow-xs transition-all space-y-3.5">
          {/* Card Top Pill Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-primary-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-700 text-white shadow-2xs">
                <Stethoscope size={14} />
              </span>
              <span className="text-xs font-bold tracking-wide text-primary-950 uppercase">
                Chỉ Định Chuyên Khoa
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
              <CheckCircle2 size={11} className="text-emerald-700" />
              Chuẩn Phác Đồ BYT
            </span>
          </div>

          {/* Specialty & Doctor Hero Block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-surface/90 border border-primary-100 p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary-700 to-primary-600 text-white font-bold text-base shadow-xs">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-primary-700">
                  {routingData.specialtyName}
                </div>
                <div className="text-sm font-bold text-ink-900 mt-0.5">
                  {routingData.doctorName}
                </div>
                <div className="text-caption text-ink-600 flex items-center gap-1 mt-0.5">
                  <Building2 size={12} className="text-primary-600 shrink-0" />
                  <span>{routingData.doctorRoom}</span>
                </div>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="inline-block rounded-lg bg-primary-50 px-2.5 py-1 text-2xs font-bold text-primary-800 border border-primary-200">
                Đề xuất ưu tiên
              </span>
            </div>
          </div>

          {/* Clinical Reasoning Callout */}
          {routingData.reasoning && (
            <div className="rounded-xl border border-line bg-bg-muted/70 p-3 text-xs leading-relaxed text-ink-800">
              <div className="flex items-center gap-1.5 font-bold text-ink-900 mb-1">
                <Sparkles size={13} className="text-primary-600" />
                <span>Nhận Định Lâm Sàng Sơ Bộ:</span>
              </div>
              <p className="text-ink-700">{routingData.reasoning}</p>
            </div>
          )}

          {/* Reference Guideline */}
          {routingData.guideline && (
            <div className="flex items-start gap-2 text-2xs text-ink-600 rounded-lg bg-surface p-2 border border-line/60">
              <FileText size={13} className="mt-0.5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-ink-800">Phác đồ tham chiếu: </span>
                <span className="italic">{routingData.guideline}</span>
              </div>
            </div>
          )}

          {/* 3. HARD CLINICAL GUIDELINES SECTION: Chỉ Dẫn Cứng Chuẩn Bị Khám */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-ink-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs border-b border-amber-200/70 pb-1.5">
              <ClipboardList size={14} className="text-amber-700 shrink-0" />
              <span>Chỉ Dẫn Chuẩn Bị Trước Khi Đến Khám:</span>
            </div>
            <div className="space-y-1.5 text-2xs sm:text-xs text-ink-800">
              <div className="flex items-start gap-2">
                <FileBadge size={13} className="text-amber-700 shrink-0 mt-0.5" />
                <span><strong>Giấy tờ cần mang:</strong> CCCD/VNeID, thẻ BHYT (nếu có) và sổ khám/đơn thuốc cũ đã dùng.</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={13} className="text-amber-700 shrink-0 mt-0.5" />
                <span><strong>Thời gian có mặt:</strong> Nên đến trước giờ hẹn 10 - 15 phút tại Quầy Lễ tân để nhận số thứ tự ưu tiên.</span>
              </div>
              <div className="flex items-start gap-2">
                <UtensilsCrossed size={13} className="text-amber-700 shrink-0 mt-0.5" />
                <span><strong>Lưu ý ăn uống:</strong> Nên nhịn ăn sáng nếu cần làm xét nghiệm máu hoặc siêu âm bụng (vẫn được uống nước lọc).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer instruction */}
        {routingData.footer && (
          <p className="text-caption text-ink-600 italic mt-2">
            {formatMarkdownInline(routingData.footer)}
          </p>
        )}
      </div>
    );
  }

  // Intermediate Message Rendering: Highlight Clarifying Questions and format markdown cleanly
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-3 leading-relaxed text-body text-ink-900">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Highlight clarifying question box
        if (
          trimmed.includes("CÂU HỎI LÀM RÕ") ||
          trimmed.startsWith("❓") ||
          trimmed.includes("Để hỗ trợ bác sĩ")
        ) {
          return (
            <div
              key={pIdx}
              className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50/70 via-surface to-primary-50/40 p-3.5 text-body-sm shadow-2xs space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary-800">
                <ShieldCheck size={15} className="text-primary-700 shrink-0" />
                <span>Câu Hỏi Lâm Sàng Cần Làm Rõ:</span>
              </div>
              <div className="text-ink-900 font-medium pl-5">
                {formatMarkdownInline(
                  trimmed
                    .replace(/❓\s*\*\*CÂU HỎI LÀM RÕ:\*\*/g, "")
                    .replace(/\*\*CÂU HỎI LÀM RÕ:\*\*/g, "")
                    .replace(/Để hỗ trợ bác sĩ[^\n]*\n?/g, "")
                    .trim()
                )}
              </div>
            </div>
          );
        }

        // Bullet point list parsing
        if (trimmed.includes("\n•") || trimmed.startsWith("•") || trimmed.startsWith("- ")) {
          const lines = trimmed.split(/\n/);
          return (
            <ul key={pIdx} className="space-y-1.5 pl-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
                if (!cleanLine) return null;
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-body-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-600 mt-2 shrink-0" />
                    <span>{formatMarkdownInline(cleanLine)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Normal paragraph with bold & italic styling
        return (
          <p key={pIdx} className="text-body-sm">
            {formatMarkdownInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

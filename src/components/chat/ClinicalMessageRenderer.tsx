"use client";

import React, { type ReactNode } from "react";
import {
  Stethoscope,
  Building2,
  FileCheck2,
  HelpCircle,
  Sparkles,
  UserCheck,
  CheckCircle,
} from "lucide-react";

interface ClinicalMessageRendererProps {
  content: string;
}

/**
 * Parses markdown inline formatting (**bold**, *italic*, bullet points) into clean React elements
 */
export function formatMarkdownInline(text: string): ReactNode[] {
  // Split by bold (**...**) and italic (*...*)
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return tokens.map((token, index) => {
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
  });
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

  // Extract fields via Regex
  const introMatch = content.match(/^(.*?)(?=🏥|\n\s*•|\n\s*CHUYÊN KHOA)/s);
  const specMatch = content.match(/(?:CHUYÊN KHOA (?:ĐỀ XUẤT|CHỈ ĐỊNH):?\s*)(?:\*\*)?([^\n*]+)(?:\*\*)?/i);
  const docMatch = content.match(/(?:BÁC SĨ PHỤ TRÁCH:?\s*)(?:\*\*)?([^\n*(]+)(?:\*\*)?(?:\s*\(([^)]+)\))?/i);
  const reasonMatch = content.match(/(?:NHẬN ĐỊNH LÂM SÀNG SƠ BỘ|CĂN CỨ CHUYÊN MÔN):?\s*([^\n]+(?:\n[^\n📚👇]+)*)/i);
  const guidelineMatch = content.match(/(?:PHÁC ĐỒ (?:THAM CHIẾU|ĐỐI CHIẾU)):?\s*(?:\*)?([^\n*]+)(?:\*)?/i);
  const footerMatch = content.match(/([^\n]*Mời bạn xem Lời nhắn an tâm[^\n]*)/i);

  return {
    intro: introMatch ? introMatch[1].trim() : "",
    specialtyName: specMatch ? specMatch[1].trim() : "Chuyên khoa chỉ định",
    doctorName: docMatch ? docMatch[1].trim() : "Bác sĩ chuyên khoa",
    doctorRoom: docMatch && docMatch[2] ? docMatch[2].trim() : "Phòng khám chuyên khoa",
    reasoning: reasonMatch ? reasonMatch[1].trim().replace(/\*\*/g, "") : "",
    guideline: guidelineMatch ? guidelineMatch[1].trim().replace(/\*/g, "") : "",
    footer: footerMatch ? footerMatch[1].trim() : "",
  };
}

export function ClinicalMessageRenderer({ content }: ClinicalMessageRendererProps) {
  const routingData = parseRoutingSection(content);

  // If this is a final routing proposal, render the Luxury Medical Routing Card
  if (routingData) {
    return (
      <div className="space-y-4">
        {/* Intro text */}
        {routingData.intro && (
          <p className="text-body text-ink-800 leading-relaxed">
            {formatMarkdownInline(routingData.intro)}
          </p>
        )}

        {/* Structured Luxury Card */}
        <div className="rounded-2xl border border-primary-300 bg-gradient-to-b from-primary-50/60 via-surface to-surface p-4 sm:p-5 shadow-xs transition-all">
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
              <CheckCircle size={11} className="text-emerald-700" />
              Chuẩn Phác Đồ BYT
            </span>
          </div>

          {/* Specialty & Doctor Hero Block */}
          <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-surface/90 border border-primary-100 p-3.5 shadow-2xs">
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
                Đề xuất ưu tiên hàng đầu
              </span>
            </div>
          </div>

          {/* Clinical Reasoning Callout */}
          {routingData.reasoning && (
            <div className="mt-3 rounded-xl border border-line bg-bg-muted/70 p-3 text-xs leading-relaxed text-ink-800">
              <div className="flex items-center gap-1.5 font-bold text-ink-900 mb-1">
                <Sparkles size={13} className="text-primary-600" />
                <span>Nhận Định Lâm Sàng:</span>
              </div>
              <p className="text-ink-700">{routingData.reasoning}</p>
            </div>
          )}

          {/* Reference Guideline */}
          {routingData.guideline && (
            <div className="mt-2.5 flex items-start gap-2 text-2xs text-ink-600 rounded-lg bg-surface p-2 border border-line/60">
              <FileCheck2 size={13} className="mt-0.5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-ink-800">Phác đồ tham chiếu: </span>
                <span className="italic">{routingData.guideline}</span>
              </div>
            </div>
          )}
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
                <HelpCircle size={15} className="text-primary-700 shrink-0" />
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

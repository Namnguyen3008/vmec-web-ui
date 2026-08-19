"use client";

import { useState } from "react";
import { NotebookPen, HelpCircle, UserCheck, ChevronDown, ChevronUp, User } from "lucide-react";

const defaultQuestions = [
  "Chi phí khám chuyên khoa là bao nhiêu?",
  "Tôi cần chuẩn bị gì trước khi đi khám?",
  "Có thể đổi bác sĩ khám khác không?",
  "Tôi có được dùng BHYT khi đặt qua AI không?",
];

export function PatientInfoSidebar({
  name,
  meta,
  recordedSymptoms = [],
  onSelectQuestion,
}: {
  name: string;
  meta: string;
  recordedSymptoms?: string[];
  onSelectQuestion?: (question: string) => void;
}) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const displaySymptoms =
    recordedSymptoms.length > 0
      ? recordedSymptoms
      : ["Đang chờ người dùng mô tả triệu chứng..."];

  const content = (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xl shadow-inner">
          <UserCheck size={26} />
        </div>
        <p className="mt-2 font-bold text-ink-900 text-body-lg">{name}</p>
        <p className="text-caption text-ink-500">{meta}</p>
      </div>

      <div className="border-t border-line pt-4">
        <p className="text-caption font-bold tracking-wide text-ink-500 uppercase">
          Thông tin tư vấn hiện tại
        </p>
        <div className="mt-2.5 flex gap-2.5 rounded-xl border border-warning/40 bg-warning-soft/20 p-3.5">
          <NotebookPen size={18} className="mt-0.5 shrink-0 text-warning-800" />
          <div className="text-body text-ink-900 w-full">
            <p className="font-semibold text-body-sm text-warning-900">Triệu chứng đã bóc tách:</p>
            <ul className="mt-1 space-y-1 text-caption text-ink-800">
              {displaySymptoms.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Banner & Collapsible Drawer */}
      <div className="lg:hidden w-full border-b border-line bg-surface px-4 py-2.5 shadow-2xs">
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="flex w-full items-center justify-between font-medium text-body-sm text-primary-900"
        >
          <span className="flex items-center gap-2 font-bold">
            <User size={16} className="text-primary-700" />
            Hồ sơ: {name}
            {recordedSymptoms.length > 0 && (
              <span className="ml-1 rounded-full bg-primary-100 px-2 py-0.5 text-caption font-bold text-primary-800">
                {recordedSymptoms.length} triệu chứng
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-caption text-primary-700 font-semibold">
            {mobileExpanded ? "Thu gọn" : "Xem hồ sơ & FAQ"}
            {mobileExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {mobileExpanded && (
          <div className="mt-3 border-t border-line pt-3 pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {content}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-full max-w-xs xl:max-w-sm shrink-0 border-l border-line bg-surface p-6 overflow-y-auto">
        {content}
      </aside>
    </>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Stethoscope, Clock, CheckCircle2, Building2, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AppointmentOffer } from "@/lib/api/contracts";

export interface DoctorSlotSelectorProps {
  offers: AppointmentOffer[];
  onSelectOffer: (offer: AppointmentOffer) => void;
  onChangeAppointment: () => void;
  onDeclineAppointment: () => void;
  isSubmitting?: boolean;
  rawTextMessage?: string;
}

/**
 * Hàm phân tích văn bản tin nhắn để lấy danh sách bác sĩ dạng fallback
 * nếu mảng `offers` trả về từ API rỗng nhưng AI có gợi ý danh sách dạng bullet point.
 */
function parseOffersFromText(text?: string): AppointmentOffer[] {
  if (!text) return [];

  const lines = text.split("\n");
  const parsedOffers: AppointmentOffer[] = [];

  let currentOffer: Partial<AppointmentOffer> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Khớp dạng: • BS. Lê Văn Đạt (Khoa Da liễu) — 17:30, 10/08/2026
    const doctorMatch = line.match(/^•\s*(BS\.\s*[^—(]+)(?:\(([^)]+)\))?\s*—\s*(\d{1,2}:\d{2}),?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);

    if (doctorMatch) {
      if (currentOffer && currentOffer.doctorName) {
        parsedOffers.push(currentOffer as AppointmentOffer);
      }

      const doctorName = doctorMatch[1].trim();
      const specialtyName = doctorMatch[2]?.trim() || "Da liễu";
      const timeStr = doctorMatch[3].trim();
      const dateStr = doctorMatch[4].trim();

      // Convert date/time to ISO String
      const [day, month, year] = dateStr.split("/").map(Number);
      const [hour, minute] = timeStr.split(":").map(Number);
      const slotStartDate = new Date(year, month - 1, day, hour, minute);
      const isoStart = isNaN(slotStartDate.getTime()) ? new Date().toISOString() : slotStartDate.toISOString();

      currentOffer = {
        offerId: `parsed-offer-${parsedOffers.length + 1}`,
        slotId: `parsed-slot-${parsedOffers.length + 1}`,
        specialtyId: "parsed-specialty",
        specialtyName,
        doctorId: `parsed-doc-${parsedOffers.length + 1}`,
        doctorName,
        doctorAvatarUrl: null,
        facilityId: null,
        facilityName: "Bệnh viện Đa khoa Quốc tế Vinmec Smart City",
        facilityAddress: null,
        room: "Sẽ được thông báo",
        slotStart: isoStart,
        slotEnd: isoStart,
        isMock: true,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      };
      continue;
    }

    // Nếu dòng tiếp theo chứa thông tin cơ sở
    if (currentOffer && line.includes("Bệnh viện")) {
      const parts = line.split("|").map((s) => s.trim());
      if (parts[0]) currentOffer.facilityName = parts[0];
      if (parts[1]) currentOffer.room = parts[1];
    }
  }

  if (currentOffer && currentOffer.doctorName) {
    parsedOffers.push(currentOffer as AppointmentOffer);
  }

  return parsedOffers;
}

function formatSlotDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return isoString;
  }
}

function getDoctorInitials(name: string): string {
  const clean = name.replace(/^BS\.\s*/i, "").trim();
  const parts = clean.split(" ");
  if (parts.length >= 2) {
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function DoctorSlotSelector({
  offers,
  onSelectOffer,
  onChangeAppointment,
  onDeclineAppointment,
  isSubmitting = false,
  rawTextMessage,
}: DoctorSlotSelectorProps) {
  // Lấy dữ liệu từ offers API hoặc fallback parse từ text
  const displayOffers = useMemo(() => {
    if (offers && offers.length > 0) return offers;
    return parseOffersFromText(rawTextMessage);
  }, [offers, rawTextMessage]);

  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  useEffect(() => {
    if (displayOffers.length > 0 && (!selectedSlotId || !displayOffers.some((o) => o.slotId === selectedSlotId))) {
      setSelectedSlotId(displayOffers[0].slotId);
    }
  }, [displayOffers, selectedSlotId]);

  if (displayOffers.length === 0) {
    return null;
  }

  const selectedOffer = displayOffers.find((o) => o.slotId === selectedSlotId) || displayOffers[0];

  return (
    <section
      className="ml-0 sm:ml-12 rounded-2xl border border-primary-200/80 bg-surface p-4 sm:p-5 shadow-xs transition-all animate-in fade-in duration-200"
      aria-label="Chọn bác sĩ và khung giờ khám"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="text-body-lg font-bold text-ink-900 flex items-center gap-2">
            <Sparkles size={18} className="text-primary-600 shrink-0" />
            Chọn Bác sĩ &amp; Khung giờ phù hợp
          </h3>
          <p className="text-caption text-ink-500 mt-0.5">
            Hệ thống gợi ý các slot phù hợp nhất với triệu chứng đã phân loại ({selectedOffer?.specialtyName}).
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary-100 px-3 py-1 text-caption font-bold text-primary-800">
          {displayOffers.length} phương án
        </span>
      </div>

      {/* Cards List */}
      <div className="mt-4 space-y-3">
        {displayOffers.map((offer, index) => {
          const isSelected = offer.slotId === selectedSlotId;
          const isBestMatch = index === 0;

          return (
            <div
              key={offer.slotId}
              onClick={() => setSelectedSlotId(offer.slotId)}
              className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all cursor-pointer ${
                isSelected
                  ? "border-primary-600 bg-primary-50/70 ring-2 ring-primary-500/20 shadow-xs"
                  : "border-line bg-surface hover:border-primary-300 hover:bg-bg-muted/40"
              }`}
            >
              {/* Radio Indicator */}
              <div className="flex items-center gap-3.5 flex-1">
                <div className="shrink-0">
                  {isSelected ? (
                    <CheckCircle2 size={22} className="text-primary-700 fill-primary-100" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-line group-hover:border-primary-400" />
                  )}
                </div>

                {/* Doctor Avatar / Badge */}
                <div className="relative shrink-0">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-caption shadow-2xs ${
                      isSelected
                        ? "bg-primary-700 text-white"
                        : "bg-bg-muted text-ink-700 group-hover:bg-primary-100 group-hover:text-primary-900"
                    }`}
                  >
                    {offer.doctorAvatarUrl ? (
                      // eslint-disable-next-next/no-img-element
                      <img
                        src={offer.doctorAvatarUrl}
                        alt={offer.doctorName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getDoctorInitials(offer.doctorName)
                    )}
                  </div>
                </div>

                {/* Info details */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-900 text-body group-hover:text-primary-900">
                      {offer.doctorName}
                    </span>
                    {isBestMatch && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-accent-orange/15 px-2 py-0.5 text-caption font-bold text-accent-orange-strong">
                        <Sparkles size={11} /> Đề xuất tốt nhất
                      </span>
                    )}
                    {!isBestMatch && (
                      <span className="rounded-md bg-bg-muted px-2 py-0.5 text-caption font-medium text-ink-500">
                        Phương án #{index + 1}
                      </span>
                    )}
                  </div>

                  <p className="text-caption text-ink-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium text-primary-800">{offer.specialtyName}</span>
                    <span className="flex items-center gap-1 text-ink-500">
                      <Building2 size={13} className="shrink-0" />
                      {offer.facilityName} {offer.room ? `• ${offer.room}` : ""}
                    </span>
                  </p>
                </div>
              </div>

              {/* Slot Time Badge */}
              <div className="shrink-0 sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60 flex sm:flex-col justify-between items-center sm:items-end">
                <span className="text-caption text-ink-500 sm:hidden">Khung giờ:</span>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-caption font-bold ${
                    isSelected
                      ? "bg-primary-900 text-white"
                      : "bg-primary-50 text-primary-900 border border-primary-200"
                  }`}
                >
                  <Clock size={13} strokeWidth={2.5} />
                  {formatSlotDateTime(offer.slotStart)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Action Footer */}
      {selectedOffer && (
        <div className="mt-5 pt-4 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-bg-muted/40 p-3.5 rounded-xl">
          <div className="flex items-center gap-2.5">
            <UserCheck size={20} className="text-primary-700 shrink-0" />
            <div>
              <p className="text-caption text-ink-500">Bác sĩ đang chọn:</p>
              <p className="text-body font-bold text-ink-900">
                {selectedOffer.doctorName} —{" "}
                <span className="text-primary-700 font-medium">
                  {formatSlotDateTime(selectedOffer.slotStart)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={isSubmitting}
              onClick={() => onSelectOffer(selectedOffer)}
              className="w-full sm:w-auto shadow-xs font-bold"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận & Giữ chỗ (10 phút)"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isSubmitting}
              onClick={onChangeAppointment}
              className="w-full sm:w-auto"
            >
              Xem lịch khác
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isSubmitting}
              onClick={onDeclineAppointment}
              className="w-full sm:w-auto text-ink-500"
            >
              Để sau
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

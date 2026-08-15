"use client";

import { useState } from "react";
import { PatientFilterTabs, PatientTable, type PatientRow } from "@/components/staff/PatientTable";
import { PatientDetailPanel, type PatientDetail } from "@/components/staff/PatientDetailPanel";

const rows: PatientRow[] = [
  {
    id: "8943",
    initial: "B",
    name: "Trần Văn B",
    code: "#BN-8943",
    phone: "0912345678",
    reason: "Đau khớp gối phải kéo dài",
    department: "Khoa Chấn thương Chỉnh hình",
    status: { label: "Đang khám", tone: "neutral" },
  },
  {
    id: "8945",
    initial: "M",
    name: "Lê Thị Mai",
    code: "#BN-8945",
    phone: "0987654321",
    reason: "Kiểm tra tổng quát định kỳ",
    department: "Khoa Nội Tổng hợp",
    status: { label: "Chờ khám", tone: "neutral" },
  },
  {
    id: "8942",
    initial: "C",
    name: "Phạm Văn C",
    code: "#BN-8942",
    phone: "0901234567",
    reason: "Đau ngực dữ dội, khó thở",
    department: "Khoa Tim mạch / Cấp cứu",
    status: { label: "Cấp cứu", tone: "danger" },
    emergency: true,
  },
];

const details: Record<string, PatientDetail> = {
  "8943": {
    name: "Trần Văn B",
    meta: "Nam, 45 Tuổi • #BN-8943",
    phone: "0912 345 678",
    aiSummary:
      "Bệnh nhân khai báo đau nhức khớp gối phải kéo dài 2 tuần, đi lại khó khăn, đau tăng khi leo cầu thang. Tiền sử thoái hóa khớp nhẹ phát hiện cách đây 1 năm.",
    history: [
      { date: "15/08/2023", label: "Khám Nội khoa", note: "BS. Nguyễn Văn A • Đau dạ dày nhẹ" },
      { date: "10/02/2023", label: "Khám Tổng quát", note: "BS. Lê Thị C • Bình thường" },
    ],
  },
  "8945": {
    name: "Lê Thị Mai",
    meta: "Nữ, 62 Tuổi • #BN-8945",
    phone: "0987 654 321",
    aiSummary: "Khám sức khỏe tổng quát định kỳ hàng năm, chưa ghi nhận triệu chứng bất thường.",
    history: [{ date: "10/02/2023", label: "Khám Tổng quát", note: "BS. Lê Thị C • Bình thường" }],
  },
  "8942": {
    name: "Phạm Văn C",
    meta: "Nam, 62 Tuổi • #BN-8942",
    phone: "0901 234 567",
    aiSummary:
      "Đau ngực dữ dội, khó thở, lan ra tay trái. Nghi ngờ nhồi máu cơ tim (NMCT) - đã chuyển luồng cấp cứu khẩn cấp.",
    history: [{ date: "15/08/2023", label: "Khám Nội khoa", note: "BS. Nguyễn Văn A • Cao huyết áp" }],
  },
};

export function PatientManagementView() {
  const [selectedId, setSelectedId] = useState(rows[0].id);
  const detail = details[selectedId];

  return (
    <>
      <PatientFilterTabs active="Đang khám" />

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <PatientTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        <PatientDetailPanel patient={detail} />
      </div>
    </>
  );
}

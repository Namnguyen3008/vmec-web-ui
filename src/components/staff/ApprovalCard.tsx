import { CircleUserRound, TriangleAlert, Sparkles, SquarePlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function EmergencyApprovalCard({
  name,
  patientId,
  time,
  symptoms,
  aiWarning,
}: {
  name: string;
  patientId: string;
  time: string;
  symptoms: string;
  aiWarning: string;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="flex gap-4 border-l-4 border-danger bg-surface p-5">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft text-danger">
                <CircleUserRound size={20} />
              </span>
              <div>
                <p className="font-bold text-ink-900">{name}</p>
                <p className="text-caption text-ink-500">
                  Mã bệnh nhân: {patientId} • Đặt lúc {time}
                </p>
              </div>
            </div>
            <Badge tone="danger">
              <TriangleAlert size={12} /> KHẨN CẤP
            </Badge>
          </div>

          <div className="mt-4 space-y-1.5 rounded-xl bg-danger-soft/30 p-4 text-body text-ink-900">
            <p>
              <span className="font-semibold">Triệu chứng:</span> {symptoms}
            </p>
            <p className="flex items-start gap-1.5 font-semibold text-danger">
              <SquarePlus size={16} className="mt-0.5 shrink-0" /> AI Cảnh báo: {aiWarning}
            </p>
          </div>

          <div className="mt-4">
            <Button variant="danger" size="sm" icon={<SquarePlus size={16} />}>
              Xử lý Cấp cứu Khẩn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoutineApprovalCard({
  name,
  patientId,
  time,
  symptoms,
  suggestion,
  doctor,
  confidence,
}: {
  name: string;
  patientId: string;
  time: string;
  symptoms: string;
  suggestion: string;
  doctor: string;
  confidence: number;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-soft text-ink-700">
            <CircleUserRound size={20} />
          </span>
          <div>
            <p className="font-bold text-ink-900">{name}</p>
            <p className="text-caption text-ink-500">
              Mã bệnh nhân: {patientId} • Đặt lúc {time}
            </p>
          </div>
        </div>
        <Badge tone="neutral">Thường quy</Badge>
      </div>

      <div className="mt-4 space-y-1.5 rounded-xl bg-bg-muted p-4 text-body text-ink-900">
        <p>
          <span className="font-semibold">Triệu chứng khai báo:</span> {symptoms}
        </p>
        <p className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-primary-700">
            <Sparkles size={15} /> AI Đề xuất: {suggestion}
          </span>
          <Badge tone="orange">Tin cậy: {confidence}%</Badge>
        </p>
        <p className="text-ink-700">Bác sĩ phù hợp: {doctor}</p>
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" size="sm">
          Chỉnh sửa chuyên khoa
        </Button>
        <Button size="sm">Phê duyệt &amp; Đặt lịch</Button>
      </div>
    </div>
  );
}

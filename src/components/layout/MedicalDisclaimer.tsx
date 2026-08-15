import { Info } from "lucide-react";

export function MedicalDisclaimer({
  text = "Thông tin do AI gợi ý chỉ mang tính tham khảo, không thay thế chẩn đoán y khoa chuyên nghiệp.",
}: {
  text?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line bg-bg-muted px-6 py-3 text-body text-ink-700">
      <Info size={18} className="mt-0.5 shrink-0 text-primary-700" />
      <p>
        <span className="font-bold text-primary-900">MedAgent khuyến cáo: </span>
        {text}
      </p>
    </div>
  );
}

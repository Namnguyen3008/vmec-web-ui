import { Bone, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function SpecialtyCard({
  name,
  desc,
  confidence,
}: {
  name: string;
  desc: string;
  confidence: number;
}) {
  return (
    <div className="ml-12 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-200/50 text-primary-700">
          <Bone size={20} />
        </span>
        <div>
          <p className="font-bold text-ink-900">{name}</p>
          <p className="text-body text-ink-700">{desc}</p>
        </div>
      </div>
      <Badge tone="orange">Độ phù hợp: {confidence}%</Badge>
    </div>
  );
}

export function DoctorSlotCard({
  name,
  title,
  rating,
  slots,
}: {
  name: string;
  title: string;
  rating: number;
  slots: string[];
}) {
  return (
    <div className="ml-12 rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary-200" />
        <div>
          <p className="font-bold text-ink-900">{name}</p>
          <p className="flex items-center gap-1.5 text-body text-ink-700">
            {title}
            <span className="flex items-center gap-0.5 text-warning">
              <Star size={13} fill="currentColor" /> {rating}
            </span>
          </p>
        </div>
      </div>
      <p className="mt-4 text-body font-medium text-ink-700">Chọn lịch khám sớm nhất:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            className="rounded-xl border border-line px-4 py-2 text-body font-medium text-ink-900 hover:border-primary-400 hover:bg-primary-200/20"
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}

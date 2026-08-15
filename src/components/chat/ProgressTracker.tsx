import { Check } from "lucide-react";

const steps = ["Làm rõ triệu chứng", "Gợi ý Chuyên khoa", "Chọn khung giờ", "Xác nhận"];

export function ProgressTracker({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full border-b border-line bg-surface px-4 py-3 sm:px-6 sm:py-4 overflow-x-auto scrollbar-none">
      <div className="flex items-center min-w-[500px] sm:min-w-0">
        {steps.map((step, i) => {
          const index = i + 1;
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-caption font-bold transition-all ${
                    done
                      ? "bg-primary-900 text-white"
                      : active
                        ? "border-2 border-primary-700 text-primary-700 ring-2 ring-primary-100"
                        : "border-2 border-line-strong text-ink-500"
                  }`}
                >
                  {done ? <Check size={14} className="sm:w-4 sm:h-4" /> : index}
                </span>
                <span
                  className={`whitespace-nowrap text-caption font-semibold ${
                    active || done ? "text-primary-900 font-bold" : "text-ink-500"
                  }`}
                >
                  {step}
                </span>
              </div>
              {index !== steps.length && (
                <span
                  className={`mx-2 sm:mx-3 h-0.5 flex-1 transition-colors ${done ? "bg-primary-900" : "bg-line-strong"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

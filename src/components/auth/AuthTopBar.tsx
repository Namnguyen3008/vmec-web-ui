import Link from "next/link";
import { Briefcase, HelpCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function AuthTopBar() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo subtitle="Bệnh viện Đa khoa Quốc tế" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="#"
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-body font-medium text-ink-700 hover:bg-bg-muted"
          >
            <HelpCircle size={16} /> Trung tâm hỗ trợ
          </Link>
        </div>
      </div>
    </header>
  );
}

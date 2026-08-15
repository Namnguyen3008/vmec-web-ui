import { Globe, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const quickLinks = ["Về chúng tôi", "Đội ngũ bác sĩ", "Gói khám sức khỏe", "Tin tức y khoa"];
const services = ["Tư vấn AI 24/7", "Khám từ xa (Telehealth)", "Xét nghiệm tại nhà", "Chăm sóc dài hạn"];

export function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="[&_span]:text-white">
            <Logo />
          </div>
          <p className="mt-4 text-body text-white/70">
            Hệ thống chăm sóc sức khỏe tiên phong ứng dụng trí tuệ nhân tạo (AI)
            trong chẩn đoán và điều trị tại Việt Nam.
          </p>
          <div className="mt-5 flex gap-3">
            {[Globe, Mail, Phone].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
              >
                <Icon size={16} />
              </span>
            ))}
          </div>
        </div>

        <FooterColumn title="Liên kết nhanh" items={quickLinks} />
        <FooterColumn title="Dịch vụ" items={services} />

        <div>
          <h4 className="font-bold">Thông tin liên hệ</h4>
          <ul className="mt-4 space-y-3 text-body text-white/70">
            <li className="flex gap-2">
              <MapPin size={18} className="mt-0.5 shrink-0" />
              Số 1 Đại Cồ Việt, phường Bạch Mai, Hà Nội
            </li>
            <li className="flex gap-2">
              <Phone size={18} className="mt-0.5 shrink-0" />
              Đường dây nóng: 1900 1234
            </li>
            <li className="flex gap-2">
              <Mail size={18} className="mt-0.5 shrink-0" />
              contact@medagent.vn
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 text-center text-caption text-white/60">
        <p>© 2026 MedAgent. Tất cả các quyền được bảo lưu. Thiết kế bởi Hệ thống AI MedAgent.</p>
        <p className="mt-1">
          Note: MedAgent AI chỉ đóng vai trò hỗ trợ định hướng chuyên khoa và tra cứu
          lịch khám. Mọi thông tin gợi ý mang tính chất tham khảo, vui lòng gặp trực
          tiếp Bác sĩ để được tư vấn chính xác.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-bold">{title}</h4>
      <ul className="mt-4 space-y-3 text-body text-white/70">
        {items.map((item) => (
          <li key={item}>
            <a href="#" className="hover:text-white">
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { RoleSwitcherMenu } from "@/components/layout/RoleSwitcherMenu";

const links = [
  { label: "Dịch vụ", href: "#services" },
  { label: "Đội ngũ Bác sĩ", href: "#doctors" },
  { label: "Nghiên cứu", href: "#research" },
  { label: "Về chúng tôi", href: "#about" },
];

export function NavBar() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-body font-medium text-ink-700 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary-700">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <RoleSwitcherMenu />
          <Button href="/login" size="md">
            Đăng nhập
          </Button>
        </div>
      </div>
    </header>
  );
}

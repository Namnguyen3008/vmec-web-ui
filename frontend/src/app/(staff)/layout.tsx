import { RoleGuard } from "@/components/auth/RoleGuard";
import { RECEPTIONIST_ROLES } from "@/lib/auth/roles";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={RECEPTIONIST_ROLES} loginPath="/login">
      {children}
    </RoleGuard>
  );
}

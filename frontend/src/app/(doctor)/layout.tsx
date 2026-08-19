import { DoctorShell } from "@/components/layout/DoctorShell";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DOCTOR_ROLES } from "@/lib/auth/roles";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={DOCTOR_ROLES} loginPath="/login">
      <DoctorShell>{children}</DoctorShell>
    </RoleGuard>
  );
}

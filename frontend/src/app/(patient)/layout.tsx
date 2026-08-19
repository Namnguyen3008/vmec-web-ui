import { PatientHeader } from "@/components/layout/PatientHeader";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PATIENT_ROLES } from "@/lib/auth/roles";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={PATIENT_ROLES} loginPath="/login">
      <div className="min-h-screen bg-bg">
        <PatientHeader />
        {children}
      </div>
    </RoleGuard>
  );
}

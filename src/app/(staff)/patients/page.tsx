import { StaffShell } from "@/components/layout/StaffShell";
import { PatientManagementView } from "@/components/staff/PatientManagementView";

export default function PatientsPage() {
  return (
    <StaffShell title="Điều phối Lâm sàng">
      <div className="px-8 py-6">
        <h1 className="text-h1 font-bold text-ink-900">Danh sách &amp; Hồ sơ Bệnh nhân</h1>
        <p className="mt-1 text-body-lg text-ink-700">
          Quản lý và theo dõi trạng thái bệnh nhân trong ngày.
        </p>

        <div className="mt-6">
          <PatientManagementView />
        </div>
      </div>
    </StaffShell>
  );
}

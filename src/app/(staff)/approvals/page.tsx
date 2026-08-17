"use client";

import { useEffect, useState } from "react";
import { StaffShell } from "@/components/layout/StaffShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { approveAppointment, listReceptionHandovers, listReceptionQueue, proposeAlternative, rejectAppointment } from "@/lib/api/appointments";
import { getRecommendations } from "@/lib/api/catalog";
import type { Appointment, CheckoutSelection } from "@/lib/api/contracts";
import { CheckCircle2, Clock, PlusCircle, Sparkles, User, AlertTriangle, X, RefreshCw } from "lucide-react";

export default function ApprovalsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<CheckoutSelection[]>([]);
  const [reasonsByAppointmentId, setReasonsByAppointmentId] = useState<Record<string, string>>({});
  const [handovers, setHandovers] = useState<Array<Record<string, unknown>>>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Quick form for creating mock request on UI
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newSpecialtyName, setNewSpecialtyName] = useState("Khoa Nội tổng quát");
  const [newDoctorName, setNewDoctorName] = useState("BS. CKI Trần Văn Nam");
  const [newBookingReason, setNewBookingReason] = useState("");

  async function refresh() {
    try {
      const data = await listReceptionQueue();
      setItems(data);
      setError(null);
    } catch (cause) {
      setItems([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải danh sách yêu cầu chờ duyệt. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshHandovers() {
    try {
      const data = await listReceptionHandovers();
      setHandovers(data);
    } catch {
      // Lỗi handover không chặn hàng chờ chính; giữ danh sách rỗng.
      setHandovers([]);
    }
  }

  useEffect(() => {
    const load = () => {
      void listReceptionQueue()
        .then((data) => {
          setItems(data);
          setError(null);
        })
        .catch((cause) => {
          setItems([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải danh sách yêu cầu chờ duyệt. Vui lòng thử lại.",
          );
        })
        .finally(() => setLoading(false));

      void listReceptionHandovers()
        .then(setHandovers)
        .catch(() => setHandovers([]));
    };

    load();
    window.addEventListener("focus", load);
    window.addEventListener("p208:schedule-change", load);
    window.addEventListener("vmec:appointments-change", load);

    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("p208:schedule-change", load);
      window.removeEventListener("vmec:appointments-change", load);
    };
  }, []);

  function handleRetry() {
    setLoading(true);
    setError(null);
    void refresh();
    void refreshHandovers();
  }

  function showToast(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }

  function clearReason(appointmentId: string) {
    setReasonsByAppointmentId((current) => {
      const next = { ...current };
      delete next[appointmentId];
      return next;
    });
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await approveAppointment(id, reasonsByAppointmentId[id]?.trim() || undefined);
      showToast("Đã duyệt & chốt lịch thành công qua API.");
      clearReason(id);
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể duyệt lịch. Vui lòng thử lại.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = reasonsByAppointmentId[id]?.trim() || "";
    if (!reason) return;
    setBusyId(id);
    setError(null);
    try {
      await rejectAppointment(id, reason);
      showToast("Đã từ chối cuộc hẹn thành công qua API.");
      clearReason(id);
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể từ chối cuộc hẹn. Vui lòng thử lại.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function openAlternatives(item: Appointment) {
    setBusyId(item.id);
    setError(null);
    try {
      if (item.specialtyId) {
        const choices = (await getRecommendations(item.specialtyId)).filter((slot) => slot.slotId !== item.scheduleId);
        setAlternatives(choices);
      } else {
        throw new Error("Không xác định được chuyên khoa của yêu cầu.");
      }
      setEditing(item.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải phương án thay thế. Vui lòng thử lại.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handlePropose(item: Appointment, slot: CheckoutSelection) {
    setBusyId(item.id);
    setError(null);
    try {
      await proposeAlternative(item.id, slot.slotId, reasonsByAppointmentId[item.id]?.trim());
      showToast("Đã đề xuất phương án thay thế qua API.");
      setEditing(null);
      clearReason(item.id);
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể gửi đề xuất phương án thay thế. Vui lòng thử lại.",
      );
      setEditing(null);
    } finally {
      setBusyId(null);
    }
  }

  function handleCreateMockRequest() {
    if (!newPatientName.trim()) return;
    const newId = `app-mock-ui-${Date.now()}`;
    const newCode = `APT-UI-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAppointment: Appointment = {
      id: newId,
      appointmentCode: newCode,
      patientId: `pat-ui-${Date.now()}`,
      doctorId: "doc-01",
      doctorName: newDoctorName,
      facilityId: "fac-01",
      facilityName: "Bệnh viện Đa khoa Trung tâm",
      facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      specialtyId: "spec-01",
      specialtyName: newSpecialtyName,
      room: "Phòng khám 102",
      scheduleId: `sch-ui-${Date.now()}`,
      status: "PENDING_RECEPTIONIST_APPROVAL",
      bookingReason: newBookingReason || "Đăng ký khám mới qua giao diện lễ tân",
      patientNotes: "Tạo từ giao diện mockup",
      receptionistNotes: null,
      cancellationReason: null,
      expiresAt: null,
      confirmedAt: null,
      cancelledAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slotStart: new Date(Date.now() + 86400000).toISOString(),
      slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
      patientSnapshot: {
        full_name: newPatientName,
        phone_number: newPatientPhone || "0900 000 000",
        gender: "MALE",
        age: 30,
      },
    };

    setItems((prev) => [newAppointment, ...prev]);
    showToast(`Đã tạo thành công yêu cầu chờ duyệt mới cho ${newPatientName} trên giao diện!`);
    setShowCreateModal(false);
    setNewPatientName("");
    setNewPatientPhone("");
    setNewBookingReason("");
  }

  return (
    <StaffShell title="Điều phối Lâm sàng">
      <div className="px-8 py-6">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-primary-900 p-4 text-body text-white shadow-xl animate-in slide-in-from-top-2">
            <CheckCircle2 size={18} className="text-success shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-h1 font-bold text-ink-900">Yêu cầu chờ lễ tân</h1>
            <p className="mt-1 text-body-lg text-ink-700">
              Duyệt nguyên lịch, từ chối hoặc đề xuất phương án khác. Tạo và thao tác yêu cầu trực tiếp ở giao diện.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setShowCreateModal(true)} icon={<PlusCircle size={16} />}>
              Tạo yêu cầu chờ duyệt (UI Mock)
            </Button>
            <Badge tone="warning">{items.length} đang chờ</Badge>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/60 bg-danger-soft p-4 text-danger">
            <p className="text-body font-medium">{error}</p>
            <Button size="sm" variant="outline" onClick={handleRetry} icon={<RefreshCw size={15} />}>
              Thử lại
            </Button>
          </div>
        )}

        {/* Handovers Section */}
        {handovers.length > 0 && (
          <section className="mt-6 rounded-card border border-warning/60 bg-warning-soft/30 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-warning" /> Triage cần hỗ trợ ({handovers.length})
              </h2>
              <span className="text-caption text-ink-600">Chuyển từ Chatbot AI sang điều phối viên</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {handovers.map((handover) => (
                <div key={String(handover.id)} className="rounded-xl border border-line bg-surface p-4 text-body text-ink-700 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-ink-900">{String(handover.patientName || "Bệnh nhân")}</strong>
                    <span className="text-caption text-ink-500">{String(handover.patientPhone || "")}</span>
                  </div>
                  <p className="mt-1 text-body-sm font-semibold text-warning-800">
                    {String(handover.reason || "Cần lễ tân hỗ trợ")}
                  </p>
                  <p className="mt-1 text-caption text-ink-600 whitespace-pre-wrap">
                    {String(handover.summary || "")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Queue Items List */}
        <div className="mt-6 space-y-4">
          {loading && !error && (
            <div className="rounded-card border border-line bg-surface p-6 text-center text-ink-500">
              <Clock size={18} className="mx-auto mb-2 text-primary-600 animate-pulse" />
              Đang tải danh sách yêu cầu chờ duyệt...
            </div>
          )}
          {!loading && items.length === 0 && !error && (
            <p className="rounded-card border border-line bg-surface p-6 text-center text-ink-500">
              Không có yêu cầu nào đang chờ duyệt.
            </p>
          )}
          {items.map((item) => (
            <article key={item.id} className="rounded-card border border-line bg-surface p-5 shadow-2xs transition-shadow hover:shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-soft text-warning font-bold">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-ink-900 text-body-lg">
                      {String(item.patientSnapshot?.full_name || (item.patientSnapshot as Record<string, unknown>)?.fullName || (item as any).patientDetail?.fullName || "Bệnh nhân")}
                    </p>
                    <p className="text-caption text-ink-500">
                      Mã lịch: <span className="font-semibold text-ink-700">{item.appointmentCode}</span> · SĐT: {String(item.patientSnapshot?.phone_number || (item.patientSnapshot as Record<string, unknown>)?.phoneNumber || (item as any).patientDetail?.phoneNumber || "Chưa có SĐT")}
                    </p>
                  </div>
                </div>
                <Badge tone="warning">Chờ duyệt</Badge>
              </div>

              <div className="mt-4 rounded-xl bg-bg-muted p-4 text-body text-ink-900">
                <p className="font-bold text-primary-900 text-body-lg">
                  {item.specialtyName} · <span className="font-normal text-ink-800">{item.doctorName}</span>
                </p>
                {item.slotStart && (
                  <p className="mt-1 flex items-center gap-1.5 text-ink-700 text-body-sm font-medium">
                    <Clock size={15} className="text-primary-700 shrink-0" />
                    {new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" }).format(new Date(item.slotStart))}
                  </p>
                )}
                <p className="text-caption text-ink-600">
                  {item.facilityName} {item.room ? `· ${item.room}` : ""}
                </p>
                {item.bookingReason && (
                  <p className="mt-2 text-body rounded-lg bg-surface border border-line p-2.5 text-ink-800">
                    <strong>Lý do khám:</strong> {item.bookingReason}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => handleApprove(item.id)}
                >
                  Duyệt và chốt lịch
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAlternatives(item)}
                >
                  Đề xuất bác sĩ/giờ khác
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!reasonsByAppointmentId[item.id]?.trim() || busyId === item.id}
                  onClick={() => handleReject(item.id)}
                >
                  Từ chối
                </Button>
              </div>

              <label className="mt-3 block text-caption font-medium text-ink-700">
                Ghi chú hoặc lý do từ chối (bắt buộc khi Từ chối)
                <input
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-body focus:border-primary-500 focus:outline-none"
                  placeholder="Nhập ghi chú hoặc lý do từ chối..."
                  value={reasonsByAppointmentId[item.id] || ""}
                  onChange={(event) => setReasonsByAppointmentId((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }))}
                />
              </label>

              {editing === item.id && (
                <div className="mt-4 border-t border-line pt-4 animate-in fade-in duration-150">
                  <p className="font-bold text-ink-900 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-primary-600" /> Chọn phương án thay thế gửi lại bệnh nhân
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {alternatives.map((slot) => (
                      <button
                        key={slot.slotId}
                        disabled={busyId === item.id}
                        onClick={() => handlePropose(item, slot)}
                        className="rounded-xl border border-line p-3 text-left text-body hover:border-primary-500 hover:bg-primary-50 transition-colors"
                      >
                        <strong className="text-primary-900 block">{slot.doctorName}</strong>
                        <span className="text-caption text-ink-600 block">{slot.specialtyName} · {slot.room}</span>
                        <span className="text-caption font-semibold text-ink-800">
                          {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(slot.slotStart))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      {/* CREATE MOCK APPROVAL REQUEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="text-h3 font-bold text-ink-900 flex items-center gap-2">
                <PlusCircle size={20} className="text-primary-700" /> Tạo yêu cầu chờ duyệt mới (UI Mock)
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1.5 text-ink-500 hover:bg-bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-body">
              <div>
                <label className="block text-caption font-semibold text-ink-700">Họ và tên bệnh nhân *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-body focus:border-primary-500 focus:outline-none"
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-caption font-semibold text-ink-700">Số điện thoại</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-body focus:border-primary-500 focus:outline-none"
                  placeholder="Ví dụ: 0987 654 321"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption font-semibold text-ink-700">Chuyên khoa</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-body focus:border-primary-500 focus:outline-none bg-surface"
                    value={newSpecialtyName}
                    onChange={(e) => setNewSpecialtyName(e.target.value)}
                  >
                    <option value="Khoa Nội tổng quát">Khoa Nội tổng quát</option>
                    <option value="Khoa Tim Mạch">Khoa Tim Mạch</option>
                    <option value="Khoa Tiêu Hóa">Khoa Tiêu Hóa</option>
                    <option value="Khoa Nhi">Khoa Nhi</option>
                    <option value="Khoa Thần Kinh">Khoa Thần Kinh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-caption font-semibold text-ink-700">Bác sĩ</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-body focus:border-primary-500 focus:outline-none"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-caption font-semibold text-ink-700">Lý do khám</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-body focus:border-primary-500 focus:outline-none"
                  placeholder="Nhập triệu chứng hoặc nhu cầu khám của bệnh nhân..."
                  value={newBookingReason}
                  onChange={(e) => setNewBookingReason(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Hủy
              </Button>
              <Button disabled={!newPatientName.trim()} onClick={handleCreateMockRequest}>
                Tạo yêu cầu ở giao diện
              </Button>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getLocalAppointments,
  startConsultation,
  completeConsultation,
  saveLocalAppointment,
} from "@/lib/api/appointments";
import type { DetailedAppointment, DetailedPatientSnapshot } from "@/lib/mockData";
import { MASTER_DOCTORS, MASTER_SPECIALTIES } from "@/lib/clinicalMasterCatalog";
import {
  Activity,
  BrainCircuit,
  FileText,
  Heart,
  Stethoscope,
  User,
  X,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  ShieldAlert,
  Clock,
  Plus,
  Trash2,
  Filter,
  Check,
  ChevronRight,
  Pill,
  ClipboardList,
} from "lucide-react";

function getSafePatientDetail(apt: DetailedAppointment | null | undefined): DetailedPatientSnapshot {
  if (!apt) {
    return {
      fullName: "Bệnh nhân",
      phoneNumber: "0912 345 678",
      dateOfBirth: "1980-01-01",
      age: 45,
      gender: "MALE",
      address: "Hà Nội, Việt Nam",
      patientSubject: "SELF",
      medicalCode: "BN-2026-8891",
      bloodType: "O+",
      allergies: [],
      medicalHistory: [],
      vitalSigns: { bloodPressure: "120/80", heartRate: 75, temperature: 36.6, spO2: 99, weight: 60 },
      clinicalNote: "",
      prescriptions: [],
      diagnosticOrders: [],
      aiAssessment: {
        preliminaryDiagnosis: "Khám chuyên khoa",
        urgencyLevel: "ROUTINE",
        confidenceScore: 90,
        reasoning: "Tư vấn triệu chứng lâm sàng qua MedAgent AI.",
      },
    };
  }

  const detail = apt.patientDetail;
  const snap = (apt.patientSnapshot || {}) as Record<string, unknown>;

  return {
    fullName: detail?.fullName || String(snap.fullName || snap.full_name || "Bệnh nhân"),
    phoneNumber: detail?.phoneNumber || String(snap.phoneNumber || snap.phone_number || "0912 345 678"),
    dateOfBirth: detail?.dateOfBirth || (snap.dateOfBirth as string) || "1980-01-01",
    age: detail?.age || Number(snap.age || 45),
    gender: detail?.gender || (snap.gender as "MALE" | "FEMALE") || "MALE",
    address: detail?.address || String(snap.address || "Hà Nội, Việt Nam"),
    patientSubject: detail?.patientSubject || "SELF",
    medicalCode: detail?.medicalCode || `BN-2026-${String(apt.id || "").slice(-4) || "8891"}`,
    bloodType: detail?.bloodType || "O+",
    allergies: detail?.allergies || [],
    medicalHistory: detail?.medicalHistory || [],
    vitalSigns: detail?.vitalSigns || { bloodPressure: "120/80", heartRate: 75, temperature: 36.6, spO2: 99, weight: 60 },
    clinicalNote: detail?.clinicalNote || "",
    receptionistNote: detail?.receptionistNote,
    prescriptions: detail?.prescriptions || [],
    diagnosticOrders: detail?.diagnosticOrders || [],
    aiAssessment: detail?.aiAssessment || {
      preliminaryDiagnosis: apt.specialtyName || "Khám chuyên khoa",
      urgencyLevel: "ROUTINE",
      confidenceScore: 90,
      reasoning: apt.bookingReason || "Tư vấn lâm sàng qua MedAgent AI.",
    },
  };
}

export default function DoctorDashboardPage() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"ALL" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [appointments, setAppointments] = useState<DetailedAppointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<DetailedAppointment | null>(null);

  // EMR Form State inside modal
  const [doctorNoteInput, setDoctorNoteInput] = useState<string>("");
  const [diagnosisInput, setDiagnosisInput] = useState<string>("");
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: "120/80",
    heartRate: 75,
    temperature: 36.6,
    spO2: 99,
    weight: 60,
  });
  const [prescriptions, setPrescriptions] = useState<Array<{ medicineName: string; dosage: string; usage: string; quantity: string }>>([]);
  const [diagnosticOrders, setDiagnosticOrders] = useState<Array<{ testName: string; department: string; status: "ORDERED" | "COMPLETED"; resultSummary?: string }>>([]);

  // New item inputs
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedUsage, setNewMedUsage] = useState("");
  const [newMedQty, setNewMedQty] = useState("");
  const [newTestName, setNewTestName] = useState("");
  const [newTestDept, setNewTestDept] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = () => {
    const list = getLocalAppointments();
    setAppointments(list);
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("focus", handleUpdate);
    window.addEventListener("p208:schedule-change", handleUpdate);
    window.addEventListener("vmec:appointments-change", handleUpdate);

    return () => {
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener("p208:schedule-change", handleUpdate);
      window.removeEventListener("vmec:appointments-change", handleUpdate);
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      // Filter by doctor / specialty
      if (selectedDoctorId !== "all") {
        const matchDoctor = item.doctorId === selectedDoctorId;
        const matchSpec = (item.specialtyId || "").toUpperCase() === selectedDoctorId.toUpperCase();
        if (!matchDoctor && !matchSpec) return false;
      }
      // Filter by tab
      if (activeTab === "ALL") return item.status !== "CANCELLED";
      if (activeTab === "CONFIRMED") return item.status === "CONFIRMED";
      if (activeTab === "IN_PROGRESS") return item.status === "CONFIRMED" && Boolean(item.confirmedAt);
      if (activeTab === "COMPLETED") return item.status === "COMPLETED";
      return true;
    });
  }, [appointments, selectedDoctorId, activeTab]);

  const openConsultationModal = (item: DetailedAppointment) => {
    const detail = getSafePatientDetail(item);
    setSelectedPatient(item);
    setDoctorNoteInput(detail.clinicalNote || "");
    setDiagnosisInput(detail.aiAssessment?.preliminaryDiagnosis || item.specialtyName || "");
    if (detail.vitalSigns) {
      setVitalSigns({ ...detail.vitalSigns });
    }
    setPrescriptions(detail.prescriptions ? [...detail.prescriptions] : []);
    setDiagnosticOrders(detail.diagnosticOrders ? [...detail.diagnosticOrders] : []);
  };

  const handleAddPrescription = () => {
    if (!newMedName.trim()) return;
    setPrescriptions([
      ...prescriptions,
      {
        medicineName: newMedName.trim(),
        dosage: newMedDosage.trim() || "1 viên/lần",
        usage: newMedUsage.trim() || "Uống sau ăn",
        quantity: newMedQty.trim() || "30 viên",
      },
    ]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedUsage("");
    setNewMedQty("");
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleAddDiagnosticOrder = () => {
    if (!newTestName.trim()) return;
    setDiagnosticOrders([
      ...diagnosticOrders,
      {
        testName: newTestName.trim(),
        department: newTestDept.trim() || "Khoa Cận lâm sàng & Thăm dò chức năng",
        status: "ORDERED",
      },
    ]);
    setNewTestName("");
    setNewTestDept("");
  };

  const handleSaveConsultation = async (status: "SAVE_DRAFT" | "COMPLETE") => {
    if (!selectedPatient) return;

    if (status === "COMPLETE") {
      await completeConsultation(
        selectedPatient.id,
        doctorNoteInput.trim() || "Khám và tư vấn lâm sàng hoàn tất.",
        prescriptions,
        diagnosticOrders
      );
      showToast("Đã hoàn tất phiên khám và xuất hồ sơ bệnh án thành công!");
    } else {
      const detail = getSafePatientDetail(selectedPatient);
      const updated: DetailedAppointment = {
        ...selectedPatient,
        patientDetail: {
          ...detail,
          clinicalNote: doctorNoteInput,
          vitalSigns,
          prescriptions,
          diagnosticOrders,
        },
      };
      saveLocalAppointment(updated);
      showToast("Đã lưu bản nháp hồ sơ bệnh án!");
    }

    refreshData();
    setSelectedPatient(null);
  };

  const currentDoctor = MASTER_DOCTORS.find((d) => d.id === selectedDoctorId);
  const selectedDetail = getSafePatientDetail(selectedPatient);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-teal-800 text-white px-5 py-3 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-teal-300" />
          <span className="text-body font-medium">{notification}</span>
        </div>
      )}

      {/* Header & Doctor Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-line shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
              <Stethoscope size={22} />
            </div>
            <div>
              <h1 className="text-h2 font-bold text-ink-900">Bàn Khám Bác Sĩ &amp; Hồ Sơ Bệnh Án Điện Tử</h1>
              <p className="text-caption text-ink-600">
                Tiếp nhận bệnh nhân từ AI Triage &amp; Lễ tân điều phối · 17 Chuyên khoa chuẩn VMEC
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-caption font-semibold text-ink-700 whitespace-nowrap flex items-center gap-1.5">
            <Filter size={15} /> Bác sĩ / Chuyên khoa:
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="rounded-xl border border-line bg-bg-soft px-3.5 py-2 text-body font-medium text-ink-900 focus:border-primary-500 focus:outline-none shadow-2xs"
          >
            <option value="all">🩺 Toàn bộ 17 Chuyên khoa (Tất cả bác sĩ)</option>
            {MASTER_DOCTORS.map((doc) => (
              <option key={doc.id} value={doc.id}>
                👨‍⚕️ {doc.fullName} ({doc.specialtyName} - {doc.room})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Summary Banner if specific doctor selected */}
      {currentDoctor && (
        <div className="flex items-center gap-4 bg-teal-50/70 border border-teal-200 p-4 rounded-2xl">
          <img
            src={currentDoctor.avatar}
            alt={currentDoctor.fullName}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-body-lg font-bold text-teal-950">{currentDoctor.fullName}</h3>
              <Badge tone="success">{currentDoctor.title}</Badge>
            </div>
            <p className="text-caption text-teal-800 mt-0.5">
              {currentDoctor.specialtyName} · {currentDoctor.room} ({currentDoctor.building}) · {currentDoctor.experienceYears} năm kinh nghiệm
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {currentDoctor.subspecialties.map((sub, i) => (
                <span key={i} className="text-caption bg-white/90 text-teal-900 border border-teal-200/80 px-2 py-0.5 rounded-md font-medium">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-body font-medium transition-all ${
              activeTab === "ALL"
                ? "bg-primary-900 text-white shadow-xs"
                : "text-ink-700 hover:bg-bg-muted"
            }`}
          >
            Tất cả ({appointments.filter((a) => a.status !== "CANCELLED").length})
          </button>
          <button
            onClick={() => setActiveTab("CONFIRMED")}
            className={`px-3.5 py-1.5 rounded-lg text-body font-medium transition-all ${
              activeTab === "CONFIRMED"
                ? "bg-primary-900 text-white shadow-xs"
                : "text-ink-700 hover:bg-bg-muted"
            }`}
          >
            Chờ khám &amp; Đã duyệt ({appointments.filter((a) => a.status === "CONFIRMED").length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3.5 py-1.5 rounded-lg text-body font-medium transition-all ${
              activeTab === "COMPLETED"
                ? "bg-primary-900 text-white shadow-xs"
                : "text-ink-700 hover:bg-bg-muted"
            }`}
          >
            Đã hoàn thành ({appointments.filter((a) => a.status === "COMPLETED").length})
          </button>
        </div>
        <span className="text-caption text-ink-500 font-medium">
          Hiển thị <strong>{filteredAppointments.length}</strong> ca khám
        </span>
      </div>

      {/* Appointment Queue Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-12 text-center">
          <Stethoscope size={36} className="mx-auto text-ink-300 mb-3" />
          <h3 className="text-body-lg font-bold text-ink-800">Không có ca khám nào trong hàng chờ</h3>
          <p className="text-caption text-ink-500 mt-1 max-w-md mx-auto">
            Khi bệnh nhân hoàn tất đặt khám từ AI Chat hoặc được Lễ tân phê duyệt, danh sách sẽ tự động xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAppointments.map((apt) => {
            const isCompleted = apt.status === "COMPLETED";
            const detail = getSafePatientDetail(apt);

            return (
              <div
                key={apt.id}
                className={`rounded-2xl border transition-all p-5 flex flex-col justify-between bg-surface shadow-xs hover:shadow-md ${
                  isCompleted ? "border-line bg-bg-soft/30 opacity-90" : "border-teal-200/80 hover:border-teal-400"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-body">
                        {detail.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-body-lg font-bold text-ink-900 leading-snug">{detail.fullName}</h4>
                        <p className="text-caption text-ink-500">
                          {detail.medicalCode} · {detail.age}t ({detail.gender === "MALE" ? "Nam" : "Nữ"})
                        </p>
                      </div>
                    </div>
                    <Badge tone={isCompleted ? "neutral" : "success"}>
                      {isCompleted ? "Đã khám" : "Chờ khám"}
                    </Badge>
                  </div>

                  {/* Time & Room */}
                  <div className="mt-3.5 flex items-center gap-2 text-caption bg-bg-soft px-3 py-1.5 rounded-lg text-ink-800">
                    <Calendar size={14} className="text-primary-700 shrink-0" />
                    <span className="font-semibold">{apt.specialtyName}</span> · <span>{apt.room}</span>
                  </div>

                  {/* Reason & AI Triage */}
                  <div className="mt-3 text-caption text-ink-800 bg-teal-50/40 p-2.5 rounded-lg border border-teal-100">
                    <strong className="text-teal-950 block mb-0.5">Lý do khám:</strong>
                    {apt.bookingReason}
                  </div>

                  {/* Vital Signs Mini Badges */}
                  {detail.vitalSigns && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-caption">
                      <span className="inline-flex items-center gap-1 bg-surface border border-line px-2 py-0.5 rounded text-ink-700">
                        <Heart size={12} className="text-red-500" /> HA: <strong>{detail.vitalSigns.bloodPressure}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-surface border border-line px-2 py-0.5 rounded text-ink-700">
                        <Activity size={12} className="text-teal-600" /> Tim: <strong>{detail.vitalSigns.heartRate} bpm</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-surface border border-line px-2 py-0.5 rounded text-ink-700">
                        SpO2: <strong>{detail.vitalSigns.spO2}%</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3.5 border-t border-line flex items-center justify-between">
                  <span className="text-caption text-ink-500 flex items-center gap-1">
                    <Phone size={12} /> {detail.phoneNumber}
                  </span>
                  <Button
                    size="sm"
                    variant={isCompleted ? "outline" : "primary"}
                    onClick={() => openConsultationModal(apt)}
                  >
                    <FileText size={14} className="mr-1.5" />
                    {isCompleted ? "Xem bệnh án" : "Khám & Kê đơn"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED EMR CONSULTATION MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-800 font-bold">
                  <Stethoscope size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-h2 font-bold text-ink-900">{selectedDetail.fullName}</h2>
                    <Badge tone={selectedPatient.status === "COMPLETED" ? "neutral" : "success"}>
                      {selectedPatient.status === "COMPLETED" ? "Đã hoàn thành" : "Đang khám"}
                    </Badge>
                  </div>
                  <p className="text-caption text-ink-500">
                    Mã BN: <strong>{selectedDetail.medicalCode}</strong> · Mã hẹn: {selectedPatient.appointmentCode} · {selectedPatient.specialtyName} ({selectedPatient.room})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-full p-2 text-ink-500 hover:bg-bg-muted hover:text-ink-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Row 1: Administrative Info & AI Triage Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Administrative Card */}
                <div className="rounded-xl border border-line bg-bg-soft/40 p-4 space-y-2.5">
                  <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                    <User size={16} className="text-primary-700" /> Thông tin bệnh nhân
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-body">
                    <div>
                      <span className="text-caption text-ink-500 block">Tuổi &amp; Giới tính</span>
                      <strong className="text-ink-900">{selectedDetail.age} tuổi ({selectedDetail.gender === "MALE" ? "Nam" : "Nữ"})</strong>
                    </div>
                    <div>
                      <span className="text-caption text-ink-500 block">Số điện thoại</span>
                      <strong className="text-ink-900">{selectedDetail.phoneNumber}</strong>
                    </div>
                    <div>
                      <span className="text-caption text-ink-500 block">Nhóm máu</span>
                      <strong className="text-ink-900">{selectedDetail.bloodType || "O+"}</strong>
                    </div>
                    <div>
                      <span className="text-caption text-ink-500 block">Tiền sử dị ứng</span>
                      <span className="text-caption font-semibold text-danger">
                        {selectedDetail.allergies?.length ? selectedDetail.allergies.join(", ") : "Không có ghi nhận"}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-line/60">
                    <span className="text-caption text-ink-500 block">Địa chỉ:</span>
                    <span className="text-caption text-ink-800">{selectedDetail.address || "Hà Nội"}</span>
                  </div>
                </div>

                {/* AI Triage & RAG Citations Card */}
                <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                  <h3 className="font-bold text-teal-950 flex items-center gap-2 text-body">
                    <BrainCircuit size={16} className="text-teal-700" /> Phân tích Lâm sàng AI (MedAgent Triage)
                  </h3>
                  <div className="text-body text-ink-800 space-y-1.5">
                    <p>
                      <strong>Chẩn đoán sơ bộ:</strong> {selectedDetail.aiAssessment?.preliminaryDiagnosis || selectedPatient.specialtyName}
                    </p>
                    <p className="text-caption text-ink-700">
                      <strong>Lý giải AI:</strong> {selectedDetail.aiAssessment?.reasoning}
                    </p>
                    {selectedDetail.receptionistNote && (
                      <p className="text-caption bg-white p-2 rounded border border-teal-200 text-teal-900">
                        <strong>Ghi chú Lễ tân:</strong> {selectedDetail.receptionistNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Editable Vital Signs */}
              <div className="rounded-xl border border-line bg-surface p-4">
                <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body mb-3">
                  <Activity size={16} className="text-danger" /> Dấu hiệu sinh tồn lâm sàng (Vital Signs)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="rounded-lg border border-line p-2.5 bg-bg-soft">
                    <label className="text-caption text-ink-500 block">Huyết áp (mmHg)</label>
                    <input
                      type="text"
                      value={vitalSigns.bloodPressure}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
                      className="w-full bg-white font-bold text-ink-900 px-2 py-1 rounded border border-line mt-1 text-body"
                    />
                  </div>
                  <div className="rounded-lg border border-line p-2.5 bg-bg-soft">
                    <label className="text-caption text-ink-500 block">Nhịp tim (bpm)</label>
                    <input
                      type="number"
                      value={vitalSigns.heartRate}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: Number(e.target.value) })}
                      className="w-full bg-white font-bold text-ink-900 px-2 py-1 rounded border border-line mt-1 text-body"
                    />
                  </div>
                  <div className="rounded-lg border border-line p-2.5 bg-bg-soft">
                    <label className="text-caption text-ink-500 block">Thân nhiệt (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalSigns.temperature}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: Number(e.target.value) })}
                      className="w-full bg-white font-bold text-ink-900 px-2 py-1 rounded border border-line mt-1 text-body"
                    />
                  </div>
                  <div className="rounded-lg border border-line p-2.5 bg-bg-soft">
                    <label className="text-caption text-ink-500 block">SpO2 (%)</label>
                    <input
                      type="number"
                      value={vitalSigns.spO2}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, spO2: Number(e.target.value) })}
                      className="w-full bg-white font-bold text-ink-900 px-2 py-1 rounded border border-line mt-1 text-body"
                    />
                  </div>
                  <div className="rounded-lg border border-line p-2.5 bg-bg-soft">
                    <label className="text-caption text-ink-500 block">Cân nặng (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={vitalSigns.weight}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, weight: Number(e.target.value) })}
                      className="w-full bg-white font-bold text-ink-900 px-2 py-1 rounded border border-line mt-1 text-body"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Diagnostic Test Orders (Chỉ định cận lâm sàng) */}
              <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                    <ClipboardList size={16} className="text-primary-700" /> Chỉ định Cận lâm sàng &amp; Chẩn đoán hình ảnh
                  </h3>
                </div>

                {/* Existing Diagnostic Orders */}
                {diagnosticOrders.length > 0 && (
                  <div className="space-y-2">
                    {diagnosticOrders.map((order, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-bg-soft p-2.5 rounded-lg border border-line text-body">
                        <div>
                          <strong className="text-ink-900 block">{order.testName}</strong>
                          <span className="text-caption text-ink-500">{order.department} · {order.resultSummary || "Đang chờ thực hiện"}</span>
                        </div>
                        <Badge tone={order.status === "COMPLETED" ? "success" : "warning"}>
                          {order.status === "COMPLETED" ? "Đã có kết quả" : "Đã chỉ định"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new diagnostic test order */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-line/60">
                  <input
                    type="text"
                    placeholder="Tên xét nghiệm (vd: Điện tâm đồ ECG 12 chuyển đạo, Siêu âm tim Doppler...)"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    className="sm:col-span-7 rounded-lg border border-line px-3 py-1.5 text-body"
                  />
                  <input
                    type="text"
                    placeholder="Khoa/Phòng thực hiện"
                    value={newTestDept}
                    onChange={(e) => setNewTestDept(e.target.value)}
                    className="sm:col-span-3 rounded-lg border border-line px-3 py-1.5 text-body"
                  />
                  <Button size="sm" variant="outline" onClick={handleAddDiagnosticOrder} className="sm:col-span-2">
                    <Plus size={14} className="mr-1" /> Thêm chỉ định
                  </Button>
                </div>
              </div>

              {/* Row 4: Prescription (Đơn thuốc) */}
              <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                  <Pill size={16} className="text-teal-700" /> Kê đơn thuốc điều trị
                </h3>

                {prescriptions.length > 0 && (
                  <div className="space-y-2">
                    {prescriptions.map((med, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-bg-soft p-2.5 rounded-lg border border-line text-body">
                        <div>
                          <strong className="text-ink-900">{med.medicineName}</strong>
                          <span className="text-caption text-ink-600 ml-2 font-medium">({med.quantity})</span>
                          <p className="text-caption text-ink-500">{med.dosage} · {med.usage}</p>
                        </div>
                        <button
                          onClick={() => handleRemovePrescription(idx)}
                          className="text-danger hover:bg-danger-soft p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new medication */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-line/60">
                  <input
                    type="text"
                    placeholder="Tên thuốc (vd: Amlodipine 5mg)"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="sm:col-span-4 rounded-lg border border-line px-3 py-1.5 text-body"
                  />
                  <input
                    type="text"
                    placeholder="Liều lượng (vd: 1 viên/ngày)"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="sm:col-span-3 rounded-lg border border-line px-3 py-1.5 text-body"
                  />
                  <input
                    type="text"
                    placeholder="Cách dùng (vd: Uống sáng sau ăn)"
                    value={newMedUsage}
                    onChange={(e) => setNewMedUsage(e.target.value)}
                    className="sm:col-span-3 rounded-lg border border-line px-3 py-1.5 text-body"
                  />
                  <Button size="sm" variant="outline" onClick={handleAddPrescription} className="sm:col-span-2">
                    <Plus size={14} className="mr-1" /> Thêm thuốc
                  </Button>
                </div>
              </div>

              {/* Row 5: Doctor's Clinical Findings & Conclusion */}
              <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
                <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                  <FileText size={16} className="text-primary-700" /> Kết luận Khám lâm sàng &amp; Lời dặn Bác sĩ
                </h3>
                <textarea
                  rows={4}
                  value={doctorNoteInput}
                  onChange={(e) => setDoctorNoteInput(e.target.value)}
                  placeholder="Nhập chẩn đoán xác định, tình trạng khám lâm sàng thực thể, kết quả cận lâm sàng và hướng dẫn tái khám..."
                  className="w-full rounded-xl border border-line p-3 text-body text-ink-900 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="sticky bottom-0 border-t border-line bg-bg-soft p-4 flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                Đóng
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => handleSaveConsultation("SAVE_DRAFT")}>
                  Lưu bản nháp
                </Button>
                <Button variant="primary" onClick={() => handleSaveConsultation("COMPLETE")}>
                  <CheckCircle2 size={16} className="mr-1.5" /> Hoàn thành khám &amp; Lưu hồ sơ bệnh án
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

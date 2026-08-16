import type { Appointment } from "@/lib/api/contracts";
import { MASTER_DOCTORS, getDoctorById } from "./clinicalMasterCatalog";

export interface DetailedPatientSnapshot {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  address: string | null;
  patientSubject: "SELF" | "RELATIVE";
  relationship?: string | null;
  age?: number | string;
  medicalCode: string;
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string[];
  vitalSigns?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    spO2: number;
    weight: number;
  };
  aiAssessment?: {
    preliminaryDiagnosis: string;
    urgencyLevel: "ROUTINE" | "URGENT" | "EMERGENCY";
    confidenceScore: number;
    reasoning: string;
    citations?: string[];
  };
  receptionistNote?: string;
  clinicalNote?: string;
  prescriptions?: Array<{
    medicineName: string;
    dosage: string;
    usage: string;
    quantity: string;
  }>;
  diagnosticOrders?: Array<{
    testName: string;
    department: string;
    status: "ORDERED" | "COMPLETED";
    resultSummary?: string;
  }>;
}

export interface DetailedAppointment extends Appointment {
  patientDetail: DetailedPatientSnapshot;
}

export const MOCK_DOCTOR_APPOINTMENTS: DetailedAppointment[] = [
  {
    id: "app-tim-001",
    appointmentCode: "APT-2026-0901",
    patientId: "pat-101",
    doctorId: "doc_tim_mach_01",
    doctorName: "BS.CKII Trần Minh Đức",
    facilityId: "fac_vmec_01",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    specialtyId: "TIM_MACH",
    specialtyName: "Khoa Tim Mạch",
    room: "Phòng 302 - Tòa nhà A",
    scheduleId: "sch-tim-01",
    status: "CONFIRMED",
    bookingReason: "Tức ngực trái nhẹ khi leo cầu thang, kèm hồi hộp đánh trống ngực 3 ngày nay.",
    patientNotes: "Có tiền sử tăng huyết áp 3 năm, đang dùng thuốc Amlodipine 5mg.",
    receptionistNotes: "Đã duyệt và dặn bệnh nhân nhịn ăn sáng để làm xét nghiệm mỡ máu.",
    cancellationReason: null,
    expiresAt: null,
    confirmedAt: new Date(Date.now() - 3600000).toISOString(),
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
    slotStart: new Date(Date.now() + 1800000).toISOString(),
    slotEnd: new Date(Date.now() + 3600000).toISOString(),
    qrAvailable: true,
    patientSnapshot: {
      full_name: "Nguyễn Văn An",
      phone_number: "0912 345 678",
      gender: "MALE",
      age: 48,
    },
    patientDetail: {
      fullName: "Nguyễn Văn An",
      phoneNumber: "0912 345 678",
      dateOfBirth: "1978-05-14",
      gender: "MALE",
      address: "Số 45 Ngõ 102 Khuất Duy Tiến, Thanh Xuân, Hà Nội",
      patientSubject: "SELF",
      age: 48,
      medicalCode: "BN-2026-8891",
      bloodType: "O+",
      allergies: ["Penicillin"],
      medicalHistory: ["Tăng huyết áp nguyên phát (3 năm)", "Rối loạn lipid máu"],
      vitalSigns: {
        bloodPressure: "135/85",
        heartRate: 78,
        temperature: 36.8,
        spO2: 98,
        weight: 68.5,
      },
      aiAssessment: {
        preliminaryDiagnosis: "Theo dõi Cơn đau thắt ngực ổn định / Tăng huyết áp độ 1",
        urgencyLevel: "URGENT",
        confidenceScore: 92,
        reasoning: "Triệu chứng đau tức ngực trái xuất hiện khi gắng sức (leo cầu thang) ở nam giới 48 tuổi có tiền sử tăng huyết áp.",
        citations: ["Hướng dẫn chẩn đoán Hội chứng mạch vành cấp - Bộ Y Tế"],
      },
      receptionistNote: "Bệnh nhân đã có mặt tại sảnh chờ tầng 3, chỉ số sinh tồn ổn định.",
      clinicalNote: "Đã nghe tim phổi. Nhịp tim đều T1 T2 rõ. Chỉ định đo ECG 12 chuyển đạo và siêu âm tim Doppler màu.",
      prescriptions: [
        { medicineName: "Amlodipine 5mg", dosage: "1 viên/ngày", usage: "Uống sáng sau ăn", quantity: "30 viên" },
        { medicineName: "Atorvastatin 20mg", dosage: "1 viên/ngày", usage: "Uống tối trước khi ngủ", quantity: "30 viên" },
      ],
      diagnosticOrders: [
        { testName: "Điện tâm đồ (ECG 12 chuyển đạo)", department: "Phòng Thăm dò chức năng", status: "COMPLETED", resultSummary: "Nhịp xoang 78ck/p, không thấy sóng ST chênh" },
        { testName: "Siêu âm tim Doppler", department: "Phòng Siêu âm tim", status: "ORDERED" },
      ],
    },
  },
  {
    id: "app-tieuhoa-001",
    appointmentCode: "APT-2026-0902",
    patientId: "pat-102",
    doctorId: "doc_tieu_hoa_01",
    doctorName: "TS.BS Nguyễn Thị Mai Lan",
    facilityId: "fac_vmec_01",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    specialtyId: "TIEU_HOA",
    specialtyName: "Khoa Tiêu Hóa - Gan Mật",
    room: "Phòng 205 - Tòa nhà B",
    scheduleId: "sch-tieuhoa-01",
    status: "CONFIRMED",
    bookingReason: "Đau rát thượng vị (trên rốn), ợ chua nhiều và cảm giác nóng sau xương ức.",
    patientNotes: "Đau tăng khi đói hoặc sau khi ăn đồ chua cay.",
    receptionistNotes: "Đã duyệt và hướng dẫn nhịn ăn 6 tiếng nếu cần nội soi dạ dày.",
    cancellationReason: null,
    expiresAt: null,
    confirmedAt: new Date(Date.now() - 5400000).toISOString(),
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date().toISOString(),
    slotStart: new Date(Date.now() + 5400000).toISOString(),
    slotEnd: new Date(Date.now() + 7200000).toISOString(),
    qrAvailable: true,
    patientSnapshot: {
      full_name: "Lê Thị Ngọc Thảo",
      phone_number: "0988 765 432",
      gender: "FEMALE",
      age: 34,
    },
    patientDetail: {
      fullName: "Lê Thị Ngọc Thảo",
      phoneNumber: "0988 765 432",
      dateOfBirth: "1992-08-20",
      gender: "FEMALE",
      address: "Số 12 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
      patientSubject: "SELF",
      age: 34,
      medicalCode: "BN-2026-4102",
      bloodType: "A+",
      allergies: ["Không có ghi nhận"],
      medicalHistory: ["Viêm loét dạ dày HP(+) cách đây 2 năm đã điều trị"],
      vitalSigns: {
        bloodPressure: "115/75",
        heartRate: 72,
        temperature: 36.6,
        spO2: 99,
        weight: 54.0,
      },
      aiAssessment: {
        preliminaryDiagnosis: "Trào ngược dạ dày thực quản (GERD) / Viêm dạ dày tái phát",
        urgencyLevel: "ROUTINE",
        confidenceScore: 94,
        reasoning: "Triệu chứng nóng rát thượng vị kèm ợ chua điển hình của hội chứng trào ngược acid dạ dày.",
        citations: ["Hướng dẫn chẩn đoán và điều trị GERD - Hội Tiêu Hóa Việt Nam"],
      },
      receptionistNote: "Bệnh nhân đã nhịn ăn sáng từ 6h.",
      clinicalNote: "Ấn thượng vị tức nhẹ, không có phản ứng thành bụng. Chỉ định nội soi dạ dày tá tràng không đau tìm vi khuẩn HP.",
      prescriptions: [
        { medicineName: "Esomeprazole 40mg", dosage: "1 viên/ngày", usage: "Uống trước ăn sáng 30 phút", quantity: "28 viên" },
        { medicineName: "Gaviscon Dual Action", dosage: "1 gói x 3 lần/ngày", usage: "Uống sau ăn 1 giờ và trước ngủ", quantity: "30 gói" },
      ],
      diagnosticOrders: [
        { testName: "Nội soi thực quản - dạ dày - tá tràng gây mê (kèm Clo-test)", department: "Trung tâm Nội soi Tiêu hóa", status: "ORDERED" },
      ],
    },
  },
  {
    id: "app-thankinh-001",
    appointmentCode: "APT-2026-0903",
    patientId: "pat-103",
    doctorId: "doc_than_kinh_01",
    doctorName: "PGS.TS Hoàng Văn Bách",
    facilityId: "fac_vmec_01",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    specialtyId: "THAN_KINH",
    specialtyName: "Khoa Thần Kinh & Đột Quỵ",
    room: "Phòng 401 - Tòa nhà A",
    scheduleId: "sch-thankinh-01",
    status: "CONFIRMED",
    bookingReason: "Chóng mặt, quay cuồng khi thay đổi tư thế kèm đau đầu âm ỉ vùng chẩm.",
    patientNotes: "Mất ngủ nhiều đêm do lo lắng, đo huyết áp tại nhà 130/80.",
    receptionistNotes: "Đã duyệt và ưu tiên phòng khám chuyên gia.",
    cancellationReason: null,
    expiresAt: null,
    confirmedAt: new Date(Date.now() - 7200000).toISOString(),
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date().toISOString(),
    slotStart: new Date(Date.now() + 9000000).toISOString(),
    slotEnd: new Date(Date.now() + 10800000).toISOString(),
    qrAvailable: true,
    patientSnapshot: {
      full_name: "Hoàng Minh Tuấn",
      phone_number: "0904 112 233",
      gender: "MALE",
      age: 56,
    },
    patientDetail: {
      fullName: "Hoàng Minh Tuấn",
      phoneNumber: "0904 112 233",
      dateOfBirth: "1970-03-10",
      gender: "MALE",
      address: "Số 88 Trần Duy Hưng, Cầu Giấy, Hà Nội",
      patientSubject: "SELF",
      age: 56,
      medicalCode: "BN-2026-9041",
      bloodType: "B+",
      allergies: ["Không"],
      medicalHistory: ["Rối loạn tiền đình 1 năm trước", "Mất ngủ mạn tính"],
      vitalSigns: {
        bloodPressure: "130/80",
        heartRate: 74,
        temperature: 36.7,
        spO2: 98,
        weight: 72.0,
      },
      aiAssessment: {
        preliminaryDiagnosis: "Hội chứng tiền đình ngoại biên (BPPV) / Thiểu năng tuần hoàn não",
        urgencyLevel: "ROUTINE",
        confidenceScore: 91,
        reasoning: "Chóng mặt tăng rõ khi thay đổi tư thế đầu, không có dấu hiệu liệt thần kinh khu trú (FAST âm tính).",
        citations: ["Khuyến cáo chẩn đoán Hội chứng Tiền đình - Hội Thần Kinh VN"],
      },
      receptionistNote: "Bệnh nhân có người nhà đi cùng hỗ trợ.",
      clinicalNote: "Thực hiện nghiệm pháp Dix-Hallpike dương tính tai phải. Nghiệm pháp tái định vị sỏi tai Epley thành công.",
      prescriptions: [
        { medicineName: "Betahistine dihydrochloride 24mg", dosage: "1 viên x 2 lần/ngày", usage: "Uống sau ăn sáng - tối", quantity: "30 viên" },
        { medicineName: "Ginkgo Biloba 120mg", dosage: "1 viên/ngày", usage: "Uống sáng sau ăn", quantity: "30 viên" },
      ],
      diagnosticOrders: [
        { testName: "Siêu âm Doppler động mạch cảnh - đốt sống", department: "Phòng Thăm dò Thần kinh", status: "COMPLETED", resultSummary: "Xơ vữa nhẹ thành mạch, không hẹp có ý nghĩa huyết động" },
      ],
    },
  },
  {
    id: "app-nhikhoa-001",
    appointmentCode: "APT-2026-0904",
    patientId: "pat-104",
    doctorId: "doc_nhi_khoa_01",
    doctorName: "ThS.BS Lê Thu Trang",
    facilityId: "fac_vmec_01",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    specialtyId: "NHI_KHOA",
    specialtyName: "Khoa Nhi & Sơ Sinh",
    room: "Phòng 108 - Tòa Nhi đồng",
    scheduleId: "sch-nhi-01",
    status: "CONFIRMED",
    bookingReason: "Bé sốt 38.5 độ C 2 ngày nay, kèm ho khan và chảy nước mũi trong.",
    patientNotes: "Bé vẫn ăn bú được nhưng quấy khóc khi ngủ đêm.",
    receptionistNotes: "Đã duyệt và ưu tiên phòng khám Nhi.",
    cancellationReason: null,
    expiresAt: null,
    confirmedAt: new Date().toISOString(),
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slotStart: new Date(Date.now() + 12600000).toISOString(),
    slotEnd: new Date(Date.now() + 14400000).toISOString(),
    qrAvailable: true,
    patientSnapshot: {
      full_name: "Bé Nguyễn Bảo Nam",
      phone_number: "0977 889 900",
      gender: "MALE",
      age: 3,
    },
    patientDetail: {
      fullName: "Bé Nguyễn Bảo Nam",
      phoneNumber: "0977 889 900",
      dateOfBirth: "2023-04-12",
      gender: "MALE",
      address: "Chung cư Royal City, Thanh Xuân, Hà Nội",
      patientSubject: "RELATIVE",
      relationship: "Mẹ (Nguyễn Minh Anh)",
      age: 3,
      medicalCode: "BN-2026-3392",
      bloodType: "O+",
      allergies: ["Không ghi nhận"],
      medicalHistory: ["Tiêm chủng đầy đủ theo lịch"],
      vitalSigns: {
        bloodPressure: "95/60",
        heartRate: 110,
        temperature: 38.2,
        spO2: 99,
        weight: 14.5,
      },
      aiAssessment: {
        preliminaryDiagnosis: "Viêm đường hô hấp trên cấp do virus / Theo dõi viêm phế quản",
        urgencyLevel: "ROUTINE",
        confidenceScore: 95,
        reasoning: "Trẻ sốt kèm ho sổ mũi, không có co rút lồng ngực, bú tốt, tỉnh táo.",
        citations: ["Hướng dẫn chẩn đoán và điều trị bệnh ở trẻ em - Bộ Y Tế"],
      },
      receptionistNote: "Bé được mẹ bế, đã hạ sốt nhẹ bằng Paracetamol.",
      clinicalNote: "Họng đỏ nhẹ, hai amidan không mủ. Phổi thông khí tốt, không rale. Hướng dẫn theo dõi dấu hiệu nguy hiểm.",
      prescriptions: [
        { medicineName: "Paracetamol gói 150mg", dosage: "1 gói/lần khi sốt >= 38.5 độ", usage: "Cách nhau tối thiểu 4-6 giờ", quantity: "10 gói" },
        { medicineName: "Siro ho thảo dược Prospan", dosage: "2.5ml x 3 lần/ngày", usage: "Uống sau ăn", quantity: "1 chai 100ml" },
        { medicineName: "Nước muối sinh lý xịt mũi 0.9%", dosage: "Xịt 3-4 lần/ngày", usage: "Vệ sinh mũi trước khi ngủ", quantity: "1 lọ" },
      ],
      diagnosticOrders: [
        { testName: "Test nhanh Virus Cúm A/B và RSV", department: "Khoa Xét nghiệm Vi sinh", status: "COMPLETED", resultSummary: "Âm tính Cúm A, Âm tính Cúm B" },
      ],
    },
  },
  {
    id: "app-pending-001",
    appointmentCode: "APT-2026-0905",
    patientId: "pat-105",
    doctorId: "doc_co_xuong_khop_01",
    doctorName: "BS.CKII Phạm Hoàng Quân",
    facilityId: "fac_vmec_01",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    specialtyId: "CO_XUONG_KHOP",
    specialtyName: "Khoa Cơ Xương Khớp & Cột Sống",
    room: "Phòng 212 - Tòa nhà A",
    scheduleId: "sch-coxuongkhop-01",
    status: "PENDING_RECEPTIONIST_APPROVAL",
    bookingReason: "Đau nhức hai khớp gối khi leo cầu thang, buổi sáng có cảm giác cứng khớp 15 phút.",
    patientNotes: "Đã tự mua thuốc giảm đau uống nhưng không đỡ nhiều.",
    receptionistNotes: null,
    cancellationReason: null,
    expiresAt: null,
    confirmedAt: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    updatedAt: new Date().toISOString(),
    slotStart: new Date(Date.now() + 86400000).toISOString(),
    slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
    qrAvailable: false,
    patientSnapshot: {
      full_name: "Phạm Văn Hùng",
      phone_number: "0913 556 778",
      gender: "MALE",
      age: 60,
    },
    patientDetail: {
      fullName: "Phạm Văn Hùng",
      phoneNumber: "0913 556 778",
      dateOfBirth: "1966-10-05",
      gender: "MALE",
      address: "Số 26 Đội Cấn, Ba Đình, Hà Nội",
      patientSubject: "SELF",
      age: 60,
      medicalCode: "BN-2026-6019",
      bloodType: "O+",
      allergies: ["Không ghi nhận"],
      medicalHistory: ["Thoái hóa cột sống thắt lưng 4 năm"],
      vitalSigns: {
        bloodPressure: "125/80",
        heartRate: 75,
        temperature: 36.5,
        spO2: 99,
        weight: 70.0,
      },
      aiAssessment: {
        preliminaryDiagnosis: "Thoái hóa khớp gối nguyên phát độ 2 / Cột sống thắt lưng",
        urgencyLevel: "ROUTINE",
        confidenceScore: 93,
        reasoning: "Đau khớp gối liên quan vận động chịu lực và cứng khớp buổi sáng dưới 30 phút ở người 60 tuổi.",
        citations: ["Hướng dẫn chẩn đoán và điều trị bệnh Cơ Xương Khớp - Bộ Y Tế"],
      },
    },
  },
];

/**
 * Get appointment by ID with full details
 */
export function getDetailedAppointment(id: string): DetailedAppointment | undefined {
  return MOCK_DOCTOR_APPOINTMENTS.find((a) => a.id === id || a.appointmentCode === id);
}

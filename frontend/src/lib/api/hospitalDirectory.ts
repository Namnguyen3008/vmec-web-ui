/**
 * VMEC Hospital Staff & Department Directory (Lightweight UI Data)
 * Note: Master Clinical Catalog has been completely removed.
 * Clinical Triage and RAG Guidelines are exclusively retrieved from Supabase pgvector (2,670 vectors).
 */

export interface HospitalDoctor {
  id: string;
  fullName: string;
  title: string;
  avatar: string;
  specialtyCode: string;
  specialtyName: string;
  subspecialties: string[];
  room: string;
  building: string;
  facilityName: string;
  facilityAddress: string;
  experienceYears: number;
  bio: string;
  consultationFee: number;
  availableDays: string[];
}

export interface HospitalSpecialty {
  code: string;
  name: string;
  vietnameseName: string;
  englishName: string;
  description: string;
  subspecialties: string[];
  primaryDoctorId: string;
  doctors: HospitalDoctor[];
  room: string;
  building: string;
  facilityName: string;
  facilityAddress: string;
}

export const HOSPITAL_DOCTORS: HospitalDoctor[] = [
  {
    id: "doc_tim_mach_01",
    fullName: "BS.CKII Trần Minh Đức",
    title: "Bác sĩ Chuyên khoa II - Trưởng khoa",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=160&auto=format&fit=crop&q=80",
    specialtyCode: "TIM_MACH",
    specialtyName: "Khoa Tim Mạch",
    subspecialties: ["Tim mạch can thiệp", "Rối loạn nhịp tim", "Bệnh mạch vành"],
    room: "Phòng 302",
    building: "Tòa nhà A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    experienceYears: 22,
    bio: "Hơn 22 năm kinh nghiệm trong lĩnh vực tim mạch can thiệp và chẩn đoán bệnh lý mạch vành.",
    consultationFee: 500000,
    availableDays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  },
  {
    id: "doc_tieu_hoa_01",
    fullName: "BS.CKII Phạm Hoàng Long",
    title: "Bác sĩ Chuyên khoa II - Phó Trưởng khoa",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=160&auto=format&fit=crop&q=80",
    specialtyCode: "TIEU_HOA",
    specialtyName: "Khoa Tiêu Hóa - Gan Mật",
    subspecialties: ["Nội soi tiêu hóa", "Dạ dày - tá tràng", "Gan mật tụy"],
    room: "Phòng 205",
    building: "Tòa nhà B",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    experienceYears: 18,
    bio: "Chuyên gia đầu ngành về nội soi tiêu hóa không đau và điều trị viêm loét dạ dày.",
    consultationFee: 450000,
    availableDays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"],
  },
  {
    id: "doc_than_kinh_01",
    fullName: "TS.BS Vũ Thành Trung",
    title: "Tiến sĩ, Bác sĩ - Trưởng khoa",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=160&auto=format&fit=crop&q=80",
    specialtyCode: "THAN_KINH",
    specialtyName: "Khoa Thần Kinh & Đột Quỵ",
    subspecialties: ["Đột quỵ & Mạch máu não", "Đau nửa đầu Migraine", "Thần kinh ngoại biên"],
    room: "Phòng 401",
    building: "Tòa nhà A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    experienceYears: 20,
    bio: "Chuyên gia hàng đầu về chẩn đoán đột quỵ sớm, điều trị đau đầu mạn tính và động kinh.",
    consultationFee: 500000,
    availableDays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"],
  },
  {
    id: "doc_ho_hap_01",
    fullName: "BS.CKII Lê Thị Mai Hương",
    title: "Bác sĩ Chuyên khoa II",
    avatar: "https://images.unsplash.com/photo-1594824813590-b89694291880?w=160&auto=format&fit=crop&q=80",
    specialtyCode: "HO_HAP",
    specialtyName: "Khoa Hô Hấp - Phổi",
    subspecialties: ["Hen phế quản & COPD", "Viêm phổi & Dị ứng hô hấp"],
    room: "Phòng 201",
    building: "Tòa nhà A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    experienceYears: 16,
    bio: "Chuyên sâu về thăm dò chức năng hô hấp và điều trị các bệnh phổi tắc nghẽn mạn tính.",
    consultationFee: 400000,
    availableDays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  },
  {
    id: "doc_co_xuong_khop_01",
    fullName: "BS.CKII Hoàng Tuấn Anh",
    title: "Bác sĩ Chuyên khoa II - Trưởng khoa",
    avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=160&auto=format&fit=crop&q=80",
    specialtyCode: "CO_XUONG_KHOP",
    specialtyName: "Khoa Cơ Xương Khớp & Cột Sống",
    subspecialties: ["Thoái hóa khớp", "Thoát vị đĩa đệm", "Viêm khớp dạng thấp"],
    room: "Phòng 305",
    building: "Tòa nhà B",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    experienceYears: 19,
    bio: "Chuyên gia can thiệp giảm đau cột sống, tiêm khớp dưới hướng dẫn siêu âm.",
    consultationFee: 450000,
    availableDays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"],
  },
  {
    id: "doc_da_lieu_01",
    fullName: "ThS.BS Nguyễn Thu Trang",
    title: "Thạc sĩ, Bác sĩ",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=160&auto=format&fit=crop&q=80",
    specialtyCode: "DA_LIEU",
    specialtyName: "Khoa Da Liễu & Thẩm Mỹ Da",
    subspecialties: ["Dị ứng & Viêm da cơ địa", "Mụn trứng cá & Thẩm mỹ laser"],
    room: "Phòng 108",
    building: "Tòa nhà C",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    experienceYears: 12,
    bio: "Chuyên khoa Da liễu, ứng dụng các công nghệ hiện đại trong điều trị bệnh lý da liễu.",
    consultationFee: 350000,
    availableDays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  },
  {
    id: "doc_nhi_01",
    fullName: "PGS.TS.BS Đặng Thúy Hà",
    title: "Phó Giáo sư, Tiến sĩ - Trưởng khoa Nhi",
    avatar: "https://images.unsplash.com/photo-1594824813590-b89694291880?w=160&auto=format&fit=crop&q=80",
    specialtyCode: "NHI_KHOA",
    specialtyName: "Khoa Nhi & Sơ Sinh",
    subspecialties: ["Nhi tổng quát", "Hô hấp & Tiêu hóa nhi", "Tư vấn dinh dưỡng"],
    room: "Phòng 102",
    building: "Tòa nhà B",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    experienceYears: 25,
    bio: "Chuyên gia hàng đầu trong khám, chẩn đoán và điều trị bệnh lý sơ sinh và trẻ nhỏ.",
    consultationFee: 500000,
    availableDays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"],
  },
  {
    id: "doc_noi_tong_quat_01",
    fullName: "BS.CKI Đỗ Quang Huy",
    title: "Bác sĩ Chuyên khoa I",
    avatar: "https://images.unsplash.com/photo-1550831107-1553da8c8464?w=160&auto=format&fit=crop&q=80",
    specialtyCode: "KHAM_TONG_QUAT",
    specialtyName: "Khoa Nội Tổng Quát & Tầm Soát",
    subspecialties: ["Khám sức khỏe định kỳ", "Tầm soát bệnh lý sớm"],
    room: "Phòng 101",
    building: "Tòa nhà A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    experienceYears: 15,
    bio: "Khám bệnh nội khoa tổng hợp, sàng lọc nguy cơ và tư vấn chăm sóc sức khỏe.",
    consultationFee: 300000,
    availableDays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  },
];

export const HOSPITAL_SPECIALTIES: HospitalSpecialty[] = [
  {
    code: "TIM_MACH",
    name: "Khoa Tim Mạch",
    vietnameseName: "Khoa Tim Mạch",
    englishName: "Cardiology & Vascular Center",
    description: "Khám, chẩn đoán và điều trị bệnh lý tim mạch, huyết áp, rối loạn nhịp và mạch vành.",
    subspecialties: ["Tim mạch can thiệp", "Rối loạn nhịp tim", "Bệnh mạch vành"],
    primaryDoctorId: "doc_tim_mach_01",
    doctors: [HOSPITAL_DOCTORS[0]],
    room: "Phòng 302",
    building: "Tòa nhà A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    code: "TIEU_HOA",
    name: "Khoa Tiêu Hóa - Gan Mật",
    vietnameseName: "Khoa Tiêu Hóa - Gan Mật",
    englishName: "Gastroenterology & Hepatology",
    description: "Chẩn đoán và điều trị bệnh lý đường tiêu hóa, dạ dày, đại tràng và gan mật.",
    subspecialties: ["Nội soi tiêu hóa", "Dạ dày - tá tràng", "Gan mật tụy"],
    primaryDoctorId: "doc_tieu_hoa_01",
    doctors: [HOSPITAL_DOCTORS[1]],
    room: "Phòng 205",
    building: "Tòa nhà B",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    code: "THAN_KINH",
    name: "Khoa Thần Kinh & Đột Quỵ",
    vietnameseName: "Khoa Thần Kinh & Đột Quỵ",
    englishName: "Neurology & Stroke Center",
    description: "Khám và điều trị các bệnh lý thần kinh, đau đầu, đột quỵ não và rối loạn tiền đình.",
    subspecialties: ["Đột quỵ & Mạch máu não", "Đau nửa đầu Migraine"],
    primaryDoctorId: "doc_than_kinh_01",
    doctors: [HOSPITAL_DOCTORS[2]],
    room: "Phòng 401",
    building: "Tòa nhà A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    code: "HO_HAP",
    name: "Khoa Hô Hấp - Phổi",
    vietnameseName: "Khoa Hô Hấp - Phổi",
    englishName: "Pulmonology & Respiratory Medicine",
    description: "Chuyên sâu khám và điều trị hen phế quản, viêm phổi, COPD và bệnh đường hô hấp.",
    subspecialties: ["Hen phế quản & COPD", "Viêm phổi"],
    primaryDoctorId: "doc_ho_hap_01",
    doctors: [HOSPITAL_DOCTORS[3]],
    room: "Phòng 201",
    building: "Tòa nhà A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    code: "CO_XUONG_KHOP",
    name: "Khoa Cơ Xương Khớp & Cột Sống",
    vietnameseName: "Khoa Cơ Xương Khớp & Cột Sống",
    englishName: "Orthopedics & Rheumatology",
    description: "Khám và điều trị các bệnh lý thoái hóa khớp, cột sống, viêm khớp và loãng xương.",
    subspecialties: ["Thoái hóa khớp", "Thoát vị đĩa đệm"],
    primaryDoctorId: "doc_co_xuong_khop_01",
    doctors: [HOSPITAL_DOCTORS[4]],
    room: "Phòng 305",
    building: "Tòa nhà B",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    code: "DA_LIEU",
    name: "Khoa Da Liễu & Thẩm Mỹ Da",
    vietnameseName: "Khoa Da Liễu & Thẩm Mỹ Da",
    englishName: "Dermatology Center",
    description: "Khám và điều trị các bệnh lý da liễu, dị ứng, viêm da cơ địa và thẩm mỹ da liễu.",
    subspecialties: ["Dị ứng & Viêm da", "Mụn trứng cá"],
    primaryDoctorId: "doc_da_lieu_01",
    doctors: [HOSPITAL_DOCTORS[5]],
    room: "Phòng 108",
    building: "Tòa nhà C",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    code: "NHI_KHOA",
    name: "Khoa Nhi & Sơ Sinh",
    vietnameseName: "Khoa Nhi & Sơ Sinh",
    englishName: "Pediatrics & Neonatology",
    description: "Khám và điều trị các bệnh lý sơ sinh, hô hấp, tiêu hóa và dinh dưỡng cho trẻ nhỏ.",
    subspecialties: ["Nhi tổng quát", "Hô hấp & Tiêu hóa nhi"],
    primaryDoctorId: "doc_nhi_01",
    doctors: [HOSPITAL_DOCTORS[6]],
    room: "Phòng 102",
    building: "Tòa nhà B",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    code: "KHAM_TONG_QUAT",
    name: "Khoa Nội Tổng Quát & Tầm Soát",
    vietnameseName: "Khoa Nội Tổng Quát & Tầm Soát",
    englishName: "General Internal Medicine",
    description: "Khám sức khỏe tổng quát, tầm soát bệnh lý và chăm sóc y tế toàn diện.",
    subspecialties: ["Khám sức khỏe định kỳ", "Tầm soát bệnh lý"],
    primaryDoctorId: "doc_noi_tong_quat_01",
    doctors: [HOSPITAL_DOCTORS[7]],
    room: "Phòng 101",
    building: "Tòa nhà A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
];

export function getHospitalSpecialtyByCode(code: string): HospitalSpecialty | undefined {
  return HOSPITAL_SPECIALTIES.find((s) => s.code.toUpperCase() === code.toUpperCase());
}

export function getHospitalDoctorById(id: string): HospitalDoctor | undefined {
  return HOSPITAL_DOCTORS.find((d) => d.id === id);
}

export function getHospitalDoctorsBySpecialty(code: string): HospitalDoctor[] {
  return HOSPITAL_DOCTORS.filter((d) => d.specialtyCode.toUpperCase() === code.toUpperCase());
}

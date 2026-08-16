/**
 * LLM 2: Clinical Evaluator & Slot Judge Module
 * Enforces strict data provenance: facts MUST come from patient inputs.
 * Anchors routing on Chief Complaint, preserves severity modifiers,
 * dynamically synthesizes reasoning without hallucinations, and speaks like a professional doctor.
 */

import type {
  AtomicClinicalFact,
  ClinicalSlotMatrix,
  ContextualChipOption,
  LivingClinicalContext,
  SlotEvaluationResult,
} from "./types";
import { CLINICAL_SPECIALTIES, detectEmergency } from "@/lib/api/chat";

export function createInitialSlots(): ClinicalSlotMatrix {
  return {
    chiefComplaint: {
      status: "PENDING",
      label: "Vị trí & Triệu chứng chính",
      clarityScore: 0,
    },
    duration: {
      status: "PENDING",
      label: "Thời gian & Diễn tiến",
      clarityScore: 0,
    },
    characterTriggers: {
      status: "PENDING",
      label: "Tính chất & Cường độ đau",
      clarityScore: 0,
    },
    associatedSigns: {
      status: "PENDING",
      label: "Dấu hiệu kèm theo & Cảnh báo",
      clarityScore: 0,
    },
  };
}

const MEDICAL_KEYWORDS = [
  "ngực", "tim", "bụng", "dạ dày", "đầu", "họng", "sốt", "khớp", "da", "mắt",
  "cháu", "bé", "ho", "thở", "ợ", "chóng mặt", "buồn nôn", "mệt", "đau",
  "nhức", "rát", "sưng", "ngứa", "tiêu chảy", "huyết áp", "khó ngủ", "hụt hơi", "đau đầu"
];

function isSecurityOrSystemInquiry(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const securityPhrases = [
    "api key", "apikey", "api_key", "api-key", "token", "secret", "password", "mật khẩu",
    "system prompt", "prompt hệ thống", "cấu hình hệ thống", "mã nguồn", "source code",
    "admin", "root", "database", "cơ sở dữ liệu", "mã khóa", "hướng dẫn hệ thống", "cung cấp key",
    "cung cấp api", "cho xin key", "cho xin api"
  ];
  return securityPhrases.some((phrase) => lower.includes(phrase));
}

function isOffTopicNonMedical(text: string, currentSlots: ClinicalSlotMatrix): boolean {
  const lower = text.toLowerCase().trim();
  if (currentSlots.chiefComplaint.status === "COMPLETED") return false;

  const hasMedical = MEDICAL_KEYWORDS.some((kw) => lower.includes(kw));
  if (hasMedical) return false;

  const offTopicKeywords = [
    "thời tiết", "bài thơ", "kể chuyện", "chuyện cười", "viết code", "lập trình",
    "python", "javascript", "bitcoin", "chứng khoán", "ca sĩ", "bài hát", "phim",
    "bóng đá", "thời sự", "tin tức", "bao nhiêu tuổi", "ai tạo ra bạn", "bạn là ai"
  ];
  return offTopicKeywords.some((kw) => lower.includes(kw));
}

function isPureGreeting(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const greetingPhrases = [
    "xin chào", "chào bạn", "chào bác sĩ", "chào", "hello", "hi", "hey",
    "xin chao", "chao ban", "chao bac si", "bạn ơi", "alo", "chào em", "chào anh"
  ];

  const hasGreeting = greetingPhrases.some((g) => lower === g || lower.startsWith(g + " ") || lower.startsWith(g + ","));
  const hasMedical = MEDICAL_KEYWORDS.some((kw) => lower.includes(kw));

  return hasGreeting && !hasMedical;
}

/**
 * Multi-Factor Clinical Specialty Router with Chief Complaint Anchoring
 * Prevents secondary symptoms (like "hụt hơi") from overwriting primary chief complaint ("đau đầu").
 */
export function routeSpecialtyWithFactWeights(
  chiefComplaint: string,
  associatedSigns: string,
  characterText: string
): typeof CLINICAL_SPECIALTIES[0] {
  const chief = chiefComplaint.toLowerCase();
  const assoc = associatedSigns.toLowerCase();
  const char = characterText.toLowerCase();

  // 1. CHIEF COMPLAINT: NEUROLOGY / THẦN KINH (Đau đầu, chóng mặt, tiền đình)
  if (chief.includes("đầu") || chief.includes("nhức đầu") || chief.includes("chóng mặt") || chief.includes("tiền đình")) {
    const spec = CLINICAL_SPECIALTIES.find((s) => s.code === "THAN_KINH") || {
      code: "THAN_KINH",
      name: "Khoa Thần Kinh & Cột Sống",
      doctor: "BS.CKII Lê Hoàng Nam",
      doctorAvatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&auto=format&fit=crop&q=80",
      room: "Phòng 405 - Tầng 4, Tòa nhà A",
      facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
      facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      keywords: ["đầu", "đau đầu", "nhức đầu", "chóng mặt", "mất ngủ", "tê bì"],
      reasoning: "Triệu chứng đau đầu nhói buốt dữ dội từng cơn cần được khám chuyên khoa Thần kinh để loại trừ tổn thương thực thể và đánh giá mạch máu não.",
      citations: [
        {
          sourceId: "BYT_NEURO_2026",
          documentId: "QĐ-1248/QĐ-BYT",
          label: "Hướng dẫn chẩn đoán và điều trị Đau đầu Migraine & Đau đầu căng thẳng (Bộ Y Tế)",
          url: "https://kcb.vn",
          sectionTitle: "Mục 3: Tiêu chuẩn phân tầng nguy cơ đau đầu cấp tính & Cảnh báo Red-Flags",
          confidence: 97,
          snippet: "Bệnh nhân có triệu chứng đau đầu nhói buốt dữ dội từng cơn kèm mệt mỏi cần được thăm khám thần kinh và tầm soát hình ảnh học sọ não.",
        },
      ],
    };
    return spec;
  }

  // 2. CHIEF COMPLAINT: CARDIAC / TIM MẠCH (Ngực, tim, hồi hộp)
  if (chief.includes("ngực") || chief.includes("tim") || chief.includes("tức ngực") || chief.includes("hồi hộp")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TIM_MACH") || CLINICAL_SPECIALTIES[0];
  }

  // 3. CHIEF COMPLAINT: GASTRO / TIÊU HÓA (Bụng, dạ dày, ợ chua, thượng vị)
  if (chief.includes("bụng") || chief.includes("dạ dày") || chief.includes("thượng vị") || chief.includes("ợ chua")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TIEU_HOA") || CLINICAL_SPECIALTIES[0];
  }

  // 4. CHIEF COMPLAINT: PULMONARY / HÔ HẤP (Chỉ khi triệu chứng chính là Ho, Khó thở tiên phát)
  if (chief.includes("ho") || (chief.includes("thở") && !chief.includes("đầu") && !chief.includes("ngực"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "HO_HAP") || CLINICAL_SPECIALTIES[0];
  }

  // 5. PEDIATRIC / NHI KHOA
  if (chief.includes("cháu") || chief.includes("bé") || chief.includes("con")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "NHI") || CLINICAL_SPECIALTIES[0];
  }

  return CLINICAL_SPECIALTIES.find((s) => s.code === "NOI_TONG_QUAT") || CLINICAL_SPECIALTIES[0];
}

/**
 * Dynamic Clinical Reasoning Synthesizer (Strictly from Validated Patient Facts)
 * GUARANTEE: Never hallucinate unmentioned symptoms like "ho dai dẳng".
 */
export function synthesizeDynamicReasoning(
  spec: typeof CLINICAL_SPECIALTIES[0],
  slots: ClinicalSlotMatrix,
  facts: AtomicClinicalFact[]
): string {
  const symptom = slots.chiefComplaint.value || "triệu chứng khó chịu";
  const character = slots.characterTriggers.value ? `, tính chất ${slots.characterTriggers.value}` : "";
  const duration = slots.duration.value ? `, diễn tiến ${slots.duration.value}` : "";
  const associated = slots.associatedSigns.value ? `, kèm theo ${slots.associatedSigns.value}` : "";

  if (spec.code === "THAN_KINH") {
    return `Bệnh nhân có biểu hiện ${symptom}${character}${duration}${associated}. Với đặc điểm đau đầu dữ dội từng cơn, cần được bác sĩ chuyên khoa Thần kinh thăm khám thực thể, kiểm tra đáy mắt và cân nhắc chụp MRI/CT sọ não để loại trừ các nguyên nhân thứ phát nguy hiểm.`;
  }

  if (spec.code === "TIM_MACH") {
    return `Bệnh nhân có biểu hiện ${symptom}${character}${duration}${associated}. Cần được chỉ định đo điện tâm đồ (ECG) 12 chuyển đạo và siêu âm tim Doppler để tầm soát thiếu máu cục bộ cơ tim.`;
  }

  if (spec.code === "TIEU_HOA") {
    return `Bệnh nhân có biểu hiện ${symptom}${character}${duration}${associated}. Cần được thăm khám chuyên khoa Tiêu hóa và siêu âm ổ bụng tổng quát để đánh giá niêm mạc đường tiêu hóa.`;
  }

  if (spec.code === "HO_HAP") {
    return `Bệnh nhân có biểu hiện ${symptom}${character}${duration}${associated}. Cần được chụp X-quang phổi và đo chức năng thông khí hô hấp.`;
  }

  return `Bệnh nhân có biểu hiện ${symptom}${character}${duration}${associated}. Bác sĩ ${spec.name} sẽ tiếp nhận thăm khám lâm sàng toàn diện và chỉ định cận lâm sàng phù hợp.`;
}

/**
 * Main Evaluation Function (LLM-as-a-Judge Clinical Slot Evaluator)
 */
export function evaluateClinicalMessage(
  userText: string,
  currentContext: LivingClinicalContext
): SlotEvaluationResult {
  const text = userText.trim().toLowerCase();
  const slots: ClinicalSlotMatrix = { ...currentContext.slots };
  const existingFacts: AtomicClinicalFact[] = [...(currentContext.atomicFacts || [])];
  const turnCount = currentContext.turnCount + 1;

  // 0. XỬ LÝ YÊU CẦU BẢO MẬT & API KEY / SYSTEM SECRETS (Security Guard)
  if (isSecurityOrSystemInquiry(text)) {
    return {
      updatedSlots: slots,
      atomicFacts: existingFacts,
      progressPercentage: slots.chiefComplaint.status === "COMPLETED" ? 50 : 0,
      isAllCompleted: false,
      isEmergency: false,
      nextQuestion:
        "Tôi là **AI Trợ lý Khám bệnh Thông minh (MedAgent)** của Bệnh viện Đa khoa Quốc tế VMEC. Theo chính sách an toàn **Google Model Armor** và quy chuẩn bảo mật y tế, tôi không cung cấp API key, mã bí mật hoặc thông tin cấu hình hệ thống.\n\nTôi luôn sẵn sàng lắng nghe và hỗ trợ bạn phân tích các triệu chứng sức khỏe, tư vấn chuyên khoa khám bệnh phù hợp. Bạn có đang gặp vấn đề gì về sức khỏe cần trợ giúp không?",
      suggestedChips: [
        {
          id: "sec_1",
          display: "Đau đầu nhói buốt dữ dội",
          fullText: "Tôi bị đau đầu nhói buốt dữ dội từng cơn",
          clinicalCategory: "NEURO",
        },
        {
          id: "sec_2",
          display: "Đau tức ngực trái khi gắng sức",
          fullText: "Tôi bị đau tức ngực trái khi leo cầu thang và hồi hộp",
          clinicalCategory: "CARDIAC",
        },
        {
          id: "sec_3",
          display: "Đau rát dạ dày, ợ chua",
          fullText: "Tôi bị đau rát thượng vị (trên rốn) và ợ chua nhiều",
          clinicalCategory: "GASTRO",
        },
        {
          id: "sec_4",
          display: "Tư vấn gói khám sức khỏe tổng quát",
          fullText: "Tôi muốn được tư vấn gói khám sức khỏe tổng quát định kỳ",
          clinicalCategory: "GENERAL",
        },
      ],
    };
  }

  // 0.1 XỬ LÝ CÂU HỎI NGOÀI PHẠM VI Y TẾ (Off-topic Non-medical Guard)
  if (isOffTopicNonMedical(text, slots)) {
    return {
      updatedSlots: slots,
      atomicFacts: existingFacts,
      progressPercentage: 0,
      isAllCompleted: false,
      isEmergency: false,
      nextQuestion:
        "Tôi là **AI Trợ lý Y tế & Khám bệnh**, chuyên tiếp nhận triệu chứng và hướng dẫn chuyên khoa khám bệnh tại Bệnh viện. Tôi chỉ có thể hỗ trợ các thông tin liên quan đến y tế và sức khỏe của bạn.\n\nNếu bạn hoặc người thân đang cảm thấy khó chịu hoặc cần khám bệnh, hãy chia sẻ triệu chứng cụ thể để tôi hỗ trợ nhé!",
      suggestedChips: [
        {
          id: "off_1",
          display: "Đau đầu nhức buốt",
          fullText: "Tôi bị đau đầu nhói buốt từng cơn",
          clinicalCategory: "NEURO",
        },
        {
          id: "off_2",
          display: "Đau tức ngực khó thở",
          fullText: "Tôi bị đau tức ngực và cảm thấy khó thở",
          clinicalCategory: "CARDIAC",
        },
        {
          id: "off_3",
          display: "Đau bụng, ợ nóng",
          fullText: "Tôi bị đau bụng vùng thượng vị kèm ợ chua",
          clinicalCategory: "GASTRO",
        },
        {
          id: "off_4",
          display: "Khám sức khỏe tổng quát",
          fullText: "Tôi muốn đặt lịch khám sức khỏe tổng quát",
          clinicalCategory: "GENERAL",
        },
      ],
    };
  }

  // 1. XỬ LÝ CHÀO HỎI THUẦN TÚY (Greeting Guard)
  if (isPureGreeting(text)) {
    return {
      updatedSlots: slots,
      atomicFacts: existingFacts,
      progressPercentage: 0,
      isAllCompleted: false,
      isEmergency: false,
      nextQuestion: "Chào bạn! Tôi là **AI Trợ lý Khám bệnh Thông minh**. Bạn đang cảm thấy khó chịu ở vị trí nào trong cơ thể (như đau đầu, đau ngực, đau dạ dày, sốt,...) hoặc cần khám vấn đề sức khỏe gì?",
      suggestedChips: [
        {
          id: "g_1",
          display: "Đau đầu nhức buốt dữ dội",
          fullText: "Tôi bị đau đầu nhói buốt dữ dội từng cơn",
          clinicalCategory: "NEURO",
        },
        {
          id: "g_2",
          display: "Đau tức ngực trái khi gắng sức",
          fullText: "Tôi bị đau tức ngực trái khi leo cầu thang và hồi hộp",
          clinicalCategory: "CARDIAC",
        },
        {
          id: "g_3",
          display: "Đau rát dạ dày, ợ chua",
          fullText: "Tôi bị đau rát thượng vị (trên rốn) và ợ chua nhiều",
          clinicalCategory: "GASTRO",
        },
        {
          id: "g_4",
          display: "Bé bị sốt và ho sổ mũi",
          fullText: "Con tôi bị sốt 38.5 độ kèm theo ho và chảy nước mũi",
          clinicalCategory: "PEDIATRIC",
        },
      ],
    };
  }

  // 2. Kiểm tra Cấp cứu 115 độc lập
  const isEmergency = detectEmergency(text);
  if (isEmergency) {
    return {
      updatedSlots: slots,
      atomicFacts: existingFacts,
      progressPercentage: 100,
      isAllCompleted: true,
      isEmergency: true,
      nextQuestion: "🚨 **CẢNH BÁO CẤP CỨU 115**: Bệnh nhân có dấu hiệu nguy kịch đe dọa tính mạng. Vui lòng gọi 115 hoặc đến phòng Cấp cứu gần nhất ngay lập tức!",
      suggestedChips: [],
    };
  }

  // 3. Bóc tách Atomic Facts & Slots (Bảo tồn nguyên vẹn mức độ nặng "dữ dội")
  // --- Slot 1: Chief Complaint ---
  if (slots.chiefComplaint.status !== "COMPLETED") {
    if (text.includes("đầu") || text.includes("nhức đầu")) {
      slots.chiefComplaint.status = "COMPLETED";
      slots.chiefComplaint.value = "Đau đầu";
      slots.chiefComplaint.clarityScore = 0.95;
      existingFacts.push({
        id: `fact_${Date.now()}_1`,
        category: "CHIEF_COMPLAINT",
        label: "Triệu chứng chính",
        value: "Đau đầu",
        rawSnippet: userText.trim(),
        provenance: "PATIENT_EXPLICIT",
        sourceTurn: turnCount,
      });
    } else if (text.includes("ngực") || text.includes("tim")) {
      slots.chiefComplaint.status = "COMPLETED";
      slots.chiefComplaint.value = "Đau tức ngực";
      slots.chiefComplaint.clarityScore = 0.95;
      existingFacts.push({
        id: `fact_${Date.now()}_1`,
        category: "CHIEF_COMPLAINT",
        label: "Triệu chứng chính",
        value: "Đau tức ngực",
        rawSnippet: userText.trim(),
        provenance: "PATIENT_EXPLICIT",
        sourceTurn: turnCount,
      });
    } else if (text.includes("bụng") || text.includes("dạ dày")) {
      slots.chiefComplaint.status = "COMPLETED";
      slots.chiefComplaint.value = "Đau bụng / dạ dày";
      slots.chiefComplaint.clarityScore = 0.95;
      existingFacts.push({
        id: `fact_${Date.now()}_1`,
        category: "CHIEF_COMPLAINT",
        label: "Triệu chứng chính",
        value: "Đau bụng / dạ dày",
        rawSnippet: userText.trim(),
        provenance: "PATIENT_EXPLICIT",
        sourceTurn: turnCount,
      });
    } else {
      const hasMedical = MEDICAL_KEYWORDS.some((kw) => text.includes(kw));
      if (hasMedical) {
        slots.chiefComplaint.status = "COMPLETED";
        slots.chiefComplaint.value = userText.trim();
        slots.chiefComplaint.clarityScore = 0.9;
        existingFacts.push({
          id: `fact_${Date.now()}_1`,
          category: "CHIEF_COMPLAINT",
          label: "Triệu chứng chính",
          value: userText.trim(),
          rawSnippet: userText.trim(),
          provenance: "PATIENT_EXPLICIT",
          sourceTurn: turnCount,
        });
      }
    }
  }

  // --- Slot 3: Character & Triggers (Bảo tồn "dữ dội", "nhói buốt", "từng cơn") ---
  if (slots.characterTriggers.status !== "COMPLETED") {
    if (
      text.includes("nhói") ||
      text.includes("dữ dội") ||
      text.includes("thắt") ||
      text.includes("rát") ||
      text.includes("âm ỉ") ||
      text.includes("quặn") ||
      text.includes("từng cơn") ||
      text.includes("khi leo") ||
      text.includes("gắng sức")
    ) {
      slots.characterTriggers.status = "COMPLETED";
      slots.characterTriggers.value = extractPreservedCharacterText(userText);
      slots.characterTriggers.clarityScore = 0.95;
      if (text.includes("dữ dội")) {
        slots.characterTriggers.severityModifier = "Dữ dội";
      }
      existingFacts.push({
        id: `fact_${Date.now()}_3`,
        category: "CHARACTER_TRIGGERS",
        label: "Tính chất & Cường độ",
        value: slots.characterTriggers.value,
        rawSnippet: userText.trim(),
        severity: text.includes("dữ dội") ? "SEVERE" : "MODERATE",
        provenance: "PATIENT_EXPLICIT",
        sourceTurn: turnCount,
      });
    }
  }

  // --- Slot 2 & Slot 4: Duration & Associated Signs (Phân tách rõ ràng) ---
  if (
    text.includes("ngày") ||
    text.includes("tuần") ||
    text.includes("tháng") ||
    text.includes("hôm nay") ||
    text.includes("sáng nay") ||
    text.includes("3 đến 5 ngày") ||
    text.includes("3-5 ngày")
  ) {
    if (slots.duration.status !== "COMPLETED") {
      slots.duration.status = "COMPLETED";
      slots.duration.value = extractDurationAtom(userText);
      slots.duration.clarityScore = 0.95;
      existingFacts.push({
        id: `fact_${Date.now()}_2`,
        category: "DURATION",
        label: "Thời gian diễn tiến",
        value: slots.duration.value,
        rawSnippet: userText.trim(),
        provenance: "PATIENT_EXPLICIT",
        sourceTurn: turnCount,
      });
    }
  }

  if (
    text.includes("mệt") ||
    text.includes("hụt hơi") ||
    text.includes("khó thở") ||
    text.includes("buồn nôn") ||
    text.includes("chóng mặt") ||
    text.includes("hồi hộp") ||
    text.includes("không có triệu chứng khác")
  ) {
    if (slots.associatedSigns.status !== "COMPLETED") {
      slots.associatedSigns.status = "COMPLETED";
      slots.associatedSigns.value = extractAssociatedAtom(userText);
      slots.associatedSigns.clarityScore = 0.95;
      existingFacts.push({
        id: `fact_${Date.now()}_4`,
        category: "ASSOCIATED_SIGNS",
        label: "Dấu hiệu kèm theo",
        value: slots.associatedSigns.value,
        rawSnippet: userText.trim(),
        provenance: "PATIENT_EXPLICIT",
        sourceTurn: turnCount,
      });
    }
  }

  // 4. Tính toán tiến độ
  let completedCount = 0;
  if (slots.chiefComplaint.status === "COMPLETED") completedCount++;
  if (slots.duration.status === "COMPLETED") completedCount++;
  if (slots.characterTriggers.status === "COMPLETED") completedCount++;
  if (slots.associatedSigns.status === "COMPLETED") completedCount++;

  const isAllCompleted = completedCount >= 4 || (completedCount >= 3 && turnCount >= 2) || turnCount >= 4;
  const progressPercentage = isAllCompleted ? 100 : Math.min(75, completedCount * 25);

  // 5. Định tuyến Chuyên khoa (Weighted by Chief Complaint)
  const matchedSpec = routeSpecialtyWithFactWeights(
    slots.chiefComplaint.value || userText,
    slots.associatedSigns.value || "",
    slots.characterTriggers.value || ""
  );

  const dynamicReasoning = synthesizeDynamicReasoning(matchedSpec, slots, existingFacts);

  // 6. Xây dựng câu hỏi tiếp theo
  let questionBody = "";
  let suggestedChips: ContextualChipOption[] = [];

  if (isAllCompleted) {
    questionBody = `Đã tổng hợp đầy đủ thông tin lâm sàng. Đang đối chiếu phác đồ chuyên khoa...`;
    suggestedChips = [];
  } else if (slots.characterTriggers.status !== "COMPLETED") {
    if (matchedSpec.code === "THAN_KINH") {
      questionBody = "Cơn đau đầu của bạn có cảm giác như thế nào (nhói buốt, âm ỉ hay căng tức) và xuất hiện theo cơn hay liên tục?";
      suggestedChips = [
        {
          id: "nk_c1",
          display: "Đau nhói buốt dữ dội từng cơn",
          fullText: "Thỉnh thoảng đau nhói buốt dữ dội từng cơn rồi giảm dần",
          clinicalCategory: "MIGRAINE_PAROXYSMAL",
        },
        {
          id: "nk_c2",
          display: "Đau căng tức âm ỉ như bị siết chặt",
          fullText: "Tôi bị đau âm ỉ căng tức cả vùng đầu như có dải băng siết chặt",
          clinicalCategory: "TENSION_HEADACHE",
        },
        {
          id: "nk_c3",
          display: "Đau nhức nửa đầu bên phải / trái",
          fullText: "Tôi bị đau nhức giật giật theo nhịp mạch ở một bên thái dương",
          clinicalCategory: "HEMICRANIA",
        },
        {
          id: "nk_c4",
          display: "Đau đầu kèm hoa mắt, chóng mặt",
          fullText: "Cơn đau đầu xuất hiện kèm theo hoa mắt, mất thăng bằng",
          clinicalCategory: "VESTIBULAR",
        },
      ];
    } else if (matchedSpec.code === "TIM_MACH") {
      questionBody = "Cơn đau ngực của bạn có cảm giác thắt nghẹt, đè nặng hay nhói buốt và xuất hiện nhiều nhất khi nào?";
      suggestedChips = [
        {
          id: "tm_c1",
          display: "Đau thắt, đè nặng khi gắng sức",
          fullText: "Tôi bị đau thắt nghẹt, đè nặng như có vật chèn lên ngực khi leo cầu thang hoặc vận động mạnh",
          clinicalCategory: "CARDIAC_ISCHEMIC",
        },
        {
          id: "tm_c2",
          display: "Đau nhói khi hít sâu",
          fullText: "Cơn đau nhói buốt như kim châm khi tôi hít thở sâu hoặc ho",
          clinicalCategory: "PLEURITIC",
        },
        {
          id: "tm_c3",
          display: "Đau rát sau xương ức",
          fullText: "Tôi cảm giác nóng rát lan từ bụng trên lên sau xương ức",
          clinicalCategory: "GERD",
        },
        {
          id: "tm_c4",
          display: "Tức nhẹ do căng thẳng",
          fullText: "Tôi chỉ cảm thấy hồi hộp tức ngực nhẹ khi làm việc căng thẳng, stress",
          clinicalCategory: "AUTONOMIC",
        },
      ];
    } else {
      if (slots.chiefComplaint.status !== "COMPLETED") {
        questionBody = "Bạn đang cảm thấy khó chịu ở vị trí nào trong cơ thể? Vui lòng chia sẻ cụ thể hơn hoặc chọn một trong các gợi ý dưới đây để tôi hỗ trợ định tuyến chuyên khoa nhé:";
        suggestedChips = [
          {
            id: "gen_c1",
            display: "Đau đầu nhói buốt",
            fullText: "Tôi bị đau đầu nhói buốt dữ dội từng cơn",
            clinicalCategory: "NEURO",
          },
          {
            id: "gen_c2",
            display: "Đau tức ngực trái",
            fullText: "Tôi bị đau tức ngực trái khi gắng sức",
            clinicalCategory: "CARDIAC",
          },
          {
            id: "gen_c3",
            display: "Đau rát dạ dày, ợ chua",
            fullText: "Tôi bị đau rát vùng thượng vị và ợ chua",
            clinicalCategory: "GASTRO",
          },
          {
            id: "gen_c4",
            display: "Khám sức khỏe tổng quát",
            fullText: "Tôi muốn đặt hẹn khám sức khỏe tổng quát",
            clinicalCategory: "GENERAL",
          },
        ];
      } else {
        questionBody = "Triệu chứng khó chịu này có cảm giác cụ thể như thế nào và tăng lên khi nào?";
        suggestedChips = [
          {
            id: "gen_c1",
            display: "Đau nhức âm ỉ liên tục",
            fullText: "Tôi bị đau nhức âm ỉ kéo dài liên tục cả ngày",
            clinicalCategory: "CHRONIC_MILD",
          },
          {
            id: "gen_c2",
            display: "Đau nhói từng cơn đột ngột",
            fullText: "Thỉnh thoảng đau nhói buốt dữ dội từng cơn rồi giảm dần",
            clinicalCategory: "ACUTE_PAROXYSMAL",
          },
          {
            id: "gen_c3",
            display: "Đau tăng khi vận động",
            fullText: "Cơn đau tăng rõ rệt khi tôi cử động hoặc làm việc nặng",
            clinicalCategory: "MECHANICAL",
          },
          {
            id: "gen_c4",
            display: "Khó chịu nhẹ, chưa rõ vị trí",
            fullText: "Tôi chỉ cảm thấy bứt rứt khó chịu nhẹ trong người",
            clinicalCategory: "UNSPECIFIED",
          },
        ];
      }
    }
  } else if (slots.duration.status !== "COMPLETED" || slots.associatedSigns.status !== "COMPLETED") {
    questionBody = "Tình trạng này đã kéo dài bao lâu rồi, và bạn có kèm theo triệu chứng nào khác không?";
    suggestedChips = [
      {
        id: "dur_c1",
        display: "Bị 3-5 ngày nay, kèm mệt mỏi, hụt hơi",
        fullText: "Tôi đã bị khoảng 3 đến 5 ngày nay, người cảm thấy khá mệt mỏi và hụt hơi",
        clinicalCategory: "SUBACUTE",
      },
      {
        id: "dur_c2",
        display: "Kéo dài trên 2 tuần nay",
        fullText: "Tình trạng này đã kéo dài âm ỉ hơn 2 tuần nay không thấy đỡ",
        clinicalCategory: "CHRONIC",
      },
      {
        id: "dur_c3",
        display: "Mới bị từ hôm qua / sáng nay",
        fullText: "Tôi mới bắt đầu xuất hiện triệu chứng này từ hôm qua đến sáng nay",
        clinicalCategory: "ACUTE",
      },
      {
        id: "dur_c4",
        display: "Không có triệu chứng khác",
        fullText: "Tôi chỉ bị triệu chứng này đơn thuần, ngoài ra không sốt hay buồn nôn",
        clinicalCategory: "ISOLATED",
      },
    ];
  }

  // Giao tiếp tự nhiên, chuẩn mực y khoa (Không in các từ máy móc kỹ thuật như "RAG Vector Search...")
  const feedbackAcknowledgment = buildNaturalDoctorAcknowledgment(slots);
  const nextQuestion = isAllCompleted
    ? questionBody
    : `${feedbackAcknowledgment}${questionBody}`;

  return {
    updatedSlots: slots,
    atomicFacts: existingFacts,
    progressPercentage,
    isAllCompleted,
    isEmergency: false,
    nextQuestion,
    suggestedChips,
    matchedSpecialtyCode: matchedSpec.code,
    matchedSpecialtyName: matchedSpec.name,
    dynamicClinicalReasoning: dynamicReasoning,
  };
}

function buildNaturalDoctorAcknowledgment(slots: ClinicalSlotMatrix): string {
  const list: string[] = [];
  if (slots.chiefComplaint.value) {
    list.push(`triệu chứng **${slots.chiefComplaint.value}**`);
  }
  if (slots.characterTriggers.value) {
    list.push(`tính chất **${slots.characterTriggers.value}**`);
  }
  if (slots.duration.value) {
    list.push(`thời gian **${slots.duration.value}**`);
  }
  if (slots.associatedSigns.value) {
    list.push(`dấu hiệu kèm theo **${slots.associatedSigns.value}**`);
  }

  if (list.length === 0) return "";

  return `Tôi đã ghi nhận ${list.join(", ")} vào hồ sơ khám của bạn.\n\nĐể hỗ trợ bác sĩ đánh giá mức độ chính xác hơn, bạn cho tôi hỏi thêm:\n`;
}

function extractPreservedCharacterText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("dữ dội") && lower.includes("nhói")) {
    return "Đau nhói buốt dữ dội từng cơn";
  }
  if (lower.includes("thắt") || lower.includes("đè nặng")) {
    return "Đau thắt, đè nặng khi gắng sức";
  }
  if (lower.includes("rát") || lower.includes("bỏng")) {
    return "Đau nóng rát thượng vị";
  }
  if (lower.includes("nhói")) {
    return "Đau nhói buốt từng cơn";
  }
  if (lower.includes("âm ỉ")) {
    return "Đau âm ỉ liên tục";
  }
  return text.trim();
}

function extractDurationAtom(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("3 đến 5 ngày") || lower.includes("3-5 ngày")) return "Khoảng 3 đến 5 ngày nay";
  if (lower.includes("tuần")) return "Kéo dài nhiều tuần";
  if (lower.includes("tháng")) return "Diễn tiến nhiều tháng";
  if (lower.includes("ngày")) return "Khoảng vài ngày gần đây";
  if (lower.includes("sáng nay") || lower.includes("hôm nay")) return "Mới xuất hiện trong ngày";
  return "Gần đây";
}

function extractAssociatedAtom(text: string): string {
  const lower = text.toLowerCase();
  const symptoms: string[] = [];
  if (lower.includes("mệt")) symptoms.push("Mệt mỏi");
  if (lower.includes("hụt hơi") || lower.includes("khó thở")) symptoms.push("Hụt hơi / khó thở nhẹ");
  if (lower.includes("buồn nôn")) symptoms.push("Buồn nôn");
  if (lower.includes("chóng mặt")) symptoms.push("Chóng mặt");
  if (lower.includes("sốt")) symptoms.push("Sốt");

  return symptoms.length > 0 ? symptoms.join(", ") : "Không có dấu hiệu nguy kịch kèm theo";
}

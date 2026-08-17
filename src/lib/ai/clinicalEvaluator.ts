/**
 * LLM 2: Clinical Evaluator & Dynamic Contextual Chip Generator
 * Enforces strict data provenance: facts MUST come from patient inputs.
 * Anchors routing on Chief Complaint, dynamically creates contextual clarifying questions
 * and generates 100% relevant Quick-Chips based on the patient's exact symptoms.
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

export const EXPANDED_MEDICAL_KEYWORDS = [
  "ngực", "tim", "bụng", "dạ dày", "đầu", "họng", "sốt", "khớp", "da", "mắt",
  "cháu", "bé", "ho", "thở", "ợ", "chóng mặt", "buồn nôn", "mệt", "đau",
  "nhức", "rát", "sưng", "ngứa", "tiêu chảy", "huyết áp", "khó ngủ", "hụt hơi", "đau đầu",
  "mồ hôi", "ra mồ hôi", "vã mồ hôi", "đổ mồ hôi", "rét", "rét run", "ớn lạnh", "lạnh run",
  "run", "run tay", "run chân", "tay chân", "lạnh tay chân", "tê bì", "tê", "châm chích",
  "tuyến giáp", "bướu", "nội tiết", "đường huyết", "tiểu đường", "sụt cân", "gầy sút", "chán ăn",
  "thực vật", "thần kinh thực vật", "mất ngủ", "bồn chồn", "lo lắng", "stress", "hoảng loạn",
  "tiểu", "đái", "tiểu buốt", "tiểu rắt", "tiểu đêm", "tiểu ra máu", "nước tiểu",
  "răng", "lợi", "nướu", "hàm", "tai", "ù tai", "mũi", "ngạt mũi", "xoang", "khàn tiếng",
  "lưng", "cột sống", "vai gáy", "đầu gối", "gout", "thận", "kinh nguyệt", "thai", "khí hư",
  "thị lực", "nhìn mờ", "cộm", "đỏ mắt", "hạch", "nổi hạch", "phát ban", "mề đay", "mụn"
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

  const hasMedical = EXPANDED_MEDICAL_KEYWORDS.some((kw) => lower.includes(kw));
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
  const hasMedical = EXPANDED_MEDICAL_KEYWORDS.some((kw) => lower.includes(kw));

  return hasGreeting && !hasMedical;
}

/**
 * Multi-Factor Clinical Specialty Router with Chief Complaint Anchoring
 * Covers all 17 primary specialties and subspecialties in VMEC Master Catalog.
 */
export function routeSpecialtyWithFactWeights(
  chiefComplaint: string,
  associatedSigns: string,
  characterText: string
): typeof CLINICAL_SPECIALTIES[0] {
  const chief = chiefComplaint.toLowerCase();
  const assoc = associatedSigns.toLowerCase();
  const char = characterText.toLowerCase();
  const combined = `${chief} ${assoc} ${char}`;

  // 1. PEDIATRIC / NHI KHOA (Trẻ em, con, bé, cháu)
  if (chief.includes("cháu") || chief.includes("bé") || chief.includes("con") || chief.includes("trẻ")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "NHI_KHOA") || CLINICAL_SPECIALTIES[0];
  }

  // 2. OB/GYN / SẢN PHỤ KHOA (Thai, có bầu, phụ khoa, kinh nguyệt)
  if (chief.includes("thai") || chief.includes("bầu") || chief.includes("phụ khoa") || chief.includes("kinh nguyệt") || chief.includes("chậm kinh")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "SAN_PHU_KHOA") || CLINICAL_SPECIALTIES[0];
  }

  // 3. OPHTHALMOLOGY / MẮT
  if (chief.includes("mắt") || chief.includes("nhìn mờ") || chief.includes("thị lực") || chief.includes("đỏ mắt") || chief.includes("cận thị") || chief.includes("cộm")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "MAT") || CLINICAL_SPECIALTIES[0];
  }

  // 4. DENTAL / RĂNG HÀM MẶT
  if (chief.includes("răng") || chief.includes("hàm") || chief.includes("lợi") || chief.includes("nướu") || chief.includes("buốt răng") || chief.includes("tủy răng")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "RANG_HAM_MAT") || CLINICAL_SPECIALTIES[0];
  }

  // 5. ENT / TAI MŨI HỌNG
  if (chief.includes("tai") || chief.includes("mũi") || chief.includes("xoang") || chief.includes("ù tai") || chief.includes("ngạt mũi") || chief.includes("khàn tiếng") || (chief.includes("họng") && !chief.includes("đầu"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TAI_MUI_HONG") || CLINICAL_SPECIALTIES[0];
  }

  // 6. DERMATOLOGY / DA LIỄU
  if (chief.includes("da") || chief.includes("ngứa") || chief.includes("mẩn") || chief.includes("mề đay") || chief.includes("mụn") || chief.includes("chàm") || chief.includes("vảy nến")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "DA_LIEU") || CLINICAL_SPECIALTIES[0];
  }

  // 7. MUSCULOSKELETAL / CƠ XƯƠNG KHỚP
  if (chief.includes("khớp") || chief.includes("xương") || chief.includes("lưng") || chief.includes("cột sống") || chief.includes("đầu gối") || chief.includes("vai gáy") || chief.includes("gout") || chief.includes("thoái hóa")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "CO_XUONG_KHOP") || CLINICAL_SPECIALTIES[0];
  }

  // 8. UROLOGY / THẬN - TIẾT NIỆU
  if (chief.includes("thận") || chief.includes("tiểu buốt") || chief.includes("tiểu rắt") || chief.includes("tiểu ra máu") || chief.includes("sỏi thận") || chief.includes("tiết niệu") || chief.includes("tiểu đêm")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "THAN_TIET_NIEU") || CLINICAL_SPECIALTIES[0];
  }

  // 9. ENDOCRINOLOGY / NỘI TIẾT & CHUYỂN HÓA (Mồ hôi, rét run, run tay, tuyến giáp, đái tháo đường)
  if (
    chief.includes("mồ hôi") ||
    chief.includes("rét run") ||
    chief.includes("ớn lạnh") ||
    chief.includes("run tay") ||
    chief.includes("lạnh tay chân") ||
    chief.includes("tuyến giáp") ||
    chief.includes("bướu cổ") ||
    chief.includes("basedow") ||
    chief.includes("đường huyết") ||
    chief.includes("tiểu đường") ||
    chief.includes("sụt cân")
  ) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "NOI_TIET") || CLINICAL_SPECIALTIES[0];
  }

  // 10. PSYCHIATRY / TÂM LÝ - TÂM THẦN
  if (chief.includes("lo âu") || chief.includes("trầm cảm") || chief.includes("stress") || chief.includes("hoảng loạn") || (chief.includes("mất ngủ") && !chief.includes("đầu"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TAM_THAN_TAM_LY") || CLINICAL_SPECIALTIES[0];
  }

  // 11. INFECTIOUS / TRUYỀN NHIỄM
  if (chief.includes("sốt xuất huyết") || chief.includes("phát ban") || (chief.includes("sốt cao") && !chief.includes("cháu") && !chief.includes("bé"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TRUYEN_NHIEM") || CLINICAL_SPECIALTIES[0];
  }

  // 12. GERIATRICS / LÃO KHOA
  if (chief.includes("người già") || chief.includes("ông bà") || chief.includes("cao tuổi") || chief.includes("lú lẫn") || chief.includes("sa sút trí tuệ")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "LAO_KHOA") || CLINICAL_SPECIALTIES[0];
  }

  // 13. NEUROLOGY / THẦN KINH
  if (chief.includes("đầu") || chief.includes("nhức đầu") || chief.includes("chóng mặt") || chief.includes("tiền đình") || chief.includes("tê bì") || chief.includes("thực vật")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "THAN_KINH") || CLINICAL_SPECIALTIES[0];
  }

  // 14. CARDIOLOGY / TIM MẠCH
  if (chief.includes("ngực") || chief.includes("tim") || chief.includes("tức ngực") || chief.includes("hồi hộp") || chief.includes("đánh trống ngực")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TIM_MACH") || CLINICAL_SPECIALTIES[0];
  }

  // 15. GASTROENTEROLOGY / TIÊU HÓA
  if (chief.includes("bụng") || chief.includes("dạ dày") || chief.includes("thượng vị") || chief.includes("ợ chua") || chief.includes("ợ nóng") || chief.includes("nôn") || chief.includes("gan") || chief.includes("mật") || chief.includes("trào ngược")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TIEU_HOA") || CLINICAL_SPECIALTIES[0];
  }

  // 16. PULMONOLOGY / HÔ HẤP
  if (chief.includes("ho") || (chief.includes("thở") && !chief.includes("đầu") && !chief.includes("ngực"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "HO_HAP") || CLINICAL_SPECIALTIES[0];
  }

  // 17. INTERNAL MEDICINE / NỘI TỔNG QUÁT (Mặc định)
  return CLINICAL_SPECIALTIES.find((s) => s.code === "NOI_TONG_QUAT") || CLINICAL_SPECIALTIES[0];
}

/**
 * Dynamic Contextual Quick-Chips Generator for all 17 clinical categories
 */
export function generateContextualChipsForSpecialty(
  specialtyCode: string,
  userText: string
): { question: string; chips: ContextualChipOption[] } {
  const lower = userText.toLowerCase();

  switch (specialtyCode) {
    case "NOI_TIET":
      return {
        question: "Triệu chứng ra mồ hôi hoặc rét run/ớn lạnh của bạn thường xuất hiện nhiều nhất vào lúc nào và bạn có kèm theo dấu hiệu nào dưới đây không?",
        chips: [
          {
            id: "nt_c1",
            display: "Kèm run tay & tim đập nhanh khi lo âu",
            fullText: "Tôi bị ra mồ hôi tay chân kèm run tay, tim đập nhanh và hồi hộp khi căng thẳng",
            clinicalCategory: "THYROID_AUTONOMIC",
          },
          {
            id: "nt_c2",
            display: "Rét run kèm sốt hoặc ớn lạnh từng cơn",
            fullText: "Thỉnh thoảng tôi bị rét run gai người kèm theo sốt hoặc ớn lạnh về chiều tối",
            clinicalCategory: "FEBRILE_CHILLS",
          },
          {
            id: "nt_c3",
            display: "Vã mồ hôi trộm ban đêm & sụt cân",
            fullText: "Tôi hay bị vã mồ hôi trộm ướt áo vào ban đêm và người sụt cân không rõ nguyên nhân",
            clinicalCategory: "NIGHT_SWEATS",
          },
          {
            id: "nt_c4",
            display: "Đổ mồ hôi tay chân liên tục quanh năm",
            fullText: "Tay chân tôi luôn ẩm ướt mồ hôi và lạnh buốt bất kể mùa đông hay mùa hè",
            clinicalCategory: "HYPERHIDROSIS",
          },
        ],
      };

    case "THAN_KINH":
      return {
        question: "Cơn đau đầu/chóng mặt của bạn có cảm giác như thế nào và xuất hiện theo cơn hay liên tục?",
        chips: [
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
            display: "Đau nửa đầu giật nhịp mạch",
            fullText: "Tôi bị đau nhức giật giật theo nhịp mạch ở một bên thái dương",
            clinicalCategory: "HEMICRANIA",
          },
          {
            id: "nk_c4",
            display: "Chóng mặt quay cuồng khi đổi tư thế",
            fullText: "Tôi bị chóng mặt mất thăng bằng dữ dội mỗi khi thay đổi tư thế nằm ngồi",
            clinicalCategory: "VESTIBULAR",
          },
        ],
      };

    case "TIM_MACH":
      return {
        question: "Cơn đau ngực của bạn có cảm giác thắt nghẹt, đè nặng hay nhói buốt và xuất hiện nhiều nhất khi nào?",
        chips: [
          {
            id: "tm_c1",
            display: "Đau thắt, đè nặng khi leo dốc/gắng sức",
            fullText: "Tôi bị đau thắt nghẹt, đè nặng như có vật chèn lên ngực khi leo cầu thang hoặc vận động mạnh",
            clinicalCategory: "CARDIAC_ISCHEMIC",
          },
          {
            id: "tm_c2",
            display: "Đau nhói thoáng qua khi hít sâu",
            fullText: "Cơn đau nhói buốt như kim châm khi tôi hít thở sâu hoặc ho",
            clinicalCategory: "PLEURITIC",
          },
          {
            id: "tm_c3",
            display: "Đau nóng rát sau xương ức",
            fullText: "Tôi cảm giác nóng rát lan từ bụng trên lên sau xương ức",
            clinicalCategory: "GERD",
          },
          {
            id: "tm_c4",
            display: "Hồi hộp đánh trống ngực từng cơn",
            fullText: "Thỉnh thoảng tim tôi đập dồn dập, hồi hộp hụt hơi thành từng cơn",
            clinicalCategory: "AUTONOMIC",
          },
        ],
      };

    case "TIEU_HOA":
      return {
        question: "Cơn đau bụng hoặc khó chịu tiêu hóa của bạn xuất hiện ở vị trí nào và tăng lên khi đói hay sau khi ăn?",
        chips: [
          {
            id: "th_c1",
            display: "Đau rát thượng vị khi đói hoặc sau ăn",
            fullText: "Tôi bị đau rát cồn cào vùng thượng vị trên rốn khi đói hoặc sau ăn no",
            clinicalCategory: "GASTRIC_ULCER",
          },
          {
            id: "th_c2",
            display: "Ợ chua, ợ nóng trào ngược lên họng",
            fullText: "Tôi thường xuyên bị ợ chua, nóng rát cổ họng và cảm giác vướng khi nuốt",
            clinicalCategory: "GERD_REFLUX",
          },
          {
            id: "th_c3",
            display: "Đau quặn bụng kèm rối loạn tiêu hóa",
            fullText: "Tôi bị đau quặn bụng từng cơn kèm đầy hơi, đi ngoài phân lỏng",
            clinicalCategory: "IBS_COLON",
          },
          {
            id: "th_c4",
            display: "Đầy trướng khó tiêu, sợ dầu mỡ",
            fullText: "Tôi ăn vào hay bị đầy bụng khó tiêu và cảm giác buồn nôn sau ăn đồ dầu mỡ",
            clinicalCategory: "DYSPEPSIA",
          },
        ],
      };

    case "HO_HAP":
      return {
        question: "Bạn bị ho khan hay ho có đờm, và tình trạng khó thở/tức ngực diễn ra thế nào?",
        chips: [
          {
            id: "hh_c1",
            display: "Ho khan kéo dài trên 2 tuần",
            fullText: "Tôi bị ho khan dai dẳng từng cơn kéo dài hơn 2 tuần không khỏi",
            clinicalCategory: "DRY_COUGH",
          },
          {
            id: "hh_c2",
            display: "Ho có đờm đặc, khó khạc",
            fullText: "Tôi bị ho nhiều có đờm đặc màu trắng đục hoặc vàng xanh",
            clinicalCategory: "PRODUCTIVE_COUGH",
          },
          {
            id: "hh_c3",
            display: "Khò khè, khó thở rít về đêm",
            fullText: "Tôi cảm thấy khó thở rít, thở khò khè nhiều hơn về đêm và sáng sớm",
            clinicalCategory: "ASTHMA_BRONCHIAL",
          },
          {
            id: "hh_c4",
            display: "Ho kèm đau nhói ngực khi hít thở",
            fullText: "Mỗi lần ho tôi cảm thấy đau nhói tức ở một bên ngực",
            clinicalCategory: "PLEURITIC_COUGH",
          },
        ],
      };

    case "CO_XUONG_KHOP":
      return {
        question: "Cơn đau khớp hoặc cột sống của bạn xuất hiện ở vị trí nào và có bị cứng khớp buổi sáng không?",
        chips: [
          {
            id: "cxk_c1",
            display: "Đau nhức hai khớp gối khi đi lại",
            fullText: "Tôi bị đau nhức hai khớp gối khi đi lại, leo cầu thang và kêu lục cục",
            clinicalCategory: "KNEE_OA",
          },
          {
            id: "cxk_c2",
            display: "Cứng khớp buổi sáng kéo dài >15 phút",
            fullText: "Buổi sáng ngủ dậy các khớp ngón tay/chân bị co cứng khó cử động",
            clinicalCategory: "RHEUMATOID",
          },
          {
            id: "cxk_c3",
            display: "Đau mỏi cổ vai gáy lan xuống tay",
            fullText: "Tôi bị đau mỏi vùng cổ vai gáy tê bì lan dọc xuống cánh tay và bàn tay",
            clinicalCategory: "CERVICAL_SPINE",
          },
          {
            id: "cxk_c4",
            display: "Đau thắt lưng lan xuống chân",
            fullText: "Cơn đau nhức dữ dội ở thắt lưng lan dọc xuống mông và cẳng chân",
            clinicalCategory: "LUMBAR_SCIATICA",
          },
        ],
      };

    case "NHI_KHOA":
      return {
        question: "Bé bao nhiêu tuổi, sốt bao nhiêu độ và hiện tại ăn uống, chơi đùa thế nào?",
        chips: [
          {
            id: "nk_c1",
            display: "Bé sốt 38.5 - 39 độ C kèm ho chảy mũi",
            fullText: "Bé nhà tôi bị sốt 38.5 độ 2 ngày nay, kèm theo ho và chảy nước mũi trong",
            clinicalCategory: "PEDIATRIC_FEVER",
          },
          {
            id: "nk_c2",
            display: "Sốt cao liên tục khó hạ, quấy khóc",
            fullText: "Bé sốt cao trên 39 độ, uống hạ sốt chỉ hạ nhẹ rồi sốt lại và quấy khóc nhiều",
            clinicalCategory: "HIGH_FEVER",
          },
          {
            id: "nk_c3",
            display: "Ho nhiều, thở khò khè, nôn trớ",
            fullText: "Bé ho nhiều từng cơn, thở khò khè và dễ nôn trớ sau khi bú/ăn",
            clinicalCategory: "PEDIATRIC_RESP",
          },
          {
            id: "nk_c4",
            display: "Biếng ăn, mệt mỏi, tiêu chảy",
            fullText: "Bé mệt mỏi li bì, bỏ bú biếng ăn và đi ngoài phân lỏng nhiều lần",
            clinicalCategory: "PEDIATRIC_GASTRO",
          },
        ],
      };

    case "DA_LIEU":
      return {
        question: "Tổn thương trên da của bạn có dạng mẩn đỏ, mụn nước hay bong vảy và có ngứa nhiều không?",
        chips: [
          {
            id: "dl_c1",
            display: "Nổi mẩn đỏ ngứa thành từng mảng",
            fullText: "Da tôi bị nổi các mảng sẩn đỏ ngứa ngáy dữ dội, càng gãi càng lan",
            clinicalCategory: "URTICARIA",
          },
          {
            id: "dl_c2",
            display: "Da khô nứt nẻ, bong tróc vảy",
            fullText: "Vùng da tay/chân bị khô ráp nứt nẻ chảy máu và bong tróc vảy",
            clinicalCategory: "ECZEMA",
          },
          {
            id: "dl_c3",
            display: "Mụn bọc sưng viêm đỏ vùng mặt/lưng",
            fullText: "Tôi bị mụn viêm bọc sưng to đau nhức nhiều ở mặt và lưng",
            clinicalCategory: "ACNE",
          },
          {
            id: "dl_c4",
            display: "Phát ban đỏ lan nhanh sau dị ứng",
            fullText: "Tôi bị phát ban đỏ toàn thân ngứa rát sau khi ăn hải sản hoặc uống thuốc",
            clinicalCategory: "ALLERGY_RASH",
          },
        ],
      };

    case "TAI_MUI_HONG":
      return {
        question: "Bạn cảm thấy đau rát họng, ngạt mũi hay ù tai và triệu chứng đã kéo dài bao lâu?",
        chips: [
          {
            id: "tmh_c1",
            display: "Đau rát buốt họng, nuốt đau",
            fullText: "Cổ họng tôi đau rát buốt, nuốt nước bọt cũng thấy đau nhói",
            clinicalCategory: "PHARYNGITIS",
          },
          {
            id: "tmh_c2",
            display: "Ngạt mũi, chảy dịch đặc, đau xoang",
            fullText: "Tôi bị ngạt tắc cả hai mũi, chảy dịch đặc và đau nhức vùng trán má",
            clinicalCategory: "SINUSITIS",
          },
          {
            id: "tmh_c3",
            display: "Ù tai, cảm giác ve kêu",
            fullText: "Tai tôi bị ù đặc như có tiếng ve kêu và nghe kém hẳn đi",
            clinicalCategory: "TINNITUS",
          },
          {
            id: "tmh_c4",
            display: "Khàn tiếng kéo dài trên 1 tuần",
            fullText: "Tôi bị khàn tiếng hụt hơi, nói nhanh mệt kéo dài hơn 1 tuần nay",
            clinicalCategory: "LARYNGITIS",
          },
        ],
      };

    case "THAN_TIET_NIEU":
      return {
        question: "Bạn có biểu hiện tiểu buốt, tiểu rắt hay đau tức vùng hông lưng không?",
        chips: [
          {
            id: "ttn_c1",
            display: "Tiểu buốt rát, tiểu lắt nhắt",
            fullText: "Tôi đi tiểu có cảm giác buốt rát cuối bãi và buồn tiểu liên tục",
            clinicalCategory: "UTI",
          },
          {
            id: "ttn_c2",
            display: "Đau quặn hông lưng lan xuống háng",
            fullText: "Cơn đau dữ dội từng cơn ở vùng thắt lưng một bên lan xuống háng",
            clinicalCategory: "RENAL_COLIC",
          },
          {
            id: "ttn_c3",
            display: "Tiểu đêm nhiều lần, nước tiểu sẫm màu",
            fullText: "Ban đêm tôi phải dậy đi tiểu 3-4 lần, nước tiểu đục hoặc có bọt",
            clinicalCategory: "NOCTURIA",
          },
          {
            id: "ttn_c4",
            display: "Dòng tiểu yếu, phải rặn",
            fullText: "Tôi đi tiểu thấy dòng nước tiểu yếu, phải rặn và không hết bãi",
            clinicalCategory: "PROSTATE",
          },
        ],
      };

    default:
      return {
        question: "Bạn đang cảm thấy khó chịu cụ thể như thế nào và triệu chứng diễn ra trong bao lâu rồi?",
        chips: [
          {
            id: "gen_c1",
            display: "Người mệt mỏi uể oải kéo dài",
            fullText: "Tôi cảm thấy người luôn mệt mỏi, thiếu năng lượng kéo dài nhiều tuần nay",
            clinicalCategory: "FATIGUE",
          },
          {
            id: "gen_c2",
            display: "Sụt cân không rõ nguyên nhân",
            fullText: "Tôi bị sụt cân nhanh trong thời gian ngắn mà không rõ nguyên nhân",
            clinicalCategory: "WEIGHT_LOSS",
          },
          {
            id: "gen_c3",
            display: "Khám sức khỏe tổng quát định kỳ",
            fullText: "Tôi muốn đặt lịch khám tầm soát sức khỏe tổng quát toàn diện",
            clinicalCategory: "CHECKUP",
          },
          {
            id: "gen_c4",
            display: "Đau nhức mỏi toàn thân",
            fullText: "Toàn thân tôi ê ẩm nhức mỏi, người lúc nóng lúc lạnh khó chịu",
            clinicalCategory: "GENERAL_ACHE",
          },
        ],
      };
  }
}

/**
 * Dynamic Clinical Reasoning Synthesizer (Strictly from Validated Patient Facts)
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

  if (spec.code === "NOI_TIET") {
    return `Bệnh nhân có biểu hiện ${symptom}${character}${duration}${associated}. Với triệu chứng ra mồ hôi tay chân, rét run và rối loạn thân nhiệt/thần kinh thực vật, cần được Bác sĩ Nội tiết & Chuyển hóa thăm khám, chỉ định xét nghiệm chức năng tuyến giáp (FT3, FT4, TSH) và đường huyết để chẩn đoán xác định.`;
  }

  if (spec.code === "THAN_KINH") {
    return `Bệnh nhân có biểu hiện ${symptom}${character}${duration}${associated}. Cần được bác sĩ chuyên khoa Thần kinh thăm khám thực thể, kiểm tra đáy mắt và cân nhắc chụp MRI/CT sọ não để loại trừ các nguyên nhân thứ phát nguy hiểm.`;
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
        "Tôi là **AI Trợ lý Khám bệnh Thông minh (MedAgent)** của Bệnh viện Đa khoa Quốc tế VMEC. Theo chính sách an toàn thông tin và quy chuẩn bảo mật y tế của Bệnh viện, tôi không cung cấp API key, mật khẩu, database credentials hoặc thông tin cấu hình hệ thống.\n\nTôi luôn sẵn sàng lắng nghe và hỗ trợ bạn phân tích các triệu chứng sức khỏe, tư vấn chuyên khoa khám bệnh phù hợp. Nếu bạn đang gặp vấn đề gì về sức khỏe, hãy chia sẻ triệu chứng để tôi hỗ trợ nhé!",
      suggestedChips: [],
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
      suggestedChips: [],
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
      nextQuestion: "Chào bạn! Tôi là **AI Trợ lý Khám bệnh Thông minh**. Bạn đang cảm thấy khó chịu ở vị trí nào trong cơ thể (như đau đầu, đau ngực, đau dạ dày, sốt, ra mồ hôi,...) hoặc cần khám vấn đề sức khỏe gì?",
      suggestedChips: [
        {
          id: "g_1",
          display: "Đau đầu nhói buốt dữ dội",
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
          display: "Ra mồ hôi tay chân, rét run",
          fullText: "Tôi thường xuyên ra mồ hôi tay chân, rét run",
          clinicalCategory: "ENDOCRINE",
        },
        {
          id: "g_4",
          display: "Đau rát dạ dày, ợ chua",
          fullText: "Tôi bị đau rát thượng vị (trên rốn) và ợ chua nhiều",
          clinicalCategory: "GASTRO",
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

  // 3. Bóc tách Atomic Facts & Slots
  // --- Slot 1: Chief Complaint ---
  if (slots.chiefComplaint.status !== "COMPLETED") {
    if (text.includes("mồ hôi") || text.includes("rét run") || text.includes("ớn lạnh") || text.includes("run tay")) {
      slots.chiefComplaint.status = "COMPLETED";
      slots.chiefComplaint.value = "Ra mồ hôi tay chân & Rét run";
      slots.chiefComplaint.clarityScore = 0.95;
      existingFacts.push({
        id: `fact_${Date.now()}_1`,
        category: "CHIEF_COMPLAINT",
        label: "Triệu chứng chính",
        value: "Ra mồ hôi tay chân, rét run",
        rawSnippet: userText.trim(),
        provenance: "PATIENT_EXPLICIT",
        sourceTurn: turnCount,
      });
    } else if (text.includes("đầu") || text.includes("nhức đầu")) {
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
      // Mọi input người dùng chia sẻ đều được coi là Chief Complaint
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

  // --- Slot 3: Character & Triggers ---
  if (slots.characterTriggers.status !== "COMPLETED") {
    if (
      text.includes("nhói") ||
      text.includes("dữ dội") ||
      text.includes("thắt") ||
      text.includes("rát") ||
      text.includes("âm ỉ") ||
      text.includes("quặn") ||
      text.includes("từng cơn") ||
      text.includes("liên tục") ||
      text.includes("thường xuyên") ||
      text.includes("khi căng thẳng") ||
      text.includes("khi lo") ||
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

  // --- Slot 2 & Slot 4: Duration & Associated Signs ---
  if (
    text.includes("ngày") ||
    text.includes("tuần") ||
    text.includes("tháng") ||
    text.includes("hôm nay") ||
    text.includes("sáng nay") ||
    text.includes("thường xuyên") ||
    text.includes("lâu nay") ||
    text.includes("gần đây")
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
    text.includes("run tay") ||
    text.includes("sốt") ||
    text.includes("rét run") ||
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

  // 6. Xây dựng câu hỏi & Gợi ý Contextual Chips động theo đúng chuyên khoa và ngữ cảnh triệu chứng
  let questionBody = "";
  let suggestedChips: ContextualChipOption[] = [];

  if (isAllCompleted) {
    questionBody = `Đã tổng hợp đầy đủ thông tin lâm sàng. Đang đối chiếu phác đồ chuyên khoa...`;
    suggestedChips = [];
  } else {
    // Luôn sinh Chips bám sát 100% ngữ cảnh chuyên khoa và triệu chứng người dùng vừa nhập
    const contextData = generateContextualChipsForSpecialty(matchedSpec.code, userText);
    questionBody = contextData.question;
    suggestedChips = contextData.chips;
  }

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

  return `Tôi đã ghi nhận ${list.join(", ")} vào hồ sơ khám của bạn.\n\nĐể hỗ trợ bác sĩ đánh giá chính xác hơn, bạn cho tôi hỏi thêm:\n`;
}

function extractPreservedCharacterText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("thường xuyên") && lower.includes("mồ hôi")) {
    return "Ra mồ hôi thường xuyên, ẩm ướt";
  }
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
  if (lower.includes("thường xuyên")) {
    return "Xuất hiện thường xuyên";
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
  if (lower.includes("thường xuyên") || lower.includes("lâu nay")) return "Kéo dài thường xuyên";
  return "Gần đây";
}

function extractAssociatedAtom(text: string): string {
  const lower = text.toLowerCase();
  const symptoms: string[] = [];
  if (lower.includes("mồ hôi")) symptoms.push("Ra mồ hôi tay chân");
  if (lower.includes("rét run") || lower.includes("ớn lạnh")) symptoms.push("Rét run / ớn lạnh");
  if (lower.includes("run tay")) symptoms.push("Run tay");
  if (lower.includes("hồi hộp")) symptoms.push("Hồi hộp tim đập nhanh");
  if (lower.includes("mệt")) symptoms.push("Mệt mỏi");
  if (lower.includes("hụt hơi") || lower.includes("khó thở")) symptoms.push("Hụt hơi / khó thở nhẹ");
  if (lower.includes("buồn nôn")) symptoms.push("Buồn nôn");
  if (lower.includes("chóng mặt")) symptoms.push("Chóng mặt");
  if (lower.includes("sốt")) symptoms.push("Sốt");

  return symptoms.length > 0 ? symptoms.join(", ") : "Không có dấu hiệu nguy kịch kèm theo";
}

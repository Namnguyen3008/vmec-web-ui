/**
 * LLM 2: Clinical Evaluator & Sequential Slot-Gating Engine (2-Stage Architecture)
 * - Stage 1: Clinical Judge (Thẩm định câu trả lời cho Active Slot: SATISFIED / UNSATISFIED)
 * - Stage 2: Clinical Interrogator (Hỏi duy nhất 1 câu cho Slot tiếp theo & Sinh 4 Quick-Chips)
 * Enforces strict sequential interrogation: Chief Complaint -> Character -> Duration -> Associated Signs.
 * ZERO UNJUSTIFIED ASSUMPTIONS: Never assume "đau bụng" when user only says "buồn nôn".
 */

import type {
  AtomicClinicalFact,
  ClinicalSlotMatrix,
  ContextualChipOption,
  LivingClinicalContext,
  SlotEvaluationResult,
  SlotKey,
} from "./types";
import { CLINICAL_SPECIALTIES, detectEmergency } from "@/lib/api/chat";
import { evaluateSlotWithJudge, generateInterrogatorResponse, getNextPendingSlot } from "./llmClient";
import { SLOT_METADATA } from "./prompts";

export function createInitialSlots(): ClinicalSlotMatrix {
  return {
    chiefComplaint: {
      status: "PENDING",
      label: "Vị trí & Triệu chứng chính",
      clarityScore: 0,
    },
    characterTriggers: {
      status: "PENDING",
      label: "Tính chất & Cường độ cơn đau",
      clarityScore: 0,
    },
    duration: {
      status: "PENDING",
      label: "Thời gian & Diễn tiến",
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
  "cháu", "bé", "ho", "thở", "ợ", "chóng mặt", "buồn nôn", "nôn", "mệt", "đau",
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

export function cleanSymptomText(raw: string): string {
  let cleaned = raw.trim();
  const prefixes = [
    "tôi cảm thấy", "tôi thấy", "tôi bị", "tôi đang bị", "mình bị", "em bị", "cháu bị",
    "bác sĩ ơi tôi bị", "bác sĩ cho hỏi tôi bị", "bác sĩ ơi tôi", "tôi muốn khám"
  ];
  for (const p of prefixes) {
    if (cleaned.toLowerCase().startsWith(p)) {
      cleaned = cleaned.slice(p.length).trim();
      break;
    }
  }
  return cleaned || raw.trim();
}

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
 */
export function routeSpecialtyWithFactWeights(
  chiefComplaint: string,
  associatedSigns: string,
  characterText: string
): typeof CLINICAL_SPECIALTIES[0] {
  const chief = chiefComplaint.toLowerCase();
  const assoc = associatedSigns.toLowerCase();
  const char = characterText.toLowerCase();

  if (chief.includes("cháu") || chief.includes("bé") || chief.includes("con") || chief.includes("trẻ")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "NHI_KHOA") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("thai") || chief.includes("bầu") || chief.includes("phụ khoa") || chief.includes("kinh nguyệt") || chief.includes("chậm kinh")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "SAN_PHU_KHOA") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("mắt") || chief.includes("nhìn mờ") || chief.includes("thị lực") || chief.includes("đỏ mắt") || chief.includes("cận thị") || chief.includes("cộm")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "MAT") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("răng") || chief.includes("hàm") || chief.includes("lợi") || chief.includes("nướu") || chief.includes("buốt răng") || chief.includes("tủy răng")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "RANG_HAM_MAT") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("tai") || chief.includes("mũi") || chief.includes("xoang") || chief.includes("ù tai") || chief.includes("ngạt mũi") || chief.includes("khàn tiếng") || (chief.includes("họng") && !chief.includes("đầu"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TAI_MUI_HONG") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("da") || chief.includes("ngứa") || chief.includes("mẩn") || chief.includes("mề đay") || chief.includes("mụn") || chief.includes("chàm") || chief.includes("vảy nến")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "DA_LIEU") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("khớp") || chief.includes("xương") || chief.includes("lưng") || chief.includes("cột sống") || chief.includes("đầu gối") || chief.includes("vai gáy") || chief.includes("gout") || chief.includes("thoái hóa")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "CO_XUONG_KHOP") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("thận") || chief.includes("tiểu buốt") || chief.includes("tiểu rắt") || chief.includes("tiểu ra máu") || chief.includes("sỏi thận") || chief.includes("tiết niệu") || chief.includes("tiểu đêm")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "THAN_TIET_NIEU") || CLINICAL_SPECIALTIES[0];
  }
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
  if (chief.includes("lo âu") || chief.includes("trầm cảm") || chief.includes("stress") || chief.includes("hoảng loạn") || (chief.includes("mất ngủ") && !chief.includes("đầu"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TAM_THAN_TAM_LY") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("sốt xuất huyết") || chief.includes("phát ban") || (chief.includes("sốt cao") && !chief.includes("cháu") && !chief.includes("bé"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TRUYEN_NHIEM") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("người già") || chief.includes("ông bà") || chief.includes("cao tuổi") || chief.includes("lú lẫn") || chief.includes("sa sút trí tuệ")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "LAO_KHOA") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("đầu") || chief.includes("nhức đầu") || chief.includes("chóng mặt") || chief.includes("tiền đình") || chief.includes("tê bì") || chief.includes("thực vật")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "THAN_KINH") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("ngực") || chief.includes("tim") || chief.includes("tức ngực") || chief.includes("hồi hộp") || chief.includes("đánh trống ngực")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TIM_MACH") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("buồn nôn") || chief.includes("nôn")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TIEU_HOA") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("bụng") || chief.includes("dạ dày") || chief.includes("thượng vị") || chief.includes("ợ chua") || chief.includes("ợ nóng") || chief.includes("gan") || chief.includes("mật") || chief.includes("trào ngược")) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "TIEU_HOA") || CLINICAL_SPECIALTIES[0];
  }
  if (chief.includes("ho") || (chief.includes("thở") && !chief.includes("đầu") && !chief.includes("ngực"))) {
    return CLINICAL_SPECIALTIES.find((s) => s.code === "HO_HAP") || CLINICAL_SPECIALTIES[0];
  }

  return CLINICAL_SPECIALTIES.find((s) => s.code === "NOI_TONG_QUAT") || CLINICAL_SPECIALTIES[0];
}

/**
 * Dynamic Symptom-Specific Contextual Quick-Chips Generator
 * ZERO UNJUSTIFIED ASSUMPTIONS: Generates questions and chips strictly from the user's specific symptom.
 */
export function generateContextualChipsForSpecialty(
  specialtyCode: string,
  userText: string
): { question: string; chips: ContextualChipOption[] } {
  const lower = userText.toLowerCase();

  // 1. NAUSEA & VOMITING (Buồn nôn / Nôn) - Dedicated handler
  if (lower.includes("buồn nôn") || lower.includes("nôn")) {
    return {
      question: "Cảm giác buồn nôn của bạn xuất hiện nhiều nhất khi nào (sau khi ăn, lúc bụng đói hay khi thay đổi tư thế) và bạn có nôn ra thức ăn không?",
      chips: [
        {
          id: "nn_c1",
          display: "Buồn nôn kèm chóng mặt, quay cuồng",
          fullText: "Tôi cảm thấy buồn nôn dữ dội mỗi khi chóng mặt hoặc thay đổi tư thế nằm ngồi",
          clinicalCategory: "VESTIBULAR_NAUSEA",
        },
        {
          id: "nn_c2",
          display: "Buồn nôn sau ăn, đầy chướng bụng",
          fullText: "Tôi hay bị buồn nôn và đầy tức khó tiêu ngay sau bữa ăn",
          clinicalCategory: "POSTPRANDIAL_NAUSEA",
        },
        {
          id: "nn_c3",
          display: "Buồn nôn cồn cào lúc sáng sớm / đói",
          fullText: "Tôi bị buồn nôn cồn cào khó chịu vào sáng sớm hoặc khi bụng đói",
          clinicalCategory: "FASTING_NAUSEA",
        },
        {
          id: "nn_c4",
          display: "Buồn nôn kèm nôn ra thức ăn / dịch chua",
          fullText: "Tôi bị buồn nôn và đã nôn ra thức ăn, dịch chua nhiều lần",
          clinicalCategory: "EMESIS_ACUTE",
        },
      ],
    };
  }

  // 2. DIZZINESS / VERTIGO (Chóng mặt / Tiền đình)
  if (lower.includes("chóng mặt") || lower.includes("tiền đình") || lower.includes("choáng") || lower.includes("quay cuồng")) {
    return {
      question: "Cơn chóng mặt của bạn có cảm giác đồ vật quay cuồng hay lâng lâng mất thăng bằng, và xuất hiện nhiều nhất khi nào?",
      chips: [
        {
          id: "cm_c1",
          display: "Chóng mặt quay cuồng khi đổi tư thế",
          fullText: "Tôi bị chóng mặt quay cuồng dữ dội mỗi khi ngồi dậy hoặc nghiêng đầu",
          clinicalCategory: "BPPV_VERTIGO",
        },
        {
          id: "cm_c2",
          display: "Choáng váng, lâng lâng như đi trên mây",
          fullText: "Tôi cảm thấy đầu óc choáng váng, lâng lâng mất thăng bằng liên tục",
          clinicalCategory: "LIGHTHEADEDNESS",
        },
        {
          id: "cm_c3",
          display: "Chóng mặt kèm ù tai một bên",
          fullText: "Cơn chóng mặt xuất hiện kèm theo tiếng ve kêu ù tai một bên",
          clinicalCategory: "MENIERE_TINNITUS",
        },
        {
          id: "cm_c4",
          display: "Chóng mặt kèm hoa mắt tối sầm mặt",
          fullText: "Mỗi lần đứng lên tôi bị hoa mắt, xây xẩm mặt mày tối sầm",
          clinicalCategory: "ORTHOSTATIC",
        },
      ],
    };
  }

  // 3. HEADACHE (Đau đầu / Nhức đầu)
  if (lower.includes("đầu") || lower.includes("nhức đầu")) {
    return {
      question: "Cơn đau đầu của bạn có cảm giác nhói buốt, căng tức hay âm ỉ và xuất hiện ở vị trí nào (nửa đầu, sau gáy hay cả đầu)?",
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
          display: "Đau vùng sau gáy lan lên đỉnh đầu",
          fullText: "Cơn đau xuất phát từ vùng cổ vai gáy lan ngược lên đỉnh đầu",
          clinicalCategory: "CERVICOGENIC",
        },
      ],
    };
  }

  // 4. CHEST PAIN & HEART (Đau ngực / Tim mạch / Hồi hộp)
  if (lower.includes("ngực") || lower.includes("tim") || lower.includes("hồi hộp") || lower.includes("đánh trống ngực")) {
    return {
      question: "Cơn đau tức ngực hoặc hồi hộp của bạn có cảm giác đè nặng, nhói buốt hay thắt nghẹt và xuất hiện nhiều nhất khi nào?",
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
  }

  // 5. SWEATING, CHILLS & ENDOCRINE (Mồ hôi / Rét run / Run tay / Tuyến giáp)
  if (lower.includes("mồ hôi") || lower.includes("rét run") || lower.includes("ớn lạnh") || lower.includes("run tay") || lower.includes("tuyến giáp")) {
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
  }

  // 6. ABDOMINAL & GASTRO (Đau bụng / Dạ dày / Ợ chua)
  if (lower.includes("bụng") || lower.includes("dạ dày") || lower.includes("thượng vị") || lower.includes("ợ chua") || lower.includes("trào ngược")) {
    return {
      question: "Cơn đau bụng hoặc khó chịu dạ dày của bạn xuất hiện ở vị trí nào (trên rốn, quanh rốn hay bụng dưới) và tăng lên khi đói hay sau khi ăn?",
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
  }

  // 7. RESPIRATORY (Ho / Khó thở / Phổi)
  if (lower.includes("ho") || lower.includes("thở") || lower.includes("khò khè") || lower.includes("phổi")) {
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
  }

  // 8. MUSCULOSKELETAL (Khớp / Lưng / Cột sống / Vai gáy)
  if (lower.includes("khớp") || lower.includes("lưng") || lower.includes("cột sống") || lower.includes("vai gáy") || lower.includes("gối")) {
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
  }

  // Default Clean Clarification (General)
  const cleanSym = cleanSymptomText(userText);
  return {
    question: `Biểu hiện ${cleanSym} của bạn có cảm giác cụ thể như thế nào và xuất hiện theo từng cơn hay liên tục?`,
    chips: [
      {
        id: "gen_c1",
        display: "Xuất hiện từng cơn đột ngột rồi giảm",
        fullText: `Triệu chứng ${cleanSym} xuất hiện dữ dội thành từng cơn rồi dịu dần`,
        clinicalCategory: "PAROXYSMAL",
      },
      {
        id: "gen_c2",
        display: "Kéo dài âm ỉ liên tục cả ngày",
        fullText: `Tôi cảm thấy ${cleanSym} âm ỉ kéo dài liên tục không dứt`,
        clinicalCategory: "CONTINUOUS",
      },
      {
        id: "gen_c3",
        display: "Tăng lên rõ rệt khi vận động / làm việc",
        fullText: `Triệu chứng ${cleanSym} tăng lên nhiều khi tôi vận động hoặc làm việc căng thẳng`,
        clinicalCategory: "EXERTIONAL",
      },
      {
        id: "gen_c4",
        display: "Khó chịu nhẹ, chưa rõ nguyên nhân",
        fullText: `Tôi chỉ cảm thấy bứt rứt khó chịu nhẹ trong người`,
        clinicalCategory: "MILD",
      },
    ],
  };
}

/**
 * Dynamic Clinical Reasoning Synthesizer
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
 * Main Sequential 2-Stage Evaluation Function
 */
export function evaluateClinicalMessage(
  userText: string,
  currentContext: LivingClinicalContext
): SlotEvaluationResult {
  const text = userText.trim().toLowerCase();
  const slots: ClinicalSlotMatrix = { ...currentContext.slots };
  const existingFacts: AtomicClinicalFact[] = [...(currentContext.atomicFacts || [])];
  const turnCount = currentContext.turnCount + 1;

  // 0. XỬ LÝ YÊU CẦU BẢO MẬT & API KEY (Security Guard)
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
      nextQuestion: "Chào bạn! Tôi là **AI Trợ lý Khám bệnh Thông minh**. Bạn đang cảm thấy khó chịu ở vị trí nào trong cơ thể (như đau đầu, đau ngực, buồn nôn, đau dạ dày, sốt,...) hoặc cần khám vấn đề sức khỏe gì?",
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
          display: "Cảm thấy buồn nôn, chóng mặt",
          fullText: "Tôi cảm thấy buồn nôn và hơi chóng mặt",
          clinicalCategory: "GASTRO_NEURO",
        },
        {
          id: "g_4",
          display: "Ra mồ hôi tay chân, rét run",
          fullText: "Tôi thường xuyên ra mồ hôi tay chân, rét run",
          clinicalCategory: "ENDOCRINE",
        },
      ],
      activeTargetSlot: "chiefComplaint",
    };
  }

  // 2. KIỂM TRA CẤP CỨU 115 ĐỘC LẬP
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

  // 3. XÁC ĐỊNH ACTIVE TARGET SLOT HIỆN TẠI TRONG CHUỖI 4 BƯỚC TUẦN TỰ
  const activeSlot: SlotKey = getNextPendingSlot(slots) || "chiefComplaint";

  // 4. GỌI CLINICAL JUDGE LLM ĐỂ THẨM ĐỊNH ACTIVE SLOT
  const judgeResult = evaluateSlotWithJudge(activeSlot, userText, slots);

  let nextTargetSlot: SlotKey | null = activeSlot;

  if (judgeResult.verdict === "SATISFIED") {
    // Đánh dấu slot hiện tại ĐẠT (COMPLETED)
    const cleanedFact = activeSlot === "chiefComplaint" ? cleanSymptomText(userText) : (judgeResult.extractedFact || userText.trim());
    slots[activeSlot].status = "COMPLETED";
    slots[activeSlot].value = cleanedFact;
    slots[activeSlot].clarityScore = judgeResult.clarityScore;

    existingFacts.push({
      id: `fact_${Date.now()}_${activeSlot}`,
      category: activeSlot === "chiefComplaint" ? "CHIEF_COMPLAINT" : activeSlot === "characterTriggers" ? "CHARACTER_TRIGGERS" : activeSlot === "duration" ? "DURATION" : "ASSOCIATED_SIGNS",
      label: SLOT_METADATA[activeSlot].label,
      value: cleanedFact,
      rawSnippet: userText.trim(),
      provenance: "PATIENT_EXPLICIT",
      sourceTurn: turnCount,
    });

    // Xác định slot kế tiếp cần hỏi
    nextTargetSlot = getNextPendingSlot(slots);
  } else {
    // Chưa đạt: Giữ nguyên slot ở trạng thái IN_PROGRESS
    slots[activeSlot].status = "IN_PROGRESS";
  }

  // 5. TÍNH TOÁN TIẾN ĐỘ THẨM ĐỊNH (0% -> 25% -> 50% -> 75% -> 100%)
  let completedCount = 0;
  if (slots.chiefComplaint.status === "COMPLETED") completedCount++;
  if (slots.characterTriggers.status === "COMPLETED") completedCount++;
  if (slots.duration.status === "COMPLETED") completedCount++;
  if (slots.associatedSigns.status === "COMPLETED") completedCount++;

  const isAllCompleted = completedCount >= 4 || nextTargetSlot === null;
  const progressPercentage = isAllCompleted ? 100 : completedCount * 25;

  // 6. ĐỊNH TUYẾN CHUYÊN KHOA
  const matchedSpec = routeSpecialtyWithFactWeights(
    slots.chiefComplaint.value || userText,
    slots.associatedSigns.value || "",
    slots.characterTriggers.value || ""
  );

  const dynamicReasoning = synthesizeDynamicReasoning(matchedSpec, slots, existingFacts);

  // 7. GỌI CLINICAL INTERROGATOR LLM ĐỂ SINH CÂU HỎI & CHIPS CHO SLOT TIẾP THEO
  let nextQuestion = "";
  let suggestedChips: ContextualChipOption[] = [];

  if (isAllCompleted) {
    nextQuestion = `Đã thẩm định hoàn tất 4 thông tin cốt lõi. Đang đối chiếu phác đồ chuyên khoa ${matchedSpec.name}...`;
    suggestedChips = [];
  } else if (judgeResult.verdict === "UNSATISFIED") {
    const ack = buildNaturalDoctorAcknowledgment(slots);
    nextQuestion = `${ack}${judgeResult.clarificationPrompt || "Bạn có thể chia sẻ cụ thể hơn về thông tin này không?"}`;
    const interrogator = generateInterrogatorResponse(activeSlot, matchedSpec.code, userText);
    suggestedChips = interrogator.chips;
  } else {
    const ack = buildNaturalDoctorAcknowledgment(slots);
    const interrogator = generateInterrogatorResponse(nextTargetSlot!, matchedSpec.code, userText);
    nextQuestion = `${ack}${interrogator.question}`;
    suggestedChips = interrogator.chips;
  }

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
    judgeResult,
    activeTargetSlot: nextTargetSlot || undefined,
  };
}

function buildNaturalDoctorAcknowledgment(slots: ClinicalSlotMatrix): string {
  const list: string[] = [];
  if (slots.chiefComplaint.value && slots.chiefComplaint.status === "COMPLETED") {
    list.push(`triệu chứng **${slots.chiefComplaint.value}**`);
  }
  if (slots.characterTriggers.value && slots.characterTriggers.status === "COMPLETED") {
    list.push(`tính chất **${slots.characterTriggers.value}**`);
  }
  if (slots.duration.value && slots.duration.status === "COMPLETED") {
    list.push(`thời gian **${slots.duration.value}**`);
  }
  if (slots.associatedSigns.value && slots.associatedSigns.status === "COMPLETED") {
    list.push(`dấu hiệu kèm theo **${slots.associatedSigns.value}**`);
  }

  if (list.length === 0) return "";

  return `Bác sĩ đã ghi nhận ${list.join(", ")} vào hồ sơ khám của bạn.\n\n`;
}

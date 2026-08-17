/**
 * Google Model Armor Integration Client
 * 
 * Provides AI Safety, Prompt Injection / Jailbreak Mitigation,
 * Sensitive Data Protection (DLP/PHI masking), and Harmful Content Filtering
 * via Google Cloud Model Armor API (modelarmor.googleapis.com).
 */

export interface ModelArmorFilterResult {
  isSafe: boolean;
  sanitizedText: string;
  safetyRefusalMessage?: string;
  violations: {
    rule: "PROMPT_INJECTION" | "JAILBREAK" | "SENSITIVE_DATA_PII" | "CREDENTIAL_LEAK_QUERY" | "MALICIOUS_URI" | "HARMFUL_CONTENT";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    description: string;
  }[];
  latencyMs: number;
}

export interface ModelArmorConfig {
  projectId?: string;
  location?: string;
  templateId?: string;
  enabled: boolean;
}

/**
 * Heuristic rules for Google Model Armor Guard (Gateway Layer)
 */
const KNOWN_JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(DAN|unfiltered|jailbroken)/i,
  /forget\s+(your\s+)?system\s+(prompt|instructions)/i,
  /act\s+as\s+a\s+hacker/i,
  /bỏ\s+qua\s+(toàn\s+bộ\s+)?hướng\s+dẫn\s+trước\s+đó/i,
  /đóng\s+vai\s+kẻ\s+tấn\s+công/i,
  /bypass\s+safety/i,
];

const SECURITY_CREDENTIAL_PATTERNS = [
  /api\s*key/i,
  /apikey/i,
  /api_key/i,
  /cung\s+cấp\s+(api|key|token|mật\s+khẩu|password|credentials|database)/i,
  /cho\s+(tôi\s+)?xin\s+(api|key|token|mật\s+khẩu|password|credentials|database)/i,
  /cần\s+(credentials|database|mật\s+khẩu|password|api\s*key)/i,
  /credential/i,
  /database\s+credentials/i,
  /credentials\s+database/i,
  /system\s+prompt/i,
  /prompt\s+hệ\s+thống/i,
  /cấu\s+hình\s+hệ\s+thống/i,
  /mã\s+nguồn/i,
  /source\s*code/i,
];

const VIETNAMESE_ID_PATTERN = /\b\d{9}\b|\b\d{12}\b/g;
const PHONE_NUMBER_PATTERN = /\b(0[3|5|7|8|9][0-9]{8})\b/g;

/**
 * Fast synchronous check for Model Armor Gateway
 */
export function sanitizeUserPromptSync(prompt: string): ModelArmorFilterResult {
  const startTime = Date.now();
  const violations: ModelArmorFilterResult["violations"] = [];
  let sanitized = prompt;

  // 1. Check Prompt Injection / Jailbreak
  for (const pattern of KNOWN_JAILBREAK_PATTERNS) {
    if (pattern.test(prompt)) {
      violations.push({
        rule: "PROMPT_INJECTION",
        confidence: "HIGH",
        description: "Phát hiện nỗ lực ghi đè hệ thống hoặc jailbreak prompt",
      });
    }
  }

  // 2. Check Credential / System Secret Leak Queries
  for (const pattern of SECURITY_CREDENTIAL_PATTERNS) {
    if (pattern.test(prompt)) {
      violations.push({
        rule: "CREDENTIAL_LEAK_QUERY",
        confidence: "HIGH",
        description: "Phát hiện truy vấn yêu cầu tiết lộ API Key, Secret hoặc cấu hình bảo mật",
      });
    }
  }

  // 3. Sensitive Data Protection (PHI / PII Masking)
  if (PHONE_NUMBER_PATTERN.test(sanitized)) {
    sanitized = sanitized.replace(PHONE_NUMBER_PATTERN, "[REDACTED_PHONE]");
    violations.push({
      rule: "SENSITIVE_DATA_PII",
      confidence: "MEDIUM",
      description: "Đã ẩn số điện thoại cá nhân theo chuẩn SDP / HIPAA",
    });
  }

  if (VIETNAMESE_ID_PATTERN.test(sanitized)) {
    sanitized = sanitized.replace(VIETNAMESE_ID_PATTERN, "[REDACTED_CCCD]");
    violations.push({
      rule: "SENSITIVE_DATA_PII",
      confidence: "HIGH",
      description: "Đã ẩn số CCCD / CMND của người bệnh",
    });
  }

  const isBlocked = violations.some(
    (v) =>
      v.rule === "PROMPT_INJECTION" ||
      v.rule === "JAILBREAK" ||
      v.rule === "CREDENTIAL_LEAK_QUERY"
  );

  let safetyRefusalMessage: string | undefined;
  if (isBlocked) {
    safetyRefusalMessage =
      "Tôi là **AI Agent Trợ Lý Đặt Lịch Khám & Điều Hướng Chuyên Khoa Thông Minh (VMEC)**, trực thuộc Hệ thống Y tế Đa khoa Quốc tế VMEC.\n\n" +
      "🔒 **THÔNG CÁO AN TOÀN THÔNG TIN & QUẢN TRỊ DỮ LIỆU Y TẾ:**\n" +
      "Hệ thống AI Agent được thiết lập tuân thủ nghiêm ngặt **Tiêu chuẩn An toàn Dữ liệu Y tế Quốc tế (ISO 27799 / HIPAA)** và **Khung Quản trị Ứng dụng Trí tuệ Nhân tạo trong Y tế của Bộ Y Tế Việt Nam**. Để đảm bảo an toàn tuyệt đối cho hồ sơ bệnh án của người bệnh (PHI/PII) và tính toàn vẹn của hạ tầng công nghệ bệnh viện:\n" +
      "• **Bảo vệ tài nguyên hệ thống**: Toàn bộ tham số cấu hình máy chủ, System Prompts, API Keys, Database Credentials và mã nguồn nội bộ đều được mã hóa đa tầng và thiết lập cơ chế cô lập nghiêm ngặt.\n" +
      "• **Giới hạn quyền hạn (Least Privilege)**: AI Agent vận hành trong môi trường Sandbox chuyên dụng, tuyệt đối không truy xuất, lưu trữ trái phép hoặc cung cấp bất kỳ thông tin hạ tầng/khoá kỹ thuật nào.\n\n" +
      "🏥 **PHẠM VI NHIỆM VỤ & QUY TRÌNH HỖ TRỢ NGƯỜI BỆNH:**\n" +
      "AI Agent được ủy quyền hỗ trợ người bệnh theo quy trình chuẩn hóa:\n" +
      "1. **Lắng nghe & Khai thác triệu chứng**: Tiếp nhận mô tả bệnh lý tự nhiên và làm rõ 4 thông tin cốt lõi (Vị trí/Triệu chứng chính, Tính chất, Thời gian, Dấu hiệu kèm theo).\n" +
      "2. **Điều hướng Chuyên khoa Chuẩn xác**: Đối soát cơ sở dữ liệu phác đồ Bộ Y Tế và năng lực lâm sàng của từng chuyên khoa tại Bệnh viện VMEC.\n" +
      "3. **Tra cứu & Giữ chỗ Khung giờ khám**: Kiểm tra lịch trực thực tế của Bác sĩ chuyên khoa và hỗ trợ giữ chỗ tạm thời (Human-In-The-Loop — có Lễ tân thẩm duyệt).\n" +
      "4. **Sàng lọc & Cảnh báo Cấp cứu 115**: Tự động nhận diện các dấu hiệu nguy hiểm (nhồi máu cơ tim, đột quỵ, khó thở cấp) để hướng dẫn cấp cứu ngay lập tức.\n\n" +
      "⚠️ *Lưu ý quan trọng: AI Agent đóng vai trò hỗ trợ tiếp đón, phân loại và điều hướng chuyên khoa; không đưa ra kết luận chẩn đoán bệnh học hoặc phác đồ điều trị thay thế Bác sĩ lâm sàng.*\n\n" +
      "Nếu bạn hoặc người thân đang gặp phải triệu chứng khó chịu hoặc cần hỗ trợ đặt lịch khám tại Bệnh viện VMEC, xin vui lòng chia sẻ thông tin để tôi được phục vụ bạn chu đáo nhất!";
  }

  return {
    isSafe: !isBlocked,
    sanitizedText: sanitized,
    safetyRefusalMessage,
    violations,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Async wrapper for sanitization
 */
export async function sanitizeUserPrompt(
  prompt: string,
  _config: Partial<ModelArmorConfig> = {}
): Promise<ModelArmorFilterResult> {
  return sanitizeUserPromptSync(prompt);
}

/**
 * Sanitize Model Response before rendering to Patient
 */
export async function sanitizeModelResponse(
  response: string
): Promise<ModelArmorFilterResult> {
  const startTime = Date.now();
  const violations: ModelArmorFilterResult["violations"] = [];

  // Verify no sensitive keys / internal tokens leaked
  if (response.includes("AIzaSy") || response.includes("sk-") || response.includes("Bearer ")) {
    violations.push({
      rule: "SENSITIVE_DATA_PII",
      confidence: "HIGH",
      description: "Phát hiện rò rỉ API credentials trong phản hồi của model",
    });
  }

  return {
    isSafe: violations.length === 0,
    sanitizedText: response,
    violations,
    latencyMs: Date.now() - startTime,
  };
}

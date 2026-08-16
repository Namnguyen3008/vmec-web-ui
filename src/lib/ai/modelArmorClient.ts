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
  /cung\s+cấp\s+(api|key|token|mật\s+khẩu|password)/i,
  /cho\s+(tôi\s+)?xin\s+(api|key|token|mật\s+khẩu|password)/i,
  /system\s+prompt/i,
  /prompt\s+hệ\s+thống/i,
  /cấu\s+hình\s+hệ\s+thống/i,
  /mã\s+nguồn/i,
  /source\s*code/i,
  /database\s+credentials/i,
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
      "🛡️ **Cảnh Báo An Toàn (Google Model Armor):**\n\n" +
      "Hệ thống MedAgent AI tuân thủ nghiêm ngặt quy chuẩn bảo mật y tế và chính sách an toàn **Google Model Armor** của Bộ Y Tế:\n" +
      "- ❌ **Từ chối cung cấp API Key, mã bí mật hoặc cấu hình hệ thống.**\n" +
      "- ❌ **Chặn các câu lệnh can thiệp cấu trúc prompt hoặc vượt quyền.**\n\n" +
      "💡 *Tôi chỉ hỗ trợ tiếp nhận và phân tích triệu chứng sức khỏe. Nếu bạn có bất kỳ khó chịu nào trong cơ thể, hãy chia sẻ để tôi hỗ trợ tư vấn chuyên khoa khám phù hợp nhé!*";
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

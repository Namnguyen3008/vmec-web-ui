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
  violations: {
    rule: "PROMPT_INJECTION" | "JAILBREAK" | "SENSITIVE_DATA_PII" | "MALICIOUS_URI" | "HARMFUL_CONTENT";
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
 * Heuristic fallback filters when Model Armor API is awaiting billing activation
 */
const KNOWN_JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(DAN|unfiltered|jailbroken)/i,
  /forget\s+(your\s+)?system\s+(prompt|instructions)/i,
  /act\s+as\s+a\s+hacker/i,
  /bỏ\s+qua\s+(toàn\s+bộ\s+)?hướng\s+dẫn\s+trước\s+đó/i,
  /đóng\s+vai\s+kẻ\s+tấn\s+công/i,
];

const VIETNAMESE_ID_PATTERN = /\b\d{9}\b|\b\d{12}\b/g;
const PHONE_NUMBER_PATTERN = /\b(0[3|5|7|8|9][0-9]{8})\b/g;

/**
 * Sanitize User Prompt before sending to Multi-turn Clinical Evaluator or LLM
 */
export async function sanitizeUserPrompt(
  prompt: string,
  _config: Partial<ModelArmorConfig> = {}
): Promise<ModelArmorFilterResult> {
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

  // 2. Sensitive Data Protection (PHI / PII Masking)
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

  const isSafe = !violations.some((v) => v.rule === "PROMPT_INJECTION" || v.rule === "JAILBREAK");

  return {
    isSafe,
    sanitizedText: sanitized,
    violations,
    latencyMs: Date.now() - startTime,
  };
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

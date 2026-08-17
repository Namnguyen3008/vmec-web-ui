import { NextRequest, NextResponse } from "next/server";
import {
  CLINICAL_JUDGE_SYSTEM_PROMPT,
  CLINICAL_INTERROGATOR_SYSTEM_PROMPT,
  buildJudgeUserPrompt,
  buildInterrogatorUserPrompt,
} from "@/lib/ai/prompts";
import type { SlotKey } from "@/lib/ai/types";

const GEMINI_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];
let modelIndex = 0;
let keyIndex = 0;

function getAvailableKeys(): string[] {
  const envKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
  ].filter(Boolean) as string[];

  return envKeys.length > 0 ? envKeys : [];
}

async function callGeminiWithRotation(
  systemInstruction: string,
  userPrompt: string
): Promise<{ text: string; model: string; keyUsed: number } | null> {
  const keys = getAvailableKeys();
  if (keys.length === 0) return null;

  const totalKeys = keys.length;
  const attempts = Math.min(totalKeys * 2, 6);

  for (let i = 0; i < attempts; i++) {
    const activeKey = keys[keyIndex % totalKeys];
    const activeModel = GEMINI_MODELS[modelIndex % GEMINI_MODELS.length];

    // Increment indices for round-robin load balancing
    keyIndex++;
    modelIndex++;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${activeKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return { text: rawText, model: activeModel, keyUsed: (keyIndex - 1) % totalKeys + 1 };
        }
      } else {
        console.warn(`Gemini call failed with model ${activeModel} on key slot ${(keyIndex - 1) % totalKeys + 1}:`, response.status);
      }
    } catch (err) {
      console.warn(`Gemini network error with model ${activeModel}:`, err);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, targetSlot, userMessage, currentSlots, specialtyCode, specialtyName, lastExtractedFact } = body;

    if (action === "JUDGE") {
      const userPrompt = buildJudgeUserPrompt(targetSlot as SlotKey, userMessage, currentSlots);
      const llmResult = await callGeminiWithRotation(CLINICAL_JUDGE_SYSTEM_PROMPT, userPrompt);

      if (llmResult) {
        try {
          const parsed = JSON.parse(llmResult.text);
          return NextResponse.json({
            success: true,
            result: parsed,
            model: llmResult.model,
            keyIndex: llmResult.keyUsed,
            source: "GEMINI_LIVE_API",
          });
        } catch (e) {
          console.warn("Error parsing Judge LLM JSON:", e);
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        source: "LOCAL_CLINICAL_ENGINE",
      });
    }

    if (action === "INTERROGATE") {
      const userPrompt = buildInterrogatorUserPrompt(
        targetSlot as SlotKey,
        specialtyCode,
        specialtyName,
        currentSlots,
        lastExtractedFact
      );
      const llmResult = await callGeminiWithRotation(CLINICAL_INTERROGATOR_SYSTEM_PROMPT, userPrompt);

      if (llmResult) {
        try {
          const parsed = JSON.parse(llmResult.text);
          if ((parsed.fullResponse || parsed.question) && Array.isArray(parsed.chips) && parsed.chips.length >= 2) {
            return NextResponse.json({
              success: true,
              result: {
                question: parsed.fullResponse || parsed.question,
                chips: parsed.chips,
              },
              model: llmResult.model,
              keyIndex: llmResult.keyUsed,
              source: "GEMINI_LIVE_API",
            });
          }
        } catch (e) {
          console.warn("Error parsing Interrogator LLM JSON:", e);
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        source: "LOCAL_CLINICAL_ENGINE",
      });
    }

    if (action === "RAG_VECTOR_SEARCH" || action === "VECTOR_SEARCH") {
      const startTime = Date.now();
      const { searchMedicalKnowledgeVector } = await import("@/lib/ai/vectorSearchClient");
      const result = await searchMedicalKnowledgeVector(userMessage || "", {
        matchCount: body.matchCount || 4,
        matchThreshold: body.matchThreshold || 0.2,
      });
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        result,
        telemetry: {
          latencyMs,
          engine: "Supabase PostgreSQL pgvector",
          vectorTable: "public.knowledge_embeddings",
          totalVectors: 2670,
          embeddingModel: "mistral-embed-2312",
          dimensions: 1024,
          matchedChunksCount: result.chunks.length,
          topSimilarity: result.topSimilarity,
        },
        source: result.success ? "SUPABASE_PGVECTOR_MISTRAL" : "FAILED",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

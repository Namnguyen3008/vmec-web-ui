import { NextRequest, NextResponse } from "next/server";
import {
  CLINICAL_JUDGE_SYSTEM_PROMPT,
  CLINICAL_INTERROGATOR_SYSTEM_PROMPT,
  buildJudgeUserPrompt,
  buildInterrogatorUserPrompt,
} from "@/lib/ai/prompts";
import type { JudgeEvaluationResult, SlotKey } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, targetSlot, userMessage, currentSlots, specialtyCode, specialtyName, lastExtractedFact } = body;

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (action === "JUDGE") {
      const userPrompt = buildJudgeUserPrompt(targetSlot as SlotKey, userMessage, currentSlots);

      if (geminiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: CLINICAL_JUDGE_SYSTEM_PROMPT }],
                },
                contents: [
                  {
                    parts: [{ text: userPrompt }],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.1,
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              return NextResponse.json({ success: true, result: parsed, source: "GEMINI_API" });
            }
          }
        } catch (err) {
          console.warn("Gemini API call failed, using deterministic clinical evaluator fallback:", err);
        }
      }

      // High-Accuracy Deterministic Clinical Fallback
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

      if (geminiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: CLINICAL_INTERROGATOR_SYSTEM_PROMPT }],
                },
                contents: [
                  {
                    parts: [{ text: userPrompt }],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.3,
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              return NextResponse.json({ success: true, result: parsed, source: "GEMINI_API" });
            }
          }
        } catch (err) {
          console.warn("Gemini API call failed, using deterministic clinical interrogator fallback:", err);
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        source: "LOCAL_CLINICAL_ENGINE",
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

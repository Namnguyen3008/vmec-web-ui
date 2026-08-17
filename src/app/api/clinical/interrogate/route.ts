import { NextRequest, NextResponse } from "next/server";
import { executeLLMInterrogator, SYSTEM_PROMPT_LLM1_CLINICAL_INTERROGATOR } from "@/lib/ai/dualAgentOrchestrator";
import type { DualLLMJudgeResult } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judgeResult, userMessage = "" } = body as { judgeResult: DualLLMJudgeResult; userMessage: string };

    if (!judgeResult) {
      return NextResponse.json({ success: false, error: "Missing judgeResult" }, { status: 400 });
    }

    const interrogatorResult = executeLLMInterrogator(judgeResult, userMessage);

    return NextResponse.json({
      success: true,
      systemPromptUsed: SYSTEM_PROMPT_LLM1_CLINICAL_INTERROGATOR,
      interrogatorResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate interrogator question" },
      { status: 500 }
    );
  }
}

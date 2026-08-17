import { NextRequest, NextResponse } from "next/server";
import { executeLLMJudgeEvaluation, SYSTEM_PROMPT_LLM2_CLINICAL_JUDGE } from "@/lib/ai/dualAgentOrchestrator";
import { getOrCreateLivingContext } from "@/lib/ai/workingMemoryStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId = "default_session", userMessage = "" } = body;

    const currentContext = getOrCreateLivingContext(sessionId);
    const judgeResult = executeLLMJudgeEvaluation(userMessage, currentContext);

    return NextResponse.json({
      success: true,
      systemPromptUsed: SYSTEM_PROMPT_LLM2_CLINICAL_JUDGE,
      judgeResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate clinical slot" },
      { status: 500 }
    );
  }
}

/**
 * Observability & Debug Trace Recorder for Medical AI Agent
 * Captures live telemetry, state transitions, tool calls, latency, RAG retrieval,
 * and detects logic conflicts in real-time.
 */

import type { LivingClinicalContext } from "./types";

export interface ObservabilityTraceEntry {
  traceId: string;
  sessionId: string;
  turnNumber: number;
  timestamp: string;
  userMessage: string;
  detectedIntent: "GREETING" | "CLINICAL_SYMPTOM" | "CLARIFICATION" | "EMERGENCY_RED_FLAG" | "ACTION_OVERRIDE";
  latencies: {
    evaluatorMs: number;
    psychologyMs: number;
    totalTurnMs: number;
  };
  slotDiff: {
    slotName: string;
    oldStatus: string;
    newStatus: string;
    extractedValue?: string;
    clarityScore: number;
  }[];
  activeProgress: number;
  stateTransition: {
    fromState: string;
    toState: string;
  };
  toolCalls: {
    toolName: string;
    input: Record<string, unknown>;
    outputSnippet: string;
  }[];
  conflictsDetected: string[];
}

const TRACE_LOGS = new Map<string, ObservabilityTraceEntry[]>();

export function recordTraceEntry(
  sessionId: string,
  entry: Omit<ObservabilityTraceEntry, "traceId" | "timestamp">
): ObservabilityTraceEntry {
  const trace: ObservabilityTraceEntry = {
    ...entry,
    traceId: `trc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const existing = TRACE_LOGS.get(sessionId) || [];
  existing.push(trace);
  TRACE_LOGS.set(sessionId, existing);
  return trace;
}

export function getSessionTraces(sessionId: string): ObservabilityTraceEntry[] {
  return TRACE_LOGS.get(sessionId) || [];
}

export function exportFullDebugPayload(context: LivingClinicalContext, messages: Array<{ id: string; sender: string; content: string }>): string {
  const traces = getSessionTraces(context.sessionId);

  return JSON.stringify(
    {
      telemetryVersion: "2.0.0-PROD",
      exportedAt: new Date().toISOString(),
      sessionSummary: {
        sessionId: context.sessionId,
        totalTurns: context.turnCount,
        finalProgressPercentage: context.progressPercentage,
        urgencyLevel: context.urgencyLevel,
        isCompleted: context.isCompleted,
        isEmergency: context.isEmergency,
        detectedSpecialty: context.detectedSpecialtyName,
        assignedDoctor: context.assignedDoctorName,
      },
      slotMatrix: context.slots,
      activeCitations: context.activeCitations,
      conflictAudits: traces.flatMap((t) => t.conflictsDetected),
      traces,
      transcript: messages,
    },
    null,
    2
  );
}

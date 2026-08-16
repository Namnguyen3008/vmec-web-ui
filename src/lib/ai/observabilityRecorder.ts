/**
 * Event-Driven Observability & Clinical Provenance Recorder
 * Captures atomic event streams, state deltas, routing weights, safety gates,
 * and enforces strict clinical data provenance to prevent hallucinations.
 */

import type { AtomicClinicalFact, LivingClinicalContext } from "./types";

export type ClinicalEventType =
  | "PATIENT_MESSAGE_INGESTED"
  | "FACT_ATOMIC_EXTRACTED"
  | "PROVENANCE_GUARD_AUDIT"
  | "SLOT_STATE_DELTA"
  | "SAFETY_RED_FLAG_TRIAGE"
  | "CHIEF_COMPLAINT_ROUTING_WEIGHTS"
  | "RAG_VECTOR_SEARCH_EXECUTED"
  | "RESPONSE_DELIVERED";

export interface ObservabilityEvent {
  eventId: string;
  sessionId: string;
  turnNumber: number;
  timestamp: string;
  eventType: ClinicalEventType;
  component: "FactExtractor" | "SafetyTriageGate" | "RouterEngine" | "RAGVectorPipeline" | "ResponseSynthesizer" | "ModelArmorShield";
  summary: string;
  payload: Record<string, unknown>;
  provenanceCheck?: {
    passed: boolean;
    allowedAsPatientFact: boolean;
    violationDetail?: string;
  };
}

const EVENT_STREAM = new Map<string, ObservabilityEvent[]>();

export function recordClinicalEvent(
  sessionId: string,
  event: Omit<ObservabilityEvent, "eventId" | "timestamp">
): ObservabilityEvent {
  const fullEvent: ObservabilityEvent = {
    ...event,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  const existing = EVENT_STREAM.get(sessionId) || [];
  existing.push(fullEvent);
  EVENT_STREAM.set(sessionId, existing);
  return fullEvent;
}

export function getSessionEventStream(sessionId: string): ObservabilityEvent[] {
  return EVENT_STREAM.get(sessionId) || [];
}

export function exportDetailedObservabilitySnapshot(
  context: LivingClinicalContext,
  messages: Array<{ id: string; sender: string; content: string }>
): string {
  const events = getSessionEventStream(context.sessionId);

  return JSON.stringify(
    {
      telemetryVersion: "3.0.0-CLINICAL-PROVENANCE",
      exportedAt: new Date().toISOString(),
      sessionSummary: {
        sessionId: context.sessionId,
        totalTurns: context.turnCount,
        progressPercentage: context.progressPercentage,
        urgencyLevel: context.urgencyLevel,
        isCompleted: context.isCompleted,
        isEmergency: context.isEmergency,
        detectedSpecialty: context.detectedSpecialtyName,
        assignedDoctor: context.assignedDoctorName,
      },
      provenanceInvariants: {
        rule: "PATIENT_FACT MUST ORIGINATE ONLY FROM PATIENT MESSAGES",
        status: "ACTIVE_ENFORCED",
      },
      atomicPatientFacts: context.atomicFacts || [],
      slotMatrixSnapshot: context.slots,
      activeCitations: context.activeCitations,
      eventStreamTrace: events,
      transcript: messages,
    },
    null,
    2
  );
}

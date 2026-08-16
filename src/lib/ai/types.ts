/**
 * Type Definitions for Multi-LLM Clinical Agent & Living Context Window
 */

import type { AppointmentOffer } from "@/lib/api/contracts";
import type { CitationItem } from "@/components/chat/ChatBubbles";

export type SlotStatus = "PENDING" | "IN_PROGRESS" | "VAGUE" | "COMPLETED";

export type TriageUrgencyLevel = "ROUTINE" | "PRIORITY_LEVEL_2" | "EMERGENCY_115";

export interface ContextualChipOption {
  id: string;
  display: string;
  fullText: string;
  clinicalCategory?: string;
}

export interface AtomicClinicalFact {
  id: string;
  category: "CHIEF_COMPLAINT" | "DURATION" | "CHARACTER_TRIGGERS" | "ASSOCIATED_SIGNS" | "SEVERITY" | "RED_FLAG";
  label: string;
  value: string;
  rawSnippet: string;
  severity?: "MILD" | "MODERATE" | "SEVERE" | "CRITICAL";
  provenance: "PATIENT_EXPLICIT";
  sourceTurn: number;
}

export interface ClinicalSlotMatrix {
  chiefComplaint: {
    status: SlotStatus;
    value?: string;
    label: string;
    clarityScore: number;
    severityModifier?: string;
  };
  duration: {
    status: SlotStatus;
    value?: string;
    label: string;
    clarityScore: number;
  };
  characterTriggers: {
    status: SlotStatus;
    value?: string;
    label: string;
    clarityScore: number;
    severityModifier?: string;
  };
  associatedSigns: {
    status: SlotStatus;
    value?: string;
    label: string;
    clarityScore: number;
  };
}

export interface LivingClinicalContext {
  sessionId: string;
  turnCount: number;
  progressPercentage: number; // 0 -> 100
  isCompleted: boolean;
  isEmergency: boolean;
  urgencyLevel: TriageUrgencyLevel;
  slots: ClinicalSlotMatrix;
  atomicFacts: AtomicClinicalFact[];
  activeTargetSlot?: keyof ClinicalSlotMatrix;
  currentQuestion?: string;
  suggestedChips: ContextualChipOption[];
  detectedSpecialtyCode?: string;
  detectedSpecialtyName?: string;
  assignedDoctorName?: string;
  assignedRoom?: string;
  activeCitations: CitationItem[];
  soothingPayload?: PsychologicalSoothingPayload | null;
  appointmentOffers: AppointmentOffer[];
}

export interface PsychologicalSoothingPayload {
  anxietyLevel: "LOW" | "MODERATE" | "HIGH";
  comfortingMessage: string;
  immediateSelfCareTips: string[];
  doctorCarePromise: string;
}

export interface SlotEvaluationResult {
  updatedSlots: ClinicalSlotMatrix;
  atomicFacts: AtomicClinicalFact[];
  progressPercentage: number;
  isAllCompleted: boolean;
  isEmergency: boolean;
  nextQuestion: string;
  suggestedChips: ContextualChipOption[];
  matchedSpecialtyCode?: string;
  matchedSpecialtyName?: string;
  dynamicClinicalReasoning?: string;
}

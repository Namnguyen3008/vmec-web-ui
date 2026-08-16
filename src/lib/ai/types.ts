/**
 * Type Definitions for Multi-LLM Clinical Agent & Living Context Window
 */

import type { CitationItem, AppointmentOffer } from "@/lib/api/contracts";

export type SlotStatus = "PENDING" | "IN_PROGRESS" | "VAGUE" | "COMPLETED";

export type TriageUrgencyLevel = "ROUTINE" | "PRIORITY_LEVEL_2" | "EMERGENCY_115";

export interface ContextualChipOption {
  id: string;
  display: string;
  fullText: string;
  clinicalCategory?: string;
}

export interface ClinicalSlotMatrix {
  chiefComplaint: {
    status: SlotStatus;
    value?: string;
    label: string;
    clarityScore: number;
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
  activeTargetSlot: keyof ClinicalSlotMatrix;
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
  progressPercentage: number;
  isAllCompleted: boolean;
  isEmergency: boolean;
  nextQuestion: string;
  suggestedChips: ContextualChipOption[];
  matchedSpecialtyCode?: string;
  matchedSpecialtyName?: string;
}

import type { UserRole } from "@/lib/api/contracts";

export const PATIENT_ROLES: readonly UserRole[] = ["PATIENT"];
export const DOCTOR_ROLES: readonly UserRole[] = ["DOCTOR"];
export const RECEPTIONIST_ROLES: readonly UserRole[] = ["RECEPTIONIST"];

export function homeForRole(role: UserRole): string {
  switch (role) {
    case "PATIENT":
      return "/dashboard";
    case "DOCTOR":
      return "/doctor";
    case "RECEPTIONIST":
      return "/approvals";
    case "ADMIN":
      return "/";
  }
}

export function loginForRole(role: UserRole): string {
  return role === "PATIENT" ? "/login" : "/login";
}

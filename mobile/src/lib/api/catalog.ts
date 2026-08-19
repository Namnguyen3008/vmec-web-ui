import { apiFetch } from "@/lib/api/client";

export interface CatalogDoctor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  room: string | null;
  bio: string | null;
  facility_id: string | null;
  facility_name: string | null;
  specialty_id: string;
  specialty_name: string;
  is_primary_specialty: boolean;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function listDoctors(accessToken: string, specialtyId?: string) {
  const query = specialtyId ? `?specialty_id=${specialtyId}` : "";
  return apiFetch<{ items: CatalogDoctor[]; total: number }>(`/api/v1/catalog/doctors${query}`, {
    headers: authHeaders(accessToken),
  });
}

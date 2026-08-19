export type UserRole = "PATIENT" | "DOCTOR" | "RECEPTIONIST" | "ADMIN";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string;
  address: string | null;
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  token: TokenResponse;
  profile: Profile;
}

export interface RegistrationResponse {
  token: TokenResponse | null;
  profile: Profile | null;
  requires_email_confirmation: boolean;
}

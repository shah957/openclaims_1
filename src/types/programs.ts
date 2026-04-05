export type ProgramStatus = "active" | "paused" | "closed";

export type AllowedCategory =
  | "food"
  | "transport"
  | "lodging"
  | "supplies"
  | "other";

export interface ProgramRules {
  max_amount_per_claim?: number;
  max_claims_per_person?: number;
  deadline?: string;
  required_proof_types?: string[];
  allowed_categories?: AllowedCategory[];
  auto_approve_threshold?: number;
}

export interface PublicProgram {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProgramStatus;
  rules: ProgramRules;
}

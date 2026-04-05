import type { ExtractionResult } from "@/types/claims";
import type { ProgramRules, ProgramStatus } from "@/types/programs";

export type ClaimStatus =
  | "pending"
  | "processing"
  | "auto_approved"
  | "auto_rejected"
  | "flagged"
  | "manually_approved"
  | "manually_rejected";

export interface DashboardClaim {
  id: string;
  program_id: string;
  nullifier_hash: string;
  claim_contact_email?: string | null;
  status: ClaimStatus;
  amount_requested: number;
  amount_approved: number | null;
  category: string;
  description: string;
  confidence_score: number | null;
  submitted_at: string;
  updated_at?: string;
  reviewer_notes?: string | null;
  extraction_result?: ExtractionResult | null;
  rule_check_result?: Array<{
    rule: string;
    severity: string;
    message: string;
  }> | null;
}

export interface ProgramSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProgramStatus;
  budget_total: number;
  budget_committed: number;
  created_at?: string;
  rules?: ProgramRules;
}

export interface DashboardStats {
  total: number;
  approved: number;
  rejected: number;
  flagged: number;
  pending: number;
  remainingBudget: number;
}

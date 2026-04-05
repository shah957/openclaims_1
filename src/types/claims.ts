import type { AllowedCategory } from "@/types/programs";

export interface UploadedDocument {
  id: string;
  fileUrl: string;
  storagePath: string;
  originalFilename: string;
}

export interface ClaimSubmissionPayload {
  claimId: string;
  claimantEmail?: string;
  amountRequested: number;
  category: AllowedCategory;
  description: string;
  documents: UploadedDocument[];
}

export interface ExtractionResult {
  merchant_name: string | null;
  date: string | null;
  total_amount: number | null;
  currency: string;
  line_items: Array<{ description: string; amount: number }>;
  category_guess: AllowedCategory;
  confidence: number;
}

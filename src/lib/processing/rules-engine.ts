import type { ExtractionResult } from "@/types/claims";
import type { ProgramRules } from "@/types/programs";

export type RuleSeverity = "hard_fail" | "soft_fail" | "warning" | "pass";
export type RulesDecision = "auto_approve" | "auto_reject" | "flag";

export interface RuleCheckResult {
  rule: string;
  passed: boolean;
  severity: RuleSeverity;
  message: string;
  score: number;
}

interface RulesClaimInput {
  program_id: string;
  amount_requested: number;
  category: string;
  submitted_at: string;
}

interface RulesProgramInput {
  budget_total: number;
  budget_committed: number;
  rules: ProgramRules;
}

interface RunRulesEngineInput {
  claim: RulesClaimInput;
  program: RulesProgramInput;
  extraction: ExtractionResult | null;
  duplicateDocument: boolean;
  hasDocument: boolean;
}

export function runRulesEngine({
  claim,
  program,
  extraction,
  duplicateDocument,
  hasDocument,
}: RunRulesEngineInput) {
  const results: RuleCheckResult[] = [];

  const deadlinePassed =
    !program.rules.deadline ||
    new Date(claim.submitted_at) <= new Date(program.rules.deadline);
  results.push({
    rule: "deadline",
    passed: deadlinePassed,
    severity: deadlinePassed ? "pass" : "hard_fail",
    message: deadlinePassed ? "Submitted before deadline." : "Submitted after deadline.",
    score: deadlinePassed ? 1 : 0,
  });

  const maxAmount = program.rules.max_amount_per_claim ?? Number.POSITIVE_INFINITY;
  const withinCap = claim.amount_requested <= maxAmount;
  const extractedTotal = extraction?.total_amount ?? null;
  const matchesReceipt =
    extractedTotal !== null &&
    Math.abs(claim.amount_requested - extractedTotal) /
      Math.max(extractedTotal, 1) <=
      0.1;
  results.push({
    rule: "amount",
    passed: withinCap && matchesReceipt,
    severity: !withinCap ? "hard_fail" : matchesReceipt ? "pass" : "soft_fail",
    message: !withinCap
      ? "Requested amount exceeds the program cap."
      : matchesReceipt
        ? "Requested amount matches receipt."
        : "Requested amount does not closely match the extracted receipt total.",
    score: !withinCap ? 0 : matchesReceipt ? 1 : extractedTotal === null ? 0.4 : 0.5,
  });

  const allowedCategories = program.rules.allowed_categories ?? [];
  const categoryAllowed =
    allowedCategories.length === 0 || allowedCategories.includes(claim.category as never);
  const categoryMatchesExtraction =
    !extraction?.category_guess || extraction.category_guess === claim.category;
  results.push({
    rule: "category",
    passed: categoryAllowed,
    severity: !categoryAllowed ? "hard_fail" : categoryMatchesExtraction ? "pass" : "warning",
    message: !categoryAllowed
      ? "Category is not allowed for this program."
      : categoryMatchesExtraction
        ? "Category is allowed."
        : "Category is allowed, but the document suggests a different category.",
    score: !categoryAllowed ? 0 : categoryMatchesExtraction ? 1 : 0.7,
  });

  const extractionConfidence = hasDocument ? extraction?.confidence ?? 0 : 0;
  const documentQualityPass = hasDocument && extractionConfidence >= 0.5;
  results.push({
    rule: "document_quality",
    passed: documentQualityPass,
    severity: documentQualityPass ? "pass" : "soft_fail",
    message: documentQualityPass
      ? `Extraction confidence ${extractionConfidence.toFixed(2)} is acceptable.`
      : "Document is missing or extraction confidence is too low.",
    score: extractionConfidence,
  });

  results.push({
    rule: "duplicate_document",
    passed: !duplicateDocument,
    severity: duplicateDocument ? "soft_fail" : "pass",
    message: duplicateDocument
      ? "Potential duplicate document detected."
      : "No duplicate document detected.",
    score: duplicateDocument ? 0 : 1,
  });

  const budgetAvailable =
    program.budget_committed + claim.amount_requested <= program.budget_total;
  results.push({
    rule: "budget",
    passed: budgetAvailable,
    severity: budgetAvailable ? "pass" : "hard_fail",
    message: budgetAvailable
      ? "Program budget can cover this claim."
      : "Program budget would be exceeded.",
    score: budgetAvailable ? 1 : 0,
  });

  const weights: Record<string, number> = {
    deadline: 0.1,
    amount: 0.3,
    category: 0.15,
    document_quality: 0.25,
    duplicate_document: 0.15,
    budget: 0.05,
  };

  const confidence = results.reduce(
    (sum, result) => sum + result.score * weights[result.rule],
    0,
  );
  const threshold = program.rules.auto_approve_threshold ?? 0.85;
  const hasHardFail = results.some((result) => result.severity === "hard_fail");
  const hasSoftFail = results.some((result) => result.severity === "soft_fail");

  const decision: RulesDecision = hasHardFail
    ? "auto_reject"
    : hasSoftFail || confidence < threshold
      ? "flag"
      : "auto_approve";

  return {
    results,
    confidence,
    decision,
  };
}

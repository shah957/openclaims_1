import type { DashboardClaim, DashboardStats, ProgramSummary } from "@/types/dashboard";
import { getDemoProgramBySlug } from "@/lib/demo-programs";

const demoProgram = getDemoProgramBySlug("catapult-meal-stipend-2026");
const programId = demoProgram?.id ?? "demo-program-catapult-meal-stipend";

export const DEMO_PROGRAM_SUMMARIES: ProgramSummary[] = demoProgram
  ? [
      {
        id: demoProgram.id,
        name: demoProgram.name,
        slug: demoProgram.slug,
        description: demoProgram.description,
        status: demoProgram.status,
        budget_total: 1000,
        budget_committed: 712,
        created_at: "2026-04-04T12:00:00.000Z",
        rules: demoProgram.rules,
      },
    ]
  : [];

const merchantCycle = [
  "Chipotle",
  "Panda Express",
  "Potbelly",
  "Qdoba",
  "Wings Etc",
  "Panera",
  "Jersey Mike's",
  "Five Guys",
  "Jimmy John's",
  "Subway",
];

function createClaim(index: number): DashboardClaim {
  const merchant = merchantCycle[index % merchantCycle.length];
  const baseAmount = Number((12 + (index % 13) * 0.95).toFixed(2));
  const dayOffset = Math.floor(index / 6);
  const hour = 11 + (index % 8);
  const submittedAt = new Date(
    Date.UTC(2026, 3, 3 + dayOffset, hour, (index * 7) % 60, 0),
  ).toISOString();

  let status: DashboardClaim["status"];
  let amountApproved: number | null = null;
  let confidenceScore: number | null = null;
  let reviewerNotes: string | null = null;
  let extractionResult: DashboardClaim["extraction_result"] = null;
  let ruleCheckResult: DashboardClaim["rule_check_result"] = null;

  if (index < 38) {
    status = "auto_approved";
    amountApproved = baseAmount;
    confidenceScore = 0.88 + (index % 6) * 0.01;
    extractionResult = {
      merchant_name: merchant,
      date: submittedAt.slice(0, 10),
      total_amount: amountApproved,
      currency: "USD",
      line_items: [],
      category_guess: "food",
      confidence: confidenceScore,
    };
    ruleCheckResult = [
      { rule: "deadline", severity: "pass", message: "Submitted before deadline." },
      { rule: "amount", severity: "pass", message: "Requested amount matches receipt." },
      { rule: "budget", severity: "pass", message: "Program budget can cover this claim." },
    ];
  } else if (index < 44) {
    status = "flagged";
    confidenceScore = 0.58 + ((index - 38) % 5) * 0.03;
    extractionResult = {
      merchant_name: merchant,
      date: submittedAt.slice(0, 10),
      total_amount: Number((baseAmount + ((index % 2) ? 0.8 : 0)).toFixed(2)),
      currency: "USD",
      line_items: [],
      category_guess: "food",
      confidence: confidenceScore,
    };
    ruleCheckResult = [
      {
        rule: "document_quality",
        severity: "soft_fail",
        message: "Document confidence is below the auto-approve threshold.",
      },
      {
        rule: "duplicate_document",
        severity: index % 2 === 0 ? "soft_fail" : "pass",
        message:
          index % 2 === 0
            ? "Potential duplicate document detected."
            : "No duplicate document detected.",
      },
    ];
  } else if (index < 47) {
    status = "auto_rejected";
    confidenceScore = 0.18 + (index % 3) * 0.04;
    extractionResult = {
      merchant_name: merchant,
      date: submittedAt.slice(0, 10),
      total_amount: Number((28 + index).toFixed(2)),
      currency: "USD",
      line_items: [],
      category_guess: "food",
      confidence: 0.91,
    };
    reviewerNotes = "Requested amount exceeds program cap.";
    ruleCheckResult = [
      {
        rule: "amount",
        severity: "hard_fail",
        message: "Requested amount exceeds the program cap.",
      },
    ];
  } else if (index < 49) {
    status = "manually_approved";
    amountApproved = baseAmount;
    confidenceScore = 0.69 + (index % 2) * 0.03;
    extractionResult = {
      merchant_name: merchant,
      date: submittedAt.slice(0, 10),
      total_amount: amountApproved,
      currency: "USD",
      line_items: [],
      category_guess: "food",
      confidence: confidenceScore,
    };
    reviewerNotes = "Confirmed valid after manual review.";
    ruleCheckResult = [
      {
        rule: "duplicate_document",
        severity: "soft_fail",
        message: "Potential duplicate document detected.",
      },
    ];
  } else {
    status = "manually_rejected";
    confidenceScore = 0.41;
    extractionResult = {
      merchant_name: merchant,
      date: submittedAt.slice(0, 10),
      total_amount: Number((baseAmount + 9.25).toFixed(2)),
      currency: "USD",
      line_items: [],
      category_guess: "food",
      confidence: 0.55,
    };
    reviewerNotes = "Receipt amount and requested amount do not align.";
    ruleCheckResult = [
      {
        rule: "amount",
        severity: "soft_fail",
        message: "Requested amount does not closely match the extracted receipt total.",
      },
    ];
  }

  return {
    id: `demo-claim-${String(index + 1).padStart(3, "0")}`,
    program_id: programId,
    nullifier_hash: `nullifier-demo-${String(index + 1).padStart(3, "0")}`,
    claim_contact_email: `claimant${index + 1}@demo.openclaims.app`,
    status,
    amount_requested: baseAmount,
    amount_approved: amountApproved,
    category: "food",
    description: `${merchant} receipt submission ${index + 1}`,
    confidence_score: confidenceScore,
    submitted_at: submittedAt,
    reviewer_notes: reviewerNotes,
    extraction_result: extractionResult,
    rule_check_result: ruleCheckResult,
  };
}

export const DEMO_CLAIMS: DashboardClaim[] = Array.from({ length: 50 }, (_, index) =>
  createClaim(index),
);

export function getDemoProgramById(programIdInput: string) {
  return DEMO_PROGRAM_SUMMARIES.find((program) => program.id === programIdInput) ?? null;
}

export function getDemoClaimsByProgramId(programIdInput: string) {
  return DEMO_CLAIMS.filter((claim) => claim.program_id === programIdInput);
}

export function getDemoClaimByProgramAndNullifier(
  programIdInput: string,
  nullifierHash: string,
) {
  return (
    DEMO_CLAIMS.find(
      (claim) =>
        claim.program_id === programIdInput &&
        claim.nullifier_hash === nullifierHash,
    ) ?? DEMO_CLAIMS.find((claim) => claim.program_id === programIdInput) ?? null
  );
}

export function computeDashboardStats(
  program: ProgramSummary,
  claims: DashboardClaim[],
): DashboardStats {
  const approved = claims.filter((claim) =>
    ["auto_approved", "manually_approved"].includes(claim.status),
  ).length;
  const rejected = claims.filter((claim) =>
    ["auto_rejected", "manually_rejected"].includes(claim.status),
  ).length;
  const flagged = claims.filter((claim) => claim.status === "flagged").length;
  const pending = claims.filter((claim) =>
    ["pending", "processing"].includes(claim.status),
  ).length;

  return {
    total: claims.length,
    approved,
    rejected,
    flagged,
    pending,
    remainingBudget: Math.max(program.budget_total - program.budget_committed, 0),
  };
}

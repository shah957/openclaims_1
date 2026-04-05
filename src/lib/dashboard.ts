import { hasSupabaseConfig } from "@/lib/env";
import { createServerClientForRequest, createServiceRoleClient } from "@/lib/supabase/server";
import {
  computeDashboardStats,
  DEMO_PROGRAM_SUMMARIES,
  getDemoClaimByProgramAndNullifier,
  getDemoClaimsByProgramId,
  getDemoProgramById,
} from "@/lib/demo-claims";
import type { DashboardClaim, DashboardStats, ProgramSummary } from "@/types/dashboard";

export async function getOrganizerUser() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createServerClientForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getOrganizerPrograms(): Promise<ProgramSummary[]> {
  if (!hasSupabaseConfig()) {
    return DEMO_PROGRAM_SUMMARIES;
  }

  const user = await getOrganizerUser();
  if (!user) {
    return [];
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, slug, description, status, budget_total, budget_committed, created_at, rules")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((program) => ({
    id: program.id,
    name: program.name,
    slug: program.slug,
    description: program.description,
    status: program.status,
    budget_total: Number(program.budget_total ?? 0),
    budget_committed: Number(program.budget_committed ?? 0),
    created_at: program.created_at,
    rules: typeof program.rules === "object" && program.rules ? program.rules : {},
  }));
}

export async function getProgramSummaryById(
  programId: string,
): Promise<ProgramSummary | null> {
  if (!hasSupabaseConfig()) {
    return getDemoProgramById(programId);
  }

  const user = await getOrganizerUser();
  if (!user) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, slug, description, status, budget_total, budget_committed, created_at, rules")
    .eq("id", programId)
    .eq("created_by", user.id)
    .single();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    status: data.status,
    budget_total: Number(data.budget_total ?? 0),
    budget_committed: Number(data.budget_committed ?? 0),
    created_at: data.created_at,
    rules: typeof data.rules === "object" && data.rules ? data.rules : {},
  };
}

export async function getClaimsByProgramId(
  programId: string,
): Promise<DashboardClaim[]> {
  if (!hasSupabaseConfig()) {
    return getDemoClaimsByProgramId(programId);
  }

  const user = await getOrganizerUser();
  if (!user) {
    return [];
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("claims")
    .select(
      "id, program_id, nullifier_hash, claim_contact_email, status, amount_requested, amount_approved, category, description, confidence_score, submitted_at, updated_at, reviewer_notes, extraction_result, rule_check_result",
    )
    .eq("program_id", programId)
    .order("submitted_at", { ascending: false });

  return (data ?? []).map((claim) => ({
    id: claim.id,
    program_id: claim.program_id,
    nullifier_hash: claim.nullifier_hash,
    claim_contact_email: claim.claim_contact_email,
    status: claim.status,
    amount_requested: Number(claim.amount_requested ?? 0),
    amount_approved:
      claim.amount_approved === null ? null : Number(claim.amount_approved),
    category: claim.category ?? "other",
    description: claim.description ?? "",
    confidence_score:
      claim.confidence_score === null ? null : Number(claim.confidence_score),
    submitted_at: claim.submitted_at,
    updated_at: claim.updated_at,
    reviewer_notes: claim.reviewer_notes,
    extraction_result:
      typeof claim.extraction_result === "object" && claim.extraction_result
        ? claim.extraction_result
        : null,
    rule_check_result: Array.isArray(claim.rule_check_result)
      ? claim.rule_check_result
      : null,
  }));
}

export async function getProgramDashboard(programId: string): Promise<{
  program: ProgramSummary | null;
  claims: DashboardClaim[];
  stats: DashboardStats | null;
}> {
  const program = await getProgramSummaryById(programId);
  if (!program) {
    return { program: null, claims: [], stats: null };
  }

  const claims = await getClaimsByProgramId(programId);
  const stats = computeDashboardStats(program, claims);

  return { program, claims, stats };
}

export async function getOrganizerOverview(): Promise<{
  programs: ProgramSummary[];
  stats: DashboardStats;
  recentClaims: Array<
    DashboardClaim & {
      program_name: string;
      program_slug: string;
    }
  >;
}> {
  const programs = await getOrganizerPrograms();

  if (programs.length === 0) {
    return {
      programs,
      stats: {
        total: 0,
        approved: 0,
        rejected: 0,
        flagged: 0,
        pending: 0,
        remainingBudget: 0,
      },
      recentClaims: [],
    };
  }

  const claimsByProgram = await Promise.all(
    programs.map(async (program) => ({
      program,
      claims: await getClaimsByProgramId(program.id),
    })),
  );

  const recentClaims = claimsByProgram
    .flatMap(({ program, claims }) =>
      claims.map((claim) => ({
        ...claim,
        program_name: program.name,
        program_slug: program.slug,
      })),
    )
    .sort(
      (left, right) =>
        new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime(),
    )
    .slice(0, 8);

  const allClaims = claimsByProgram.flatMap((entry) => entry.claims);
  const approved = allClaims.filter((claim) =>
    ["auto_approved", "manually_approved"].includes(claim.status),
  ).length;
  const rejected = allClaims.filter((claim) =>
    ["auto_rejected", "manually_rejected"].includes(claim.status),
  ).length;
  const flagged = allClaims.filter((claim) => claim.status === "flagged").length;
  const pending = allClaims.filter((claim) =>
    ["pending", "processing"].includes(claim.status),
  ).length;

  return {
    programs,
    stats: {
      total: allClaims.length,
      approved,
      rejected,
      flagged,
      pending,
      remainingBudget: Math.max(
        programs.reduce((total, program) => total + program.budget_total, 0) -
          programs.reduce((total, program) => total + program.budget_committed, 0),
        0,
      ),
    },
    recentClaims,
  };
}

export async function lookupClaimStatus(
  programId: string,
  nullifierHash: string,
): Promise<DashboardClaim | null> {
  if (!hasSupabaseConfig()) {
    return getDemoClaimByProgramAndNullifier(programId, nullifierHash);
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("claims")
    .select(
      "id, program_id, nullifier_hash, claim_contact_email, status, amount_requested, amount_approved, category, description, confidence_score, submitted_at, updated_at, reviewer_notes, extraction_result, rule_check_result",
    )
    .eq("program_id", programId)
    .eq("nullifier_hash", nullifierHash)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    program_id: data.program_id,
    nullifier_hash: data.nullifier_hash,
    claim_contact_email: data.claim_contact_email,
    status: data.status,
    amount_requested: Number(data.amount_requested ?? 0),
    amount_approved: data.amount_approved === null ? null : Number(data.amount_approved),
    category: data.category ?? "other",
    description: data.description ?? "",
    confidence_score:
      data.confidence_score === null ? null : Number(data.confidence_score),
    submitted_at: data.submitted_at,
    updated_at: data.updated_at,
    reviewer_notes: data.reviewer_notes,
    extraction_result:
      typeof data.extraction_result === "object" && data.extraction_result
        ? data.extraction_result
        : null,
    rule_check_result: Array.isArray(data.rule_check_result)
      ? data.rule_check_result
      : null,
  };
}

import type { PublicProgram } from "@/types/programs";

const DEMO_PROGRAMS: PublicProgram[] = [
  {
    id: "demo-program-catapult-meal-stipend",
    name: "Catapult Hacks 2026 Meal Stipend",
    slug: "catapult-meal-stipend-2026",
    description:
      "Submit one meal receipt during Catapult Hacks 2026. Max reimbursement is $25 for approved food purchases.",
    status: "active",
    rules: {
      max_amount_per_claim: 25,
      max_claims_per_person: 1,
      deadline: "2026-04-05T10:00:00.000Z",
      required_proof_types: ["receipt"],
      allowed_categories: ["food"],
      auto_approve_threshold: 0.85,
    },
  },
  {
    id: "demo-program-catapult-meal-stipend-alt",
    name: "Catapult Hacks 2026 Meal Stipend",
    slug: "catapult-hacks-meal-stipend-2026",
    description:
      "Submit one meal receipt during Catapult Hacks 2026. Max reimbursement is $25 for approved food purchases.",
    status: "active",
    rules: {
      max_amount_per_claim: 25,
      max_claims_per_person: 1,
      deadline: "2026-04-05T10:00:00.000Z",
      required_proof_types: ["receipt"],
      allowed_categories: ["food"],
      auto_approve_threshold: 0.85,
    },
  },
];

export function getDemoProgramBySlug(slug: string) {
  return DEMO_PROGRAMS.find((program) => program.slug === slug) ?? null;
}

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { IDKitResult } from "@worldcoin/idkit-core";
import { z } from "zod";
import { hasSupabaseConfig, hasWorldConfig, isWorldBypassEnabled } from "@/lib/env";
import { getDemoProgramBySlug } from "@/lib/demo-programs";
import { getPublicProgramBySlug } from "@/lib/programs";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyWorldProof } from "@/lib/world-id/verify";

const requestSchema = z.object({
  programSlug: z.string().min(1),
  proof: z.custom<IDKitResult>().optional(),
  bypass: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "programSlug is required.",
        },
        { status: 400 },
      );
    }

    const bypassEnabled = isWorldBypassEnabled();
    const useBypass = bypassEnabled && parsed.data.bypass === true;

    if (parsed.data.bypass === true && !bypassEnabled) {
      return NextResponse.json(
        {
          error: "bypass_disabled",
          message:
            "Local test bypass is disabled in production deployments. Use a real World ID verification instead.",
        },
        { status: 400 },
      );
    }

    if (!useBypass && !hasWorldConfig()) {
      return NextResponse.json(
        {
          error: "config_error",
          message:
            "World ID credentials are not configured. Add your environment variables before verifying proofs.",
        },
        { status: 500 },
      );
    }

    const program = await getPublicProgramBySlug(parsed.data.programSlug);

    if (!program) {
      return NextResponse.json(
        {
          error: "not_found",
          message: "Program not found.",
        },
        { status: 404 },
      );
    }

    let nullifierHash: string | null = null;
    let verificationLevel = "unknown";

    if (useBypass) {
      nullifierHash = `bypass-${randomUUID()}`;
      verificationLevel = "unknown";
    } else {
      if (!parsed.data.proof) {
        return NextResponse.json(
          {
            error: "invalid_request",
            message: "programSlug and proof are required.",
          },
          { status: 400 },
        );
      }

      const verification = await verifyWorldProof(parsed.data.proof);
      nullifierHash =
        verification.result.nullifier_hash ??
        verification.result.nullifier ??
        verification.result.results?.[0]?.nullifier ??
        null;

      if (!verification.ok || !nullifierHash) {
        return NextResponse.json(
          {
            error: "verification_failed",
            message:
              verification.result.detail ??
              verification.result.message ??
              "World ID proof verification failed.",
          },
          { status: verification.status || 400 },
        );
      }

      verificationLevel =
        verification.result.results?.[0]?.identifier ?? "unknown";
    }

    if (!hasSupabaseConfig()) {
      const demoProgram = getDemoProgramBySlug(parsed.data.programSlug);

      if (!demoProgram) {
        return NextResponse.json(
          {
            error: "config_error",
            message:
              "Supabase is not configured, so verified claim shells cannot be created yet.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        data: {
          claimId: `demo-claim-${randomUUID()}`,
          nullifierHash,
          verificationLevel,
          verified: true as const,
        },
      });
    }

    const supabase = createServiceRoleClient();

    const { data: existingClaim } = await supabase
      .from("claims")
      .select("id")
      .eq("program_id", program.id)
      .eq("nullifier_hash", nullifierHash)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json(
        {
          error: "already_claimed",
          message: "You have already submitted a claim for this program.",
        },
        { status: 409 },
      );
    }

    const { data: claim, error: insertError } = await supabase
      .from("claims")
      .insert({
        program_id: program.id,
        nullifier_hash: nullifierHash,
        world_id_verified: true,
        verification_level: verificationLevel,
        status: "pending",
      })
      .select("id, nullifier_hash, verification_level")
      .single();

    if (insertError || !claim) {
      return NextResponse.json(
        {
          error: "server_error",
          message: "Unable to create a verified claim shell.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        claimId: claim.id,
        nullifierHash: claim.nullifier_hash,
        verificationLevel: claim.verification_level,
        verified: true as const,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error ? error.message : "Unexpected verification error.",
      },
      { status: 500 },
    );
  }
}

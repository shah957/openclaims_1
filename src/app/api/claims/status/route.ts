import { NextResponse } from "next/server";
import type { IDKitResult } from "@worldcoin/idkit-core";
import { z } from "zod";
import { lookupClaimStatus } from "@/lib/dashboard";
import { getPublicProgramBySlug } from "@/lib/programs";
import { hasWorldConfig } from "@/lib/env";
import { verifyWorldProof } from "@/lib/world-id/verify";

const requestSchema = z.object({
  programSlug: z.string().min(1),
  proof: z.custom<IDKitResult>(),
});

export async function POST(request: Request) {
  try {
    if (!hasWorldConfig()) {
      return NextResponse.json(
        {
          error: "config_error",
          message:
            "World ID credentials are not configured. Add them before looking up claim status.",
        },
        { status: 500 },
      );
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "programSlug and proof are required.",
        },
        { status: 400 },
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

    const verification = await verifyWorldProof(parsed.data.proof);
    const nullifierHash =
      verification.result.nullifier_hash ??
      verification.result.nullifier ??
      verification.result.results?.[0]?.nullifier;

    if (!verification.ok || !nullifierHash) {
      return NextResponse.json(
        {
          error: "verification_failed",
          message:
            verification.result.detail ??
            verification.result.message ??
            "World ID verification failed.",
        },
        { status: verification.status || 400 },
      );
    }

    const claim = await lookupClaimStatus(program.id, nullifierHash);
    if (!claim) {
      return NextResponse.json(
        {
          error: "not_found",
          message: "No claim was found for this identity and program.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: claim,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error
            ? error.message
            : "Unexpected claim status lookup error.",
      },
      { status: 500 },
    );
  }
}

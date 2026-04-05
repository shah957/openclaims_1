import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/env";
import { getClaimsByProgramId, getOrganizerUser } from "@/lib/dashboard";
import { sendNotification } from "@/lib/notifications/send";
import { createServiceRoleClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  status: z.enum(["manually_approved", "manually_rejected"]),
  amountApproved: z.number().nullable().optional(),
  reviewerNotes: z.string().max(5000).optional().default(""),
});

type ClaimRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: ClaimRouteProps) {
  const { id } = await params;

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      {
        error: "config_error",
        message: "Detailed claim lookups require Supabase configuration.",
      },
      { status: 500 },
    );
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    return NextResponse.json(
      {
        error: "not_found",
        message: "Claim not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data,
  });
}

export async function PATCH(request: Request, { params }: ClaimRouteProps) {
  try {
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "A valid manual decision payload is required.",
        },
        { status: 400 },
      );
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json({
        data: {
          id,
          status: parsed.data.status,
          reviewerNotes: parsed.data.reviewerNotes,
        },
      });
    }

    const organizer = await getOrganizerUser();
    if (!organizer) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Sign in before reviewing claims.",
        },
        { status: 401 },
      );
    }

    const supabase = createServiceRoleClient();
    const { data: claim } = await supabase
      .from("claims")
      .select("id, program_id, claim_contact_email")
      .eq("id", id)
      .single();

    if (!claim) {
      return NextResponse.json(
        {
          error: "not_found",
          message: "Claim not found.",
        },
        { status: 404 },
      );
    }

    const organizerClaims = await getClaimsByProgramId(claim.program_id);
    const targetClaim = organizerClaims.find((item) => item.id === id);
    if (!targetClaim) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "You do not have access to review this claim.",
        },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("claims")
      .update({
        status: parsed.data.status,
        amount_approved:
          parsed.data.status === "manually_approved"
            ? parsed.data.amountApproved ?? targetClaim.amount_requested
            : null,
        reviewer_notes: parsed.data.reviewerNotes,
        reviewed_by: organizer.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, status, amount_approved, reviewer_notes, reviewed_at",
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: "server_error",
          message: error?.message ?? "Unable to update claim status.",
        },
        { status: 500 },
      );
    }

    await supabase.from("audit_log").insert({
      claim_id: id,
      action:
        parsed.data.status === "manually_approved"
          ? "manually_approved"
          : "manually_rejected",
      actor: organizer.id,
      details: {
        reviewer_notes: parsed.data.reviewerNotes,
      },
    });

    await sendNotification({
      type: "review_decision",
      claimId: id,
      email: claim.claim_contact_email ?? undefined,
      payload: {
        status: parsed.data.status,
        reviewerNotes: parsed.data.reviewerNotes,
      },
    });

    return NextResponse.json({
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error
            ? error.message
            : "Unexpected claim review error.",
      },
      { status: 500 },
    );
  }
}

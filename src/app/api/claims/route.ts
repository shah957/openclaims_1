import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/env";
import { sendNotification } from "@/lib/notifications/send";
import { createServiceRoleClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  claimId: z.string().min(1),
  claimantEmail: z.string().email().optional(),
  amountRequested: z.number().positive(),
  category: z.enum(["food", "transport", "lodging", "supplies", "other"]),
  description: z.string().max(5000).optional().default(""),
  documents: z
    .array(
      z.object({
        id: z.string().min(1),
        fileUrl: z.string().min(1),
        storagePath: z.string().min(1),
        originalFilename: z.string().min(1),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message:
            "claimId, amountRequested, category, and at least one document are required.",
        },
        { status: 400 },
      );
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        {
          error: "config_error",
          message:
            "Supabase is not configured yet. Claim submission requires database access.",
        },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient();
    const {
      claimId,
      claimantEmail,
      amountRequested,
      category,
      description,
      documents,
    } = parsed.data;

    const { data: claim } = await supabase
      .from("claims")
      .select("id, world_id_verified, status")
      .eq("id", claimId)
      .single();

    if (!claim || !claim.world_id_verified) {
      return NextResponse.json(
        {
          error: "verification_required",
          message:
            "World ID verification must complete before the claim can be submitted.",
        },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("claims")
      .update({
        claim_contact_email: claimantEmail ?? null,
        amount_requested: amountRequested,
        category,
        description,
        status: "processing",
      })
      .eq("id", claimId);

    if (updateError) {
      return NextResponse.json(
        {
          error: "server_error",
          message: "Unable to update the claim with form details.",
        },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    let processingQueued = false;

    if (baseUrl) {
      try {
        const queueResponse = await fetch(new URL("/api/documents/process", baseUrl), {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            claimId,
            documentId: documents[0].id,
          }),
        });

        processingQueued = queueResponse.ok;
      } catch {
        processingQueued = false;
      }
    }

    await sendNotification({
      type: "claim_received",
      claimId,
      email: claimantEmail,
      payload: {
        status: "processing",
        processingQueued,
      },
    });

    return NextResponse.json(
      {
        data: {
          claimId,
          status: "processing",
          processingQueued,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error
            ? error.message
            : "Unexpected claim submission error.",
      },
      { status: 500 },
    );
  }
}

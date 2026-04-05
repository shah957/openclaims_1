import { NextResponse } from "next/server";
import { z } from "zod";
import { sendNotification } from "@/lib/notifications/send";

const requestSchema = z.object({
  type: z.enum([
    "claim_received",
    "claim_auto_approved",
    "claim_rejected",
    "claim_flagged",
    "review_decision",
  ]),
  claimId: z.string().min(1),
  email: z.string().email().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "A valid notification payload is required.",
        },
        { status: 400 },
      );
    }

    const result = await sendNotification(parsed.data);

    return NextResponse.json({
      data: {
        queued: true,
        ...result,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error
            ? error.message
            : "Unexpected notification error.",
      },
      { status: 500 },
    );
  }
}

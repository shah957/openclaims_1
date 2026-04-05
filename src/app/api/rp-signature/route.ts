import { NextResponse } from "next/server";
import { z } from "zod";
import { hasWorldConfig } from "@/lib/env";
import { createRpContext } from "@/lib/world-id/sign-request";

const requestSchema = z.object({
  action: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!hasWorldConfig()) {
      return NextResponse.json(
        {
          error: "config_error",
          message:
            "World ID credentials are not configured. Add WORLD_RP_ID, WORLD_RP_SIGNING_KEY, and NEXT_PUBLIC_WORLD_APP_ID.",
        },
        { status: 500 },
      );
    }

    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "A valid World ID action is required.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: createRpContext(parsed.data.action),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to create RP signature.",
      },
      { status: 500 },
    );
  }
}

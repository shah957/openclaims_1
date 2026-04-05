import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/env";
import { createServerClientForRequest, createServiceRoleClient } from "@/lib/supabase/server";

const programSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  budgetTotal: z.number().nonnegative(),
  rules: z.record(z.string(), z.unknown()),
});

async function requireOrganizer() {
  const supabase = await createServerClientForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function GET() {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ data: [] });
    }

    const user = await requireOrganizer();

    if (!user) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Sign in to view your programs.",
        },
        { status: 401 },
      );
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("programs")
      .select("id, name, slug, description, status, budget_total, budget_committed, created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          error: "server_error",
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error ? error.message : "Unexpected programs error.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        {
          error: "config_error",
          message:
            "Supabase is not configured yet. Program creation requires auth and database access.",
        },
        { status: 500 },
      );
    }

    const user = await requireOrganizer();

    if (!user) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Sign in before creating a program.",
        },
        { status: 401 },
      );
    }

    const parsed = programSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "Program name, slug, description, rules, and budget are required.",
        },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    await supabase.from("organizers").upsert({
      id: user.id,
      email: user.email ?? "",
    });

    const { data, error } = await supabase
      .from("programs")
      .insert({
        name: parsed.data.name,
        slug: parsed.data.slug,
        world_id_action: `openclaims-${parsed.data.slug}`,
        description: parsed.data.description,
        rules: parsed.data.rules,
        budget_total: parsed.data.budgetTotal,
        budget_committed: 0,
        status: "active",
        created_by: user.id,
      })
      .select("id, slug, name")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: "server_error",
          message: error?.message ?? "Program creation failed.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        data,
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
            : "Unexpected program creation error.",
      },
      { status: 500 },
    );
  }
}

import { getDemoProgramBySlug } from "@/lib/demo-programs";
import { hasSupabaseConfig } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PublicProgram } from "@/types/programs";

export async function getPublicProgramBySlug(
  slug: string,
): Promise<PublicProgram | null> {
  if (!hasSupabaseConfig()) {
    return getDemoProgramBySlug(slug);
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, name, slug, description, status, rules")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    status: data.status,
    rules: typeof data.rules === "object" && data.rules ? data.rules : {},
  } as PublicProgram;
}

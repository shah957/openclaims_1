import { createHash } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";

export function computeDocumentHash(fileBuffer: Buffer) {
  return createHash("sha256").update(fileBuffer).digest("hex");
}

export async function checkDuplicateDocument(
  programId: string,
  duplicateHash: string,
  currentClaimId: string,
) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("documents")
    .select("id, claim_id, claims!inner(program_id)")
    .eq("duplicate_hash", duplicateHash)
    .eq("claims.program_id", programId)
    .neq("claim_id", currentClaimId);

  return {
    isDuplicate: Boolean(data?.length),
    matchingDocuments: data ?? [],
  };
}

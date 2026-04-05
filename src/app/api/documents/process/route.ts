import { NextResponse } from "next/server";
import { z } from "zod";
import { checkDuplicateDocument, computeDocumentHash } from "@/lib/processing/duplicate-check";
import { extractReceiptData } from "@/lib/processing/extract-receipt";
import { sendNotification } from "@/lib/notifications/send";
import { runRulesEngine } from "@/lib/processing/rules-engine";
import { hasSupabaseConfig } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  claimId: z.string().min(1),
  documentId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        {
          error: "config_error",
          message:
            "Supabase is not configured. Document processing requires database and storage access.",
        },
        { status: 500 },
      );
    }

    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "claimId and documentId are required.",
        },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();
    const { claimId, documentId } = parsed.data;

    const { data: claim } = await supabase
      .from("claims")
      .select("id, program_id, claim_contact_email, amount_requested, category, submitted_at")
      .eq("id", claimId)
      .single();

    const { data: program } = await supabase
      .from("programs")
      .select("id, budget_total, budget_committed, rules")
      .eq("id", claim?.program_id ?? "")
      .single();

    const { data: document } = await supabase
      .from("documents")
      .select("id, storage_path")
      .eq("id", documentId)
      .single();

    if (!claim || !program || !document) {
      return NextResponse.json(
        {
          error: "not_found",
          message: "Claim, program, or document could not be found.",
        },
        { status: 404 },
      );
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("claim-documents")
      .createSignedUrl(document.storage_path, 60 * 15);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        {
          error: "storage_error",
          message: "Unable to create a signed URL for the uploaded document.",
        },
        { status: 500 },
      );
    }

    const fileResponse = await fetch(signedUrlData.signedUrl);
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    const duplicateHash = computeDocumentHash(fileBuffer);
    const extraction = await extractReceiptData(signedUrlData.signedUrl);
    const duplicateCheck = await checkDuplicateDocument(
      claim.program_id,
      duplicateHash,
      claim.id,
    );

    const rules = runRulesEngine({
      claim: {
        program_id: claim.program_id,
        amount_requested: Number(claim.amount_requested ?? 0),
        category: claim.category ?? "other",
        submitted_at: claim.submitted_at,
      },
      program: {
        budget_total: Number(program.budget_total ?? 0),
        budget_committed: Number(program.budget_committed ?? 0),
        rules:
          typeof program.rules === "object" && program.rules ? program.rules : {},
      },
      extraction,
      duplicateDocument: duplicateCheck.isDuplicate,
      hasDocument: true,
    });

    const nextStatus =
      rules.decision === "auto_approve"
        ? "auto_approved"
        : rules.decision === "auto_reject"
          ? "auto_rejected"
          : "flagged";

    await supabase
      .from("documents")
      .update({
        duplicate_hash: duplicateHash,
        extraction_data: extraction,
        processed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    await supabase
      .from("claims")
      .update({
        extraction_result: extraction,
        rule_check_result: rules.results,
        confidence_score: rules.confidence,
        status: nextStatus,
        amount_approved:
          nextStatus === "auto_approved" ? claim.amount_requested : null,
      })
      .eq("id", claimId);

    if (nextStatus === "auto_approved") {
      await supabase
        .from("programs")
        .update({
          budget_committed:
            Number(program.budget_committed ?? 0) +
            Number(claim.amount_requested ?? 0),
        })
        .eq("id", claim.program_id);
    }

    await supabase.from("audit_log").insert({
      claim_id: claimId,
      action:
        nextStatus === "auto_approved"
          ? "auto_approved"
          : nextStatus === "auto_rejected"
            ? "auto_rejected"
            : "flagged",
      actor: "system",
      details: {
        confidence: rules.confidence,
        rule_count: rules.results.length,
      },
    });

    await sendNotification({
      type:
        nextStatus === "auto_approved"
          ? "claim_auto_approved"
          : nextStatus === "auto_rejected"
            ? "claim_rejected"
            : "claim_flagged",
      claimId,
      email: claim.claim_contact_email ?? undefined,
      payload: {
        decision: rules.decision,
        status: nextStatus,
        confidence: rules.confidence,
      },
    });

    return NextResponse.json({
      data: {
        claimId,
        documentId,
        decision: rules.decision,
        status: nextStatus,
        confidence: rules.confidence,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error
            ? error.message
            : "Unexpected document processing error.",
      },
      { status: 500 },
    );
  }
}

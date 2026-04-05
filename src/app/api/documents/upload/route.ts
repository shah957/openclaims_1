import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";

const acceptedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const metadataSchema = z.object({
  claimId: z.string().min(1),
  programId: z.string().min(1),
});

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        {
          error: "config_error",
          message:
            "Supabase is not configured. Document uploads need storage credentials.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const metadata = metadataSchema.safeParse({
      claimId: formData.get("claimId"),
      programId: formData.get("programId"),
    });
    const file = formData.get("file");

    if (!metadata.success || !(file instanceof File)) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "claimId, programId, and a file are required.",
        },
        { status: 400 },
      );
    }

    if (!acceptedMimeTypes.has(file.type)) {
      return NextResponse.json(
        {
          error: "invalid_file_type",
          message: "Only JPG, PNG, and PDF files are accepted.",
        },
        { status: 415 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "file_too_large",
          message: "The maximum file size is 10 MB.",
        },
        { status: 413 },
      );
    }

    const supabase = createServiceRoleClient();
    const { claimId, programId } = metadata.data;

    const { data: claim } = await supabase
      .from("claims")
      .select("id, program_id")
      .eq("id", claimId)
      .single();

    if (!claim || claim.program_id !== programId) {
      return NextResponse.json(
        {
          error: "not_found",
          message: "Claim shell not found for this program.",
        },
        { status: 404 },
      );
    }

    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(file.name);
    const storagePath = `programs/${programId}/claims/${claimId}/${timestamp}-${sanitizedFilename}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("claim-documents")
      .upload(storagePath, fileBuffer, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: "upload_failed",
          message: uploadError.message,
        },
        { status: 500 },
      );
    }

    const { data: signedUrlData } = await supabase.storage
      .from("claim-documents")
      .createSignedUrl(storagePath, 60 * 60);
    const {
      data: { publicUrl },
    } = supabase.storage.from("claim-documents").getPublicUrl(storagePath);

    const previewUrl = signedUrlData?.signedUrl ?? publicUrl;

    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        claim_id: claimId,
        file_url: publicUrl,
        storage_path: storagePath,
        file_type: "receipt",
        original_filename: file.name,
      })
      .select("id, storage_path, original_filename")
      .single();

    if (insertError || !document) {
      return NextResponse.json(
        {
          error: "server_error",
          message: "The document uploaded, but its database record could not be created.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        data: {
          id: document.id,
          fileUrl: previewUrl,
          storagePath: document.storage_path,
          originalFilename: document.original_filename,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          error instanceof Error ? error.message : "Unexpected upload error.",
      },
      { status: 500 },
    );
  }
}

"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/components/shared/toast-provider";
import type { UploadedDocument } from "@/types/claims";

type DocumentUploadProps = {
  claimId: string;
  programId: string;
  disabled?: boolean;
  onUploaded: (document: UploadedDocument) => void;
};

export function DocumentUpload({
  claimId,
  programId,
  disabled,
  onUploaded,
}: DocumentUploadProps) {
  const { pushToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    disabled: disabled || isUploading,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropAccepted: async (files) => {
      const file = files[0];
      if (!file) {
        return;
      }

      setError(null);
      setIsUploading(true);

      const formData = new FormData();
      formData.append("claimId", claimId);
      formData.append("programId", programId);
      formData.append("file", file);

      try {
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message ?? "Upload failed.");
        }

        onUploaded(payload.data as UploadedDocument);
        pushToast({
          title: "Document uploaded",
          description: file.name,
          tone: "success",
        });
      } catch (uploadError) {
        const nextError =
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed.";
        setError(nextError);
        pushToast({
          title: "Upload failed",
          description: nextError,
          tone: "error",
        });
      } finally {
        setIsUploading(false);
      }
    },
    onDropRejected: (rejections) => {
      const firstError = rejections[0]?.errors[0];
      const nextError = firstError?.message ?? "That file could not be uploaded.";
      setError(nextError);
      pushToast({
        title: "File rejected",
        description: nextError,
        tone: "error",
      });
    },
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`rounded-[1.75rem] border border-dashed px-5 py-8 text-center transition ${
          isDragActive
            ? "border-[--color-accent] bg-[--color-accent]/5"
            : "border-slate-300 bg-slate-50"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-semibold text-[--color-primary]">
          {isUploading
            ? "Uploading your document..."
            : "Drop a receipt here or tap to browse"}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          JPG, PNG, or PDF up to 10 MB.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-[--color-error]">{error}</p>
      ) : null}
    </div>
  );
}

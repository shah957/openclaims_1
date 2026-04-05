"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-white p-10 text-center shadow-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-error]">
            Something went wrong
          </p>
          <h1 className="mt-4 text-4xl font-bold text-[--color-primary]">
            OpenClaims Ops hit an unexpected error.
          </h1>
          <p className="mt-4 text-slate-600">
            Try again once, and if it still fails, check your environment
            variables or backend service configuration.
          </p>
          <button
            className="mt-8 rounded-full bg-[--color-primary] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => reset()}
            type="button"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

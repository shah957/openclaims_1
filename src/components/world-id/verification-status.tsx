type VerificationStatusProps = {
  state: "idle" | "loading" | "verifying" | "success" | "duplicate" | "error";
  message: string;
};

const toneByState: Record<VerificationStatusProps["state"], string> = {
  idle: "border-slate-200 bg-slate-50 text-slate-700",
  loading: "border-blue-200 bg-blue-50 text-blue-700",
  verifying: "border-indigo-200 bg-indigo-50 text-indigo-700",
  success: "border-green-200 bg-green-50 text-green-700",
  duplicate: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

export function VerificationStatus({
  state,
  message,
}: VerificationStatusProps) {
  return (
    <div
      aria-live="polite"
      className={`rounded-3xl border px-4 py-3 text-sm ${toneByState[state]}`}
    >
      {message}
    </div>
  );
}

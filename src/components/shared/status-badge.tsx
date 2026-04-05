type StatusBadgeProps = {
  status:
    | "pending"
    | "processing"
    | "auto_approved"
    | "auto_rejected"
    | "manually_approved"
    | "manually_rejected"
    | "flagged"
    | "active"
    | "paused"
    | "closed";
};

const toneByStatus: Record<StatusBadgeProps["status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-700",
  auto_approved: "bg-green-100 text-green-700",
  auto_rejected: "bg-red-100 text-red-700",
  manually_approved: "bg-green-100 text-green-700",
  manually_rejected: "bg-red-100 text-red-700",
  flagged: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  closed: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${toneByStatus[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

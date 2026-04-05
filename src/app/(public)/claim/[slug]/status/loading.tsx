import { LoadingPanel } from "@/components/shared/loading-panel";

export default function ClaimStatusLoading() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <LoadingPanel title="Claim status" lines={3} />
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-80 animate-pulse rounded-[1.5rem] bg-slate-100" />
        </div>
      </div>
    </main>
  );
}

import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

const steps = [
  {
    step: "Step 1",
    title: "Verify with World ID",
    description:
      "Claimants prove they are human before they ever touch the form, closing the duplicate-human loophole at the front door.",
  },
  {
    step: "Step 2",
    title: "Upload proof",
    description:
      "Receipts and invoices go straight into structured storage, ready for extraction and policy evaluation.",
  },
  {
    step: "Step 3",
    title: "Route automatically",
    description:
      "Clean claims auto-approve. Borderline ones are flagged with extracted context, not mystery spreadsheet cells.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Navbar />

        <section className="grid gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 px-4 py-2 text-sm font-medium text-[var(--color-accent)]">
              Powered by World ID proof of personhood
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-[var(--color-primary)] md:text-6xl">
              Automate claims, stipends, and reimbursements for open pools.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              OpenClaims Ops replaces forms, spreadsheets, and manual receipt review
              with one secure flow: verify, upload, validate, route, and export.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-center font-medium text-white"
                href="/auth"
              >
                Create a Program
              </a>
              <a
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center font-medium text-slate-700"
                href="#how-it-works"
              >
                See How It Works
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow">
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Live demo program</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-primary)]">
                  Catapult Meal Stipend
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Max $25 · Food only · Auto-approve threshold 0.85
                </p>
              </div>
              <div
                id="world-id"
                className="rounded-3xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-5"
              >
                <p className="text-sm font-semibold text-[var(--color-accent)]">
                  Why World ID matters
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
                  One human, one claim, no spreadsheet detective work.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[var(--color-success)]">38</p>
                  <p className="text-sm text-slate-500">Auto-approved</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[var(--color-warning)]">6</p>
                  <p className="text-sm text-slate-500">Flagged</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[var(--color-primary)]">$712</p>
                  <p className="text-sm text-slate-500">Committed</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="grid gap-6 pb-20 md:grid-cols-3">
          {steps.map((item) => (
            <article
              key={item.step}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-md"
            >
              <p className="text-sm font-semibold text-[var(--color-accent)]">{item.step}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-primary)]">
                {item.title}
              </h2>
              <p className="mt-3 text-slate-600">{item.description}</p>
            </article>
          ))}
        </section>
      </div>
      <Footer />
    </main>
  );
}

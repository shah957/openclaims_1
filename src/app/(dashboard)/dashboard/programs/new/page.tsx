import { ProgramWizard } from "@/components/programs/program-wizard";

export default function NewProgramPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
          Program Wizard
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[--color-primary]">
          Publish a new claim program.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          This first pass covers the core setup: program identity, claim rules,
          budget, and the shareable claim link.
        </p>
      </section>

      <ProgramWizard baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"} />
    </main>
  );
}

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[--color-primary]">{title}</h1>
        <p className="mt-4 max-w-2xl text-slate-600">{description}</p>
      </div>
    </main>
  );
}

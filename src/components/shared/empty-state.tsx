import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: EmptyStateProps) {
  return (
    <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-[var(--color-primary)]">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
        {description}
      </p>
      {ctaHref && ctaLabel ? (
        <div className="mt-6">
          <Link
            className="inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white"
            href={ctaHref}
          >
            {ctaLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

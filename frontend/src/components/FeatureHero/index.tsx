import React from "react";

interface FeatureHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Big number on the right — balance, count, savings. */
  metric?: { value: React.ReactNode; label: string; sub?: string };
  actions?: React.ReactNode;
  /** Extra content under the description (progress bars, codes, countdowns). */
  children?: React.ReactNode;
}

/**
 * Ink hero shared by the account/marketing pages (loyalty, referral, gift
 * cards, flash sales). One consistent opening beat instead of each page
 * starting with a different grey Paper.
 */
function FeatureHero({
  eyebrow,
  title,
  description,
  metric,
  actions,
  children,
}: FeatureHeroProps) {
  return (
    <section className="grain overflow-hidden rounded-xl2 bg-contrast px-6 py-8 text-oncontrast sm:px-10 sm:py-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow !text-accent">{eyebrow}</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">{description}</p>
          )}
          {children && <div className="mt-6">{children}</div>}
          {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
        </div>

        {metric && (
          <div className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-7 py-6 text-center md:min-w-[13rem]">
            <p className="font-heading text-4xl font-extrabold tracking-tight text-accent sm:text-5xl">
              {metric.value}
            </p>
            <p className="mt-1 text-eyebrow font-bold uppercase text-oncontrast">{metric.label}</p>
            {metric.sub && <p className="mt-2 text-xs text-ink-muted">{metric.sub}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeatureHero;

/** Numbered "how it works" strip used under several FeatureHeroes. */
export function HowItWorks({ steps }: { steps: { title: string; copy: string }[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="panel p-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
            {i + 1}
          </span>
          <p className="mt-3 font-heading text-sm font-bold text-ink">{s.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.copy}</p>
        </li>
      ))}
    </ol>
  );
}

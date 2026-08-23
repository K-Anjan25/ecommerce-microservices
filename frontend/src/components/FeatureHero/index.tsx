import React from "react";

interface FeatureHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  metric?: { value: React.ReactNode; label: string; sub?: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/** Editorial opening shared by loyalty, referral, gift cards and flash sales. */
function FeatureHero({ eyebrow, title, description, metric, actions, children }: FeatureHeroProps) {
  return (
    <section className="border-y border-line py-9 sm:py-12">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <p className="eyebrow !text-brand">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-normal leading-[0.98] tracking-[-0.03em] text-ink sm:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">{description}</p>
          )}
          {children && <div className="mt-6 max-w-xl">{children}</div>}
          {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
        </div>

        {metric && (
          <div className="shrink-0 border-l border-line pl-6 md:min-w-[13rem] md:pl-9">
            <p className="font-display text-5xl tracking-[-0.03em] text-brand sm:text-6xl">
              {metric.value}
            </p>
            <p className="mt-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-ink">
              {metric.label}
            </p>
            {metric.sub && <p className="mt-2 max-w-[12rem] text-xs text-ink-muted">{metric.sub}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeatureHero;

export function HowItWorks({ steps }: { steps: { title: string; copy: string }[] }) {
  return (
    <ol className="grid border-y border-line sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="border-b border-line py-6 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
          <span className="font-display text-3xl text-brand">0{index + 1}</span>
          <p className="mt-3 text-sm font-semibold text-ink">{step.title}</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-soft">{step.copy}</p>
        </li>
      ))}
    </ol>
  );
}

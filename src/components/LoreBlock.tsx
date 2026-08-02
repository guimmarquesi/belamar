import type { ReactNode } from "react";

export function LoreBlock({
  title = "Conhecimento comum",
  hint = "o que se sabe nas ruas de Belamar",
  children,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
          {title}
        </p>
        <span className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/45">
          {hint}
        </span>
      </div>
      <div className="space-y-3 font-[family-name:var(--font-body)] text-[14px] leading-relaxed text-[var(--color-ink)]/85">
        {children}
      </div>
    </div>
  );
}

export function LoreList({ items }: { items: { name: string; description: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.name}>
          <div className="font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] text-[var(--color-ink)]">
            {it.name}
          </div>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--color-ink)]/75">
            {it.description}
          </p>
        </li>
      ))}
    </ul>
  );
}

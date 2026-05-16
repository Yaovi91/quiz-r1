import { motion } from "framer-motion";

export default function ChapterBars({ state }) {
  const entries = Object.entries(state.byChapter || {})
    .map(([ch, c]) => ({ ch, seen: c.seen, correct: c.correct, rate: c.seen > 0 ? c.correct / c.seen : 0 }))
    .filter(e => e.seen >= 3)
    .sort((a, b) => a.rate - b.rate);

  if (entries.length === 0) {
    return (
      <div className="surface-raised p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)] mb-2">
          Par chapitre
        </div>
        <div className="text-[13px] text-[var(--color-fg-tertiary)] font-mono">
          Encore un peu d'entraînement avant le détail par chapitre.
        </div>
      </div>
    );
  }

  return (
    <div className="surface-raised p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)]">
          Par chapitre — faibles en haut
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {entries.map((e, i) => {
          const color = e.rate >= 0.85 ? "var(--color-success)"
                      : e.rate >= 0.7  ? "var(--color-warn)"
                      : "var(--color-accent)";
          return (
            <div key={e.ch} className="flex items-center gap-3">
              <span className="w-12 font-mono tabular text-[11px] text-[var(--color-fg-secondary)] shrink-0">§ {e.ch}</span>
              <div className="flex-1 h-[6px] rounded-full bg-[var(--color-bg-sunken)] overflow-hidden border border-[var(--color-border-subtle)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${e.rate * 100}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 28, delay: i * 0.04 }}
                  className="h-full"
                  style={{ background: color }}
                />
              </div>
              <span className="w-16 text-right font-mono tabular text-[11px] text-[var(--color-fg-tertiary)] shrink-0">
                {(e.rate * 100).toFixed(0)}% · {e.seen}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

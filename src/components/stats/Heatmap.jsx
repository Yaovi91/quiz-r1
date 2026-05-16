import { motion } from "framer-motion";

function getMonthDays() {
  const now = new Date();
  const days = [];
  // 12 dernières semaines.
  for (let i = 84; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function levelFor(count) {
  if (!count) return 0;
  if (count < 3) return 1;
  if (count < 7) return 2;
  if (count < 15) return 3;
  return 4;
}

const COLORS = [
  "rgba(255,255,255,0.04)",
  "rgba(230,57,70,0.18)",
  "rgba(230,57,70,0.32)",
  "rgba(230,57,70,0.55)",
  "rgba(230,57,70,0.85)",
];

export default function Heatmap({ state }) {
  const days = getMonthDays();
  const cells = days.map(d => ({ d, n: state.heatmap?.[d] || 0 }));

  // Regroupe par semaine (7 colonnes).
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const total = cells.reduce((a, c) => a + c.n, 0);
  const active = cells.filter(c => c.n > 0).length;

  return (
    <div className="surface-raised p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)]">
          Activité — 12 dernières semaines
        </div>
        <div className="font-mono tabular text-[11px] text-[var(--color-fg-secondary)]">
          {active}j actifs · {total} q.
        </div>
      </div>

      <div className="flex gap-[3px]">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {w.map((c, j) => (
              <motion.div
                key={c.d}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.005 * (i * 7 + j) }}
                className="w-[10px] h-[10px] rounded-[2px] border border-[rgba(255,255,255,0.03)]"
                style={{ background: COLORS[levelFor(c.n)] }}
                title={`${c.d} — ${c.n} q.`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-[var(--color-fg-tertiary)]">
        <span>peu</span>
        {COLORS.map((c, i) => (
          <span key={i} className="w-[9px] h-[9px] rounded-[2px]" style={{ background: c }} />
        ))}
        <span>beaucoup</span>
      </div>
    </div>
  );
}

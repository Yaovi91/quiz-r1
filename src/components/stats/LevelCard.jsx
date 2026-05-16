import { motion } from "framer-motion";
import { LEVEL_NAMES, progressToNextLevel } from "../../lib/xp.js";
import AnimatedNumber from "../ui/AnimatedNumber.jsx";

export default function LevelCard({ state }) {
  const level = state.level || 1;
  const { pct, label } = progressToNextLevel({
    answered: state.answered,
    correct: state.correct,
    level,
  });

  return (
    <div className="surface-raised p-5">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)]">
          Niveau actuel
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)]">
          N{level}
        </span>
      </div>
      <div className="font-display italic text-[32px] leading-none tracking-tight text-[var(--color-fg-primary)] mb-4">
        {LEVEL_NAMES[level]}
      </div>

      {/* Bar */}
      <div className="h-[6px] w-full rounded-full bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 26, delay: 0.2 }}
          className="h-full"
          style={{ background: "linear-gradient(90deg, rgba(230,57,70,0.7), var(--color-accent))" }}
        />
      </div>
      <div className="mt-2 font-mono text-[11px] text-[var(--color-fg-secondary)] tabular">
        {label}
      </div>

      {/* XP total + today */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="surface-sunken px-3 py-2.5">
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)]">
            XP total
          </div>
          <div className="font-mono tabular text-[20px] text-[var(--color-fg-primary)]">
            <AnimatedNumber value={state.xp || 0} />
          </div>
        </div>
        <div className="surface-sunken px-3 py-2.5">
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)]">
            XP aujourd'hui
          </div>
          <div className="font-mono tabular text-[20px] text-[var(--color-accent)]">
            +<AnimatedNumber value={state.xpByDay?.[new Date().toISOString().slice(0,10)] || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

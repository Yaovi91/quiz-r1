import { motion } from "framer-motion";
import { Check, Target } from "lucide-react";

export default function DailyQuestsCard({ state }) {
  const quests = state.dailyQuests || [];
  if (quests.length === 0) {
    return (
      <div className="surface-raised p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)] mb-2">
          Quêtes du jour
        </div>
        <div className="text-[13px] text-[var(--color-fg-tertiary)] font-mono">
          Reviens demain à 4h pour tes nouvelles quêtes.
        </div>
      </div>
    );
  }

  return (
    <div className="surface-raised p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)]">
          Quêtes du jour
        </div>
        <div className="font-mono tabular text-[11px] text-[var(--color-fg-secondary)]">
          {quests.filter(q => q.done).length} / {quests.length}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {quests.map((q, i) => {
          const pct = Math.min(1, q.progress / q.goal);
          return (
            <div key={q.id} className="surface-sunken px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {q.done ? (
                    <div className="w-5 h-5 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                      <Check size={12} strokeWidth={2.5} className="text-[#0A0B0F]" />
                    </div>
                  ) : (
                    <Target size={14} strokeWidth={1.7} className="text-[var(--color-fg-secondary)]" />
                  )}
                  <span className={`text-[13px] ${q.done ? "text-[var(--color-fg-tertiary)] line-through" : "text-[var(--color-fg-primary)]"}`}>
                    {q.label}
                  </span>
                </div>
                <span className="font-mono tabular text-[11px] text-[var(--color-fg-tertiary)]">
                  {q.progress}/{q.goal}
                </span>
              </div>
              <div className="h-[3px] rounded-full bg-[var(--color-bg-base)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 28, delay: i * 0.05 }}
                  className="h-full"
                  style={{ background: q.done ? "var(--color-success)" : "var(--color-accent)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { BADGES } from "../../lib/badges.js";
import { Lock } from "lucide-react";

export default function BadgesGallery({ state }) {
  const got = state.badges || {};
  const unlocked = BADGES.filter(b => got[b.id]);
  const locked = BADGES.filter(b => !got[b.id]);

  return (
    <div className="surface-raised p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)]">
          Badges
        </div>
        <div className="font-mono tabular text-[11px] text-[var(--color-fg-secondary)]">
          {unlocked.length} / {BADGES.length}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[...unlocked, ...locked].map((b, i) => {
          const isUnlocked = !!got[b.id];
          const Icon = b.icon;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.01 * i, type: "spring", stiffness: 240, damping: 22 }}
              className={[
                "aspect-square rounded-[12px] border p-2 flex flex-col items-center justify-center gap-1 text-center",
                isUnlocked
                  ? "bg-[var(--color-accent-soft)] border-[rgba(230,57,70,0.3)]"
                  : "bg-[var(--color-bg-sunken)] border-[var(--color-border-subtle)]",
              ].join(" ")}
              title={`${b.name} — ${b.desc}${isUnlocked ? ` · ${got[b.id]}` : ""}`}
            >
              {isUnlocked ? (
                <Icon size={20} strokeWidth={1.7} className="text-[var(--color-accent)]" />
              ) : (
                <Lock size={14} strokeWidth={1.6} className="text-[var(--color-fg-muted)]" />
              )}
              <span className={[
                "text-[9px] font-mono uppercase tracking-wider leading-tight",
                isUnlocked ? "text-[var(--color-fg-primary)]" : "text-[var(--color-fg-muted)]",
              ].join(" ")}>
                {b.name.slice(0, 14)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import AnimatedNumber from "../ui/AnimatedNumber.jsx";

export default function FooterBar({ state, onOpenModes, modeLabel }) {
  const right = state.streakRight || 0;
  const onFire = right >= 10;
  const glowing = right >= 5;

  return (
    <footer className="px-5 py-3 flex items-center justify-between text-[11px] font-mono tabular text-[var(--color-fg-tertiary)] hairline">
      <button
        onClick={onOpenModes}
        className="uppercase tracking-[0.15em] flex items-center gap-1.5 active:opacity-70"
      >
        <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
        {modeLabel}
      </button>

      <div className="flex items-center gap-4">
        {/* Compteur total */}
        <span className="uppercase tracking-[0.15em]">
          <AnimatedNumber value={state.answered || 0} /> q.
        </span>

        {/* Streak bonnes réponses */}
        <motion.div
          animate={glowing ? { filter: ["drop-shadow(0 0 0 transparent)", "drop-shadow(0 0 8px rgba(230,57,70,0.7))", "drop-shadow(0 0 0 transparent)"] } : {}}
          transition={{ duration: 1.6, repeat: glowing ? Infinity : 0 }}
          className="flex items-center gap-1.5"
        >
          {onFire ? (
            <Flame size={13} strokeWidth={1.8} className="text-[var(--color-accent)]" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-fg-muted)]" style={glowing ? { background: "var(--color-accent)" } : {}} />
          )}
          <span style={glowing ? { color: "var(--color-accent)" } : {}}>
            <AnimatedNumber value={right} /> /série
          </span>
        </motion.div>
      </div>
    </footer>
  );
}

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import SprinklerBulb from "../icons/SprinklerBulb.jsx";
import AnimatedNumber from "../ui/AnimatedNumber.jsx";
import IconButton from "../ui/IconButton.jsx";
import { LEVEL_NAMES } from "../../lib/xp.js";

export default function HeaderBar({ state, xpToday, onOpenStats }) {
  // Heat ratio basé sur le streak jour (saturation à 30j).
  const heat = Math.min(1, (state.streakDays || 0) / 30);
  const pulse = (state.streakDays || 0) >= 3;

  return (
    <header className="flex items-center justify-between px-5 pt-3 pb-4">
      <div className="flex items-center gap-3">
        {/* Bulbe streak */}
        <div className="flex items-center gap-2">
          <SprinklerBulb heat={heat} size={26} pulse={pulse} />
          <div className="flex flex-col leading-none">
            <span className="font-mono tabular text-[15px] text-[var(--color-fg-primary)]">
              <AnimatedNumber value={state.streakDays || 0} />
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)] mt-0.5">
              jours
            </span>
          </div>
        </div>

        {/* Séparateur fin */}
        <div className="w-px h-7 bg-[var(--color-border-subtle)]" />

        {/* Niveau */}
        <div className="flex flex-col leading-none">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)]">
            Niveau {state.level || 1}
          </span>
          <span className="font-display text-[17px] italic text-[var(--color-fg-primary)] mt-0.5">
            {LEVEL_NAMES[state.level || 1]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* XP today */}
        <motion.div
          initial={false}
          animate={{ scale: 1 }}
          className="flex flex-col items-end leading-none"
        >
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)]">
            XP / jour
          </span>
          <span className="font-mono tabular text-[14px] text-[var(--color-accent)] mt-0.5">
            +<AnimatedNumber value={xpToday} />
          </span>
        </motion.div>

        <IconButton onClick={onOpenStats} label="Statistiques">
          <BarChart3 size={18} strokeWidth={1.6} className="text-[var(--color-fg-secondary)]" />
        </IconButton>
      </div>
    </header>
  );
}

import { Flame, Snowflake } from "lucide-react";
import SprinklerBulb from "../icons/SprinklerBulb.jsx";

export default function StreaksCard({ state }) {
  const heat = Math.min(1, (state.streakDays || 0) / 30);
  return (
    <div className="surface-raised p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)] mb-3">
        Séries
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Streak jour */}
        <div className="surface-sunken p-3">
          <div className="flex items-center gap-2 mb-2">
            <SprinklerBulb heat={heat} size={20} pulse={state.streakDays >= 3} />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)]">
              Jours d'affilée
            </span>
          </div>
          <div className="font-display italic text-[28px] leading-none">
            {state.streakDays || 0}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--color-fg-tertiary)] tabular">
            Record {state.streakDaysBest || 0}
          </div>
        </div>

        {/* Bonnes réponses */}
        <div className="surface-sunken p-3">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} strokeWidth={1.7} className="text-[var(--color-accent)]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)]">
              Bonnes /série
            </span>
          </div>
          <div className="font-display italic text-[28px] leading-none">
            {state.streakRight || 0}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--color-fg-tertiary)] tabular">
            Record {state.streakRightBest || 0}
          </div>
        </div>
      </div>

      {/* Freezes */}
      <div className="mt-3 flex items-center justify-between surface-sunken px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Snowflake size={14} strokeWidth={1.7} className="text-[var(--color-fg-secondary)]" />
          <span className="font-mono text-[11px] text-[var(--color-fg-secondary)] tracking-wide">
            Jokers ce mois-ci
          </span>
        </div>
        <span className="font-mono tabular text-[14px] text-[var(--color-fg-primary)]">
          {state.freezesLeft ?? 2} / 2
        </span>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Settings as SettingsIcon } from "lucide-react";
import LevelCard from "./LevelCard.jsx";
import StreaksCard from "./StreaksCard.jsx";
import Curve from "./Curve.jsx";
import Heatmap from "./Heatmap.jsx";
import DailyQuestsCard from "./DailyQuestsCard.jsx";
import ChapterBars from "./ChapterBars.jsx";
import BadgesGallery from "./BadgesGallery.jsx";

export default function StatsScreen({ open, state, onClose, onOpenLibrary }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.section
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-0 z-40 bg-[var(--color-bg-base)] overflow-y-auto"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        >
          {/* Top bar */}
          <header className="sticky top-0 z-10 flex items-center justify-between px-3 py-3 bg-[var(--color-bg-base)]/85 backdrop-blur-md hairline">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2 py-1 -ml-1 text-[var(--color-fg-secondary)] active:opacity-70"
              aria-label="Retour"
            >
              <ChevronLeft size={20} strokeWidth={1.7} />
              <span className="font-mono text-[12px] uppercase tracking-[0.15em]">Retour</span>
            </button>
            <h1 className="font-display italic text-[18px] tracking-tight">Statistiques</h1>
            <button
              onClick={onOpenLibrary}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-[var(--color-border-subtle)] bg-[var(--color-bg-raised)]"
              aria-label="Bibliothèque"
            >
              <SettingsIcon size={16} strokeWidth={1.6} className="text-[var(--color-fg-secondary)]" />
            </button>
          </header>

          <div className="px-3 pt-4 pb-6 flex flex-col gap-3">
            <LevelCard state={state} />
            <StreaksCard state={state} />
            <DailyQuestsCard state={state} />
            <Curve state={state} />
            <Heatmap state={state} />
            <ChapterBars state={state} />
            <BadgesGallery state={state} />
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

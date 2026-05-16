import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";

export default function ExplanationPanel({ open, question, ok, gained, onNext }) {
  return (
    <AnimatePresence>
      {open && question && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-30"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-3 mb-3 rounded-[20px] surface-raised overflow-hidden">
            {/* Liseré coloré */}
            <div
              className="h-[3px] w-full"
              style={{ background: ok ? "rgba(74,222,128,0.55)" : "var(--color-accent)" }}
            />

            <div className="px-5 pt-4 pb-3">
              {/* Verdict */}
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display italic text-[22px] tracking-tight"
                    style={{ color: ok ? "var(--color-success)" : "var(--color-accent)" }}
                  >
                    {ok ? "Juste" : "Faux"}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)]">
                    +{gained} XP
                  </span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-tertiary)] flex items-center gap-1.5">
                  <BookOpen size={12} strokeWidth={1.6} />
                  {question.reference}
                </div>
              </div>

              {/* Explication */}
              <p className="text-[14px] leading-[1.55] text-[var(--color-fg-primary)] mb-4">
                {question.explication}
              </p>

              {/* Bouton suivant */}
              <motion.button
                onClick={onNext}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-[12px] font-mono tracking-wide text-[13px] uppercase bg-[var(--color-bg-overlay)] text-[var(--color-fg-primary)] border border-[var(--color-border-strong)] flex items-center justify-center gap-2"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
              >
                Question suivante
                <ArrowRight size={15} strokeWidth={1.8} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

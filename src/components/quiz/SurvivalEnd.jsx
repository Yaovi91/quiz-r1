import { motion, AnimatePresence } from "framer-motion";
import { Skull, Trophy } from "lucide-react";
import { useEffect } from "react";
import { popRecord } from "../../lib/confetti.js";

export default function SurvivalEnd({ open, score, best, isRecord, onRestart, onClose }) {
  useEffect(() => {
    if (open && isRecord) popRecord();
  }, [open, isRecord]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-6"
        >
          <motion.div
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="surface-raised p-8 w-full max-w-[340px] text-center"
          >
            <div className="flex justify-center mb-3">
              {isRecord ? (
                <Trophy size={42} strokeWidth={1.5} className="text-[var(--color-accent)] glow-accent" />
              ) : (
                <Skull size={42} strokeWidth={1.5} className="text-[var(--color-fg-secondary)]" />
              )}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-tertiary)] mb-1">
              {isRecord ? "Nouveau record" : "Survie terminée"}
            </div>
            <div className="font-display italic text-[56px] leading-none tracking-tight mb-2"
              style={{ color: isRecord ? "var(--color-accent)" : "var(--color-fg-primary)" }}
            >
              {score}
            </div>
            <div className="font-mono text-[11px] text-[var(--color-fg-tertiary)] mb-6">
              Record actuel · {best}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-[10px] border border-[var(--color-border-strong)] text-[12px] font-mono uppercase tracking-wider text-[var(--color-fg-primary)] active:opacity-70"
              >
                Quitter
              </button>
              <button
                onClick={onRestart}
                className="flex-1 py-3 rounded-[10px] bg-[var(--color-accent)] text-white text-[12px] font-mono uppercase tracking-wider"
                style={{ boxShadow: "0 0 14px var(--color-accent-glow)" }}
              >
                Rejouer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

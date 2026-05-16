import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { LEVEL_NAMES } from "../../lib/xp.js";
import { popLevelUp } from "../../lib/confetti.js";
import SprinklerBulb from "../icons/SprinklerBulb.jsx";

export default function LevelUpOverlay({ level, onClose }) {
  useEffect(() => {
    if (!level) return;
    popLevelUp();
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [level]);

  return (
    <AnimatePresence>
      {level && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="surface-raised px-10 py-10 mx-6 text-center max-w-[320px]"
          >
            <motion.div
              animate={{ rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="flex justify-center mb-5"
            >
              <SprinklerBulb heat={1} size={64} pulse />
            </motion.div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] mb-2">
              Niveau {level}
            </div>
            <div className="font-display italic text-[32px] leading-none tracking-tight text-[var(--color-fg-primary)] mb-3">
              {LEVEL_NAMES[level]}
            </div>
            <div className="text-[13px] text-[var(--color-fg-secondary)] font-mono">
              Touche pour continuer
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

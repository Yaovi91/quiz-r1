import { motion, AnimatePresence } from "framer-motion";

/**
 * Affiche un nombre avec animation de tick lors du changement.
 * Tabular nums pour éviter le saut de largeur.
 */
export default function AnimatedNumber({ value, className = "" }) {
  return (
    <span className={`tabular font-mono inline-flex overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

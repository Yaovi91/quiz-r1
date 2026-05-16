import { motion } from "framer-motion";

export default function IconButton({ children, onClick, label, className = "" }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94, opacity: 0.85 }}
      onClick={onClick}
      aria-label={label}
      className={`relative inline-flex items-center justify-center w-11 h-11 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-raised)] active:bg-[var(--color-bg-overlay)] ${className}`}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.4)" }}
    >
      {children}
    </motion.button>
  );
}

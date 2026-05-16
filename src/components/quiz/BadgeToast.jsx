import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export default function BadgeToast({ items = [], onDone }) {
  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [items]);

  return (
    <div className="fixed top-3 left-3 right-3 z-50 pointer-events-none flex flex-col gap-2" style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}>
      <AnimatePresence>
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.div
              key={it.id || i}
              initial={{ y: -40, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22, delay: i * 0.08 }}
              className="mx-auto w-[92%] max-w-[400px] surface-raised px-3.5 py-2.5 flex items-center gap-3"
              style={{ borderColor: "rgba(230,57,70,0.4)" }}
            >
              {Icon && (
                <div className="shrink-0 w-9 h-9 rounded-[10px] bg-[var(--color-accent-soft)] border border-[rgba(230,57,70,0.3)] flex items-center justify-center">
                  <Icon size={16} strokeWidth={1.7} className="text-[var(--color-accent)]" />
                </div>
              )}
              <div className="flex-1 leading-tight">
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--color-accent)]">
                  {it.kind || "Badge débloqué"}
                </div>
                <div className="text-[14px] font-display italic tracking-tight text-[var(--color-fg-primary)]">
                  {it.title}
                </div>
                {it.subtitle && (
                  <div className="text-[11px] font-mono text-[var(--color-fg-tertiary)]">{it.subtitle}</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

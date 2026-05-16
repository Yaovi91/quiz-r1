import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, CalendarCheck, Skull, Wrench, BookMarked, X } from "lucide-react";

const MODES = [
  { id: "libre",     name: "Quizz libre",      desc: "Mode infini, algo adaptatif",        icon: Shuffle },
  { id: "daily",     name: "Daily Challenge",  desc: "10 questions identiques pour la journée", icon: CalendarCheck },
  { id: "survival",  name: "Survival",         desc: "Jusqu'à la 1ère erreur",             icon: Skull },
  { id: "audit",     name: "Audit terrain",    desc: "Scénarios Q1 / vérification",       icon: Wrench },
  { id: "revision",  name: "Révision ciblée",  desc: "Un chapitre, sans XP",              icon: BookMarked },
];

export default function ModePicker({ open, current, onClose, onPick, chapters = [] }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="mx-3 mb-3 rounded-[24px] surface-raised overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-display italic text-[22px] tracking-tight">Mode de jeu</h2>
                <button onClick={onClose} className="w-9 h-9 rounded-full bg-[var(--color-bg-overlay)] border border-[var(--color-border-subtle)] flex items-center justify-center">
                  <X size={16} strokeWidth={1.7} className="text-[var(--color-fg-secondary)]" />
                </button>
              </div>

              <div className="flex flex-col px-3 pb-3 gap-1.5">
                {MODES.map(m => {
                  const Icon = m.icon;
                  const active = current === m.id;
                  return (
                    <motion.button
                      key={m.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onPick(m.id)}
                      className={[
                        "w-full px-4 py-3.5 rounded-[14px] flex items-center gap-3 text-left border",
                        active
                          ? "bg-[var(--color-accent-soft)] border-[rgba(230,57,70,0.4)]"
                          : "bg-[var(--color-bg-raised)] border-[var(--color-border-subtle)] active:bg-[var(--color-bg-overlay)]",
                      ].join(" ")}
                    >
                      <div className={[
                        "w-10 h-10 rounded-[10px] flex items-center justify-center border",
                        active
                          ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                          : "bg-[var(--color-bg-sunken)] border-[var(--color-border-subtle)]",
                      ].join(" ")}>
                        <Icon size={18} strokeWidth={1.7} className={active ? "text-white" : "text-[var(--color-fg-secondary)]"} />
                      </div>
                      <div className="flex-1">
                        <div className="font-display text-[17px] text-[var(--color-fg-primary)] tracking-tight">{m.name}</div>
                        <div className="text-[12px] text-[var(--color-fg-tertiary)] font-mono">{m.desc}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

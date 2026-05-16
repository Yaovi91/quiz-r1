import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Pill from "../ui/Pill.jsx";
import { Check, X } from "lucide-react";

/**
 * Affiche une question.
 * onValidate(answerIndexes: number[]) — appelé quand l'utilisateur valide.
 * `state` : "asking" | "validated"
 * `result` : { ok, correctIndexes } quand validé.
 */
export default function QuestionCard({ question, state, result, onValidate, xpMul = 1 }) {
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    // Reset à chaque nouvelle question
    setSelected(new Set());
  }, [question?.id]);

  if (!question) return null;

  const isMulti = question.multi;
  const canValidate = selected.size > 0 && state === "asking";

  function toggle(i) {
    if (state !== "asking") return;
    const next = new Set(selected);
    if (isMulti) {
      next.has(i) ? next.delete(i) : next.add(i);
    } else {
      next.clear();
      next.add(i);
    }
    setSelected(next);
  }

  function submit() {
    if (!canValidate) return;
    onValidate([...selected].sort((a, b) => a - b));
  }

  return (
    <div className="flex-1 flex flex-col px-5">
      {/* Métadonnées */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <Pill tone="accent">§ {question.chapitre}</Pill>
        <Pill>Éd. {question.edition}</Pill>
        <Pill tone="muted">{question.theme}</Pill>
        {question.mode_audit && <Pill tone="accent">Audit terrain</Pill>}
        {isMulti && <Pill tone="muted">Plusieurs bonnes réponses</Pill>}
        {xpMul > 1 && state === "asking" && (
          <Pill tone="accent">×{xpMul} XP</Pill>
        )}
      </div>

      {/* Énoncé */}
      <motion.h1
        key={question.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-[26px] leading-[1.2] text-[var(--color-fg-primary)] tracking-tight mb-6"
      >
        {question.enonce}
      </motion.h1>

      {/* Propositions */}
      <div className="flex flex-col gap-2.5">
        {question.propositions.map((p, i) => {
          const isSel = selected.has(i);
          const isCorrect = result?.correctIndexes?.includes(i);
          const validated = state === "validated";

          let tone = "idle";
          if (validated) {
            if (isCorrect) tone = "correct";
            else if (isSel && !isCorrect) tone = "wrong";
            else tone = "dim";
          } else if (isSel) tone = "sel";

          return (
            <motion.button
              key={i}
              onClick={() => toggle(i)}
              whileTap={state === "asking" ? { scale: 0.985, opacity: 0.92 } : {}}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, type: "spring", stiffness: 260, damping: 24 }}
              className={[
                "relative w-full text-left px-4 py-4 rounded-[14px] border transition-colors",
                "min-h-[56px] flex items-center gap-3",
                tone === "idle"   && "bg-[var(--color-bg-raised)] border-[var(--color-border-subtle)]",
                tone === "sel"    && "bg-[var(--color-bg-overlay)] border-[var(--color-border-strong)]",
                tone === "correct" && "bg-[rgba(74,222,128,0.08)] border-[rgba(74,222,128,0.4)]",
                tone === "wrong"  && "bg-[rgba(230,57,70,0.08)] border-[rgba(230,57,70,0.45)]",
                tone === "dim"    && "bg-[var(--color-bg-raised)] border-[var(--color-border-subtle)] opacity-55",
              ].filter(Boolean).join(" ")}
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
            >
              {/* Lettre / case */}
              <span className={[
                "shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md border font-mono text-[11px] tabular",
                tone === "idle" && "border-[var(--color-border-strong)] text-[var(--color-fg-tertiary)]",
                tone === "sel" && "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-soft)]",
                tone === "correct" && "border-[rgba(74,222,128,0.5)] text-[var(--color-success)] bg-[var(--color-success-soft)]",
                tone === "wrong" && "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-soft)]",
                tone === "dim" && "border-[var(--color-border-subtle)] text-[var(--color-fg-muted)]",
              ].filter(Boolean).join(" ")}>
                {tone === "correct" ? <Check size={14} strokeWidth={2.2} /> :
                 tone === "wrong"   ? <X size={14} strokeWidth={2.2} /> :
                 String.fromCharCode(65 + i)}
              </span>

              <span className="text-[15px] leading-snug text-[var(--color-fg-primary)] flex-1">
                {p}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Bouton valider — réservation d'espace pour pas que ça saute quand l'explication slide */}
      <div className="mt-5 mb-2 min-h-[56px]">
        <AnimatePresence>
          {state === "asking" && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={submit}
              disabled={!canValidate}
              whileTap={canValidate ? { scale: 0.97 } : {}}
              className={[
                "w-full py-3.5 rounded-[12px] font-mono tracking-wide text-[13px] uppercase",
                canValidate
                  ? "bg-[var(--color-accent)] text-white border border-[var(--color-accent)] active:bg-[var(--color-accent-hover)]"
                  : "bg-[var(--color-bg-raised)] text-[var(--color-fg-muted)] border border-[var(--color-border-subtle)]",
              ].join(" ")}
              style={canValidate ? { boxShadow: "0 0 18px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.18)" } : {}}
            >
              Valider
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

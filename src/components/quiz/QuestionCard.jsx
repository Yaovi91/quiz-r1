import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

// Couleurs des badges par type de référentiel
const TYPE_COLORS = {
  SPK: "#E63946", // Sprinkleur - rouge accent app
  RIA: "#06B6D4", // RIA - cyan
  PI:  "#FB923C", // Poteau Incendie - orange
  BI:  "#10B981", // Bouche Incendie - vert
  PIA: "#A78BFA", // Poste Incendie Additivé - violet
};

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
  const isAudit = question.mode_audit;
  const canValidate = selected.size > 0 && state === "asking";
  const typeBg = TYPE_COLORS[question.type] || "rgba(255,255,255,0.18)";

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
      {/* Bandeau meta — style Linear compact mono */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        {/* Type (SPK, RIA, PI, BI, PIA) */}
        {question.type && (
          <span
            className="font-mono text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: typeBg, color: "#FFFFFF" }}
          >
            {question.type}
          </span>
        )}

        {/* MULTI — visible et insistant */}
        {isMulti && (
          <span
            className="font-mono text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
            style={{
              background: "rgba(250,204,21,0.16)",
              color: "#FCD34D",
              border: "0.5px solid rgba(250,204,21,0.4)",
            }}
          >
            <Check size={9} strokeWidth={3} />
            MULTI
          </span>
        )}

        {/* AUDIT terrain */}
        {isAudit && (
          <span
            className="font-mono text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(56,189,248,0.16)",
              color: "#7DD3FC",
              border: "0.5px solid rgba(56,189,248,0.4)",
            }}
          >
            AUDIT
          </span>
        )}

        {/* XP multiplier */}
        {xpMul > 1 && state === "asking" && (
          <span
            className="font-mono text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(230,57,70,0.16)",
              color: "#FCA5A5",
              border: "0.5px solid rgba(230,57,70,0.4)",
            }}
          >
            ×{xpMul} XP
          </span>
        )}

        {/* Référentiel · Édition */}
        {(question.referentiel || question.edition) && (
          <span className="font-mono text-[11px] text-[var(--color-fg-tertiary)] ml-0.5">
            {[question.referentiel, question.edition].filter(Boolean).join(" · ")}
          </span>
        )}

        {/* Chapitre — auto-aligné à droite */}
        {question.chapitre && (
          <span className="font-mono text-[11px] text-[var(--color-fg-muted)] ml-auto">
            §{question.chapitre}
          </span>
        )}
      </div>

      {/* Thème + mention multi (sous le bandeau) */}
      <div className="mb-4">
        {question.theme && (
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
            {question.theme}
          </p>
        )}
        {isMulti && (
          <p className="text-[11px] mt-1 font-medium" style={{ color: "#FCD34D" }}>
            Plusieurs bonnes réponses
          </p>
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

          // Forme de l'indicateur — rond pour single, carré pour multi
          const indicatorShape = isMulti ? "rounded-md" : "rounded-full";

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
              {/* Indicateur — forme adaptative (rond=single, carré=multi) */}
              <span className={[
                "shrink-0 inline-flex items-center justify-center w-7 h-7 border font-mono text-[11px] tabular",
                indicatorShape,
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

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Upload, Download, Trash2, BellRing, Hash } from "lucide-react";
import { useState } from "react";
import { exportState, resetState } from "../../lib/storage.js";

export default function LibraryScreen({ open, state, onClose, onImportQuestions, onResetQuestions, onSettings, onResetState }) {
  const [confirmReset, setConfirmReset] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        if (!Array.isArray(parsed)) throw new Error("Format attendu : tableau JSON");
        onImportQuestions(parsed);
        alert(`${parsed.length} questions importées.`);
      } catch (err) {
        alert("Import impossible : " + err.message);
      }
    };
    r.readAsText(file);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-0 z-50 bg-[var(--color-bg-base)] overflow-y-auto"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        >
          <header className="sticky top-0 z-10 flex items-center justify-between px-3 py-3 bg-[var(--color-bg-base)]/85 backdrop-blur-md hairline">
            <button onClick={onClose} className="flex items-center gap-1.5 px-2 py-1 -ml-1 text-[var(--color-fg-secondary)] active:opacity-70">
              <ChevronLeft size={20} strokeWidth={1.7} />
              <span className="font-mono text-[12px] uppercase tracking-[0.15em]">Retour</span>
            </button>
            <h1 className="font-display italic text-[18px] tracking-tight">Bibliothèque</h1>
            <div className="w-9" />
          </header>

          <div className="px-3 pt-4 flex flex-col gap-3">
            {/* Import / Export */}
            <div className="surface-raised p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)] mb-3">
                Banque de questions
              </div>

              <label className="surface-sunken w-full px-3 py-3 flex items-center gap-3 active:bg-[var(--color-bg-overlay)] cursor-pointer">
                <Upload size={16} strokeWidth={1.7} className="text-[var(--color-accent)]" />
                <span className="flex-1 text-[14px] text-[var(--color-fg-primary)]">Importer un .json</span>
                <span className="font-mono text-[10px] text-[var(--color-fg-tertiary)] uppercase">Remplace</span>
                <input type="file" accept="application/json" className="hidden" onChange={handleFile} />
              </label>

              <button
                onClick={() => exportState()}
                className="mt-2 surface-sunken w-full px-3 py-3 flex items-center gap-3 active:bg-[var(--color-bg-overlay)]"
              >
                <Download size={16} strokeWidth={1.7} className="text-[var(--color-fg-secondary)]" />
                <span className="flex-1 text-[14px] text-[var(--color-fg-primary)] text-left">Exporter ma progression</span>
                <span className="font-mono text-[10px] text-[var(--color-fg-tertiary)] uppercase">JSON</span>
              </button>

              <button
                onClick={() => onResetQuestions()}
                className="mt-2 surface-sunken w-full px-3 py-3 flex items-center gap-3 active:bg-[var(--color-bg-overlay)]"
              >
                <Trash2 size={16} strokeWidth={1.7} className="text-[var(--color-fg-secondary)]" />
                <span className="flex-1 text-[14px] text-[var(--color-fg-primary)] text-left">Restaurer la banque de démo</span>
              </button>
            </div>

            {/* Réglages */}
            <div className="surface-raised p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)] mb-3">
                Réglages
              </div>

              {/* Cap journalier */}
              <div className="surface-sunken px-3 py-3 flex items-center gap-3">
                <Hash size={16} strokeWidth={1.7} className="text-[var(--color-fg-secondary)]" />
                <span className="flex-1 text-[14px] text-[var(--color-fg-primary)]">Cap journalier</span>
                <select
                  value={state.settings?.dailyCap ?? ""}
                  onChange={(e) => onSettings({ dailyCap: e.target.value ? Number(e.target.value) : null })}
                  className="font-mono tabular text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-[8px] px-2 py-1 text-[var(--color-fg-primary)]"
                >
                  <option value="">Aucun</option>
                  <option value="10">10 questions</option>
                  <option value="20">20 questions</option>
                  <option value="30">30 questions</option>
                  <option value="50">50 questions</option>
                </select>
              </div>

              {/* Notifications PWA — placeholder, iOS 16.4+ */}
              <div className="mt-2 surface-sunken px-3 py-3 flex items-center gap-3">
                <BellRing size={16} strokeWidth={1.7} className="text-[var(--color-fg-secondary)]" />
                <div className="flex-1">
                  <div className="text-[14px] text-[var(--color-fg-primary)]">Notifications</div>
                  <div className="text-[11px] font-mono text-[var(--color-fg-tertiary)]">iOS 16.4+ · app installée sur l'écran d'accueil</div>
                </div>
                <button
                  onClick={async () => {
                    if (!("Notification" in window)) { alert("Non supporté sur ce navigateur."); return; }
                    const p = await Notification.requestPermission();
                    alert("Permission : " + p);
                  }}
                  className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-[8px] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] text-[var(--color-fg-primary)]"
                >
                  Activer
                </button>
              </div>
            </div>

            {/* Zone danger */}
            <div className="surface-raised p-5 border-[rgba(230,57,70,0.25)]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)] mb-3">
                Zone sensible
              </div>

              {confirmReset !== "state" ? (
                <button
                  onClick={() => setConfirmReset("state")}
                  className="w-full px-3 py-3 rounded-[10px] border border-[rgba(230,57,70,0.4)] text-[var(--color-accent)] text-[13px] font-mono uppercase tracking-wider"
                >
                  Réinitialiser toute la progression
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmReset(null)}
                    className="flex-1 py-3 rounded-[10px] border border-[var(--color-border-strong)] text-[12px] font-mono uppercase tracking-wider"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => { onResetState(resetState()); setConfirmReset(null); }}
                    className="flex-1 py-3 rounded-[10px] bg-[var(--color-accent)] text-white text-[12px] font-mono uppercase tracking-wider"
                  >
                    Tout effacer
                  </button>
                </div>
              )}
            </div>

            <div className="text-center font-mono text-[10px] text-[var(--color-fg-muted)] tracking-[0.15em] uppercase pt-2">
              Quizz R1 · v1.0 · usage personnel
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

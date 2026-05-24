// src/components/quiz/ReferentielPicker.jsx
// Bottom sheet : sélection d'un référentiel pour la Révision ciblée.
// Affiche tous les buckets avec leur count, tri par count décroissant.
// Tap sur un bucket → onPick(bucketKey) + close.

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, ChevronRight } from 'lucide-react';
import { BUCKETS, BUCKET_LABELS, bucketCounts } from '../../lib/picker.js';

const STYLE = `
  .rp-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 90;
  }
  .rp-sheet {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .rp-card {
    margin: 0 12px 12px;
    border-radius: 24px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-2);
    overflow: hidden;
    max-height: calc(100vh - 80px);
    display: flex;
    flex-direction: column;
  }
  .rp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 22px 14px;
    border-bottom: 1px solid var(--border);
  }
  .rp-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-style: italic;
    margin: 0;
    color: var(--text-1);
    letter-spacing: -0.01em;
  }
  .rp-close {
    width: 36px; height: 36px;
    border-radius: 999px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    color: var(--text-2);
    cursor: pointer;
  }
  .rp-sub {
    padding: 12px 22px 6px;
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    letter-spacing: 0.03em;
    line-height: 1.4;
  }
  .rp-body {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 8px 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .rp-row {
    appearance: none;
    border: 1px solid var(--border);
    background: var(--surface-1);
    color: inherit;
    font-family: inherit;
    border-radius: 14px;
    padding: 12px 14px;
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: center;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .rp-row:active {
    background: var(--surface-2);
    border-color: var(--border-strong);
  }
  .rp-row.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .rp-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-1);
    letter-spacing: -0.005em;
  }
  .rp-count {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .rp-row.disabled .rp-count {
    color: var(--text-3);
  }
  .rp-chevron {
    color: var(--text-3);
    display: flex;
    align-items: center;
  }
`;

/**
 * Props :
 *   open      : bool
 *   catalog   : array  (pour calculer les counts)
 *   onClose   : () => void
 *   onPick    : (bucketKey: string) => void
 */
export default function ReferentielPicker({ open, catalog, onClose, onPick }) {
  const counts = useMemo(() => catalog ? bucketCounts(catalog) : null, [catalog]);

  // Ordre : par count décroissant ; R1 prioritaires à count égal
  const ordered = useMemo(() => {
    if (!counts) return [...BUCKETS];
    const priority = (b) => (b === 'r1_2025' ? 2 : b === 'r1_old' ? 1 : 0);
    return [...BUCKETS].sort((a, b) => {
      const ca = counts[a] || 0;
      const cb = counts[b] || 0;
      if (cb !== ca) return cb - ca;
      return priority(b) - priority(a);
    });
  }, [counts]);

  return (
    <>
      <style>{STYLE}</style>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="rp-backdrop"
              className="rp-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            <motion.div
              key="rp-sheet"
              className="rp-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              <div className="rp-card">
                <div className="rp-header">
                  <h2 className="rp-title">Révision ciblée</h2>
                  <motion.button
                    className="rp-close"
                    onClick={onClose}
                    whileTap={{ scale: 0.92 }}
                    aria-label="Fermer"
                  >
                    <X size={16} strokeWidth={2} />
                  </motion.button>
                </div>
                <div className="rp-sub">
                  Choisis un référentiel — tirage aléatoire dans ses questions, sans XP.
                </div>
                <div className="rp-body">
                  {ordered.map(b => {
                    const c = counts ? counts[b] : 0;
                    const disabled = c === 0;
                    return (
                      <motion.button
                        key={b}
                        className={`rp-row ${disabled ? 'disabled' : ''}`}
                        onClick={() => !disabled && onPick(b)}
                        whileTap={!disabled ? { scale: 0.98 } : {}}
                        disabled={disabled}
                      >
                        <div className="rp-label">{BUCKET_LABELS[b]}</div>
                        <div className="rp-count">{c}</div>
                        <div className="rp-chevron">
                          <ChevronRight size={16} strokeWidth={1.7} />
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
    </>
  );
}

// src/components/settings/InterventionControls.jsx
// Section "Mode de jeu" pour le SettingsSheet :
//  - Segmented control LIBRE / INTERVENTION
//  - Si INTERVENTION : 6 curseurs (ratios par référentiel) + grille chips éditions R1
//
// Composant contrôlé : les valeurs viennent du parent (App.jsx via SettingsSheet),
// les changements sont remontés par callbacks.
//
// Style : aligné sur les conventions de SettingsSheet (settings-section, slider-row, etc.)
// — ajoute ses propres classes locales (.mode-seg, .ratio-row, .edition-chip).

import React, { useMemo } from 'react';
import { Sliders, BookOpen, Compass } from 'lucide-react';
import { BUCKETS, BUCKET_LABELS, R1_OLD_EDITIONS, bucketCounts, normalizeRatios } from '../../lib/picker.js';

const STYLE = `
  /* ====== Segmented control mode ====== */
  .mode-seg {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    position: relative;
  }
  .mode-seg button {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 11px 12px;
    border-radius: 10px;
    font-family: inherit;
    color: var(--text-2);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: color 0.18s ease, background 0.18s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    line-height: 1;
    min-height: 40px;
  }
  .mode-seg button.active {
    background: var(--surface-3);
    color: var(--text-1);
    box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 4px rgba(0,0,0,0.25);
  }
  .mode-seg button.active.intervention {
    background: linear-gradient(180deg, rgba(245,158,11,0.22), rgba(245,158,11,0.10));
    color: var(--accent);
    box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 0 14px rgba(245,158,11,0.18);
  }
  .mode-seg-sub {
    font-size: 11px;
    color: var(--text-3);
    text-align: center;
    margin-top: 8px;
    font-family: var(--font-mono);
    letter-spacing: 0.02em;
    padding: 0 6px;
    line-height: 1.4;
  }

  /* ====== Ratio rows (un slider compact par bucket) ====== */
  .ratio-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ratio-row {
    padding: 11px 13px 13px;
    border-radius: 12px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ratio-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .ratio-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-1);
    letter-spacing: -0.005em;
  }
  .ratio-count {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--text-3);
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }
  .ratio-value {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--accent);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    min-width: 38px;
    text-align: right;
  }

  /* Compact slider (réutilise les styles de SettingsSheet mais hauteur réduite) */
  .ratio-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: var(--surface-3);
    outline: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }
  .ratio-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: var(--accent);
    cursor: grab;
    border: 2.5px solid var(--surface-1);
    box-shadow: 0 0 10px rgba(245,158,11,0.4);
  }
  .ratio-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.08); }
  .ratio-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: var(--accent);
    cursor: grab;
    border: 2.5px solid var(--surface-1);
    box-shadow: 0 0 10px rgba(245,158,11,0.4);
  }
  .ratio-slider:disabled,
  .ratio-slider[disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ====== Résumé pondération ====== */
  .ratio-sum {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px;
    border-radius: 10px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-3);
    letter-spacing: 0.03em;
  }
  .ratio-sum-value {
    color: var(--text-1);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  /* ====== Chips éditions R1 ====== */
  .edition-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .edition-chip {
    appearance: none;
    border: 1px solid var(--border);
    background: var(--surface-1);
    color: var(--text-2);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    padding: 7px 11px;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    min-height: 32px;
  }
  .edition-chip.active {
    background: var(--accent-soft);
    border-color: rgba(245,158,11,0.45);
    color: var(--accent);
  }
  .edition-chip.disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* ====== Animation reveal des contrôles INTERVENTION ====== */
  @keyframes intRevealIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .intervention-controls {
    animation: intRevealIn 0.32s cubic-bezier(0.22, 1, 0.36, 1);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
`;

/**
 * Format un ratio en pourcentage entier (45% au lieu de 0.453)
 */
const fmtPct = (r) => `${Math.round(r * 100)}%`;

/**
 * InterventionControls
 *
 * Props :
 *   mode             : "libre" | "intervention"
 *   ratios           : { r1_2025, r1_old, r5, nf_s62_201, en12845, nf_s62_200, cross }
 *   editionsR1       : string[]   (ex. ["2025", "2020", "2014"])
 *   catalog          : array (optionnel, pour afficher les counts par bucket)
 *   onModeChange     : (mode) => void
 *   onRatiosChange   : (ratios) => void
 *   onEditionsR1Change : (editions) => void
 */
export default function InterventionControls({
  mode = 'libre',
  ratios,
  editionsR1 = [],
  catalog = null,
  onModeChange,
  onRatiosChange,
  onEditionsR1Change,
}) {
  // Sécurité : si ratios n'arrive pas, on retombe sur un placeholder (évite crash)
  const safeRatios = useMemo(() => {
    const out = {};
    for (const b of BUCKETS) out[b] = (ratios && typeof ratios[b] === 'number') ? ratios[b] : 0;
    return out;
  }, [ratios]);

  // Counts par bucket (mémoïsés) — pour montrer "X q disponibles"
  const counts = useMemo(
    () => catalog ? bucketCounts(catalog, editionsR1) : null,
    [catalog, editionsR1]
  );

  // Normalisation pour afficher les % réels (somme = 100%)
  const normalized = useMemo(() => normalizeRatios(safeRatios), [safeRatios]);
  const rawSum = useMemo(
    () => BUCKETS.reduce((acc, b) => acc + (safeRatios[b] || 0), 0),
    [safeRatios]
  );

  const updateRatio = (bucket, value) => {
    const next = { ...safeRatios, [bucket]: value };
    onRatiosChange && onRatiosChange(next);
  };

  const toggleEdition = (ed) => {
    const has = editionsR1.includes(ed);
    let next;
    if (has) {
      next = editionsR1.filter(e => e !== ed);
      // Garde-fou : on ne désactive pas toutes les éditions si r1_old > 0
      if (next.length === 0 && safeRatios.r1_old > 0) return;
    } else {
      next = [...editionsR1, ed].sort((a, b) => b.localeCompare(a)); // récentes d'abord
    }
    onEditionsR1Change && onEditionsR1Change(next);
  };

  // Détecter si r1_old est actif (sinon les chips d'éditions sont disabled)
  const r1OldActive = safeRatios.r1_old > 0;

  return (
    <>
      <style>{STYLE}</style>

      {/* ====== Sélecteur de mode ====== */}
      <div className="settings-section">
        <div className="settings-section-title">
          <Compass size={11} />
          Mode de jeu
        </div>

        <div className="mode-seg" role="tablist" aria-label="Mode de jeu">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'libre'}
            className={mode === 'libre' ? 'active' : ''}
            onClick={() => onModeChange && onModeChange('libre')}
          >
            <BookOpen size={13} strokeWidth={2.2} />
            Libre
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'intervention'}
            className={`${mode === 'intervention' ? 'active intervention' : ''}`}
            onClick={() => onModeChange && onModeChange('intervention')}
          >
            <Sliders size={13} strokeWidth={2.2} />
            Intervention
          </button>
        </div>

        <p className="mode-seg-sub">
          {mode === 'libre'
            ? 'R1 édition 2025 strict — cible Q1 et vérification sprinkleur.'
            : 'Multi-référentiels pondérés — R1 toutes éditions, R5, NF S62-201, EN 12845, NF S62-200, Cross.'}
        </p>
      </div>

      {/* ====== Contrôles INTERVENTION (ratios + éditions R1) ====== */}
      {mode === 'intervention' && (
        <div className="intervention-controls">

          {/* --- Curseurs ratios --- */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Sliders size={11} />
              Pondération par référentiel
            </div>

            <div className="ratio-block">
              {BUCKETS.map(b => {
                const value = safeRatios[b] || 0;
                const pctNormalized = rawSum > 0 ? normalized[b] : 0;
                const c = counts ? counts[b] : null;
                const isOff = value === 0;
                return (
                  <div key={b} className="ratio-row">
                    <div className="ratio-head">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ratio-label">{BUCKET_LABELS[b]}</div>
                        {c !== null && (
                          <div className="ratio-count">
                            {c} {c > 1 ? 'questions' : 'question'} disponible{c > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div className="ratio-value" style={isOff ? { color: 'var(--text-3)' } : {}}>
                        {isOff ? 'off' : fmtPct(pctNormalized)}
                      </div>
                    </div>
                    <input
                      type="range"
                      className="ratio-slider"
                      min={0}
                      max={1}
                      step={0.05}
                      value={value}
                      disabled={c === 0}
                      onChange={(e) => updateRatio(b, parseFloat(e.target.value))}
                      onInput={(e) => updateRatio(b, parseFloat(e.target.value))}
                    />
                  </div>
                );
              })}
            </div>

            <div className="ratio-sum">
              <span>Pondération totale</span>
              <span className="ratio-sum-value">
                {rawSum === 0 ? '— vide —' : 'normalisée à 100%'}
              </span>
            </div>
          </div>

          {/* --- Éditions R1 anciennes activables --- */}
          <div className="settings-section">
            <div className="settings-section-title">
              <BookOpen size={11} />
              Éditions R1 activées
            </div>

            <div className="edition-grid">
              {/* 2025 toujours actif quand bucket r1_2025 > 0, hors curseur ici */}
              <button
                type="button"
                className="edition-chip active disabled"
                disabled
                title="L'édition 2025 est gérée par le curseur R1 · 2025"
              >
                2025 ·
              </button>
              {R1_OLD_EDITIONS.map(ed => {
                const active = editionsR1.includes(ed);
                const disabled = !r1OldActive;
                return (
                  <button
                    key={ed}
                    type="button"
                    className={`edition-chip${active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
                    disabled={disabled}
                    onClick={() => toggleEdition(ed)}
                    aria-pressed={active}
                  >
                    {ed}
                  </button>
                );
              })}
            </div>

            <p className="mode-seg-sub" style={{ marginTop: 4, textAlign: 'left', padding: 0 }}>
              {r1OldActive
                ? 'Tirage R1 anciennes éditions limité aux éditions cochées.'
                : 'Active le curseur « R1 · anciennes éditions » pour gérer ces éditions.'}
            </p>
          </div>

        </div>
      )}
    </>
  );
}

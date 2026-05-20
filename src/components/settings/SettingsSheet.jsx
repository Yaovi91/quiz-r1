// src/components/settings/SettingsSheet.jsx
// Bottom sheet des Réglages utilisateur.
// - Chrono Daily (toggle, durée, bonus XP <5min / <3min)
// - Reset 3 niveaux avec confirmation à délai 1.5s
// - Export / Import JSON
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Zap, RotateCcw, AlertTriangle, Download, Upload,
  ChevronRight, Check, Trash2, Calendar, Database, Power,
} from 'lucide-react';
import {
  loadPrefs, savePrefs, updatePref,
  resetTodaySession, resetStatsAndProgression, resetFactory,
  exportAllData, importAllData,
} from '../../lib/userPrefs.js';

// ============================================================================
// STYLES — bloc CSS local pour ne pas polluer le global
// ============================================================================
const SHEET_CSS = `
  .settings-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 90;
  }
  .settings-sheet {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .settings-card {
    margin: 0 12px 12px;
    border-radius: 24px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-2);
    overflow: hidden;
    max-height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
  }
  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 22px 14px;
    border-bottom: 1px solid var(--border);
  }
  .settings-title {
    font-family: var(--font-display);
    font-size: 26px;
    font-style: italic;
    margin: 0;
    letter-spacing: -0.01em;
    color: var(--text-1);
  }
  .settings-close {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    color: var(--text-2);
    cursor: pointer;
  }
  .settings-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 18px 18px 24px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    -webkit-overflow-scrolling: touch;
  }
  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .settings-section-title {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-3);
    font-weight: 600;
    padding: 0 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .settings-section-title svg {
    color: var(--text-3);
  }
  .settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 14px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    min-height: 52px;
  }
  .settings-row.compact {
    padding: 10px 14px;
    min-height: 44px;
  }
  .settings-row-label {
    flex: 1;
    min-width: 0;
  }
  .settings-row-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-1);
    line-height: 1.3;
  }
  .settings-row-sub {
    font-size: 11px;
    color: var(--text-3);
    margin-top: 2px;
    font-family: var(--font-mono);
    line-height: 1.3;
  }
  /* Toggle switch */
  .toggle {
    width: 46px;
    height: 26px;
    border-radius: 999px;
    background: var(--surface-3);
    position: relative;
    cursor: pointer;
    transition: background 0.2s ease;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }
  .toggle.on {
    background: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
  }
  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  /* Slider */
  .slider-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 13px 14px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
  }
  .slider-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .slider-value {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--accent);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .slider-track {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: var(--surface-3);
    outline: none;
    margin: 8px 0;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }
  .slider-track::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: var(--accent);
    cursor: grab;
    border: 3px solid var(--surface-1);
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
  }
  .slider-track::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.1);
  }
  .slider-track::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: var(--accent);
    cursor: grab;
    border: 3px solid var(--surface-1);
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
  }
  .slider-ticks {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
  }
  /* Action button (export/import/reset) */
  .action-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: var(--text-1);
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .action-btn:active {
    background: var(--surface-2);
  }
  .action-btn-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--surface-3);
    display: grid;
    place-items: center;
    color: var(--text-2);
    flex-shrink: 0;
  }
  .action-btn-text {
    flex: 1;
    min-width: 0;
  }
  .action-btn-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-1);
  }
  .action-btn-sub {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    margin-top: 2px;
  }
  /* Reset btn variants */
  .action-btn.danger {
    border-color: rgba(230, 57, 70, 0.25);
    background: linear-gradient(180deg, rgba(230, 57, 70, 0.04), var(--surface-1));
  }
  .action-btn.danger .action-btn-icon {
    background: rgba(230, 57, 70, 0.12);
    color: var(--danger);
  }
  .action-btn.danger .action-btn-title {
    color: var(--text-1);
  }
  .action-btn.warning {
    border-color: rgba(245, 158, 11, 0.18);
  }
  .action-btn.warning .action-btn-icon {
    background: rgba(245, 158, 11, 0.12);
    color: var(--accent);
  }
  /* Confirmation overlay */
  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 110;
    display: flex;
    align-items: flex-end;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .confirm-sheet {
    width: 100%;
    margin: 0 12px 12px;
    border-radius: 24px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-2);
    overflow: hidden;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .confirm-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(230, 57, 70, 0.14);
    display: grid;
    place-items: center;
    color: var(--danger);
    align-self: flex-start;
    box-shadow: 0 0 24px rgba(230, 57, 70, 0.18);
  }
  .confirm-title {
    font-family: var(--font-display);
    font-size: 26px;
    font-style: italic;
    margin: 0;
    color: var(--text-1);
    line-height: 1.1;
  }
  .confirm-body {
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.5;
    margin: 0;
  }
  .confirm-body strong {
    color: var(--text-1);
    font-weight: 600;
  }
  .confirm-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 4px;
  }
  .confirm-cancel {
    padding: 14px;
    border-radius: 14px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    color: var(--text-1);
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
  }
  .confirm-danger {
    padding: 14px;
    border-radius: 14px;
    background: var(--danger);
    border: 1px solid var(--danger);
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: opacity 0.2s ease;
  }
  .confirm-danger:disabled {
    background: var(--surface-3);
    border-color: var(--border);
    color: var(--text-3);
    cursor: not-allowed;
  }
  .confirm-danger-progress {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.18);
    transform-origin: left;
  }
  .toast {
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom, 0) + 24px);
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 16px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-2);
    color: var(--text-1);
    font-size: 13px;
    font-weight: 500;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .toast.success { color: var(--success); }
  .toast.error { color: var(--danger); }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SettingsSheet({ open, onClose, onPrefsChange }) {
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [confirm, setConfirm] = useState(null); // { type, title, body, dangerText, onConfirm }
  const [toast, setToast] = useState(null); // { kind, text }
  const fileInputRef = useRef(null);

  // Reload prefs au mount (au cas où elles auraient changé ailleurs)
  useEffect(() => {
    if (open) setPrefs(loadPrefs());
  }, [open]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const update = (key, value) => {
    const next = updatePref(key, value);
    setPrefs(next);
    onPrefsChange && onPrefsChange(next);
  };

  // === Actions de reset ===
  const handleResetToday = () => {
    setConfirm({
      type: 'today',
      icon: Calendar,
      title: 'Effacer la session du jour ?',
      body: <>Tu vas perdre l'<strong>XP du jour</strong>, les <strong>quêtes du jour</strong> et le Daily challenge en cours. <strong>Streak, badges, niveau et historique conservés.</strong></>,
      dangerText: 'Effacer aujourd\'hui',
      onConfirm: () => {
        resetTodaySession();
        setToast({ kind: 'success', text: 'Session du jour effacée' });
        setConfirm(null);
      },
    });
  };

  const handleResetStats = () => {
    setConfirm({
      type: 'stats',
      icon: Trash2,
      title: 'Réinitialiser ma progression ?',
      body: <>Tu vas perdre <strong>l'intégralité de ta progression</strong> : XP, niveau, streak, badges, historique, meilleurs temps. <strong>Tes réglages sont conservés.</strong> Action définitive.</>,
      dangerText: 'Tout réinitialiser',
      onConfirm: () => {
        resetStatsAndProgression();
        setToast({ kind: 'success', text: 'Progression réinitialisée — recharge l\'app' });
        setConfirm(null);
        // Recharge l'app après un court délai pour repartir propre
        setTimeout(() => window.location.reload(), 800);
      },
    });
  };

  const handleResetFactory = () => {
    setConfirm({
      type: 'factory',
      icon: Power,
      title: 'Factory reset complet ?',
      body: <>Tu vas effacer <strong>absolument tout</strong>, y compris tes réglages personnalisés. Équivalent à désinstaller puis réinstaller l'app. Action définitive.</>,
      dangerText: 'Effacer absolument tout',
      onConfirm: () => {
        resetFactory();
        setToast({ kind: 'success', text: 'Factory reset terminé — recharge l\'app' });
        setConfirm(null);
        setTimeout(() => window.location.reload(), 800);
      },
    });
  };

  const handleExport = () => {
    const ok = exportAllData();
    if (ok) {
      setToast({ kind: 'success', text: 'Export téléchargé' });
    } else {
      setToast({ kind: 'error', text: 'Échec de l\'export' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const result = await importAllData(file);
    e.target.value = ''; // reset input
    if (result.success) {
      setToast({ kind: 'success', text: 'Import réussi — recharge l\'app' });
      setTimeout(() => window.location.reload(), 800);
    } else {
      setToast({ kind: 'error', text: result.error || 'Échec de l\'import' });
    }
  };

  // Formatters
  const fmtMin = (sec) => `${Math.round(sec / 60)} min`;
  const fmtMmSs = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s === 0 ? `${m} min` : `${m}'${String(s).padStart(2, '0')}`;
  };

  return (
    <>
      <style>{SHEET_CSS}</style>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="settings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            <motion.div
              key="sheet"
              className="settings-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              <div className="settings-card">
                <div className="settings-header">
                  <h2 className="settings-title">Réglages</h2>
                  <motion.button
                    className="settings-close"
                    onClick={onClose}
                    whileTap={{ scale: 0.92 }}
                    aria-label="Fermer"
                  >
                    <X size={16} strokeWidth={2} />
                  </motion.button>
                </div>

                <div className="settings-body">

                  {/* ====== CHRONO DAILY ====== */}
                  <div className="settings-section">
                    <div className="settings-section-title">
                      <Clock size={11} />
                      Chrono Daily Challenge
                    </div>

                    <div className="settings-row">
                      <div className="settings-row-label">
                        <div className="settings-row-title">Activer le chrono</div>
                        <div className="settings-row-sub">Compte à rebours sur les 10 questions</div>
                      </div>
                      <ToggleSwitch
                        on={prefs.dailyTimerEnabled}
                        onChange={(v) => update('dailyTimerEnabled', v)}
                      />
                    </div>

                    <div
                      className="slider-row"
                      style={{
                        opacity: prefs.dailyTimerEnabled ? 1 : 0.4,
                        pointerEvents: prefs.dailyTimerEnabled ? 'auto' : 'none',
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <div className="slider-head">
                        <div className="settings-row-title">Durée totale</div>
                        <div className="slider-value">{fmtMmSs(prefs.dailyTimerDurationSec)}</div>
                      </div>
                      <input
                        type="range"
                        className="slider-track"
                        min={300}
                        max={900}
                        step={30}
                        value={prefs.dailyTimerDurationSec}
                        onChange={(e) => update('dailyTimerDurationSec', parseInt(e.target.value, 10))}
                        onInput={(e) => update('dailyTimerDurationSec', parseInt(e.target.value, 10))}
                      />
                      <div className="slider-ticks">
                        <span>5 min</span>
                        <span>10 min</span>
                        <span>15 min</span>
                      </div>
                    </div>
                  </div>

                  {/* ====== BONUS XP TEMPS ====== */}
                  <div className="settings-section">
                    <div className="settings-section-title">
                      <Zap size={11} />
                      Bonus XP rapidité
                    </div>

                    <div className="settings-row">
                      <div className="settings-row-label">
                        <div className="settings-row-title">Activer les bonus temps</div>
                        <div className="settings-row-sub">Récompense les Daily 10/10 rapides</div>
                      </div>
                      <ToggleSwitch
                        on={prefs.dailyBonusEnabled}
                        onChange={(v) => update('dailyBonusEnabled', v)}
                      />
                    </div>

                    <div
                      className="settings-section"
                      style={{
                        opacity: prefs.dailyBonusEnabled ? 1 : 0.4,
                        pointerEvents: prefs.dailyBonusEnabled ? 'auto' : 'none',
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <div className="slider-row">
                        <div className="slider-head">
                          <div>
                            <div className="settings-row-title">Bonus rapide</div>
                            <div className="settings-row-sub">10/10 en moins de {fmtMin(prefs.dailyBonusFastSec)}</div>
                          </div>
                          <div className="slider-value">+{prefs.dailyBonusFastXp} XP</div>
                        </div>
                        <input
                          type="range"
                          className="slider-track"
                          min={10}
                          max={75}
                          step={5}
                          value={prefs.dailyBonusFastXp}
                          onChange={(e) => update('dailyBonusFastXp', parseInt(e.target.value, 10))}
                          onInput={(e) => update('dailyBonusFastXp', parseInt(e.target.value, 10))}
                        />
                      </div>

                      <div className="slider-row">
                        <div className="slider-head">
                          <div>
                            <div className="settings-row-title">Bonus éclair</div>
                            <div className="settings-row-sub">10/10 en moins de {fmtMin(prefs.dailyBonusBlazeSec)}</div>
                          </div>
                          <div className="slider-value">+{prefs.dailyBonusBlazeXp} XP</div>
                        </div>
                        <input
                          type="range"
                          className="slider-track"
                          min={25}
                          max={150}
                          step={5}
                          value={prefs.dailyBonusBlazeXp}
                          onChange={(e) => update('dailyBonusBlazeXp', parseInt(e.target.value, 10))}
                          onInput={(e) => update('dailyBonusBlazeXp', parseInt(e.target.value, 10))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ====== DONNÉES ====== */}
                  <div className="settings-section">
                    <div className="settings-section-title">
                      <Database size={11} />
                      Mes données
                    </div>

                    <motion.button
                      className="action-btn"
                      onClick={handleExport}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div className="action-btn-icon"><Download size={16} /></div>
                      <div className="action-btn-text">
                        <div className="action-btn-title">Exporter ma progression</div>
                        <div className="action-btn-sub">Téléchargement d'un fichier JSON</div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                    </motion.button>

                    <motion.button
                      className="action-btn"
                      onClick={handleImportClick}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div className="action-btn-icon"><Upload size={16} /></div>
                      <div className="action-btn-text">
                        <div className="action-btn-title">Importer une progression</div>
                        <div className="action-btn-sub">Remplace les données actuelles</div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                    </motion.button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json,.json"
                      style={{ display: 'none' }}
                      onChange={handleImportFile}
                    />
                  </div>

                  {/* ====== RESET ====== */}
                  <div className="settings-section">
                    <div className="settings-section-title">
                      <AlertTriangle size={11} />
                      Zone de réinitialisation
                    </div>

                    <motion.button
                      className="action-btn warning"
                      onClick={handleResetToday}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div className="action-btn-icon"><Calendar size={16} /></div>
                      <div className="action-btn-text">
                        <div className="action-btn-title">Effacer la session du jour</div>
                        <div className="action-btn-sub">XP, quêtes, Daily — conserve le reste</div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                    </motion.button>

                    <motion.button
                      className="action-btn danger"
                      onClick={handleResetStats}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div className="action-btn-icon"><RotateCcw size={16} /></div>
                      <div className="action-btn-text">
                        <div className="action-btn-title">Réinitialiser ma progression</div>
                        <div className="action-btn-sub">Stats à zéro · réglages conservés</div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                    </motion.button>

                    <motion.button
                      className="action-btn danger"
                      onClick={handleResetFactory}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div className="action-btn-icon"><Power size={16} /></div>
                      <div className="action-btn-text">
                        <div className="action-btn-title">Factory reset</div>
                        <div className="action-btn-sub">Efface tout, y compris les réglages</div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation overlay (par-dessus le sheet) */}
      <AnimatePresence>
        {confirm && (
          <ConfirmSheet
            key="confirm"
            data={confirm}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.text}
            className={`toast ${toast.kind === 'success' ? 'success' : toast.kind === 'error' ? 'error' : ''}`}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            {toast.kind === 'success' && <Check size={14} />}
            {toast.kind === 'error' && <X size={14} />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

function ToggleSwitch({ on, onChange }) {
  return (
    <motion.button
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
      whileTap={{ scale: 0.92 }}
      aria-pressed={on}
      role="switch"
    >
      <motion.span
        className="toggle-thumb"
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

function ConfirmSheet({ data, onCancel }) {
  const { icon: Icon, title, body, dangerText, onConfirm } = data;
  const DELAY_MS = 1500;
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    setArmed(false);
    const t = setTimeout(() => setArmed(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <motion.div
      className="confirm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onCancel}
    >
      <motion.div
        className="confirm-sheet"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon">
          <Icon size={26} />
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-body">{body}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button
            className="confirm-danger"
            disabled={!armed}
            onClick={onConfirm}
          >
            {!armed && (
              <motion.span
                className="confirm-danger-progress"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: DELAY_MS / 1000, ease: 'linear' }}
              />
            )}
            {armed ? dangerText : 'Patiente…'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

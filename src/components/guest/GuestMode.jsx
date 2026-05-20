// src/components/guest/GuestMode.jsx
// Mode Invité — isolation totale des stats perso.
// Flow : LevelPicker → ModePicker → Survival OU Timed → Results (avec partage)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Skull, Clock, Share2, RotateCcw,
  X, Check, Trophy, CheckCircle2, XCircle, UserCircle2,
  Sparkles, AlertCircle, Copy, Mail, MessageSquare,
} from 'lucide-react';
import {
  GUEST_LEVELS, GUEST_LEVEL_LIST,
  filterByGuestLevel, pickGuestQuestion, pickGuestSession,
} from '../../lib/guestPicker.js';
import {
  shareResult, buildGuestShareText, buildMailtoUrl, buildSmsUrl,
  copyToClipboard, formatTime, INVITE_URL,
} from '../../lib/share.js';

// ============================================================================
// CSS LOCAL
// ============================================================================
const GUEST_CSS = `
  .guest-phone {
    width: 100%;
    max-width: 420px;
    min-height: 100vh;
    position: relative;
    z-index: 2;
    padding: 16px 16px 120px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--text-1);
    font-family: var(--font-body);
  }
  .guest-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 4px 2px;
  }
  .guest-back {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    color: var(--text-2);
    cursor: pointer;
    box-shadow: var(--shadow-1);
  }
  .guest-eyebrow-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-3);
    font-weight: 600;
    font-family: var(--font-mono);
  }
  .guest-eyebrow-pill svg { color: var(--text-3); }

  .guest-hero {
    padding: 6px 4px;
  }
  .guest-hero-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-3);
    font-weight: 500;
    margin-bottom: 6px;
  }
  .guest-hero-title {
    font-family: var(--font-display);
    font-size: 38px;
    line-height: 1.05;
    font-weight: 400;
    margin: 0 0 8px;
    letter-spacing: -0.01em;
  }
  .guest-hero-title em {
    font-style: italic;
    color: var(--accent);
  }
  .guest-hero-sub {
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.4;
    margin: 0;
  }

  /* === Niveaux === */
  .level-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .level-card {
    width: 100%;
    display: grid;
    grid-template-columns: 36px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: var(--text-1);
    transition: all 0.18s ease;
  }
  .level-card:active {
    background: var(--surface-2);
  }
  .level-card.selected {
    background: linear-gradient(180deg, rgba(245,158,11,0.08), var(--surface-1));
    border-color: rgba(245,158,11,0.4);
    box-shadow: 0 0 0 1px rgba(245,158,11,0.15), 0 0 20px rgba(245,158,11,0.08);
  }
  .level-num {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--surface-3);
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
  }
  .level-card.selected .level-num {
    background: var(--accent);
    color: #fff;
  }
  .level-meta { min-width: 0; }
  .level-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-1);
  }
  .level-sub {
    font-size: 11px;
    color: var(--text-3);
    margin-top: 2px;
    font-family: var(--font-mono);
  }
  .level-arrow { color: var(--text-3); }
  .level-card.selected .level-arrow { color: var(--accent); }

  /* === Modes (écran 2) === */
  .mode-grid-guest {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .mode-card-guest {
    position: relative;
    padding: 18px 20px;
    border-radius: 18px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    color: var(--text-1);
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .mode-card-guest:active { background: var(--surface-2); }
  .mode-card-guest.survival {
    background: linear-gradient(180deg, rgba(230,57,70,0.06), var(--surface-1));
    border-color: rgba(230,57,70,0.22);
  }
  .mode-card-guest.timed {
    background: linear-gradient(180deg, rgba(245,158,11,0.05), var(--surface-1));
    border-color: rgba(245,158,11,0.2);
  }
  .mode-card-guest-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .mode-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: var(--surface-3);
    color: var(--text-2);
  }
  .mode-card-guest.survival .mode-icon-box {
    background: rgba(230,57,70,0.14);
    color: var(--danger);
  }
  .mode-card-guest.timed .mode-icon-box {
    background: rgba(245,158,11,0.14);
    color: var(--accent);
  }
  .mode-card-guest-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-style: italic;
    line-height: 1.1;
    margin: 0;
  }
  .mode-card-guest-desc {
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.4;
    margin: 0 0 12px;
  }
  .mode-card-guest-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
  }

  /* === Chrono header (Timed) === */
  .timed-top {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 6px 4px;
  }
  .timed-chrono {
    text-align: right;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.02em;
    transition: color 0.3s ease;
  }
  .timed-chrono.warn { color: var(--accent); }
  .timed-chrono.danger {
    color: var(--danger);
    animation: pulse-danger 0.8s ease-in-out infinite;
  }
  .timed-chrono.paused {
    color: var(--text-3);
  }
  @keyframes pulse-danger {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .timed-progress {
    flex: 1;
    height: 4px;
    border-radius: 999px;
    background: var(--surface-3);
    overflow: hidden;
    position: relative;
  }
  .timed-progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: inherit;
    transition: width 0.3s linear;
  }
  .timed-stepper {
    display: flex;
    gap: 4px;
    padding: 4px 0;
  }
  .timed-stepper-dot {
    width: 18px;
    height: 4px;
    border-radius: 999px;
    background: var(--surface-3);
    transition: background 0.3s ease;
  }
  .timed-stepper-dot.ok { background: var(--success); }
  .timed-stepper-dot.ko { background: var(--danger); }
  .timed-stepper-dot.current { background: var(--accent); }

  /* === Survival ambient === */
  .surv-heat-guest {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(ellipse at 50% 100%, rgba(230,57,70,0.12), transparent 60%);
    transition: opacity 0.6s ease;
  }
  .surv-score-guest {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 0 8px;
  }
  .surv-num-guest {
    font-family: var(--font-display);
    font-size: 56px;
    font-style: italic;
    line-height: 1;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .surv-label-guest {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--text-3);
    margin-top: 6px;
    font-weight: 600;
  }

  /* Question (réutilisé) */
  .gq-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
    padding: 0 4px;
  }
  .gq-meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 999px;
    background: var(--text-3);
  }
  .gq-card {
    padding: 18px 20px;
    border-radius: 18px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border);
    box-shadow: var(--shadow-2);
  }
  .gq-text {
    font-size: 17px;
    line-height: 1.45;
    margin: 0;
    color: var(--text-1);
  }
  .gq-props {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .gq-prop {
    display: grid;
    grid-template-columns: 32px 1fr 24px;
    align-items: center;
    gap: 10px;
    padding: 14px 14px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: var(--text-1);
    font-size: 14px;
    line-height: 1.35;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .gq-prop:active { background: var(--surface-2); }
  .gq-prop.correct {
    background: linear-gradient(180deg, rgba(16,185,129,0.1), var(--surface-1));
    border-color: rgba(16,185,129,0.4);
  }
  .gq-prop.wrong {
    background: linear-gradient(180deg, rgba(230,57,70,0.1), var(--surface-1));
    border-color: rgba(230,57,70,0.4);
  }
  .gq-letter {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    background: var(--surface-3);
    color: var(--text-2);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
  }
  .gq-prop.correct .gq-letter {
    background: var(--success);
    color: #fff;
  }
  .gq-prop.wrong .gq-letter {
    background: var(--danger);
    color: #fff;
  }
  .gq-result {
    color: var(--text-3);
    display: grid;
    place-items: center;
  }
  .gq-prop.correct .gq-result { color: var(--success); }
  .gq-prop.wrong .gq-result { color: var(--danger); }

  .gq-feedback {
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
  }
  .gq-feedback.ok { border-color: rgba(16,185,129,0.3); }
  .gq-feedback.ko { border-color: rgba(230,57,70,0.3); }
  .gq-feedback-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-3);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .gq-feedback.ok .gq-feedback-tag { color: var(--success); }
  .gq-feedback.ko .gq-feedback-tag { color: var(--danger); }
  .gq-feedback-text {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-2);
  }
  .gq-feedback-ref {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
    margin-top: 8px;
    letter-spacing: 0.04em;
  }
  .gq-next {
    margin-top: 4px;
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    background: var(--accent);
    border: none;
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  /* === Results === */
  .results-eyebrow {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--text-3);
    text-align: center;
    margin-top: 12px;
    font-weight: 600;
  }
  .results-score {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 96px;
    line-height: 1;
    color: var(--accent);
    text-align: center;
    margin: 8px 0 4px;
    font-variant-numeric: tabular-nums;
  }
  .results-score .sep {
    color: var(--text-3);
    font-style: normal;
    margin: 0 4px;
  }
  .results-score .total {
    color: var(--text-2);
    font-style: normal;
    font-size: 0.5em;
    vertical-align: middle;
  }
  .results-subscore {
    text-align: center;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-2);
    margin-top: 4px;
  }
  .results-subscore strong {
    color: var(--text-1);
    font-weight: 600;
  }
  .results-message {
    text-align: center;
    color: var(--text-2);
    font-size: 14px;
    margin: 10px 0 16px;
    line-height: 1.45;
  }
  .share-cta {
    width: 100%;
    padding: 16px;
    border-radius: 16px;
    background: var(--accent);
    border: none;
    color: #fff;
    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 0 24px rgba(245,158,11,0.3);
  }
  .secondary-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .secondary-btn {
    padding: 14px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    color: var(--text-1);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  /* === Share fallback sheet === */
  .share-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 90;
  }
  .share-sheet {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .share-card {
    margin: 0 12px 12px;
    border-radius: 24px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-2);
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .share-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-style: italic;
    margin: 0 0 4px;
  }
  .share-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .share-opt {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    color: var(--text-1);
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
  }
  .share-opt-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--surface-3);
    display: grid;
    place-items: center;
    color: var(--text-2);
  }

  /* === Toast === */
  .guest-toast {
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
  .guest-toast.success { color: var(--success); }
`;

// ============================================================================
// MAIN — orchestrateur des écrans
// ============================================================================
export default function GuestMode({ catalog, onExit }) {
  const [phase, setPhase] = useState('level'); // level | mode | survival | timed | results
  const [levelId, setLevelId] = useState(null);
  const [modeId, setModeId] = useState(null); // 'survival' | 'timed'
  const [result, setResult] = useState(null); // { score, total, timeSec, ... }

  const level = levelId ? GUEST_LEVELS[levelId] : null;

  // Bank filtrée selon le niveau
  const bank = useMemo(() => {
    if (!catalog || !levelId) return [];
    return filterByGuestLevel(catalog, levelId, { excludeMulti: true, excludeAudit: true });
  }, [catalog, levelId]);

  const handleSelectLevel = (id) => {
    setLevelId(id);
    setPhase('mode');
  };

  const handleSelectMode = (id) => {
    setModeId(id);
    if (id === 'survival') setPhase('survival');
    else if (id === 'timed') setPhase('timed');
  };

  const handleFinish = (data) => {
    setResult(data);
    setPhase('results');
  };

  const handleRetry = () => {
    setResult(null);
    // Relance le même mode/niveau
    if (modeId === 'survival') setPhase('survival');
    else if (modeId === 'timed') setPhase('timed');
  };

  const handleChangeMode = () => {
    setResult(null);
    setModeId(null);
    setPhase('mode');
  };

  const handleChangeAll = () => {
    setResult(null);
    setLevelId(null);
    setModeId(null);
    setPhase('level');
  };

  return (
    <>
      <style>{GUEST_CSS}</style>
      <AnimatePresence mode="wait">
        {phase === 'level' && (
          <LevelPickerScreen
            key="level"
            onSelect={handleSelectLevel}
            onExit={onExit}
          />
        )}
        {phase === 'mode' && (
          <ModePickerScreen
            key="mode"
            level={level}
            onSelect={handleSelectMode}
            onBack={() => setPhase('level')}
          />
        )}
        {phase === 'survival' && (
          <SurvivalGuestScreen
            key="survival"
            level={level}
            bank={bank}
            onFinish={handleFinish}
            onExit={handleChangeAll}
          />
        )}
        {phase === 'timed' && (
          <TimedGuestScreen
            key="timed"
            level={level}
            bank={bank}
            onFinish={handleFinish}
            onExit={handleChangeAll}
          />
        )}
        {phase === 'results' && result && (
          <ResultsScreen
            key="results"
            result={result}
            level={level}
            modeId={modeId}
            onRetry={handleRetry}
            onChangeMode={handleChangeMode}
            onChangeAll={handleChangeAll}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// LEVEL PICKER
// ============================================================================
function LevelPickerScreen({ onSelect, onExit }) {
  return (
    <motion.div
      className="guest-phone"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
    >
      <div className="guest-topbar">
        <motion.button className="guest-back" onClick={onExit} whileTap={{ scale: 0.9 }} aria-label="Quitter">
          <ArrowLeft size={16} />
        </motion.button>
        <div className="guest-eyebrow-pill">
          <UserCircle2 size={11} />
          Mode invité
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="guest-hero">
        <div className="guest-hero-eyebrow">Étape 1 / 2</div>
        <h1 className="guest-hero-title"><em>Quel niveau</em><br/>pour l'invité ?</h1>
        <p className="guest-hero-sub">Les réponses ne touchent pas tes statistiques personnelles.</p>
      </div>

      <div className="level-list">
        {GUEST_LEVEL_LIST.map((lvl, i) => (
          <motion.button
            key={lvl.id}
            className="level-card"
            onClick={() => onSelect(lvl.id)}
            whileTap={{ scale: 0.985 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
          >
            <div className="level-num">D{i + 1}</div>
            <div className="level-meta">
              <div className="level-name">{lvl.name}</div>
              <div className="level-sub">{lvl.subtitle}</div>
            </div>
            <ArrowRight size={18} className="level-arrow" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MODE PICKER
// ============================================================================
function ModePickerScreen({ level, onSelect, onBack }) {
  return (
    <motion.div
      className="guest-phone"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
    >
      <div className="guest-topbar">
        <motion.button className="guest-back" onClick={onBack} whileTap={{ scale: 0.9 }} aria-label="Retour">
          <ArrowLeft size={16} />
        </motion.button>
        <div className="guest-eyebrow-pill">
          <UserCircle2 size={11} />
          {level.name}
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="guest-hero">
        <div className="guest-hero-eyebrow">Étape 2 / 2</div>
        <h1 className="guest-hero-title">Quel <em>défi</em> ?</h1>
        <p className="guest-hero-sub">Deux mécaniques différentes, à toi de choisir l'ambiance.</p>
      </div>

      <div className="mode-grid-guest">
        <motion.button
          className="mode-card-guest survival"
          onClick={() => onSelect('survival')}
          whileTap={{ scale: 0.985 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mode-card-guest-head">
            <div className="mode-icon-box">
              <Skull size={20} />
            </div>
            <h2 className="mode-card-guest-title">Mort Subite</h2>
          </div>
          <p className="mode-card-guest-desc">
            Combien de bonnes réponses peut-il enchaîner ? Une seule erreur et c'est fini.
          </p>
          <div className="mode-card-guest-meta">
            <span>1 erreur = fin</span>
            <span>·</span>
            <span>score = bonnes d'affilée</span>
          </div>
        </motion.button>

        <motion.button
          className="mode-card-guest timed"
          onClick={() => onSelect('timed')}
          whileTap={{ scale: 0.985 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="mode-card-guest-head">
            <div className="mode-icon-box">
              <Clock size={20} />
            </div>
            <h2 className="mode-card-guest-title">10 minutes chrono</h2>
          </div>
          <p className="mode-card-guest-desc">
            10 questions, {level.timerEnabled ? '10 minutes max' : 'sans chrono en mode Découverte'}. Le temps passe en pause pendant l'explication.
          </p>
          <div className="mode-card-guest-meta">
            <span>10 questions</span>
            {level.timerEnabled && <><span>·</span><span>chrono 10 min</span></>}
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SURVIVAL GUEST
// ============================================================================
function SurvivalGuestScreen({ level, bank, onFinish, onExit }) {
  const [questions, setQuestions] = useState(() => {
    return [...bank].sort(() => Math.random() - 0.5);
  });
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!bank || bank.length === 0) {
    return <NoQuestionsScreen onExit={onExit} />;
  }

  const q = questions[idx % questions.length];

  const handleSelect = (i) => {
    if (validated) return;
    setSelected(i);
    const correct = i === q.bonneReponse;
    setTimeout(() => {
      setIsCorrect(correct);
      setValidated(true);
      if (correct) {
        const newScore = score + 1;
        setScore(newScore);
        setTimeout(() => {
          setIdx(n => n + 1);
          setSelected(null);
          setValidated(false);
        }, 700);
      } else {
        // Fin du jeu après 1.2s pour voir la bonne réponse
        setTimeout(() => {
          onFinish({
            score,
            isSurvival: true,
            timeSec: null,
          });
        }, 1200);
      }
    }, 300);
  };

  return (
    <motion.div
      className="guest-phone"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
    >
      <div className="surv-heat-guest" style={{ opacity: Math.min(0.8, 0.2 + score * 0.05) }} />

      <div className="guest-topbar">
        <motion.button className="guest-back" onClick={onExit} whileTap={{ scale: 0.9 }}>
          <ArrowLeft size={16} />
        </motion.button>
        <div className="guest-eyebrow-pill">
          <Skull size={11} style={{ color: 'var(--danger)' }} />
          Mort Subite
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="surv-score-guest">
        <motion.div
          className="surv-num-guest"
          key={score}
          initial={{ scale: 1.4, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          {score}
        </motion.div>
        <div className="surv-label-guest">{level.name}</div>
      </div>

      <div className="gq-meta">
        <span>R1 §{q.chapitre}</span>
        <span className="gq-meta-dot" />
        <span>{q.theme}</span>
      </div>

      <motion.div
        key={`q-${idx}`}
        className="gq-card"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -12, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="gq-text">{q.enonce}</p>
      </motion.div>

      <div className="gq-props">
        {q.propositions.map((p, i) => {
          const isSel = selected === i;
          const isThisCorrect = validated && i === q.bonneReponse;
          const isThisWrong = validated && isSel && !isCorrect;
          const cls = isThisCorrect ? 'correct' : isThisWrong ? 'wrong' : '';
          const letter = ['A', 'B', 'C', 'D', 'E'][i];
          return (
            <motion.button
              key={i}
              className={`gq-prop ${cls}`}
              onClick={() => handleSelect(i)}
              whileTap={!validated ? { scale: 0.985 } : {}}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.04 }}
              disabled={validated}
            >
              <span className="gq-letter">{letter}</span>
              <span>{p}</span>
              <span className="gq-result">
                {isThisCorrect && <Check size={16} strokeWidth={3} />}
                {isThisWrong && <X size={16} strokeWidth={3} />}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================================
// TIMED GUEST (10 min chrono)
// ============================================================================
function TimedGuestScreen({ level, bank, onFinish, onExit }) {
  const TOTAL = 10;
  const DURATION_SEC = level.timerEnabled ? 600 : null; // null = sans chrono (Découverte)

  const [questions] = useState(() => pickGuestSession(bank, TOTAL));
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]); // booleans
  const [selected, setSelected] = useState(null);
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SEC);
  const [paused, setPaused] = useState(false); // pause pendant explication
  const [elapsedAtFinish, setElapsedAtFinish] = useState(null);
  const startedAtRef = useRef(Date.now());

  // Tick du chrono — uniquement si chrono actif et pas en pause et pas validé
  useEffect(() => {
    if (DURATION_SEC === null) return;
    if (paused) return;
    if (secondsLeft === null || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s === null) return null;
        const next = s - 1;
        if (next <= 0) return 0;
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paused, secondsLeft, DURATION_SEC]);

  // Fin du temps : on finit la session
  useEffect(() => {
    if (DURATION_SEC === null) return;
    if (secondsLeft === 0) {
      const score = results.filter(Boolean).length;
      const elapsed = DURATION_SEC;
      onFinish({
        score,
        total: TOTAL,
        timeSec: elapsed,
        isSurvival: false,
        timeoutHit: true,
      });
    }
  }, [secondsLeft, DURATION_SEC, results, onFinish]);

  if (!bank || bank.length === 0) {
    return <NoQuestionsScreen onExit={onExit} />;
  }

  const q = questions[idx];
  const elapsedSec = DURATION_SEC === null ? null : (DURATION_SEC - secondsLeft);
  const progressPct = DURATION_SEC === null ? 0 : ((idx + (validated ? 1 : 0)) / TOTAL) * 100;

  const handleSelect = (i) => {
    if (validated) return;
    setSelected(i);
    const correct = i === q.bonneReponse;
    setTimeout(() => {
      setIsCorrect(correct);
      setValidated(true);
      setResults(r => [...r, correct]);
      setPaused(true); // pause auto pendant explication
    }, 300);
  };

  const handleNext = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= TOTAL) {
      const score = [...results].filter(Boolean).length;
      const timeSec = DURATION_SEC === null
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : (DURATION_SEC - secondsLeft);
      setElapsedAtFinish(timeSec);
      onFinish({
        score,
        total: TOTAL,
        timeSec,
        isSurvival: false,
        timeoutHit: false,
      });
    } else {
      setIdx(nextIdx);
      setSelected(null);
      setValidated(false);
      setPaused(false); // reprise du chrono
    }
  };

  const chronoClass = DURATION_SEC === null ? 'paused'
    : paused ? 'paused'
    : secondsLeft <= 10 ? 'danger'
    : secondsLeft <= 60 ? 'warn'
    : '';

  return (
    <motion.div
      className="guest-phone"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
    >
      <div className="guest-topbar">
        <motion.button className="guest-back" onClick={onExit} whileTap={{ scale: 0.9 }}>
          <ArrowLeft size={16} />
        </motion.button>
        <div className="guest-eyebrow-pill">
          <Clock size={11} />
          {level.name}
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="timed-top">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
          {idx + 1}/{TOTAL}
        </div>
        <div className="timed-progress">
          <div className="timed-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className={`timed-chrono ${chronoClass}`}>
          {DURATION_SEC === null ? '—' : formatTime(secondsLeft)}
        </div>
      </div>

      <div className="timed-stepper">
        {Array.from({ length: TOTAL }, (_, i) => {
          let cls = '';
          if (i < results.length) cls = results[i] ? 'ok' : 'ko';
          else if (i === idx) cls = 'current';
          return <div key={i} className={`timed-stepper-dot ${cls}`} />;
        })}
      </div>

      <div className="gq-meta">
        <span>R1 §{q.chapitre}</span>
        <span className="gq-meta-dot" />
        <span>{q.theme}</span>
        <span className="gq-meta-dot" />
        <span>Éd. {q.edition}</span>
      </div>

      <motion.div
        key={`q-${idx}`}
        className="gq-card"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="gq-text">{q.enonce}</p>
      </motion.div>

      <div className="gq-props">
        {q.propositions.map((p, i) => {
          const isSel = selected === i;
          const isThisCorrect = validated && i === q.bonneReponse;
          const isThisWrong = validated && isSel && !isCorrect;
          const cls = isThisCorrect ? 'correct' : isThisWrong ? 'wrong' : '';
          const letter = ['A', 'B', 'C', 'D', 'E'][i];
          return (
            <motion.button
              key={i}
              className={`gq-prop ${cls}`}
              onClick={() => handleSelect(i)}
              whileTap={!validated ? { scale: 0.985 } : {}}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.04 }}
              disabled={validated}
            >
              <span className="gq-letter">{letter}</span>
              <span>{p}</span>
              <span className="gq-result">
                {isThisCorrect && <Check size={16} strokeWidth={3} />}
                {isThisWrong && <X size={16} strokeWidth={3} />}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {validated && (
          <motion.div
            className={`gq-feedback ${isCorrect ? 'ok' : 'ko'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          >
            <div className="gq-feedback-tag">
              {isCorrect ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {isCorrect ? 'Bonne réponse' : 'Mauvaise réponse'}
              {DURATION_SEC !== null && <span style={{ marginLeft: 'auto', opacity: 0.7 }}>⏸ chrono en pause</span>}
            </div>
            <div className="gq-feedback-text">{q.explication}</div>
            <div className="gq-feedback-ref">{q.reference}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {validated && (
          <motion.button
            className="gq-next"
            onClick={handleNext}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
          >
            {idx + 1 < TOTAL ? 'Question suivante' : 'Voir le résultat'}
            <ArrowRight size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// RESULTS + SHARE
// ============================================================================
function ResultsScreen({ result, level, modeId, onRetry, onChangeMode, onChangeAll, onExit }) {
  const { score, total, timeSec, isSurvival, timeoutHit } = result;
  const [shareFallbackOpen, setShareFallbackOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const modeLabel = isSurvival ? 'Mort Subite' : '10 minutes chrono';
  const message = (() => {
    if (isSurvival) {
      if (score === 0) return "Pas de chance ! La 1ʳᵉ question a été fatale.";
      if (score < 5) return "Un bon début. La R1 réserve des surprises.";
      if (score < 10) return "Solide ! Tu commences à bien connaître ton sujet.";
      if (score < 20) return "Beau combo. Tu maîtrises clairement.";
      return "Performance exceptionnelle. Niveau vérificateur confirmé.";
    } else {
      const ratio = score / total;
      if (timeoutHit) return "Le temps est écoulé. Réessaie avec un meilleur tempo.";
      if (ratio === 1) return "Sans-faute. Chapeau.";
      if (ratio >= 0.8) return "Très bon résultat, à quelques détails près.";
      if (ratio >= 0.5) return "Bonne base, encore quelques zones à revoir.";
      return "À retravailler. Pas grave, l'exercice paie sur la durée.";
    }
  })();

  const shareText = buildGuestShareText({
    mode: modeLabel,
    levelName: level.name,
    score,
    total,
    timeSec,
    isSurvival,
  });

  const handleShare = async () => {
    const r = await shareResult({
      title: 'Quiz APSAD R1 — mon score',
      text: shareText,
    });
    if (r.method === 'native' && r.ok) {
      // OK, rien à faire — iOS a montré son sheet
    } else if (r.method === 'fallback') {
      setShareFallbackOpen(true);
    }
    // Si cancelled, on ne fait rien
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareText);
    setShareFallbackOpen(false);
    setToast({ kind: ok ? 'success' : 'error', text: ok ? 'Texte copié' : 'Échec de la copie' });
  };

  return (
    <motion.div
      className="guest-phone"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="guest-topbar">
        <motion.button className="guest-back" onClick={onExit} whileTap={{ scale: 0.9 }} aria-label="Quitter">
          <X size={16} />
        </motion.button>
        <div className="guest-eyebrow-pill">
          <UserCircle2 size={11} />
          {level.name}
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="results-eyebrow">
        {isSurvival ? 'Mort Subite' : timeoutHit ? 'Temps écoulé' : '10 minutes chrono'}
      </div>
      <motion.div
        className="results-score"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 16 }}
      >
        {isSurvival ? (
          <span>{score}</span>
        ) : (
          <>
            <span>{score}</span>
            <span className="sep">/</span>
            <span className="total">{total}</span>
          </>
        )}
      </motion.div>

      {!isSurvival && timeSec !== null && (
        <div className="results-subscore">
          Terminé en <strong>{formatTime(timeSec)}</strong>
        </div>
      )}
      {isSurvival && (
        <div className="results-subscore">
          {score === 0 ? 'Aucune bonne réponse' : score === 1 ? '1 bonne réponse d\'affilée' : `${score} bonnes réponses d'affilée`}
        </div>
      )}

      <p className="results-message">{message}</p>

      <motion.button
        className="share-cta"
        onClick={handleShare}
        whileTap={{ scale: 0.985 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Share2 size={18} />
        Partager mon score
      </motion.button>

      <div className="secondary-actions">
        <motion.button
          className="secondary-btn"
          onClick={onRetry}
          whileTap={{ scale: 0.985 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <RotateCcw size={14} />
          Réessayer
        </motion.button>
        <motion.button
          className="secondary-btn"
          onClick={onChangeMode}
          whileTap={{ scale: 0.985 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <ArrowLeft size={14} />
          Autre mode
        </motion.button>
      </div>

      <motion.button
        className="secondary-btn"
        style={{ marginTop: 4 }}
        onClick={onExit}
        whileTap={{ scale: 0.985 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        Quitter le mode invité
      </motion.button>

      {/* Share fallback */}
      <AnimatePresence>
        {shareFallbackOpen && (
          <>
            <motion.div
              key="bd"
              className="share-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareFallbackOpen(false)}
            />
            <motion.div
              key="ss"
              className="share-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              <div className="share-card">
                <h3 className="share-title">Partager via</h3>
                <div className="share-options">
                  <a
                    className="share-opt"
                    href={buildMailtoUrl({ subject: 'Quiz APSAD R1 — mon score', body: shareText })}
                    onClick={() => setShareFallbackOpen(false)}
                  >
                    <div className="share-opt-icon"><Mail size={16} /></div>
                    <span>Mail</span>
                  </a>
                  <a
                    className="share-opt"
                    href={buildSmsUrl({ body: shareText })}
                    onClick={() => setShareFallbackOpen(false)}
                  >
                    <div className="share-opt-icon"><MessageSquare size={16} /></div>
                    <span>SMS / Messages</span>
                  </a>
                  <button className="share-opt" onClick={handleCopy} style={{ cursor: 'pointer' }}>
                    <div className="share-opt-icon"><Copy size={16} /></div>
                    <span>Copier le texte</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.text}
            className={`guest-toast ${toast.kind === 'success' ? 'success' : ''}`}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            {toast.kind === 'success' ? <Check size={14} /> : <X size={14} />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// NO QUESTIONS (fallback si catalogue vide ou bank vide)
// ============================================================================
function NoQuestionsScreen({ onExit }) {
  return (
    <motion.div
      className="guest-phone"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="guest-topbar">
        <motion.button className="guest-back" onClick={onExit} whileTap={{ scale: 0.9 }}>
          <ArrowLeft size={16} />
        </motion.button>
        <div style={{ width: 38 }} />
        <div style={{ width: 38 }} />
      </div>

      <div className="guest-hero" style={{ marginTop: 60, textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--text-3)', margin: '0 auto 16px' }} />
        <h1 className="guest-hero-title">Pas de questions<br/>pour ce niveau</h1>
        <p className="guest-hero-sub">Le catalogue ne contient pas encore de questions pour cette difficulté. Choisis un autre niveau.</p>
      </div>

      <button className="secondary-btn" onClick={onExit} style={{ marginTop: 16 }}>
        <ArrowLeft size={14} />
        Retour
      </button>
    </motion.div>
  );
}

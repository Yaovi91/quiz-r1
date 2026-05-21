// src/components/sprint/SprintScreen.jsx
// Sprint perso : 3/5/7 min, scoring +2/-3/-1, XP pondéré, records, récap final.
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Clock, Share2, RotateCcw,
  X, Check, Trophy, CheckCircle2, XCircle, Sparkles,
  SkipForward, Plus, Minus, ListChecks, Award, Zap,
  ChevronDown,
} from 'lucide-react';
import { computeSprintXp } from '../../lib/sprintXp.js';
import {
  loadSprintRecords, maybeUpdateRecord,
  incrementSprintCounter, loadSprintCounters,
  evaluateSprintBadges, SPRINT_BADGES,
} from '../../lib/sprintStats.js';
import { formatTime } from '../../lib/share.js';

const SPRINT_SCORING = { good: 2, bad: -3, skip: -1 };
const SPRINT_DURATIONS = [1, 3, 5, 7];

// ============================================================================
// CSS LOCAL
// ============================================================================
const SPRINT_CSS = `
  .sprint-phone {
    width: 100%;
    max-width: 420px;
    min-height: 100vh;
    position: relative;
    z-index: 2;
    /* Lot 3b.2 fix — respecter la status bar iPhone */
    padding: calc(env(safe-area-inset-top, 0) + 16px) 16px 120px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--text-1);
    font-family: var(--font-body);
  }
  .sprint-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 4px 2px;
  }
  .sprint-back {
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
  .sprint-eyebrow-pill {
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
  .sprint-hero { padding: 6px 4px; }
  .sprint-hero-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-3);
    font-weight: 500;
    margin-bottom: 6px;
  }
  .sprint-hero-title {
    font-family: var(--font-display);
    font-size: 38px;
    line-height: 1.05;
    font-weight: 400;
    margin: 0 0 8px;
    letter-spacing: -0.01em;
  }
  .sprint-hero-title em {
    font-style: italic;
    color: var(--accent);
  }
  .sprint-hero-sub {
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.4;
    margin: 0;
  }

  /* === Picker durée === */
  .duration-picker-card {
    padding: 20px;
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(245,158,11,0.06), var(--surface-1));
    border: 1px solid rgba(245,158,11,0.22);
  }
  .duration-picker-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }
  .duration-picker-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(245,158,11,0.14);
    color: var(--accent);
    display: grid;
    place-items: center;
  }
  .duration-picker-title {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 24px;
    line-height: 1;
    margin: 0;
  }
  .duration-picker-desc {
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.4;
    margin: 10px 0 14px;
  }
  .duration-rules {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .duration-rule-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 9px;
    border-radius: 999px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
  }
  .duration-rule-pill.good { color: var(--success); border-color: rgba(16,185,129,0.25); }
  .duration-rule-pill.bad { color: var(--danger); border-color: rgba(230,57,70,0.25); }
  .duration-row-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-3);
    font-weight: 600;
    margin-bottom: 8px;
  }
  .duration-row-perso {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .duration-btn-perso {
    padding: 12px 4px;
    border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--text-1);
    font-family: inherit;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    transition: all 0.15s ease;
    min-height: 80px;
    position: relative;
  }
  .duration-btn-perso:active { transform: scale(0.97); }
  .duration-btn-perso .dur-num {
    font-family: var(--font-display);
    font-size: 24px;
    font-style: italic;
    line-height: 1;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .duration-btn-perso .dur-unit {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-3);
    font-family: var(--font-mono);
  }
  .duration-btn-perso .dur-record {
    margin-top: 4px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-3);
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--surface-3);
  }
  .duration-btn-perso .dur-record.has {
    color: var(--accent);
    background: rgba(245,158,11,0.1);
  }
  .duration-btn-perso .dur-mult {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-3);
    margin-top: 2px;
  }

  /* === Sprint en cours === */
  .sprint-top {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 6px 4px;
  }
  .sprint-score-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sprint-score-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-3);
    font-weight: 600;
    font-family: var(--font-mono);
  }
  .sprint-score-num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 38px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    color: var(--text-1);
    transition: color 0.3s ease;
  }
  .sprint-score-num.positive { color: var(--success); }
  .sprint-score-num.negative { color: var(--danger); }
  .sprint-chrono {
    text-align: right;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.02em;
    transition: color 0.3s ease;
  }
  .sprint-chrono.warn { color: var(--accent); }
  .sprint-chrono.danger {
    color: var(--danger);
    animation: pulse-danger 0.8s ease-in-out infinite;
  }
  @keyframes pulse-danger {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .sprint-progress {
    height: 3px;
    border-radius: 999px;
    background: var(--surface-3);
    overflow: hidden;
    margin: -4px 0 2px;
  }
  .sprint-progress-fill {
    height: 100%;
    background: var(--accent);
    transition: width 1s linear;
  }
  .sprint-counters {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
  }
  .sprint-counter-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    font-variant-numeric: tabular-nums;
  }
  .sprint-counter-chip.good { color: var(--success); }
  .sprint-counter-chip.bad { color: var(--danger); }

  /* Question */
  .sq-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
    padding: 0 4px;
  }
  .sq-meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 999px;
    background: var(--text-3);
  }
  .sq-card {
    padding: 18px 20px;
    border-radius: 18px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border);
    box-shadow: var(--shadow-2);
  }
  .sq-text {
    font-size: 17px;
    line-height: 1.45;
    margin: 0;
    color: var(--text-1);
  }
  .sq-props {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sq-prop {
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
  .sq-prop:active { background: var(--surface-2); }
  .sq-prop.correct {
    background: linear-gradient(180deg, rgba(16,185,129,0.1), var(--surface-1));
    border-color: rgba(16,185,129,0.4);
  }
  .sq-prop.wrong {
    background: linear-gradient(180deg, rgba(230,57,70,0.1), var(--surface-1));
    border-color: rgba(230,57,70,0.4);
  }
  .sq-letter {
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
  .sq-prop.correct .sq-letter { background: var(--success); color: #fff; }
  .sq-prop.wrong .sq-letter { background: var(--danger); color: #fff; }
  .sq-result {
    color: var(--text-3);
    display: grid;
    place-items: center;
  }
  .sq-prop.correct .sq-result { color: var(--success); }
  .sq-prop.wrong .sq-result { color: var(--danger); }

  .sprint-skip-btn {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    background: var(--surface-1);
    border: 1px dashed var(--border-strong);
    color: var(--text-2);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.15s ease;
  }
  .sprint-skip-btn:active { background: var(--surface-2); }
  .sprint-skip-btn .penalty {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--surface-3);
  }

  .points-flash {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 50;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 88px;
    font-weight: 400;
    text-shadow: 0 0 40px currentColor;
    font-variant-numeric: tabular-nums;
  }
  .points-flash.good { color: var(--success); }
  .points-flash.bad { color: var(--danger); }
  .points-flash.skip { color: var(--text-2); }

  /* Lot 3b.2 fix — overlay Temps écoulé */
  .time-up-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.78);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 24px;
  }
  .time-up-card {
    text-align: center;
    padding: 32px 40px;
    border-radius: 24px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border-strong);
    box-shadow: 0 0 60px rgba(245,158,11,0.2), var(--shadow-2);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--accent);
  }
  .time-up-title {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 32px;
    color: var(--text-1);
  }
  .time-up-sub {
    font-family: var(--font-mono);
    font-size: 14px;
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
  }
  .time-up-sub strong { color: var(--text-1); font-weight: 600; }
  .time-up-score {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 64px;
    line-height: 1;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    margin: 4px 0;
  }
  .time-up-score span {
    font-style: normal;
    font-size: 0.32em;
    color: var(--text-3);
    margin-left: 6px;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    vertical-align: middle;
  }
  .time-up-cta {
    margin-top: 8px;
    padding: 14px 24px;
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
    gap: 8px;
    box-shadow: 0 0 24px rgba(245,158,11,0.3);
  }

  /* === Recap === */
  .recap-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 8px;
  }
  .recap-cell {
    padding: 12px;
    border-radius: 12px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    text-align: center;
  }
  .recap-cell-num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 28px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .recap-cell-num.good { color: var(--success); }
  .recap-cell-num.bad { color: var(--danger); }
  .recap-cell-num.skip { color: var(--text-2); }
  .recap-cell-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-3);
    margin-top: 4px;
    font-family: var(--font-mono);
    font-weight: 600;
  }
  .recap-item {
    padding: 16px;
    border-radius: 16px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .recap-item.skipped { border-style: dashed; }
  .recap-item-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-family: var(--font-mono);
    font-weight: 600;
    align-self: flex-start;
    padding: 3px 8px;
    border-radius: 999px;
  }
  .recap-item-tag.bad {
    color: var(--danger);
    background: rgba(230,57,70,0.1);
  }
  .recap-item-tag.skip {
    color: var(--text-2);
    background: var(--surface-3);
  }
  .recap-item-q {
    font-size: 14px;
    line-height: 1.45;
    color: var(--text-1);
    margin: 0;
  }
  .recap-answer-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    line-height: 1.4;
  }
  .recap-answer-label {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-3);
    font-weight: 600;
  }
  .recap-answer-good { color: var(--success); }
  .recap-answer-bad { color: var(--danger); text-decoration: line-through; }
  .recap-expl {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-2);
    background: var(--surface-2);
    padding: 12px 14px;
    border-radius: 10px;
    border-left: 2px solid var(--accent);
  }
  .recap-ref {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: 0.04em;
  }
  .recap-cta {
    width: 100%;
    padding: 16px;
    border-radius: 16px;
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

  /* === Results perso === */
  .perso-results-eyebrow {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--text-3);
    text-align: center;
    margin-top: 12px;
    font-weight: 600;
  }
  .perso-results-score {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 96px;
    line-height: 1;
    color: var(--accent);
    text-align: center;
    margin: 8px 0 4px;
    font-variant-numeric: tabular-nums;
  }
  .perso-results-score.negative { color: var(--danger); }
  .perso-results-score.zero { color: var(--text-2); }
  .perso-results-score .unit {
    font-style: normal;
    font-size: 0.35em;
    color: var(--text-3);
    margin-left: 8px;
    vertical-align: middle;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .perso-results-subscore {
    text-align: center;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-2);
    margin-top: 4px;
  }
  .perso-results-subscore strong {
    color: var(--text-1);
    font-weight: 600;
  }
  .new-record-banner {
    margin: 14px 0 6px;
    padding: 14px 16px;
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04));
    border: 1px solid rgba(245,158,11,0.32);
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 0 24px rgba(245,158,11,0.15);
  }
  .new-record-banner-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(245,158,11,0.2);
    display: grid;
    place-items: center;
    color: var(--accent);
  }
  .new-record-banner-text {
    flex: 1;
  }
  .new-record-banner-title {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 16px;
    color: var(--accent);
  }
  .new-record-banner-sub {
    font-size: 11px;
    color: var(--text-2);
    font-family: var(--font-mono);
    margin-top: 2px;
  }
  .xp-banner {
    margin: 6px 0;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .xp-banner-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(245,158,11,0.15);
    color: var(--accent);
    display: grid;
    place-items: center;
  }
  .xp-banner-num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 24px;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .xp-banner-label {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .xp-banner-detail {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-2);
    text-align: right;
  }
  .badge-banner {
    margin: 6px 0;
    padding: 14px 16px;
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(245,158,11,0.08), var(--surface-1));
    border: 1px solid rgba(245,158,11,0.22);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .badge-banner-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(245,158,11,0.18);
    color: var(--accent);
    display: grid;
    place-items: center;
  }
  .badge-banner-title {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 16px;
    color: var(--text-1);
  }
  .badge-banner-sub {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    margin-top: 2px;
  }

  .perso-secondary-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 8px;
  }
  .perso-secondary-btn {
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
`;

// ============================================================================
// MAIN — orchestrateur
// ============================================================================
export default function SprintScreen({ catalog, onExit, onXpGain, onSprintComplete }) {
  const [phase, setPhase] = useState('picker'); // picker | run | recap | done
  const [durationMin, setDurationMin] = useState(null);
  const [result, setResult] = useState(null);
  const [xpData, setXpData] = useState(null);
  const [recordsData, setRecordsData] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  // bank : exclure multi et audit (on simplifie)
  const bank = (catalog || []).filter(q => !q.multi);

  const handleStart = (dur) => {
    setDurationMin(dur);
    setPhase('run');
    setResult(null);
    setXpData(null);
    setRecordsData(null);
    setNewBadges([]);
  };

  const handleSprintFinish = (data) => {
    // Calcul XP
    const xp = computeSprintXp({
      score: data.score,
      good: data.good,
      bad: data.bad,
      skipped: data.skipped,
      durationMin: data.durationMin,
    });
    // Record + counter
    const { isNewRecord } = maybeUpdateRecord({
      ...data,
      xpGained: xp.xpTotal,
    });
    const newCounters = incrementSprintCounter(data.durationMin);
    // Badges
    const alreadyUnlocked = new Set(); // l'app passera la liste future, pour l'instant on évalue à froid
    const unlocked = evaluateSprintBadges({
      score: data.score,
      durationMin: data.durationMin,
      counters: newCounters,
      alreadyUnlocked,
    });

    setResult(data);
    setXpData(xp);
    setRecordsData({ isNewRecord });
    setNewBadges(unlocked);

    // Remonter à l'app : XP, etc.
    if (typeof onXpGain === 'function') onXpGain(xp.xpTotal);
    if (typeof onSprintComplete === 'function') {
      onSprintComplete({
        ...data,
        xp: xp.xpTotal,
        isPerfect: xp.isPerfect,
        isNewRecord,
        newBadges: unlocked,
      });
    }

    const hasErrors = (data.history || []).some(h => !h.correct);
    setPhase(hasErrors ? 'recap' : 'done');
  };

  return (
    <>
      <style>{SPRINT_CSS}</style>
      <AnimatePresence mode="wait">
        {phase === 'picker' && (
          <PickerScreen
            key="picker"
            onStart={handleStart}
            onExit={onExit}
          />
        )}
        {phase === 'run' && (
          <SprintRunScreen
            key={`run-${durationMin}`}
            bank={bank}
            durationMin={durationMin}
            onFinish={handleSprintFinish}
            onExit={onExit}
          />
        )}
        {phase === 'recap' && result && (
          <RecapScreen
            key="recap"
            result={result}
            durationMin={durationMin}
            onContinue={() => setPhase('done')}
            onExit={onExit}
          />
        )}
        {phase === 'done' && result && (
          <DoneScreen
            key="done"
            result={result}
            xpData={xpData}
            recordsData={recordsData}
            newBadges={newBadges}
            durationMin={durationMin}
            onRetry={() => handleStart(durationMin)}
            onPickAnother={() => setPhase('picker')}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// PICKER SCREEN — choisir la durée
// ============================================================================
function PickerScreen({ onStart, onExit }) {
  const records = loadSprintRecords();
  const multipliers = { 1: '×2,0', 3: '×1,5', 5: '×1,0', 7: '×0,7' };

  return (
    <motion.div
      className="sprint-phone"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
    >
      <div className="sprint-topbar">
        <motion.button className="sprint-back" onClick={onExit} whileTap={{ scale: 0.9 }} aria-label="Retour">
          <ArrowLeft size={16} />
        </motion.button>
        <div className="sprint-eyebrow-pill">
          <Clock size={11} />
          Sprint
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="sprint-hero">
        <div className="sprint-hero-eyebrow">Mode chronométré</div>
        <h1 className="sprint-hero-title">Un max de <em>points</em><br/>avant la fin du chrono.</h1>
      </div>

      <div className="duration-picker-card">
        <div className="duration-picker-head">
          <div className="duration-picker-icon">
            <Zap size={20} />
          </div>
          <h2 className="duration-picker-title">Choisis ta durée</h2>
        </div>
        <p className="duration-picker-desc">
          Plus la durée est courte, plus chaque point rapporte d'XP.
        </p>
        <div className="duration-rules">
          <span className="duration-rule-pill good">
            <Plus size={11} strokeWidth={2.5} /><span>2 bonne</span>
          </span>
          <span className="duration-rule-pill bad">
            <Minus size={11} strokeWidth={2.5} /><span>3 faute</span>
          </span>
          <span className="duration-rule-pill">
            <SkipForward size={11} strokeWidth={2.5} /><span>−1 passer</span>
          </span>
        </div>

        <div className="duration-row-label">Sélectionne la durée</div>
        <div className="duration-row-perso">
          {SPRINT_DURATIONS.map((d, i) => {
            const rec = records[d];
            return (
              <motion.button
                key={d}
                className="duration-btn-perso"
                onClick={() => onStart(d)}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <span className="dur-num">{d}</span>
                <span className="dur-unit">min</span>
                <span className="dur-mult">{multipliers[d]}</span>
                <span className={`dur-record ${rec ? 'has' : ''}`}>
                  {rec ? (
                    <>
                      <Trophy size={9} strokeWidth={2.5} />
                      {rec.score} pts
                    </>
                  ) : (
                    'Aucun record'
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SPRINT RUN SCREEN
// ============================================================================
function SprintRunScreen({ bank, durationMin, onFinish, onExit }) {
  const DURATION_SEC = durationMin * 60;
  const seenIdsRef = useRef(new Set());
  const historyRef = useRef([]);

  const pickNext = () => {
    if (!bank.length) return null;
    const unseen = bank.filter(q => !seenIdsRef.current.has(q.id));
    const pool = unseen.length > 0 ? unseen : bank;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const [currentQ, setCurrentQ] = useState(() => pickNext());
  const [score, setScore] = useState(0);
  const [good, setGood] = useState(0);
  const [bad, setBad] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [selected, setSelected] = useState(null);
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SEC);
  const [flash, setFlash] = useState(null);
  const finishedRef = useRef(false);
  // Lot 3b.2 fix — stocker onFinish dans une ref pour qu'il ne provoque pas de re-déclenchement de useEffect
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    if (finishedRef.current) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Fin du chrono — appel SYNCHRONE direct dans le useEffect
  // Pas de Promise, pas de setTimeout, pas d'overlay : le parent passe en phase 'recap' ou 'done'
  useEffect(() => {
    if (secondsLeft === 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinishRef.current({
        score, good, bad, skipped,
        questionsAsked: good + bad + skipped,
        history: historyRef.current,
        durationMin,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (!bank.length) {
    return (
      <motion.div className="sprint-phone" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="sprint-topbar">
          <motion.button className="sprint-back" onClick={onExit} whileTap={{ scale: 0.9 }}>
            <ArrowLeft size={16} />
          </motion.button>
          <div style={{ width: 38 }} />
          <div style={{ width: 38 }} />
        </div>
        <div className="sprint-hero" style={{ marginTop: 60, textAlign: 'center' }}>
          <h1 className="sprint-hero-title">Pas de questions disponibles</h1>
        </div>
      </motion.div>
    );
  }
  if (!currentQ) return null;
  const q = currentQ;

  const advance = () => {
    seenIdsRef.current.add(q.id);
    setCurrentQ(pickNext());
    setSelected(null);
    setValidated(false);
    setIsCorrect(false);
  };

  const showFlash = (kind, value) => {
    setFlash({ kind, value });
    setTimeout(() => setFlash(null), 650);
  };

  const handleSelect = (i) => {
    if (validated || finishedRef.current) return;
    setSelected(i);
    const correct = i === q.bonneReponse;
    setTimeout(() => {
      setIsCorrect(correct);
      setValidated(true);
      if (correct) {
        setScore(s => s + SPRINT_SCORING.good);
        setGood(g => g + 1);
        showFlash('good', `+${SPRINT_SCORING.good}`);
      } else {
        setScore(s => s + SPRINT_SCORING.bad);
        setBad(b => b + 1);
        showFlash('bad', `${SPRINT_SCORING.bad}`);
      }
      historyRef.current.push({ q, selectedIdx: i, correct, skipped: false });
      setTimeout(advance, 600);
    }, 250);
  };

  const handleSkip = () => {
    if (validated || finishedRef.current) return;
    setScore(s => s + SPRINT_SCORING.skip);
    setSkipped(sk => sk + 1);
    showFlash('skip', `${SPRINT_SCORING.skip}`);
    historyRef.current.push({ q, selectedIdx: null, correct: false, skipped: true });
    advance();
  };

  const chronoClass = secondsLeft <= 10 ? 'danger'
    : secondsLeft <= 30 ? 'warn'
    : '';
  const scoreClass = score > 0 ? 'positive' : score < 0 ? 'negative' : '';
  const progressPct = ((DURATION_SEC - secondsLeft) / DURATION_SEC) * 100;

  return (
    <motion.div
      className="sprint-phone"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
    >
      <div className="sprint-topbar">
        <motion.button className="sprint-back" onClick={onExit} whileTap={{ scale: 0.9 }}>
          <ArrowLeft size={16} />
        </motion.button>
        <div className="sprint-eyebrow-pill">
          <Clock size={11} /> Sprint {durationMin} min
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="sprint-top">
        <div className="sprint-score-block">
          <span className="sprint-score-label">Score</span>
          <motion.span
            key={score}
            className={`sprint-score-num ${scoreClass}`}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          >
            {score}
          </motion.span>
        </div>
        <div className={`sprint-chrono ${chronoClass}`}>{formatTime(secondsLeft)}</div>
      </div>

      <div className="sprint-progress">
        <div className="sprint-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="sprint-counters">
        <span className="sprint-counter-chip good"><Check size={11} strokeWidth={2.5} /> {good}</span>
        <span className="sprint-counter-chip bad"><X size={11} strokeWidth={2.5} /> {bad}</span>
        <span className="sprint-counter-chip"><SkipForward size={11} strokeWidth={2.5} /> {skipped}</span>
      </div>

      <div className="sq-meta">
        <span>R1 §{q.chapitre}</span>
        <span className="sq-meta-dot" />
        <span>{q.theme}</span>
        <span className="sq-meta-dot" />
        <span>Éd. {q.edition}</span>
      </div>

      <motion.div
        key={`q-${q.id}`}
        className="sq-card"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <p className="sq-text">{q.enonce}</p>
      </motion.div>

      <div className="sq-props">
        {q.propositions.map((p, i) => {
          const isSel = selected === i;
          const isThisCorrect = validated && i === q.bonneReponse;
          const isThisWrong = validated && isSel && !isCorrect;
          const cls = isThisCorrect ? 'correct' : isThisWrong ? 'wrong' : '';
          const letter = ['A', 'B', 'C', 'D', 'E'][i];
          return (
            <motion.button
              key={i}
              className={`sq-prop ${cls}`}
              onClick={() => handleSelect(i)}
              whileTap={!validated ? { scale: 0.985 } : {}}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + i * 0.03 }}
              disabled={validated || finishedRef.current}
            >
              <span className="sq-letter">{letter}</span>
              <span>{p}</span>
              <span className="sq-result">
                {isThisCorrect && <Check size={16} strokeWidth={3} />}
                {isThisWrong && <X size={16} strokeWidth={3} />}
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        className="sprint-skip-btn"
        onClick={handleSkip}
        whileTap={{ scale: 0.985 }}
        disabled={validated || finishedRef.current}
        initial={{ opacity: 0 }}
        animate={{ opacity: validated ? 0.3 : 1 }}
      >
        <SkipForward size={14} />
        Passer cette question
        <span className="penalty">−1</span>
      </motion.button>

      <AnimatePresence>
        {flash && (
          <motion.div
            key={`flash-${flash.value}-${Date.now()}`}
            className={`points-flash ${flash.kind}`}
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: -10 }}
            exit={{ scale: 1.1, opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          >
            {flash.value}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// RECAP SCREEN
// ============================================================================
function RecapScreen({ result, durationMin, onContinue, onExit }) {
  const { good, bad, skipped, history } = result;
  const toReview = (history || []).filter(h => !h.correct);

  return (
    <motion.div
      className="sprint-phone"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="sprint-topbar">
        <motion.button className="sprint-back" onClick={onExit} whileTap={{ scale: 0.9 }}>
          <X size={16} />
        </motion.button>
        <div className="sprint-eyebrow-pill">
          <ListChecks size={11} />
          Récap · Sprint {durationMin} min
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="sprint-hero">
        <div className="sprint-hero-eyebrow">À revoir</div>
        <h1 className="sprint-hero-title">Les <em>questions ratées</em></h1>
      </div>

      <div className="recap-summary">
        <div className="recap-cell">
          <div className="recap-cell-num good">{good}</div>
          <div className="recap-cell-label">Bonnes</div>
        </div>
        <div className="recap-cell">
          <div className="recap-cell-num bad">{bad}</div>
          <div className="recap-cell-label">Fautes</div>
        </div>
        <div className="recap-cell">
          <div className="recap-cell-num skip">{skipped}</div>
          <div className="recap-cell-label">Passées</div>
        </div>
      </div>

      {toReview.map((h, idx) => {
        const q = h.q;
        const letter = ['A', 'B', 'C', 'D', 'E'];
        const goodAns = q.propositions[q.bonneReponse];
        const userAns = h.selectedIdx !== null ? q.propositions[h.selectedIdx] : null;
        return (
          <motion.div
            key={`${q.id}-${idx}`}
            className={`recap-item ${h.skipped ? 'skipped' : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + idx * 0.05 }}
          >
            <span className={`recap-item-tag ${h.skipped ? 'skip' : 'bad'}`}>
              {h.skipped ? <SkipForward size={10} strokeWidth={2.5} /> : <XCircle size={10} />}
              {h.skipped ? 'Passée' : 'Faute'}
              <span style={{ opacity: 0.6, marginLeft: 6 }}>· R1 §{q.chapitre}</span>
            </span>
            <p className="recap-item-q">{q.enonce}</p>

            {!h.skipped && userAns && (
              <div className="recap-answer-row">
                <span className="recap-answer-label">Ta réponse</span>
                <span className="recap-answer-bad">{letter[h.selectedIdx]}. {userAns}</span>
              </div>
            )}

            <div className="recap-answer-row">
              <span className="recap-answer-label">Bonne réponse</span>
              <span className="recap-answer-good">
                <strong>{letter[q.bonneReponse]}.</strong> {goodAns}
              </span>
            </div>

            <div className="recap-expl">{q.explication}</div>
            <div className="recap-ref">{q.reference}</div>
          </motion.div>
        );
      })}

      <motion.button
        className="recap-cta"
        onClick={onContinue}
        whileTap={{ scale: 0.985 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + toReview.length * 0.05 }}
      >
        Voir mon score
        <ArrowRight size={16} />
      </motion.button>
    </motion.div>
  );
}

// ============================================================================
// DONE SCREEN — score final + XP + records + badges
// ============================================================================
function DoneScreen({ result, xpData, recordsData, newBadges, durationMin, onRetry, onPickAnother, onExit }) {
  const { score, good, bad, skipped } = result;
  const scoreClass = score < 0 ? 'negative' : score === 0 ? 'zero' : '';

  return (
    <motion.div
      className="sprint-phone"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="sprint-topbar">
        <motion.button className="sprint-back" onClick={onExit} whileTap={{ scale: 0.9 }}>
          <X size={16} />
        </motion.button>
        <div className="sprint-eyebrow-pill">
          <Clock size={11} /> Sprint {durationMin} min
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="perso-results-eyebrow">Score final</div>
      <motion.div
        className={`perso-results-score ${scoreClass}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
      >
        <span>{score}</span>
        <span className="unit">pts</span>
      </motion.div>

      <div className="perso-results-subscore">
        <strong>{good}</strong> bonnes · <strong>{bad}</strong> fautes · <strong>{skipped}</strong> passées
      </div>

      {recordsData?.isNewRecord && (
        <motion.div
          className="new-record-banner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 220 }}
        >
          <div className="new-record-banner-icon">
            <Trophy size={18} />
          </div>
          <div className="new-record-banner-text">
            <div className="new-record-banner-title">Nouveau record !</div>
            <div className="new-record-banner-sub">Meilleur score Sprint {durationMin} min</div>
          </div>
        </motion.div>
      )}

      {xpData && (
        <motion.div
          className="xp-banner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="xp-banner-icon">
            <Zap size={18} />
          </div>
          <div>
            <div className="xp-banner-num">+{xpData.xpTotal}</div>
            <div className="xp-banner-label">XP gagnés</div>
          </div>
          <div className="xp-banner-detail">
            {xpData.xpBase} base
            {xpData.xpBonus > 0 && (
              <><br/>+{xpData.xpBonus} parfait</>
            )}
          </div>
        </motion.div>
      )}

      {newBadges.map((badgeId, i) => {
        const b = SPRINT_BADGES[badgeId];
        if (!b) return null;
        return (
          <motion.div
            key={badgeId}
            className="badge-banner"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 220 }}
          >
            <div className="badge-banner-icon">
              <Award size={18} />
            </div>
            <div>
              <div className="badge-banner-title">{b.name}</div>
              <div className="badge-banner-sub">{b.desc}</div>
            </div>
          </motion.div>
        );
      })}

      <div className="perso-secondary-actions">
        <motion.button
          className="perso-secondary-btn"
          onClick={onRetry}
          whileTap={{ scale: 0.985 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <RotateCcw size={14} />
          Refaire {durationMin} min
        </motion.button>
        <motion.button
          className="perso-secondary-btn"
          onClick={onPickAnother}
          whileTap={{ scale: 0.985 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          <Clock size={14} />
          Autre durée
        </motion.button>
      </div>

      <motion.button
        className="perso-secondary-btn"
        style={{ marginTop: 4 }}
        onClick={onExit}
        whileTap={{ scale: 0.985 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
      >
        Retour à l'accueil
      </motion.button>
    </motion.div>
  );
}

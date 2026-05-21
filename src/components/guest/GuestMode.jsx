// src/components/guest/GuestMode.jsx
// Mode Invité — isolation totale des stats perso.
// Flow : LevelPicker → ModePicker (avec durée Sprint) → Survival OU Sprint → Recap (si erreurs) → Results
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Skull, Clock, Share2, RotateCcw,
  X, Check, Trophy, CheckCircle2, XCircle, UserCircle2,
  Sparkles, AlertCircle, Copy, Mail, MessageSquare,
  SkipForward, Plus, Minus, ChevronDown, ListChecks,
} from 'lucide-react';
import {
  GUEST_LEVELS, GUEST_LEVEL_LIST,
  filterByGuestLevel, pickGuestQuestion,
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
    /* Lot 3b.2 fix — respecter la status bar iPhone */
    padding: calc(env(safe-area-inset-top, 0) + 16px) 16px 120px;
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

  .guest-hero { padding: 6px 4px; }
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
  .level-list { display: flex; flex-direction: column; gap: 10px; }
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
  .level-card:active { background: var(--surface-2); }
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
    font-family: inherit;
    color: var(--text-1);
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .mode-card-guest.is-button {
    cursor: pointer;
    width: 100%;
  }
  .mode-card-guest.is-button:active { background: var(--surface-2); }
  .mode-card-guest.survival {
    background: linear-gradient(180deg, rgba(230,57,70,0.06), var(--surface-1));
    border-color: rgba(230,57,70,0.22);
  }
  .mode-card-guest.sprint {
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
  .mode-card-guest.sprint .mode-icon-box {
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
  .scoring-rules {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }
  .scoring-pill {
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
  .scoring-pill.good { color: var(--success); border-color: rgba(16,185,129,0.25); }
  .scoring-pill.bad { color: var(--danger); border-color: rgba(230,57,70,0.25); }
  .scoring-pill.skip { color: var(--text-2); }
  .scoring-pill svg { opacity: 0.85; }

  .duration-row-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-3);
    font-weight: 600;
    margin-bottom: 8px;
  }
  .duration-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .duration-btn {
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
    gap: 2px;
    transition: all 0.15s ease;
    min-height: 56px;
  }
  .duration-btn:active { transform: scale(0.97); }
  .duration-btn .dur-num {
    font-family: var(--font-display);
    font-size: 22px;
    font-style: italic;
    line-height: 1;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .duration-btn .dur-unit {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-3);
    font-family: var(--font-mono);
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

  /* Bouton Passer */
  .skip-btn {
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
  .skip-btn:active { background: var(--surface-2); }
  .skip-btn .penalty {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--surface-3);
  }

  /* Flash points (animation +2 / -3 / -1) */
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
  .results-score.negative { color: var(--danger); }
  .results-score.zero { color: var(--text-2); }
  .results-score .unit {
    font-style: normal;
    font-size: 0.35em;
    color: var(--text-3);
    margin-left: 8px;
    vertical-align: middle;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
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

  /* === Share fallback === */
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
// CONSTANTES SPRINT
// ============================================================================
const SPRINT_SCORING = {
  good: 2,
  bad: -3,
  skip: -1,
};
const SPRINT_DURATIONS = [1, 3, 5, 7]; // minutes

// ============================================================================
// MAIN — orchestrateur des écrans
// ============================================================================
export default function GuestMode({ catalog, onExit }) {
  const [phase, setPhase] = useState('level'); // level | mode | survival | sprint | recap | results
  const [levelId, setLevelId] = useState(null);
  const [modeId, setModeId] = useState(null); // 'survival' | 'sprint'
  const [sprintDuration, setSprintDuration] = useState(5); // minutes
  const [result, setResult] = useState(null);

  const level = levelId ? GUEST_LEVELS[levelId] : null;

  const bank = useMemo(() => {
    if (!catalog || !levelId) return [];
    return filterByGuestLevel(catalog, levelId, { excludeMulti: true, excludeAudit: true });
  }, [catalog, levelId]);

  const handleSelectLevel = (id) => {
    setLevelId(id);
    setPhase('mode');
  };

  const handleSelectSurvival = () => {
    setModeId('survival');
    setPhase('survival');
  };

  const handleSelectSprint = (durationMin) => {
    setModeId('sprint');
    setSprintDuration(durationMin);
    setPhase('sprint');
  };

  const handleSprintFinish = (data) => {
    setResult(data);
    // S'il y a au moins une erreur OU un skip, on passe par le récap
    const hasErrors = (data.history || []).some(h => !h.correct);
    if (hasErrors) {
      setPhase('recap');
    } else {
      setPhase('results');
    }
  };

  const handleSurvivalFinish = (data) => {
    setResult(data);
    setPhase('results');
  };

  const handleSkipRecap = () => {
    setPhase('results');
  };

  const handleRetry = () => {
    setResult(null);
    if (modeId === 'survival') setPhase('survival');
    else if (modeId === 'sprint') setPhase('sprint');
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
            sprintDuration={sprintDuration}
            onSelectSurvival={handleSelectSurvival}
            onSelectSprint={handleSelectSprint}
            onBack={() => setPhase('level')}
          />
        )}
        {phase === 'survival' && (
          <SurvivalGuestScreen
            key="survival"
            level={level}
            bank={bank}
            onFinish={handleSurvivalFinish}
            onExit={handleChangeAll}
          />
        )}
        {phase === 'sprint' && (
          <SprintGuestScreen
            key="sprint"
            level={level}
            bank={bank}
            durationMin={sprintDuration}
            onFinish={handleSprintFinish}
            onExit={handleChangeAll}
          />
        )}
        {phase === 'recap' && result && (
          <RecapScreen
            key="recap"
            result={result}
            level={level}
            durationMin={sprintDuration}
            onContinue={handleSkipRecap}
            onExit={handleChangeAll}
          />
        )}
        {phase === 'results' && result && (
          <ResultsScreen
            key="results"
            result={result}
            level={level}
            modeId={modeId}
            durationMin={sprintDuration}
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
// MODE PICKER (avec sélecteur durée Sprint)
// ============================================================================
function ModePickerScreen({ level, sprintDuration, onSelectSurvival, onSelectSprint, onBack }) {
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
        {/* Mort Subite — toute la carte cliquable */}
        <motion.button
          className="mode-card-guest survival is-button"
          onClick={onSelectSurvival}
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

        {/* Sprint — carte descriptive + 3 boutons durée */}
        <motion.div
          className="mode-card-guest sprint"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <div className="mode-card-guest-head">
            <div className="mode-icon-box">
              <Clock size={20} />
            </div>
            <h2 className="mode-card-guest-title">Sprint</h2>
          </div>
          <p className="mode-card-guest-desc">
            Marque un maximum de points avant la fin du chrono. Récap des erreurs à la fin.
          </p>

          <div className="scoring-rules">
            <span className="scoring-pill good">
              <Plus size={11} strokeWidth={2.5} />
              <span>2 bonne</span>
            </span>
            <span className="scoring-pill bad">
              <Minus size={11} strokeWidth={2.5} />
              <span>3 faute</span>
            </span>
            <span className="scoring-pill skip">
              <SkipForward size={11} strokeWidth={2.5} />
              <span>−1 passer</span>
            </span>
          </div>

          <div className="duration-row-label">Choisis la durée</div>
          <div className="duration-row">
            {SPRINT_DURATIONS.map((d, i) => (
              <motion.button
                key={d}
                className="duration-btn"
                onClick={() => onSelectSprint(d)}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.06 }}
              >
                <span className="dur-num">{d}</span>
                <span className="dur-unit">min</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SURVIVAL GUEST (inchangé fonctionnellement, juste cohérence visuelle)
// ============================================================================
function SurvivalGuestScreen({ level, bank, onFinish, onExit }) {
  const [seenIds] = useState(() => new Set());
  const [currentQ, setCurrentQ] = useState(() => pickGuestQuestion(bank, seenIds));
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!bank || bank.length === 0) {
    return <NoQuestionsScreen onExit={onExit} />;
  }
  if (!currentQ) return null;

  const q = currentQ;

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
        seenIds.add(q.id);
        setTimeout(() => {
          setCurrentQ(pickGuestQuestion(bank, seenIds));
          setSelected(null);
          setValidated(false);
        }, 700);
      } else {
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
        key={`q-${q.id}`}
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
// SPRINT GUEST — nouveau mode scoré
// ============================================================================
function SprintGuestScreen({ level, bank, durationMin, onFinish, onExit }) {
  const DURATION_SEC = durationMin * 60;

  const seenIdsRef = useRef(new Set());
  const historyRef = useRef([]);
  const [currentQ, setCurrentQ] = useState(() => pickGuestQuestion(bank, seenIdsRef.current));
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
  // Lot 3b.2 fix — onFinish stable via ref
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // Tick chrono
  useEffect(() => {
    if (finishedRef.current) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Fin du chrono — appel SYNCHRONE direct
  useEffect(() => {
    if (secondsLeft === 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinishRef.current({
        score,
        good,
        bad,
        skipped,
        questionsAsked: good + bad + skipped,
        history: historyRef.current,
        durationMin,
        isSurvival: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (!bank || bank.length === 0) {
    return <NoQuestionsScreen onExit={onExit} />;
  }
  if (!currentQ) return null;

  const q = currentQ;
  const progressPct = ((DURATION_SEC - secondsLeft) / DURATION_SEC) * 100;

  const advance = () => {
    seenIdsRef.current.add(q.id);
    const next = pickGuestQuestion(bank, seenIdsRef.current);
    setCurrentQ(next);
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
      historyRef.current.push({
        q,
        selectedIdx: i,
        correct,
        skipped: false,
      });
      // Avancer après un flash bref
      setTimeout(advance, 600);
    }, 250);
  };

  const handleSkip = () => {
    if (validated || finishedRef.current) return;
    setScore(s => s + SPRINT_SCORING.skip);
    setSkipped(sk => sk + 1);
    showFlash('skip', `${SPRINT_SCORING.skip}`);
    historyRef.current.push({
      q,
      selectedIdx: null,
      correct: false,
      skipped: true,
    });
    advance();
  };

  const chronoClass = secondsLeft <= 10 ? 'danger'
    : secondsLeft <= 30 ? 'warn'
    : '';

  const scoreClass = score > 0 ? 'positive' : score < 0 ? 'negative' : '';

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
          Sprint {durationMin} min · {level.name}
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
            {score >= 0 ? score : score}
          </motion.span>
        </div>
        <div className={`sprint-chrono ${chronoClass}`}>
          {formatTime(secondsLeft)}
        </div>
      </div>

      <div className="sprint-progress">
        <div className="sprint-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="sprint-counters">
        <span className="sprint-counter-chip good">
          <Check size={11} strokeWidth={2.5} /> {good}
        </span>
        <span className="sprint-counter-chip bad">
          <X size={11} strokeWidth={2.5} /> {bad}
        </span>
        <span className="sprint-counter-chip">
          <SkipForward size={11} strokeWidth={2.5} /> {skipped}
        </span>
      </div>

      <div className="gq-meta">
        <span>R1 §{q.chapitre}</span>
        <span className="gq-meta-dot" />
        <span>{q.theme}</span>
        <span className="gq-meta-dot" />
        <span>Éd. {q.edition}</span>
      </div>

      <motion.div
        key={`q-${q.id}`}
        className="gq-card"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
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
              transition={{ delay: 0.04 + i * 0.03 }}
              disabled={validated || finishedRef.current}
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

      <motion.button
        className="skip-btn"
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

      {/* Flash points */}
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
// RECAP SCREEN — affichée s'il y a des erreurs/skips
// ============================================================================
function RecapScreen({ result, level, durationMin, onContinue, onExit }) {
  const { good, bad, skipped, history } = result;
  // On garde uniquement les questions à revoir (erreurs + skips)
  const toReview = (history || []).filter(h => !h.correct);

  return (
    <motion.div
      className="guest-phone"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="guest-topbar">
        <motion.button className="guest-back" onClick={onExit} whileTap={{ scale: 0.9 }}>
          <X size={16} />
        </motion.button>
        <div className="guest-eyebrow-pill">
          <ListChecks size={11} />
          Récap · Sprint {durationMin} min
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="guest-hero">
        <div className="guest-hero-eyebrow">À revoir · {level.name}</div>
        <h1 className="guest-hero-title">Les <em>questions ratées</em></h1>
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
                <span className="recap-answer-bad">
                  {letter[h.selectedIdx]}. {userAns}
                </span>
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
// RESULTS + SHARE
// ============================================================================
function ResultsScreen({ result, level, modeId, durationMin, onRetry, onChangeMode, onChangeAll, onExit }) {
  const { score, good, bad, skipped, questionsAsked, isSurvival } = result;
  const [shareFallbackOpen, setShareFallbackOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const modeLabel = isSurvival ? 'Mort Subite' : `Sprint ${durationMin} min`;

  const message = (() => {
    if (isSurvival) {
      if (score === 0) return "Pas de chance ! La 1ʳᵉ question a été fatale.";
      if (score < 5) return "Un bon début. La R1 réserve des surprises.";
      if (score < 10) return "Solide ! Tu commences à bien connaître ton sujet.";
      if (score < 20) return "Beau combo. Tu maîtrises clairement.";
      return "Performance exceptionnelle. Niveau vérificateur confirmé.";
    } else {
      const total = questionsAsked || (good + bad + skipped);
      if (total === 0) return "Aucune question répondue. Réessaie !";
      if (score < 0) return "Score négatif. Mieux vaut passer que de tenter à l'aveugle.";
      if (score === 0) return "Score nul. Tu compensais les bonnes par les fautes.";
      const maxScore = total * 2;
      const ratio = score / maxScore;
      if (ratio >= 0.9) return "Performance d'élite. Tu joues sur du velours.";
      if (ratio >= 0.7) return "Excellent score. Très bon rythme de réflexion.";
      if (ratio >= 0.5) return "Bon résultat. Tu sais quand tenter et quand passer.";
      if (ratio >= 0.3) return "À retravailler. Trop de questions tentées trop vite.";
      return "Reste de la marge. La prochaine sera meilleure.";
    }
  })();

  const shareText = buildGuestShareText({
    mode: modeLabel,
    levelName: level.name,
    score,
    good,
    bad,
    skipped,
    questionsAsked,
    durationMin: isSurvival ? null : durationMin,
    isSurvival,
  });

  const handleShare = async () => {
    const r = await shareResult({
      title: 'Quiz APSAD R1 — mon score',
      text: shareText,
    });
    if (r.method === 'fallback') {
      setShareFallbackOpen(true);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareText);
    setShareFallbackOpen(false);
    setToast({ kind: ok ? 'success' : 'error', text: ok ? 'Texte copié' : 'Échec de la copie' });
  };

  const scoreClass = isSurvival
    ? ''
    : score < 0 ? 'negative'
    : score === 0 ? 'zero'
    : '';

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
        {isSurvival ? 'Mort Subite' : `Sprint ${durationMin} min`}
      </div>
      <motion.div
        className={`results-score ${scoreClass}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 16 }}
      >
        <span>{score}</span>
        {!isSurvival && <span className="unit">pts</span>}
      </motion.div>

      {!isSurvival && (
        <div className="results-subscore">
          <strong>{good}</strong> bonnes · <strong>{bad}</strong> fautes · <strong>{skipped}</strong> passées
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
// NO QUESTIONS
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

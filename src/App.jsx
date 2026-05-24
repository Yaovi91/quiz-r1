import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Zap, Trophy, Target, ChevronRight, Sparkles, Check, X,
  ArrowRight, Award, BookOpen, Crosshair, Star, Heart, Calendar,
  TrendingUp, Settings, Plus, CheckCircle2, XCircle, Medal,
  Infinity as InfinityIcon, Wrench, GraduationCap, Sliders,
  UserPlus, Clock,
} from 'lucide-react';
import SettingsSheet from './components/settings/SettingsSheet.jsx';
import GuestMode from './components/guest/GuestMode.jsx';
import SprintScreen from './components/sprint/SprintScreen.jsx';
import {
  loadAppState, saveAppState,
  loadUnlockedBadges, saveUnlockedBadges,
  FIRST_RUN_DEFAULTS,
  DEFAULT_INTERVENTION_RATIOS, DEFAULT_EDITIONS_R1,
} from './lib/appStorage.js';
// Lot INTER — picker multi-référentiels (LIBRE + INTERVENTION)
import { pickQuestion as pickFromCatalogV2 } from './lib/picker.js';

/* =========================================================================
   R1 QUIZZ — Flow Home → Question → Level-up
   Design: technical-refined dark, accent ambre, game-feel maximal
   ========================================================================= */

// ---- TOKENS ---------------------------------------------------------------
const TOKENS = `
  :root {
    --bg: #0A0B0F;
    --bg-2: #0E1015;
    --surface-1: #12141B;
    --surface-2: #181B24;
    --surface-3: #21252F;
    --border: rgba(255,255,255,0.06);
    --border-strong: rgba(255,255,255,0.12);
    --highlight: rgba(255,255,255,0.04);
    --text-1: #F2F3F5;
    --text-2: #98A0AE;
    --text-3: #5A6171;
    --text-4: #3D4250;
    --accent: #F59E0B;
    --accent-glow: #FBBF24;
    --accent-deep: #B45309;
    --accent-soft: rgba(245,158,11,0.14);
    --success: #10B981;
    --success-glow: #34D399;
    --success-soft: rgba(16,185,129,0.14);
    --danger: #E63946;
    --danger-glow: #F87171;
    --danger-soft: rgba(230,57,70,0.14);
    --shadow-1: 0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4);
    --shadow-2: 0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 24px rgba(0,0,0,0.4);
    --shadow-glow-accent: 0 0 0 1px rgba(245,158,11,0.3), 0 0 32px rgba(245,158,11,0.25);
    --shadow-glow-success: 0 0 0 1px rgba(16,185,129,0.3), 0 0 32px rgba(16,185,129,0.2);
    --shadow-glow-danger: 0 0 0 1px rgba(230,57,70,0.3), 0 0 32px rgba(230,57,70,0.2);
    --font-display: 'Instrument Serif', 'Times New Roman', serif;
    --font-body: 'Geist', 'Inter Tight', -apple-system, system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
  }
`;

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body, #root { margin: 0; padding: 0; }
  body { font-family: var(--font-body); color: var(--text-1); -webkit-font-smoothing: antialiased; }

  .app-root {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text-1);
    font-family: var(--font-body);
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    padding: env(safe-area-inset-top, 0) 0 env(safe-area-inset-bottom, 0);
  }

  /* Grain overlay */
  .app-root::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    opacity: 0.35;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }

  /* Radial vignette */
  .app-root::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.05), transparent 50%),
                radial-gradient(ellipse at 50% 100%, rgba(230,57,70,0.04), transparent 50%);
  }

  .phone {
    width: 100%;
    max-width: 420px;
    min-height: 100vh;
    position: relative;
    z-index: 2;
    /* Lot INTER — renforce le dégagement sous status bar / Dynamic Island */
    padding: calc(env(safe-area-inset-top, 0) + 24px) 16px 120px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ============ FLOATING PARTICLES (idle bg) ============ */
  .bg-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
  .bg-particle {
    position: absolute;
    border-radius: 50%;
    background: var(--accent-glow);
    box-shadow: 0 0 8px var(--accent-glow);
    opacity: 0;
  }

  /* ============ TOP BAR ============ */
  .topbar {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 8px;
    align-items: center;
    padding: 6px 4px 2px;
  }
  .pill-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    color: var(--text-2);
    cursor: pointer;
    font-family: inherit;
  }
  .pill-icon:active { background: var(--surface-2); }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-1);
    font-family: var(--font-mono);
  }
  .pill .flame-wrap { position: relative; display: inline-flex; }
  .pill-accent { color: var(--accent); }
  .pill-success { color: var(--success); }
  .pill-muted { color: var(--text-2); }
  .pill-level {
    background: linear-gradient(135deg, var(--surface-2), var(--surface-1));
    border-color: var(--border-strong);
  }

  /* ============ HERO ============ */
  .hero {
    position: relative;
    padding: 22px 20px 24px;
    border-radius: 20px;
    background:
      radial-gradient(120% 100% at 0% 0%, rgba(245,158,11,0.08), transparent 60%),
      linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border);
    box-shadow: var(--shadow-2);
    overflow: hidden;
  }
  .hero::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    box-shadow: 0 1px 0 var(--highlight) inset;
  }
  .hero-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-3);
    font-weight: 500;
    margin-bottom: 4px;
  }
  .hero-title {
    font-family: var(--font-display);
    font-size: 38px;
    line-height: 1.05;
    font-weight: 400;
    color: var(--text-1);
    margin: 0;
    letter-spacing: -0.01em;
  }
  .hero-title em {
    font-style: italic;
    color: var(--accent);
  }
  .hero-bar {
    margin-top: 18px;
    height: 6px;
    border-radius: 999px;
    background: var(--surface-3);
    overflow: hidden;
    position: relative;
  }
  .hero-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-deep), var(--accent-glow));
    box-shadow: 0 0 12px var(--accent);
    border-radius: inherit;
  }
  .hero-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-2);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .hero-meta strong { color: var(--text-1); font-weight: 600; }

  /* ============ SECTION ============ */
  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-3);
    font-weight: 600;
    margin: 4px 4px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .section-title .count {
    font-family: var(--font-mono);
    color: var(--text-2);
    letter-spacing: 0;
    text-transform: none;
  }

  /* ============ QUESTS ============ */
  .quest-list { display: flex; flex-direction: column; gap: 8px; }
  .quest {
    display: grid;
    grid-template-columns: 32px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    transition: border-color .2s ease, background .2s ease;
    position: relative;
    overflow: hidden;
  }
  .quest.done {
    background: linear-gradient(180deg, rgba(16,185,129,0.08), var(--surface-1));
    border-color: rgba(16,185,129,0.25);
  }
  .quest-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--surface-3);
    display: grid;
    place-items: center;
    color: var(--accent);
    box-shadow: var(--shadow-1);
  }
  .quest.done .quest-icon {
    background: rgba(16,185,129,0.15);
    color: var(--success);
  }
  .quest-text { font-size: 14px; font-weight: 500; color: var(--text-1); line-height: 1.3; }
  .quest-sub { font-size: 11px; color: var(--text-3); font-family: var(--font-mono); font-variant-numeric: tabular-nums; margin-top: 2px; }
  .quest-prog {
    width: 56px;
    height: 4px;
    background: var(--surface-3);
    border-radius: 999px;
    overflow: hidden;
    margin-top: 4px;
  }
  .quest-prog-fill {
    height: 100%;
    background: var(--accent);
    border-radius: inherit;
  }
  .quest.done .quest-prog-fill { background: var(--success); }
  .quest-xp { font-family: var(--font-mono); font-size: 12px; color: var(--accent); font-weight: 500; }
  .quest.done .quest-xp { color: var(--success); }

  /* État verrouillé (Lot 3b — quête Intervention pas encore livré) */
  .quest.locked {
    opacity: 0.55;
    border-style: dashed;
    background: var(--surface-1);
  }
  .quest.locked .quest-icon {
    background: var(--surface-3);
    color: var(--text-3);
  }
  .quest.locked .quest-text { color: var(--text-2); }
  .quest.locked .quest-sub { color: var(--text-3); font-style: italic; }
  .quest.locked .quest-xp { font-size: 14px; }
  .quest.locked .quest-prog { display: none; }

  /* ============ MODES GRID ============ */
  .modes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .mode {
    position: relative;
    padding: 14px;
    border-radius: 16px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    cursor: pointer;
    overflow: hidden;
    text-align: left;
    color: inherit;
    font-family: inherit;
  }
  .mode.full { grid-column: 1 / -1; }
  .mode.primary {
    background:
      radial-gradient(120% 100% at 0% 0%, rgba(245,158,11,0.15), transparent 60%),
      linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border-color: rgba(245,158,11,0.25);
  }
  .mode-icon {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: var(--surface-3);
    display: grid; place-items: center;
    color: var(--text-1);
    margin-bottom: 24px;
  }
  .mode.primary .mode-icon { color: var(--accent); background: var(--accent-soft); }
  .mode-title { font-size: 14px; font-weight: 600; color: var(--text-1); margin: 0; }
  .mode-sub { font-size: 11px; color: var(--text-3); margin-top: 2px; font-family: var(--font-mono); }
  .mode-cta {
    position: absolute;
    right: 12px; top: 12px;
    width: 24px; height: 24px;
    border-radius: 999px;
    background: var(--surface-3);
    display: grid; place-items: center;
    color: var(--text-2);
  }
  .mode.primary .mode-cta { background: var(--accent); color: #1A1100; }

  /* ============ STATS STRIP ============ */
  .stats-strip {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .stat-cell {
    background: var(--surface-1);
    padding: 12px;
    text-align: center;
  }
  .stat-num {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.02em;
  }
  .stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-3);
    margin-top: 2px;
  }

  /* ============ GUEST ENTRY (Lot 2) ============ */
  .guest-entry {
    width: 100%;
    display: grid;
    grid-template-columns: 36px 1fr 18px;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px dashed var(--border-strong);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: var(--text-1);
    transition: background 0.15s ease;
  }
  .guest-entry:active { background: var(--surface-2); }
  .guest-entry-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--surface-3);
    display: grid;
    place-items: center;
    color: var(--text-2);
  }
  .guest-entry-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-1);
  }
  .guest-entry-sub {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    margin-top: 2px;
  }

  /* ============ QUESTION SCREEN ============ */
  .q-top {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 4px 4px 0;
  }
  .q-back {
    width: 36px; height: 36px;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    display: grid; place-items: center;
    color: var(--text-2);
    box-shadow: var(--shadow-1);
    cursor: pointer;
  }
  .combo-meter {
    height: 36px;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    box-shadow: var(--shadow-1);
    position: relative;
    overflow: hidden;
  }
  .combo-num {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-1);
  }
  .combo-label {
    font-size: 11px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .combo-meter.hot {
    border-color: rgba(245,158,11,0.5);
    background: linear-gradient(90deg, rgba(245,158,11,0.15), var(--surface-1));
    box-shadow: 0 0 24px rgba(245,158,11,0.3);
  }
  .combo-meter.fire {
    border-color: rgba(230,57,70,0.5);
    background: linear-gradient(90deg, rgba(230,57,70,0.18), rgba(245,158,11,0.18));
    box-shadow: 0 0 32px rgba(230,57,70,0.4);
  }

  .q-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 8px;
    padding: 0 4px;
  }
  .q-meta-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--text-4); }

  /* Lot 3b.2 — bandeau référentiel/édition plus visible */
  .q-context-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
    padding: 0 4px;
  }
  .ref-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 11px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08));
    border: 1px solid rgba(245,158,11,0.35);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
    box-shadow: 0 0 12px rgba(245,158,11,0.08);
  }
  .ref-pill .ref-sep {
    color: rgba(245,158,11,0.45);
    margin: 0 2px;
  }
  .ref-pill .ref-edition {
    color: var(--text-2);
    font-weight: 500;
  }
  .q-context-info {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-2);
    font-family: var(--font-mono);
    letter-spacing: 0.03em;
  }
  .q-context-info .ctx-chapter {
    color: var(--text-1);
    font-weight: 600;
  }
  .q-context-info .ctx-dot {
    width: 3px;
    height: 3px;
    border-radius: 999px;
    background: var(--text-3);
  }

  /* Lot 3b.2 — navigation arrière (chevrons) */
  .q-nav-arrows {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .q-nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    color: var(--text-2);
    cursor: pointer;
    transition: background 0.15s ease, opacity 0.15s ease;
  }
  .q-nav-btn:active { background: var(--surface-2); }
  .q-nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .q-consult-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.28);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .q-resume-btn {
    width: 100%;
    margin-top: 12px;
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
    box-shadow: 0 0 24px rgba(245,158,11,0.3);
  }
  .q-card {
    margin-top: 12px;
    padding: 24px 22px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: var(--shadow-2);
    position: relative;
    overflow: hidden;
  }
  .q-text {
    font-family: var(--font-display);
    font-size: 22px;
    line-height: 1.25;
    color: var(--text-1);
    margin: 0;
    letter-spacing: -0.005em;
    font-weight: 400;
  }

  .props { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .prop {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 16px 16px;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    cursor: pointer;
    text-align: left;
    color: inherit;
    font-family: inherit;
    font-size: 15px;
    line-height: 1.3;
    position: relative;
    overflow: hidden;
    transition: border-color .15s ease;
  }
  .prop:active { transform: scale(0.985); }
  .prop-letter {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: var(--surface-3);
    display: grid; place-items: center;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-2);
    font-weight: 500;
    flex-shrink: 0;
  }
  .prop-result {
    width: 22px; height: 22px;
    border-radius: 999px;
    display: grid; place-items: center;
    opacity: 0;
  }
  .prop.correct {
    background: linear-gradient(180deg, rgba(16,185,129,0.18), var(--surface-1));
    border-color: rgba(16,185,129,0.45);
    box-shadow: var(--shadow-glow-success);
  }
  .prop.correct .prop-letter { background: var(--success); color: #04201A; }
  .prop.correct .prop-result { opacity: 1; color: var(--success); }
  .prop.wrong {
    background: linear-gradient(180deg, rgba(230,57,70,0.15), var(--surface-1));
    border-color: rgba(230,57,70,0.45);
  }
  .prop.wrong .prop-letter { background: var(--danger); color: #1A0306; }
  .prop.wrong .prop-result { opacity: 1; color: var(--danger); }

  .ripple {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: inherit;
  }
  .ripple-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(245,158,11,0.3);
  }

  .feedback {
    margin-top: 12px;
    padding: 16px 18px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--surface-1);
    box-shadow: var(--shadow-2);
  }
  .feedback-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .feedback.ok .feedback-tag { background: var(--success-soft); color: var(--success); }
  .feedback.ko .feedback-tag { background: var(--danger-soft); color: var(--danger); }
  .feedback-text { font-size: 13px; line-height: 1.45; color: var(--text-2); margin-top: 10px; }
  .feedback-ref { font-size: 11px; font-family: var(--font-mono); color: var(--text-3); margin-top: 6px; }

  .next-btn {
    margin-top: 12px;
    width: 100%;
    padding: 16px;
    border-radius: 14px;
    background: linear-gradient(180deg, var(--accent-glow), var(--accent));
    border: 1px solid var(--accent-deep);
    color: #1A1100;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: 0 1px 0 rgba(255,255,255,0.3) inset, 0 8px 24px rgba(245,158,11,0.25);
  }
  .next-btn:active { transform: scale(0.98); }

  /* Variante : ancrée en bas de l'écran, toujours visible */
  .next-btn-floating {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(env(safe-area-inset-bottom, 8px) + 12px);
    max-width: 388px;
    margin: 0 auto;
    z-index: 50;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.3) inset,
      0 -8px 24px rgba(10,11,15,0.6),
      0 12px 32px rgba(245,158,11,0.35);
  }

  /* ============ FLY ============ */
  .xp-fly-host { position: fixed; inset: 0; pointer-events: none; z-index: 50; display: grid; place-items: center; }
  .xp-fly {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 14px;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--accent-glow), var(--accent));
    color: #1A1100;
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 16px;
    box-shadow: 0 0 24px rgba(245,158,11,0.6);
  }
  .xp-fly.bonus {
    background: linear-gradient(180deg, #FF6B81, var(--danger));
    color: #FFF;
    box-shadow: 0 0 32px rgba(230,57,70,0.7);
  }

  .bonus-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--danger), var(--accent));
    color: #FFF;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    box-shadow: 0 4px 16px rgba(230,57,70,0.4);
    white-space: nowrap;
    z-index: 5;
  }

  /* ============ CELEBRATION BURST ============ */
  .burst {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: grid;
    place-items: center;
    z-index: 4;
  }
  .burst-ring {
    width: 60px; height: 60px;
    border-radius: 50%;
    border: 2px solid var(--success-glow);
  }

  /* ============ LEVEL-UP ============ */
  .levelup-root {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(10,11,15,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .levelup-halo {
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,0.4), rgba(245,158,11,0) 60%);
    pointer-events: none;
  }
  .levelup-content {
    text-align: center;
    z-index: 2;
    padding: 0 24px;
    max-width: 360px;
  }
  .levelup-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--accent);
    font-weight: 600;
    font-family: var(--font-mono);
  }
  .levelup-num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 140px;
    line-height: 1;
    color: var(--text-1);
    margin: 8px 0;
    letter-spacing: -0.04em;
    background: linear-gradient(180deg, #FFFFFF, var(--accent-glow) 60%, var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 60px rgba(245,158,11,0.4);
  }
  .levelup-name {
    font-family: var(--font-display);
    font-size: 36px;
    line-height: 1.1;
    color: var(--text-1);
    font-weight: 400;
  }
  .levelup-sub {
    margin-top: 12px;
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.5;
  }
  .levelup-cta {
    margin-top: 32px;
    padding: 14px 28px;
    border-radius: 999px;
    background: var(--accent);
    color: #1A1100;
    font-weight: 600;
    font-size: 14px;
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(245,158,11,0.4);
  }
  .levelup-skip {
    position: absolute;
    top: calc(env(safe-area-inset-top, 0) + 16px);
    right: 16px;
    background: transparent;
    border: 1px solid var(--border-strong);
    color: var(--text-2);
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-family: var(--font-mono);
    cursor: pointer;
  }

  /* ============ RECORD TOAST ============ */
  .record-toast {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0) + 12px);
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 18px;
    border-radius: 14px;
    background: linear-gradient(180deg, var(--surface-3), var(--surface-2));
    border: 1px solid var(--accent);
    box-shadow: 0 0 32px rgba(245,158,11,0.4), var(--shadow-2);
    z-index: 60;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
  }
  .record-toast .pulse-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 12px var(--accent);
  }

  /* ============ DEMO CONTROLS ============ */
  .demo {
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom, 0) + 8px);
    right: 8px;
    z-index: 70;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
  }
  .demo-toggle {
    width: 36px; height: 36px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    color: var(--text-2);
    display: grid; place-items: center;
    cursor: pointer;
    box-shadow: var(--shadow-2);
  }
  .demo-panel {
    background: var(--surface-1);
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    padding: 10px;
    box-shadow: var(--shadow-2);
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .demo-btn {
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--text-1);
    padding: 8px 12px;
    border-radius: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    text-align: left;
    cursor: pointer;
  }
  .demo-btn:hover { background: var(--surface-3); }
  .demo-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-3);
    padding: 4px 8px 0;
    font-family: var(--font-mono);
  }

  /* ============ CONFETTI ============ */
  .confetti-host {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 60;
    overflow: hidden;
  }
  .confetti {
    position: absolute;
    top: -20px;
    left: 50%;
    width: 8px;
    height: 12px;
    border-radius: 2px;
  }

  /* ============ CELEBRATION HOST ============ */
  .celeb-host {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 40;
    overflow: hidden;
  }
  .celeb-sparkle {
    position: absolute;
    top: 50%; left: 50%;
    width: 14px; height: 14px;
    color: var(--accent-glow);
  }
  .celeb-wave {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.2) 45%, rgba(245,158,11,0.18) 55%, transparent 100%);
    transform: translateY(100%);
  }
  .celeb-pulse {
    position: absolute;
    top: 50%; left: 50%;
    width: 100px; height: 100px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,0.5), rgba(16,185,129,0) 70%);
    transform: translate(-50%, -50%);
  }
  .celeb-rings-host {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
  }
  .celeb-ring {
    position: absolute;
    width: 60px; height: 60px;
    border-radius: 50%;
    border: 2px solid var(--success-glow);
  }
  .celeb-constellation {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .celeb-node {
    position: absolute;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--accent-glow);
    box-shadow: 0 0 10px var(--accent);
  }
  .celeb-line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent-glow), transparent);
    transform-origin: 0 50%;
    opacity: 0;
  }

  /* ============ MYSTERY BOX ============ */
  .mbox-root {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(10,11,15,0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: grid;
    place-items: center;
    padding: 0 24px;
  }
  .mbox-content {
    text-align: center;
    max-width: 320px;
  }
  .mbox-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--accent);
    font-family: var(--font-mono);
    font-weight: 600;
    margin-bottom: 8px;
  }
  .mbox-title {
    font-family: var(--font-display);
    font-size: 28px;
    line-height: 1.15;
    color: var(--text-1);
    margin: 0 0 28px;
  }
  .mbox-title em { font-style: italic; color: var(--accent); }
  .mbox-chest {
    width: 160px;
    height: 160px;
    margin: 0 auto;
    position: relative;
    cursor: pointer;
  }
  .mbox-chest-base {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 90px;
    background: linear-gradient(180deg, var(--surface-3), var(--surface-1));
    border: 1px solid var(--accent);
    border-radius: 0 0 16px 16px;
    box-shadow: 0 0 40px rgba(245,158,11,0.4), 0 1px 0 var(--accent-glow) inset;
  }
  .mbox-chest-lid {
    position: absolute;
    top: 18px;
    left: 50%;
    transform-origin: 50% 100%;
    transform: translateX(-50%);
    width: 140px;
    height: 56px;
    background: linear-gradient(180deg, var(--accent-glow), var(--accent-deep));
    border-radius: 16px 16px 0 0;
    box-shadow: 0 1px 0 #FDD27A inset, 0 0 24px rgba(245,158,11,0.5);
  }
  .mbox-chest-lock {
    position: absolute;
    top: 56px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 20px;
    background: var(--bg);
    border: 1px solid var(--accent-deep);
    border-radius: 4px;
  }
  .mbox-hint {
    margin-top: 24px;
    font-size: 12px;
    color: var(--text-2);
    font-family: var(--font-mono);
  }
  .mbox-reward-card {
    margin-top: 16px;
    padding: 20px;
    border-radius: 16px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--accent);
    box-shadow: 0 0 48px rgba(245,158,11,0.35), var(--shadow-2);
  }
  .mbox-reward-icon {
    width: 56px; height: 56px;
    margin: 0 auto 14px;
    border-radius: 16px;
    background: linear-gradient(180deg, var(--accent-glow), var(--accent));
    color: #1A1100;
    display: grid; place-items: center;
    box-shadow: 0 8px 24px rgba(245,158,11,0.4);
  }
  .mbox-reward-name {
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--text-1);
    margin: 0 0 4px;
  }
  .mbox-reward-desc {
    font-size: 12px;
    color: var(--text-2);
  }
  .mbox-claim {
    margin-top: 16px;
    padding: 12px 24px;
    border-radius: 999px;
    background: var(--accent);
    color: #1A1100;
    font-weight: 600;
    font-size: 13px;
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(245,158,11,0.4);
  }

  /* ============ GOLDEN QUESTION ============ */
  .q-card.golden {
    position: relative;
    background:
      radial-gradient(120% 100% at 50% 0%, rgba(245,158,11,0.18), transparent 65%),
      linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border-color: rgba(245,158,11,0.4);
    box-shadow:
      0 0 0 1px rgba(245,158,11,0.3),
      0 0 60px rgba(245,158,11,0.25),
      var(--shadow-2);
  }
  .q-card.golden::before {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(120deg, transparent 30%, rgba(251,191,36,0.7), transparent 70%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    background-size: 200% 100%;
    animation: golden-shimmer 3s linear infinite;
    pointer-events: none;
  }
  @keyframes golden-shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 100% 0; }
  }
  .golden-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), var(--accent-glow));
    color: #1A1100;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    box-shadow: 0 4px 16px rgba(245,158,11,0.3);
  }

  /* ============ COMBO MILESTONE ============ */
  .milestone {
    position: fixed;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 55;
    pointer-events: none;
    text-align: center;
  }
  .milestone-text {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 42px;
    line-height: 1.05;
    color: var(--text-1);
    text-shadow: 0 0 32px rgba(245,158,11,0.6), 0 8px 24px rgba(0,0,0,0.5);
    letter-spacing: -0.02em;
  }
  .milestone-num {
    color: var(--accent);
    font-family: var(--font-display);
    font-style: italic;
  }

  /* ============ EASTER EGG MICRO ============ */
  .egg-flash {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 55;
    pointer-events: none;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 28px;
    color: var(--text-1);
    text-shadow: 0 0 24px var(--accent);
    white-space: nowrap;
  }
  .egg-sparkle {
    position: absolute;
    border-radius: 50%;
    background: var(--accent-glow);
    box-shadow: 0 0 8px var(--accent);
    pointer-events: none;
  }

  /* ============ STATS SCREEN ============ */
  .stats-header {
    display: grid;
    grid-template-columns: 36px 1fr 36px;
    align-items: center;
    gap: 12px;
    padding: 4px 4px 0;
  }
  .stats-title {
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--text-1);
    letter-spacing: -0.01em;
    text-align: center;
    margin: 0;
  }
  .stats-title em { font-style: italic; color: var(--accent); }

  .profile-card {
    padding: 24px 22px 22px;
    border-radius: 20px;
    background:
      radial-gradient(140% 100% at 50% 0%, rgba(245,158,11,0.10), transparent 60%),
      linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border);
    box-shadow: var(--shadow-2);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .profile-avatar {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    margin: 0 auto 14px;
    background:
      radial-gradient(circle at 30% 30%, var(--accent-glow), var(--accent-deep) 75%);
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 44px;
    color: #1A1100;
    box-shadow: 0 0 32px rgba(245,158,11,0.4), 0 1px 0 #FDD27A inset;
    letter-spacing: -0.02em;
  }
  .profile-level-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-3);
    font-weight: 600;
    font-family: var(--font-mono);
  }
  .profile-level-name {
    font-family: var(--font-display);
    font-size: 30px;
    font-style: italic;
    color: var(--accent);
    line-height: 1.1;
    margin: 4px 0 0;
  }
  .profile-pills {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  /* ============ KPI GRID ============ */
  .kpi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .kpi {
    padding: 16px;
    border-radius: 16px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    position: relative;
    overflow: hidden;
  }
  .kpi-icon {
    width: 24px; height: 24px;
    border-radius: 7px;
    background: var(--surface-3);
    display: grid; place-items: center;
    color: var(--accent);
    margin-bottom: 12px;
  }
  .kpi-value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .kpi-value .unit {
    font-size: 14px;
    color: var(--text-2);
    margin-left: 2px;
  }
  .kpi-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
    margin-top: 6px;
  }

  /* ============ CHART CARD ============ */
  .chart-card {
    padding: 20px;
    border-radius: 18px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border);
    box-shadow: var(--shadow-2);
  }
  .chart-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
  }
  .chart-head h3 {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 400;
    color: var(--text-1);
    margin: 0;
  }
  .chart-head .meta {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .chart-svg {
    width: 100%;
    height: 120px;
    display: block;
  }
  .chart-axis {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-4);
  }

  /* ============ HEATMAP ============ */
  .heatmap {
    padding: 18px 20px 16px;
    border-radius: 18px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
  }
  .heatmap-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 14px;
  }
  .heatmap-head h3 {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 400;
    color: var(--text-1);
    margin: 0;
  }
  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(14, 1fr);
    gap: 3px;
  }
  .heatmap-cell {
    aspect-ratio: 1;
    border-radius: 3px;
    background: var(--surface-3);
  }
  .heatmap-cell.l1 { background: rgba(245,158,11,0.20); }
  .heatmap-cell.l2 { background: rgba(245,158,11,0.45); }
  .heatmap-cell.l3 { background: rgba(245,158,11,0.70); }
  .heatmap-cell.l4 { background: var(--accent); box-shadow: 0 0 8px rgba(245,158,11,0.5); }
  .heatmap-legend {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font-mono);
  }
  .legend-cell { width: 9px; height: 9px; border-radius: 2px; }

  /* ============ BADGE GRID ============ */
  .badge-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .badge-cell {
    aspect-ratio: 1;
    border-radius: 14px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  .badge-cell.unlocked {
    background:
      radial-gradient(120% 100% at 0% 0%, rgba(245,158,11,0.15), transparent 60%),
      linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border-color: rgba(245,158,11,0.3);
  }
  .badge-cell.locked { opacity: 0.35; filter: grayscale(1); }
  .badge-icon {
    width: 28px; height: 28px;
    color: var(--text-2);
  }
  .badge-cell.unlocked .badge-icon { color: var(--accent); }
  .badge-cell .new-dot {
    position: absolute;
    top: 6px; right: 6px;
    width: 8px; height: 8px;
    background: var(--accent);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--accent);
  }

  /* ============ CHAPTERS ============ */
  .chap-list { display: flex; flex-direction: column; gap: 6px; }
  .chap-row {
    display: grid;
    grid-template-columns: 1fr auto 36px;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
  }
  .chap-name {
    font-size: 13px;
    color: var(--text-1);
    line-height: 1.2;
  }
  .chap-sub {
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font-mono);
    margin-top: 2px;
  }
  .chap-bar {
    width: 60px;
    height: 4px;
    background: var(--surface-3);
    border-radius: 999px;
    overflow: hidden;
  }
  .chap-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-deep), var(--accent-glow));
    border-radius: inherit;
  }
  .chap-pct {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: var(--text-1);
    text-align: right;
    font-weight: 500;
  }

  /* ============ STATS PROFILE TRIGGER ============ */
  .profile-trigger {
    position: relative;
    width: 32px; height: 32px;
    border-radius: 999px;
    background:
      radial-gradient(circle at 30% 30%, var(--accent-glow), var(--accent-deep));
    color: #1A1100;
    border: 1px solid var(--border-strong);
    display: grid; place-items: center;
    cursor: pointer;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
    font-weight: 400;
    box-shadow: 0 0 16px rgba(245,158,11,0.3);
  }

  /* ============ BADGE UNLOCK ============ */
  .bunlock-root {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(10,11,15,0.94);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .bunlock-rays {
    position: absolute;
    width: 800px;
    height: 800px;
    pointer-events: none;
  }
  .bunlock-ray {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 400px;
    background: linear-gradient(180deg, var(--accent-glow), transparent);
    transform-origin: 50% 0%;
    opacity: 0.6;
  }
  .bunlock-halo {
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,0.5), rgba(245,158,11,0) 60%);
    pointer-events: none;
  }
  .bunlock-content {
    text-align: center;
    z-index: 2;
    padding: 0 24px;
    max-width: 360px;
  }
  .bunlock-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--accent);
    font-weight: 600;
    font-family: var(--font-mono);
  }
  .bunlock-medal {
    width: 140px;
    height: 140px;
    margin: 24px auto;
    border-radius: 50%;
    background:
      radial-gradient(circle at 30% 30%, var(--accent-glow), var(--accent-deep) 75%);
    display: grid;
    place-items: center;
    color: #1A1100;
    box-shadow:
      0 0 0 6px rgba(245,158,11,0.15),
      0 0 0 14px rgba(245,158,11,0.08),
      0 0 80px rgba(245,158,11,0.6),
      0 1px 0 #FDD27A inset;
  }
  .bunlock-name {
    font-family: var(--font-display);
    font-size: 32px;
    font-style: italic;
    color: var(--text-1);
    line-height: 1.1;
    margin: 8px 0 0;
  }
  .bunlock-cond {
    margin-top: 12px;
    color: var(--text-2);
    font-size: 13px;
    line-height: 1.5;
    padding: 0 16px;
  }
  .bunlock-cta {
    margin-top: 28px;
    padding: 12px 26px;
    border-radius: 999px;
    background: var(--accent);
    color: #1A1100;
    font-weight: 600;
    font-size: 13px;
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(245,158,11,0.4);
  }

  /* ============ SURVIVAL MODE ============ */
  .surv-top {
    display: grid;
    grid-template-columns: 36px 1fr 36px;
    align-items: center;
    gap: 12px;
    padding: 4px 4px 0;
  }
  .surv-heart {
    width: 36px; height: 36px;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    display: grid; place-items: center;
    color: var(--danger);
    box-shadow: var(--shadow-1);
  }
  .surv-score {
    text-align: center;
    line-height: 1;
  }
  .surv-score .num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 44px;
    color: var(--text-1);
    letter-spacing: -0.02em;
  }
  .surv-score .label {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-top: 2px;
  }
  .surv-heat {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: radial-gradient(ellipse at 50% 100%, rgba(230,57,70,0.15), transparent 60%);
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  .surv-heat.l1 { opacity: 0.4; }
  .surv-heat.l2 { opacity: 0.7; }
  .surv-heat.l3 { opacity: 1; }

  .gameover-root {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(10,11,15,0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .gameover-halo {
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(230,57,70,0.35), rgba(230,57,70,0) 60%);
  }
  .gameover-content {
    text-align: center;
    z-index: 2;
    padding: 0 24px;
    max-width: 360px;
  }
  .gameover-eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--danger-glow);
    font-weight: 600;
  }
  .gameover-score {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 120px;
    line-height: 1;
    color: var(--text-1);
    margin: 16px 0;
    letter-spacing: -0.04em;
    background: linear-gradient(180deg, var(--text-1), var(--danger-glow));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 40px rgba(230,57,70,0.3);
  }
  .gameover-best {
    color: var(--text-2);
    font-family: var(--font-mono);
    font-size: 13px;
    margin-top: 4px;
  }
  .gameover-best strong { color: var(--accent); font-weight: 600; }
  .gameover-best.new-record { color: var(--accent); }
  .gameover-cta-group {
    display: flex;
    gap: 8px;
    margin-top: 32px;
    justify-content: center;
  }
  .gameover-cta-primary {
    padding: 14px 24px;
    border-radius: 999px;
    background: var(--accent);
    color: #1A1100;
    font-weight: 600;
    font-size: 13px;
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(245,158,11,0.4);
  }
  .gameover-cta-secondary {
    padding: 14px 22px;
    border-radius: 999px;
    background: transparent;
    color: var(--text-2);
    border: 1px solid var(--border-strong);
    font-size: 13px;
    cursor: pointer;
  }

  /* ============ DAILY MODE ============ */
  .daily-top {
    display: grid;
    grid-template-columns: 36px 1fr;
    align-items: center;
    gap: 12px;
    padding: 4px 4px 0;
  }
  .daily-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .daily-info-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-2);
  }
  .daily-info-head .date { text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-3); }
  .daily-info-head .progress { color: var(--text-1); font-weight: 600; }
  .daily-bar {
    height: 4px;
    background: var(--surface-2);
    border-radius: 999px;
    overflow: hidden;
    display: flex;
    gap: 2px;
  }
  .daily-bar-step {
    flex: 1;
    height: 100%;
    background: var(--surface-3);
    border-radius: 2px;
  }
  .daily-bar-step.ok { background: var(--success); }
  .daily-bar-step.ko { background: var(--danger); }
  .daily-bar-step.current { background: var(--accent); box-shadow: 0 0 8px var(--accent); }

  .daily-recap {
    padding: 24px 22px;
    border-radius: 20px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border);
    box-shadow: var(--shadow-2);
    text-align: center;
  }
  .daily-recap-eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--accent);
    font-weight: 600;
  }
  .daily-recap-score {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 80px;
    line-height: 1;
    color: var(--text-1);
    margin: 12px 0 4px;
    letter-spacing: -0.03em;
  }
  .daily-recap-score .sep { color: var(--text-3); font-style: italic; }
  .daily-recap-score .total { color: var(--text-2); }
  .daily-recap-subtitle {
    color: var(--text-2);
    font-size: 13px;
    margin-top: 6px;
  }
  .daily-recap-xp {
    margin-top: 18px;
    padding: 12px;
    border-radius: 12px;
    background: var(--accent-soft);
    border: 1px solid rgba(245,158,11,0.3);
    color: var(--accent);
    font-family: var(--font-mono);
    font-weight: 600;
    font-size: 13px;
  }

  /* ============ AUDIT MODE ============ */
  .audit-top {
    display: grid;
    grid-template-columns: 36px 1fr 36px;
    align-items: center;
    gap: 12px;
    padding: 4px 4px 0;
  }
  .audit-top-center {
    text-align: center;
  }
  .audit-top-center .label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.18em;
  }
  .audit-top-center .progress {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-1);
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }
  .audit-scenario-card {
    margin-top: 4px;
    padding: 18px 20px;
    border-radius: 18px;
    background:
      radial-gradient(120% 100% at 0% 0%, rgba(230,57,70,0.08), transparent 60%),
      linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 1px solid var(--border);
    border-left: 3px solid var(--danger);
    box-shadow: var(--shadow-2);
  }
  .audit-scenario-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--danger-soft);
    color: var(--danger);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 10px;
  }
  .audit-scenario-text {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 17px;
    line-height: 1.4;
    color: var(--text-1);
    margin: 0;
  }
  .audit-question-text {
    font-size: 15px;
    color: var(--text-1);
    margin: 4px 4px 0;
    font-weight: 500;
  }
`;

// ---- BACKGROUND PARTICLES -------------------------------------------------
function BgParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 50 + Math.random() * 50,
        size: 1 + Math.random() * 1.8,
        duration: 18 + Math.random() * 22,
        delay: Math.random() * 12,
      })),
    []
  );
  return (
    <div className="bg-particles">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="bg-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -window.innerHeight * 0.6], opacity: [0, 0.4, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ---- ANIMATED NUMBER ------------------------------------------------------
function AnimatedNumber({ value, className, format = (v) => v.toLocaleString('fr-FR') }) {
  const prev = useRef(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (prev.current === value) return;
    const from = prev.current;
    const diff = value - from;
    const steps = 24;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const p = step / steps;
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + diff * e));
      if (step >= steps) {
        setDisplay(value);
        prev.current = value;
        clearInterval(t);
      }
    }, 22);
    return () => clearInterval(t);
  }, [value]);
  return <span className={className}>{format(display)}</span>;
}

// ---- CONFETTI -------------------------------------------------------------
function Confetti({ active, duration = 3000, intensity = 1 }) {
  const [render, setRender] = useState(false);
  useEffect(() => {
    if (active) {
      setRender(true);
      const t = setTimeout(() => setRender(false), duration);
      return () => clearTimeout(t);
    }
  }, [active, duration]);

  const pieces = useMemo(() => {
    if (!render) return [];
    const count = Math.floor(60 * intensity);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: ['#F59E0B', '#FBBF24', '#E63946', '#10B981', '#F2F3F5', '#FF6B81'][i % 6],
      x: (Math.random() - 0.5) * 600,
      r: Math.random() * 720 - 360,
      delay: Math.random() * 0.4,
      d: 2 + Math.random() * 1.5,
    }));
  }, [render, intensity]);

  if (!render) return null;
  return (
    <div className="confetti-host">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="confetti"
          style={{ backgroundColor: p.color }}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight + 60, x: p.x, opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: p.d, delay: p.delay, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
}

// ---- FLAME (idle breathing) -----------------------------------------------
function BreathingFlame({ size = 14 }) {
  return (
    <motion.span
      className="flame-wrap"
      animate={{ scale: [1, 1.12, 1], filter: ['drop-shadow(0 0 0px var(--accent))', 'drop-shadow(0 0 6px var(--accent))', 'drop-shadow(0 0 0px var(--accent))'] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Flame size={size} fill="currentColor" strokeWidth={1.5} />
    </motion.span>
  );
}

// ============================================================================
// CELEBRATION VARIANTS (tirées au sort)
// ============================================================================
const CELEB_VARIANTS = ['rings', 'sparkles', 'wave', 'pulse', 'constellation'];

function CelebrationRings() {
  return (
    <div className="celeb-host">
      <div className="celeb-rings-host">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="celeb-ring"
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 1, delay: i * 0.14, ease: [0.2, 0.7, 0.3, 1] }}
          />
        ))}
      </div>
    </div>
  );
}

function CelebrationSparkles() {
  const points = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 120 + Math.random() * 180;
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        r: Math.random() * 360,
        delay: Math.random() * 0.15,
        d: 0.8 + Math.random() * 0.4,
      };
    }), []
  );
  return (
    <div className="celeb-host">
      {points.map(p => (
        <motion.div
          key={p.id}
          className="celeb-sparkle"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: [0, 1.4, 0], opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: p.d + 0.4, delay: p.delay, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <Sparkles size={14} fill="currentColor" strokeWidth={0} />
        </motion.div>
      ))}
    </div>
  );
}

function CelebrationWave() {
  return (
    <div className="celeb-host">
      <motion.div
        className="celeb-wave"
        initial={{ y: '100%' }}
        animate={{ y: '-100%' }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.3, 1] }}
      />
    </div>
  );
}

function CelebrationPulse() {
  return (
    <div className="celeb-host">
      <motion.div
        className="celeb-pulse"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 12], opacity: [0, 0.7, 0] }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.3, 1] }}
      />
    </div>
  );
}

function CelebrationConstellation() {
  const nodes = useMemo(() => {
    const N = 9;
    return Array.from({ length: N }, (_, i) => {
      const angle = (i / N) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 60 + Math.random() * 80;
      return {
        id: i,
        x: Math.cos(angle) * dist + 200,
        y: Math.sin(angle) * dist + 250,
      };
    });
  }, []);
  const lines = useMemo(() =>
    nodes.map((n, i) => {
      const next = nodes[(i + 2) % nodes.length];
      const dx = next.x - n.x;
      const dy = next.y - n.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      return { id: i, x: n.x, y: n.y, len, angle };
    }), [nodes]
  );
  return (
    <div className="celeb-host">
      <div className="celeb-constellation">
        {nodes.map((n, i) => (
          <motion.div
            key={`n${n.id}`}
            className="celeb-node"
            style={{ left: n.x, top: n.y }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1, 0], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.3, delay: i * 0.04, ease: 'easeOut' }}
          />
        ))}
        {lines.map((l, i) => (
          <motion.div
            key={`l${l.id}`}
            className="celeb-line"
            style={{ left: l.x, top: l.y, width: l.len, transform: `rotate(${l.angle}deg)` }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 0.7, 0], scaleX: [0, 1, 1] }}
            transition={{ duration: 1, delay: 0.25 + i * 0.05, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  );
}

function Celebration({ variant }) {
  switch (variant) {
    case 'sparkles': return <CelebrationSparkles />;
    case 'wave': return <CelebrationWave />;
    case 'pulse': return <CelebrationPulse />;
    case 'constellation': return <CelebrationConstellation />;
    case 'rings':
    default: return <CelebrationRings />;
  }
}

// ============================================================================
// MYSTERY BOX
// ============================================================================
const MYSTERY_REWARDS = [
  { id: 'xp100', icon: Zap, name: '+100 XP', desc: 'Bonus immédiat ajouté à ton total' },
  { id: 'x3', icon: Sparkles, name: '×3 XP', desc: 'Sur les 3 prochaines questions' },
  { id: 'freeze', icon: Award, name: 'Streak Freeze', desc: 'Un freeze gratuit ajouté' },
  { id: 'badge', icon: Medal, name: 'Badge mystère', desc: '« Curieux » — débloqué' },
];

function MysteryBox({ onClose }) {
  const [opened, setOpened] = useState(false);
  const reward = useMemo(() => MYSTERY_REWARDS[Math.floor(Math.random() * MYSTERY_REWARDS.length)], []);
  const RewardIcon = reward.icon;

  return (
    <motion.div
      className="mbox-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mbox-content">
        {!opened ? (
          <>
            <motion.div
              className="mbox-eyebrow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              SURPRISE
            </motion.div>
            <motion.h2
              className="mbox-title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Un <em>coffre</em> est apparu.
            </motion.h2>
            <motion.div
              className="mbox-chest"
              onClick={() => setOpened(true)}
              initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 18 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <motion.div
                className="mbox-chest-base"
                animate={{ boxShadow: ['0 0 30px rgba(245,158,11,0.3)', '0 0 60px rgba(245,158,11,0.6)', '0 0 30px rgba(245,158,11,0.3)'] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <motion.div
                className="mbox-chest-lid"
                animate={{ rotate: [0, -3, 0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="mbox-chest-lock"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </motion.div>
            <motion.div
              className="mbox-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Touche le coffre pour ouvrir
            </motion.div>
          </>
        ) : (
          <>
            <motion.div
              className="mbox-eyebrow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              RÉCOMPENSE
            </motion.div>
            <motion.div
              className="mbox-reward-card"
              initial={{ scale: 0.4, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            >
              <motion.div
                className="mbox-reward-icon"
                initial={{ rotate: -180, scale: 0.3 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 14 }}
              >
                <RewardIcon size={24} fill="currentColor" strokeWidth={0} />
              </motion.div>
              <motion.div
                className="mbox-reward-name"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {reward.name}
              </motion.div>
              <motion.div
                className="mbox-reward-desc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {reward.desc}
              </motion.div>
            </motion.div>
            <motion.button
              className="mbox-claim"
              onClick={() => onClose(reward)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.96 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 220 }}
            >
              Récupérer
            </motion.button>
          </>
        )}
      </div>
      <Confetti active={opened} duration={2500} intensity={0.8} />
    </motion.div>
  );
}

// ============================================================================
// COMBO MILESTONE MESSAGE
// ============================================================================
const MILESTONE_MESSAGES = {
  7: { num: 'Sept', tail: 'Bien joué.' },
  13: { num: 'Treize', tail: 'La R1 prend forme.' },
  17: { num: 'Dix-sept', tail: 'Solide.' },
  21: { num: 'Vingt-et-un', tail: 'Tu connais.' },
  30: { num: 'Trente', tail: 'Maître.' },
  50: { num: 'Cinquante', tail: 'Hors-norme.' },
};

function MilestoneFlash({ value }) {
  const msg = MILESTONE_MESSAGES[value];
  if (!msg) return null;
  return (
    <motion.div
      className="milestone"
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1.1, 1, 1], y: [20, 0, 0, -10] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.8, times: [0, 0.2, 0.8, 1], ease: [0.2, 0.7, 0.3, 1] }}
    >
      <div className="milestone-text">
        <span className="milestone-num">{msg.num}.</span> {msg.tail}
      </div>
    </motion.div>
  );
}

// ============================================================================
// EASTER EGG — FLASH MESSAGE
// ============================================================================
function EggFlash({ text }) {
  return (
    <motion.div
      className="egg-flash"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.05, 1, 1.05] }}
      transition={{ duration: 2, times: [0, 0.15, 0.85, 1] }}
    >
      {text}
    </motion.div>
  );
}

function EggSparkles({ origin = { x: '50%', y: '50%' } }) {
  const pts = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      return {
        id: i,
        x: Math.cos(angle) * (60 + Math.random() * 60),
        y: Math.sin(angle) * (60 + Math.random() * 60),
        s: 2 + Math.random() * 3,
        d: 0.6 + Math.random() * 0.5,
      };
    }), []
  );
  return (
    <div style={{ position: 'fixed', top: origin.y, left: origin.x, zIndex: 55, pointerEvents: 'none' }}>
      {pts.map(p => (
        <motion.div
          key={p.id}
          className="egg-sparkle"
          style={{ width: p.s, height: p.s }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: [1, 1, 0], scale: [0, 1.4, 0] }}
          transition={{ duration: p.d, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// BADGES CATALOGUE
// ============================================================================
const BADGES = [
  // Discipline
  { id: 'streak_7',    cat: 'Discipline', Icon: Flame,        name: 'Une semaine',     cond: '7 jours d\'affilée',    unlocked: true,  date: '12 mai' },
  { id: 'streak_30',   cat: 'Discipline', Icon: Flame,        name: 'Régulier',        cond: '30 jours d\'affilée',   unlocked: false },
  { id: 'streak_100',  cat: 'Discipline', Icon: Flame,        name: 'Endurant',        cond: '100 jours d\'affilée',  unlocked: false },
  { id: 'streak_365',  cat: 'Discipline', Icon: Flame,        name: 'Une année',       cond: '365 jours d\'affilée',  unlocked: false },
  // Performance
  { id: 'combo_10',    cat: 'Performance', Icon: TrendingUp,  name: 'Dix sans rater',  cond: '10 bonnes d\'affilée',  unlocked: true,  date: '8 mai' },
  { id: 'combo_25',    cat: 'Performance', Icon: TrendingUp,  name: 'En série',        cond: '25 bonnes d\'affilée',  unlocked: false },
  { id: 'combo_50',    cat: 'Performance', Icon: TrendingUp,  name: 'Imperturbable',   cond: '50 bonnes d\'affilée',  unlocked: false },
  { id: 'combo_100',   cat: 'Performance', Icon: Trophy,      name: 'Centième parfait',cond: '100 bonnes d\'affilée', unlocked: false },
  // Maîtrise
  { id: 'chap_sources',cat: 'Maîtrise',   Icon: Target,       name: 'Sources maîtrisées',cond: '100% sur §9 sources', unlocked: true, date: '3 mai' },
  { id: 'chap_postes', cat: 'Maîtrise',   Icon: Target,       name: 'Postes au point', cond: '100% sur §15 postes',   unlocked: false },
  { id: 'chap_calculs',cat: 'Maîtrise',   Icon: Target,       name: 'Calculs justes',  cond: '100% sur dimensionnement', unlocked: false },
  { id: 'chap_distrib',cat: 'Maîtrise',   Icon: Target,       name: 'Réseau parfait',  cond: '100% sur distribution', unlocked: false },
  // Volume
  { id: 'vol_100',     cat: 'Volume',     Icon: BookOpen,     name: 'Cent questions',  cond: '100 réponses',          unlocked: true,  date: '28 avr' },
  { id: 'vol_500',     cat: 'Volume',     Icon: BookOpen,     name: 'Demi-millier',    cond: '500 réponses',          unlocked: false },
  { id: 'vol_1000',    cat: 'Volume',     Icon: BookOpen,     name: 'Le millier',      cond: '1 000 réponses',        unlocked: false },
  { id: 'vol_5000',    cat: 'Volume',     Icon: BookOpen,     name: 'Cinq mille',      cond: '5 000 réponses',        unlocked: false },
  // Niveau
  { id: 'lvl_2',       cat: 'Niveau',     Icon: Star,         name: 'Initié',          cond: 'Atteindre N2',          unlocked: true,  date: '20 avr' },
  { id: 'lvl_3',       cat: 'Niveau',     Icon: Star,         name: 'Confirmé',        cond: 'Atteindre N3',          unlocked: true,  date: '5 mai' },
  { id: 'lvl_4',       cat: 'Niveau',     Icon: Award,        name: 'Expert',          cond: 'Atteindre N4',          unlocked: false },
  { id: 'lvl_5',       cat: 'Niveau',     Icon: Trophy,       name: 'Maître R1',       cond: 'Atteindre N5',          unlocked: false },
  // Curiosité / Spécial
  { id: 'editions',    cat: 'Curiosité',  Icon: Calendar,     name: 'Voyage temporel', cond: '1 Q de chaque édition', unlocked: false },
  { id: 'audit_50',    cat: 'Curiosité',  Icon: Crosshair,    name: 'Œil de Q1',       cond: '50 audit terrain ✓',    unlocked: false },
  { id: 'q1_ready',    cat: 'Spécial',    Icon: GraduationCap,name: 'Q1 Ready',        cond: '90%+ chapitres terrain', unlocked: false },
  { id: 'tatillon',    cat: 'Spécial',    Icon: Wrench,       name: 'Tatillon',        cond: 'Tu as repéré le piège', unlocked: true,  date: '14 mai' },
  { id: 'curieux',     cat: 'Spécial',    Icon: Sparkles,     name: 'Curieux',         cond: 'Ouvrir un coffre mystère', unlocked: false },
];

// ============================================================================
// MOCK DATA: courbe + heatmap + chapitres
// ============================================================================
const CHART_DATA = [55, 58, 62, 60, 65, 68, 64, 70, 72, 75, 71, 74, 76, 78];
const HEATMAP = Array.from({ length: 56 }, (_, i) => {
  // 56 jours = 8 semaines × 7. Niveaux 0-4
  const rnd = Math.random();
  // plus actif récemment
  const recencyBoost = i / 56;
  const v = rnd + recencyBoost * 0.3;
  if (v < 0.35) return 0;
  if (v < 0.55) return 1;
  if (v < 0.75) return 2;
  if (v < 0.92) return 3;
  return 4;
});
const CHAPTERS = [
  { id: '9',  name: 'Sources d\'eau',          ref: '§9',        rate: 88, count: 47 },
  { id: '12', name: 'Postes de contrôle',      ref: '§12',       rate: 72, count: 34 },
  { id: '14', name: 'Distribution',            ref: '§14',       rate: 65, count: 28 },
  { id: '15', name: 'Locaux sources',          ref: '§15',       rate: 81, count: 22 },
  { id: '7',  name: 'Sprinkleurs',             ref: '§7',        rate: 76, count: 41 },
  { id: 'q1', name: 'Procédures Q1',           ref: 'Annexe',    rate: 58, count: 19 },
];

// ============================================================================
// STATS SCREEN
// ============================================================================
function ChartSparkline({ data }) {
  const width = 320;
  const height = 120;
  const padX = 4;
  const padY = 10;
  const max = 100;
  const min = 40;
  const range = max - min;
  const step = (width - padX * 2) / (data.length - 1);

  const points = data.map((v, i) => ({
    x: padX + i * step,
    y: padY + (1 - (v - min) / range) * (height - padY * 2),
  }));

  const pathLine = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const pathArea = `${pathLine} L${points[points.length-1].x},${height - padY} L${points[0].x},${height - padY} Z`;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="chart-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      {/* grid lines */}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={padX} y1={padY + p * (height - padY * 2)} x2={width - padX} y2={padY + p * (height - padY * 2)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {/* area */}
      <motion.path
        d={pathArea}
        fill="url(#chart-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      />
      {/* line */}
      <motion.path
        d={pathLine}
        stroke="url(#chart-stroke)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: [0.2, 0.7, 0.3, 1] }}
      />
      {/* points */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x} cy={p.y} r="2.5"
          fill="#FBBF24"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 + i * 0.04, type: 'spring', stiffness: 280, damping: 18 }}
        />
      ))}
      {/* last point glow */}
      <motion.circle
        cx={points[points.length - 1].x} cy={points[points.length - 1].y}
        r="6" fill="#FBBF24" fillOpacity="0.2"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.8 }}
      />
    </svg>
  );
}

function StatsScreen({ state, onBack, onBadgePress }) {
  const { level, xp, streak, bestCombo, totalQ, rate, freezes, badges } = state;
  const unlocked = badges.filter(b => b.unlocked).length;

  return (
    <motion.div
      className="phone"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
    >
      {/* Header */}
      <div className="stats-header">
        <motion.button className="q-back" onClick={onBack} whileTap={{ scale: 0.92 }}>
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
        </motion.button>
        <h1 className="stats-title"><em>Profil</em></h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Profile card */}
      <motion.div
        className="profile-card"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.5 }}
      >
        <motion.div
          className="profile-avatar"
          initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 18 }}
        >
          Y
        </motion.div>
        <div className="profile-level-eyebrow">Niveau {level}</div>
        <h2 className="profile-level-name">{LEVEL_NAMES[level - 1]}</h2>
        <div className="profile-pills">
          <div className="pill pill-accent">
            <BreathingFlame size={13} />
            <span><AnimatedNumber value={streak} /></span>
            <span className="pill-muted" style={{ fontSize: 11 }}>j</span>
          </div>
          <div className="pill">
            <Zap size={13} fill="var(--accent)" stroke="var(--accent)" />
            <AnimatedNumber value={xp} />
          </div>
        </div>
      </motion.div>

      {/* KPI */}
      <div className="kpi-grid">
        {[
          { icon: BookOpen,   value: totalQ,     label: 'Questions', delay: 0.1 },
          { icon: Target,     value: `${rate}`,  unit: '%', label: 'Réussite', delay: 0.15 },
          { icon: TrendingUp, value: bestCombo,  label: 'Combo max', delay: 0.2 },
          { icon: Award,      value: freezes,    label: 'Freezes', delay: 0.25 },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={i}
              className="kpi"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: k.delay }}
            >
              <div className="kpi-icon"><Icon size={14} /></div>
              <div className="kpi-value">
                {typeof k.value === 'number' ? <AnimatedNumber value={k.value} /> : k.value}
                {k.unit && <span className="unit">{k.unit}</span>}
              </div>
              <div className="kpi-label">{k.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      <motion.div
        className="chart-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="chart-head">
          <h3>Taux de réussite</h3>
          <span className="meta">14 derniers jours</span>
        </div>
        <ChartSparkline data={CHART_DATA} />
        <div className="chart-axis">
          <span>−14j</span>
          <span>−7j</span>
          <span>auj.</span>
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div
        className="heatmap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="heatmap-head">
          <h3>Activité</h3>
          <span className="meta" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>8 semaines</span>
        </div>
        <div className="heatmap-grid">
          {HEATMAP.map((v, i) => (
            <motion.div
              key={i}
              className={`heatmap-cell ${v > 0 ? `l${v}` : ''}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.005, duration: 0.3 }}
            />
          ))}
        </div>
        <div className="heatmap-legend">
          <span>moins</span>
          <span className="legend-cell" style={{ background: 'var(--surface-3)' }} />
          <span className="legend-cell" style={{ background: 'rgba(245,158,11,0.20)' }} />
          <span className="legend-cell" style={{ background: 'rgba(245,158,11,0.45)' }} />
          <span className="legend-cell" style={{ background: 'rgba(245,158,11,0.70)' }} />
          <span className="legend-cell" style={{ background: 'var(--accent)' }} />
          <span>plus</span>
        </div>
      </motion.div>

      {/* Chapters */}
      <div>
        <div className="section-title">
          <span>Maîtrise par chapitre</span>
          <span className="count">{CHAPTERS.length}</span>
        </div>
        <div className="chap-list">
          {CHAPTERS.map((c, i) => (
            <motion.div
              key={c.id}
              className="chap-row"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.04 }}
            >
              <div>
                <div className="chap-name">{c.name}</div>
                <div className="chap-sub">{c.ref} · {c.count} réponses</div>
              </div>
              <div className="chap-bar">
                <motion.div
                  className="chap-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${c.rate}%` }}
                  transition={{ delay: 0.55 + i * 0.04, duration: 0.7 }}
                />
              </div>
              <div className="chap-pct">{c.rate}%</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="section-title">
          <span>Badges</span>
          <span className="count">{unlocked}/{badges.length}</span>
        </div>
        <div className="badge-grid">
          {badges.map((b, i) => {
            const Icon = b.Icon;
            return (
              <motion.button
                key={b.id}
                className={`badge-cell ${b.unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => b.unlocked && onBadgePress(b)}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: b.unlocked ? 1 : 0.35, scale: 1 }}
                whileTap={b.unlocked ? { scale: 0.94 } : {}}
                transition={{ delay: 0.5 + i * 0.02, type: 'spring', stiffness: 240, damping: 20 }}
              >
                <Icon className="badge-icon" size={26} strokeWidth={1.5} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// BADGE UNLOCK CINEMATIC
// ============================================================================
function BadgeUnlock({ badge, onContinue }) {
  const Icon = badge.Icon;
  const rays = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ id: i, angle: (i / 16) * 360 })), []);

  return (
    <motion.div
      className="bunlock-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Halo */}
      <motion.div
        className="bunlock-halo"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.3, 1], opacity: [0, 0.9, 0.7] }}
        transition={{ duration: 1.5, ease: [0.2, 0.7, 0.3, 1] }}
      />

      {/* Rays */}
      <motion.div
        className="bunlock-rays"
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: 0.4 }}
        transition={{
          rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 1, delay: 0.4 },
        }}
      >
        {rays.map(r => (
          <motion.div
            key={r.id}
            className="bunlock-ray"
            style={{ transform: `translate(-50%, 0) rotate(${r.angle}deg)` }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 400, opacity: 0.5 }}
            transition={{ delay: 0.5 + (r.id * 0.03), duration: 0.6 }}
          />
        ))}
      </motion.div>

      <div className="bunlock-content">
        <motion.div
          className="bunlock-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          BADGE DÉBLOQUÉ
        </motion.div>

        <motion.div
          className="bunlock-medal"
          initial={{ scale: 0.2, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 14 }}
        >
          <Icon size={64} strokeWidth={1.5} />
        </motion.div>

        <motion.h2
          className="bunlock-name"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          {badge.name}
        </motion.h2>

        <motion.div
          className="bunlock-cond"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          {badge.cond}
        </motion.div>

        <motion.button
          className="bunlock-cta"
          onClick={onContinue}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.96 }}
          transition={{ delay: 1.6, type: 'spring', stiffness: 220 }}
        >
          Continuer
        </motion.button>
      </div>

      <Confetti active duration={3500} intensity={1.2} />
    </motion.div>
  );
}

// ============================================================================
// PROPS LIST (réutilisable pour les modes)
// ============================================================================
function PropsList({ propositions, selected, validated, bonneReponse, ripples, onSelect, disabled }) {
  return (
    <div className="props">
      {propositions.map((p, idx) => {
        const isSelected = selected === idx;
        const isThisCorrect = validated && idx === bonneReponse;
        const isThisWrong = validated && isSelected && idx !== bonneReponse;
        const cls = isThisCorrect ? 'correct' : isThisWrong ? 'wrong' : '';
        const letter = ['A', 'B', 'C', 'D', 'E'][idx];
        return (
          <motion.button
            key={idx}
            className={`prop ${cls}`}
            onClick={(e) => onSelect(idx, e)}
            whileTap={!validated ? { scale: 0.985 } : {}}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + idx * 0.04 }}
            disabled={disabled || validated}
          >
            <span className="prop-letter">{letter}</span>
            <span>{p}</span>
            <span className="prop-result">
              {isThisCorrect && <Check size={14} strokeWidth={3} />}
              {isThisWrong && <X size={14} strokeWidth={3} />}
            </span>
            {ripples.filter(r => r.propIdx === idx).map(r => (
              <span className="ripple" key={r.id}>
                <motion.span
                  className="ripple-circle"
                  style={{ left: r.x, top: r.y }}
                  initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.6 }}
                  animate={{ width: 600, height: 600, x: -300, y: -300, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </span>
            ))}
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SURVIVAL MODE
// ============================================================================
function SurvivalScreen({ onExit, onXpGain, initialBest = 14, bank }) {
  const effectiveBank = (bank && bank.length > 0) ? bank : SURVIVAL_BANK;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(initialBest);
  const [newRecord, setNewRecord] = useState(false);
  const [selected, setSelected] = useState(null);
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Liste de questions aléatoires (renouvelée à chaque restart)
  const [questions, setQuestions] = useState(() => {
    const shuffled = [...effectiveBank].sort(() => Math.random() - 0.5);
    return shuffled.length > 0 ? shuffled : effectiveBank;
  });
  const q = questions[idx % questions.length];
  const heatLevel = Math.min(3, Math.floor(score / 4));

  const handleSelect = (i, evt) => {
    if (validated) return;
    const rect = evt.currentTarget.getBoundingClientRect();
    setRipples(r => [...r, { id: Date.now(), x: evt.clientX - rect.left, y: evt.clientY - rect.top, propIdx: i }]);
    setSelected(i);
    setTimeout(() => {
      const correct = i === q.bonneReponse;
      setIsCorrect(correct);
      setValidated(true);
      if (correct) {
        const newScore = score + 1;
        setScore(newScore);
        onXpGain && onXpGain(10);
        setTimeout(() => {
          setIdx(n => n + 1);
          setSelected(null);
          setValidated(false);
          setRipples([]);
        }, 650);
      } else {
        if (score > best) {
          setBest(score);
          setNewRecord(true);
        }
        setTimeout(() => setGameOver(true), 900);
      }
    }, 320);
  };

  const restart = () => {
    const shuffled = [...effectiveBank].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.length > 0 ? shuffled : effectiveBank);
    setIdx(0);
    setScore(0);
    setSelected(null);
    setValidated(false);
    setRipples([]);
    setGameOver(false);
    setNewRecord(false);
  };

  return (
    <motion.div
      className="phone"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
    >
      <div className={`surv-heat ${heatLevel > 0 ? `l${heatLevel}` : ''}`} />

      <div className="surv-top">
        <motion.button className="q-back" onClick={onExit} whileTap={{ scale: 0.92 }}>
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
        </motion.button>
        <div className="surv-score">
          <motion.div
            className="num"
            key={score}
            initial={{ scale: 1.4, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          >
            {score}
          </motion.div>
          <div className="label">Survie</div>
        </div>
        <motion.div
          className="surv-heart"
          animate={{ scale: validated && !isCorrect ? [1, 1.4, 0.6, 1] : [1, 1.08, 1] }}
          transition={validated && !isCorrect
            ? { duration: 0.6 }
            : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <Heart size={16} fill="currentColor" />
        </motion.div>
      </div>

      <div className="q-meta">
        <span>R1 §{q.chapitre}</span>
        <span className="q-meta-dot" />
        <span>{q.theme}</span>
      </div>

      <motion.div
        key={idx}
        className="q-card"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -12, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="q-text">{q.enonce}</p>
      </motion.div>

      <PropsList
        propositions={q.propositions}
        selected={selected}
        validated={validated}
        bonneReponse={q.bonneReponse}
        ripples={ripples}
        onSelect={handleSelect}
      />

      {/* Game over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            className="gameover-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="gameover-halo"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.3, 1], opacity: [0, 0.9, 0.7] }}
              transition={{ duration: 1.2 }}
            />
            <div className="gameover-content">
              <motion.div
                className="gameover-eyebrow"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                GAME OVER
              </motion.div>
              <motion.div
                className="gameover-score"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 16 }}
              >
                {score}
              </motion.div>
              <motion.div
                className={`gameover-best ${newRecord ? 'new-record' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {newRecord
                  ? <>✦ Nouveau record · meilleur : <strong>{best}</strong></>
                  : <>Meilleur : <strong>{best}</strong></>
                }
              </motion.div>
              <motion.div
                className="gameover-cta-group"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <button className="gameover-cta-secondary" onClick={onExit}>Quitter</button>
                <button className="gameover-cta-primary" onClick={restart}>Réessayer</button>
              </motion.div>
            </div>
            {newRecord && <Confetti active duration={3000} intensity={1} />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// (Lot 3a) DailyScreen et AuditScreen supprimés — remplacés par SprintScreen
// ============================================================================

// ============================================================================
// HOME SCREEN
// ============================================================================
function HomeScreen({ state, onStartQuestion, onFlameDown, onFlameUp, onXpTap, onOpenStats, onOpenSettings, onOpenGuest }) {
  const { streak, level, xp, xpToday, xpNextLevel, xpPrevLevel, questsDone, questsTotal, totalQ, rate, bestCombo, quests, freezes, x3Remaining } = state;
  const progress = ((xp - xpPrevLevel) / (xpNextLevel - xpPrevLevel)) * 100;

  const modes = [
    { key: 'libre', title: 'Quizz libre', sub: 'adaptatif · ∞', Icon: InfinityIcon, primary: true },
    { key: 'sprint', title: 'Sprint', sub: '3 · 5 · 7 min · chrono', Icon: Clock },
    { key: 'survie', title: 'Survie', sub: 'jusqu\'à la 1ʳᵉ faute', Icon: Heart },
    { key: 'revision', title: 'Révision ciblée', sub: 'choisis un chapitre · sans XP', Icon: BookOpen, full: true },
  ];

  return (
    <motion.div
      className="phone"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
    >
      {/* Top bar */}
      <div className="topbar">
        <div
          className="pill pill-accent"
          onPointerDown={onFlameDown}
          onPointerUp={onFlameUp}
          onPointerLeave={onFlameUp}
          onPointerCancel={onFlameUp}
          style={{ userSelect: 'none', touchAction: 'manipulation' }}
        >
          <BreathingFlame size={13} />
          <span><AnimatedNumber value={streak} /></span>
          <span className="pill-muted" style={{ fontSize: 11 }}>j</span>
        </div>
        <motion.button
          className="pill pill-level"
          style={{ justifySelf: 'center', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
          onClick={onOpenStats}
          whileTap={{ scale: 0.94 }}
        >
          <Star size={12} fill="currentColor" />
          <span>N{level}</span>
          <ChevronRight size={11} style={{ opacity: 0.4, marginLeft: -2 }} />
        </motion.button>
        <div
          className="pill"
          style={{ color: 'var(--text-1)', cursor: 'pointer', userSelect: 'none', position: 'relative' }}
          onClick={onXpTap}
        >
          {x3Remaining > 0 && (
            <motion.span
              style={{
                position: 'absolute', top: -6, right: -6,
                background: 'linear-gradient(180deg, var(--danger-glow), var(--danger))',
                color: '#FFF', fontSize: 9, fontWeight: 700,
                padding: '2px 6px', borderRadius: 999,
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 0 12px rgba(230,57,70,0.5)',
              }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ×3
            </motion.span>
          )}
          <Zap size={13} fill="var(--accent)" stroke="var(--accent)" />
          <AnimatedNumber value={xp} />
        </div>
        <motion.button
          className="pill-icon"
          onClick={onOpenSettings}
          whileTap={{ scale: 0.92 }}
          aria-label="Réglages"
        >
          <Settings size={15} strokeWidth={1.8} />
        </motion.button>
      </div>

      {/* Hero */}
      <motion.div
        className="hero"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.2, 0.7, 0.3, 1] }}
      >
        <div className="hero-eyebrow">Niveau {level}</div>
        <h1 className="hero-title">
          <em>{LEVEL_NAMES[level - 1]}</em>
        </h1>
        <div className="hero-bar" aria-hidden>
          <motion.div
            className="hero-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.2, 0.7, 0.3, 1] }}
          />
        </div>
        <div className="hero-meta">
          <span>+<strong>{xpToday}</strong> XP aujourd'hui</span>
          <span><strong>{xpNextLevel - xp}</strong> XP → N{level + 1}</span>
        </div>
      </motion.div>

      {/* Quests */}
      <div>
        <div className="section-title">
          <span>Quêtes du jour</span>
          <span className="count">{questsDone}/{questsTotal}</span>
        </div>
        <div className="quest-list">
          {quests.map((q, i) => {
            const Icon = q.Icon;
            const pct = Math.min(100, (q.current / q.target) * 100);
            const locked = q.locked === true;
            return (
              <motion.div
                key={q.id}
                className={`quest ${q.done ? 'done' : ''} ${locked ? 'locked' : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <div className="quest-icon"><Icon size={16} /></div>
                <div>
                  <div className="quest-text">{q.text}</div>
                  <div className="quest-sub">
                    {locked ? (q.lockedReason || 'Bientôt') : `${q.current}/${q.target}`}
                  </div>
                  <div className="quest-prog">
                    <motion.div className="quest-prog-fill" initial={{ width: 0 }} animate={{ width: locked ? 0 : `${pct}%` }} transition={{ delay: 0.3 + i * 0.06, duration: 0.6 }} />
                  </div>
                </div>
                <div className="quest-xp">{locked ? '🔒' : `+${q.xp}`}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modes */}
      <div>
        <div className="section-title">
          <span>Modes</span>
        </div>
        <div className="modes">
          {modes.map((m, i) => {
            const Icon = m.Icon;
            return (
              <motion.button
                key={m.key}
                className={`mode ${m.primary ? 'primary' : ''} ${m.full ? 'full' : ''}`}
                onClick={() => onStartQuestion(m.key)}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <div className="mode-icon"><Icon size={14} /></div>
                <h3 className="mode-title">{m.title}</h3>
                <div className="mode-sub">{m.sub}</div>
                <div className="mode-cta"><ChevronRight size={14} /></div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Stats strip */}
      <div className="stats-strip">
        <div className="stat-cell">
          <div className="stat-num"><AnimatedNumber value={totalQ} /></div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num"><AnimatedNumber value={rate} format={(v) => `${v}%`} /></div>
          <div className="stat-label">Réussite</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num"><AnimatedNumber value={bestCombo} /></div>
          <div className="stat-label">Combo max</div>
        </div>
      </div>

      {/* Mode invité — entrée discrète, isolation totale des stats perso */}
      <motion.button
        className="guest-entry"
        onClick={onOpenGuest}
        whileTap={{ scale: 0.985 }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="guest-entry-icon">
          <UserPlus size={16} strokeWidth={1.8} />
        </div>
        <div className="guest-entry-text">
          <div className="guest-entry-title">Mode invité</div>
          <div className="guest-entry-sub">partage l'app avec un collègue · stats isolées</div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
      </motion.button>
    </motion.div>
  );
}

// ============================================================================
// QUESTION SCREEN
// ============================================================================
function QuestionScreen({ state, dispatch }) {
  const {
    questionData, selected, validated, isCorrect, isBonus, isGolden,
    x3Remaining, comboStreak, streak, xp, ripples, showXpFly, xpGain,
    showBurst, onBack, onNext,
    // Lot 3b.2 — navigation arrière
    isConsulting, historyLength, historyIdx,
    canGoPrev, canGoNext,
    onHistoryPrev, onHistoryNext, onResume,
  } = state;

  const handleSelect = useCallback((idx, evt) => {
    if (validated || isConsulting) return;
    // Ripple
    const rect = evt.currentTarget.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    dispatch({ type: 'ADD_RIPPLE', payload: { x, y, propIdx: idx } });
    setTimeout(() => dispatch({ type: 'VALIDATE', payload: idx }), 320);
  }, [validated, dispatch, isConsulting]);

  const comboClass = comboStreak >= 10 ? 'fire' : comboStreak >= 5 ? 'hot' : '';

  return (
    <motion.div
      className="phone"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
    >
      {/* Q top bar */}
      <div className="q-top">
        <div className="q-nav-arrows">
          <motion.button className="q-back" onClick={onBack} whileTap={{ scale: 0.92 }} aria-label="Quitter">
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
          </motion.button>
          {/* Lot 3b.2 — chevron Précédent (visible si historique disponible) */}
          {(canGoPrev || isConsulting) && (
            <motion.button
              className="q-nav-btn"
              onClick={onHistoryPrev}
              whileTap={{ scale: 0.92 }}
              disabled={!canGoPrev}
              aria-label="Question précédente"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            </motion.button>
          )}
          {/* Lot 3b.2 — chevron Suivant (en mode consultation uniquement) */}
          {isConsulting && (
            <motion.button
              className="q-nav-btn"
              onClick={onHistoryNext}
              whileTap={{ scale: 0.92 }}
              aria-label="Question suivante"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ChevronRight size={16} />
            </motion.button>
          )}
        </div>
        {isConsulting ? (
          <div className="q-consult-tag">
            Consultation · {historyIdx + 1}/{historyLength}
          </div>
        ) : (
          <motion.div
            className={`combo-meter ${comboClass}`}
            animate={comboClass ? { boxShadow: ['0 0 20px rgba(245,158,11,0.3)', '0 0 32px rgba(245,158,11,0.5)', '0 0 20px rgba(245,158,11,0.3)'] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            {comboClass === 'fire' && (
              <motion.span animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                <Flame size={14} fill="var(--danger)" stroke="var(--danger)" />
              </motion.span>
            )}
            {comboClass === 'hot' && <Flame size={13} fill="var(--accent)" stroke="var(--accent)" />}
            <span className="combo-label">Combo</span>
            <span className="combo-num"><AnimatedNumber value={comboStreak} /></span>
          </motion.div>
        )}
        <div className="pill" style={{ color: 'var(--text-1)', position: 'relative' }}>
          {x3Remaining > 0 && (
            <motion.span
              style={{
                position: 'absolute', top: -6, right: -6,
                background: 'linear-gradient(180deg, var(--danger-glow), var(--danger))',
                color: '#FFF', fontSize: 9, fontWeight: 700,
                padding: '2px 6px', borderRadius: 999,
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 0 12px rgba(230,57,70,0.5)',
              }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ×3
            </motion.span>
          )}
          <Zap size={13} fill="var(--accent)" stroke="var(--accent)" />
          <AnimatedNumber value={xp} />
        </div>
      </div>

      {/* Bonus banner */}
      <AnimatePresence>
        {isBonus && !validated && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{
              margin: '0 4px',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'linear-gradient(90deg, var(--danger-soft), var(--accent-soft))',
              border: '1px solid rgba(245,158,11,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-1)',
              boxShadow: '0 0 24px rgba(245,158,11,0.2)',
            }}
          >
            <motion.span animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>
              <Sparkles size={14} fill="var(--accent)" stroke="var(--accent)" />
            </motion.span>
            <span>BONUS ×2 XP sur cette question</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lot 3b.2 — Bandeau référentiel/édition prominent */}
      <div className="q-context-strip">
        <span className="ref-pill">
          <span>{questionData.referentiel || 'R1'}</span>
          <span className="ref-sep">·</span>
          <span className="ref-edition">Éd. {questionData.edition}</span>
        </span>
        <span className="q-context-info">
          <span className="ctx-chapter">§{questionData.chapitre}</span>
          <span className="ctx-dot" />
          <span>{questionData.theme}</span>
        </span>
      </div>

      {/* Question */}
      <motion.div
        className={`q-card ${isGolden ? 'golden' : ''}`}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        {isGolden && (
          <motion.div
            className="golden-tag"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={10} fill="currentColor" strokeWidth={0} />
            QUESTION DORÉE · +5 XP
          </motion.div>
        )}
        <p className="q-text">{questionData.enonce}</p>
      </motion.div>

      {/* Propositions */}
      <div className="props">
        {questionData.propositions.map((p, idx) => {
          const isSelected = selected === idx;
          const isThisCorrect = validated && idx === questionData.bonneReponse;
          const isThisWrong = validated && isSelected && !isCorrect;
          const cls = isThisCorrect ? 'correct' : isThisWrong ? 'wrong' : '';
          const letter = ['A', 'B', 'C', 'D', 'E'][idx];
          return (
            <motion.button
              key={idx}
              className={`prop ${cls}`}
              onClick={(e) => handleSelect(idx, e)}
              whileTap={!validated ? { scale: 0.985 } : {}}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + idx * 0.04 }}
              disabled={validated}
            >
              <span className="prop-letter">{letter}</span>
              <span>{p}</span>
              <span className="prop-result">
                {isThisCorrect && <Check size={14} strokeWidth={3} />}
                {isThisWrong && <X size={14} strokeWidth={3} />}
              </span>

              {/* Ripples in this prop */}
              {ripples.filter(r => r.propIdx === idx).map(r => (
                <span className="ripple" key={r.id}>
                  <motion.span
                    className="ripple-circle"
                    style={{ left: r.x, top: r.y }}
                    initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.6 }}
                    animate={{ width: 600, height: 600, x: -300, y: -300, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </span>
              ))}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {validated && (
          <motion.div
            className={`feedback ${isCorrect ? 'ok' : 'ko'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <span className="feedback-tag">
              {isCorrect ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {isCorrect ? 'Bonne réponse' : 'Mauvaise réponse'}
            </span>
            <div className="feedback-text">{questionData.explication}</div>
            <div className="feedback-ref">{questionData.reference}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next / Resume — Lot 3b.2 */}
      <AnimatePresence>
        {validated && (
          <motion.button
            className="next-btn next-btn-floating"
            onClick={isConsulting
              ? (canGoNext ? onHistoryNext : onResume)
              : onNext}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
          >
            {isConsulting
              ? (canGoNext ? 'Suivante (consultation)' : 'Reprendre le quizz')
              : 'Question suivante'}
            <ArrowRight size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* XP fly */}
      <AnimatePresence>
        {showXpFly && (
          <div className="xp-fly-host">
            <motion.div
              className={`xp-fly ${isBonus ? 'bonus' : ''}`}
              initial={{ opacity: 0, scale: 0.4, y: 0, x: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.4, 1.4, 1, 0.7],
                y: [0, -40, -180, -260],
                x: [0, 30, 80, 130],
              }}
              transition={{ duration: 1.2, times: [0, 0.2, 0.7, 1] }}
            >
              <Zap size={14} fill="currentColor" />
              +{xpGain}{isBonus ? ' ×2' : ''}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// LEVEL-UP SCREEN
// ============================================================================
function LevelUpScreen({ newLevel, onContinue }) {
  return (
    <motion.div
      className="levelup-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Animated halo */}
      <motion.div
        className="levelup-halo"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.2, 1], opacity: [0, 0.8, 0.5] }}
        transition={{ duration: 1.4, ease: [0.2, 0.7, 0.3, 1] }}
      />
      <motion.div
        className="levelup-halo"
        style={{ background: 'radial-gradient(circle, rgba(230,57,70,0.25), rgba(230,57,70,0) 60%)' }}
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <button className="levelup-skip" onClick={onContinue}>Passer</button>

      <div className="levelup-content">
        <motion.div
          className="levelup-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          NIVEAU ATTEINT
        </motion.div>

        <motion.div
          className="levelup-num"
          initial={{ scale: 0.4, opacity: 0, rotateX: -45 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 18 }}
        >
          {newLevel}
        </motion.div>

        <motion.h2
          className="levelup-name"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          {LEVEL_NAMES[newLevel - 1]}
        </motion.h2>

        <motion.div
          className="levelup-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          Multi-réponses débloquées · 30 % des questions
          <br />
          Mode audit terrain plus fréquent
        </motion.div>

        <motion.button
          className="levelup-cta"
          onClick={onContinue}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.96 }}
          transition={{ delay: 1.5, type: 'spring', stiffness: 220 }}
        >
          Continuer
        </motion.button>
      </div>

      <Confetti active duration={3500} intensity={1.4} />
    </motion.div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
const LEVEL_NAMES = ['Apprenti', 'Initié', 'Confirmé', 'Expert', 'Maître R1'];

const Q_SAMPLE = {
  edition: '2025',
  chapitre: '9.2',
  theme: 'Sources d\'eau',
  enonce: 'Selon la R1 2025, quelle est l\'autonomie minimale d\'une source d\'eau de type A ?',
  propositions: ['30 minutes', '60 minutes', '90 minutes', '120 minutes'],
  bonneReponse: 0,
  explication: 'L\'autonomie de la source A est de 30 minutes selon §9.2, quelle que soit la classe de risque (LH, OH, HHP, HHS). Seule la source B varie : 60 min en LH/OH, 90 min en HHP/HHS. Piège classique : ne pas confondre avec les durées de la source B.',
  reference: 'R1 §9.2 (édition 2025)',
};

// Banks pour les modes — questions à fact-checker contre R1 2025 (lui = source primaire)
const SURVIVAL_BANK = [
  {
    edition: '2025', chapitre: '9.2', theme: 'Sources d\'eau',
    enonce: 'Autonomie minimale d\'une source A ?',
    propositions: ['30 min', '60 min', '90 min', 'Dépend de la classe'],
    bonneReponse: 0,
    explication: 'Source A = 30 min toujours, quelle que soit la classe.',
    reference: 'R1 §9.2',
  },
  {
    edition: '2025', chapitre: '9.3.1', theme: 'Sources d\'eau',
    enonce: 'Autonomie source B en HHP ?',
    propositions: ['30 min', '60 min', '90 min', '120 min'],
    bonneReponse: 2,
    explication: 'Source B en HHP/HHS = 90 min. En LH/OH = 60 min.',
    reference: 'R1 §9.3.1',
  },
  {
    edition: '2025', chapitre: 'Annexe', theme: 'Procédures Q1',
    enonce: 'Le rapport Q1 est transmis sous quel délai ?',
    propositions: ['7 jours', '15 jours', '30 jours', '60 jours'],
    bonneReponse: 2,
    explication: 'Le rapport Q1 doit être transmis dans les 30 jours à l\'exploitant, l\'assureur et le CNPP.',
    reference: 'R1 Annexe Q1',
  },
  {
    edition: '2025', chapitre: 'Formulaires', theme: 'Procédures',
    enonce: 'Le formulaire N100 désigne quoi ?',
    propositions: [
      'Avis de remise en service',
      'Avis de mise hors service',
      'Rapport d\'incident',
      'Demande de dérogation',
    ],
    bonneReponse: 1,
    explication: 'Depuis 2002, le N100 est l\'« Avis de mise hors service » (ex-« remise en service » avant 2002).',
    reference: 'R1 Formulaires N100',
  },
  {
    edition: '2025', chapitre: 'Suivi', theme: 'Registre',
    enonce: 'Le S1B est :',
    propositions: [
      'Le rapport semestriel externe',
      'Le registre de suivi qui reste au local sources',
      'Le formulaire essai annuel des postes',
      'Un avis de mise hors service',
    ],
    bonneReponse: 1,
    explication: 'Le S1B est le registre de suivi des interventions, qui reste sur site, mis à jour à chaque intervention. À ne pas confondre avec le Q1 (rapport externe).',
    reference: 'R1 Procédures S1B',
  },
];

const DAILY_BANK = [
  // Le seed sera dérivé de la date, mais pour la démo on prend les 10 premières
  ...SURVIVAL_BANK,
  {
    edition: '2025', chapitre: 'T6.1', theme: 'Débits T6.1',
    enonce: 'Débit/surface pour OH1 selon T6.1 ?',
    propositions: ['2,25 l/m²/min × 84 m²', '5 l/m²/min × 72 m²', '5 l/m²/min × 144 m²', '7,5 l/m²/min × 260 m²'],
    bonneReponse: 1,
    explication: 'OH1 → 5 l/m²/min sur 72 m². À ne pas confondre avec LH (2,25 × 84) ou OH2 (5 × 144).',
    reference: 'R1 Tableau T6.1',
  },
  {
    edition: '2025', chapitre: '9.3.1', theme: 'Sources d\'eau',
    enonce: 'Autonomie source B en LH/OH ?',
    propositions: ['30 min', '60 min', '90 min', '120 min'],
    bonneReponse: 1,
    explication: 'En LH et OH, la source B doit fournir 60 min. En HHP/HHS, c\'est 90 min.',
    reference: 'R1 §9.3.1',
  },
  {
    edition: '2025', chapitre: '12', theme: 'Postes',
    enonce: 'Un poste de contrôle doit être accessible :',
    propositions: ['Seulement en heures ouvrées', '24h/24, 7j/7', 'Sur demande à l\'exploitant', 'Selon protocole interne'],
    bonneReponse: 1,
    explication: 'L\'accessibilité du poste de contrôle doit être permanente (24/7).',
    reference: 'R1 §12',
  },
  {
    edition: '2025', chapitre: 'T6.1', theme: 'Débits T6.1',
    enonce: 'Débit/surface pour LH selon T6.1 ?',
    propositions: ['2,25 l/m²/min × 84 m²', '5 l/m²/min × 72 m²', '5 l/m²/min × 144 m²', '7,5 l/m²/min × 260 m²'],
    bonneReponse: 0,
    explication: 'LH (Light Hazard) → 2,25 l/m²/min sur 84 m². Le plus faible de la grille.',
    reference: 'R1 Tableau T6.1',
  },
  {
    edition: '2025', chapitre: 'T6.1', theme: 'Débits T6.1',
    enonce: 'Débit/surface pour HHP1 selon T6.1 ?',
    propositions: ['5 l/m²/min × 216 m²', '7,5 l/m²/min × 260 m²', '10 l/m²/min × 260 m²', '12,5 l/m²/min × 260 m²'],
    bonneReponse: 1,
    explication: 'HHP1 → 7,5 l/m²/min sur 260 m². HHP2 = 10, HHP3 = 12,5, HHP4 = RS.',
    reference: 'R1 Tableau T6.1',
  },
];

// Pool de questions pour le mode Quizz libre (toutes éditions confondues)
const LIBRE_POOL = [Q_SAMPLE, ...DAILY_BANK];
const pickQuestion = (exclude = null) => {
  if (LIBRE_POOL.length <= 1) return LIBRE_POOL[0];
  let q;
  let safety = 0;
  do {
    q = LIBRE_POOL[Math.floor(Math.random() * LIBRE_POOL.length)];
    safety++;
  } while (exclude && q === exclude && safety < 10);
  return q;
};

// Helper pur : tire une question depuis le vrai catalogue chargé
// Options : { audit: bool|null, multi: bool, exclude: questionObject, ratio: float, r1Strict: bool }
//   audit=true → uniquement scénarios terrain ; false → uniquement non-audit ; null → mix
//   ratio = part de R1 2025 (par défaut 0.8). Le reste tire dans les autres référentiels/éditions.
//   r1Strict=true → ne tire QUE dans R1 édition 2025 (Lot 3b — Quizz libre, Sprint, Survie, Révision)
function pickFromCatalog(catalog, options = {}) {
  if (!Array.isArray(catalog) || catalog.length === 0) return null;
  const { audit = null, multi = false, exclude = null, ratio = 0.8, r1Strict = false } = options;

  // Filtrage de base
  let pool = catalog.filter(q => q.multi === multi);
  if (audit === true) pool = pool.filter(q => q.mode_audit === true);
  else if (audit === false) pool = pool.filter(q => q.mode_audit === false);

  if (pool.length === 0) return null;

  // Mode strict R1 2025 : pas de mélange, on garde uniquement les questions R1 / édition 2025
  if (r1Strict) {
    pool = pool.filter(q => (q.referentiel === 'R1' || !q.referentiel) && q.edition === '2025');
    if (pool.length === 0) return null;
    let q;
    let safety = 0;
    do {
      q = pool[Math.floor(Math.random() * pool.length)];
      safety++;
    } while (exclude && q && exclude.id && q.id === exclude.id && safety < 10);
    return q;
  }

  // Pondération par référentiel/édition (mode legacy, conservé pour rétrocompat)
  const primary = pool.filter(q => q.referentiel === 'R1' && q.edition === '2025');
  const secondary = pool.filter(q => !(q.referentiel === 'R1' && q.edition === '2025'));
  const useprimary = Math.random() < ratio && primary.length > 0;
  const finalPool = useprimary ? primary : (secondary.length > 0 ? secondary : primary);

  let q;
  let safety = 0;
  do {
    q = finalPool[Math.floor(Math.random() * finalPool.length)];
    safety++;
  } while (exclude && q && exclude.id && q.id === exclude.id && safety < 10);
  return q;
}


const AUDIT_BANK = [
  {
    edition: '2025', chapitre: '12', theme: 'Audit Q1',
    scenario: 'Vous arrivez chez un client en vérification semestrielle. La vanne d\'isolation de la source A est plombée en position fermée.',
    enonce: 'Action conforme R1 ?',
    propositions: [
      'Plomber tel quel et noter l\'observation au Q1',
      'Faire ouvrir + plomber position ouverte immédiatement, NC avec risque',
      'Demander l\'avis de l\'exploitant avant action',
      'Reporter au prochain contrôle',
    ],
    bonneReponse: 1,
    explication: 'Une vanne d\'isolation source plombée fermée empêche le fonctionnement du système. Action immédiate requise + NC avec risque dans le Q1.',
    reference: 'R1 §9.2 + procédures Q1',
  },
  {
    edition: '2025', chapitre: 'S1B', theme: 'Audit Q1',
    scenario: 'À l\'arrivée sur site, vous demandez le S1B et l\'exploitant le cherche pendant 20 min. Il vous le présente : dernière entrée il y a 4 mois.',
    enonce: 'Qualification de l\'observation ?',
    propositions: [
      'NC avec risque (urgent)',
      'NC sans risque (à lever avant prochain Q1)',
      'Observation simple',
      'Remise en état',
    ],
    bonneReponse: 1,
    explication: 'Le S1B doit être tenu à jour à chaque intervention. Un retard ne crée pas un risque immédiat sur le système, mais doit être levé : NC sans risque.',
    reference: 'R1 Registre S1B',
  },
  {
    edition: '2025', chapitre: '14', theme: 'Audit Q1',
    scenario: 'Lors de l\'inspection visuelle, vous repérez un sprinkleur recouvert de peinture sur la canalisation en zone de stockage.',
    enonce: 'Qualification ?',
    propositions: [
      'Observation à mentionner',
      'NC sans risque',
      'NC avec risque — remplacement immédiat',
      'Aucune anomalie si la peinture est récente',
    ],
    bonneReponse: 2,
    explication: 'Un sprinkleur peint ne peut plus fonctionner correctement (sensibilité de l\'ampoule altérée). NC avec risque, remplacement immédiat requis.',
    reference: 'R1 §7',
  },
];

export default function App() {
  // ---- Persistent-ish state (in-memory) ----
  // Lot 3b — chargement de l'état persistant en localStorage
  // Au 1er lancement, persistedState est null et les useState prennent leur valeur par défaut (0/1).
  // Sinon on hydrate avec ce qui est stocké.
  const persistedRef = useRef(null);
  if (persistedRef.current === null) {
    persistedRef.current = loadAppState() || {};
  }
  const initFrom = (key, fallback) => {
    const v = persistedRef.current[key];
    return (v === undefined || v === null) ? fallback : v;
  };

  const [screen, setScreen] = useState('home'); // home | question | levelup
  const [xp, setXp] = useState(() => initFrom('xp', FIRST_RUN_DEFAULTS.xp));
  const [xpToday, setXpToday] = useState(() => initFrom('xpToday', FIRST_RUN_DEFAULTS.xpToday));
  const [level, setLevel] = useState(() => initFrom('level', FIRST_RUN_DEFAULTS.level));
  const [streak, setStreak] = useState(() => initFrom('streak', FIRST_RUN_DEFAULTS.streak));
  const [comboStreak, setComboStreak] = useState(0);
  const [bestCombo, setBestCombo] = useState(() => initFrom('bestCombo', FIRST_RUN_DEFAULTS.bestCombo));
  const [totalQ, setTotalQ] = useState(() => initFrom('totalQ', FIRST_RUN_DEFAULTS.totalQ));
  const [correctQ, setCorrectQ] = useState(() => initFrom('correctQ', FIRST_RUN_DEFAULTS.correctQ));
  const [rate, setRate] = useState(() => initFrom('rate', FIRST_RUN_DEFAULTS.rate));
  const xpPrevLevel = 2500;
  const xpNextLevel = 4000;

  const [quests, setQuests] = useState(() => {
    const persisted = persistedRef.current?.quests;
    const defaults = [
      { id: 1, text: '10 questions aujourd\'hui', current: 0, target: 10, xp: 50, Icon: Target, done: false },
      { id: 2, text: '5 bonnes d\'affilée', current: 0, target: 5, xp: 50, Icon: TrendingUp, done: false },
      { id: 3, text: '1 intervention aujourd\'hui', current: 0, target: 1, xp: 50, Icon: Crosshair, done: false, locked: true, lockedReason: 'Mode Intervention bientôt disponible' },
    ];
    // Si persisté, on fusionne les champs `current` et `done` sur les defaults (le reste reste fixe)
    if (Array.isArray(persisted)) {
      return defaults.map((d, i) => {
        const p = persisted.find(q => q.id === d.id);
        if (!p) return d;
        return { ...d, current: p.current ?? 0, done: p.done ?? false };
      });
    }
    return defaults;
  });
  const questsDone = quests.filter(q => q.done).length;

  // ---- Question state ----
  const [catalog, setCatalog] = useState(null); // chargé au mount depuis public/questions.json
  const [currentQ, setCurrentQ] = useState(() => pickQuestion());
  const [selected, setSelected] = useState(null);
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [forceBonus, setForceBonus] = useState(false);
  const [isBonus, setIsBonus] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [showXpFly, setShowXpFly] = useState(false);
  const [xpGain, setXpGain] = useState(0);
  const [showBurst, setShowBurst] = useState(false);

  // ---- Lot 3b.2 — Historique session (navigation arrière) ----
  // Liste des questions répondues dans la session courante (max 30, oldest dropped)
  // Pas persisté (session-only).
  const [questionHistory, setQuestionHistory] = useState([]);
  // null en mode normal, index dans questionHistory en mode consultation
  const [historyIdx, setHistoryIdx] = useState(null);
  const HISTORY_MAX = 30;

  // ---- Overlay states ----
  const [showRecord, setShowRecord] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [bigConfetti, setBigConfetti] = useState(false);

  // ---- Celebration / mystery / golden / milestone ----
  const [celebVariant, setCelebVariant] = useState(null); // 'rings' | 'sparkles' | 'wave' | 'pulse' | 'constellation'
  const [showCeleb, setShowCeleb] = useState(false);
  const [correctSinceMbox, setCorrectSinceMbox] = useState(0);
  const [nextMboxAt, setNextMboxAt] = useState(() => 15 + Math.floor(Math.random() * 11)); // 15-25
  const [showMbox, setShowMbox] = useState(false);
  const [pendingMbox, setPendingMbox] = useState(false);
  const [isGolden, setIsGolden] = useState(false);
  const [forceGolden, setForceGolden] = useState(false);
  const [milestoneValue, setMilestoneValue] = useState(null);
  const [x3Remaining, setX3Remaining] = useState(() => initFrom('x3Remaining', FIRST_RUN_DEFAULTS.x3Remaining));
  const [freezes, setFreezes] = useState(() => initFrom('freezes', FIRST_RUN_DEFAULTS.freezes));

  // ---- Easter eggs ----
  const [eggText, setEggText] = useState(null);
  const [eggSparkles, setEggSparkles] = useState(null);
  const xpTapCount = useRef(0);
  const xpTapTimer = useRef(null);
  const flameHoldTimer = useRef(null);

  // ---- Stats & badges ----
  // Lot 3b — réhydrate les badges débloqués depuis localStorage
  const [badges, setBadges] = useState(() => {
    const unlocked = loadUnlockedBadges();
    return BADGES.map(b => ({ ...b, unlocked: unlocked.has(b.id) || b.unlocked }));
  });
  const [badgeUnlocking, setBadgeUnlocking] = useState(null); // badge object or null
  const [badgeDetail, setBadgeDetail] = useState(null);

  // ---- Demo controls ----
  const [demoOpen, setDemoOpen] = useState(false);
  const [forceCorrect, setForceCorrect] = useState(null); // null | true | false

  // ---- Settings ----
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ---- Lot INTER — mode de jeu + ratios + éditions R1 ----
  // quizMode = "libre" (R1 2025 strict) | "intervention" (multi-référentiels pondérés)
  const [quizMode, setQuizMode] = useState(() => initFrom('quizMode', 'libre'));
  const [interventionRatios, setInterventionRatios] = useState(() =>
    initFrom('interventionRatios', DEFAULT_INTERVENTION_RATIOS)
  );
  const [interventionEditionsR1, setInterventionEditionsR1] = useState(() =>
    initFrom('interventionEditionsR1', DEFAULT_EDITIONS_R1)
  );

  // ---- Lot 3b : persistance localStorage ----
  // À chaque changement d'un état persistant, on sauvegarde.
  // Le debounce naturel de React (batch) suffit, pas besoin de timer.
  useEffect(() => {
    // On sérialise les quêtes sans les Icon (fonctions React non sérialisables)
    const serializedQuests = quests.map(q => ({
      id: q.id,
      current: q.current,
      done: q.done,
    }));
    saveAppState({
      xp, xpToday, level, streak, bestCombo,
      totalQ, correctQ, rate, freezes, x3Remaining,
      quests: serializedQuests,
      // Lot INTER
      quizMode, interventionRatios, interventionEditionsR1,
    });
  }, [xp, xpToday, level, streak, bestCombo, totalQ, correctQ, rate, freezes, x3Remaining, quests, quizMode, interventionRatios, interventionEditionsR1]);

  // À chaque changement des badges, on sauvegarde le Set des ids débloqués.
  useEffect(() => {
    const unlockedIds = new Set(badges.filter(b => b.unlocked).map(b => b.id));
    saveUnlockedBadges(unlockedIds);
  }, [badges]);

  const resetQuestion = () => {
    setSelected(null);
    setValidated(false);
    setIsCorrect(false);
    setRipples([]);
    setShowXpFly(false);
    setShowBurst(false);
    setShowCeleb(false);
    setCelebVariant(null);
    setIsBonus(forceBonus || Math.random() < 0.08); // ~8% bonus
    setIsGolden(forceGolden || Math.random() < 0.05); // ~5% golden
    setForceBonus(false);
    setForceGolden(false);
    // Tire dans le vrai catalogue si chargé, sinon fallback sur le mini pool
    if (catalog && catalog.length > 0) {
      // Lot INTER — le picker honore le mode actif (libre / intervention)
      const q = pickFromCatalogV2(catalog, {
        mode: quizMode,
        audit: false,
        multi: false,
        exclude: currentQ,
        ratios: interventionRatios,
        editionsR1: interventionEditionsR1,
      });
      if (q) setCurrentQ(q);
    } else {
      setCurrentQ(prev => pickQuestion(prev));
    }
  };

  const handleStartQuestion = (mode = 'libre') => {
    if (mode === 'libre') {
      resetQuestion();
      setScreen('question');
    } else if (mode === 'survie') {
      setScreen('survival');
    } else if (mode === 'sprint') {
      setScreen('sprint');
    } else if (mode === 'revision') {
      // À implémenter — pour l'instant fallback libre
      resetQuestion();
      setScreen('question');
    }
  };

  const handleModeXpGain = (amount) => {
    setXp(x => x + amount);
    setXpToday(x => x + amount);
    setTotalQ(n => n + 1);
  };

  // Lot 3a — Sprint perso : à la fin d'un sprint, on a déjà l'XP via onXpGain.
  // Ici on peut afficher célébration / milestone / etc. selon les badges débloqués.
  const handleSprintComplete = (data) => {
    // data = { score, good, bad, skipped, xp, isPerfect, isNewRecord, newBadges, durationMin, history }
    // L'XP a déjà été ajoutée via onXpGain. On déclenche juste les célébrations.
    if (data.isNewRecord || (data.newBadges && data.newBadges.length > 0)) {
      // Petite célébration douce (réutilise le système existant)
      const variants = ['rings', 'sparkles', 'wave', 'pulse', 'constellation'];
      const variant = variants[Math.floor(Math.random() * variants.length)];
      setCelebVariant(variant);
      setShowCeleb(true);
      setTimeout(() => setShowCeleb(false), 1800);
    }
  };

  const handleBack = () => {
    setScreen('home');
    setComboStreak(0);
  };

  const handleAnswer = (idx) => {
    const correct = forceCorrect !== null ? forceCorrect : (idx === currentQ.bonneReponse);
    setForceCorrect(null);

    setIsCorrect(correct);
    setValidated(true);

    let gain = correct ? 10 : 5;
    if (correct && isBonus) gain *= 2;
    if (correct && isGolden) gain += 5;
    if (correct && x3Remaining > 0) gain *= 3;
    setXpGain(gain);

    // Pick celebration variant for this answer
    if (correct) {
      const v = CELEB_VARIANTS[Math.floor(Math.random() * CELEB_VARIANTS.length)];
      setCelebVariant(v);
    }

    // Burst & fly
    setTimeout(() => {
      setShowXpFly(true);
      if (correct) {
        setShowBurst(true);
        setShowCeleb(true);
      }
    }, 220);

    setTimeout(() => {
      setXp(x => x + gain);
      setXpToday(x => x + gain);
      setShowXpFly(false);
    }, 1100);

    setTimeout(() => setShowBurst(false), 1200);
    setTimeout(() => setShowCeleb(false), 1500);

    // x3 counter
    if (correct && x3Remaining > 0) {
      setX3Remaining(n => n - 1);
    }

    // Combo update
    if (correct) {
      const newCombo = comboStreak + 1;
      setComboStreak(newCombo);

      // Milestone messages
      if (MILESTONE_MESSAGES[newCombo]) {
        setTimeout(() => {
          setMilestoneValue(newCombo);
          setTimeout(() => setMilestoneValue(null), 1900);
        }, 900);
      }

      // New record
      if (newCombo > bestCombo) {
        setBestCombo(newCombo);
        setTimeout(() => {
          setShowRecord(true);
          setBigConfetti(true);
          setTimeout(() => setBigConfetti(false), 3500);
          setTimeout(() => setShowRecord(false), 4200);
        }, 1300);
      }

      // Mystery box trigger
      const newCount = correctSinceMbox + 1;
      setCorrectSinceMbox(newCount);
      if (newCount >= nextMboxAt) {
        setPendingMbox(true);
      }
    } else {
      setComboStreak(0);
    }

    setTotalQ(n => n + 1);
    if (correct) setCorrectQ(n => n + 1);

    // Lot 3b.2 — ajout à l'historique de session
    setQuestionHistory(h => {
      const next = [...h, { q: currentQ, selectedIdx: idx, isCorrect: correct }];
      return next.length > HISTORY_MAX ? next.slice(next.length - HISTORY_MAX) : next;
    });

    // Lot 3b.1.1 — incrémentation des quêtes du jour
    // Q1 : "10 questions aujourd'hui" → +1 à chaque réponse (juste ou fausse)
    // Q2 : "5 bonnes d'affilée" → suit le comboStreak (jusqu'à target)
    // Q3 : "1 intervention" → verrouillée, on ne touche pas
    setQuests(prev => prev.map(q => {
      if (q.locked || q.done) return q;
      let newCurrent = q.current;
      if (q.id === 1) {
        newCurrent = Math.min(q.target, q.current + 1);
      } else if (q.id === 2) {
        // Combo qui vient d'être calculé : si correct, comboStreak+1, sinon 0
        const newCombo = correct ? comboStreak + 1 : 0;
        newCurrent = Math.min(q.target, newCombo);
      }
      const justDone = !q.done && newCurrent >= q.target;
      if (justDone) {
        // Bonus XP à la complétion d'une quête
        setTimeout(() => {
          setXp(x => x + q.xp);
          setXpToday(x => x + q.xp);
        }, 100);
      }
      return { ...q, current: newCurrent, done: q.done || justDone };
    }));
  };

  const handleNext = () => {
    if (pendingMbox) {
      setPendingMbox(false);
      setShowMbox(true);
      return;
    }
    resetQuestion();
  };

  // Lot 3b.2 — Navigation arrière en Quizz libre
  const handleHistoryPrev = () => {
    if (questionHistory.length === 0) return;
    setHistoryIdx(i => {
      if (i === null) return questionHistory.length - 1;
      return Math.max(0, i - 1);
    });
  };
  const handleHistoryNext = () => {
    if (historyIdx === null) return;
    setHistoryIdx(i => {
      if (i === null) return null;
      if (i >= questionHistory.length - 1) return null; // sort de la consultation
      return i + 1;
    });
  };
  const handleResumeFromHistory = () => {
    setHistoryIdx(null);
  };

  const closeMbox = (reward) => {
    setShowMbox(false);
    setCorrectSinceMbox(0);
    setNextMboxAt(15 + Math.floor(Math.random() * 11));
    if (reward) {
      if (reward.id === 'xp100') setXp(x => x + 100);
      if (reward.id === 'x3') setX3Remaining(3);
      if (reward.id === 'freeze') setFreezes(f => f + 1);
    }
    setTimeout(() => resetQuestion(), 250);
  };

  // ---- Easter egg: long press flame ----
  const startFlameHold = () => {
    flameHoldTimer.current = setTimeout(() => {
      const messages = [
        'Tu y crois encore. ✦',
        'Douze jours. Joli.',
        'La R1 te connaît.',
        'Discret, mais visible.',
      ];
      setEggText(messages[Math.floor(Math.random() * messages.length)]);
      setEggSparkles({ x: '50%', y: '50%' });
      setTimeout(() => { setEggText(null); setEggSparkles(null); }, 2000);
    }, 1400);
  };
  const cancelFlameHold = () => {
    if (flameHoldTimer.current) {
      clearTimeout(flameHoldTimer.current);
      flameHoldTimer.current = null;
    }
  };

  // ---- Easter egg: 7 taps on XP ----
  const onXpTap = (e) => {
    xpTapCount.current += 1;
    if (xpTapTimer.current) clearTimeout(xpTapTimer.current);
    xpTapTimer.current = setTimeout(() => { xpTapCount.current = 0; }, 800);
    if (xpTapCount.current >= 7) {
      xpTapCount.current = 0;
      const rect = e?.currentTarget?.getBoundingClientRect();
      const x = rect ? `${rect.left + rect.width / 2}px` : '85%';
      const y = rect ? `${rect.top + rect.height / 2}px` : '60px';
      setEggSparkles({ x, y });
      setEggText('Sept. Tu as l\'œil. ✦');
      setTimeout(() => { setEggSparkles(null); setEggText(null); }, 1800);
    }
  };

  // ---- Stats & badge handlers ----
  const openStats = () => setScreen('stats');
  const closeStats = () => setScreen('home');
  const onBadgePress = (badge) => {
    // Re-déclenche la cinématique pour revoir le badge
    setBadgeUnlocking(badge);
  };
  const triggerBadgeUnlock = (badgeId) => {
    const b = badges.find(x => x.id === badgeId) || badges.find(x => !x.unlocked);
    if (!b) return;
    // Marque débloqué si pas déjà
    if (!b.unlocked) {
      setBadges(arr => arr.map(x => x.id === b.id ? { ...x, unlocked: true, date: 'maintenant' } : x));
    }
    setBadgeUnlocking({ ...b, unlocked: true });
  };
  const closeBadgeUnlock = () => setBadgeUnlocking(null);

  // Ripple cleanup
  useEffect(() => {
    if (ripples.length === 0) return;
    const t = setTimeout(() => setRipples([]), 700);
    return () => clearTimeout(t);
  }, [ripples]);

  // Question dispatcher
  const dispatch = (action) => {
    if (action.type === 'ADD_RIPPLE') {
      setRipples(r => [...r, { id: Date.now() + Math.random(), ...action.payload }]);
      setSelected(action.payload.propIdx);
    } else if (action.type === 'VALIDATE') {
      handleAnswer(action.payload);
    }
  };

  const triggerLevelUp = () => {
    setShowLevelUp(true);
    setBigConfetti(true);
  };

  const closeLevelUp = () => {
    setShowLevelUp(false);
    setLevel(l => Math.min(5, l + 1));
    setBigConfetti(false);
  };

  const triggerRecord = () => {
    setBestCombo(b => b + 1);
    setShowRecord(true);
    setBigConfetti(true);
    setTimeout(() => setBigConfetti(false), 3500);
    setTimeout(() => setShowRecord(false), 4200);
  };

  // Mount: init question on first start
  useEffect(() => {
    resetQuestion();
    // eslint-disable-next-line
  }, []);

  // Mount: charger le catalogue de questions depuis public/questions.json
  useEffect(() => {
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || './';
    fetch(`${base}questions.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Normaliser : bonnes_reponses[0] → bonneReponse (le reste du code attend ce format)
          const normalized = data.map(q => ({
            ...q,
            bonneReponse: Array.isArray(q.bonnes_reponses) ? q.bonnes_reponses[0] : q.bonneReponse,
          }));
          setCatalog(normalized);
          // Première question depuis le vrai catalogue — Lot INTER : respecte le mode actif
          const q = pickFromCatalogV2(normalized, {
            mode: quizMode,
            audit: false,
            multi: false,
            ratios: interventionRatios,
            editionsR1: interventionEditionsR1,
          });
          if (q) setCurrentQ(q);
        }
      })
      .catch(err => {
        console.warn('Catalogue introuvable, fallback sur le mini pool', err);
      });
  }, []);

  return (
    <>
      <style>{TOKENS + GLOBAL_CSS}</style>
      <div className="app-root">
        <BgParticles />

        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <HomeScreen
              key="home"
              state={{
                streak, level, xp, xpToday, xpPrevLevel, xpNextLevel,
                questsDone, questsTotal: quests.filter(q => !q.locked).length,
                totalQ, rate, bestCombo, quests, freezes, x3Remaining,
              }}
              onStartQuestion={handleStartQuestion}
              onFlameDown={startFlameHold}
              onFlameUp={cancelFlameHold}
              onXpTap={onXpTap}
              onOpenStats={openStats}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenGuest={() => setScreen('guest')}
            />
          )}
          {screen === 'question' && (() => {
            // Lot 3b.2 — Mode consultation (lecture seule) si historyIdx défini
            const isConsulting = historyIdx !== null;
            const histItem = isConsulting ? questionHistory[historyIdx] : null;
            const dispQ = isConsulting ? histItem.q : currentQ;
            const dispSelected = isConsulting ? histItem.selectedIdx : selected;
            const dispValidated = isConsulting ? true : validated;
            const dispIsCorrect = isConsulting ? histItem.isCorrect : isCorrect;
            return (
              <QuestionScreen
                key={isConsulting ? `hist-${historyIdx}` : 'question'}
                state={{
                  questionData: dispQ,
                  selected: dispSelected,
                  validated: dispValidated,
                  isCorrect: dispIsCorrect,
                  isBonus: isConsulting ? false : isBonus,
                  isGolden: isConsulting ? false : isGolden,
                  x3Remaining, comboStreak, streak, xp,
                  ripples: isConsulting ? [] : ripples,
                  showXpFly: isConsulting ? false : showXpFly,
                  xpGain,
                  showBurst: isConsulting ? false : showBurst,
                  onBack: handleBack,
                  onNext: handleNext,
                  // Lot 3b.2 — navigation arrière
                  isConsulting,
                  historyLength: questionHistory.length,
                  historyIdx,
                  canGoPrev: questionHistory.length > 0 && (historyIdx === null || historyIdx > 0),
                  canGoNext: historyIdx !== null && historyIdx < questionHistory.length - 1,
                  onHistoryPrev: handleHistoryPrev,
                  onHistoryNext: handleHistoryNext,
                  onResume: handleResumeFromHistory,
                }}
                dispatch={dispatch}
              />
            );
          })()}
          {screen === 'stats' && (
            <StatsScreen
              key="stats"
              state={{ level, xp, streak, bestCombo, totalQ, rate, freezes, badges }}
              onBack={closeStats}
              onBadgePress={onBadgePress}
            />
          )}
          {screen === 'survival' && (
            <SurvivalScreen
              key="survival"
              onExit={() => setScreen('home')}
              onXpGain={handleModeXpGain}
              initialBest={bestCombo}
              bank={catalog ? catalog.filter(q =>
                !q.multi
                && !q.mode_audit
                && (q.referentiel === 'R1' || !q.referentiel)
                && q.edition === '2025'
              ) : null}
            />
          )}
          {screen === 'sprint' && (
            <SprintScreen
              key="sprint"
              catalog={catalog ? catalog.filter(q =>
                (q.referentiel === 'R1' || !q.referentiel)
                && q.edition === '2025'
                && !q.mode_audit
              ) : null}
              onExit={() => setScreen('home')}
              onXpGain={handleModeXpGain}
              onSprintComplete={handleSprintComplete}
            />
          )}
          {screen === 'guest' && (
            <GuestMode
              key="guest"
              catalog={catalog}
              onExit={() => setScreen('home')}
            />
          )}
        </AnimatePresence>

        {/* Celebration variant (tirée au sort) */}
        <AnimatePresence>
          {showCeleb && celebVariant && <Celebration key={celebVariant + Date.now()} variant={celebVariant} />}
        </AnimatePresence>

        {/* Milestone flash */}
        <AnimatePresence>
          {milestoneValue && <MilestoneFlash key={milestoneValue} value={milestoneValue} />}
        </AnimatePresence>

        {/* Easter egg flash */}
        <AnimatePresence>
          {eggText && <EggFlash key={eggText} text={eggText} />}
        </AnimatePresence>
        {eggSparkles && <EggSparkles origin={eggSparkles} />}

        {/* Record toast */}
        <AnimatePresence>
          {showRecord && (
            <motion.div
              className="record-toast"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{
                opacity: 1, y: 0, scale: 1,
              }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <motion.span
                className="pulse-dot"
                animate={{ scale: [1, 1.5, 1], boxShadow: ['0 0 12px var(--accent)', '0 0 24px var(--accent)', '0 0 12px var(--accent)'] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <Trophy size={14} color="var(--accent)" />
              <span style={{ color: 'var(--text-1)' }}>Nouveau record · Combo {bestCombo}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mystery Box */}
        <AnimatePresence>
          {showMbox && <MysteryBox key="mbox" onClose={closeMbox} />}
        </AnimatePresence>

        {/* Level-up */}
        <AnimatePresence>
          {showLevelUp && <LevelUpScreen newLevel={Math.min(5, level + 1)} onContinue={closeLevelUp} />}
        </AnimatePresence>

        {/* Badge unlock cinematic */}
        <AnimatePresence>
          {badgeUnlocking && <BadgeUnlock badge={badgeUnlocking} onContinue={closeBadgeUnlock} />}
        </AnimatePresence>

        {/* Confetti host */}
        <Confetti active={bigConfetti} duration={3500} intensity={1.4} />

        {/* Demo controls */}
        <div className="demo">
          <AnimatePresence>
            {demoOpen && (
              <motion.div
                className="demo-panel"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="demo-label">Réponse</div>
                <button className="demo-btn" onClick={() => { setForceCorrect(true); if (screen !== 'question') handleStartQuestion(); }}>
                  Forcer bonne réponse
                </button>
                <button className="demo-btn" onClick={() => { setForceCorrect(false); if (screen !== 'question') handleStartQuestion(); }}>
                  Forcer mauvaise réponse
                </button>
                <div className="demo-label">Bonus</div>
                <button className="demo-btn" onClick={() => { setForceBonus(true); setForceCorrect(true); if (screen !== 'question') handleStartQuestion(); else resetQuestion(); }}>
                  ×2 XP suivant
                </button>
                <button className="demo-btn" onClick={() => { setForceGolden(true); if (screen !== 'question') handleStartQuestion(); else resetQuestion(); }}>
                  Question dorée
                </button>
                <button className="demo-btn" onClick={() => setX3Remaining(3)}>
                  ×3 XP × 3 questions
                </button>
                <div className="demo-label">Variantes célébration</div>
                {CELEB_VARIANTS.map(v => (
                  <button key={v} className="demo-btn" onClick={() => { setCelebVariant(v); setShowCeleb(true); setTimeout(() => setShowCeleb(false), 1500); }}>
                    {v}
                  </button>
                ))}
                <div className="demo-label">Surprises</div>
                <button className="demo-btn" onClick={() => setShowMbox(true)}>
                  Mystery box
                </button>
                <button className="demo-btn" onClick={() => { setMilestoneValue(7); setTimeout(() => setMilestoneValue(null), 1900); }}>
                  Milestone (7)
                </button>
                <button className="demo-btn" onClick={triggerRecord}>
                  Record
                </button>
                <button className="demo-btn" onClick={triggerLevelUp}>
                  Level-up
                </button>
                <button className="demo-btn" onClick={() => triggerBadgeUnlock('streak_30')}>
                  Badge unlock
                </button>
                <div className="demo-label">Navigation</div>
                <button className="demo-btn" onClick={() => setScreen('home')}>
                  Aller Home
                </button>
                <button className="demo-btn" onClick={openStats}>
                  Aller Stats
                </button>
                <button className="demo-btn" onClick={() => setScreen('survival')}>
                  Mode Survival
                </button>
                <button className="demo-btn" onClick={() => setScreen('sprint')}>
                  Mode Sprint
                </button>
                <button className="demo-btn" onClick={() => setScreen('guest')}>
                  Mode Invité
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button className="demo-toggle" onClick={() => setDemoOpen(o => !o)} aria-label="Demo controls">
            <Sliders size={14} />
          </button>
        </div>

        {/* Settings sheet (Lot 1 + Lot INTER) */}
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          quizMode={quizMode}
          interventionRatios={interventionRatios}
          interventionEditionsR1={interventionEditionsR1}
          catalog={catalog}
          onModeChange={setQuizMode}
          onRatiosChange={setInterventionRatios}
          onEditionsR1Change={setInterventionEditionsR1}
        />
      </div>
    </>
  );
}

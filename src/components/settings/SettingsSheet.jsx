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
    height: 6px;
    border-radius: 999px;
    background: var(--surface-3);
    outline: none;
    margin: 4px 0;
  }
  .slider-track::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: var(--accent);
    cursor: pointer;
    border: 2px solid var(--surface-1);
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
  }
  .slider-track::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: var(--accent);

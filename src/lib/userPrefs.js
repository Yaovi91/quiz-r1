// src/lib/userPrefs.js
// Réglages utilisateur + meilleurs temps Daily + helpers reset / export / import.
// Stocke en localStorage sous des clés namespacées, indépendamment du gros store.

const NS_PREFS = "quizr1.v1.userPrefs";
const NS_DAILY_TIMES = "quizr1.v1.dailyTimes";
const NS_STATE = "quizr1.v1.state"; // le gros store, manipulé pour reset

// =========================================================================
// PRÉFÉRENCES UTILISATEUR
// =========================================================================
export const DEFAULT_PREFS = {
  // Chrono Daily perso
  dailyTimerEnabled: true,            // ON par défaut
  dailyTimerDurationSec: 600,         // 10 min par défaut (range 300-900 = 5-15 min)
  dailyBonusFastSec: 300,             // <5 min = +25 XP
  dailyBonusFastXp: 25,
  dailyBonusBlazeSec: 180,            // <3 min = +50 XP
  dailyBonusBlazeXp: 50,
  dailyBonusEnabled: true,            // toggle global des bonus temps

  // Limites / cap
  dailyCap: null,                     // null = pas de cap
  soundOn: false,
  hapticOn: true,
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(NS_PREFS);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(NS_PREFS, JSON.stringify(prefs));
  } catch (e) {
    console.warn("savePrefs failed", e);
  }
}

export function updatePref(key, value) {
  const prefs = loadPrefs();
  prefs[key] = value;
  savePrefs(prefs);
  return prefs;
}

// =========================================================================
// HISTORIQUE DES TEMPS DAILY
// =========================================================================
// Stocke { bestTimeSec, bestScore, lastDate, history: [{ d, score, timeSec, perfect }] }
const DEFAULT_DAILY_TIMES = {
  bestTimeSec: null,        // meilleur temps (en sec) pour un 10/10
  bestScore: 0,             // meilleur score absolu (peu importe le temps)
  bestTimeAt: null,         // "YYYY-MM-DD" du meilleur temps
  history: [],              // chronologique [{ d, score, timeSec, perfect }]
};

export function loadDailyTimes() {
  try {
    const raw = localStorage.getItem(NS_DAILY_TIMES);
    if (!raw) return { ...DEFAULT_DAILY_TIMES, history: [] };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DAILY_TIMES, ...parsed, history: parsed.history || [] };
  } catch {
    return { ...DEFAULT_DAILY_TIMES, history: [] };
  }
}

export function saveDailyTimes(data) {
  try {
    localStorage.setItem(NS_DAILY_TIMES, JSON.stringify(data));
  } catch (e) {
    console.warn("saveDailyTimes failed", e);
  }
}

/**
 * Enregistre une session Daily terminée.
 * Met à jour bestTime si score = 10 et temps inférieur.
 * Renvoie { isNewBestTime, isNewBestScore, perfect }.
 */
export function recordDailySession({ score, total, timeSec, dateKey }) {
  const data = loadDailyTimes();
  const perfect = score === total;

  let isNewBestTime = false;
  let isNewBestScore = false;

  if (perfect && (data.bestTimeSec === null || timeSec < data.bestTimeSec)) {
    data.bestTimeSec = timeSec;
    data.bestTimeAt = dateKey;
    isNewBestTime = true;
  }

  if (score > data.bestScore) {
    data.bestScore = score;
    isNewBestScore = true;
  }

  data.history.push({
    d: dateKey,
    score,
    total,
    timeSec,
    perfect,
  });

  // On garde les 365 dernières entrées max (1 an)
  if (data.history.length > 365) {
    data.history = data.history.slice(-365);
  }

  saveDailyTimes(data);
  return { isNewBestTime, isNewBestScore, perfect };
}

// =========================================================================
// RESET MULTI-NIVEAU
// =========================================================================

/**
 * Reset Niveau 1 — session du jour uniquement.
 * Efface XP du jour, quêtes du jour, compteurs heatmap du jour.
 * Conserve : streak, badges, total XP, niveau, SRS, courbe historique.
 */
export function resetTodaySession() {
  try {
    const todayKey = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(NS_STATE);
    if (!raw) return false;
    const state = JSON.parse(raw);

    // Retirer XP du jour
    if (state.xpByDay && state.xpByDay[todayKey] !== undefined) {
      const todayXp = state.xpByDay[todayKey];
      state.xp = Math.max(0, (state.xp || 0) - todayXp);
      delete state.xpByDay[todayKey];
    }

    // Retirer heatmap du jour
    if (state.heatmap && state.heatmap[todayKey] !== undefined) {
      delete state.heatmap[todayKey];
    }

    // Reset quêtes du jour
    state.dailyQuests = [];
    state.dailyDate = null;
    state.dailyAllDone = false;

    // Reset Daily challenge du jour s'il existe
    if (state.dailyChallenge && state.dailyChallenge.date === todayKey) {
      state.dailyChallenge = null;
    }

    // Retirer le point de courbe du jour
    if (Array.isArray(state.curve)) {
      state.curve = state.curve.filter(p => p.d !== todayKey);
    }

    localStorage.setItem(NS_STATE, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn("resetTodaySession failed", e);
    return false;
  }
}

/**
 * Reset Niveau 2 — toutes les stats et progression.
 * Conserve : préférences utilisateur (chrono, bonus, sound, etc.).
 */
export function resetStatsAndProgression() {
  try {
    // On supprime tout sauf les prefs
    localStorage.removeItem(NS_STATE);
    localStorage.removeItem(NS_DAILY_TIMES);
    return true;
  } catch (e) {
    console.warn("resetStatsAndProgression failed", e);
    return false;
  }
}

/**
 * Reset Niveau 3 — factory reset complet.
 * Efface absolument tout, y compris les préférences.
 */
export function resetFactory() {
  try {
    // On itère sur les clés pour ne pas casser d'autres apps qui partagent le localStorage
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("quizr1.")) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    return true;
  } catch (e) {
    console.warn("resetFactory failed", e);
    return false;
  }
}

// =========================================================================
// EXPORT / IMPORT JSON
// =========================================================================

/**
 * Exporte toutes les données utilisateur dans un fichier JSON téléchargeable.
 * Format : { version, exportedAt, prefs, state, dailyTimes }
 */
export function exportAllData() {
  try {
    const payload = {
      version: 1,
      app: "quizr1",
      exportedAt: new Date().toISOString(),
      prefs: loadPrefs(),
      state: (() => {
        try { return JSON.parse(localStorage.getItem(NS_STATE) || "null"); }
        catch { return null; }
      })(),
      dailyTimes: loadDailyTimes(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quizr1-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.warn("exportAllData failed", e);
    return false;
  }
}

/**
 * Importe un fichier JSON et écrase les données existantes.
 * Renvoie { success, error? }.
 */
export async function importAllData(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed || parsed.app !== "quizr1") {
      return { success: false, error: "Fichier non reconnu (pas un export Quiz R1)" };
    }

    if (parsed.prefs) {
      localStorage.setItem(NS_PREFS, JSON.stringify(parsed.prefs));
    }
    if (parsed.state) {
      localStorage.setItem(NS_STATE, JSON.stringify(parsed.state));
    }
    if (parsed.dailyTimes) {
      localStorage.setItem(NS_DAILY_TIMES, JSON.stringify(parsed.dailyTimes));
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || "Erreur de lecture du fichier" };
  }
}

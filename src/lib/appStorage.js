// src/lib/appStorage.js
// Persistance localStorage de l'état principal de l'app.
// Lot 3b — branche les compteurs XP, niveau, streak, badges, etc. sur localStorage
// pour que l'utilisateur retrouve sa progression à chaque ouverture.

const NS = "quizr1.v1.appState";
const NS_BADGES = "quizr1.v1.unlockedBadges";

// Valeurs par défaut au premier lancement (premier utilisateur)
const FIRST_RUN_DEFAULTS = {
  xp: 0,
  xpToday: 0,
  level: 1,
  streak: 0,
  bestCombo: 0,
  totalQ: 0,
  correctQ: 0,
  rate: 0,
  freezes: 2,
  x3Remaining: 0,
  lastSessionDate: null,   // ISO date YYYY-MM-DD
  xpTodayResetDate: null,  // pour reset xpToday à minuit
  questsResetDate: null,   // pour reset quotidien des quêtes
};

/**
 * Charge l'état persistant depuis localStorage.
 * Renvoie un objet partiel à fusionner avec les defaults React.
 * Si rien n'est stocké : renvoie null (1er lancement).
 */
export function loadAppState() {
  try {
    const raw = localStorage.getItem(NS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Sécurité : on filtre uniquement les clés connues pour éviter les pollutions
    const known = Object.keys(FIRST_RUN_DEFAULTS);
    const clean = {};
    for (const k of known) {
      if (k in parsed) clean[k] = parsed[k];
    }
    return clean;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde l'état persistant.
 * Reçoit l'état complet à persister.
 */
export function saveAppState(state) {
  try {
    // On ne persiste que les clés "principales" pour éviter de stocker des
    // ref de fonctions ou des states éphémères (animations, etc.)
    const persisted = {};
    for (const k of Object.keys(FIRST_RUN_DEFAULTS)) {
      if (k in state) persisted[k] = state[k];
    }
    localStorage.setItem(NS, JSON.stringify(persisted));
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset complet de l'état (factory reset). Utilisé par les boutons reset des Settings.
 */
export function resetAppState() {
  try {
    localStorage.removeItem(NS);
    localStorage.removeItem(NS_BADGES);
    return true;
  } catch {
    return false;
  }
}

// ---------- BADGES ----------

/**
 * Charge le Set des ids de badges déjà débloqués.
 */
export function loadUnlockedBadges() {
  try {
    const raw = localStorage.getItem(NS_BADGES);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/**
 * Sauvegarde le Set des ids de badges débloqués.
 */
export function saveUnlockedBadges(set) {
  try {
    localStorage.setItem(NS_BADGES, JSON.stringify(Array.from(set)));
    return true;
  } catch {
    return false;
  }
}

export { FIRST_RUN_DEFAULTS, NS, NS_BADGES };

// ---------- HELPERS DATE ----------

/**
 * Renvoie YYYY-MM-DD pour aujourd'hui en heure locale.
 */
export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Renvoie true si la date stockée correspond à hier (en heure locale).
 */
export function isYesterday(dateStr) {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return dateStr === `${y}-${m}-${day}`;
}

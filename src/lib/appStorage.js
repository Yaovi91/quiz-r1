// src/lib/appStorage.js
// Persistance localStorage de l'état principal de l'app.
// Lot 3b — branche les compteurs XP, niveau, streak, badges, etc. sur localStorage
// Lot INTER — ajoute la persistance du mode (libre/intervention) + curseurs ratios + éditions R1.

const NS = "quizr1.v1.appState";
const NS_BADGES = "quizr1.v1.unlockedBadges";

// Defaults INTERVENTION — repris depuis lib/picker.js (dupliqués ici pour éviter
// un cycle d'import lors du premier mount avant chargement du picker)
const DEFAULT_INTERVENTION_RATIOS = {
  r1_2025:    0.35,
  r1_old:     0.18,
  en12845:    0.12,
  r5:         0.08,
  nf_s62_201: 0.07,
  nf_s62_200: 0.06,
  fmds:       0.05,
  nfpa22:     0.04,
  cross:      0.05,
};
const DEFAULT_EDITIONS_R1 = ["2025", "2020", "2014", "2008", "2002", "1994"];

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
  quests: null,            // array sérialisé des quêtes (current/done par id)

  // === Mode de jeu (Lot INTER) =============================================
  quizMode: "libre",                      // "libre" | "intervention"
  interventionRatios: { ...DEFAULT_INTERVENTION_RATIOS },
  interventionEditionsR1: [...DEFAULT_EDITIONS_R1],
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
    // Migration douce : si un utilisateur avait un state pré-INTER,
    // on remplit les nouveaux champs avec les defaults
    if (!("quizMode" in clean)) clean.quizMode = FIRST_RUN_DEFAULTS.quizMode;
    if (!("interventionRatios" in clean) || typeof clean.interventionRatios !== "object") {
      clean.interventionRatios = { ...DEFAULT_INTERVENTION_RATIOS };
    } else {
      // Compléter les buckets manquants si on a ajouté de nouveaux référentiels
      clean.interventionRatios = { ...DEFAULT_INTERVENTION_RATIOS, ...clean.interventionRatios };
    }
    if (!Array.isArray(clean.interventionEditionsR1)) {
      clean.interventionEditionsR1 = [...DEFAULT_EDITIONS_R1];
    }
    return clean;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde l'état persistant.
 * Reçoit l'état complet à persister.
 *
 * Garde-fou anti-écrasement : si l'existant a déjà une vraie progression
 * (xp > 0, totalQ > 0, ou level > 1) et qu'on s'apprête à écrire un state
 * "tout à zéro" (typique d'une race condition au premier mount après
 * un reload du service worker), on refuse l'écriture pour ne pas effacer
 * la progression de l'utilisateur.
 *
 * Le reset volontaire passe par resetAppState() qui supprime la clé entière,
 * donc ce garde-fou ne gêne pas le reset utilisateur.
 */
export function saveAppState(state) {
  try {
    // Garde-fou : vérifier si l'existant a une progression > 0
    const raw = localStorage.getItem(NS);
    if (raw) {
      try {
        const existing = JSON.parse(raw);
        const hasExistingProgression =
          (existing.xp || 0) > 0 ||
          (existing.totalQ || 0) > 0 ||
          (existing.level || 1) > 1;
        const writingEmpty =
          (state.xp || 0) === 0 &&
          (state.totalQ || 0) === 0 &&
          (state.level || 1) === 1;
        if (hasExistingProgression && writingEmpty) {
          console.warn(
            "[appStorage] save refusé : écrasement détecté " +
            `(existant : xp=${existing.xp}, totalQ=${existing.totalQ}, level=${existing.level} — ` +
            "à écrire : tout à zéro). Pour reset volontaire, utilise les boutons de réglages."
          );
          return false;
        }
      } catch {
        // Parse failed → on continue normalement (rien à protéger)
      }
    }

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

export function saveUnlockedBadges(set) {
  try {
    localStorage.setItem(NS_BADGES, JSON.stringify(Array.from(set)));
    return true;
  } catch {
    return false;
  }
}

export { FIRST_RUN_DEFAULTS, NS, NS_BADGES, DEFAULT_INTERVENTION_RATIOS, DEFAULT_EDITIONS_R1 };

// ---------- HELPERS DATE ----------

export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isYesterday(dateStr) {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return dateStr === `${y}-${m}-${day}`;
}

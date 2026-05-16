// localStorage helpers — namespacé pour éviter les collisions.

const NS = "quizr1.v1.";

const DEFAULT_STATE = {
  // XP & progression
  xp: 0,
  xpByDay: {}, // { "2026-05-16": 120 }
  level: 1,

  // Comptage
  answered: 0,
  correct: 0,
  byChapter: {}, // { "10.5": { seen: 12, correct: 9 } }
  byEdition: {}, // { "2025": { seen: 80 }, "2014": { seen: 10 } }

  // Streaks
  streakDays: 0,
  streakDaysBest: 0,
  lastActiveDay: null, // "YYYY-MM-DD"
  streakRight: 0,
  streakRightBest: 0,
  freezesLeft: 2,
  freezesMonth: null, // "YYYY-MM" — pour reset mensuel

  // Spaced repetition par question_id
  // { [id]: { ease, interval, lastSeen, seen, correct } }
  cards: {},

  // Badges débloqués : { [badgeId]: "YYYY-MM-DD" }
  badges: {},

  // Daily quests
  dailyDate: null,        // "YYYY-MM-DD"
  dailyQuests: [],        // [{ id, goal, progress, done }, ...]
  dailyAllDone: false,

  // Daily challenge
  dailyChallenge: null,   // { date, score, total, played, ids }

  // Survival best
  survivalBest: 0,

  // Curve : taux de réussite par jour glissant
  curve: [], // [{ d: "YYYY-MM-DD", rate, answered }]

  // Heatmap : { "YYYY-MM-DD": questionsCount }
  heatmap: {},

  // Réglages
  settings: {
    dailyCap: null, // null = pas de cap, sinon nombre
    soundOn: false,
    hapticOn: true,
  },
};

export function loadState() {
  try {
    const raw = localStorage.getItem(NS + "state");
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // Merge prudent pour résister aux ajouts de champs futurs.
    return { ...structuredClone(DEFAULT_STATE), ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(NS + "state", JSON.stringify(state));
  } catch (e) {
    console.warn("saveState failed", e);
  }
}

export function resetState() {
  localStorage.removeItem(NS + "state");
  return structuredClone(DEFAULT_STATE);
}

export function exportState() {
  const s = loadState();
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quizr1-progression-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importState(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  saveState({ ...structuredClone(DEFAULT_STATE), ...parsed });
}

export { DEFAULT_STATE };

// Helpers date courte
export const todayKey = () => new Date().toISOString().slice(0, 10);
export const monthKey = () => new Date().toISOString().slice(0, 7);

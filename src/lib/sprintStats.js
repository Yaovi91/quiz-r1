// src/lib/sprintStats.js
// Persistance localStorage des stats Sprint perso :
// - Records (meilleur score) par durée 3/5/7
// - Compteur de sprints terminés (total + par durée)
// - Badges Sprint débloqués

const NS_RECORDS = "quizr1.v1.sprintRecords";
const NS_COUNTERS = "quizr1.v1.sprintCounters";

// ---------- RECORDS ----------

const DEFAULT_RECORDS = { 3: null, 5: null, 7: null };

export function loadSprintRecords() {
  try {
    const raw = localStorage.getItem(NS_RECORDS);
    if (!raw) return { ...DEFAULT_RECORDS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_RECORDS, ...parsed };
  } catch {
    return { ...DEFAULT_RECORDS };
  }
}

export function saveSprintRecords(records) {
  try {
    localStorage.setItem(NS_RECORDS, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

/**
 * Met à jour le record d'une durée si le nouveau score est meilleur.
 * Renvoie { records, isNewRecord }.
 */
export function maybeUpdateRecord({ score, good, bad, skipped, durationMin, xpGained }) {
  const records = loadSprintRecords();
  const current = records[durationMin];
  const isNewRecord = !current || score > current.score;
  if (isNewRecord) {
    records[durationMin] = {
      score,
      good,
      bad,
      skipped,
      xpGained,
      date: new Date().toISOString(),
    };
    saveSprintRecords(records);
  }
  return { records, isNewRecord };
}

// ---------- COUNTERS ----------

const DEFAULT_COUNTERS = {
  total: 0,
  by_duration: { 3: 0, 5: 0, 7: 0 },
};

export function loadSprintCounters() {
  try {
    const raw = localStorage.getItem(NS_COUNTERS);
    if (!raw) return { ...DEFAULT_COUNTERS, by_duration: { ...DEFAULT_COUNTERS.by_duration } };
    const parsed = JSON.parse(raw);
    return {
      total: parsed.total ?? 0,
      by_duration: { ...DEFAULT_COUNTERS.by_duration, ...(parsed.by_duration ?? {}) },
    };
  } catch {
    return { ...DEFAULT_COUNTERS, by_duration: { ...DEFAULT_COUNTERS.by_duration } };
  }
}

export function saveSprintCounters(counters) {
  try {
    localStorage.setItem(NS_COUNTERS, JSON.stringify(counters));
    return true;
  } catch {
    return false;
  }
}

/**
 * Incrémente le compteur après un sprint terminé.
 * Renvoie le nouveau total.
 */
export function incrementSprintCounter(durationMin) {
  const counters = loadSprintCounters();
  counters.total += 1;
  counters.by_duration[durationMin] = (counters.by_duration[durationMin] ?? 0) + 1;
  saveSprintCounters(counters);
  return counters;
}

// ---------- BADGES SPRINT ----------

export const SPRINT_BADGES = {
  sprint_first: {
    id: "sprint_first",
    name: "Premier Sprint",
    desc: "Terminer un premier Sprint",
    icon: "Flag",
  },
  sprint_3_platine: {
    id: "sprint_3_platine",
    name: "Platine 3 min",
    desc: "30 pts ou plus en Sprint 3 minutes",
    icon: "Award",
  },
  sprint_5_platine: {
    id: "sprint_5_platine",
    name: "Platine 5 min",
    desc: "50 pts ou plus en Sprint 5 minutes",
    icon: "Award",
  },
  sprint_7_platine: {
    id: "sprint_7_platine",
    name: "Platine 7 min",
    desc: "70 pts ou plus en Sprint 7 minutes",
    icon: "Award",
  },
  sprinter_10: {
    id: "sprinter_10",
    name: "Sprinter aguerri",
    desc: "10 Sprints terminés",
    icon: "Medal",
  },
  sprinter_50: {
    id: "sprinter_50",
    name: "Sprinter émérite",
    desc: "50 Sprints terminés",
    icon: "Trophy",
  },
};

/**
 * Évalue les badges Sprint à débloquer après un sprint terminé.
 * @param {Object} ctx - { score, good, bad, skipped, durationMin, counters, alreadyUnlocked: Set<string> }
 * @returns {string[]} - ids des badges nouvellement débloqués
 */
export function evaluateSprintBadges({ score, durationMin, counters, alreadyUnlocked }) {
  const unlocked = [];
  const has = (id) => alreadyUnlocked.has(id);

  if (!has("sprint_first")) unlocked.push("sprint_first");

  if (durationMin === 3 && score >= 30 && !has("sprint_3_platine")) {
    unlocked.push("sprint_3_platine");
  }
  if (durationMin === 5 && score >= 50 && !has("sprint_5_platine")) {
    unlocked.push("sprint_5_platine");
  }
  if (durationMin === 7 && score >= 70 && !has("sprint_7_platine")) {
    unlocked.push("sprint_7_platine");
  }
  if (counters.total >= 10 && !has("sprinter_10")) {
    unlocked.push("sprinter_10");
  }
  if (counters.total >= 50 && !has("sprinter_50")) {
    unlocked.push("sprinter_50");
  }

  return unlocked;
}

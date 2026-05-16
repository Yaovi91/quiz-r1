// Daily quests : pool de 6 quêtes possibles, tirage de 3 par jour à 4h locale.
import { todayKey } from "./storage.js";

// Renvoie la "journée logique" : avant 4h locale → la veille.
export function logicalDay(date = new Date()) {
  const d = new Date(date);
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Seed déterministe à partir d'une date + offset (mulberry32).
function seededShuffle(arr, seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  let s = h >>> 0;
  const rng = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const QUEST_POOL = [
  { id: "10q",         label: "10 questions aujourd'hui",          goal: 10, kind: "answered" },
  { id: "5-in-a-row",  label: "5 bonnes réponses d'affilée",       goal: 5,  kind: "streakRight" },
  { id: "8-on-10",     label: "Au moins 8 bonnes sur 10",          goal: 8,  kind: "windowAccuracy" },
  { id: "weak-chap",   label: "Réviser ton chapitre le plus faible", goal: 5, kind: "weakChapter" },
  { id: "multi-3",     label: "3 questions multi-réponses justes", goal: 3,  kind: "multiRight" },
  { id: "older-ed",    label: "1 question d'une édition antérieure", goal: 1, kind: "olderEdition" },
];

/** Tire les 3 quêtes du jour, déterministe pour la "journée logique". */
export function pickDaily(level) {
  const day = logicalDay();
  let pool = QUEST_POOL.filter(q => q.id !== "multi-3" || level >= 3);
  pool = seededShuffle(pool, day);
  return pool.slice(0, 3).map(q => ({ id: q.id, label: q.label, goal: q.goal, kind: q.kind, progress: 0, done: false }));
}

/** Renouvelle si besoin et renvoie l'état des quêtes. */
export function ensureDailyQuests(state, level) {
  const day = logicalDay();
  if (state.dailyDate !== day) {
    state.dailyDate = day;
    state.dailyQuests = pickDaily(level);
    state.dailyAllDone = false;
  }
  return state;
}

/**
 * Met à jour la progression des quêtes après une réponse.
 * `ctx` = { ok, multi, chapter, edition, weakestChapter, last10 } (fenêtre des 10 dernières réponses).
 * Renvoie la liste des quêtes nouvellement complétées (pour célébration).
 */
export function tickQuests(state, ctx) {
  const completed = [];
  state.dailyQuests = (state.dailyQuests || []).map(q => {
    if (q.done) return q;
    let next = q.progress;
    switch (q.kind) {
      case "answered":       next = q.progress + 1; break;
      case "streakRight":    next = Math.max(q.progress, ctx.streakRight || 0); break;
      case "windowAccuracy": next = (ctx.last10 || []).filter(Boolean).length; break;
      case "weakChapter":    if (ctx.chapter === ctx.weakestChapter) next = q.progress + 1; break;
      case "multiRight":     if (ctx.multi && ctx.ok) next = q.progress + 1; break;
      case "olderEdition":   if (ctx.edition && ctx.edition !== "2025") next = q.progress + 1; break;
    }
    const done = next >= q.goal;
    if (done && !q.done) completed.push({ ...q, progress: next, done: true });
    return { ...q, progress: next, done };
  });
  state.dailyAllDone = state.dailyQuests.length > 0 && state.dailyQuests.every(q => q.done);
  return { completed };
}

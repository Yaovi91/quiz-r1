// Algorithme de tirage de la prochaine question.
import { isDue } from "./srs.js";
import { todayKey } from "./storage.js";

// Mémoire de session : IDs des dernières questions tirées.
// Persiste pendant la session (jusqu'au reload), pas en localStorage.
let recentIds = [];

// Filtre niveau : très permissif au début (variété), strict ensuite.
function passesLevelFilter(q, level, answered) {
  if ((answered || 0) < 30) return q.difficulte <= 4;
  if (q.difficulte > level + 1) return false;
  return true;
}

function multiAllowed(level, rand, answered) {
  if ((answered || 0) < 30) return rand() < 0.3;
  if (level <= 2) return false;
  const target = level === 3 ? 0.10 : level === 4 ? 0.30 : 0.50;
  return rand() < target;
}

function rateChapter(byChapter, ch) {
  const c = byChapter[ch];
  if (!c || c.seen === 0) return 0.5;
  return c.correct / c.seen;
}

function weakestChapter(byChapter) {
  let worst = null;
  let worstRate = 1.1;
  for (const [ch, c] of Object.entries(byChapter || {})) {
    if (c.seen >= 5) {
      const r = c.correct / c.seen;
      if (r < worstRate) { worstRate = r; worst = ch; }
    }
  }
  return worst;
}

function seedRand(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  let s = h >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seenToday(card) {
  if (!card || !card.lastSeen) return false;
  return card.lastSeen === todayKey();
}

/**
 * Pick une question dans le pool selon les règles.
 */
export function pickQuestion(pool, state, opts = {}) {
  const { mode = "libre", chapter = null, seed = null, excludeIds = [] } = opts;
  const level = state.level || 1;
  const answered = state.answered || 0;
  const rand = seed ? seedRand(seed) : Math.random;

  // 1. Filtrage par mode.
  let candidates = pool.filter(q => !excludeIds.includes(q.id));

  if (mode === "audit") {
    candidates = candidates.filter(q => q.mode_audit === true);
  } else if (mode === "revision" && chapter) {
    candidates = candidates.filter(q => q.chapitre.startsWith(chapter));
  } else {
    candidates = candidates.filter(q => passesLevelFilter(q, level, answered));
    const allowMulti = multiAllowed(level, rand, answered);
    if (!allowMulti) candidates = candidates.filter(q => !q.multi);
  }

  if (candidates.length === 0) return null;

  // 2. Pondération édition (80% 2025 / 20% antérieures) — sauf modes ciblés.
  if (mode === "libre" || mode === "daily") {
    const wantOld = rand() < 0.2;
    const filtered = candidates.filter(q => wantOld ? q.edition !== "2025" : q.edition === "2025");
    if (filtered.length > 0) candidates = filtered;
  }

  // 3. Anti-boucle : éviter les 5 dernières questions tirées si possible.
  const recentSet = new Set(recentIds.slice(-5));
  const filteredRecent = candidates.filter(q => !recentSet.has(q.id));
  if (filteredRecent.length >= 2) candidates = filteredRecent;

  // 4. Spaced repetition : préférer les non-dues si on en a au moins 3.
  const due = candidates.filter(q => isDue(state.cards[q.id]));
  if (due.length >= 3) candidates = due;

  // 5. Pondération chapitre faible + déprio forte des vues aujourd'hui.
  const weights = candidates.map(q => {
    const card = state.cards[q.id];
    if (seenToday(card)) return 0.1; // vraiment déprio
    const rate = rateChapter(state.byChapter || {}, q.chapitre);
    let w = 1 + (1 - rate);
    return Math.max(0.5, Math.min(2, w));
  });

  // 6. Tirage pondéré.
  const total = weights.reduce((a, b) => a + b, 0);
  let picked;
  if (total <= 0) {
    picked = candidates[Math.floor(rand() * candidates.length)];
  } else {
    let r = rand() * total;
    picked = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) { picked = candidates[i]; break; }
    }
  }

  // 7. Mémoriser pour les prochains tirages.
  if (picked) {
    recentIds.push(picked.id);
    if (recentIds.length > 10) recentIds = recentIds.slice(-10);
  }
  return picked;
}

/** Pour le mode Daily Challenge : 10 questions seedées sur la date. */
export function pickDailyTen(pool, state, dateKey) {
  const seed = "daily-" + dateKey;
  const rand = seedRand(seed);
  let pickable = pool.filter(q => passesLevelFilter(q, state.level || 1, state.answered || 0));
  const picked = [];
  const used = new Set();
  let safety = 0;
  while (picked.length < 10 && safety < 200) {
    const idx = Math.floor(rand() * pickable.length);
    const q = pickable[idx];
    if (q && !used.has(q.id)) {
      used.add(q.id);
      picked.push(q);
    }
    safety++;
  }
  return picked;
}

export { weakestChapter };

// Algorithme de tirage de la prochaine question.
import { isDue } from "./srs.js";

// Filtres durs en fonction du niveau.
function passesLevelFilter(q, level) {
  if (q.difficulte > level + 1) return false;
  return true;
}

// Proportion de questions multi-réponses tolérée selon niveau.
function multiAllowed(level, rand) {
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

function seededRand(seedStr) {
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

/**
 * Pick une question dans le pool selon les règles.
 * @param {Object[]} pool — questions chargées
 * @param {Object} state — état persisté
 * @param {Object} opts — { mode: "libre"|"daily"|"survival"|"audit"|"revision", chapter?, seed? }
 */
export function pickQuestion(pool, state, opts = {}) {
  const { mode = "libre", chapter = null, seed = null, excludeIds = [] } = opts;
  const level = state.level || 1;
  const rand = seed ? seededRand(seed) : Math.random;

  // 1. Filtrage par mode.
  let candidates = pool.filter(q => !excludeIds.includes(q.id));

  if (mode === "audit") {
    candidates = candidates.filter(q => q.mode_audit === true);
  } else if (mode === "revision" && chapter) {
    candidates = candidates.filter(q => q.chapitre.startsWith(chapter));
  } else {
    candidates = candidates.filter(q => passesLevelFilter(q, level));
    // Multi : si autorisé par niveau, ok ; sinon filtrer.
    const allowMulti = multiAllowed(level, rand);
    if (!allowMulti) candidates = candidates.filter(q => !q.multi);
  }

  if (candidates.length === 0) return null;

  // 2. Pondération édition (80% 2025 / 20% antérieures) — sauf modes ciblés.
  if (mode === "libre" || mode === "daily") {
    const wantOld = rand() < 0.2;
    const filtered = candidates.filter(q => wantOld ? q.edition !== "2025" : q.edition === "2025");
    if (filtered.length > 0) candidates = filtered;
  }

  // 3. Spaced repetition : ne garder que les dues — sauf si pool trop maigre.
  const due = candidates.filter(q => isDue(state.cards[q.id]));
  if (due.length >= 3) candidates = due;

  // 4. Pondération par chapitre faible.
  const weights = candidates.map(q => {
    const rate = rateChapter(state.byChapter || {}, q.chapitre);
    let w = 1 + (1 - rate); // chapitre raté → poids plus fort
    // Cap [0.5, 2]
    w = Math.max(0.5, Math.min(2, w));
    return w;
  });

  // 5. Tirage pondéré.
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Pour le mode Daily Challenge : 10 questions seedées sur la date. */
export function pickDailyTen(pool, state, dateKey) {
  const seed = "daily-" + dateKey;
  const rand = seededRand(seed);
  // Filtre simple : conformité niveau.
  let pickable = pool.filter(q => passesLevelFilter(q, state.level || 1));
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

// src/lib/picker.js
// Tirage de question — Quizz R1 v4
// ---------------------------------------------------------------------------
// Deux modes pédagogiques :
//   LIBRE         → R1 édition 2025 strict (cible : Q1, vérif sprinkleur)
//   INTERVENTION  → multi-référentiels pondérés (R1 toutes éditions + R5 RIA
//                   + NF S62-201 + EN 12845 + NF S62-200 + cross R1↔EN 12845)
//
// Curseurs INTERVENTION (somme normalisée à 1) :
//   r1_2025, r1_old, r5, nf_s62_201, en12845, nf_s62_200
//   (les questions cross héritent du bucket "Cross" partagé entre r1_2025 et en12845)
//
// Détection cross : une question dont l'`id` commence par "cross-" est
// pédagogiquement INTERVENTION même si son champ `referentiel` vaut "R1"
// ou "EN12845" — on la route en INTER, jamais en LIBRE.
// ---------------------------------------------------------------------------

// === BUCKETS — clés stables utilisées partout (UI, prefs, picker) ==========
export const BUCKETS = ["r1_2025", "r1_old", "r5", "nf_s62_201", "en12845", "nf_s62_200", "cross"];

export const BUCKET_LABELS = {
  r1_2025:    "R1 · 2025",
  r1_old:     "R1 · anciennes éditions",
  r5:         "R5 · RIA",
  nf_s62_201: "NF S 62-201 · RIA",
  en12845:    "EN 12845 · sprinkleur EU",
  nf_s62_200: "NF S 62-200 · PI / BI",
  cross:      "Cross R1 ↔ EN 12845",
};

export const DEFAULT_INTERVENTION_RATIOS = {
  r1_2025:    0.40,
  r1_old:     0.20,
  r5:         0.10,
  nf_s62_201: 0.10,
  en12845:    0.10,
  nf_s62_200: 0.05,
  cross:      0.05,
};

export const DEFAULT_EDITIONS_R1 = ["2025", "2020", "2014", "2008", "2002", "1994"];

export const R1_OLD_EDITIONS = ["2020", "2014", "2008", "2002", "1994", "1990", "1979", "1974", "1967", "1957", "1898"];

// === Helpers ===============================================================
const isCrossQ = (q) => typeof q.id === "string" && q.id.startsWith("cross-");

function bucketOf(q) {
  // Une question cross est toujours dans "cross", indépendamment de son referentiel
  if (isCrossQ(q)) return "cross";
  const ref = q.referentiel || "R1";
  const ed = String(q.edition || "");
  if (ref === "R1") return ed === "2025" ? "r1_2025" : "r1_old";
  if (ref === "R5") return "r5";
  if (ref === "NF S62-201" || ref === "NF S 62-201") return "nf_s62_201";
  if (ref === "EN12845" || ref === "NF EN 12845") return "en12845";
  if (ref === "NF S62-200" || ref === "NF S 62-200") return "nf_s62_200";
  if (ref === "Cross R1 + EN 12845") return "cross";
  if (ref === "NF S 61-213/CN") return "nf_s62_200"; // famille PI
  return "r1_old"; // fallback prudent
}

// === LIBRE ==================================================================
/**
 * Mode LIBRE — comportement original : R1 édition 2025 strict.
 * Pas de question cross, pas d'anciennes éditions, pas d'autres référentiels.
 */
function pickLibre(catalog, { audit, multi, exclude }) {
  let pool = catalog.filter(q =>
    !isCrossQ(q) &&
    (q.referentiel === "R1" || !q.referentiel) &&
    String(q.edition) === "2025" &&
    q.multi === multi
  );
  if (audit === true) pool = pool.filter(q => q.mode_audit === true);
  else if (audit === false) pool = pool.filter(q => q.mode_audit === false);
  return pickRandom(pool, exclude);
}

// === INTERVENTION ==========================================================
/**
 * Mode INTERVENTION — tirage pondéré multi-référentiels.
 *
 * Étape 1 — tirer un bucket selon les ratios.
 * Étape 2 — filtrer les questions de ce bucket avec audit/multi + éditions R1.
 * Étape 3 — fallback gracieux si bucket vide après filtrage (renormalisation).
 */
function pickIntervention(catalog, { audit, multi, exclude, ratios, editionsR1 }) {
  // 1. Indexer le catalogue par bucket avec les filtres audit/multi/éditions appliqués
  const byBucket = {};
  for (const b of BUCKETS) byBucket[b] = [];

  for (const q of catalog) {
    if (q.multi !== multi) continue;
    if (audit === true && !q.mode_audit) continue;
    if (audit === false && q.mode_audit) continue;

    const b = bucketOf(q);

    // Filtrer les éditions R1 anciennes selon les cases activées
    if (b === "r1_old") {
      const ed = String(q.edition || "");
      if (!editionsR1.includes(ed)) continue;
    }

    byBucket[b].push(q);
  }

  // 2. Renormaliser les ratios sur les buckets non vides + ratio > 0
  const active = {};
  let total = 0;
  for (const b of BUCKETS) {
    const r = ratios[b] || 0;
    if (r > 0 && byBucket[b].length > 0) {
      active[b] = r;
      total += r;
    }
  }
  if (total === 0) {
    // Tous les buckets actifs sont vides → fallback : on relâche, on prend ce qu'on a
    const all = Object.values(byBucket).flat();
    return pickRandom(all, exclude);
  }

  // 3. Tirage pondéré du bucket
  let r = Math.random() * total;
  let chosen = null;
  for (const [b, w] of Object.entries(active)) {
    r -= w;
    if (r <= 0) { chosen = b; break; }
  }
  if (!chosen) chosen = Object.keys(active).pop();

  return pickRandom(byBucket[chosen], exclude);
}

// === AUDIT / REVISION (modes transverses) ==================================
/**
 * Mode AUDIT — uniquement les questions terrain (mode_audit === true).
 * Respecte le mode parent (libre/intervention) pour le scope.
 */
function pickAudit(catalog, opts) {
  return pickQuestion(catalog, { ...opts, audit: true });
}

/**
 * Mode REVISION — chapitre ciblé. Ignore le mode parent.
 */
function pickRevision(catalog, { chapter, exclude }) {
  if (!chapter) return null;
  const pool = catalog.filter(q => String(q.chapitre || "").startsWith(chapter));
  return pickRandom(pool, exclude);
}

// === API publique ==========================================================
/**
 * pickQuestion(catalog, opts) — tirage unifié.
 *
 * Options :
 *   mode         : "libre" | "intervention"  (default "libre")
 *   audit        : true | false | null       (default false ; null = mix)
 *   multi        : boolean                   (default false)
 *   exclude      : question object           (anti-doublon immédiat)
 *   ratios       : objet par bucket          (utilisé en INTERVENTION)
 *   editionsR1   : array de string           (éditions R1 activées en INTER)
 *   chapter      : string                    (mode revision)
 *   submode      : "audit" | "revision" | null (override le filtrage)
 */
export function pickQuestion(catalog, opts = {}) {
  if (!Array.isArray(catalog) || catalog.length === 0) return null;

  const {
    mode = "libre",
    audit = false,
    multi = false,
    exclude = null,
    ratios = DEFAULT_INTERVENTION_RATIOS,
    editionsR1 = DEFAULT_EDITIONS_R1,
    chapter = null,
    submode = null,
  } = opts;

  // Submodes prioritaires
  if (submode === "revision") return pickRevision(catalog, { chapter, exclude });
  if (submode === "audit") {
    if (mode === "intervention") {
      return pickIntervention(catalog, { audit: true, multi, exclude, ratios, editionsR1 });
    }
    return pickLibre(catalog, { audit: true, multi, exclude });
  }

  // Modes principaux
  if (mode === "intervention") {
    return pickIntervention(catalog, { audit, multi, exclude, ratios, editionsR1 });
  }
  return pickLibre(catalog, { audit, multi, exclude });
}

// === Rétrocompat avec l'ancien API App.jsx ================================
/**
 * pickFromCatalog(catalog, options) — wrapper rétrocompatible.
 *
 * L'ancienne API utilisait :
 *   { audit, multi, exclude, ratio, r1Strict }
 *
 * Mapping :
 *   r1Strict: true   → mode: "libre"   (R1 2025 strict, comportement inchangé)
 *   r1Strict: false  → mode: "libre"   (sans cross — par sécurité, anciennes
 *                                       valeurs r1Strict=false étaient utilisées
 *                                       avec le picker legacy non multi-référentiels)
 *
 * Pour activer INTERVENTION, App.jsx doit appeler pickQuestion() directement
 * avec mode: "intervention".
 */
export function pickFromCatalog(catalog, options = {}) {
  const { audit = false, multi = false, exclude = null, r1Strict = false, mode, ratios, editionsR1 } = options;

  // Si mode explicite passé (nouveau code) : on l'utilise
  if (mode === "intervention") {
    return pickQuestion(catalog, { mode, audit, multi, exclude, ratios, editionsR1 });
  }

  // Sinon : comportement legacy = LIBRE strict
  return pickQuestion(catalog, { mode: "libre", audit, multi, exclude });
}

// === Daily Challenge =======================================================
/**
 * Tirage seedé de 10 questions pour le Daily Challenge.
 * En mode INTERVENTION, le seed inclut le hash des ratios pour rester stable
 * tant que les curseurs ne bougent pas.
 */
export function pickDailyTen(catalog, dateKey, { mode = "libre", ratios, editionsR1 } = {}) {
  const seedStr = `daily-${dateKey}-${mode}`;
  const rand = seedRand(seedStr);

  // Pool : selon le mode, mais on retire audit + multi pour le daily
  let pool;
  if (mode === "intervention") {
    pool = catalog.filter(q => !q.multi && !q.mode_audit);
    // Filtrer par buckets actifs (ratio > 0) + éditions R1
    const activeBuckets = new Set(
      BUCKETS.filter(b => (ratios?.[b] || 0) > 0)
    );
    pool = pool.filter(q => {
      const b = bucketOf(q);
      if (!activeBuckets.has(b)) return false;
      if (b === "r1_old") {
        return (editionsR1 || DEFAULT_EDITIONS_R1).includes(String(q.edition));
      }
      return true;
    });
  } else {
    pool = catalog.filter(q =>
      !isCrossQ(q) &&
      (q.referentiel === "R1" || !q.referentiel) &&
      String(q.edition) === "2025" &&
      !q.multi &&
      !q.mode_audit
    );
  }

  // Tirage 10 sans remise, seedé
  const picked = [];
  const used = new Set();
  let safety = 0;
  while (picked.length < 10 && safety < 400 && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    const q = pool[idx];
    if (q && !used.has(q.id)) {
      used.add(q.id);
      picked.push(q);
    }
    safety++;
  }
  return picked;
}

// === Internals =============================================================
function pickRandom(pool, exclude) {
  if (!pool || pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  let q;
  let safety = 0;
  do {
    q = pool[Math.floor(Math.random() * pool.length)];
    safety++;
  } while (exclude && q && exclude.id && q.id === exclude.id && safety < 12);
  return q;
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

// === Stats utilitaires (pour StatsScreen) ==================================
/**
 * Calcule le breakdown d'un catalogue par bucket — utile pour l'UI Settings
 * (affichage "X questions disponibles dans ce bucket").
 */
export function bucketCounts(catalog, editionsR1 = DEFAULT_EDITIONS_R1) {
  const counts = {};
  for (const b of BUCKETS) counts[b] = 0;
  if (!Array.isArray(catalog)) return counts;
  for (const q of catalog) {
    const b = bucketOf(q);
    if (b === "r1_old" && !editionsR1.includes(String(q.edition))) continue;
    counts[b]++;
  }
  return counts;
}

/**
 * Normalise un objet de ratios pour que la somme = 1.
 * Si tout est à 0 → renvoie le default.
 */
export function normalizeRatios(ratios) {
  const sum = Object.values(ratios).reduce((a, b) => a + (b || 0), 0);
  if (sum <= 0) return { ...DEFAULT_INTERVENTION_RATIOS };
  const out = {};
  for (const k of Object.keys(ratios)) out[k] = (ratios[k] || 0) / sum;
  return out;
}

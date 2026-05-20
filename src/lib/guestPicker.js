// src/lib/guestPicker.js
// Picker de questions pour le mode invité.
// Simple et stateless : filtre par tranche de difficulté, pas de SRS.

// 4 niveaux de difficulté invité — mappés sur le champ `difficulte` (1-5) du JSON
export const GUEST_LEVELS = {
  decouverte: {
    id: "decouverte",
    name: "Découverte",
    subtitle: "Pour commencer en douceur",
    difficulties: [1],
  },
  debutant: {
    id: "debutant",
    name: "Débutant",
    subtitle: "Bases du sprinkler",
    difficulties: [1, 2],
  },
  confirme: {
    id: "confirme",
    name: "Confirmé",
    subtitle: "Bon niveau, prêt pour le challenge",
    difficulties: [2, 3],
  },
  pro: {
    id: "pro",
    name: "Pro",
    subtitle: "Niveau vérificateur",
    difficulties: [3, 4, 5],
  },
};

export const GUEST_LEVEL_LIST = Object.values(GUEST_LEVELS);

/**
 * Filtre le catalogue selon le niveau invité.
 */
export function filterByGuestLevel(catalog, levelId, opts = {}) {
  const { excludeMulti = true, excludeAudit = true } = opts;
  const level = GUEST_LEVELS[levelId];
  if (!level) return [];

  return catalog.filter(q => {
    if (!level.difficulties.includes(q.difficulte)) return false;
    if (excludeMulti && q.multi) return false;
    if (excludeAudit && q.mode_audit) return false;
    return true;
  });
}

/**
 * Tire une question dans la sous-bank du niveau, en évitant les questions déjà vues.
 * @param {Array} bank — bank filtrée
 * @param {Set<string>} seenIds — set des ids déjà vus dans la session
 */
export function pickGuestQuestion(bank, seenIds = new Set()) {
  if (!Array.isArray(bank) || bank.length === 0) return null;

  // Si on a tout vu, on reset (pool court)
  const unseen = bank.filter(q => !seenIds.has(q.id));
  if (unseen.length === 0) {
    return bank[Math.floor(Math.random() * bank.length)];
  }
  return unseen[Math.floor(Math.random() * unseen.length)];
}

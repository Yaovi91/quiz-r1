// src/lib/guestPicker.js
// Picker de questions pour le mode invité.
// Simple et stateless : filtre par tranche de difficulté, pas de SRS.

// 4 niveaux de difficulté invité — mappés sur le champ `difficulte` (1-5) du JSON
export const GUEST_LEVELS = {
  decouverte: {
    id: "decouverte",
    name: "Découverte",
    subtitle: "Pour commencer en douceur",
    difficulties: [1],          // seulement difficulte = 1
    timerEnabled: false,        // PAS de chrono en Découverte
  },
  debutant: {
    id: "debutant",
    name: "Débutant",
    subtitle: "Bases du sprinkler",
    difficulties: [1, 2],
    timerEnabled: true,
  },
  confirme: {
    id: "confirme",
    name: "Confirmé",
    subtitle: "Bon niveau, prêt pour le challenge",
    difficulties: [2, 3],
    timerEnabled: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    subtitle: "Niveau vérificateur",
    difficulties: [3, 4, 5],
    timerEnabled: true,
  },
};

export const GUEST_LEVEL_LIST = Object.values(GUEST_LEVELS);

/**
 * Filtre le catalogue selon le niveau invité.
 * @param {Array} catalog — questions normalisées avec champ `bonneReponse`
 * @param {string} levelId — id du niveau (decouverte, debutant, confirme, pro)
 * @param {Object} opts — { excludeMulti, excludeAudit }
 * @returns Array filtrée
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
 * Tire une question dans la sous-bank du niveau, en évitant une éventuelle question à exclure.
 */
export function pickGuestQuestion(bank, exclude = null) {
  if (!Array.isArray(bank) || bank.length === 0) return null;
  if (bank.length === 1) return bank[0];

  let q;
  let safety = 0;
  do {
    q = bank[Math.floor(Math.random() * bank.length)];
    safety++;
  } while (exclude && q && exclude.id && q.id === exclude.id && safety < 10);

  return q;
}

/**
 * Tire N questions distinctes (pour le mode 10 minutes chrono).
 * Si la bank a < N questions, renvoie tout ce qu'elle a.
 */
export function pickGuestSession(bank, count) {
  if (!Array.isArray(bank) || bank.length === 0) return [];
  if (bank.length <= count) {
    return [...bank].sort(() => Math.random() - 0.5);
  }
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

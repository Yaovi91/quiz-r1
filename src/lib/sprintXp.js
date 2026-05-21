// src/lib/sprintXp.js
// Calcul de l'XP gagné pour un Sprint perso.
// Pondération par durée : un sprint court vaut plus par point qu'un long.

const DURATION_MULTIPLIERS = {
  1: 2.0, // 1 min : sprint éclair → 2.0 XP par point
  3: 1.5, // 3 min : sprint intense → 1.5 XP par point
  5: 1.0, // 5 min : référence
  7: 0.7, // 7 min : plus confortable → 0.7 XP par point
};

const MIN_XP = 10;       // XP minimum pour terminer un sprint, même score négatif
const PERFECT_BONUS = 50; // Bonus si aucune faute ET aucun skip

/**
 * Calcule l'XP gagné pour un sprint terminé.
 * @param {Object} result - { score, good, bad, skipped, durationMin }
 * @returns {Object} - { xpBase, xpBonus, xpTotal, isPerfect }
 */
export function computeSprintXp({ score, good, bad, skipped, durationMin }) {
  const mult = DURATION_MULTIPLIERS[durationMin] ?? 1.0;
  const xpFromScore = Math.max(0, Math.round(score * mult));
  const xpBase = Math.max(MIN_XP, xpFromScore);
  const isPerfect = good > 0 && bad === 0 && skipped === 0;
  const xpBonus = isPerfect ? PERFECT_BONUS : 0;
  const xpTotal = xpBase + xpBonus;
  return { xpBase, xpBonus, xpTotal, isPerfect };
}

export { DURATION_MULTIPLIERS, MIN_XP, PERFECT_BONUS };

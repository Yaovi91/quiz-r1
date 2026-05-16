// XP, niveaux, bonus.

// Niveau dérivé du taux après 50 questions répondues.
export function computeLevel({ answered, correct }) {
  if (answered < 50) return 1;
  const rate = correct / answered;
  if (rate < 0.5) return 1;
  if (rate < 0.65) return 2;
  if (rate < 0.75) return 3;
  if (rate < 0.85) return 4;
  return 5;
}

export const LEVEL_NAMES = ["—", "Apprenti", "Initié", "Confirmé", "Expert", "Maître R1"];

// XP de base par réponse, avant bonus.
export function baseXP({ ok, multi }) {
  if (!ok) return 5;
  return multi ? 15 : 10;
}

// Bonus aléatoire : ~5% des questions donnent ×2 XP.
// Décidé AVANT validation pour pouvoir l'afficher (récompense transparente).
export function rollBonus() {
  return Math.random() < 0.05 ? 2 : 1;
}

// Bonus streak quotidien : +25 XP × (jours/7), plafonné à 200 XP/jour.
export function streakDayBonus(streakDays) {
  if (streakDays <= 0) return 0;
  return Math.min(200, Math.round(25 * (streakDays / 7)));
}

// XP nécessaire pour passer le prochain palier visuel (purement cosmétique).
// On n'a pas de "XP requis par niveau" formel — le niveau est dérivé du taux.
// La barre de progression vers le niveau suivant montre la progression du taux.
export function progressToNextLevel({ answered, correct, level }) {
  if (answered < 50) {
    return { pct: Math.min(1, answered / 50), label: `${answered}/50 questions` };
  }
  const rate = correct / answered;
  const thresholds = [0, 0.5, 0.65, 0.75, 0.85, 1.0];
  if (level >= 5) return { pct: 1, label: "Maître R1" };
  const lo = thresholds[level];
  const hi = thresholds[level + 1];
  const pct = Math.max(0, Math.min(1, (rate - lo) / (hi - lo)));
  return { pct, label: `${(rate * 100).toFixed(1)}% / ${(hi * 100).toFixed(0)}%` };
}

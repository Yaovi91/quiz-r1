// Catalogue badges + vérification des conditions.

import { Flame, Award, Target, Trophy, GraduationCap, BookOpen, Layers, Crown, Sparkles, ShieldCheck, Compass, ListChecks, Check, BookMarked, Wrench, Activity, Hammer } from "lucide-react";

// On référence les icônes par leur composant pour rester explicite côté UI.
export const BADGES = [
  // Discipline
  { id: "streak-7",      name: "Première semaine",     desc: "7 jours d'affilée",       icon: Flame,       check: s => s.streakDays >= 7 },
  { id: "streak-30",     name: "Mois d'inspection",    desc: "30 jours d'affilée",      icon: Flame,       check: s => s.streakDays >= 30 },
  { id: "streak-100",    name: "Centenaire",           desc: "100 jours d'affilée",     icon: Flame,       check: s => s.streakDays >= 100 },
  { id: "streak-365",    name: "Année complète",       desc: "365 jours d'affilée",     icon: Crown,       check: s => s.streakDays >= 365 },

  // Performance
  { id: "right-10",      name: "Série propre",         desc: "10 bonnes d'affilée",     icon: Target,      check: s => s.streakRightBest >= 10 },
  { id: "right-25",      name: "En cadence",           desc: "25 bonnes d'affilée",     icon: Target,      check: s => s.streakRightBest >= 25 },
  { id: "right-50",      name: "Métronome",            desc: "50 bonnes d'affilée",     icon: Activity,    check: s => s.streakRightBest >= 50 },
  { id: "right-100",     name: "Chirurgical",          desc: "100 bonnes d'affilée",    icon: Trophy,      check: s => s.streakRightBest >= 100 },

  // Maîtrise par chapitre (100% sur ≥20 questions)
  { id: "chap-clean",    name: "Chapitre maîtrisé",    desc: "100% sur un chapitre (≥20 q.)",
    icon: ShieldCheck,
    check: s => Object.values(s.byChapter || {}).some(c => c.seen >= 20 && c.correct === c.seen) },

  // Volume
  { id: "vol-100",       name: "Cent réponses",        desc: "100 questions répondues", icon: Layers,      check: s => s.answered >= 100 },
  { id: "vol-500",       name: "Cinq cents",           desc: "500 questions répondues", icon: Layers,      check: s => s.answered >= 500 },
  { id: "vol-1000",      name: "Millier",              desc: "1 000 questions",          icon: Layers,      check: s => s.answered >= 1000 },
  { id: "vol-5000",      name: "Bibliothèque vivante", desc: "5 000 questions",          icon: BookMarked,  check: s => s.answered >= 5000 },

  // Niveau (calculé en aval, comparé à state.level)
  { id: "lvl-2",         name: "Initié",               desc: "Atteindre le niveau 2",   icon: GraduationCap, check: s => s.level >= 2 },
  { id: "lvl-3",         name: "Confirmé",             desc: "Atteindre le niveau 3",   icon: GraduationCap, check: s => s.level >= 3 },
  { id: "lvl-4",         name: "Expert",               desc: "Atteindre le niveau 4",   icon: GraduationCap, check: s => s.level >= 4 },
  { id: "lvl-5",         name: "Maître R1",            desc: "Atteindre le niveau 5",   icon: Crown,       check: s => s.level >= 5 },

  // Curiosité
  { id: "all-editions",  name: "Trentenaire",          desc: "Une question de chaque édition",
    icon: Compass,
    check: s => Object.keys(s.byEdition || {}).length >= 3 },

  // Daily / régularité
  { id: "daily-all",     name: "Triple quête",         desc: "Toutes les quêtes du jour", icon: ListChecks, check: s => s.dailyAllDone === true },
  { id: "daily-30",      name: "Mois discipliné",      desc: "30 jours de daily challenge", icon: Award,    check: s => (s.dailyChallengeHistory || []).length >= 30 },

  // Modes
  { id: "survival-25",   name: "Survivant",            desc: "Survival ≥ 25",          icon: BookOpen,    check: s => s.survivalBest >= 25 },
  { id: "survival-50",   name: "Increvable",           desc: "Survival ≥ 50",          icon: Sparkles,    check: s => s.survivalBest >= 50 },

  // Special
  { id: "q1-ready",      name: "Q1 ready",             desc: "90%+ sur chapitres terrain (10, 13, 18)",
    icon: Wrench,
    check: s => {
      const fields = ["10.1", "10.2", "10.3", "10.5", "13.1", "13.2", "18.4", "18.5"];
      let seen = 0, correct = 0;
      for (const k of fields) {
        const c = (s.byChapter || {})[k];
        if (c) { seen += c.seen; correct += c.correct; }
      }
      return seen >= 20 && correct / seen >= 0.9;
    } },

  { id: "tatillon",      name: "Tatillon",             desc: "20 questions piège réussies",
    icon: Hammer,
    check: s => (s.trickyRight || 0) >= 20 },

  { id: "first-correct", name: "Premier déclic",       desc: "Première bonne réponse", icon: Check,       check: s => s.correct >= 1 },
];

/**
 * Renvoie la liste des badges nouvellement débloqués.
 * On ne re-déclenche pas l'animation si déjà débloqué.
 */
export function newlyUnlocked(state) {
  const unlocked = [];
  for (const b of BADGES) {
    if (state.badges[b.id]) continue;
    if (b.check(state)) unlocked.push(b);
  }
  return unlocked;
}

export function markUnlocked(state, badgeId, date) {
  state.badges = { ...state.badges, [badgeId]: date };
  return state;
}

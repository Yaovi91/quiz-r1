// Streaks.
import { todayKey, monthKey } from "./storage.js";

function daysBetween(d1, d2) {
  const a = new Date(d1 + "T00:00:00").getTime();
  const b = new Date(d2 + "T00:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * À chaque ouverture, on appelle visitDay pour mettre à jour le streak jour.
 * Renvoie { freezeUsed: bool, streakLost: bool, newStreak: number }.
 */
export function visitDay(state) {
  const today = todayKey();
  const mk = monthKey();

  // Reset des freezes au 1er du mois.
  if (state.freezesMonth !== mk) {
    state.freezesMonth = mk;
    state.freezesLeft = 2;
  }

  let freezeUsed = false;
  let streakLost = false;

  if (!state.lastActiveDay) {
    // 1ère ouverture : on n'incrémente pas tant qu'on n'a pas répondu.
    return { state, freezeUsed: false, streakLost: false, newStreak: state.streakDays };
  }

  const gap = daysBetween(state.lastActiveDay, today);
  if (gap === 0) {
    // Même jour, rien à faire.
  } else if (gap === 1) {
    // Continuité naturelle — sera incrémenté à la prochaine bonne ou mauvaise réponse.
  } else if (gap === 2 && state.freezesLeft > 0) {
    // Un jour sauté, on consomme un freeze silencieusement.
    state.freezesLeft -= 1;
    freezeUsed = true;
  } else {
    // Streak perdu.
    state.streakDays = 0;
    streakLost = true;
  }

  return { state, freezeUsed, streakLost, newStreak: state.streakDays };
}

/**
 * À appeler à CHAQUE question répondue (juste ou fausse).
 * Incrémente streakDays si nécessaire et met à jour le best.
 */
export function tickActivity(state) {
  const today = todayKey();
  if (state.lastActiveDay === today) return state;
  // Si lastActiveDay == hier (ou freeze consommé) → +1, sinon reset à 1.
  if (state.lastActiveDay) {
    const gap = daysBetween(state.lastActiveDay, today);
    if (gap === 1) state.streakDays += 1;
    else state.streakDays = 1;
  } else {
    state.streakDays = 1;
  }
  state.lastActiveDay = today;
  if (state.streakDays > state.streakDaysBest) state.streakDaysBest = state.streakDays;
  return state;
}

/**
 * À chaque réponse, met à jour le streak de bonnes réponses consécutives.
 */
export function tickRightStreak(state, ok) {
  if (ok) {
    state.streakRight += 1;
    if (state.streakRight > state.streakRightBest) state.streakRightBest = state.streakRight;
  } else {
    state.streakRight = 0;
  }
  return state;
}

/** Seuils paliers streak jour qui déclenchent une célébration appuyée. */
export const STREAK_DAY_MILESTONES = [7, 14, 30, 60, 100, 365];

/** Seuils paliers streak bonnes réponses. */
export const STREAK_RIGHT_MILESTONES = [5, 10, 25, 50, 100];

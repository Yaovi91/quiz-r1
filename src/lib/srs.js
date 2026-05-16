// Spaced Repetition (SM-2 simplifié).
// On garde par question : ease, interval (en jours), lastSeen (timestamp), seen, correct.

import { todayKey } from "./storage.js";

const EASE_INIT = 2.5;
const EASE_MIN = 1.3;

export function initCard() {
  return { ease: EASE_INIT, interval: 0, lastSeen: null, seen: 0, correct: 0 };
}

export function reviewCard(card, ok) {
  const c = card ? { ...card } : initCard();
  c.seen += 1;
  if (ok) {
    c.correct += 1;
    c.interval = c.interval === 0 ? 1 : Math.round(c.interval * c.ease);
    c.ease = Math.min(3.5, c.ease + 0.1);
  } else {
    c.interval = 1;
    c.ease = Math.max(EASE_MIN, c.ease - 0.2);
  }
  c.lastSeen = todayKey();
  return c;
}

// Une carte est "due" si elle n'a jamais été vue OU si (lastSeen + interval) <= today.
export function isDue(card) {
  if (!card || !card.lastSeen) return true;
  const last = new Date(card.lastSeen + "T00:00:00").getTime();
  const dueTs = last + card.interval * 86400000;
  return Date.now() >= dueTs;
}

import { useEffect, useReducer, useMemo } from "react";
import { loadState, saveState, todayKey } from "../lib/storage.js";
import { reviewCard } from "../lib/srs.js";
import { computeLevel, baseXP, streakDayBonus, rollBonus } from "../lib/xp.js";
import { tickActivity, tickRightStreak, visitDay, STREAK_DAY_MILESTONES } from "../lib/streaks.js";
import { newlyUnlocked, markUnlocked } from "../lib/badges.js";
import { ensureDailyQuests, tickQuests } from "../lib/quests.js";
import { weakestChapter } from "../lib/picker.js";

// Clone "safe" : élimine toute fonction (composants Lucide, predicates, etc.)
// pour rester strictement JSON-sérialisable. Sinon structuredClone crashe.
function safeClone(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === "function") return undefined;
    return value;
  }));
}

function reducer(state, action) {
  switch (action.type) {
    case "boot": {
      const next = safeClone(state);
      const visit = visitDay(next);
      ensureDailyQuests(visit.state, next.level || 1);
      return { ...visit.state, _visit: { freezeUsed: visit.freezeUsed, streakLost: visit.streakLost } };
    }

    case "answer": {
      const { question, ok, xpMul } = action.payload;
      const next = safeClone(state);
      const today = todayKey();

      next.answered += 1;
      if (ok) next.correct += 1;

      const ch = question.chapitre;
      next.byChapter[ch] = next.byChapter[ch] || { seen: 0, correct: 0 };
      next.byChapter[ch].seen += 1;
      if (ok) next.byChapter[ch].correct += 1;

      const ed = question.edition;
      next.byEdition[ed] = next.byEdition[ed] || { seen: 0 };
      next.byEdition[ed].seen += 1;

      next.cards[question.id] = reviewCard(next.cards[question.id], ok);

      tickActivity(next);
      tickRightStreak(next, ok);

      const base = baseXP({ ok, multi: question.multi });
      const mul = xpMul || 1;
      const isFirstAnswerToday = next.xpByDay[today] === undefined;
      const dayBonus = isFirstAnswerToday ? streakDayBonus(next.streakDays) : 0;
      const gained = base * mul + dayBonus;
      next.xp += gained;
      next.xpByDay[today] = (next.xpByDay[today] || 0) + gained;

      next.heatmap[today] = (next.heatmap[today] || 0) + 1;

      const newLevel = computeLevel({ answered: next.answered, correct: next.correct });
      const levelUp = newLevel > next.level;
      next.level = newLevel;

      const last = next.curve[next.curve.length - 1];
      const rate = next.correct / next.answered;
      if (!last || last.d !== today) {
        next.curve.push({ d: today, rate, answered: next.answered });
        if (next.curve.length > 90) next.curve = next.curve.slice(-90);
      } else {
        last.rate = rate;
        last.answered = next.answered;
      }

      const last10 = (next._last10 || []).slice(-9).concat([ok]);
      next._last10 = last10;
      const weak = weakestChapter(next.byChapter);
      const { completed } = tickQuests(next, {
        ok, multi: question.multi, chapter: question.chapitre,
        edition: question.edition, weakestChapter: weak,
        streakRight: next.streakRight, last10,
      });

      if (next.dailyAllDone && !state.dailyAllDone) {
        next.xp += 100;
        next.xpByDay[today] = (next.xpByDay[today] || 0) + 100;
      }

      const unlocked = newlyUnlocked(next);
      for (const b of unlocked) markUnlocked(next, b.id, today);

      // IMPORTANT : ne JAMAIS mettre d'objet contenant des fonctions dans _events.
      // On stocke uniquement les IDs ; l'UI fait le mapping vers les composants.
      next._events = {
        levelUp: levelUp ? newLevel : null,
        questsCompleted: completed.map(q => q.id),
        badgesUnlocked: unlocked.map(b => b.id),
        xpGained: gained,
        streakDayMilestone: STREAK_DAY_MILESTONES.includes(next.streakDays) ? next.streakDays : null,
      };

      return next;
    }

    case "ack-events": {
      const next = safeClone(state);
      next._events = null;
      next._visit = null;
      return next;
    }

    case "ack-visit": {
      const next = safeClone(state);
      next._visit = null;
      return next;
    }

    case "survival-end": {
      const next = safeClone(state);
      const score = action.payload;
      if (score > (next.survivalBest || 0)) next.survivalBest = score;
      const unlocked = newlyUnlocked(next);
      for (const b of unlocked) markUnlocked(next, b.id, todayKey());
      next._events = { badgesUnlocked: unlocked.map(b => b.id) };
      return next;
    }

    case "settings": {
      const next = safeClone(state);
      next.settings = { ...next.settings, ...action.payload };
      return next;
    }

    case "reset": {
      return action.payload;
    }

    case "import": {
      return action.payload;
    }

    default: return state;
  }
}

export default function useStore() {
  const [state, dispatch] = useReducer(reducer, null, loadState);

  useEffect(() => {
    dispatch({ type: "boot" });
  }, []);

  useEffect(() => {
    try {
      saveState(state);
    } catch (e) {
      console.warn("save failed", e);
    }
  }, [state]);

  const derived = useMemo(() => {
    const rate = state.answered >= 50 ? state.correct / state.answered : null;
    return {
      rate,
      xpToday: state.xpByDay[todayKey()] || 0,
      hasBonus: () => rollBonus(),
    };
  }, [state]);

  return { state, dispatch, ...derived };
}

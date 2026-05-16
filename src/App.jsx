import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";

import useStore from "./hooks/useStore.js";
import useQuestions from "./hooks/useQuestions.js";
import { pickQuestion, pickDailyTen } from "./lib/picker.js";
import { rollBonus } from "./lib/xp.js";
import { todayKey } from "./lib/storage.js";
import { popMicro } from "./lib/confetti.js";
import { BADGES } from "./lib/badges.js";
import { QUEST_POOL } from "./lib/quests.js";

import HeaderBar from "./components/quiz/HeaderBar.jsx";
import QuestionCard from "./components/quiz/QuestionCard.jsx";
import ExplanationPanel from "./components/quiz/ExplanationPanel.jsx";
import FooterBar from "./components/quiz/FooterBar.jsx";
import ModePicker from "./components/quiz/ModePicker.jsx";
import LevelUpOverlay from "./components/quiz/LevelUpOverlay.jsx";
import BadgeToast from "./components/quiz/BadgeToast.jsx";
import SurvivalEnd from "./components/quiz/SurvivalEnd.jsx";

import StatsScreen from "./components/stats/StatsScreen.jsx";
import LibraryScreen from "./components/library/LibraryScreen.jsx";

const MODE_LABELS = {
  libre: "Quizz libre",
  daily: "Daily challenge",
  survival: "Survival",
  audit: "Audit terrain",
  revision: "Révision ciblée",
};

// ============================================================
// ErrorBoundary : capture les erreurs React au lieu d'écran noir
// ============================================================
import React from "react";
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  reset = () => {
    this.setState({ error: null });
    try { localStorage.removeItem("quizr1.v1.state"); } catch {}
  };
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] mb-2">Pépin</div>
          <h1 className="font-display italic text-[26px] mb-3 text-[var(--color-fg-primary)]">
            L'app a buggé
          </h1>
          <pre className="text-[11px] font-mono text-[var(--color-fg-tertiary)] mb-6 whitespace-pre-wrap break-words max-w-full">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={this.reset}
            className="px-4 py-3 rounded-[10px] bg-[var(--color-accent)] text-white font-mono text-[12px] uppercase tracking-wider"
          >
            Réinitialiser et redémarrer
          </button>
          <p className="text-[11px] text-[var(--color-fg-tertiary)] font-mono mt-4 max-w-[280px]">
            Ta progression sera effacée mais l'app fonctionnera à nouveau.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function listChapters(pool) {
  const set = new Set();
  for (const q of pool) {
    const first = q.chapitre.split(".")[0];
    set.add(first);
  }
  return [...set].sort((a, b) => Number(a) - Number(b));
}

function answerOk(question, selectedIdx) {
  const expected = [...question.bonnes_reponses].sort((a, b) => a - b);
  if (expected.length !== selectedIdx.length) return false;
  for (let i = 0; i < expected.length; i++) if (expected[i] !== selectedIdx[i]) return false;
  return true;
}

function AppInner() {
  const { state, dispatch } = useStore();
  const { questions, loading, importQuestions, resetQuestions } = useQuestions();

  const [mode, setMode] = useState("libre");
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);

  const [statsOpen, setStatsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const [current, setCurrent] = useState(null);
  const [phase, setPhase] = useState("asking");
  const [result, setResult] = useState(null);
  const [xpMul, setXpMul] = useState(1);

  // Anti tap-through iPhone : bloque le tap immédiat sur "Question suivante"
  // après validation. La transition Framer Motion dure ~280ms, on prend 400ms
  // pour avoir une marge.
  const [canAdvance, setCanAdvance] = useState(true);

  const [dailyQueue, setDailyQueue] = useState([]);
  const [dailyScore, setDailyScore] = useState(0);
  const [dailyDone, setDailyDone] = useState(false);

  const [survivalScore, setSurvivalScore] = useState(0);
  const [survivalOpen, setSurvivalOpen] = useState(false);
  const [survivalRecord, setSurvivalRecord] = useState(false);

  const [capReachedShown, setCapReachedShown] = useState(false);

  const [visitNotice, setVisitNotice] = useState(null);
  useEffect(() => {
    if (state._visit?.freezeUsed) {
      setVisitNotice({
        kind: "Joker utilisé",
        title: "Tu as sauté hier",
        subtitle: `J'ai consommé 1 joker. Il t'en reste ${state.freezesLeft}.`,
      });
      dispatch({ type: "ack-visit" });
    } else if (state._visit?.streakLost && state.streakDaysBest > 0) {
      setVisitNotice({
        kind: "Série remise à zéro",
        title: "Pas grave, on repart",
        subtitle: `Ton record reste à ${state.streakDaysBest} jours.`,
      });
      dispatch({ type: "ack-visit" });
    }
  }, [state._visit]);

  const todayCount = useMemo(() => state.heatmap?.[todayKey()] || 0, [state.heatmap]);
  const capReached = state.settings?.dailyCap != null && todayCount >= state.settings.dailyCap;

  function pickNext() {
    try {
      if (!questions || questions.length === 0) return;

      if (mode === "daily") {
        if (dailyQueue.length === 0) {
          const today = todayKey();
          const alreadyPlayed = state.dailyChallenge?.date === today;
          if (alreadyPlayed) { setDailyDone(true); setCurrent(null); return; }
          const list = pickDailyTen(questions, state, today);
          if (list.length === 0) { setCurrent(null); return; }
          setDailyQueue(list.slice(1).map(q => q.id));
          setDailyScore(0); setDailyDone(false);
          setCurrent(list[0]);
          setXpMul(rollBonus()); setPhase("asking"); setResult(null);
          return;
        }
        const nextId = dailyQueue[0];
        const q = questions.find(x => x.id === nextId);
        setDailyQueue(dailyQueue.slice(1));
        setCurrent(q);
        setXpMul(rollBonus()); setPhase("asking"); setResult(null);
        return;
      }

      const opts = {
        mode: mode === "revision" ? "revision" : mode === "audit" ? "audit" : mode,
        chapter: mode === "revision" ? activeChapter : null,
        excludeIds: current ? [current.id] : [],
      };
      const q = pickQuestion(questions, state, opts);
      setCurrent(q);
      setXpMul(rollBonus()); setPhase("asking"); setResult(null);
    } catch (e) {
      console.error("pickNext crashed:", e);
      setCurrent(null);
    }
  }

  useEffect(() => {
    if (!loading && !current && questions.length > 0) pickNext();
  }, [loading, questions.length]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (mode === "survival") { setSurvivalScore(0); setSurvivalOpen(false); }
    if (mode === "daily") { setDailyQueue([]); setDailyScore(0); setDailyDone(false); }
    if (mode === "revision" && !activeChapter) { setChapterPickerOpen(true); return; }
    pickNext();
  }, [mode, activeChapter]);

  // Cooldown anti tap-through : à chaque passage en "validated", désactive
  // le bouton "Question suivante" pendant 400ms.
  useEffect(() => {
    if (phase === "validated") {
      setCanAdvance(false);
      const t = setTimeout(() => setCanAdvance(true), 400);
      return () => clearTimeout(t);
    } else {
      setCanAdvance(true);
    }
  }, [phase, current?.id]);

  function handleValidate(selected) {
    if (!current) return;
    const ok = answerOk(current, selected);

    setResult({ ok, correctIndexes: current.bonnes_reponses });
    setPhase("validated");
    try { if (ok) popMicro(); } catch (e) { console.warn("confetti failed", e); }

    if (mode === "revision") return;

    dispatch({ type: "answer", payload: { question: current, ok, xpMul } });

    if (mode === "survival" && ok) setSurvivalScore(s => s + 1);
    if (mode === "daily" && ok) setDailyScore(s => s + 1);
  }

  function handleNext() {
    if (!canAdvance) return; // protège du tap-through iPhone
    if (mode === "survival" && result && !result.ok) {
      const finalScore = survivalScore;
      const isRecord = finalScore > (state.survivalBest || 0);
      setSurvivalRecord(isRecord);
      setSurvivalOpen(true);
      dispatch({ type: "survival-end", payload: finalScore });
      return;
    }
    if (mode === "daily" && dailyQueue.length === 0) {
      setDailyDone(true);
      setCurrent(null);
      return;
    }
    if (capReached && !capReachedShown && mode !== "revision") {
      setCapReachedShown(true);
      return;
    }
    pickNext();
  }

  function handleSurvivalRestart() {
    setSurvivalOpen(false);
    setSurvivalScore(0);
    pickNext();
  }

  function handleSurvivalQuit() {
    setSurvivalOpen(false);
    setSurvivalScore(0);
    setMode("libre");
  }

  function handlePickMode(m) {
    setModePickerOpen(false);
    if (m === "revision") {
      setActiveChapter(null);
      setMode("revision");
    } else {
      setMode(m);
    }
  }

  const chapters = useMemo(() => listChapters(questions), [questions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-tertiary)]">Chargement…</span>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <h1 className="font-display italic text-[28px] mb-3">Banque vide</h1>
        <p className="text-[14px] text-[var(--color-fg-secondary)] mb-5">
          Importe un fichier JSON de questions depuis la Bibliothèque.
        </p>
        <button
          onClick={() => setLibraryOpen(true)}
          className="px-4 py-2.5 rounded-[10px] bg-[var(--color-accent)] text-white font-mono text-[12px] uppercase tracking-wider"
        >
          Ouvrir la Bibliothèque
        </button>
        <LibraryScreen
          open={libraryOpen}
          state={state}
          onClose={() => setLibraryOpen(false)}
          onImportQuestions={importQuestions}
          onResetQuestions={resetQuestions}
          onSettings={(p) => dispatch({ type: "settings", payload: p })}
          onResetState={(s) => dispatch({ type: "reset", payload: s })}
        />
      </div>
    );
  }

  const evt = state._events;
  const levelUpLevel = evt?.levelUp || null;

  // Résolution des IDs vers les objets complets (badges/quêtes).
  // C'est UI-only : les composants Lucide ne sont jamais persistés.
  const badgeItems = (evt?.badgesUnlocked || [])
    .map(id => {
      const b = BADGES.find(x => x.id === id);
      return b ? { id, title: b.name, subtitle: b.desc, icon: b.icon, kind: "Badge débloqué" } : null;
    })
    .filter(Boolean);

  const questItems = (evt?.questsCompleted || [])
    .map(id => {
      const q = QUEST_POOL.find(x => x.id === id);
      return q ? { id: "quest-" + id, title: q.label, subtitle: "+50 XP bonus", icon: undefined, kind: "Quête réussie" } : null;
    })
    .filter(Boolean);

  const toastItems = [...questItems, ...badgeItems, ...(visitNotice ? [visitNotice] : [])];

  if (capReached && capReachedShown) {
    return (
      <CapScreen
        cap={state.settings.dailyCap}
        onContinue={() => { setCapReachedShown(false); pickNext(); }}
        onStats={() => { setCapReachedShown(false); setStatsOpen(true); }}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <HeaderBar
        state={state}
        xpToday={state.xpByDay?.[todayKey()] || 0}
        onOpenStats={() => setStatsOpen(true)}
      />

      <div className="flex-1 flex flex-col pt-2">
        {mode === "daily" && dailyDone ? (
          <DailyDoneCard
            score={dailyScore}
            total={10}
            state={state}
            onBackToLibre={() => setMode("libre")}
          />
        ) : current ? (
          <QuestionCard
            question={current}
            state={phase}
            result={result}
            xpMul={xpMul}
            onValidate={handleValidate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center px-8 text-center">
            <div>
              <p className="text-[14px] text-[var(--color-fg-secondary)] mb-4">
                Aucune question disponible pour ce mode.
              </p>
              <button
                onClick={() => setMode("libre")}
                className="px-4 py-2.5 rounded-[10px] bg-[var(--color-accent)] text-white font-mono text-[12px] uppercase tracking-wider"
              >
                Retour mode libre
              </button>
            </div>
          </div>
        )}
      </div>

      <FooterBar
        state={state}
        modeLabel={
          mode === "daily" ? `${MODE_LABELS.daily} · ${10 - dailyQueue.length - (current && phase === "asking" ? 1 : 0)}/10`
          : mode === "survival" ? `${MODE_LABELS.survival} · ${survivalScore}`
          : mode === "revision" && activeChapter ? `Révision · § ${activeChapter}`
          : MODE_LABELS[mode]
        }
        onOpenModes={() => setModePickerOpen(true)}
      />

      <ExplanationPanel
        open={phase === "validated" && !!current}
        question={current}
        ok={result?.ok}
        gained={evt?.xpGained || 0}
        onNext={handleNext}
      />

      <ModePicker
        open={modePickerOpen}
        current={mode}
        onClose={() => setModePickerOpen(false)}
        onPick={handlePickMode}
        chapters={chapters}
      />

      <ChapterPicker
        open={chapterPickerOpen}
        chapters={chapters}
        byChapter={state.byChapter}
        onClose={() => { setChapterPickerOpen(false); if (!activeChapter) setMode("libre"); }}
        onPick={(c) => { setActiveChapter(c); setChapterPickerOpen(false); }}
      />

      <StatsScreen
        open={statsOpen}
        state={state}
        onClose={() => setStatsOpen(false)}
        onOpenLibrary={() => setLibraryOpen(true)}
      />
      <LibraryScreen
        open={libraryOpen}
        state={state}
        onClose={() => setLibraryOpen(false)}
        onImportQuestions={importQuestions}
        onResetQuestions={resetQuestions}
        onSettings={(p) => dispatch({ type: "settings", payload: p })}
        onResetState={(s) => dispatch({ type: "reset", payload: s })}
      />

      <LevelUpOverlay
        level={levelUpLevel}
        onClose={() => dispatch({ type: "ack-events" })}
      />
      <BadgeToast
        items={toastItems}
        onDone={() => { dispatch({ type: "ack-events" }); setVisitNotice(null); }}
      />
      <SurvivalEnd
        open={survivalOpen}
        score={survivalScore}
        best={state.survivalBest || 0}
        isRecord={survivalRecord}
        onRestart={handleSurvivalRestart}
        onClose={handleSurvivalQuit}
      />
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function CapScreen({ cap, onContinue, onStats }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[320px]"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-tertiary)] mb-2">
          Cap journalier atteint
        </div>
        <h1 className="font-display italic text-[34px] leading-tight tracking-tight text-[var(--color-fg-primary)] mb-3">
          Repose tes yeux,
          <br />à demain.
        </h1>
        <p className="text-[14px] text-[var(--color-fg-secondary)] mb-6">
          Tu as fait tes {cap} questions du jour. La régularité fait plus de bien que les sessions marathon.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onStats}
            className="w-full py-3 rounded-[10px] bg-[var(--color-bg-raised)] border border-[var(--color-border-strong)] text-[13px] font-mono uppercase tracking-wider text-[var(--color-fg-primary)]"
          >
            Voir mes stats
          </button>
          <button
            onClick={onContinue}
            className="w-full py-2.5 text-[11px] font-mono uppercase tracking-wider text-[var(--color-fg-tertiary)] active:opacity-60"
          >
            Continuer quand même
          </button>
        </div>
      </motion.div>
    </main>
  );
}

function DailyDoneCard({ score, total, state, onBackToLibre }) {
  const rate = score / total;
  const verdict = rate >= 0.9 ? "Sans faute ou presque" : rate >= 0.7 ? "Très solide" : rate >= 0.5 ? "À retravailler" : "Sois patient";
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-tertiary)] mb-2">
        Daily challenge — terminé
      </div>
      <div className="font-display italic text-[72px] leading-none tracking-tight mb-2 text-[var(--color-fg-primary)]">
        {score}<span className="text-[var(--color-fg-tertiary)] text-[42px]">/{total}</span>
      </div>
      <div className="font-display italic text-[20px] text-[var(--color-accent)] mb-6">
        {verdict}
      </div>
      <button
        onClick={onBackToLibre}
        className="px-5 py-3 rounded-[10px] bg-[var(--color-accent)] text-white font-mono text-[12px] uppercase tracking-wider"
        style={{ boxShadow: "0 0 14px var(--color-accent-glow)" }}
      >
        Continuer en libre
      </button>
    </div>
  );
}

function ChapterPicker({ open, chapters, byChapter, onClose, onPick }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="mx-3 mb-3 rounded-[24px] surface-raised overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-display italic text-[22px] tracking-tight">Choisis un chapitre</h2>
                <button onClick={onClose} className="w-9 h-9 rounded-full bg-[var(--color-bg-overlay)] border border-[var(--color-border-subtle)] flex items-center justify-center">
                  <X size={16} strokeWidth={1.7} className="text-[var(--color-fg-secondary)]" />
                </button>
              </div>

              <div className="flex flex-col px-3 pb-3 gap-1.5">
                {chapters.map(ch => {
                  let seen = 0, correct = 0;
                  for (const [k, c] of Object.entries(byChapter || {})) {
                    if (k.startsWith(ch + ".") || k === ch) {
                      seen += c.seen; correct += c.correct;
                    }
                  }
                  const rate = seen > 0 ? correct / seen : null;
                  return (
                    <motion.button
                      key={ch}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onPick(ch)}
                      className="w-full px-4 py-3 rounded-[12px] bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] active:bg-[var(--color-bg-overlay)] flex items-center justify-between"
                    >
                      <span className="font-display italic text-[17px]">§ {ch}</span>
                      <span className="font-mono tabular text-[11px] text-[var(--color-fg-tertiary)]">
                        {rate != null ? `${(rate * 100).toFixed(0)}% · ${seen}` : "Nouveau"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

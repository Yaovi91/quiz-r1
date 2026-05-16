import { useEffect, useState } from "react";

const KEY = "quizr1.v1.questions";

export default function useQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1. Tente de charger un set importé par l'utilisateur.
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestions(parsed);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 2. Sinon, charge le bootstrap.
      try {
        const base = import.meta.env.BASE_URL || "/";
        const r = await fetch(base + "questions.example.json");
        const data = await r.json();
        setQuestions(data);
      } catch (e) {
        console.error("Failed to load questions", e);
        setQuestions([]);
      }
      setLoading(false);
    })();
  }, []);

  function importQuestions(list) {
    const cleaned = list.filter(q =>
      q && q.id && q.enonce && Array.isArray(q.propositions) && Array.isArray(q.bonnes_reponses)
    );
    localStorage.setItem(KEY, JSON.stringify(cleaned));
    setQuestions(cleaned);
  }

  function resetQuestions() {
    localStorage.removeItem(KEY);
    location.reload();
  }

  return { questions, loading, importQuestions, resetQuestions };
}

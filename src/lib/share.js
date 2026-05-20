// src/lib/share.js
// Partage natif via Web Share API iOS / Android + fallback gracieux.

const APP_URL = "https://yaovi91.github.io/quiz-r1/";
const INVITE_URL = `${APP_URL}?from=invite`;

/**
 * Construit le payload de partage pour un résultat de session invité.
 * Adapté aux deux modes : Mort Subite + Sprint scoré.
 */
export function buildGuestShareText({
  mode, levelName,
  score,
  total,             // Sprint : nb questions répondues (hors skip)
  questionsAsked,    // Sprint : nb questions vues (avec skip)
  good, bad, skipped,// Sprint : compteurs détaillés
  durationMin,       // Sprint : durée en minutes
  isSurvival,
}) {
  if (isSurvival) {
    return `J'ai tenu ${score} bonnes réponses d'affilée en Mort Subite (niveau ${levelName}) sur Quiz R1.\n\nÀ ton tour : ${INVITE_URL}`;
  }

  // Sprint scoré
  const details = [];
  if (typeof good === 'number') details.push(`${good} bonnes`);
  if (typeof bad === 'number' && bad > 0) details.push(`${bad} fautes`);
  if (typeof skipped === 'number' && skipped > 0) details.push(`${skipped} passées`);
  const detailLine = details.length > 0 ? ` (${details.join(' · ')})` : '';
  const durLine = durationMin ? ` ${durationMin} min` : '';

  return `J'ai marqué ${score} pts au Sprint${durLine} R1 — niveau ${levelName}${detailLine}.\n\nÀ ton tour : ${INVITE_URL}`;
}

/**
 * Tente de partager via Web Share API, sinon ouvre un menu de fallback.
 * Renvoie une promesse qui résout en { method, ok }.
 *   method = 'native' | 'fallback' | 'cancelled'
 */
export async function shareResult({ title, text, url = INVITE_URL }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { method: "native", ok: true };
    } catch (e) {
      if (e.name === "AbortError") {
        return { method: "cancelled", ok: false };
      }
    }
  }
  return { method: "fallback", ok: false };
}

/**
 * Copie un texte dans le presse-papier. Renvoie boolean.
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function buildMailtoUrl({ subject, body }) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildSmsUrl({ body }) {
  return `sms:&body=${encodeURIComponent(body)}`;
}

export function formatTime(sec) {
  if (sec === null || sec === undefined) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}'${String(s).padStart(2, "0")}`;
}

export { APP_URL, INVITE_URL };

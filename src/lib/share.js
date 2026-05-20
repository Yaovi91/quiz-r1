// src/lib/share.js
// Partage natif via Web Share API iOS / Android + fallback gracieux.

const APP_URL = "https://yaovi91.github.io/quiz-r1/";
const INVITE_URL = `${APP_URL}?from=invite`;

/**
 * Construit le payload de partage pour un résultat de session invité.
 */
export function buildGuestShareText({ mode, levelName, score, total, timeSec, isSurvival }) {
  const formatted = formatTime(timeSec);

  if (isSurvival) {
    return `Je viens de tenir ${score} bonnes réponses d'affilée en Mort Subite (niveau ${levelName}) sur Quiz R1.\n\nÀ ton tour : ${INVITE_URL}`;
  }

  if (total) {
    const timePart = timeSec !== null && timeSec !== undefined ? ` en ${formatted}` : "";
    return `J'ai fait ${score}/${total} en ${mode} (niveau ${levelName})${timePart} sur Quiz R1.\n\nÀ ton tour : ${INVITE_URL}`;
  }

  return `Découvre Quiz R1 : ${INVITE_URL}`;
}

/**
 * Tente de partager via Web Share API, sinon ouvre un menu de fallback.
 * Renvoie une promesse qui résout en { method, ok }.
 *   method = 'native' | 'fallback' | 'cancelled'
 */
export async function shareResult({ title, text, url = INVITE_URL }) {
  // Tentative Web Share API
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { method: "native", ok: true };
    } catch (e) {
      // L'utilisateur a annulé : c'est OK, on ne fait pas tomber le fallback
      if (e.name === "AbortError") {
        return { method: "cancelled", ok: false };
      }
      // Autre erreur : on essaie le fallback
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
    // Fallback legacy
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

/**
 * Construit un lien mailto: pour partager par mail.
 */
export function buildMailtoUrl({ subject, body }) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Construit un lien sms: pour partager par SMS (iOS).
 */
export function buildSmsUrl({ body }) {
  // iOS attend ?&body=... pour autoriser le pré-remplissage
  return `sms:&body=${encodeURIComponent(body)}`;
}

// Helper : format mm'ss
export function formatTime(sec) {
  if (sec === null || sec === undefined) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}'${String(s).padStart(2, "0")}`;
}

export { APP_URL, INVITE_URL };

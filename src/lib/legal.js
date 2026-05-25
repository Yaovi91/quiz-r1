// src/lib/legal.js
// Constantes et helpers pour le disclaimer FIRE QUIZZ.
// Pour bumper la version après un changement majeur du contenu légal :
// → incrémenter LEGAL_VERSION (ex : 'v1.0.0' → 'v1.1.0').
// Le modal se réaffichera automatiquement à tous les utilisateurs.

export const LEGAL_VERSION = 'v1.0.0';

const STORAGE_KEY = 'firequizz.legal.acceptedVersion';

export const LEGAL_POINTS = [
  { icon: 'ShieldCheck', label: 'FIRE QUIZZ est un outil pédagogique personnel.' },
  { icon: 'BookOpen',    label: "Application indépendante, non affiliée au CNPP, à l'AFNOR, à la NFPA ni à FM Global." },
  { icon: 'AlertTriangle', label: 'Le contenu peut comporter des erreurs ou des imprécisions.' },
  { icon: 'FileText',    label: "Cette application ne remplace pas les textes officiels. Pour toute intervention professionnelle, se référer aux référentiels en vigueur." },
  { icon: 'Database',    label: "Vos données restent sur votre appareil. Aucune information n'est transmise à un serveur." },
];

export const LEGAL_SHORT =
  "Outil pédagogique personnel, faillible. Pour intervention professionnelle, se référer aux textes officiels en vigueur.";

export const LEGAL_SOURCES =
  "R1 CNPP, R5 CNPP, NF EN 12845, NF EN 671-3, NFPA 13/20/22, FMDS, NF S 62-200/201, NF S 61-213, Guide pratique D9.";

export function hasAcceptedLegal() {
  try {
    return localStorage.getItem(STORAGE_KEY) === LEGAL_VERSION;
  } catch {
    return false;
  }
}

export function acceptLegal() {
  try {
    localStorage.setItem(STORAGE_KEY, LEGAL_VERSION);
  } catch {
    // localStorage indisponible (mode privé strict) : on accepte sans persister
  }
}

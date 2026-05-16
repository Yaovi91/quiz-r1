import { motion } from "framer-motion";

/**
 * Bulbe de sprinkler stylisé : ampoule de verre + liquide rouge qui monte avec le streak.
 * `heat` est un ratio 0..1 qui colore le bulbe et active la pulsation.
 * `size` en pixels.
 */
export default function SprinklerBulb({ heat = 0, size = 22, pulse = false }) {
  const h = Math.max(0, Math.min(1, heat));
  // Niveau de remplissage du bulbe (de bas en haut).
  const fillY = 14 - h * 8; // y du haut du liquide (vers 6 quand plein)
  const liquidColor = `rgba(230, 57, 70, ${0.45 + h * 0.55})`;
  const glassStroke = h > 0.05 ? "rgba(230, 57, 70, 0.6)" : "rgba(180, 185, 200, 0.45)";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={pulse && h > 0.2 ? "bulb-pulse" : ""}
      initial={false}
      animate={{ scale: pulse && h > 0.5 ? [1, 1.05, 1] : 1 }}
      transition={{ duration: 1.6, repeat: pulse && h > 0.5 ? Infinity : 0, ease: "easeInOut" }}
    >
      {/* Embase métallique */}
      <path
        d="M9 3.5h6v1.5a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V3.5Z"
        fill="rgba(180, 185, 200, 0.5)"
        stroke="rgba(180, 185, 200, 0.7)"
        strokeWidth="0.5"
      />
      {/* Bras de fixation */}
      <path d="M8 5.5h8" stroke="rgba(180, 185, 200, 0.4)" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M8.5 5.5l-0.5 2M15.5 5.5l0.5 2" stroke="rgba(180, 185, 200, 0.4)" strokeWidth="0.8" strokeLinecap="round" />
      {/* Bulbe en verre */}
      <ellipse cx="12" cy="14" rx="3.5" ry="6" stroke={glassStroke} strokeWidth="1" fill="rgba(255,255,255,0.04)" />
      {/* Liquide rouge (clipped) */}
      <defs>
        <clipPath id="bulbClip">
          <ellipse cx="12" cy="14" rx="3.5" ry="6" />
        </clipPath>
      </defs>
      <motion.rect
        x="8.5"
        width="7"
        clipPath="url(#bulbClip)"
        fill={liquidColor}
        initial={false}
        animate={{ y: fillY, height: 20 - fillY }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
      />
      {/* Reflet vertical */}
      <path d="M10.4 10.5c-0.3 1.6-0.3 4 0 6" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" strokeLinecap="round" />
      {/* Déflecteur */}
      <path d="M9 20.5h6" stroke="rgba(180, 185, 200, 0.55)" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M10 20.5l-1 1.2M14 20.5l1 1.2" stroke="rgba(180, 185, 200, 0.4)" strokeWidth="0.7" strokeLinecap="round" />
    </motion.svg>
  );
}

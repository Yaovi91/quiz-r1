import { useId } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// FlameLogo — Icône flamme officielle de Fire Quizz
// ─────────────────────────────────────────────────────────────────────────────
// Source de vérité de la flamme. À importer partout (header, hero, splash,
// badges, écran fin de quizz, etc.).
//
// Le SVG est dessiné dans un viewBox 100 × 130 (ratio ≈ 0.77).
// La prop `size` correspond à la HAUTEUR en pixels ; la largeur est calculée
// automatiquement pour conserver le ratio.
//
// Usage :
//   import FlameLogo from '@/components/FlameLogo';
//   <FlameLogo />                                  → 48 px, animé, glow base
//   <FlameLogo size={120} glow="intense" />        → hero / splash
//   <FlameLogo size={24} animated={false} glow="soft" />  → header dense
//   <FlameLogo size={64} animated={false} glow="none" />  → icône iOS (PNG export)
// ─────────────────────────────────────────────────────────────────────────────

const ASPECT_RATIO = 100 / 130; // width / height

const GLOWS = {
  none: 'none',
  soft:
    'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.25))',
  base:
    'drop-shadow(0 4px 14px rgba(230, 57, 70, 0.30)) ' +
    'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.20))',
  intense:
    'drop-shadow(0 6px 22px rgba(245, 158, 11, 0.50)) ' +
    'drop-shadow(0 3px 12px rgba(230, 57, 70, 0.40)) ' +
    'drop-shadow(0 0 32px rgba(252, 211, 77, 0.25))',
};

// Vacillement subtil : 4 s, easeInOut, infini.
// Les valeurs sont volontairement faibles pour un effet "vivant" sans distraire.
const FLICKER_ANIMATION = {
  scale: [1, 1.015, 0.995, 1.01, 1],
  skewX: [0, -0.6, 0.4, -0.3, 0],
};

const FLICKER_TRANSITION = {
  duration: 4,
  repeat: Infinity,
  ease: 'easeInOut',
};

/**
 * @param {object}  props
 * @param {number}  [props.size=48]                              Hauteur en px
 * @param {boolean} [props.animated=true]                        Vacillement on/off
 * @param {'none'|'soft'|'base'|'intense'} [props.glow='base']   Intensité du halo
 * @param {string}  [props.className]                            Classes additionnelles
 * @param {string}  [props.title='Fire Quizz']                   Alt accessibilité
 */
export default function FlameLogo({
  size = 48,
  animated = true,
  glow = 'base',
  className = '',
  title = 'Fire Quizz',
  ...rest
}) {
  // IDs uniques pour permettre plusieurs instances sur la même page
  // (chaque <linearGradient> doit avoir un id unique globalement).
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const idOuter = `fl-outer-${uid}`;
  const idInner = `fl-inner-${uid}`;
  const idHl = `fl-hl-${uid}`;

  return (
    <motion.span
      className={className}
      style={{
        display: 'inline-block',
        lineHeight: 0,
        width: size * ASPECT_RATIO,
        height: size,
        transformOrigin: '50% 90%',
        filter: GLOWS[glow] ?? GLOWS.base,
        willChange: animated ? 'transform' : 'auto',
      }}
      animate={animated ? FLICKER_ANIMATION : undefined}
      transition={animated ? FLICKER_TRANSITION : undefined}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 130"
        width="100%"
        height="100%"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>

        <defs>
          {/* Silhouette : rouge profond → orange → jaune → ivoire */}
          <linearGradient id={idOuter} x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#E63946" />
            <stop offset="35%" stopColor="#F1542C" />
            <stop offset="70%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#FFFBEA" />
          </linearGradient>

          {/* Cœur : ambre → blanc incandescent */}
          <linearGradient id={idInner} x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#FCD34D" />
            <stop offset="80%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Reflet : highlight blanc semi-transparent */}
          <radialGradient id={idHl} cx="0.45" cy="0.82" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Couche 1 — silhouette principale */}
        <path
          d="M 50 126 C 28 124, 14 110, 14 86 C 14 70, 22 58, 24 46
             C 26 36, 22 30, 30 22 C 36 16, 36 22, 44 18
             C 48 12, 46 6, 54 4 C 58 14, 60 24, 66 32
             C 72 42, 78 50, 82 62 C 88 78, 88 96, 80 112
             C 74 122, 64 126, 50 126 Z"
          fill={`url(#${idOuter})`}
        />

        {/* Couche 2 — cœur incandescent */}
        <path
          d="M 50 110 C 38 108, 30 98, 32 82 C 33 72, 38 64, 40 54
             C 42 46, 38 40, 44 34 C 48 30, 48 26, 54 22
             C 56 30, 58 38, 60 46 C 64 56, 68 66, 68 78
             C 68 92, 62 106, 50 110 Z"
          fill={`url(#${idInner})`}
        />

        {/* Couche 3 — reflet blanc */}
        <path
          d="M 48 96 C 42 92, 40 80, 44 70 C 46 64, 44 58, 48 52
             C 50 50, 50 48, 52 46 C 54 56, 56 66, 54 78
             C 53 86, 52 92, 48 96 Z"
          fill={`url(#${idHl})`}
        />
      </svg>
    </motion.span>
  );
}

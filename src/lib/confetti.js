import confetti from "canvas-confetti";

const ACCENT = "#E63946";
const ACCENT_SOFT = "#F38994";
const GOLD = "#F59E0B";
const CREAM = "#EDEEF2";

export function popMicro() {
  confetti({
    particleCount: 18,
    startVelocity: 30,
    spread: 60,
    origin: { y: 0.6 },
    colors: [ACCENT, CREAM],
    scalar: 0.7,
    disableForReducedMotion: true,
  });
}

export function popLevelUp() {
  const end = Date.now() + 1100;
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: [ACCENT, GOLD, CREAM],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: [ACCENT, GOLD, CREAM],
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function popBadge() {
  confetti({
    particleCount: 60,
    spread: 90,
    origin: { y: 0.5 },
    colors: [ACCENT, ACCENT_SOFT, GOLD, CREAM],
    scalar: 1.0,
    disableForReducedMotion: true,
  });
}

export function popRecord() {
  confetti({
    particleCount: 90,
    spread: 110,
    origin: { y: 0.4 },
    colors: [ACCENT, GOLD, CREAM],
    scalar: 1.1,
    disableForReducedMotion: true,
  });
}

export default function Pill({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "text-[var(--color-fg-secondary)] border-[var(--color-border-subtle)] bg-[var(--color-bg-overlay)]",
    accent:  "text-[var(--color-accent)] border-[rgba(230,57,70,0.35)] bg-[var(--color-accent-soft)]",
    success: "text-[var(--color-success)] border-[rgba(74,222,128,0.3)] bg-[var(--color-success-soft)]",
    muted:   "text-[var(--color-fg-tertiary)] border-[var(--color-border-subtle)] bg-transparent",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider border rounded-md ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// src/components/LegalInfoButton.jsx
// À monter dans QuestionScreen (et/ou tout écran où tu veux le rappel rapide).
// Props :
//   onOpenFull : callback pour ouvrir l'écran "Mentions légales" complet.
//                Ex : () => navigate('/legal')  ou  () => setScreen('legal')

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { LEGAL_SHORT } from '../lib/legal';

const FF_BODY = "'Geist', -apple-system, system-ui, sans-serif";
const FF_MONO = "'Geist Mono', 'SF Mono', monospace";

export default function LegalInfoButton({ onOpenFull }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Mentions légales"
        className="fixed z-10 flex items-center justify-center rounded-full"
        style={{
          right: 8,
          bottom: 'calc(8px + env(safe-area-inset-bottom))',
          height: 44,
          width: 44, // hit-area étendue, icône reste petite
        }}
      >
        <Info size={14} className="text-white/40" strokeWidth={2} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[91] bg-[#0F1115] border-t border-white/[0.08] rounded-t-[28px] px-5 pt-4"
              style={{
                paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))',
              }}
            >
              <div className="mx-auto h-1 w-10 rounded-full bg-white/10 mb-5" />
              <div className="flex items-center gap-2 mb-3">
                <Info size={13} className="text-[#F59E0B]" />
                <span
                  className="text-[10px] tracking-[0.2em] uppercase text-white/40"
                  style={{ fontFamily: FF_MONO }}
                >
                  Mentions légales
                </span>
              </div>
              <p
                className="text-[13px] leading-relaxed text-white/75 mb-5"
                style={{ fontFamily: FF_BODY }}
              >
                {LEGAL_SHORT}
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenFull?.();
                }}
                className="text-[12px] text-[#F59E0B]"
                style={{ fontFamily: FF_BODY, minHeight: 44 }}
              >
                Mentions complètes →
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

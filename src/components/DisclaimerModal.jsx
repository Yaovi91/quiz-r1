// src/components/DisclaimerModal.jsx
// À monter une seule fois à la racine de l'App (ex : <App>).
// Se déclenche tout seul si l'utilisateur n'a pas accepté la version courante de LEGAL_VERSION.

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, BookOpen, AlertTriangle, FileText, Database, Check,
} from 'lucide-react';
import { LEGAL_POINTS, hasAcceptedLegal, acceptLegal } from '../lib/legal';

const ICONS = { ShieldCheck, BookOpen, AlertTriangle, FileText, Database };

const FF_DISPLAY = "'Instrument Serif', 'Times New Roman', serif";
const FF_BODY = "'Geist', -apple-system, system-ui, sans-serif";
const FF_MONO = "'Geist Mono', 'SF Mono', monospace";

export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasAcceptedLegal()) setOpen(true);
  }, []);

  const handleAccept = () => {
    acceptLegal();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md px-4"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="w-full max-w-md rounded-[28px] border border-white/[0.08] bg-[#0F1115] p-6"
            style={{
              boxShadow:
                '0 30px 60px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              <span
                className="text-[10px] tracking-[0.2em] uppercase text-white/40"
                style={{ fontFamily: FF_MONO }}
              >
                Avant de commencer
              </span>
            </div>
            <h2
              className="text-[30px] text-white mb-1 tracking-tight leading-none"
              style={{ fontFamily: FF_DISPLAY }}
            >
              Bienvenue
            </h2>
            <p
              className="text-[13px] text-white/50 mb-5"
              style={{ fontFamily: FF_BODY }}
            >
              Quelques précisions importantes.
            </p>

            <ul className="space-y-3 mb-6">
              {LEGAL_POINTS.map((p, i) => {
                const Icon = ICONS[p.icon];
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.08 + i * 0.05,
                      type: 'spring',
                      stiffness: 300,
                      damping: 24,
                    }}
                    className="flex gap-3 items-start"
                  >
                    <Icon
                      size={15}
                      className="text-[#F59E0B] flex-shrink-0 mt-[3px]"
                      strokeWidth={2}
                    />
                    <span
                      className="text-[13px] leading-relaxed text-white/80"
                      style={{ fontFamily: FF_BODY }}
                    >
                      {p.label}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAccept}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] py-3.5 text-[14px] font-medium text-black"
              style={{ minHeight: 44, fontFamily: FF_BODY }}
            >
              <Check size={16} strokeWidth={2.5} />
              J'ai compris
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

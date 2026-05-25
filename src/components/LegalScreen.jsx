// src/screens/LegalScreen.jsx
// Écran "Mentions légales" complet, à brancher dans ton routing.
// Props :
//   onBack : callback retour vers Réglages. Ex : () => navigate(-1)

import { motion } from 'framer-motion';
import {
  ChevronLeft, ShieldCheck, BookOpen, AlertTriangle, FileText, Database,
} from 'lucide-react';
import { LEGAL_POINTS, LEGAL_SOURCES, LEGAL_VERSION } from '../lib/legal';

const ICONS = { ShieldCheck, BookOpen, AlertTriangle, FileText, Database };

const FF_DISPLAY = "'Instrument Serif', 'Times New Roman', serif";
const FF_BODY = "'Geist', -apple-system, system-ui, sans-serif";
const FF_MONO = "'Geist Mono', 'SF Mono', monospace";

export default function LegalScreen({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="min-h-screen bg-[#0A0B0F] text-white"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="h-11 w-11 flex items-center -ml-2 text-white/70"
        >
          <ChevronLeft size={22} />
        </button>
      </div>

      <div className="px-5 pb-12">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
          <span
            className="text-[10px] tracking-[0.2em] uppercase text-white/40"
            style={{ fontFamily: FF_MONO }}
          >
            Conformité
          </span>
        </div>
        <h1
          className="text-[34px] mb-6 tracking-tight leading-[1]"
          style={{ fontFamily: FF_DISPLAY }}
        >
          Mentions légales
        </h1>

        <div className="space-y-5 mb-8">
          {LEGAL_POINTS.map((p, i) => {
            const Icon = ICONS[p.icon];
            return (
              <div key={i} className="flex gap-3 items-start">
                <Icon
                  size={15}
                  className="text-[#F59E0B] flex-shrink-0 mt-1"
                  strokeWidth={2}
                />
                <p
                  className="text-[14px] leading-relaxed text-white/80"
                  style={{ fontFamily: FF_BODY }}
                >
                  {p.label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
          <div>
            <p
              className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1.5"
              style={{ fontFamily: FF_MONO }}
            >
              Sources officielles
            </p>
            <p
              className="text-[12px] text-white/70 leading-relaxed"
              style={{ fontFamily: FF_BODY }}
            >
              {LEGAL_SOURCES}
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.06]">
            <p
              className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1.5"
              style={{ fontFamily: FF_MONO }}
            >
              Version disclaimer
            </p>
            <p
              className="text-[12px] text-white/70"
              style={{ fontFamily: FF_MONO }}
            >
              {LEGAL_VERSION}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Zap, ShieldCheck, CreditCard, Activity, QrCode, Mail, Box, FileText } from 'lucide-react';

const AboutModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/90 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col"
          >
            {/* Header */}
            <div className="relative overflow-hidden border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-6 sm:p-8">
              {/* Header Background Glow */}
              <div className="absolute -top-10 left-1/4 h-32 w-1/2 rounded-full bg-cyan-500/20 blur-[50px] pointer-events-none"></div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    <Info size={28} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    {/* Corner accents */}
                    <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-cyan-400 blur-[2px]"></div>
                    <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-blue-400 blur-[2px]"></div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-sm uppercase">Overview</h2>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></div>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400/80">Nexus Automated Protocol</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <X size={20} className="transition-transform group-hover:rotate-90 group-hover:scale-110" />
                </button>
              </div>
            </div>

            {/* Content Body - Scrollable */}
            <div className="overflow-y-auto p-6 md:p-8 text-slate-300 custom-scrollbar">
              
              <div className="flex flex-col gap-6">
                
                {/* Introduction Block */}
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
                  <p className="text-base leading-relaxed text-slate-200 relative z-10">
                    <span className="font-bold text-white text-lg">Nexus</span> is a digital-first protocol designed to transform the chaotic graduation exit process into a seamless online experience. It eliminates the bureaucratic nightmare of running between departments hunting for physical signatures, replacing it with a transparent, centralized system that handles the heavy lifting of administrative clearance.
                  </p>
                </div>

                {/* Core Workflow */}
                <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10 hover:border-cyan-500/20">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-2 text-lg">The Digital Chain of Custody</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      At its core, Nexus replaces physical paperwork with a digital chain of custody. Students upload their documents into a <strong className="text-cyan-300 font-medium">Smart Document Vault</strong>, which automatically verifies file metadata. Simultaneously, an automated <strong className="text-cyan-300 font-medium">Multi-Stage Approval Workflow</strong> triggers sequential notifications to department heads—from Lab In-charges to HODs and Principals—allowing them to approve or flag applications directly via their Action Dashboards. To keep the process moving, automated email nudges are dispatched if an authority hasn't reviewed a request within 48 hours.
                    </p>
                  </div>
                </div>

                {/* Financials & Tracking */}
                <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10 hover:border-cyan-500/20">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-2 text-lg">Automated Reconciliation & Tracking</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      The platform handles financial clearance autonomously. An <strong className="text-cyan-300 font-medium">Internal Dues Reconciliation Engine</strong> allows departments (like the Library) to upload CSVs of pending dues, instantly flagging profiles. If dues are detected, an <strong className="text-cyan-300 font-medium">Integrated Payment Sandbox</strong> enables students to resolve fines directly on the platform, automatically generating digital receipts and moving them to the next stage. Throughout this process, students can track their exact progress via a color-coded <strong className="text-cyan-300 font-medium">Live Status Heatmap</strong>.
                    </p>
                  </div>
                </div>

                {/* Final Output */}
                <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10 hover:border-cyan-500/20">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <QrCode size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-2 text-lg">Secure Final Delivery</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      Upon final approval, the system's PDF generator produces a non-editable <strong className="text-cyan-300 font-medium">Digital No-Dues Certificate</strong> alongside a consolidated Transcript. Every certificate features <strong className="text-cyan-300 font-medium">QR-Coded Verification</strong> linking back to a public URL to guarantee authenticity. Finally, all uploaded documents, receipts, and the final certificate are bundled into a <strong className="text-cyan-300 font-medium">Personal Digital Locker</strong>—a one-click ZIP download that serves as a permanent digital archive for the student's career records.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AboutModal;

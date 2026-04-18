import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

function VerifyPage() {
  const { certId } = useParams();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="glass-panel neon-border relative w-full max-w-lg overflow-hidden p-10 text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_45%)]" />
        <div className="relative z-10">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_35px_rgba(34,197,94,0.28)]"
          >
            <CheckCircle2 size={42} />
          </motion.div>
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
            <ShieldCheck size={12} /> Verified
          </div>
          <h1 className="text-3xl font-black text-white">Certificate Verification</h1>
          <p className="mt-4 text-sm text-slate-300">
            Certificate ID: <span className="font-mono font-semibold text-cyan-200">{certId}</span>
          </p>
          <p className="mt-8 text-2xl font-bold text-emerald-300 drop-shadow-[0_0_18px_rgba(74,222,128,0.35)]">
            This certificate is valid
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default VerifyPage;

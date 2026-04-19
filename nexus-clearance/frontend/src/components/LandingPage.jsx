import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, Sparkles, Info } from 'lucide-react';
import AboutModal from './AboutModal';

function LandingPage() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative flex min-h-[72vh] flex-col items-center justify-center text-center perspective-wrapper overflow-hidden pb-12"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden flex items-end justify-center">
        <div className="grid-3d-bg opacity-70"></div>
      </div>

      {/* Top Navigation / Header Actions */}
      <div className="absolute top-4 right-4 z-50 md:top-8 md:right-8">
        <button
          onClick={() => setShowAbout(true)}
          className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:text-cyan-200 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:scale-105"
        >
          <Info size={16} />
          About Nexus
        </button>
      </div>

      <div className="glass-panel neon-border mx-auto mb-8 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.25em] text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <Sparkles size={16} />
        Project Nexus
      </div>

      <h1 className="mb-14 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-[0_2px_20px_rgba(255,255,255,0.15)]">
        Institutional <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Clearance</span>
      </h1>

      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2 relative z-10 px-4">
        <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.4 }}>
          <Link
            to="/login?type=student"
            className="glass-card group flex flex-col h-full items-center justify-center gap-4 p-8 text-center text-white"
          >
            <div className="rounded-2xl bg-cyan-500/15 p-5 text-cyan-400 shadow-lg shadow-cyan-950/20 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <User size={32} />
            </div>
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Student Portal</div>
              <div className="text-lg text-slate-300 transition-colors group-hover:text-white">Login to access your dashboard</div>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.4 }}>
          <Link
            to="/login?type=admin"
            className="glass-card group flex flex-col h-full items-center justify-center gap-4 p-8 text-center text-white"
          >
            <div className="rounded-2xl bg-blue-500/15 p-5 text-blue-400 shadow-lg shadow-blue-950/20 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
              <Shield size={32} />
            </div>
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-300">Admin Portal</div>
              <div className="text-lg text-slate-300 transition-colors group-hover:text-white">Login to manage approvals</div>
            </div>
          </Link>
        </motion.div>
      </div>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </motion.div>
  );
}

export default LandingPage;

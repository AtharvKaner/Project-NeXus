import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, ArrowRight, Sparkles, ShieldCheck, Layers3 } from 'lucide-react';

function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative flex min-h-[72vh] flex-col items-center justify-center text-center"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="floaty absolute left-10 top-10 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="floaty absolute right-10 top-1/3 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl [animation-delay:2s]" />
      </div>

      <div className="glass-panel neon-border mx-auto mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">
        <Sparkles size={14} />
        Project Nexus
      </div>

      <h1 className="mb-5 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
        Streamlined Institutional <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Clearance</span>
      </h1>

      <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base md:text-lg">
        A premium, multi-stage approval workflow designed for educational institutions to automate clearance, dues, and certification with confidence.
      </p>

      <div className="mt-10 grid w-full max-w-5xl gap-4 sm:grid-cols-2">
        <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.3 }}>
          <Link
            to="/login?type=student"
            className="glass-card group flex h-full items-center gap-4 p-5 text-left text-white neon-border hover:bg-white/12"
          >
            <div className="rounded-2xl bg-cyan-500/15 p-4 text-cyan-300 shadow-lg shadow-cyan-950/20 transition-transform duration-300 group-hover:scale-110">
              <User size={24} />
            </div>
            <div className="flex-1">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Student Portal</div>
              <div className="mt-1 text-2xl font-bold">Access your dues and certificate</div>
            </div>
            <ArrowRight className="text-cyan-300" size={18} />
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.3 }}>
          <Link
            to="/login?type=admin"
            className="glass-card group flex h-full items-center gap-4 p-5 text-left text-white neon-border hover:bg-white/12"
          >
            <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-300 shadow-lg shadow-violet-950/20 transition-transform duration-300 group-hover:scale-110">
              <Shield size={24} />
            </div>
            <div className="flex-1">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Admin Portal</div>
              <div className="mt-1 text-2xl font-bold">Review, approve, and manage</div>
            </div>
            <ArrowRight className="text-violet-300" size={18} />
          </Link>
        </motion.div>
      </div>

      <div className="mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {[
          { icon: Layers3, label: 'Workflow', value: 'Multi-stage' },
          { icon: ShieldCheck, label: 'Security', value: 'Verified QR' },
          { icon: Sparkles, label: 'Experience', value: 'Premium UI' },
        ].map((item) => (
          <div key={item.label} className="glass-card flex items-center gap-4 p-4 text-left text-white">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
              <item.icon size={20} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
              <div className="text-lg font-semibold">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-sm text-slate-400">
        New here? <Link to="/signup" className="font-semibold text-cyan-300 hover:text-cyan-200">Create an account</Link>
      </div>
    </motion.div>
  );
}

export default LandingPage;

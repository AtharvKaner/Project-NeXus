import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, XCircle, ShieldCheck } from 'lucide-react';

function StatusTracker({ status }) {
  if (!status) return null;

  const steps = [
    { key: 'lab', label: 'Lab Clearance' },
    { key: 'hod', label: 'HOD Approval' },
    { key: 'principal', label: 'Principal Approval' }
  ];

  const getIcon = (stepState) => {
    if (stepState === 'approved') return <ShieldCheck size={22} className="text-white drop-shadow-md" />;
    if (stepState === 'rejected') return <XCircle size={22} className="text-white drop-shadow-md" />;
    return <Clock size={22} className="text-amber-300 drop-shadow-md" />;
  };

  const getIconContainerStyle = (stepState) => {
    if (stepState === 'approved') 
      return 'bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent shadow-[0_0_20px_rgba(16,185,129,0.4),0_0_0_2px_rgba(16,185,129,0.15)] z-20';
    if (stepState === 'rejected') 
      return 'bg-gradient-to-br from-rose-500 to-red-600 border-transparent shadow-[0_0_20px_rgba(225,29,72,0.4),0_0_0_2px_rgba(225,29,72,0.15)] z-20';
    
    // Pending style
    return 'bg-slate-800/80 border-amber-500/40 backdrop-blur-md shadow-[0_0_10px_rgba(245,158,11,0.2),0_0_0_2px_rgba(245,158,11,0.05)] z-10'; 
  };

  const getLineGradient = (index) => {
    if (index === 0) return null; 
    
    const prevKey = steps[index - 1].key;
    const currentKey = steps[index].key;
    
    const prevStatus = status[prevKey]?.state || 'pending';
    const currentStatus = status[currentKey]?.state || 'pending';

    if (prevStatus === 'approved' && currentStatus === 'approved') {
      return "from-emerald-500 to-teal-400 opacity-100 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    } else if (prevStatus === 'approved' && currentStatus === 'rejected') {
      return "from-emerald-500 to-rose-500 opacity-100";
    } else if (prevStatus === 'approved' && currentStatus === 'pending') {
      return "from-emerald-500 via-amber-500/50 to-slate-700/50 opacity-80 overflow-hidden relative shimmer";
    } else if (prevStatus === 'rejected') {
      return "from-rose-500 to-slate-700/30 opacity-40";
    }
    
    return "from-slate-700/50 to-slate-700/50 opacity-40";
  };

  return (
    <div className="relative my-16 px-4">
      {/* Background Track Line */}
      <div className="absolute left-[16%] right-[16%] top-6 h-1 rounded-full bg-slate-800/80 backdrop-blur-sm -z-10 shadow-inner"></div>
      
      <div className="flex justify-between items-start relative w-full">
        {steps.map((step, index) => {
          const stepData = status[step.key];
          const stepState = stepData?.state || 'pending';
          const comment = stepData?.comment || '';
          
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center relative group">
              
              {/* Colored Connection Lines connecting icons */}
              {index > 0 && (
                <div className={`absolute top-6 right-[50%] w-full h-1 -translate-y-1/2 bg-gradient-to-r transition-all duration-700 ease-in-out -z-5 ${getLineGradient(index)}`}></div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.15 }}
                whileHover={{ y: -6, scale: 1.05 }}
                className="relative z-20 flex flex-col items-center w-full"
              >
                {/* Node Orb */}
                <div className={`mt-0 mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-500 ${getIconContainerStyle(stepState)} group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`}>
                  {getIcon(stepState)}
                </div>
                
                {/* Labels */}
                <div className="text-center transition-colors duration-300">
                  <div className={`text-sm md:text-base font-bold ${stepState === 'approved' ? 'text-emerald-300' : stepState === 'rejected' ? 'text-rose-400' : 'text-slate-200'}`}>
                    {step.label}
                  </div>
                  <div className={`mt-1.5 text-[10px] uppercase tracking-[0.2em] font-bold ${
                    stepState === 'approved' ? 'text-teal-400/80' : 
                    stepState === 'rejected' ? 'text-red-400/80' : 
                    'text-amber-400/80 animate-pulse'
                  }`}>
                    {stepState}
                  </div>
                </div>
                
                {/* Comments */}
                {comment && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 w-[140px] md:w-[160px] break-words rounded-xl border px-3 py-2.5 text-center text-xs font-medium backdrop-blur-md shadow-lg transition-all duration-300 ${
                      stepState === 'approved' 
                        ? 'border-emerald-500/30 bg-emerald-950/60 text-emerald-200' 
                        : 'border-rose-500/30 bg-rose-950/60 text-rose-200'
                    }`}
                  >
                    <span>{comment}</span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatusTracker;

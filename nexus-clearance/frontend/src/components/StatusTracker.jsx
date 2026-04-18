import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

function StatusTracker({ status }) {
  if (!status) return null;

  const steps = [
    { key: 'lab', label: 'Lab Clearance' },
    { key: 'hod', label: 'HOD Approval' },
    { key: 'principal', label: 'Principal Approval' }
  ];

  const getIcon = (stepState) => {
    if (stepState === 'approved') return <CheckCircle size={24} />;
    if (stepState === 'rejected') return <AlertCircle size={24} />;
    return <Clock size={24} />;
  };

  const getIconContainerStyle = (stepState) => {
    if (stepState === 'approved') return 'bg-green-600 border-green-600 text-white shadow-[0_0_0_4px_rgba(22,163,74,0.2)]';
    if (stepState === 'rejected') return 'bg-red-600 border-red-600 text-white shadow-[0_0_0_4px_rgba(220,38,38,0.2)]';
    return 'bg-white border-slate-200 text-slate-400 tracker-icon-pulse shadow-[0_0_0_4px_rgba(245,158,11,0.2)]'; // Pending style
  };

  return (
    <div className="relative my-12 flex justify-between">
      {/* Connecting Line */}
      <div className="absolute left-0 right-0 top-6 z-0 h-0.5 bg-white/10"></div>
      
      {steps.map((step, index) => {
        const stepData = status[step.key];
        const stepState = stepData?.state || 'pending';
        const comment = stepData?.comment || '';
        
        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            whileHover={{ y: -4 }}
            className="relative z-10 flex flex-1 flex-col items-center"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${getIconContainerStyle(stepState)}`}>
              {getIcon(stepState)}
            </div>
            <div className="text-center text-sm font-semibold text-white md:text-base">{step.label}</div>
            <div className="mt-1 text-xs capitalize text-slate-300">{stepState}</div>
            
            {comment && (
              <div className={`mt-2 max-w-[150px] break-words rounded-2xl border px-3 py-2 text-center text-xs shadow-sm ${
                stepState === 'approved' 
                  ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' 
                  : 'border-rose-400/20 bg-rose-500/10 text-rose-200'
              }`}>
                {comment}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default StatusTracker;

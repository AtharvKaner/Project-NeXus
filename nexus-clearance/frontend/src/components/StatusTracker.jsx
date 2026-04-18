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
    <div className="relative flex justify-between my-12">
      {/* Connecting Line */}
      <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 z-0"></div>
      
      {steps.map((step, index) => {
        const stepData = status[step.key];
        const stepState = stepData?.state || 'pending';
        const comment = stepData?.comment || '';
        
        return (
          <div key={step.key} className="flex flex-col items-center z-10 relative flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-4 transition-all duration-300 ${getIconContainerStyle(stepState)}`}>
              {getIcon(stepState)}
            </div>
            <div className="font-semibold text-slate-800 text-sm md:text-base text-center">{step.label}</div>
            <div className="text-xs text-slate-500 capitalize mt-1">{stepState}</div>
            
            {comment && (
              <div className={`mt-2 text-xs px-3 py-1.5 rounded-md text-center max-w-[140px] break-words border shadow-sm ${
                stepState === 'approved' 
                  ? 'text-green-700 bg-green-50 border-green-200' 
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {comment}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StatusTracker;

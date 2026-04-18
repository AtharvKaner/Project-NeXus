import { useState, useEffect } from 'react';
import StatusTracker from './StatusTracker';
import Certificate from './Certificate';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Eye, ArrowRight } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function StudentDashboard({ user }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewCert, setViewCert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [user]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`${API_URL}/api/requests/${user.username}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setRequest(data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    setIsSubmitting(true);
    // Simulate slight delay for realistic upload feel
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            studentId: user.username,
            studentName: user.username.charAt(0).toUpperCase() + user.username.slice(1)
          })
        });
        const data = await res.json();
        if (res.ok) {
          setRequest(data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to submit request.');
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_0.5s_ease] w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header Area */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Clearance Status</h2>
            <p className="text-sm text-slate-500 mt-0.5">Track your administrative clearance progress</p>
          </div>
          {request && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              request.finalStatus === 'approved' ? 'bg-green-100 text-green-700' :
              request.finalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {request.finalStatus}
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {!request ? (
            /* EMPTY STATE: ONBOARDING / UPLOAD */
            <div className="max-w-md mx-auto text-center py-8">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Initiate Clearance</h3>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                You have not submitted a clearance request yet. Upload your prerequisite documents to initiate the workflow across all departments.
              </p>
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 mb-6 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Click to upload documents" />
                <UploadCloud size={32} className="text-slate-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm font-medium text-slate-700">Click or drag documents here</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG up to 10MB</p>
              </div>

              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed" 
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Submit Documents <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ACTIVE STATE: TRACKER */
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 mb-10">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Application ID</p>
                  <p className="font-mono text-sm font-medium text-slate-800">#{request.id.toString().padStart(6, '0')}</p>
                </div>
                <div className="hidden md:block w-px h-10 bg-slate-200"></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Submitted On</p>
                  <p className="text-sm font-medium text-slate-800">Today</p>
                </div>
                <div className="hidden md:block w-px h-10 bg-slate-200"></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Current Stage</p>
                  <p className="text-sm font-medium text-slate-800 capitalize">
                    {request.status.lab.state === 'pending' ? 'Lab Clearance' : 
                     request.status.hod.state === 'pending' ? 'HOD Review' : 
                     request.status.principal.state === 'pending' ? 'Principal Review' : 'Completed'}
                  </p>
                </div>
              </div>
              
              <StatusTracker status={request.status} />

              {request.finalStatus === 'rejected' && (
                 <div className="mt-12 p-5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
                   <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="font-bold text-red-800 mb-1">Action Required</h4>
                     <p className="text-sm text-red-700 leading-relaxed m-0">Your clearance request has been halted. Please resolve the issues noted in the timeline above and contact the respective department administration to proceed.</p>
                   </div>
                 </div>
              )}
              
              {request.finalStatus === 'approved' && (
                <div className="mt-12 text-center pt-8 border-t border-slate-100">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">You're All Clear!</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Your clearance process is officially complete. You can now download or view your digital certificate.</p>
                  <button 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all shadow-sm" 
                    onClick={() => setViewCert(!viewCert)}
                  >
                    <Eye size={18} />
                    {viewCert ? 'Hide Certificate' : 'View Digital Certificate'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewCert && request && request.finalStatus === 'approved' && (
        <div className="mt-8">
          <Certificate request={request} />
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;

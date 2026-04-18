import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Search, Filter, Inbox } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function AdminDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewType, setReviewType] = useState(null); 
  const [reviewComment, setReviewComment] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/requests`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const submitReview = async (id) => {
    if (reviewType === 'rejected' && !reviewComment.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      const endpoint = reviewType === 'approved' ? 'approve' : 'reject';
      const res = await fetch(`${API_URL}/api/requests/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role, comment: reviewComment })
      });
      
      if (res.ok) {
        setReviewingId(null);
        setReviewType(null);
        setReviewComment('');
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.message || `Error marking as ${reviewType}`);
      }
    } catch (err) {
      alert('Network error while reviewing');
    }
  };

  const isCurrentStage = (req) => {
    if (req.finalStatus === 'rejected') return false;

    const r = user.role;
    if (r === 'lab' && req.status.lab.state === 'pending') return true;
    if (r === 'hod' && req.status.lab.state === 'approved' && req.status.hod.state === 'pending') return true;
    if (r === 'principal' && req.status.hod.state === 'approved' && req.status.principal.state === 'pending') return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const roleDisplayNames = {
    lab: 'Lab Authority',
    hod: 'Head of Department',
    principal: 'Principal'
  };

  const actionableRequests = requests.filter(isCurrentStage);

  return (
    <div className="animate-[fade-in_0.5s_ease] w-full max-w-5xl mx-auto">
      
      {/* Dashboard Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Action Items</h1>
          <p className="text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{roleDisplayNames[user.role]}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search ID..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64" disabled />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors" title="Filter (mock)">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 flex items-start gap-3">
          <XCircle size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Main List Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-5 md:col-span-4">Student</div>
          <div className="col-span-4 md:col-span-5 hidden sm:block">Pipeline Status</div>
          <div className="col-span-7 md:col-span-3 text-right">Action</div>
        </div>

        {actionableRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={28} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Inbox Zero</h3>
            <p className="text-slate-500 text-sm">There are no pending applications requiring your review.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {actionableRequests.map(req => (
              <div key={req.id} className="group">
                <div className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/50 transition-colors">
                  
                  {/* Student Info */}
                  <div className="col-span-8 sm:col-span-5 md:col-span-4">
                    <p className="font-bold text-slate-800 text-base">{req.studentName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">#{req.studentId}</p>
                  </div>
                  
                  {/* Badges */}
                  <div className="col-span-12 sm:col-span-4 md:col-span-5 hidden sm:flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      req.status.lab.state === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                      req.status.lab.state === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>Lab</span>
                    
                    <div className="w-4 h-px bg-slate-300"></div>
                    
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      req.status.hod.state === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                      req.status.hod.state === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>HOD</span>
                    
                    <div className="w-4 h-px bg-slate-300"></div>
                    
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      req.status.principal.state === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                      req.status.principal.state === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>Prin</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-4 sm:col-span-3 md:col-span-3 flex justify-end gap-2">
                    {reviewingId === req.id ? (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Reviewing...</span>
                    ) : (
                      <>
                        <button 
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
                          onClick={() => { setReviewingId(req.id); setReviewType('approved'); setReviewComment(''); }}
                        >
                          Approve
                        </button>
                        <button 
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-md transition-all shadow-sm"
                          onClick={() => { setReviewingId(req.id); setReviewType('rejected'); setReviewComment(''); }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Review Form */}
                {reviewingId === req.id && (
                  <div className={`px-6 py-5 border-t border-b border-dashed ${reviewType === 'approved' ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                      <div className="flex-1">
                        <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${reviewType === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                          {reviewType === 'approved' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}
                        </label>
                        <input 
                          type="text" 
                          className={`w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-white ${
                            reviewType === 'approved' ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500'
                          }`}
                          placeholder={reviewType === 'approved' ? 'Add any notes for the student...' : 'Explain why this is being rejected...'}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          onClick={() => { setReviewingId(null); setReviewType(null); }}
                        >
                          Cancel
                        </button>
                        <button 
                          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${
                            reviewType === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                          }`}
                          onClick={() => submitReview(req.id)}
                        >
                          Confirm {reviewType === 'approved' ? 'Approval' : 'Rejection'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

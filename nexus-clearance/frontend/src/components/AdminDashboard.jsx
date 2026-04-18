import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Filter, Inbox, Eye, FileText, Image as ImageIcon, X } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function AdminDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewType, setReviewType] = useState(null); 
  const [reviewComment, setReviewComment] = useState('');

  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/requests`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ comment: reviewComment })
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
              <div key={req.id} className="group flex flex-col p-6 hover:bg-slate-50/50 transition-colors">
                
                {/* Row Header: Student Info & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-slate-800 text-lg">{req.studentName}</p>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-mono rounded">#{req.studentId.substring(0,8)}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Submitted on {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {reviewingId === req.id ? (
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Reviewing...</span>
                    ) : (
                      <>
                        <button 
                          className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                          onClick={() => { setReviewingId(req.id); setReviewType('approved'); setReviewComment(''); }}
                        >
                          Approve
                        </button>
                        <button 
                          className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-lg transition-all shadow-sm"
                          onClick={() => { setReviewingId(req.id); setReviewType('rejected'); setReviewComment(''); }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Approval History Trail (for HOD and Principal) */}
                {(user.role === 'hod' || user.role === 'principal') && (
                  <div className="mb-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Previous Approvals</p>
                    <div className="flex flex-wrap gap-2">
                      {req.status.lab.state === 'approved' && (
                        <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm w-full md:w-auto">
                          <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-700 leading-none mb-1">Lab Authority</p>
                            <p className="text-slate-500 text-xs italic">"{req.status.lab.comment || 'Approved without comment'}"</p>
                          </div>
                        </div>
                      )}
                      {req.status.hod.state === 'approved' && (
                        <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm w-full md:w-auto">
                          <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-700 leading-none mb-1">Head of Department</p>
                            <p className="text-slate-500 text-xs italic">"{req.status.hod.comment || 'Approved without comment'}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents Grid */}
                {req.documents && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    {[
                      { label: 'Student ID Card', doc: req.documents.idCard },
                      { label: 'Library Receipt', doc: req.documents.libraryReceipt },
                      { label: 'Lab Clearance', doc: req.documents.labClearance }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2 rounded-lg shrink-0 ${item.doc ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                            {item.doc && item.doc.fileType && item.doc.fileType.includes('pdf') ? <FileText size={18} /> : <ImageIcon size={18} />}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {item.doc ? item.doc.name : 'Missing Document'}
                            </p>
                          </div>
                        </div>
                        {item.doc && item.doc.dataUrl && (
                          <button 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => setPreviewDoc(item.doc)}
                            title="Preview Document"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Review Form */}
                {reviewingId === req.id && (
                  <div className={`mt-4 px-6 py-5 rounded-xl border ${reviewType === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} animate-[fade-in_0.2s_ease]`}>
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                      <div className="flex-1">
                        <label className={`block text-sm font-bold mb-2 ${reviewType === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                          {reviewType === 'approved' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}
                        </label>
                        <input 
                          type="text" 
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-white ${
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
                          className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          onClick={() => { setReviewingId(null); setReviewType(null); }}
                        >
                          Cancel
                        </button>
                        <button 
                          className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${
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

      {/* Admin Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{previewDoc.name}</h3>
                <p className="text-xs text-slate-500">Document Preview</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-100 flex justify-center items-center">
              {previewDoc.fileType && previewDoc.fileType.includes('pdf') ? (
                <iframe src={previewDoc.dataUrl} className="w-full h-[70vh] rounded-lg border border-slate-200 shadow-inner" title="PDF Preview" />
              ) : (
                <img src={previewDoc.dataUrl} alt="Document Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end rounded-b-2xl">
               <button onClick={() => setPreviewDoc(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

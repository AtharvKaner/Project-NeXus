import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Filter, Inbox, Eye, FileText, Image as ImageIcon, X, Table2, Download, RefreshCw, CircleDollarSign } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function AdminDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [duesLoading, setDuesLoading] = useState(false);
  const [showDuesTable, setShowDuesTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewType, setReviewType] = useState(null); 
  const [reviewComment, setReviewComment] = useState('');

  const [previewDoc, setPreviewDoc] = useState(null);

  const [isUploading, setIsUploading] = useState(false);

  const fetchDues = async () => {
    setDuesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/dues`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDues(data);
      } else {
        setError(data.message || 'Failed to fetch dues.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dues.');
    } finally {
      setDuesLoading(false);
    }
  };

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
    fetchDues();
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
        fetchDues();
      } else {
        const data = await res.json();
        alert(data.message || `Error marking as ${reviewType}`);
      }
    } catch (err) {
      alert('Network error while reviewing');
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const res = await fetch(`${API_URL}/api/admin/upload-dues`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ csvData: event.target.result })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          fetchRequests();
          fetchDues();
        } else {
          alert(data.message || 'Failed to upload CSV');
        }
      } catch (err) {
        alert('Upload failed due to network error');
      } finally {
        setIsUploading(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadCsv = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/dues/export`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to export CSV');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'dues_updated.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to export CSV');
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
  const filteredDues = dues.filter((due) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return [due.studentId, due.name, due.department, due.reason, due.status, String(due.amount)]
      .some((value) => (value || '').toString().toLowerCase().includes(query));
  });

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
          <button
            onClick={() => { setShowDuesTable(true); fetchDues(); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Table2 size={16} />
            View Dues Table
          </button>
          <button
            onClick={() => { fetchDues(); fetchRequests(); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <div className="relative">
            <input 
              type="file" 
              accept=".csv"
              id="csv-upload"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <label 
              htmlFor="csv-upload" 
              className={`px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors shadow-sm inline-block ${isUploading ? 'bg-slate-300 text-slate-500' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
            >
              {isUploading ? 'Uploading...' : 'Upload Dues (CSV)'}
            </label>
          </div>
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
                      {req.hasDues && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold uppercase tracking-wider text-[10px] rounded border border-red-200">
                          Clearance Blocked (Pending Dues)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Submitted on {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {reviewingId === req.id ? (
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Reviewing...</span>
                    ) : (
                      <>
                        <button 
                          className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm ${req.hasDues ? 'bg-slate-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                          onClick={() => { if(!req.hasDues) { setReviewingId(req.id); setReviewType('approved'); setReviewComment(''); } }}
                          disabled={req.hasDues}
                          title={req.hasDues ? "Cannot approve while student has pending dues" : ""}
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

      {/* Dues Table Modal */}
      {showDuesTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDuesTable(false)}>
          <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-3">
                  <CircleDollarSign size={14} />
                  MongoDB Dues
                </div>
                <h3 className="text-2xl font-bold text-slate-800">All Uploaded Dues</h3>
                <p className="text-sm text-slate-500 mt-1">Live dues records synced after uploads and payments.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await fetchDues();
                    setShowDuesTable(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw size={16} className={duesLoading ? 'animate-spin' : ''} />
                  Refresh Data
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition-colors"
                >
                  <Download size={16} />
                  Download CSV
                </button>
                <button onClick={() => setShowDuesTable(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 bg-white">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student, department, amount, status..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="max-h-[65vh] overflow-auto">
              {duesLoading ? (
                <div className="flex h-64 items-center justify-center text-slate-500">
                  <RefreshCw className="mr-2 animate-spin" size={18} /> Loading dues...
                </div>
              ) : filteredDues.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center text-slate-500 px-6">
                  <Inbox size={36} className="mb-3 text-slate-300" />
                  <p className="font-semibold text-slate-700">No dues found</p>
                  <p className="text-sm mt-1">Upload a CSV or process a payment to see records here.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Student ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredDues.map((due) => (
                      <tr key={`${due.studentId}-${due.department}`} className={due.status === 'paid' ? 'bg-green-50/40' : 'bg-rose-50/30'}>
                        <td className="px-6 py-4 font-mono text-sm text-slate-700">{due.studentId}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{due.name || '-'}</td>
                        <td className="px-6 py-4 text-sm capitalize text-slate-700">{due.department}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">₹{Number(due.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${due.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                            {due.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{due.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm text-slate-500">
              <p>Total records: <span className="font-semibold text-slate-700">{filteredDues.length}</span></p>
              <p>Source: MongoDB `Due` collection</p>
            </div>
          </div>
        </div>
      )}

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

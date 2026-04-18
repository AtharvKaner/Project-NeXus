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
          <h1 className="text-2xl font-bold tracking-tight text-white">Action Items</h1>
          <p className="mt-1 text-slate-400">
            Logged in as <span className="font-semibold text-slate-200">{roleDisplayNames[user.role]}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowDuesTable(true); fetchDues(); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
          >
            <Table2 size={16} />
            View Dues Table
          </button>
          <button
            onClick={() => { fetchDues(); fetchRequests(); }}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
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
              className={`inline-block cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${isUploading ? 'bg-white/10 text-slate-400' : 'bg-white/10 text-white hover:bg-white/15'}`}
            >
              {isUploading ? 'Uploading...' : 'Upload Dues (CSV)'}
            </label>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search ID..." className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 md:w-64" disabled />
          </div>
          <button className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10" title="Filter (mock)">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          <XCircle size={20} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main List Area */}
      <div className="glass-card overflow-hidden rounded-3xl border-white/10">
        {actionableRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300">
              <Inbox size={28} />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-white">Inbox Zero</h3>
            <p className="text-sm text-slate-400">There are no pending applications requiring your review.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {actionableRequests.map(req => (
              <div key={req.id} className="group flex flex-col p-6 transition-colors hover:bg-white/5">
                
                {/* Row Header: Student Info & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-white">{req.studentName}</p>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-slate-300">#{req.studentId.substring(0,8)}</span>
                      {req.hasDues && (
                        <span className="rounded border border-rose-400/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200">
                          Clearance Blocked (Pending Dues)
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">Submitted on {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {reviewingId === req.id ? (
                      <span className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-200">Reviewing...</span>
                    ) : (
                      <>
                        <button 
                          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${req.hasDues ? 'cursor-not-allowed bg-white/10 text-slate-500' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'}`}
                          onClick={() => { if(!req.hasDues) { setReviewingId(req.id); setReviewType('approved'); setReviewComment(''); } }}
                          disabled={req.hasDues}
                          title={req.hasDues ? "Cannot approve while student has pending dues" : ""}
                        >
                          Approve
                        </button>
                        <button 
                          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition-all hover:bg-rose-500/10 hover:text-rose-200 hover:border-rose-400/20"
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Previous Approvals</p>
                    <div className="flex flex-wrap gap-2">
                      {req.status.lab.state === 'approved' && (
                        <div className="flex w-full items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm md:w-auto">
                          <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                          <div>
                            <p className="mb-1 leading-none font-semibold text-white">Lab Authority</p>
                            <p className="text-xs italic text-slate-400">"{req.status.lab.comment || 'Approved without comment'}"</p>
                          </div>
                        </div>
                      )}
                      {req.status.hod.state === 'approved' && (
                        <div className="flex w-full items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm md:w-auto">
                          <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                          <div>
                            <p className="mb-1 leading-none font-semibold text-white">Head of Department</p>
                            <p className="text-xs italic text-slate-400">"{req.status.hod.comment || 'Approved without comment'}"</p>
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
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`shrink-0 rounded-lg p-2 ${item.doc ? 'bg-cyan-500/10 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
                            {item.doc && item.doc.fileType && item.doc.fileType.includes('pdf') ? <FileText size={18} /> : <ImageIcon size={18} />}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                            <p className="truncate text-sm font-medium text-white">
                              {item.doc ? item.doc.name : 'Missing Document'}
                            </p>
                          </div>
                        </div>
                        {item.doc && item.doc.dataUrl && (
                          <button 
                            className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-cyan-200"
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
                  <div className={`mt-4 rounded-2xl border px-6 py-5 ${reviewType === 'approved' ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-rose-400/20 bg-rose-500/10'} animate-[fade-in_0.2s_ease]`}>
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                      <div className="flex-1">
                        <label className={`mb-2 block text-sm font-bold ${reviewType === 'approved' ? 'text-emerald-100' : 'text-rose-100'}`}>
                          {reviewType === 'approved' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}
                        </label>
                        <input 
                          type="text" 
                          className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                            reviewType === 'approved' ? 'border-emerald-400/20 focus:ring-emerald-400/30' : 'border-rose-400/20 focus:ring-rose-400/30'
                          }`}
                          placeholder={reviewType === 'approved' ? 'Add any notes for the student...' : 'Explain why this is being rejected...'}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl" onClick={() => setShowDuesTable(false)}>
            <div className="glass-card w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5 bg-white/5">
              <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                  <CircleDollarSign size={14} />
                  MongoDB Dues
                </div>
                  <h3 className="text-2xl font-bold text-white">All Uploaded Dues</h3>
                  <p className="mt-1 text-sm text-slate-400">Live dues records synced after uploads and payments.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await fetchDues();
                    setShowDuesTable(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
                >
                  <RefreshCw size={16} className={duesLoading ? 'animate-spin' : ''} />
                  Refresh Data
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
                >
                  <Download size={16} />
                  Download CSV
                </button>
                <button onClick={() => setShowDuesTable(false)} className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student, department, amount, status..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div className="max-h-[65vh] overflow-auto">
              {duesLoading ? (
                <div className="flex h-64 items-center justify-center text-slate-400">
                  <RefreshCw className="mr-2 animate-spin" size={18} /> Loading dues...
                </div>
              ) : filteredDues.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center px-6 text-center text-slate-400">
                  <Inbox size={36} className="mb-3 text-slate-500" />
                  <p className="font-semibold text-white">No dues found</p>
                  <p className="text-sm mt-1">Upload a CSV or process a payment to see records here.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-xl">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Student ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-transparent">
                    {filteredDues.map((due) => (
                      <tr key={`${due.studentId}-${due.department}`} className={due.status === 'paid' ? 'bg-emerald-500/5' : 'bg-rose-500/5'}>
                        <td className="px-6 py-4 font-mono text-sm text-slate-300">{due.studentId}</td>
                        <td className="px-6 py-4 text-sm font-medium text-white">{due.name || '-'}</td>
                        <td className="px-6 py-4 text-sm capitalize text-slate-300">{due.department}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-white">₹{Number(due.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${due.status === 'paid' ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border border-rose-400/20 bg-rose-500/10 text-rose-200'}`}>
                            {due.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{due.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-400">
              <p>Total records: <span className="font-semibold text-white">{filteredDues.length}</span></p>
              <p>Source: MongoDB `Due` collection</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl" onClick={() => setPreviewDoc(null)}>
          <div className="glass-card flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 p-4 bg-white/5">
              <div>
                <h3 className="text-lg font-bold text-white">{previewDoc.name}</h3>
                <p className="text-xs text-slate-400">Document Preview</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-950 p-4">
              {previewDoc.fileType && previewDoc.fileType.includes('pdf') ? (
                <iframe src={previewDoc.dataUrl} className="h-[70vh] w-full rounded-2xl border border-white/10 shadow-inner" title="PDF Preview" />
              ) : (
                <img src={previewDoc.dataUrl} alt="Document Preview" className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-md" />
              )}
            </div>
            <div className="flex justify-end border-t border-white/10 bg-white/5 p-4">
               <button onClick={() => setPreviewDoc(null)} className="rounded-xl bg-cyan-500 px-6 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-400">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

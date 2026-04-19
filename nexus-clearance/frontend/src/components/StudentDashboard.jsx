import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatusTracker from './StatusTracker';
import Certificate from './Certificate';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Eye, ArrowRight, Image as ImageIcon, X, Calendar, Activity } from 'lucide-react';

const API_URL = 'http://localhost:3000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Sey90jixlpZZSl';

function StudentDashboard({ user }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewCert, setViewCert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dues, setDues] = useState([]);
  const [hasUnpaidDues, setHasUnpaidDues] = useState(false);
  const [processingDueKey, setProcessingDueKey] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  // Document upload states
  const [documents, setDocuments] = useState({
    idCard: null,
    libraryReceipt: null,
    labClearance: null
  });
  const [docErrors, setDocErrors] = useState({
    idCard: '',
    libraryReceipt: '',
    labClearance: ''
  });
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchRequest();
    fetchDues();
  }, [user]);

  const dueKey = (due) => `${due.studentId || user.identifier}-${due.department || ''}`.toLowerCase();

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const fetchDues = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dues/${user.identifier}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setDues(data);
      setHasUnpaidDues(data.some(d => d.status === 'unpaid'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequest = async () => {
    try {
      const res = await fetch(`${API_URL}/api/requests`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
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

  const handleFileUpload = (docType, file) => {
    // Validation
    setDocErrors(prev => ({ ...prev, [docType]: '' }));
    
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setDocErrors(prev => ({ ...prev, [docType]: 'Invalid file type. Only PDF, JPG, PNG allowed.' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setDocErrors(prev => ({ ...prev, [docType]: 'File too large. Maximum size is 2MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          name: file.name,
          fileType: file.type,
          dataUrl: e.target.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (docType) => {
    setDocuments(prev => ({ ...prev, [docType]: null }));
    setDocErrors(prev => ({ ...prev, [docType]: '' }));
  };

  const verifyPayment = async (response, due) => {
    const res = await fetch(`${API_URL}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        studentId: user.identifier,
        department: due.department
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Payment verification failed');
    }

    setPaymentReceipt({
      transactionId: data.transactionId,
      department: due.department,
      amount: due.amount,
      fallbackUsed: data.fallbackUsed || false
    });
    setPaymentMessage(data.message || 'Payment Successful');
    await fetchDues();
  };

  const handlePayNow = async (due) => {
    setError('');
    setPaymentMessage('');
    setPaymentReceipt(null);

    const key = dueKey(due);
    setProcessingDueKey(key);

    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error('Unable to load Razorpay checkout');
      }

      const orderRes = await fetch(`${API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          studentId: user.identifier,
          department: due.department,
          amount: due.amount
        })
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Nexus Automated Clearance System',
        description: `${due.department} dues payment`,
        prefill: {
          name: user.username || '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#2563eb'
        },
        handler: async (response) => {
          try {
            await verifyPayment(response, due);
          } catch (verificationError) {
            setError(verificationError.message);
          } finally {
            setProcessingDueKey('');
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingDueKey('');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        const message = response?.error?.description || 'Payment failed';
        setError(message);
        setProcessingDueKey('');
      });
      razorpay.open();
    } catch (paymentError) {
      setError(paymentError.message || 'Payment could not be started');
      setProcessingDueKey('');
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/requests/${request.id}/certificate/pdf`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to download certificate');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `no-dues-certificate-${user.identifier}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || 'Failed to download certificate');
    }
  };

  const handleDownloadLocker = () => {
    const studentId = encodeURIComponent(user.identifier || '');
    window.open(`${API_URL}/api/download-locker/${studentId}`, '_blank');
  };

  const isFormComplete = documents.idCard && documents.libraryReceipt && documents.labClearance && !hasUnpaidDues;

  const handleSubmitRequest = async () => {
    if (!isFormComplete) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ documents })
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
  };

  const handleResubmitRequest = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        documents: {
          idCard: documents.idCard || request.documents?.idCard,
          libraryReceipt: documents.libraryReceipt || request.documents?.libraryReceipt,
          labClearance: documents.labClearance || request.documents?.labClearance
        }
      };

      const res = await fetch(`${API_URL}/api/requests/${request._id || request.id}/resubmit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setRequest(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to resubmit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const DocumentCard = ({ title, type, doc, error }) => (
    <div className={`rounded-xl border p-5 transition-all ${doc ? 'border-emerald-500/30 bg-emerald-500/10' : error ? 'border-rose-500/30 bg-rose-500/10' : 'border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-white text-sm">{title}</h4>
        {doc && <CheckCircle size={16} className="text-emerald-300" />}
      </div>
      
      {!doc ? (
        <div className="relative">
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload(type, e.target.files[0])}
            title={`Upload ${title}`}
          />
          <div className="flex flex-col items-center justify-center py-4 text-slate-300">
            <UploadCloud size={24} className="mb-2 text-cyan-300" />
            <span className="text-xs font-medium">Click or drag to upload</span>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {doc.fileType && doc.fileType.includes('pdf') ? <FileText size={18} className="shrink-0 text-cyan-300" /> : <ImageIcon size={18} className="shrink-0 text-blue-300" />}
            <span className="truncate text-xs font-medium text-slate-100">{doc.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => setPreviewDoc(doc)} title="Preview">
              <Eye size={14} />
            </button>
            <button className="rounded p-1 text-slate-300 hover:bg-rose-500/10 hover:text-rose-200" onClick={() => removeDocument(type)} title="Remove">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-[10px] font-medium text-rose-300">{error}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center px-6 py-16 rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-3xl">
        <div className="flex items-center gap-3 text-slate-200">
          <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400"></div>
          <div className="h-3 w-3 animate-pulse rounded-full bg-blue-400 [animation-delay:150ms]"></div>
          <div className="h-3 w-3 animate-pulse rounded-full bg-indigo-400 [animation-delay:300ms]"></div>
          <span className="ml-2 text-sm font-medium text-slate-300">Loading clearance workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-3xl overflow-hidden flex flex-col">
        
        {/* Header Area */}
        <div className="border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Clearance Status</h2>
            <p className="text-sm text-slate-300 mt-0.5">Track your administrative clearance progress</p>
          </div>
          {request && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              request.finalStatus === 'approved' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' :
              request.finalStatus === 'rejected' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' :
              'border-amber-400/30 bg-amber-500/10 text-amber-200'
            }`}>
              {request.finalStatus}
            </div>
          )}
        </div>

        <div className="space-y-8 p-6 md:p-8">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {paymentMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{paymentMessage}</p>
                {paymentReceipt && (
                  <p className="mt-1 text-xs text-emerald-100/90">
                    Receipt {paymentReceipt.transactionId} for {paymentReceipt.department} dues of ₹{paymentReceipt.amount}
                    {paymentReceipt.fallbackUsed ? ' (demo fallback used)' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dues Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Pending Institutional Dues</h3>
            {dues.length === 0 ? (
               <div className="relative overflow-hidden flex items-center gap-4 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 to-emerald-900/10 p-5 shadow-[0_0_30px_rgba(52,211,153,0.1)] backdrop-blur-md">
                 <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl"></div>
                 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                   <CheckCircle size={22} />
                 </div>
                 <div className="relative z-10">
                   <p className="text-sm font-bold text-emerald-100 tracking-wide uppercase">Financial Clearance Verified</p>
                   <p className="text-xs text-emerald-200/80 mt-0.5 font-medium">No pending dues found. You are cleared financially.</p>
                 </div>
               </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {dues.map((d, index) => {
                    const key = dueKey(d);
                    const isProcessing = processingDueKey === key;

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 shadow-sm"
                      >
                        <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${d.status === 'unpaid' ? 'bg-[radial-gradient(circle_at_right,rgba(244,63,94,0.1),transparent_40%)]' : 'bg-[radial-gradient(circle_at_right,rgba(34,197,94,0.1),transparent_40%)]'}`} />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-cyan-300 shadow-md shadow-cyan-950/20 shrink-0">
                              {d.department?.includes('lab') ? <FileText size={18} /> : d.department?.includes('hostel') ? <ImageIcon size={18} /> : <AlertCircle size={18} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold capitalize text-white">{d.department} Dues</p>
                                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${d.status === 'unpaid' ? 'border-rose-400/20 bg-rose-500/10 text-rose-200' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'}`}>
                                  {d.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{d.reason || 'Institutional clearance fee'}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-5 sm:ml-auto w-full sm:w-auto mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                            <div className="text-left sm:text-right">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Amount</div>
                              <div className="text-lg font-black text-white leading-none mt-0.5">₹{d.amount}</div>
                            </div>
                            
                            {d.status === 'unpaid' ? (
                              <button
                                className="glow-button px-4 py-2 text-xs shadow-md transition-transform hover:scale-[1.02] whitespace-nowrap"
                                onClick={() => handlePayNow(d)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? 'Processing...' : 'Pay Now'}
                              </button>
                            ) : (
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 whitespace-nowrap">
                                <CheckCircle size={14} className="inline mr-1 mb-0.5" /> Paid
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {hasUnpaidDues && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm font-semibold text-rose-200 mt-4">
                    <AlertCircle size={18} /> Clearance blocked due to pending unpaid dues.
                  </div>
                )}
                {!hasUnpaidDues && dues.length > 0 && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200 mt-4">
                    <CheckCircle size={18} /> All listed dues have been paid.
                  </div>
                )}
              </>
            )}
          </div>

          {!request ? (
            /* EMPTY STATE: ONBOARDING / UPLOAD */
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white mb-2">Document Verification</h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  Please upload the required verification documents to initiate your clearance workflow. All documents must be clearly legible. Maximum file size is 2MB (PDF, JPG, PNG).
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DocumentCard title="Student ID Card" type="idCard" doc={documents.idCard} error={docErrors.idCard} />
                <DocumentCard title="Library Due Receipt" type="libraryReceipt" doc={documents.libraryReceipt} error={docErrors.libraryReceipt} />
                <DocumentCard title="Lab Clearance Form" type="labClearance" doc={documents.labClearance} error={docErrors.labClearance} />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-between gap-4 p-5 sm:flex-row mt-2">
                <div className="text-sm text-slate-300">
                  <span className="font-semibold text-white">Status:</span> {isFormComplete ? <span className="font-medium text-emerald-300">Ready for Review</span> : hasUnpaidDues ? <span className="font-medium text-rose-300">Blocked by Unpaid Dues</span> : 'Waiting for documents...'}
                </div>
                <button 
                  className={`glow-button py-2.5 px-6 shadow-md transition-transform hover:scale-[1.02] ${isFormComplete ? '' : 'cursor-not-allowed opacity-50 grayscale hover:scale-100'}`} 
                  onClick={handleSubmitRequest}
                  disabled={!isFormComplete || isSubmitting || hasUnpaidDues}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  {!isSubmitting && <ArrowRight size={18} className="inline ml-2" />}
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE STATE: TRACKER */
            <div>
              <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90 mb-10 flex flex-col justify-between gap-5 p-6 md:flex-row md:items-center shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col gap-1.5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                    <FileText size={12} /> Application ID
                  </p>
                  <p className="font-mono text-lg font-black tracking-wider text-white">
                    #{request.id.toString().substring(0,8)}
                  </p>
                </div>
                
                <div className="hidden h-12 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent md:block"></div>
                
                <div className="relative z-10 flex flex-col gap-1.5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <Calendar size={12} /> Submitted On
                  </p>
                  <p className="text-base font-semibold text-white tracking-wide">
                    {new Date(request.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                
                <div className="hidden h-12 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent md:block"></div>
                
                <div className="relative z-10 flex flex-col gap-1.5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <Activity size={12} /> Current Stage
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    <span className="text-xs font-bold text-cyan-100 uppercase tracking-wide">
                      {request.status.lab.state === 'pending' ? 'Lab Clearance' : 
                       request.status.hod.state === 'pending' ? 'HOD Review' : 
                       request.status.principal.state === 'pending' ? 'Principal Review' : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>
              
              <StatusTracker status={request.status} />

              {request.finalStatus === 'rejected' && (
                 <div className="mt-12 flex items-start gap-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-5">
                   <AlertCircle size={24} className="mt-0.5 shrink-0 text-rose-300" />
                   <div>
                     <h4 className="mb-1 font-bold text-rose-100">Action Required</h4>
                     <p className="m-0 text-sm leading-relaxed text-rose-200 mb-4">Your clearance request has been halted. Please resolve the issues noted in the timeline above and contact the respective department administration to proceed.</p>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                       <DocumentCard title="Student ID Card" type="idCard" doc={documents.idCard || request.documents?.idCard} error={docErrors.idCard} />
                       <DocumentCard title="Library Receipt" type="libraryReceipt" doc={documents.libraryReceipt || request.documents?.libraryReceipt} error={docErrors.libraryReceipt} />
                       <DocumentCard title="Lab Clearance" type="labClearance" doc={documents.labClearance || request.documents?.labClearance} error={docErrors.labClearance} />
                     </div>
                     <button
                       className="glow-button px-5 py-2 text-sm shadow-md transition-transform hover:scale-[1.02]"
                       onClick={handleResubmitRequest}
                       disabled={isSubmitting}
                     >
                       {isSubmitting ? 'Resubmitting...' : 'Upload Fixes & Re-Submit'}
                     </button>
                   </div>
                 </div>
              )}
              
              {request.finalStatus === 'approved' && (
                <div className="mt-12 border-t border-white/10 pt-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-white">No Dues Certificate Ready</h3>
                  <p className="mx-auto mb-6 max-w-sm text-sm text-slate-300">Your clearance process is complete. View the certificate or download the official PDF signed by the principal.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button 
                      className="rounded-lg bg-white/10 border border-white/20 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                      onClick={() => setViewCert(!viewCert)}
                    >
                      <Eye size={18} className="inline mr-2" />
                      {viewCert ? 'Hide Certificate' : 'View Certificate'}
                    </button>
                    <button
                      className="glow-button px-6 py-2.5 text-sm shadow-md transition-transform hover:scale-[1.02]"
                      onClick={handleDownloadCertificate}
                    >
                      Download PDF
                    </button>
                    <button
                      className="glow-button px-6 py-2.5 text-sm shadow-md transition-transform hover:scale-[1.02]"
                      onClick={handleDownloadLocker}
                    >
                      Download Locker
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewCert && request && request.finalStatus === 'approved' && (
        <div className="mt-8">
          <Certificate request={request} dues={dues} />
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md" onClick={() => setPreviewDoc(null)}>
          <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-bold text-white">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-950/50 flex justify-center items-center">
              {previewDoc.fileType && previewDoc.fileType.includes('pdf') ? (
                <iframe src={previewDoc.dataUrl} className="w-full h-[70vh] rounded-xl border border-white/10 bg-white" title="PDF Preview" />
              ) : (
                <img src={previewDoc.dataUrl} alt="Document Preview" className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-white/10" />
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default StudentDashboard;

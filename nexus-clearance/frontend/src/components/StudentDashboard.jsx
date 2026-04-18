import { useState, useEffect } from 'react';
import StatusTracker from './StatusTracker';
import Certificate from './Certificate';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Eye, ArrowRight, Image as ImageIcon, X } from 'lucide-react';

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

  const DocumentCard = ({ title, type, doc, error }) => (
    <div className={`p-4 rounded-xl border-2 transition-all ${doc ? 'border-green-200 bg-green-50/30' : error ? 'border-red-300 bg-red-50/50' : 'border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        {doc && <CheckCircle size={16} className="text-green-500" />}
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
          <div className="flex flex-col items-center justify-center py-4 text-slate-400">
            <UploadCloud size={24} className="mb-2" />
            <span className="text-xs font-medium">Click or drag to upload</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-green-100 shadow-sm mt-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {doc.fileType && doc.fileType.includes('pdf') ? <FileText size={18} className="text-red-500 shrink-0" /> : <ImageIcon size={18} className="text-blue-500 shrink-0" />}
            <span className="text-xs font-medium text-slate-700 truncate">{doc.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-1 hover:bg-slate-100 rounded text-slate-500" onClick={() => setPreviewDoc(doc)} title="Preview">
              <Eye size={14} />
            </button>
            <button className="p-1 hover:bg-red-50 rounded text-slate-500 hover:text-red-600" onClick={() => removeDocument(type)} title="Remove">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-[10px] text-red-600 mt-2 font-medium">{error}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_0.5s_ease] w-full max-w-4xl mx-auto">
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

          {paymentMessage && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm border border-green-200 flex items-start gap-3">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{paymentMessage}</p>
                {paymentReceipt && (
                  <p className="mt-1 text-xs text-green-700/90">
                    Receipt {paymentReceipt.transactionId} for {paymentReceipt.department} dues of ₹{paymentReceipt.amount}
                    {paymentReceipt.fallbackUsed ? ' (demo fallback used)' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dues Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Pending Institutional Dues</h3>
            {dues.length === 0 ? (
               <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-200 flex items-center gap-3">
                 <CheckCircle size={20} className="shrink-0" />
                 <p className="font-semibold">No pending dues found. You are cleared financially.</p>
               </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_auto] gap-4 px-4 py-3 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <div>Department</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div className="text-right">Action</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {dues.map((d) => {
                      const key = dueKey(d);
                      const isProcessing = processingDueKey === key;

                      return (
                        <div key={key} className={`grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-center ${d.status === 'unpaid' ? 'bg-red-50/40' : 'bg-green-50/30'}`}>
                          <div>
                            <p className="font-bold text-slate-800 capitalize">{d.department}</p>
                            <p className="text-xs text-slate-500 mt-1">{d.reason || 'No reason provided'}</p>
                          </div>
                          <div className="font-bold text-slate-800">₹{d.amount}</div>
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded inline-block ${d.status === 'unpaid' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {d.status}
                            </span>
                          </div>
                          <div className="md:text-right">
                            {d.status === 'unpaid' ? (
                              <button
                                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                onClick={() => handlePayNow(d)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? 'Processing...' : 'Pay Now'}
                              </button>
                            ) : (
                              <span className="text-xs font-medium text-green-700">Paid</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {hasUnpaidDues && (
                  <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                    <AlertCircle size={18} /> Clearance blocked due to pending unpaid dues.
                  </div>
                )}
                {!hasUnpaidDues && dues.length > 0 && (
                   <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 flex items-center justify-center gap-2 font-semibold">
                     <CheckCircle size={18} /> All listed dues have been paid.
                   </div>
                )}
              </div>
            )}
          </div>

          {!request ? (
            /* EMPTY STATE: ONBOARDING / UPLOAD */
            <div className="max-w-3xl mx-auto">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Document Verification</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Please upload the required verification documents to initiate your clearance workflow. All documents must be clearly legible. Maximum file size is 2MB (PDF, JPG, PNG).
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DocumentCard title="Student ID Card" type="idCard" doc={documents.idCard} error={docErrors.idCard} />
                <DocumentCard title="Library Due Receipt" type="libraryReceipt" doc={documents.libraryReceipt} error={docErrors.libraryReceipt} />
                <DocumentCard title="Lab Clearance Form" type="labClearance" doc={documents.labClearance} error={docErrors.labClearance} />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">Status:</span> {isFormComplete ? <span className="text-green-600 font-medium">Ready for Review</span> : hasUnpaidDues ? <span className="text-red-600 font-medium">Blocked by Unpaid Dues</span> : 'Waiting for documents...'}
                </div>
                <button 
                  className={`btn py-2.5 px-6 rounded-xl font-semibold transition-all ${isFormComplete ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} 
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 mb-10">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Application ID</p>
                  <p className="font-mono text-sm font-medium text-slate-800">#{request.id.toString().substring(0,8)}</p>
                </div>
                <div className="hidden md:block w-px h-10 bg-slate-200"></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Submitted On</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(request.createdAt).toLocaleDateString()}</p>
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
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No Dues Certificate Ready</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Your clearance process is complete. View the certificate or download the official PDF signed by the principal.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button 
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all shadow-sm" 
                      onClick={() => setViewCert(!viewCert)}
                    >
                      <Eye size={18} />
                      {viewCert ? 'Hide Certificate' : 'View Certificate'}
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm"
                      onClick={handleDownloadCertificate}
                    >
                      Download PDF
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
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1 hover:bg-slate-100 rounded-md text-slate-500"><X size={20} /></button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50 flex justify-center items-center">
              {previewDoc.fileType && previewDoc.fileType.includes('pdf') ? (
                <iframe src={previewDoc.dataUrl} className="w-full h-[70vh] rounded border border-slate-200" title="PDF Preview" />
              ) : (
                <img src={previewDoc.dataUrl} alt="Document Preview" className="max-w-full max-h-[70vh] object-contain rounded shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;

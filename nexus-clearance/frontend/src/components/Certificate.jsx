function Certificate({ request }) {
  return (
    <div className="card mt-8 print:shadow-none print:border-none print:mt-0">
      <div className="text-center border-8 border-slate-100 p-8 md:p-16 relative overflow-hidden bg-white">
        {/* Decorative background element */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(241,245,249,0.8)_0%,rgba(241,245,249,0)_70%)] pointer-events-none"></div>
        
        <h2 className="font-serif text-3xl md:text-4xl text-blue-800 mb-6 relative z-10">Certificate of Clearance</h2>
        
        <p className="text-lg md:text-xl text-slate-600 my-8 relative z-10">
          This is to certify that
        </p>
        
        <div className="text-2xl md:text-4xl font-bold text-slate-800 border-b-2 border-slate-300 inline-block pb-2 mb-6 relative z-10">
          {request.studentName}
        </div>
        
        <p className="text-lg text-slate-600 relative z-10">
          (ID: <span className="font-mono text-slate-500">{request.studentId}</span>)<br/><br/>
          Has successfully completed all requirements and has no outstanding dues with the institution.
        </p>
        
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mt-12 text-amber-700 font-bold text-xs text-center border-4 border-dashed border-amber-500 relative z-10 shadow-sm">
          OFFICIALLY<br/>CLEARED
        </div>
        
        <div className="mt-16 flex justify-between text-slate-500 relative z-10">
          <div className="text-center">
            <div className="border-b border-slate-400 w-32 md:w-48 mx-auto mb-2"></div>
            <div className="text-sm">Date Issued</div>
            <div className="font-bold text-slate-700">{new Date().toLocaleDateString()}</div>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 w-32 md:w-48 mx-auto mb-2"></div>
            <div className="text-sm">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Certificate;

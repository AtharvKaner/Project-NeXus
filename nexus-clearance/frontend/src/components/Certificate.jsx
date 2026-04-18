function Certificate({ request, dues = [] }) {
  const departmentLabel = dues.length > 0
    ? [...new Set(dues.map((due) => due.department).filter(Boolean))].join(', ')
    : 'Institutional Clearance';
  const certificateId = `NXS-${String(request.id || request.studentId || '').slice(0, 8).toUpperCase()}`;

  return (
    <div className="card mt-8 print:shadow-none print:border-none print:mt-0">
      <div className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-14 shadow-[0_20px_60px_rgba(15,23,42,0.08)] border border-slate-200 print:shadow-none print:border-2 print:rounded-none">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,232,240,0.55),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-8 border border-slate-300 rounded-2xl print:border-slate-400" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06] select-none">
          <span className="-rotate-24 text-7xl md:text-8xl font-black tracking-[0.35em] text-slate-400">NEXUS SYSTEM</span>
        </div>

        <div className="relative z-10 text-center">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.45em] text-slate-500">Nexus Automated Clearance System</div>
          <h2 className="font-serif text-3xl md:text-5xl font-black tracking-[0.22em] text-slate-900">NO DUES CERTIFICATE</h2>
          <div className="mx-auto mt-4 h-px w-40 bg-slate-400" />

          <p className="mx-auto mt-10 max-w-3xl text-base md:text-lg leading-8 text-slate-700">
            This is to certify that the above-mentioned student <span className="font-bold text-slate-900">({request.studentName})</span> has cleared all dues and is eligible for clearance.
          </p>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50/90 p-6 text-left shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Student Name</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{request.studentName}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Student ID / Roll Number</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{request.studentIdentifier || request.studentId}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Department</div>
                <div className="mt-1 text-lg font-semibold capitalize text-slate-900">{departmentLabel}</div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="text-left text-slate-700">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Issue Date</div>
              <div className="mt-2 text-base font-semibold text-slate-900">{new Date().toLocaleDateString()}</div>
            </div>

            <div className="w-full max-w-xs text-right">
              <div className="ml-auto mb-2 h-px w-52 bg-slate-900" />
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Authorized Signature</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">B.N. Chaudhary</div>
              <div className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">Principal</div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between text-xs font-medium uppercase tracking-[0.28em] text-slate-500">
            <span>Certificate ID: {certificateId}</span>
            <span>Official Document</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Certificate;

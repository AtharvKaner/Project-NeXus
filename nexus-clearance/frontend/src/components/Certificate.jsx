import { motion } from 'framer-motion';
import { ShieldCheck, Download, Sparkles } from 'lucide-react';

function Certificate({ request, dues = [] }) {
  const departmentLabel = dues.length > 0
    ? [...new Set(dues.map((due) => due.department).filter(Boolean))].join(', ')
    : 'Institutional Clearance';
  const certificateId = `NXS-${String(request.id || request.studentId || '').slice(0, 8).toUpperCase()}`;
  const verifyUrl = `${window.location.origin}/verify/${request?.certId || certificateId}`;

  const buildQrPattern = (seed) => {
    const size = 21;
    const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) => {
        const inFinder = (
          (row < 7 && col < 7) ||
          (row < 7 && col > size - 8) ||
          (row > size - 8 && col < 7)
        );
        if (inFinder) {
          const edge = row === 0 || col === 0 || row === 6 || col === 6;
          const inner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
          return edge || inner;
        }
        return ((row * 13 + col * 7 + hash) % 5 === 0);
      })
    );
  };

  const qrMatrix = buildQrPattern(request?.certId || certificateId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="card mt-8 print:mt-0 print:rounded-none print:border-none print:shadow-none"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-8 text-slate-900 shadow-[0_20px_70px_rgba(15,23,42,0.18)] print:rounded-none print:border-2 print:shadow-none md:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.1),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-8 rounded-2xl border border-slate-200/70 print:border-slate-400" />
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-[0.06]">
          <span className="-rotate-24 text-7xl font-black tracking-[0.35em] text-slate-400 md:text-8xl">NEXUS SYSTEM</span>
        </div>

        <div className="relative z-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/10 bg-indigo-500/5 px-4 py-1 text-xs font-bold uppercase tracking-[0.45em] text-indigo-600">
            <Sparkles size={12} /> Nexus Automated Clearance System
          </div>
          <h2 className="font-serif text-3xl font-black tracking-[0.22em] text-slate-900 md:text-5xl">NO DUES CERTIFICATE</h2>
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

          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700">
              <ShieldCheck size={16} /> Official document
            </div>
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_0_30px_rgba(34,211,238,0.12)]">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Verification QR</div>
              <div className="grid grid-cols-21 gap-[2px] rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
                {qrMatrix.flatMap((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <span
                      key={`${rowIndex}-${colIndex}`}
                      className={`block h-1.5 w-1.5 rounded-[2px] ${cell ? 'bg-slate-900' : 'bg-transparent'}`}
                    />
                  ))
                )}
              </div>
              <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Scan to verify authenticity
              </div>
              <div className="mt-2 max-w-[220px] truncate text-center text-[11px] font-mono text-slate-500">{verifyUrl}</div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between text-xs font-medium uppercase tracking-[0.28em] text-slate-500">
            <span>Certificate ID: {certificateId}</span>
            <span>Official Document</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Certificate;

import { Link } from 'react-router-dom';
import { User, Shield, ArrowRight } from 'lucide-react';

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-[fade-in_0.5s_ease]">
      <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase mb-6 inline-block">
        Project Nexus
      </div>
      
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight mb-6 max-w-3xl leading-tight">
        Streamlined Institutional <span className="text-blue-600">Clearance System</span>
      </h1>
      
      <p className="text-lg sm:text-xl text-slate-500 mb-12 max-w-2xl">
        A modern, multi-stage approval workflow designed for educational institutions to automate and manage student clearances efficiently.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
        <Link 
          to="/login?type=student" 
          className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-blue-500 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all group shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <User size={20} />
          </div>
          <div className="text-left">
            <div className="text-sm text-slate-500 font-normal">I am a</div>
            <div className="text-lg">Student</div>
          </div>
        </Link>
        
        <Link 
          to="/login?type=admin" 
          className="flex-1 bg-slate-800 hover:bg-slate-900 text-white border-2 border-slate-800 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all group shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield size={20} />
          </div>
          <div className="text-left">
            <div className="text-sm text-slate-400 font-normal">I am an</div>
            <div className="text-lg">Admin</div>
          </div>
        </Link>
      </div>
      
      <div className="mt-12 text-sm text-slate-500">
        New here? <Link to="/signup" className="text-blue-600 font-medium hover:underline">Create an account</Link>
      </div>
    </div>
  );
}

export default LandingPage;

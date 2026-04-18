import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const API_URL = 'http://localhost:3000';

function Login({ setUser }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const loginType = queryParams.get('type') || 'student';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.toLowerCase().trim(), password, loginType })
      });

      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.name);
        localStorage.setItem('identifier', data.identifier);
        setUser({ token: data.token, role: data.role, username: data.name, identifier: data.identifier });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto my-auto w-full max-w-md"
    >
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-cyan-200">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="glass-panel neon-border p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-200 shadow-lg shadow-cyan-950/20">
            <ShieldCheck size={32} />
          </div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
            <Sparkles size={12} /> Secure Access
          </div>
          <h2 className="text-3xl font-black tracking-tight capitalize text-white">{loginType} Portal</h2>
          <p className="mt-2 text-sm text-slate-300">Sign in to manage your clearances</p>
        </div>
        
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            <div className="h-1.5 w-1.5 rounded-full bg-rose-400"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mb-4">
            <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-slate-200">
              {loginType === 'student' ? 'Student ID' : 'Admin ID / Email'}
            </label>
            <input 
              type="text" 
              id="identifier" 
              className="glass-input"
              placeholder={loginType === 'student' ? 'e.g. 101' : 'admin@test.com'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-200">Password</label>
            <input 
              type="password" 
              id="password" 
              className="glass-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <motion.button 
            type="submit" 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glow-button mt-2 w-full"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </motion.button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-300">
          Don't have an account? <Link to="/signup" className="font-medium text-cyan-300 hover:text-cyan-200">Sign up</Link>
        </div>
      </div>
    </motion.div>
  );
}

export default Login;

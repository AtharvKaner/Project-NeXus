import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import VerifyPage from './components/VerifyPage';
import InteractiveBackground from './components/InteractiveBackground';
import { LogOut, BookOpen } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const identifier = localStorage.getItem('identifier');
    if (token && role && username && identifier) {
      setUser({ token, role, username, identifier });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('identifier');
    setUser(null);
  };

  return (
    <Router>
      <div className="relative min-h-screen overflow-hidden flex flex-col text-slate-100">
        <InteractiveBackground />
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
          <div className="aurora-blob absolute -top-28 left-[-7rem] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="aurora-blob absolute top-20 right-[-6rem] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl [animation-delay:2s]" />
          <div className="aurora-blob absolute bottom-[-5rem] left-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl [animation-delay:4s]" />
          <div className="sparkle-layer" />
          <div className="sparkle-layer-alt" />
        </div>

        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl"
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-2 text-orange-400 shadow-lg shadow-orange-950/20">
                <BookOpen size={22} />
              </div>
              <span className="text-lg font-semibold tracking-wide text-white">Project Nexus</span>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <span className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200 sm:block">
                  {user.username} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition-all duration-300 hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </motion.nav>

        <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup setUser={setUser} />} />
            <Route path="/verify/:certId" element={<VerifyPage />} />
            
            <Route path="/dashboard" element={
              !user ? <Navigate to="/" /> :
              user.role === 'student' ? <StudentDashboard user={user} /> :
              <AdminDashboard user={user} />
            } />
          </Routes>
        </main>
        
        <motion.footer
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 mt-auto border-t border-white/10 bg-slate-950/55 py-6 backdrop-blur-2xl"
        >
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Project Nexus. All rights reserved.
          </div>
        </motion.footer>
      </div>
    </Router>
  );
}

export default App;

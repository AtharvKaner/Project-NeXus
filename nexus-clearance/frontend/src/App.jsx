import { useState } from 'react';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { LogOut, GraduationCap } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null); // { role: 'student', username: 'student' }

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      <nav className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
          <GraduationCap size={28} />
          <span>Nexus Clearance</span>
        </div>
        {user && (
          <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
            <span className="capitalize bg-slate-100 px-3 py-1 rounded-full text-slate-600">
              Role: {user.role}
            </span>
            <button 
              className="btn btn-outline py-1.5 px-3 text-sm" 
              onClick={handleLogout}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </nav>

      <main className="w-full max-w-4xl mx-auto p-6 flex-1 flex flex-col justify-center">
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : user.role === 'student' ? (
          <StudentDashboard user={user} />
        ) : (
          <AdminDashboard user={user} />
        )}
      </main>
    </>
  );
}

export default App;

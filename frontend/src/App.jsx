import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Login from './components/Login';
import Signup from './components/Signup';
import Assessment from './components/Assessment';
import { BrainCircuit, LayoutDashboard, ChevronLeft } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) return null; // Let landing page be clean, or we can show a minimal nav

  return (
    <header className="border-b border-slate-800 bg-[#05050a]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-cyan-500/30 transition-all">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-gradient">
            DSA Tutor AI
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {location.pathname === '/learn' && (
            <Link to="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          )}
          {location.pathname === '/dashboard' && (
            <div className="text-sm font-medium px-4 py-1.5 bg-[#121221] rounded-full border border-violet-500/20 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.1)]">
              Pro Mode Active
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function LearnLayout() {
  return (
    <div className="h-[calc(100vh-6rem)] min-h-[600px] w-full max-w-5xl mx-auto relative mt-4">
      <Chat />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans selection:bg-violet-500/30">
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full p-4 md:p-6 z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learn" element={<LearnLayout />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

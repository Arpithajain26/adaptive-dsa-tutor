import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Assessment from './components/Assessment';
import Dashboard from './components/Dashboard';
import LearnSession from './components/LearnSession';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#05050a] text-white font-sans selection:bg-violet-500/30 selection:text-white flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learn" element={<LearnSession />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

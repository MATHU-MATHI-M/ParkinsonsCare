import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import DoctorDashboard from './pages/DoctorDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import Questionnaire from './pages/Questionnaire';
import GamesHub from './pages/GamesHub';
import MemoryGame from './pages/MemoryGame';
import ReactionGame from './pages/ReactionGame';
import SpiralDrawing from './pages/SpiralDrawing';
import WordRecall from './pages/WordRecall';
import NumberSpan from './pages/NumberSpan';
import DualTask from './pages/DualTask';
import MedicationManager from './pages/MedicationManager';
import MotionCoach from './pages/MotionCoach';
import Forecast from './pages/Forecast';
import Timeline from './pages/Timeline';
import Analytics from './pages/Analytics';
import Chatbot from './pages/Chatbot';

// Route protection wrapper
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" />;
};

// Select dashboard based on user role
const DashboardSelector = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  
  if (user.role === 'doctor') return <DoctorDashboard />;
  if (user.role === 'caregiver') return <CaregiverDashboard />;
  return <Dashboard />;
};

const App = () => {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
        {token && <Navbar />}
        {token && <ChatWidget />}
        
        <main className="flex-grow">
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard (role-based) */}
            <Route path="/" element={<PrivateRoute><DashboardSelector /></PrivateRoute>} />

            {/* Settings */}
            <Route path="/settings" element={<PrivateRoute><ProfileSettings /></PrivateRoute>} />

            {/* Clinical Assessments */}
            <Route path="/questionnaire" element={<PrivateRoute><Questionnaire /></PrivateRoute>} />

            {/* Cognitive Games Hub */}
            <Route path="/games" element={<PrivateRoute><GamesHub /></PrivateRoute>} />
            <Route path="/game/memory" element={<PrivateRoute><MemoryGame /></PrivateRoute>} />
            <Route path="/game/reaction" element={<PrivateRoute><ReactionGame /></PrivateRoute>} />
            <Route path="/game/spiral" element={<PrivateRoute><SpiralDrawing /></PrivateRoute>} />
            <Route path="/game/word-recall" element={<PrivateRoute><WordRecall /></PrivateRoute>} />
            <Route path="/game/number-span" element={<PrivateRoute><NumberSpan /></PrivateRoute>} />
            <Route path="/game/dual-task" element={<PrivateRoute><DualTask /></PrivateRoute>} />

            {/* Medication Management */}
            <Route path="/medications" element={<PrivateRoute><MedicationManager /></PrivateRoute>} />

            {/* AI Motion Coach */}
            <Route path="/motion-coach" element={<PrivateRoute><MotionCoach /></PrivateRoute>} />

            {/* Advanced Analytics & Forecast */}
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/forecast" element={<PrivateRoute><Forecast /></PrivateRoute>} />

            {/* Digital Health Timeline */}
            <Route path="/timeline" element={<PrivateRoute><Timeline /></PrivateRoute>} />

            {/* AI Assistant */}
            <Route path="/chatbot" element={<PrivateRoute><Chatbot /></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;

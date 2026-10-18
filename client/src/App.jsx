import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ScenarioList from './components/scenario/ScenarioList';
import ScenarioWizard from './components/scenario/ScenarioWizard';
import DecisionDashboard from './components/dashboard/DecisionDashboard';
import DigitalTwinWizard from './components/profile/DigitalTwinWizard';
import DecisionHistoryView from './components/history/DecisionHistoryView';
import MarketIntelligenceView from './components/market/MarketIntelligenceView';
import ChatbotWidget from './components/common/ChatbotWidget';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors duration-200 relative">
          <Navbar />
          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<ScenarioList />} />
                <Route path="/profile" element={<DigitalTwinWizard />} />
                <Route path="/scenarios/new" element={<ScenarioWizard />} />
                <Route path="/scenarios/:id" element={<DecisionDashboard />} />
                <Route path="/market" element={<MarketIntelligenceView />} />
                <Route path="/history" element={<DecisionHistoryView />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        {/* Global Floating AI Decision Co-Pilot */}
        <ChatbotWidget />
      </div>
    </AuthProvider>
    </ThemeProvider>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, UserCheck, AlertCircle, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, isTwinComplete, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              DecisionTwin <span className="text-xs px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 font-mono border border-brand-500/20">AI</span>
            </span>
            <p className="text-[10px] text-slate-400 hidden sm:block">Intelligent Decision Simulation & Risk Analytics</p>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            {/* Digital Twin completeness indicator */}
            <Link
              to="/profile"
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                isTwinComplete
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {isTwinComplete ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="font-medium">Digital Twin: Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                  <span className="font-medium">Setup Digital Twin</span>
                </>
              )}
            </Link>

            <div className="h-5 w-px bg-slate-800" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden md:inline font-medium">{user.fullName}</span>
              </div>

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

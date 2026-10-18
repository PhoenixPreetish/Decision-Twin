import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogOut, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              DecisionTwin
            </span>
            <p className="text-[10px] text-slate-400 hidden sm:block">Intelligent Decision Simulation & Risk Analytics</p>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          {user && (
            <div className="flex md:hidden items-center gap-2">
              <Link
                to="/profile"
                title="My Profile & Digital Twin"
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-brand-500/50 flex items-center justify-center text-slate-300 transition-colors"
              >
                <User className="w-4 h-4" />
              </Link>

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

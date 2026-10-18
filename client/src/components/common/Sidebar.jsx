import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, PlusCircle, UserCog, History, Globe, User, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/scenarios/new', label: 'New Scenario', icon: PlusCircle },
    { to: '/profile', label: 'My Digital Twin', icon: UserCog },
    { to: '/market', label: 'Market Intelligence', icon: Globe },
    { to: '/history', label: 'Decision History', icon: History }
  ];

  return (
    <aside className="w-64 bg-slate-900/50 border-r border-slate-800 p-4 hidden md:flex flex-col justify-between shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Decision Engine
        </div>
        <nav className="space-y-1.5">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Log Out placed at Bottom-Left of UI */}
      {user && (
        <div className="pt-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60 transition-all">
            <Link
              to="/profile"
              title="My Profile & Digital Twin"
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 group-hover:border-brand-500/50 flex items-center justify-center text-slate-300 transition-colors shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-white block truncate group-hover:text-brand-300 transition-colors">
                  {user.fullName}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  View Profile
                </span>
              </div>
            </Link>

            <button
              onClick={logout}
              title="Log Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

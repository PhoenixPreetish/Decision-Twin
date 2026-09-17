import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, UserCog, History, SlidersHorizontal } from 'lucide-react';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/scenarios/new', label: 'New Scenario', icon: PlusCircle },
    { to: '/profile', label: 'My Digital Twin', icon: UserCog },
    { to: '/history', label: 'Decision History', icon: History }
  ];

  return (
    <aside className="w-64 bg-slate-900/50 border-r border-slate-800 p-4 hidden md:flex flex-col justify-between shrink-0">
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

      <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-400" />
          <span>Simulation Engine</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Monte Carlo (10k trials) with stochastic percentile bands & XAI rationale.
        </p>
      </div>
    </aside>
  );
}

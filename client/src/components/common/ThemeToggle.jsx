import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
      className="relative flex items-center justify-between w-14 h-8 p-1 rounded-full bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/50"
    >
      {/* Sun icon on left */}
      <Sun className={`w-3.5 h-3.5 text-amber-400 ml-1 transition-opacity ${isDark ? 'opacity-40' : 'opacity-100'}`} />
      
      {/* Moon icon on right */}
      <Moon className={`w-3.5 h-3.5 text-indigo-400 mr-1 transition-opacity ${isDark ? 'opacity-100' : 'opacity-40'}`} />

      {/* Sliding thumb */}
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-tr from-brand-500 to-emerald-400 shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-slate-950 stroke-[2.5]" />
        ) : (
          <Sun className="w-3 h-3 text-slate-950 stroke-[2.5]" />
        )}
      </span>
    </button>
  );
}

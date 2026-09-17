import React from 'react';

export default function ScoreGauge({ value = 0, label = 'Decision Score', size = 'md' }) {
  const radius = size === 'lg' ? 44 : 32;
  const strokeWidth = size === 'lg' ? 8 : 6;
  const normalizedValue = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  let color = '#22c55e'; // green
  if (normalizedValue < 50) color = '#f43f5e'; // red
  else if (normalizedValue < 75) color = '#eab308'; // yellow

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          className={size === 'lg' ? 'w-28 h-28 transform -rotate-90' : 'w-20 h-20 transform -rotate-90'}
        >
          <circle
            cx={size === 'lg' ? 56 : 40}
            cy={size === 'lg' ? 56 : 40}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size === 'lg' ? 56 : 40}
            cy={size === 'lg' ? 56 : 40}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className={`absolute font-bold text-white ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
          {normalizedValue}
        </span>
      </div>
      {label && <span className="text-xs text-slate-400 mt-2 font-medium">{label}</span>}
    </div>
  );
}

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      className="relative w-full flex items-center justify-center p-3 rounded-lg transition-all duration-300 text-brand-text-secondary hover:bg-brand-surface-hover hover:text-brand-text group overflow-hidden"
    >
      {/* Background gradient animation */}
      <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
        isDark 
          ? 'from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100' 
          : 'from-yellow-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100'
      }`}></div>
      
      {/* Icon container with rotation */}
      <div className="relative z-10 transition-transform duration-500 group-hover:rotate-180">
        {isDark ? (
          <MoonIcon className="w-6 h-6" />
        ) : (
          <SunIcon className="w-6 h-6" />
        )}
      </div>
      
      {/* Label */}
      <span className="relative z-10 text-xs mt-1 font-medium">
        {isDark ? 'Oscuro' : 'Claro'}
      </span>
    </button>
  );
};

export default ThemeToggle;

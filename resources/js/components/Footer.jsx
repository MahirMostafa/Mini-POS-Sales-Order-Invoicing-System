import React from 'react';

export default function Footer({ className = '' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`py-6 px-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/50 backdrop-blur-xs ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-1.5 font-medium">
        <span>Mini POS & ERP © {currentYear} • Developed by</span>
        <a
          href="https://www.linkedin.com/in/mahirmostafa/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 transition-colors"
        >
          Mahir Mostafa
        </a>
      </div>
    </footer>
  );
}

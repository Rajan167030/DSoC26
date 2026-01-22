'use client';

import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400',
    error: 'bg-gradient-to-r from-red-500 to-pink-600 border-red-400',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600 border-yellow-400',
    info: 'bg-gradient-to-r from-purple-600 to-blue-600 border-purple-400'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`${typeStyles[type]} backdrop-blur-md border shadow-2xl rounded-2xl p-4 pr-12 max-w-md`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{icons[type]}</span>
          <p className="text-white font-medium leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Zap, Keyboard } from 'lucide-react';

interface ShortcutToastProps {
  message: string | null;
  hotkey?: string;
}

export const ShortcutToast: React.FC<ShortcutToastProps> = ({ message, hotkey }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
      <div className="px-4 py-2.5 rounded-2xl bg-indigo-950/90 text-white border border-indigo-500/40 shadow-2xl backdrop-blur-xl flex items-center space-x-2.5 text-xs font-semibold">
        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center space-x-2">
          <span>{message}</span>
          {hotkey && (
            <kbd className="px-2 py-0.5 rounded bg-indigo-800 text-indigo-200 font-mono text-[11px] font-bold border border-indigo-600">
              {hotkey}
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
};

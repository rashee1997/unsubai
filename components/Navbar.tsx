'use client';

import React from 'react';
import { Mail, Sparkles, LogOut, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

interface NavbarProps {
  userEmail: string | null;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isScanning: boolean;
  unsubscribedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail,
  isConnected,
  onConnect,
  onDisconnect,
  isScanning,
  unsubscribedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-zinc-800/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">Unsub.AI</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Gmail Control
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">AI-Powered Unsubscriber & Inbox Cleaner</p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-3">
          {unsubscribedCount > 0 && (
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-400 text-xs font-medium border border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{unsubscribedCount} Unsubscribed</span>
            </div>
          )}

          {isConnected ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs sm:text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate">{userEmail || 'Gmail Connected'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 ml-1" />
              </div>
              <button
                onClick={onDisconnect}
                title="Disconnect Gmail Account"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isScanning}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Connect Gmail</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

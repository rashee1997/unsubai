'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, LogOut, CheckCircle2, ShieldCheck, Sun, Moon, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#070709]/75 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 transition-colors duration-300 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand & Nav links */}
        <div className="flex items-center space-x-3 sm:space-x-6 min-w-0 shrink-0">
          <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex flex-col shrink-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight shrink-0">Unsub.AI</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 hidden lg:block leading-none mt-0.5 truncate">Inbox Cleanup & Protection</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5 shrink-0">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 whitespace-nowrap border ${
                pathname === '/'
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-300 shadow-xs backdrop-blur-md'
                  : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/settings"
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 whitespace-nowrap border ${
                pathname === '/settings'
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-300 shadow-xs backdrop-blur-md'
                  : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>Rules & Preferences</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            </Link>
          </nav>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {unsubscribedCount > 0 && (
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/80 dark:border-emerald-800/60 backdrop-blur-sm shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{unsubscribedCount} Cleaned</span>
            </div>
          )}

          {/* Settings icon button for mobile */}
          <Link
            href="/settings"
            title="AI Filter Settings"
            className={`md:hidden p-2 rounded-full text-xs font-medium transition-colors border shrink-0 ${
              pathname === '/settings'
                ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300'
                : 'bg-white/80 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Link>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-full bg-slate-100/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer shadow-xs flex items-center justify-center shrink-0 backdrop-blur-md active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {isConnected ? (
            <div className="flex items-center space-x-2 shrink-0">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-xs sm:text-sm font-medium shrink-0 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="max-w-[100px] sm:max-w-[160px] truncate">{userEmail || 'Gmail Connected'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <button
                onClick={onDisconnect}
                title="Disconnect Gmail Account"
                className="p-2 rounded-full text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isScanning}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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


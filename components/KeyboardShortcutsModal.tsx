'use client';

import React from 'react';
import { X, Keyboard, Zap, Search, Send, Trash2, History, FilterX, Eye, ArrowUp, ArrowDown } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Core Inbox Actions',
      items: [
        { key: 'S', description: 'Trigger Inbox Scan', icon: Zap },
        { key: 'U', description: 'Bulk Unsubscribe High Priority Senders', icon: Send },
        { key: 'T', description: 'Bulk Trash High Priority Emails', icon: Trash2 },
        { key: 'A', description: 'Open Unsubscribe Audit Log', icon: History },
        { key: 'C', description: 'Clear / Reset All Active Filters', icon: FilterX },
      ],
    },
    {
      title: 'Navigation & Search',
      items: [
        { key: '/ or Cmd+K', description: 'Focus Search Bar', icon: Search },
        { key: '1 - 5', description: 'Switch Priority Filter Tabs (All, High, Job, Med, Low)', icon: Keyboard },
        { key: 'J / ↓', description: 'Navigate Down Senders List', icon: ArrowDown },
        { key: 'K / ↑', description: 'Navigate Up Senders List', icon: ArrowUp },
        { key: 'Esc', description: 'Close Modals / Blur Search', icon: X },
        { key: '?', description: 'Toggle Shortcuts Cheat Sheet', icon: Keyboard },
      ],
    },
    {
      title: 'Focused Sender Card Actions',
      items: [
        { key: 'Space / X', description: 'Unsubscribe Focused Sender', icon: Send },
        { key: 'Delete', description: 'Trash Focused Sender Emails', icon: Trash2 },
        { key: 'Enter / V', description: 'Open Full Email Preview', icon: Eye },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121215] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto transition-colors">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Power User Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Speed up your inbox cleanup with single-key hotkeys</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>{group.title}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="text-slate-800 dark:text-zinc-200 font-medium truncate">{item.description}</span>
                      </div>
                      <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 font-mono text-xs font-bold border border-slate-300 dark:border-zinc-700 shadow-xs shrink-0 whitespace-nowrap">
                        {item.key}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100/90 dark:bg-zinc-900/90 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Shortcuts are active globally across the dashboard.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Got It (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

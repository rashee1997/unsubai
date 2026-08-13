'use client';

import React from 'react';
import { Search, Sparkles, Filter, Clock, Inbox, MailWarning, Layers, Briefcase } from 'lucide-react';

export interface ScanConfig {
  timeframe: '7d' | '14d' | '30d' | '60d' | '90d' | '180d';
  mode: 'unopened' | 'all_subscriptions' | 'untouched_promos' | 'job_alerts';
  maxResults: number;
}

interface ScanFilterPanelProps {
  config: ScanConfig;
  onChange: (config: ScanConfig) => void;
  onStartScan: () => void;
  isScanning: boolean;
  isConnected: boolean;
}

export const ScanFilterPanel: React.FC<ScanFilterPanelProps> = ({
  config,
  onChange,
  onStartScan,
  isScanning,
  isConnected,
}) => {
  return (
    <div className="bg-[#121215] rounded-2xl border border-zinc-800 p-5 sm:p-6 shadow-xl mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-400" />
            <span>Scan Criteria & Target Filters</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Configure how deep Unsub.AI searches your Gmail inbox for unopened newsletters and inactive subscriptions.
          </p>
        </div>

        <button
          onClick={onStartScan}
          disabled={isScanning || !isConnected}
          className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isScanning ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scanning Gmail & AI Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Scan Inbox for Unopened Emails</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
        {/* Filter Mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5 text-zinc-500" />
            Target Mail Category
          </label>
          <div className="space-y-2">
            {[
              {
                id: 'unopened',
                title: 'Unopened Newsletters & Promos',
                desc: 'Unread emails in Promotions, Updates, or Subscription tags',
                icon: MailWarning,
              },
              {
                id: 'all_subscriptions',
                title: 'All Active Subscription Senders',
                desc: 'Scans all emails with List-Unsubscribe headers',
                icon: Layers,
              },
              {
                id: 'job_alerts',
                title: 'Job Alerts & Careers Filter',
                desc: 'Filter & preserve job recommendations, hiring updates & alerts',
                icon: Briefcase,
              },
              {
                id: 'untouched_promos',
                title: 'Stale Promotional Inbox',
                desc: 'Unread promotional emails sitting untouched',
                icon: Inbox,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = config.mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ ...config, mode: item.id as any })}
                  className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 text-white ring-1 ring-indigo-500/30'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-zinc-400 text-[11px] leading-tight mt-0.5">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeframe selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            Unopened Duration (Age threshold)
          </label>
          <p className="text-xs text-zinc-500 mb-2.5">Look for emails untouched for at least:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: '7d', label: '7 Days' },
              { id: '14d', label: '14 Days' },
              { id: '30d', label: '30 Days (1 Mo)' },
              { id: '60d', label: '60 Days (2 Mo)' },
              { id: '90d', label: '90 Days (3 Mo)' },
              { id: '180d', label: '180 Days (6 Mo)' },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => onChange({ ...config, timeframe: tf.id as any })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  config.timeframe === tf.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scan Depth / Quantity */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            Scan Depth (Max Emails)
          </label>
          <p className="text-xs text-zinc-500 mb-2.5">Number of recent subscription emails to fetch & analyze:</p>
          <div className="space-y-2">
            {[
              { val: 30, label: '30 Emails (Quick Scan)' },
              { val: 60, label: '60 Emails (Recommended)' },
              { val: 100, label: '100 Emails (Deep Scan)' },
              { val: 150, label: '150 Emails (Thorough)' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => onChange({ ...config, maxResults: opt.val })}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer flex items-center justify-between ${
                  config.maxResults === opt.val
                    ? 'bg-zinc-800 text-white border-zinc-700'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>{opt.label}</span>
                {config.maxResults === opt.val && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Clock,
  Inbox,
  MailWarning,
  Layers,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  Globe,
  X,
} from 'lucide-react';

export interface ScanConfig {
  timeframe: '7d' | '14d' | '30d' | '60d' | '90d' | '180d';
  mode: 'unopened' | 'all_subscriptions' | 'untouched_promos' | 'job_alerts' | 'custom_query';
  maxResults: number;
  customQuery?: string;
}

interface ScanFilterPanelProps {
  config: ScanConfig;
  onChange: (config: ScanConfig) => void;
  onStartScan: () => void;
  isScanning: boolean;
  isConnected: boolean;
}

const CATEGORIES = [
  {
    id: 'unopened',
    label: 'Unopened Promos',
    shortDesc: 'Unread emails in Promotions & Updates',
    icon: MailWarning,
  },
  {
    id: 'all_subscriptions',
    label: 'All Subscriptions',
    shortDesc: 'All emails with unsubscribe headers',
    icon: Layers,
  },
  {
    id: 'job_alerts',
    label: 'Job & Career Alerts',
    shortDesc: 'Filter & preserve job recommendations',
    icon: Briefcase,
  },
  {
    id: 'untouched_promos',
    label: 'Stale Inbox',
    shortDesc: 'Unread promotional emails sitting untouched',
    icon: Inbox,
  },
  {
    id: 'custom_query',
    label: 'Custom Domain / Query',
    shortDesc: 'Target specific domain or search operator',
    icon: Search,
  },
] as const;

const TIMEFRAMES = [
  { id: '7d', label: '7 Days' },
  { id: '14d', label: '14 Days' },
  { id: '30d', label: '30 Days' },
  { id: '60d', label: '60 Days' },
  { id: '90d', label: '90 Days' },
  { id: '180d', label: '180 Days' },
] as const;

const DEPTHS = [
  { val: 30, label: '30 Quick' },
  { val: 60, label: '60 Rec.' },
  { val: 100, label: '100 Deep' },
  { val: 150, label: '150 Full' },
] as const;

export const ScanFilterPanel: React.FC<ScanFilterPanelProps> = ({
  config,
  onChange,
  onStartScan,
  isScanning,
  isConnected,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeCategory = CATEGORIES.find((c) => c.id === config.mode) || CATEGORIES[0];
  const activeTimeframeLabel = TIMEFRAMES.find((t) => t.id === config.timeframe)?.label || '30 Days';

  return (
    <div className="glass-panel p-4 sm:p-5 mb-8 transition-all duration-300 shadow-sm border border-slate-200/80 dark:border-white/10 rounded-2xl">
      {/* Top Header & Main CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/60 dark:border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Scan Criteria & Target Filters</span>
            </h2>
            {/* Active Configuration Summary Badge */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
              {activeCategory.label} • {activeTimeframeLabel} • {config.maxResults} Emails
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Set search scope and target email category before analyzing your Gmail inbox.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Custom Query Quick Toggle Indicator */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>{showAdvanced ? 'Hide Custom Domain' : 'Custom Query / Domain'}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onStartScan}
            disabled={isScanning || !isConnected}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scanning Inbox...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Scan Inbox</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Selector - Fluid Horizontal Grid */}
      <div className="pt-3.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
          Target Mail Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = config.mode === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange({ ...config, mode: cat.id as any })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                    : 'bg-white/60 dark:bg-zinc-900/60 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected ? 'text-white' : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  />
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-300" />}
                </div>
                <div>
                  <div className={`text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {cat.label}
                  </div>
                  <div className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                    {cat.shortDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Query Input Box (Appears automatically when Custom Query category is selected OR when toggled) */}
      {(config.mode === 'custom_query' || showAdvanced || Boolean(config.customQuery)) && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Target Domain or Gmail Search Operator (Optional)</span>
            </label>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400">
              e.g. <code className="text-indigo-600 dark:text-indigo-400 font-mono">from:substack.com</code> or <code className="text-indigo-600 dark:text-indigo-400 font-mono">from:user@company.com</code>
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Type domain or operator to target directly (e.g., from:substack.com OR subject:newsletter)..."
              value={config.customQuery || ''}
              onChange={(e) => onChange({ ...config, customQuery: e.target.value })}
              className="glass-input w-full pl-3 pr-8 py-2 text-xs font-mono"
            />
            {config.customQuery && (
              <button
                type="button"
                onClick={() => onChange({ ...config, customQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timeframe & Scan Depth Compact Control Bar */}
      <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Untouched Duration Pill Group */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Untouched Duration (Age)</span>
            </label>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              {activeTimeframeLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {TIMEFRAMES.map((tf) => {
              const isSelected = config.timeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => onChange({ ...config, timeframe: tf.id as any })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scan Depth Pill Group */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-400" />
              <span>Scan Depth (Max Emails)</span>
            </label>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              {config.maxResults} Emails
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {DEPTHS.map((opt) => {
              const isSelected = config.maxResults === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onChange({ ...config, maxResults: opt.val })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { classifySender } from '@/lib/classification';
import {
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Archive,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Send,
  Briefcase,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from 'lucide-react';

export interface AIAnalysisData {
  senderKey: string;
  unsubscribePriority: 'high' | 'medium' | 'low';
  recommendationScore: number;
  category: string;
  summary: string;
  safetyWarning?: string | null;
  isSensitive?: boolean;
  isJobRelated?: boolean;
}

export interface SenderFrequencyData {
  direction: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  label: string;
  badgeLabel: string;
  sparkline: number[]; // 4 buckets representing intervals over 30 days
  recentCount: number;
  olderCount: number;
  breakdownLabels: string[];
}

export interface GroupedSenderData {
  senderKey: string;
  fromName: string;
  fromEmail: string;
  domain: string;
  totalEmails: number;
  unreadCount: number;
  latestDate: string;
  latestTimestamp: number;
  sampleSubject: string;
  sampleSnippet: string;
  unsubscribeUrl: string | null;
  unsubscribeMailto: string | null;
  unsubscribePostHeader: string | null;
  messageIds: string[];
  unreadMessageIds: string[];
  timestamps?: number[];
  frequencyHistory?: number[];
  frequencyTrend?: SenderFrequencyData;
  analysis?: AIAnalysisData;
}

export function computeSenderFrequency(sender: GroupedSenderData): SenderFrequencyData {
  if (sender.frequencyTrend) {
    return sender.frequencyTrend;
  }

  let buckets = [0, 0, 0, 0];
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const BUCKET_MS = THIRTY_DAYS_MS / 4; // 7.5 days each

  if (sender.timestamps && sender.timestamps.length > 0) {
    for (const ts of sender.timestamps) {
      const age = now - ts;
      if (age < 0) {
        buckets[3]++;
      } else if (age <= THIRTY_DAYS_MS) {
        const idx = Math.min(3, Math.max(0, 3 - Math.floor(age / BUCKET_MS)));
        buckets[idx]++;
      } else {
        buckets[0]++;
      }
    }
  } else if (sender.frequencyHistory && sender.frequencyHistory.length >= 2) {
    buckets = [...sender.frequencyHistory];
    while (buckets.length < 4) buckets.push(0);
    if (buckets.length > 4) buckets = buckets.slice(0, 4);
  } else {
    // Deterministic distribution based on sender stats & email patterns
    const total = sender.totalEmails || 1;
    const isHighUnread = sender.unreadCount / Math.max(total, 1) >= 0.6;
    const isOld = now - sender.latestTimestamp > 10 * 24 * 60 * 60 * 1000;

    if (isHighUnread && !isOld) {
      // Increasing volume pattern
      const p1 = Math.max(0, Math.floor(total * 0.1));
      const p2 = Math.max(0, Math.floor(total * 0.2));
      const p3 = Math.max(1, Math.floor(total * 0.3));
      const p4 = Math.max(1, total - (p1 + p2 + p3));
      buckets = [p1, p2, p3, p4];
    } else if (isOld || sender.unreadCount === 0) {
      // Decreasing volume pattern
      const p4 = Math.max(0, Math.floor(total * 0.1));
      const p3 = Math.max(0, Math.floor(total * 0.2));
      const p2 = Math.max(1, Math.floor(total * 0.3));
      const p1 = Math.max(1, total - (p4 + p3 + p2));
      buckets = [p1, p2, p3, p4];
    } else {
      // Steady distribution
      const base = Math.floor(total / 4);
      const rem = total % 4;
      buckets = [base, base + (rem > 0 ? 1 : 0), base + (rem > 1 ? 1 : 0), base + (rem > 2 ? 1 : 0)];
    }
  }

  const olderCount = (buckets[0] || 0) + (buckets[1] || 0);
  const recentCount = (buckets[2] || 0) + (buckets[3] || 0);

  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let percentChange = 0;
  let badgeLabel = 'Steady';
  let label = 'Steady volume over 30 days';

  if (recentCount > olderCount) {
    direction = 'increasing';
    percentChange = olderCount === 0 ? 100 : Math.round(((recentCount - olderCount) / olderCount) * 100);
    badgeLabel = `+${percentChange}% (Rising)`;
    label = `Volume Increasing (+${percentChange}% in last 30d)`;
  } else if (recentCount < olderCount) {
    direction = 'decreasing';
    percentChange = olderCount === 0 ? 0 : Math.round(((olderCount - recentCount) / olderCount) * 100);
    badgeLabel = `-${percentChange}% (Dropping)`;
    label = `Volume Decreasing (-${percentChange}% in last 30d)`;
  } else {
    direction = 'stable';
    percentChange = 0;
    badgeLabel = 'Steady';
    label = 'Steady volume over 30 days';
  }

  return {
    direction,
    percentChange,
    label,
    badgeLabel,
    sparkline: buckets,
    recentCount,
    olderCount,
    breakdownLabels: [
      `30-23d ago: ${buckets[0]}`,
      `22-15d ago: ${buckets[1]}`,
      `14-8d ago: ${buckets[2]}`,
      `Last 7d: ${buckets[3]}`,
    ],
  };
}

const FrequencySparkline: React.FC<{ frequency: SenderFrequencyData }> = ({ frequency }) => {
  const data = frequency.sparkline;
  const width = 52;
  const height = 22;
  const maxVal = Math.max(...data, 1);
  const minVal = 0;

  const points = data.map((val, i) => {
    const x = 4 + (i / (data.length - 1)) * (width - 8);
    const y = height - 4 - ((val - minVal) / maxVal) * (height - 8);
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height - 2} L ${points[0].x.toFixed(1)} ${height - 2} Z`;

  const strokeColor =
    frequency.direction === 'increasing'
      ? '#e11d48'
      : frequency.direction === 'decreasing'
      ? '#059669'
      : '#64748b';

  const lastPoint = points[points.length - 1];

  return (
    <div className="inline-flex items-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        aria-label="30-day frequency sparkline"
      >
        <path d={areaD} fill={strokeColor} fillOpacity="0.16" />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill={strokeColor} />
      </svg>
    </div>
  );
};

interface SenderCardProps {
  sender: GroupedSenderData;
  onUnsubscribe: (sender: GroupedSenderData) => Promise<void>;
  onCleanup: (sender: GroupedSenderData, action: 'trash' | 'archive' | 'mark_read') => Promise<void>;
  onOpenPreview?: (sender: GroupedSenderData) => void;
  isUnsubscribing: boolean;
  isCleaning: boolean;
  isUnsubscribed: boolean;
  isCleaned: boolean;
}

export const SenderCard: React.FC<SenderCardProps> = ({
  sender,
  onUnsubscribe,
  onCleanup,
  onOpenPreview,
  isUnsubscribing,
  isCleaning,
  isUnsubscribed,
  isCleaned,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedFilter, setCopiedFilter] = useState(false);

  const analysis: AIAnalysisData = classifySender({
    senderKey: sender.senderKey,
    fromName: sender.fromName,
    fromEmail: sender.fromEmail,
    domain: sender.domain,
    totalEmails: sender.totalEmails,
    unreadCount: sender.unreadCount,
    sampleSubject: sender.sampleSubject,
    sampleSnippet: sender.sampleSnippet,
    existingAnalysis: sender.analysis,
  });

  const frequency = computeSenderFrequency(sender);

  const isHighPriority = analysis.unsubscribePriority === 'high';
  const isLowPriority = analysis.unsubscribePriority === 'low';

  const copyGmailFilter = () => {
    const filterStr = `from:${sender.fromEmail}`;
    navigator.clipboard.writeText(filterStr);
    setCopiedFilter(true);
    setTimeout(() => setCopiedFilter(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        scale: isUnsubscribed ? [1, 1.015, 1] : 1,
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
      }}
      className={`glass-card relative overflow-hidden transition-colors duration-500 ${
        isUnsubscribed
          ? 'border-emerald-300/90 dark:border-emerald-700/80 bg-emerald-50/40 dark:bg-emerald-950/25 opacity-90 shadow-sm shadow-emerald-500/5'
          : isHighPriority
          ? 'border-rose-300/80 dark:border-rose-800/60 hover:border-rose-500'
          : 'hover:border-slate-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Top subtle success shimmer beam */}
      <AnimatePresence>
        {isUnsubscribed && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 dark:from-emerald-500 dark:via-teal-400 dark:to-emerald-400 z-20 origin-left"
          />
        )}
      </AnimatePresence>

      <div className="p-5 sm:p-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-start space-x-3">
            {/* Domain Avatar Badge with animated checkmark overlay */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 dark:bg-zinc-800/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center uppercase text-sm border border-indigo-200/80 dark:border-zinc-700/80 backdrop-blur-md">
                {sender.fromName.charAt(0) || 'M'}
              </div>
              <AnimatePresence>
                {isUnsubscribed && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-zinc-900"
                    title="Unsubscribed"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{sender.fromName}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 text-xs font-medium border border-slate-200/80 dark:border-zinc-700/80 backdrop-blur-md">
                  {analysis.category}
                </span>

                {isUnsubscribed && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8, x: -4 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80 shadow-xs backdrop-blur-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Unsubscribed
                  </motion.span>
                )}

                {analysis.isJobRelated && !isUnsubscribed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100/90 dark:bg-sky-950/90 text-sky-800 dark:text-sky-300 border border-sky-300/80 dark:border-sky-500/60 shadow-xs backdrop-blur-md">
                    <Briefcase className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    Job Alert
                  </span>
                )}

                {isHighPriority && !analysis.isJobRelated && !isUnsubscribed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/60 backdrop-blur-md">
                    <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    High Priority
                  </span>
                )}

                {isLowPriority && !analysis.isJobRelated && !isUnsubscribed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60 backdrop-blur-md">
                    <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Low Priority
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-slate-700 dark:text-zinc-300">{sender.fromEmail}</span>
                <span>•</span>
                <span>Latest: {sender.latestDate}</span>
              </div>
            </div>
          </div>

          {/* Right Metrics: Sender Frequency + Unopened Count + Score */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 self-start sm:self-auto shrink-0">
            {/* Sender Frequency Indicator with Sparkline and Direction Badge */}
            <div
              className="bg-white/70 dark:bg-zinc-900/70 px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md flex flex-col justify-between"
              title={`Sender Frequency (Last 30 Days):\n${frequency.label}\nBreakdown: ${frequency.breakdownLabels.join(' • ')}`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-500" />
                  Frequency
                </span>
                <span className="font-mono text-[9px] text-slate-400 dark:text-zinc-500">30d</span>
              </div>

              <div className="flex items-center gap-2">
                <FrequencySparkline frequency={frequency} />

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                    frequency.direction === 'increasing'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/70'
                      : frequency.direction === 'decreasing'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                      : 'bg-slate-100 dark:bg-zinc-800/90 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  {frequency.direction === 'increasing' ? (
                    <TrendingUp className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  ) : frequency.direction === 'decreasing' ? (
                    <TrendingDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Minus className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{frequency.badgeLabel}</span>
                </span>
              </div>
            </div>

            {/* Unopened vs Total count */}
            <div className="bg-white/60 dark:bg-zinc-900/60 px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md text-right min-w-[90px]">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400">Unopened</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">
                <span className={sender.unreadCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-zinc-300'}>
                  {sender.unreadCount}
                </span>{' '}
                <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-500">/ {sender.totalEmails}</span>
              </div>
            </div>

            {/* AI Recommendation Score */}
            <div className="w-12 text-center bg-white/60 dark:bg-zinc-900/60 px-1.5 py-2 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400">Score</div>
              <div
                className={`text-sm font-black mt-0.5 ${
                  analysis.recommendationScore > 80
                    ? 'text-rose-600 dark:text-rose-400'
                    : analysis.recommendationScore > 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-zinc-300'
                }`}
              >
                {analysis.recommendationScore}%
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Sentence */}
        <div className="py-3 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
          <p className="leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Job Alert Special Protection Banner */}
        {analysis.isJobRelated && (
          <div className="mb-3 p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 text-xs flex items-start gap-2.5 shadow-xs backdrop-blur-md">
            <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-800 dark:text-sky-300">Job Alert Detected:</span> Automatically prioritized to ensure career opportunities or recruiter emails are preserved.
            </div>
          </div>
        )}

        {/* Safety Warning Banner if Sensitive */}
        {analysis.safetyWarning && !analysis.isJobRelated && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5 backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-800 dark:text-amber-200">Safety Notice:</span> {analysis.safetyWarning}
            </div>
          </div>
        )}

        {/* Sample Snippet & Full Preview Button */}
        <div className="bg-white/50 dark:bg-zinc-900/50 rounded-2xl p-3.5 border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-zinc-300 my-2 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <span className="truncate font-semibold text-slate-900 dark:text-white">&quot;{sender.sampleSubject}&quot;</span>
            <div className="flex items-center space-x-2 shrink-0">
              {onOpenPreview && (
                <button
                  type="button"
                  onClick={() => onOpenPreview(sender)}
                  className="px-2.5 py-1 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer active:scale-95 border border-indigo-200/80 dark:border-indigo-800/60"
                  title="Open full interactive email preview with headers & message body"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Preview</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors px-1"
              >
                <span>{isExpanded ? 'Less' : 'Snippet'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isExpanded && (
            <p className="text-slate-600 dark:text-zinc-400 mt-2 font-mono text-[11px] leading-relaxed border-t border-slate-200/80 dark:border-white/10 pt-2">
              {sender.sampleSnippet || 'No email text preview available.'}
            </p>
          )}
        </div>

        {/* Unsubscribe & Cleanup Action Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2">
            {/* Primary Unsubscribe Action with Framer Motion Animated Feedback */}
            <AnimatePresence mode="wait" initial={false}>
              {isUnsubscribed ? (
                <motion.div
                  key="unsubscribed-state"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300/80 dark:border-emerald-700/80 backdrop-blur-md shadow-xs select-none"
                >
                  {/* Expanding subtle ripple ping */}
                  <motion.span
                    initial={{ scale: 0.85, opacity: 0.7 }}
                    animate={{ scale: 1.45, opacity: 0 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-emerald-400/40 pointer-events-none"
                  />

                  {/* Vector SVG Animated Drawing Checkmark */}
                  <svg
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="10"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    <motion.path
                      d="m9 12 2 2 4-4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: 0.18, ease: 'easeOut' }}
                    />
                  </svg>

                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.12 }}
                  >
                    Unsubscribed
                  </motion.span>
                </motion.div>
              ) : isUnsubscribing ? (
                <motion.div
                  key="unsubscribing-state"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-xs backdrop-blur-md opacity-90"
                >
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Unsubscribing...</span>
                </motion.div>
              ) : (
                <motion.button
                  key="idle-state"
                  type="button"
                  onClick={() => onUnsubscribe(sender)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer active:scale-95 backdrop-blur-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Unsubscribe</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Trash emails */}
            <button
              type="button"
              onClick={() => onCleanup(sender, 'trash')}
              disabled={isCleaning || isCleaned}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                isCleaned
                  ? 'bg-slate-100/50 dark:bg-zinc-900/50 text-slate-400 dark:text-zinc-600 border-slate-200/50 dark:border-zinc-800/50 cursor-not-allowed'
                  : 'bg-white/60 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-white/10 hover:bg-rose-50/80 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-400 hover:border-rose-300'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Trash {sender.totalEmails} Emails</span>
            </button>

            {/* Archive emails */}
            <button
              type="button"
              onClick={() => onCleanup(sender, 'archive')}
              disabled={isCleaning || isCleaned}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-white/60 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10 hover:bg-white/80 dark:hover:bg-zinc-800 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 active:scale-95 backdrop-blur-md"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {/* Copy Gmail Filter */}
            <button
              type="button"
              onClick={copyGmailFilter}
              className="inline-flex items-center space-x-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white py-1 px-2.5 rounded-full hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Copy Gmail filter string to block future emails"
            >
              {copiedFilter ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFilter ? 'Filter Copied!' : 'Copy Gmail Filter'}</span>
            </button>

            {/* Web Direct Link */}
            {sender.unsubscribeUrl && (
              <a
                href={sender.unsubscribeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center space-x-1 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 px-2.5 rounded-full hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 transition-colors"
                title="Open original direct unsubscribe web link"
              >
                <span>Direct Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};


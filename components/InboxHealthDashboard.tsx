'use client';

import React, { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
const useIsMounted = () => {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
};
import {
  MailWarning,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  TrendingDown,
  Clock,
  Trash2,
  Send,
  BarChart3,
  Mail,
  Layers,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { GroupedSenderData, AIAnalysisData } from './SenderCard';
import { classifySender, isJobAlertSender } from '@/lib/classification';

export interface InboxHealthDashboardProps {
  totalSenders: number;
  highPriorityCount: number;
  totalUnreadEmails: number;
  unsubscribedCount: number;
  cleanedMessagesCount: number;
  senders?: GroupedSenderData[];
  jobAlertsCount?: number;
  onBulkTrashHighPriority?: () => void;
  onBulkUnsubscribeHighPriority?: () => void;
  onBulkUnsubscribeAll?: () => void;
  onSelectJobAlertsFilter?: () => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-700/80 dark:border-zinc-700/80 rounded-2xl p-3.5 shadow-2xl text-xs text-slate-100 dark:text-zinc-200 min-w-[190px]">
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800 dark:border-zinc-800">
          <p className="font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" style={{ backgroundColor: data.fill }} />
            <span>{data.name}</span>
          </p>
          {data.percentage !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-white/10 text-slate-200">
              {data.percentage}%
            </span>
          )}
        </div>
        <div className="space-y-1.5 text-slate-300 dark:text-zinc-300 font-mono text-[11px]">
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-400 dark:text-zinc-400">Total Volume:</span>
            <span className="font-bold text-white">{data.emails} emails</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-400 dark:text-zinc-400">Unique Senders:</span>
            <span className="text-slate-200 dark:text-zinc-300">{data.sendersCount}</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-400 dark:text-zinc-400">Unopened:</span>
            <span className="text-rose-400 font-semibold">{data.unread} messages</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const InboxHealthDashboard: React.FC<InboxHealthDashboardProps> = ({
  totalSenders,
  highPriorityCount,
  totalUnreadEmails,
  unsubscribedCount,
  cleanedMessagesCount,
  senders = [],
  jobAlertsCount,
  onBulkTrashHighPriority,
  onBulkUnsubscribeHighPriority,
  onBulkUnsubscribeAll,
  onSelectJobAlertsFilter,
}) => {
  const isMounted = useIsMounted();

  // Estimate time saved: 1.2 mins per unopened newsletter/declutter
  const estimatedMinsSaved = Math.round((totalUnreadEmails + cleanedMessagesCount) * 1.2);
  const hoursSaved = (estimatedMinsSaved / 60).toFixed(1);

  const calculatedJobAlertsCount =
    jobAlertsCount ??
    senders.filter((s) => {
      const analysis = s.analysis || classifySender(s);
      return analysis.isJobRelated || isJobAlertSender(s) || analysis.category?.toLowerCase().includes('job');
    }).length;

  // Category distribution calculation
  const processCategoryData = () => {
    if (!senders || senders.length === 0) {
      // Sample data when scan hasn't run or is empty
      const sampleTotal = 380;
      return [
        { name: 'Newsletters & Digests', emails: 142, sendersCount: 6, unread: 84, fill: '#f43f5e', icon: 'newspaper', key: 'newsletters', percentage: Math.round((142 / sampleTotal) * 100) },
        { name: 'E-Commerce & Promos', emails: 112, sendersCount: 5, unread: 78, fill: '#f59e0b', icon: 'shopping-cart', key: 'ecommerce', percentage: Math.round((112 / sampleTotal) * 100) },
        { name: 'Job Alerts & Careers', emails: 48, sendersCount: 2, unread: 8, fill: '#0284c7', icon: 'briefcase', key: 'job_alerts', percentage: Math.round((48 / sampleTotal) * 100) },
        { name: 'Social & Community', emails: 35, sendersCount: 3, unread: 18, fill: '#6366f1', icon: 'users', key: 'social', percentage: Math.round((35 / sampleTotal) * 100) },
        { name: 'Receipts & Billing', emails: 24, sendersCount: 2, unread: 4, fill: '#10b981', icon: 'receipt', key: 'receipts', percentage: Math.round((24 / sampleTotal) * 100) },
        { name: 'Updates & Alerts', emails: 19, sendersCount: 2, unread: 8, fill: '#8b5cf6', icon: 'bell', key: 'updates', percentage: Math.round((19 / sampleTotal) * 100) },
      ];
    }

    const categoryMap: Record<
      string,
      { emails: number; sendersCount: number; unread: number; key: string; color: string }
    > = {
      'Job Alerts & Careers': { emails: 0, sendersCount: 0, unread: 0, key: 'job_alerts', color: '#0284c7' },
      'Newsletters & Digests': { emails: 0, sendersCount: 0, unread: 0, key: 'newsletters', color: '#f43f5e' },
      'E-Commerce & Promos': { emails: 0, sendersCount: 0, unread: 0, key: 'ecommerce', color: '#f59e0b' },
      'Receipts & Billing': { emails: 0, sendersCount: 0, unread: 0, key: 'receipts', color: '#10b981' },
      'Social & Community': { emails: 0, sendersCount: 0, unread: 0, key: 'social', color: '#6366f1' },
      'Updates & Alerts': { emails: 0, sendersCount: 0, unread: 0, key: 'updates', color: '#8b5cf6' },
    };

    senders.forEach((s) => {
      const analysis = s.analysis || classifySender(s);
      const isJob = analysis.isJobRelated || isJobAlertSender(s) || analysis.category?.toLowerCase().includes('job');
      const rawCategory = analysis.category?.trim() || 'Newsletters & Digests';
      const lower = rawCategory.toLowerCase();

      let target = 'Newsletters & Digests';
      if (isJob || lower.includes('career') || lower.includes('hiring') || lower.includes('recruit')) {
        target = 'Job Alerts & Careers';
      } else if (
        lower.includes('market') ||
        lower.includes('deal') ||
        lower.includes('promo') ||
        lower.includes('e-commerce') ||
        lower.includes('shop') ||
        lower.includes('store') ||
        lower.includes('discount')
      ) {
        target = 'E-Commerce & Promos';
      } else if (
        lower.includes('receipt') ||
        lower.includes('order') ||
        lower.includes('finance') ||
        lower.includes('bank') ||
        lower.includes('invoice') ||
        lower.includes('billing') ||
        lower.includes('payment')
      ) {
        target = 'Receipts & Billing';
      } else if (lower.includes('social') || lower.includes('community') || lower.includes('forum') || lower.includes('network')) {
        target = 'Social & Community';
      } else if (
        lower.includes('update') ||
        lower.includes('alert') ||
        lower.includes('system') ||
        lower.includes('security') ||
        lower.includes('notification')
      ) {
        target = 'Updates & Alerts';
      } else if (lower.includes('newsletter') || lower.includes('digest') || lower.includes('editorial') || lower.includes('blog')) {
        target = 'Newsletters & Digests';
      }

      categoryMap[target].emails += s.totalEmails;
      categoryMap[target].sendersCount += 1;
      categoryMap[target].unread += s.unreadCount;
    });

    const totalEmailsAll = Object.values(categoryMap).reduce((acc, c) => acc + c.emails, 0) || 1;

    return Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        emails: data.emails,
        sendersCount: data.sendersCount,
        unread: data.unread,
        fill: data.color,
        key: data.key,
        percentage: Math.round((data.emails / totalEmailsAll) * 100),
      }))
      .filter((cat) => cat.emails > 0 || senders.length === 0)
      .sort((a, b) => b.emails - a.emails);
  };

  const chartData = processCategoryData();
  const totalCategoryEmails = chartData.reduce((acc, curr) => acc + curr.emails, 0);
  const dominantCategory = chartData[0];

  return (
    <div className="space-y-6 mb-8">
      {/* Top 5 KPI Metrics - Responsive Fluid Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Subscriptions Scanned */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scanned Senders</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center backdrop-blur-md">
              <MailWarning className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{totalSenders}</div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
              <span>{totalUnreadEmails} unopened messages</span>
            </div>
          </div>
        </div>

        {/* Card 2: High Priority Unsubscribes */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40">
          <div>
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">High Priority</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100/80 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 flex items-center justify-center backdrop-blur-md">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400">{highPriorityCount}</div>
              <div className="text-xs text-rose-600/90 dark:text-rose-300/80 mt-1">Recommended to unsubscribe</div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {onBulkUnsubscribeHighPriority && (
              <button
                type="button"
                onClick={onBulkUnsubscribeHighPriority}
                disabled={highPriorityCount === 0}
                className="w-full py-2 px-3 rounded-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer backdrop-blur-md active:scale-95"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Bulk Unsubscribe ({highPriorityCount})</span>
              </button>
            )}

            {onBulkTrashHighPriority && (
              <button
                type="button"
                onClick={onBulkTrashHighPriority}
                disabled={highPriorityCount === 0}
                className="w-full py-1.5 px-3 rounded-full bg-rose-100/80 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-200 border border-rose-300/80 dark:border-rose-700/50 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
                <span>Bulk Trash High Priority</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Job Alerts Filtered */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between bg-sky-50/40 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-900/40">
          <div>
            <div className="flex items-center justify-between text-sky-700 dark:text-sky-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Job Alerts</span>
              <div className="w-8 h-8 rounded-xl bg-sky-100/80 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/40 text-sky-700 dark:text-sky-400 flex items-center justify-center backdrop-blur-md">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-800 dark:text-sky-300">{calculatedJobAlertsCount}</div>
              <div className="text-xs text-sky-700/90 dark:text-sky-300/80 mt-1">Preserved career opportunities</div>
            </div>
          </div>

          {onSelectJobAlertsFilter && (
            <button
              type="button"
              onClick={onSelectJobAlertsFilter}
              className="mt-3 w-full py-2 px-3 rounded-full bg-sky-100/80 dark:bg-sky-950/80 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-sky-900 dark:text-sky-200 border border-sky-300/80 dark:border-sky-700/60 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>View Job Alerts ({calculatedJobAlertsCount})</span>
            </button>
          )}
        </div>

        {/* Card 4: Time Saved */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Est. Time Saved</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 flex items-center justify-center backdrop-blur-md">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {hoursSaved} <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">hrs</span>
            </div>
            <div className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-1">Inbox clutter reduction</div>
          </div>
        </div>

        {/* Card 5: Cleaned & Unsubscribed */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Unsubscribed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{unsubscribedCount}</div>
            <div className="text-xs text-emerald-700/90 dark:text-emerald-300/80 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              <span>{cleanedMessagesCount} emails trashed/archived</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution Recharts Bar Chart Container */}
      <div className="glass-panel p-5 sm:p-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-200/80 dark:border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center backdrop-blur-md">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Email Category Distribution
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Distribution of detected emails across subscription categories (Job Alerts vs. Newsletters vs. E-Commerce).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {dominantCategory && (
              <div className="px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dominantCategory.fill }} />
                <span>Top Category: <strong>{dominantCategory.name}</strong> ({dominantCategory.percentage}%)</span>
              </div>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-mono flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
              <span>{totalCategoryEmails} Scanned Emails</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-[250px] sm:h-[280px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                  interval={0}
                  tick={(props: any) => {
                    const { x, y, payload } = props;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={14}
                          textAnchor="end"
                          fill="currentColor"
                          className="text-slate-600 dark:text-zinc-400 font-medium"
                          fontSize={11}
                          transform="rotate(-22)"
                        >
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                <Bar dataKey="emails" radius={[6, 6, 0, 0]} maxBarSize={52}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="transition-opacity hover:opacity-85" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-zinc-500 text-xs font-mono">
              Loading category distribution chart...
            </div>
          )}
        </div>

        {/* Legend / Category Breakdown Badges */}
        <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {chartData.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-zinc-300 shadow-2xs"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.fill }} />
                <span className="font-semibold text-slate-900 dark:text-zinc-200">{cat.name}:</span>
                <span className="font-mono text-slate-600 dark:text-zinc-400">{cat.emails} ({cat.percentage}%)</span>
              </div>
            ))}
          </div>

          {onBulkUnsubscribeHighPriority && highPriorityCount > 0 && (
            <button
              type="button"
              onClick={onBulkUnsubscribeHighPriority}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer ml-auto"
            >
              <span>Bulk Unsubscribe High Priority ({highPriorityCount})</span>
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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
import { GroupedSenderData } from './SenderCard';

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
      <div className="bg-[#18181b] border border-zinc-700 rounded-xl p-3 shadow-xl text-xs text-zinc-200 min-w-[160px]">
        <p className="font-bold text-white mb-1.5 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: data.fill }} />
          <span>{data.name}</span>
        </p>
        <div className="space-y-1 text-zinc-300 font-mono">
          <div className="flex justify-between items-center gap-3">
            <span className="text-zinc-400">Total Emails:</span>
            <span className="font-bold text-white">{data.emails}</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-zinc-400">Senders:</span>
            <span className="text-zinc-300">{data.sendersCount}</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-zinc-400">Unopened:</span>
            <span className="text-rose-400 font-semibold">{data.unread}</span>
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
    senders.filter(
      (s) => s.analysis?.isJobRelated || s.analysis?.category?.toLowerCase().includes('job')
    ).length;

  // Category distribution calculation
  const processCategoryData = () => {
    if (!senders || senders.length === 0) {
      // Sample data when scan hasn't run or is empty
      return [
        { name: 'Newsletters', emails: 142, sendersCount: 6, unread: 84, fill: '#f43f5e' },
        { name: 'Marketing & Promo', emails: 98, sendersCount: 5, unread: 62, fill: '#f59e0b' },
        { name: 'Social & Community', emails: 45, sendersCount: 3, unread: 21, fill: '#3b82f6' },
        { name: 'Receipts & Orders', emails: 24, sendersCount: 2, unread: 4, fill: '#10b981' },
        { name: 'Updates & Alerts', emails: 19, sendersCount: 2, unread: 8, fill: '#8b5cf6' },
      ];
    }

    const categoryMap: Record<string, { emails: number; sendersCount: number; unread: number }> = {};

    senders.forEach((s) => {
      const rawCategory = s.analysis?.category?.trim() || 'Newsletter';
      const lower = rawCategory.toLowerCase();
      let normCategory = 'Newsletters';

      if (s.analysis?.isJobRelated || lower.includes('job') || lower.includes('career') || lower.includes('hiring') || lower.includes('recruit')) {
        normCategory = 'Job Alerts & Careers';
      } else if (lower.includes('newsletter') || lower.includes('digest') || lower.includes('editorial')) {
        normCategory = 'Newsletters';
      } else if (
        lower.includes('market') ||
        lower.includes('deal') ||
        lower.includes('promo') ||
        lower.includes('e-commerce') ||
        lower.includes('shop')
      ) {
        normCategory = 'Marketing & Promo';
      } else if (
        lower.includes('receipt') ||
        lower.includes('order') ||
        lower.includes('finance') ||
        lower.includes('bank') ||
        lower.includes('invoice')
      ) {
        normCategory = 'Receipts & Orders';
      } else if (lower.includes('social') || lower.includes('community') || lower.includes('forum')) {
        normCategory = 'Social & Community';
      } else if (
        lower.includes('update') ||
        lower.includes('alert') ||
        lower.includes('system') ||
        lower.includes('security') ||
        lower.includes('travel')
      ) {
        normCategory = 'Updates & Alerts';
      } else {
        normCategory = rawCategory.length > 20 ? rawCategory.slice(0, 18) + '...' : rawCategory;
      }

      if (!categoryMap[normCategory]) {
        categoryMap[normCategory] = { emails: 0, sendersCount: 0, unread: 0 };
      }
      categoryMap[normCategory].emails += s.totalEmails;
      categoryMap[normCategory].sendersCount += 1;
      categoryMap[normCategory].unread += s.unreadCount;
    });

    const categoryColors: Record<string, string> = {
      'Job Alerts & Careers': '#0284c7',
      Newsletters: '#f43f5e',
      'Marketing & Promo': '#f59e0b',
      'Social & Community': '#3b82f6',
      'Receipts & Orders': '#10b981',
      'Updates & Alerts': '#8b5cf6',
    };

    const defaultColors = ['#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'];

    return Object.entries(categoryMap)
      .map(([name, data], idx) => ({
        name,
        emails: data.emails,
        sendersCount: data.sendersCount,
        unread: data.unread,
        fill: categoryColors[name] || defaultColors[idx % defaultColors.length],
      }))
      .sort((a, b) => b.emails - a.emails);
  };

  const chartData = processCategoryData();
  const totalCategoryEmails = chartData.reduce((acc, curr) => acc + curr.emails, 0);

  return (
    <div className="space-y-6 mb-8">
      {/* Top 5 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Subscriptions Scanned */}
        <div className="bg-[#121215] rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scanned Senders</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
              <MailWarning className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalSenders}</div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
              <span>{totalUnreadEmails} unopened messages</span>
            </div>
          </div>
        </div>

        {/* Card 2: High Priority Unsubscribes */}
        <div className="bg-[#121215] rounded-2xl border border-rose-900/40 p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">High AI Priority</span>
              <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">{highPriorityCount}</div>
              <div className="text-xs text-rose-300/80 mt-1">Recommended to unsubscribe</div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {onBulkUnsubscribeHighPriority && (
              <button
                type="button"
                onClick={onBulkUnsubscribeHighPriority}
                disabled={highPriorityCount === 0}
                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white border border-rose-500/50 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-900/80 to-amber-900/80 hover:from-rose-800 hover:to-amber-800 text-rose-200 border border-rose-700/50 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Bulk Trash High Priority</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Job Alerts Filtered */}
        <div className="bg-[#121215] rounded-2xl border border-sky-900/50 p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Job Alerts</span>
              <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-800/40 text-sky-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-300">{calculatedJobAlertsCount}</div>
              <div className="text-xs text-sky-300/80 mt-1">Preserved career opportunities</div>
            </div>
          </div>

          {onSelectJobAlertsFilter && (
            <button
              type="button"
              onClick={onSelectJobAlertsFilter}
              className="mt-3 w-full py-1.5 px-3 rounded-xl bg-sky-950/80 hover:bg-sky-900/80 text-sky-200 border border-sky-700/60 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-400" />
              <span>View Job Alerts ({calculatedJobAlertsCount})</span>
            </button>
          )}
        </div>

        {/* Card 4: Time Saved */}
        <div className="bg-[#121215] rounded-2xl border border-amber-900/40 p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Est. Time Saved</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {hoursSaved} <span className="text-sm font-medium text-zinc-400">hrs</span>
            </div>
            <div className="text-xs text-amber-300/80 mt-1">Inbox clutter reduction</div>
          </div>
        </div>

        {/* Card 4: Cleaned & Unsubscribed */}
        <div className="bg-[#121215] rounded-2xl border border-emerald-900/40 p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Unsubscribed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{unsubscribedCount}</div>
            <div className="text-xs text-emerald-300/80 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              <span>{cleanedMessagesCount} emails trashed/archived</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution Recharts Bar Chart Container */}
      <div className="bg-[#121215] rounded-2xl border border-zinc-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Inbox Email Distribution by Category
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Visual breakdown of scanned recurring emails across AI-detected subscription categories.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onBulkUnsubscribeAll && totalSenders > 0 && (
              <button
                type="button"
                onClick={onBulkUnsubscribeAll}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Bulk Unsubscribe All ({totalSenders})</span>
              </button>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>{totalCategoryEmails} Total Scanned Emails</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart */}
        <div className="w-full h-[240px] sm:h-[260px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  interval={0}
                  tick={(props: any) => {
                    const { x, y, payload } = props;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={12}
                          textAnchor="end"
                          fill="#a1a1aa"
                          fontSize={11}
                          transform="rotate(-20)"
                        >
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                <Bar dataKey="emails" radius={[6, 6, 0, 0]} maxBarSize={55}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
              Loading category chart...
            </div>
          )}
        </div>

        {/* Legend / Category Stats Bar */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {chartData.map((cat) => (
              <div key={cat.name} className="flex items-center space-x-1.5 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.fill }} />
                <span className="font-medium text-zinc-200">{cat.name}:</span>
                <span className="font-mono text-zinc-400">{cat.emails} emails</span>
              </div>
            ))}
          </div>

          {onBulkUnsubscribeHighPriority && highPriorityCount > 0 && (
            <button
              type="button"
              onClick={onBulkUnsubscribeHighPriority}
              className="text-rose-400 hover:text-rose-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Bulk Unsubscribe High Priority ({highPriorityCount} Senders)</span>
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
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
  analysis?: AIAnalysisData;
}

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

  const analysis: AIAnalysisData = sender.analysis || {
    senderKey: sender.senderKey,
    unsubscribePriority: sender.unreadCount > 2 ? 'high' : 'medium',
    recommendationScore: Math.min(60 + sender.unreadCount * 8, 98),
    category: 'Newsletter & Promo',
    summary: `Sender has ${sender.unreadCount} unread email(s) out of ${sender.totalEmails} scanned.`,
    safetyWarning: null,
    isSensitive: false,
  };

  const isHighPriority = analysis.unsubscribePriority === 'high';
  const isLowPriority = analysis.unsubscribePriority === 'low';

  const copyGmailFilter = () => {
    const filterStr = `from:${sender.fromEmail}`;
    navigator.clipboard.writeText(filterStr);
    setCopiedFilter(true);
    setTimeout(() => setCopiedFilter(false), 2000);
  };

  return (
    <div
      className={`glass-card overflow-hidden transition-all duration-300 ${
        isUnsubscribed
          ? 'border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 opacity-85'
          : isHighPriority
          ? 'border-rose-300/80 dark:border-rose-800/60 hover:border-rose-500'
          : 'hover:border-slate-300 dark:hover:border-zinc-700'
      }`}
    >
      <div className="p-5 sm:p-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-start space-x-3">
            {/* Domain Avatar Badge */}
            <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 dark:bg-zinc-800/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center uppercase shrink-0 text-sm border border-indigo-200/80 dark:border-zinc-700/80 backdrop-blur-md">
              {sender.fromName.charAt(0) || 'M'}
            </div>

            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{sender.fromName}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 text-xs font-medium border border-slate-200/80 dark:border-zinc-700/80 backdrop-blur-md">
                  {analysis.category}
                </span>

                {analysis.isJobRelated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100/90 dark:bg-sky-950/90 text-sky-800 dark:text-sky-300 border border-sky-300/80 dark:border-sky-500/60 shadow-xs backdrop-blur-md">
                    <Briefcase className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    Job Alert
                  </span>
                )}

                {isHighPriority && !analysis.isJobRelated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/60 backdrop-blur-md">
                    <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    High AI Priority
                  </span>
                )}

                {isLowPriority && !analysis.isJobRelated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60 backdrop-blur-md">
                    <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Caution / Low Priority
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-slate-700 dark:text-zinc-300">{sender.fromEmail}</span>
                <span>•</span>
                <span>Latest: {sender.latestDate}</span>
              </div>
            </div>
          </div>

          {/* Right Metrics */}
          <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Unopened Count</div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                <span className={sender.unreadCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-zinc-300'}>
                  {sender.unreadCount}
                </span>{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-zinc-500">/ {sender.totalEmails} total</span>
              </div>
            </div>

            <div className="w-12 text-center bg-white/60 dark:bg-zinc-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400">Score</div>
              <div
                className={`text-sm font-black ${
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
              <span className="font-bold text-sky-800 dark:text-sky-300">Job Alert Detected:</span> AI automatically set this sender to low priority so you won&apos;t miss career opportunities or recruiter emails.
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
            {/* Primary Unsubscribe Action */}
            {isUnsubscribed ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 text-xs font-semibold border border-emerald-300/80 dark:border-emerald-800/60 backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Unsubscribed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onUnsubscribe(sender)}
                disabled={isUnsubscribing}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95 backdrop-blur-md"
              >
                {isUnsubscribing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Unsubscribing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Unsubscribe (Confirm Step)</span>
                  </>
                )}
              </button>
            )}

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
    </div>
  );
};

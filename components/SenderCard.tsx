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
  Mail,
  Send,
  Briefcase,
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
  isUnsubscribing: boolean;
  isCleaning: boolean;
  isUnsubscribed: boolean;
  isCleaned: boolean;
}

export const SenderCard: React.FC<SenderCardProps> = ({
  sender,
  onUnsubscribe,
  onCleanup,
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
      className={`bg-[#121215] rounded-2xl border transition-all duration-200 overflow-hidden ${
        isUnsubscribed
          ? 'border-emerald-800/60 bg-emerald-950/20 opacity-85'
          : isHighPriority
          ? 'border-rose-800/60 shadow-lg hover:border-rose-600'
          : 'border-zinc-800 shadow-md hover:border-zinc-700'
      }`}
    >
      <div className="p-5 sm:p-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-start space-x-3">
            {/* Domain Avatar Badge */}
            <div className="w-11 h-11 rounded-xl bg-zinc-800 text-indigo-400 font-bold flex items-center justify-center uppercase shrink-0 text-sm border border-zinc-700/80">
              {sender.fromName.charAt(0) || 'M'}
            </div>

            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="font-bold text-white text-base">{sender.fromName}</h3>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700">
                  {analysis.category}
                </span>

                {analysis.isJobRelated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-950/90 text-sky-300 border border-sky-500/60 shadow-xs">
                    <Briefcase className="w-3 h-3 text-sky-400" />
                    Job Alert
                  </span>
                )}

                {isHighPriority && !analysis.isJobRelated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    High AI Priority
                  </span>
                )}

                {isLowPriority && !analysis.isJobRelated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Caution / Low Priority
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <span className="font-mono text-zinc-300">{sender.fromEmail}</span>
                <span>•</span>
                <span>Latest: {sender.latestDate}</span>
              </div>
            </div>
          </div>

          {/* Right Metrics */}
          <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
            <div className="text-right">
              <div className="text-xs text-zinc-400 font-medium">Unopened Count</div>
              <div className="text-lg font-extrabold text-white">
                <span className={sender.unreadCount > 0 ? 'text-rose-400' : 'text-zinc-300'}>
                  {sender.unreadCount}
                </span>{' '}
                <span className="text-xs font-normal text-zinc-500">/ {sender.totalEmails} total</span>
              </div>
            </div>

            <div className="w-12 text-center bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Score</div>
              <div
                className={`text-sm font-black ${
                  analysis.recommendationScore > 80
                    ? 'text-rose-400'
                    : analysis.recommendationScore > 50
                    ? 'text-amber-400'
                    : 'text-zinc-300'
                }`}
              >
                {analysis.recommendationScore}%
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Sentence */}
        <div className="py-3 text-xs sm:text-sm text-zinc-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Job Alert Special Protection Banner */}
        {analysis.isJobRelated && (
          <div className="mb-3 p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sky-200 text-xs flex items-start gap-2.5 shadow-xs">
            <Briefcase className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-300">Job Alert Detected:</span> AI automatically set this sender to low priority so you won&apos;t miss career opportunities or recruiter emails.
            </div>
          </div>
        )}

        {/* Safety Warning Banner if Sensitive */}
        {analysis.safetyWarning && !analysis.isJobRelated && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-200">Safety Notice:</span> {analysis.safetyWarning}
            </div>
          </div>
        )}

        {/* Sample Snippet & Expand button */}
        <div className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 text-xs text-zinc-300 my-2">
          <div className="flex items-center justify-between font-semibold text-white mb-1">
            <span className="truncate">&quot;{sender.sampleSubject}&quot;</span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
            >
              <span>{isExpanded ? 'Hide Snippet' : 'View Email Snippet'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isExpanded && (
            <p className="text-zinc-400 mt-2 font-mono text-[11px] leading-relaxed border-t border-zinc-800 pt-2">
              {sender.sampleSnippet || 'No email text preview available.'}
            </p>
          )}
        </div>

        {/* Unsubscribe & Cleanup Action Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2">
            {/* Primary Unsubscribe Action */}
            {isUnsubscribed ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950/60 text-emerald-400 text-xs font-semibold border border-emerald-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Unsubscribed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onUnsubscribe(sender)}
                disabled={isUnsubscribing}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
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
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                isCleaned
                  ? 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-800/60'
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
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
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
              className="inline-flex items-center space-x-1 text-zinc-400 hover:text-white py-1 px-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Copy Gmail filter string to block future emails"
            >
              {copiedFilter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFilter ? 'Filter Copied!' : 'Copy Gmail Filter'}</span>
            </button>

            {/* Web Direct Link */}
            {sender.unsubscribeUrl && (
              <a
                href={sender.unsubscribeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center space-x-1 text-zinc-400 hover:text-indigo-400 py-1 px-2 rounded-lg hover:bg-indigo-950/40 transition-colors"
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

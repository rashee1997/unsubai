'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Archive,
  ExternalLink,
  Copy,
  Check,
  Send,
  Code,
  FileText,
  Clock,
  Tag,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { GroupedSenderData } from './SenderCard';
import { EmailPreviewResponse } from '@/app/api/gmail/preview/route';

interface EmailPreviewModalProps {
  sender: GroupedSenderData | null;
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  onUnsubscribe: (sender: GroupedSenderData) => Promise<void>;
  onCleanup: (sender: GroupedSenderData, action: 'trash' | 'archive' | 'mark_read') => Promise<void>;
  isUnsubscribing: boolean;
  isCleaning: boolean;
  isUnsubscribed: boolean;
  isCleaned: boolean;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  sender,
  isOpen,
  onClose,
  accessToken,
  onUnsubscribe,
  onCleanup,
  isUnsubscribing,
  isCleaning,
  isUnsubscribed,
  isCleaned,
}) => {
  const [selectedMsgIndex, setSelectedMsgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'rendered' | 'text' | 'headers'>('rendered');
  const [previewData, setPreviewData] = useState<EmailPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copiedFilter, setCopiedFilter] = useState(false);

  // Load message content when modal opens or selectedMsgIndex changes
  useEffect(() => {
    if (!isOpen || !sender) return;

    let isMounted = true;
    const fetchMessageDetail = async () => {
      setIsLoading(true);
      setFetchError(null);

      const messageId = sender.messageIds?.[selectedMsgIndex] || 'demo-1';

      try {
        const res = await fetch('/api/gmail/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            messageId,
            fromName: sender.fromName,
            fromEmail: sender.fromEmail,
            subject: sender.sampleSubject,
            snippet: sender.sampleSnippet,
            date: sender.latestDate,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to load email message preview');
        }

        const data: EmailPreviewResponse = await res.json();
        if (isMounted) {
          setPreviewData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setFetchError(err.message || 'Error fetching email content');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMessageDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sender, selectedMsgIndex, accessToken]);

  if (!isOpen || !sender) return null;

  const analysis = sender.analysis;
  const isHighPriority = analysis?.unsubscribePriority === 'high';
  const isJobRelated = analysis?.isJobRelated;

  const copyGmailFilter = () => {
    const filterQuery = `from:${sender.fromEmail}`;
    navigator.clipboard.writeText(filterQuery);
    setCopiedFilter(true);
    setTimeout(() => setCopiedFilter(false), 2000);
  };

  const totalMessages = sender.messageIds?.length || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-white/90 dark:bg-[#121215]/95 border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 backdrop-blur-2xl transition-all">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/40 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center uppercase shrink-0 text-base border border-indigo-200/80 dark:border-indigo-800/50 backdrop-blur-md">
              {sender.fromName.charAt(0) || 'M'}
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {sender.fromName}
                </h2>
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-white/10">
                  {sender.fromEmail}
                </span>
                {isJobRelated ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100/90 dark:bg-sky-950/90 text-sky-800 dark:text-sky-300 border border-sky-300/80 dark:border-sky-500/60 shadow-xs">
                    <Briefcase className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    Job Alert
                  </span>
                ) : isHighPriority ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/60">
                    <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    High AI Priority
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60">
                    <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Low Priority
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                <span>
                  Subject: <strong className="text-slate-800 dark:text-zinc-200">{sender.sampleSubject}</strong>
                </span>
                <span>•</span>
                <span>{sender.totalEmails} total emails received</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Selector & Display Controls Bar */}
        <div className="px-5 py-3 border-b border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0 backdrop-blur-md">
          {/* Message Index Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 dark:text-zinc-400 font-medium">Message:</span>
            {totalMessages > 1 ? (
              <select
                value={selectedMsgIndex}
                onChange={(e) => setSelectedMsgIndex(Number(e.target.value))}
                className="glass-input px-3 py-1 rounded-xl text-xs font-medium focus:outline-none"
              >
                {sender.messageIds.map((msgId, idx) => (
                  <option key={msgId} value={idx}>
                    Message #{idx + 1} ({idx === 0 ? 'Latest' : `Older #${idx + 1}`})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl">
                1 of 1 (Latest Email)
              </span>
            )}
            <span className="text-slate-400 dark:text-zinc-500 text-[11px] ml-1">
              Received: {previewData?.date || sender.latestDate}
            </span>
          </div>

          {/* View Format Tabs */}
          <div className="flex items-center space-x-1 p-1 rounded-full bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-white/10">
            <button
              onClick={() => setActiveTab('rendered')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'rendered'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>HTML Render</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Plain Text</span>
            </button>
            <button
              onClick={() => setActiveTab('headers')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'headers'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Headers & AI Details</span>
            </button>
          </div>
        </div>

        {/* Content Preview Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/40 dark:bg-zinc-950/40 min-h-[360px] max-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-zinc-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm font-semibold">Loading full email message preview...</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Decoding HTML body & headers from Gmail</p>
            </div>
          ) : fetchError ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Error loading message body</p>
                <p className="text-xs mt-0.5">{fetchError}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tab 1: Interactive Formatted HTML View */}
              {activeTab === 'rendered' && (
                <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
                  {previewData?.htmlBody ? (
                    <iframe
                      title="Full Email Preview"
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="utf-8"/>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                            <style>
                              body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; background-color: #ffffff; }
                              img { max-width: 100%; height: auto; }
                              a { color: #4f46e5; text-decoration: underline; }
                            </style>
                          </head>
                          <body>
                            ${previewData.htmlBody}
                          </body>
                        </html>
                      `}
                      className="w-full min-h-[400px] h-[450px] border-0"
                      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                    />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-zinc-400 text-sm">
                      No HTML body available for this email. Check Plain Text tab.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Plain Text View */}
              {activeTab === 'text' && (
                <div className="w-full bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200 whitespace-pre-wrap overflow-x-auto shadow-xs">
                  {previewData?.textBody || sender.sampleSnippet || 'No plain text content body available.'}
                </div>
              )}

              {/* Tab 3: Headers & AI Analysis */}
              {activeTab === 'headers' && (
                <div className="space-y-6">
                  {/* AI Evaluation Diagnostics */}
                  <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Gemini AI Evaluation Diagnostics
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">
                        Score: {analysis?.recommendationScore ?? 85}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                        <span className="text-slate-500 dark:text-zinc-400 block mb-0.5 font-medium">Category</span>
                        <span className="font-bold text-slate-900 dark:text-white">{analysis?.category || 'Subscription Email'}</span>
                      </div>
                      <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                        <span className="text-slate-500 dark:text-zinc-400 block mb-0.5 font-medium">AI Recommendation</span>
                        <span className="font-bold text-slate-900 dark:text-white">{analysis?.summary || 'Review for unsubscribe'}</span>
                      </div>
                    </div>

                    {analysis?.safetyWarning && (
                      <div className="p-3 rounded-xl bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <span><strong>Safety Notice:</strong> {analysis.safetyWarning}</span>
                      </div>
                    )}
                  </div>

                  {/* Gmail Headers Breakdown */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      Technical Email Headers
                    </h3>
                    <div className="space-y-2 font-mono text-xs">
                      {previewData?.headers ? (
                        Object.entries(previewData.headers).map(([key, val]) => (
                          <div key={key} className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-zinc-800/80 pb-1.5 gap-1">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 sm:w-40 shrink-0">{key}:</span>
                            <span className="text-slate-700 dark:text-zinc-300 break-all">{val}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500">No header details parsed.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Action Footer Bar */}
        <div className="p-5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0 backdrop-blur-md">
          <div className="flex items-center flex-wrap gap-2">
            {/* Primary Action: Unsubscribe */}
            {isUnsubscribed ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 text-xs font-semibold border border-emerald-300/80 dark:border-emerald-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Unsubscribed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onUnsubscribe(sender)}
                disabled={isUnsubscribing}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isUnsubscribing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Unsubscribing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Unsubscribe Sender</span>
                  </>
                )}
              </button>
            )}

            {/* Trash Action */}
            <button
              type="button"
              onClick={() => onCleanup(sender, 'trash')}
              disabled={isCleaning || isCleaned}
              className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-medium border transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                isCleaned
                  ? 'bg-slate-100/50 dark:bg-zinc-900/50 text-slate-400 dark:text-zinc-600 border-slate-200/50 dark:border-zinc-800/50 cursor-not-allowed'
                  : 'bg-white/80 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-white/10 hover:bg-rose-50/80 hover:text-rose-700 hover:border-rose-300'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isCleaned ? 'In Trash' : `Move ${sender.totalEmails} Emails to Trash`}</span>
            </button>

            {/* Archive Action */}
            <button
              type="button"
              onClick={() => onCleanup(sender, 'archive')}
              disabled={isCleaning || isCleaned}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive All</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Copy Gmail Filter */}
            <button
              type="button"
              onClick={copyGmailFilter}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full glass-pill text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all cursor-pointer active:scale-95"
              title="Copy search query to block this email in Gmail"
            >
              {copiedFilter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFilter ? 'Filter Copied!' : 'Copy Gmail Filter'}</span>
            </button>

            {/* Direct Web Unsubscribe or Gmail Link */}
            {sender.unsubscribeUrl && (
              <a
                href={sender.unsubscribeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100 text-xs font-medium transition-all"
              >
                <span>Direct Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

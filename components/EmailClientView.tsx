'use client';

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Star,
  Send,
  Trash2,
  AlertCircle,
  Archive,
  RefreshCw,
  Search,
  Sparkles,
  PenSquare,
  Mail,
  MailOpen,
  Tag,
  Paperclip,
  ExternalLink,
  Wand2,
  Reply,
  ShieldCheck,
  CheckCircle2,
  Filter,
  SlidersHorizontal,
  ArrowLeft,
  Menu,
  X,
  Folder,
  ChevronLeft,
  ChevronRight,
  Clock,
  Bookmark,
  FileText,
  AlertOctagon,
  Bell,
  Users,
  MessageSquare,
  Newspaper,
  Briefcase,
} from 'lucide-react';
import { ComposeModal } from '@/components/ComposeModal';
import { EmailPreviewModal } from '@/components/EmailPreviewModal';
import { SafeEmailPreview } from '@/components/SafeEmailPreview';
import { EmailMessageSummary } from '@/app/api/gmail/messages/route';
import { EmailPreviewResponse } from '@/app/api/gmail/preview/route';
import { useToast } from '@/components/Toast';

interface EmailClientViewProps {
  token: string | null;
  onOpenUnsubscribeCenter: () => void;
  onConnectGmail?: () => void;
}

export const EmailClientView: React.FC<EmailClientViewProps> = ({
  token,
  onOpenUnsubscribeCenter,
  onConnectGmail,
}) => {
  const { toast } = useToast();
  const [currentFolder, setCurrentFolder] = useState<string>('INBOX');
  const [messages, setMessages] = useState<EmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveConnection, setIsLiveConnection] = useState(false);

  // Backend Discrete Page Pagination state
  const [pageTokens, setPageTokens] = useState<string[]>(['']); // Token history stack: index 0 is Page 1 ('')
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [resultSizeEstimate, setResultSizeEstimate] = useState<number | null>(null);

  // Modals & Mobile Nav
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isMobileFolderOpen, setIsMobileFolderOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState<{
    to?: string;
    subject?: string;
    body?: string;
    threadId?: string;
  }>({});

  // Thread Reading details
  const [fullMessageContent, setFullMessageContent] = useState<string | null>(null);
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewResponse | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [readingViewMode, setReadingViewMode] = useState<'html' | 'text' | 'headers'>('html');

  // AI Summary state for currently open message
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Inline Quick Reply
  const [quickReplyText, setQuickReplyText] = useState('');
  const [isQuickReplying, setIsQuickReplying] = useState(false);
  const [isAiDraftingReply, setIsAiDraftingReply] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);

  const handleSelectMessage = React.useCallback(async (msg: EmailMessageSummary) => {
    setSelectedMessage(msg);
    setAiSummary(null);
    setQuickReplyText('');
    setEmailPreviewData(null);
    setIsReplyExpanded(false);

    // Mark read locally
    if (msg.isUnread) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isUnread: false } : m)));
      fetch('/api/gmail/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ messageId: msg.id, action: 'markRead' }),
      });
    }

    // Fetch full body content & headers
    setIsLoadingContent(true);
    try {
      const fromName = msg.from.split('<')[0].replace(/"/g, '').trim() || msg.from;
      const fromEmail = msg.from.match(/<([^>]+)>/)?.[1] || msg.from;

      const res = await fetch('/api/gmail/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          messageId: msg.id,
          fromName,
          fromEmail,
          subject: msg.subject,
          snippet: msg.snippet,
          date: msg.date,
        }),
      });

      const data: EmailPreviewResponse = await res.json();
      setEmailPreviewData(data);
      setFullMessageContent(data.htmlBody || data.textBody || msg.snippet);
    } catch {
      setFullMessageContent(msg.snippet);
    } finally {
      setIsLoadingContent(false);
    }
  }, [token]);

  // Fetch discrete page of messages from API
  const loadPage = React.useCallback(
    async (
      targetToken = '',
      targetIndex = 0,
      folder = currentFolder,
      query = searchQuery
    ) => {
      setIsLoadingPage(true);
      if (targetIndex === 0) {
        setIsLoading(true);
        setPageTokens(['']);
        setNextPageToken(null);
      }

      try {
        const res = await fetch('/api/gmail/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            folder,
            q: query,
            pageToken: targetToken,
            maxResults: 20,
          }),
        });
        const data = await res.json();
        if (data.success) {
          const fetched: EmailMessageSummary[] = data.messages || [];
          setMessages(fetched); // Replace message list for discrete clean pagination!
          setNextPageToken(data.nextPageToken || null);
          setCurrentPageIndex(targetIndex);
          if (typeof data.resultSizeEstimate === 'number') {
            setResultSizeEstimate(data.resultSizeEstimate);
          }
          setIsLiveConnection(data.isLive || false);
          if (fetched.length > 0) {
            handleSelectMessage(fetched[0]);
          } else {
            setSelectedMessage(null);
          }
        }
      } catch (err: any) {
        console.warn('Failed to load page:', err?.message);
      } finally {
        setIsLoadingPage(false);
        setIsLoading(false);
      }
    },
    [currentFolder, searchQuery, token, handleSelectMessage]
  );

  const fetchMessages = React.useCallback(
    (folder = currentFolder, query = searchQuery) => {
      loadPage('', 0, folder, query);
    },
    [currentFolder, searchQuery, loadPage]
  );

  const handleNextPage = React.useCallback(() => {
    if (!nextPageToken || isLoadingPage || isLoading) return;
    const nextIndex = currentPageIndex + 1;
    const updatedTokens = [...pageTokens];
    updatedTokens[nextIndex] = nextPageToken;
    setPageTokens(updatedTokens);
    loadPage(nextPageToken, nextIndex);
  }, [nextPageToken, isLoadingPage, isLoading, currentPageIndex, pageTokens, loadPage]);

  const handlePrevPage = React.useCallback(() => {
    if (currentPageIndex <= 0 || isLoadingPage || isLoading) return;
    const prevIndex = currentPageIndex - 1;
    const prevToken = pageTokens[prevIndex] || '';
    loadPage(prevToken, prevIndex);
  }, [currentPageIndex, isLoadingPage, isLoading, pageTokens, loadPage]);

  useEffect(() => {
    let isCancelled = false;
    async function initLoad() {
      setIsLoadingPage(true);
      setIsLoading(true);
      try {
        const res = await fetch('/api/gmail/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            folder: currentFolder,
            q: searchQuery,
            pageToken: '',
            maxResults: 20,
          }),
        });
        const data = await res.json();
        if (!isCancelled && data.success) {
          const fetched: EmailMessageSummary[] = data.messages || [];
          setMessages(fetched);
          setPageTokens(['']);
          setCurrentPageIndex(0);
          setNextPageToken(data.nextPageToken || null);
          if (typeof data.resultSizeEstimate === 'number') {
            setResultSizeEstimate(data.resultSizeEstimate);
          }
          setIsLiveConnection(data.isLive || false);
          if (fetched.length > 0) {
            handleSelectMessage(fetched[0]);
          } else {
            setSelectedMessage(null);
          }
        }
      } catch (err: any) {
        console.warn('Failed to initial load page:', err?.message);
      } finally {
        if (!isCancelled) {
          setIsLoadingPage(false);
          setIsLoading(false);
        }
      }
    }
    initLoad();
    return () => {
      isCancelled = true;
    };
  }, [currentFolder, searchQuery, token, handleSelectMessage]);

  const handleToggleStar = async (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    const newStarred = !msg.isStarred;
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, isStarred: newStarred } : m)));

    await fetch('/api/gmail/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        messageId: msgId,
        action: newStarred ? 'star' : 'unstar',
      }),
    });
  };

  const handleArchive = async (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(null);
    }
    toast.success('Conversation archived');

    await fetch('/api/gmail/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ messageId: msgId, action: 'archive' }),
    });
  };

  const handleTrash = async (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(null);
    }
    toast.info('Moved to Trash');

    await fetch('/api/gmail/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ messageId: msgId, action: 'trash' }),
    });
  };

  // Generate 2-sentence human summary
  const handleSummarizeThread = async () => {
    if (!selectedMessage) return;
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new',
          prompt: `Summarize this email in exactly 2 clear bullet points without fluff, greeting, or robotic filler. Key points only:\n\nSubject: ${selectedMessage.subject}\nBody: ${fullMessageContent || selectedMessage.snippet}`,
          tone: 'direct',
          length: 'short',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSummary(data.body);
      }
    } catch {
      toast.error('Could not summarize thread');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Anti-AI Quick Reply Generation
  const handleGenerateAiReply = async (tone: 'direct' | 'warm' | 'casual' | 'polite_decline') => {
    if (!selectedMessage) return;
    setIsReplyExpanded(true);
    setIsAiDraftingReply(true);

    try {
      const res = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reply',
          originalEmail: {
            from: selectedMessage.from,
            subject: selectedMessage.subject,
            body: fullMessageContent || selectedMessage.snippet,
            date: selectedMessage.date,
          },
          tone,
          length: 'short',
        }),
      });
      const data = await res.json();
      if (data.success && data.body) {
        setQuickReplyText(data.body);
        toast.success('Natural reply drafted');
      }
    } catch {
      toast.error('Failed to generate reply');
    } finally {
      setIsAiDraftingReply(false);
    }
  };

  // Send Quick Reply
  const handleSendQuickReply = async () => {
    if (!selectedMessage || !quickReplyText.trim()) return;
    setIsQuickReplying(true);

    try {
      const recipientMatch = selectedMessage.from.match(/<([^>]+)>/) || [null, selectedMessage.from];
      const toEmail = recipientMatch[1] || selectedMessage.from;

      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          to: toEmail,
          subject: selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
          body: quickReplyText,
          threadId: selectedMessage.threadId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Reply sent successfully');
        setQuickReplyText('');
      } else {
        toast.error(data.error || 'Failed to send reply');
      }
    } catch (err: any) {
      toast.error('Error sending reply');
    } finally {
      setIsQuickReplying(false);
    }
  };

  const handle1ClickUnsubscribe = async () => {
    if (!selectedMessage?.unsubscribeHeader) return;
    const { postUrl, mailto, webUrl } = selectedMessage.unsubscribeHeader;

    try {
      if (postUrl) {
        const res = await fetch('/api/gmail/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            postUrl,
            senderKey: selectedMessage.from,
          }),
        });
        const d = await res.json();
        if (d.success) {
          toast.success('1-Click RFC 8058 Unsubscribe request sent!');
          return;
        }
      }

      if (webUrl) {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
        toast.info('Opened provider unsubscribe link');
      } else if (mailto) {
        window.location.href = mailto;
      }
    } catch {
      toast.error('Unsubscribe failed');
    }
  };

  if (!token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#070709] min-h-[calc(100vh-4rem)]">
        <div className="max-w-md w-full bg-white dark:bg-[#0c0c0e] rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-2xl text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Connect Your Gmail Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Authenticate via Google OAuth to load your real-time Gmail inbox, read email threads, compose responses with AI assist, and execute 1-click subscription cleanups.
            </p>
          </div>

          <button
            type="button"
            onClick={onConnectGmail}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-3 transition-all cursor-pointer active:scale-98"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span className="text-white font-bold">Connect with Google Gmail</span>
          </button>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-center space-x-2 text-[11px] text-slate-400 dark:text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% Client-Side OAuth • Zero Data Retention</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-[#070709] relative">
      
      {/* Mobile Folder Drawer Backdrop & Sheet */}
      {isMobileFolderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex">
          <div className="w-72 max-w-[80vw] bg-white dark:bg-[#0c0c0e] h-full flex flex-col justify-between p-4 shadow-2xl">
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 shrink-0">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-indigo-500" />
                  <span>Mailboxes</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileFolderOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Compose Button in Mobile Drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileFolderOpen(false);
                  setComposeInitialData({});
                  setIsComposeOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-md shrink-0"
              >
                <PenSquare className="w-4 h-4" />
                <span>Compose Email</span>
              </button>

              {/* Folder list */}
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col space-y-1 overscroll-contain scrollbar-thin pr-1">
                {[
                  { id: 'INBOX', label: 'Inbox', icon: Inbox, count: messages.filter((m) => m.isUnread).length },
                  { id: 'STARRED', label: 'Starred', icon: Star },
                  { id: 'UNREAD', label: 'Unread Only', icon: Mail },
                  { id: 'PROMOTIONS', label: 'Promotions', icon: Tag },
                  { id: 'SENT', label: 'Sent', icon: Send },
                  { id: 'TRASH', label: 'Trash', icon: Trash2 },
                ].map((folder) => {
                  const Icon = folder.icon;
                  const isActive = currentFolder === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setCurrentFolder(folder.id);
                        setIsMobileFolderOpen(false);
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        <span>{folder.label}</span>
                      </div>
                      {typeof folder.count === 'number' && folder.count > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                          {folder.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setIsMobileFolderOpen(false);
                onOpenUnsubscribeCenter();
              }}
              className="mt-4 shrink-0 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40"
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Unsubscribe Center</span>
            </button>
          </div>
          <div className="flex-1" onClick={() => setIsMobileFolderOpen(false)} />
        </div>
      )}

      {/* 3-Pane Adaptive Frame - Independent dynamic scrolling for each column */}
      <div className="flex-1 min-h-0 w-full h-full flex overflow-hidden">
        
        {/* PANE 1: Desktop Navigation & Folders (Independent dynamic scroll) */}
        <aside className="hidden lg:flex lg:w-52 xl:w-60 shrink-0 h-full bg-white/80 dark:bg-[#0c0c0e]/90 border-r border-slate-200/80 dark:border-white/10 flex-col overflow-hidden select-none">
          {/* Primary Compose Button */}
          <div className="p-3 pb-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setComposeInitialData({});
                setIsComposeOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
            >
              <PenSquare className="w-4 h-4" />
              <span>Compose Email</span>
            </button>
          </div>

          {/* Main Mailboxes scrollable list */}
          <div className="flex-1 min-h-0 column-scroll px-3 py-2 space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-3 mb-1 block">
              Mailboxes
            </span>

            {[
              { id: 'INBOX', label: 'Inbox', icon: Inbox, count: messages.filter((m) => m.isUnread).length },
              { id: 'STARRED', label: 'Starred', icon: Star },
              { id: 'SNOOZED', label: 'Snoozed', icon: Clock },
              { id: 'IMPORTANT', label: 'Important', icon: Bookmark },
              { id: 'SENT', label: 'Sent', icon: Send },
              { id: 'DRAFTS', label: 'Drafts', icon: FileText },
              { id: 'ALL_MAIL', label: 'All Mail', icon: Mail },
              { id: 'UNREAD', label: 'Unread Only', icon: MailOpen },
              { id: 'TRASH', label: 'Trash', icon: Trash2 },
              { id: 'SPAM', label: 'Spam', icon: AlertOctagon },
            ].map((folder) => {
              const Icon = folder.icon;
              const isActive = currentFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{folder.label}</span>
                  </div>
                  {typeof folder.count === 'number' && folder.count > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white shrink-0 ml-1">
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Categories Section */}
            <div className="pt-3">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-3 mb-1 block">
                Categories
              </span>
              {[
                { id: 'PROMOTIONS', label: 'Promotions', icon: Tag, color: 'text-amber-500' },
                { id: 'UPDATES', label: 'Updates', icon: Bell, color: 'text-blue-500' },
                { id: 'SOCIAL', label: 'Social', icon: Users, color: 'text-purple-500' },
                { id: 'FORUMS', label: 'Forums', icon: MessageSquare, color: 'text-emerald-500' },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = currentFolder === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCurrentFolder(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : cat.color}`} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Smart Labels Section */}
            <div className="pt-3">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-3 mb-1 block">
                Smart Views
              </span>
              {[
                { id: 'NEWSLETTERS', label: 'Newsletters', icon: Newspaper, color: 'text-rose-500' },
                { id: 'JOB_ALERTS', label: 'Job Alerts', icon: Briefcase, color: 'text-indigo-500' },
              ].map((lbl) => {
                const Icon = lbl.icon;
                const isActive = currentFolder === lbl.id;
                return (
                  <button
                    key={lbl.id}
                    onClick={() => setCurrentFolder(lbl.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : lbl.color}`} />
                      <span className="truncate">{lbl.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Tools section */}
          <div className="p-3 pt-2 border-t border-slate-200/80 dark:border-white/10 flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-3">
              Power Tools
            </span>
            <button
              onClick={onOpenUnsubscribeCenter}
              className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border border-rose-200/50 dark:border-rose-900/30"
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Unsubscribe Center</span>
            </button>
          </div>
        </aside>

        {/* PANE 2: Message Stream List (Independent dynamic scroll) */}
        <section
          className={`bg-white dark:bg-[#09090b] border-r border-slate-200/80 dark:border-white/10 flex flex-col h-full overflow-hidden min-h-0 ${
            selectedMessage ? 'hidden md:flex md:w-72 lg:w-80 xl:w-96 shrink-0' : 'w-full md:w-72 lg:w-80 xl:w-96 shrink-0'
          }`}
        >
          {/* Stream Search Bar & Mobile Folder Toggle */}
          <div className="p-2.5 sm:p-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileFolderOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
              title="Open Folders"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMessages(currentFolder, searchQuery)}
                placeholder="Search mail or sender..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200/80 dark:border-white/10 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <button
              onClick={() => fetchMessages(currentFolder, searchQuery)}
              title="Refresh Inbox"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Quick Folder Horizontal Scroll Pills on Mobile/Tablet (< lg) */}
          <div className="lg:hidden px-3 py-2 bg-slate-50/80 dark:bg-zinc-900/40 border-b border-slate-200/60 dark:border-white/5 flex items-center space-x-1.5 overflow-x-auto scrollbar-none text-xs shrink-0">
            {['INBOX', 'STARRED', 'UNREAD', 'PROMOTIONS', 'SENT'].map((f) => (
              <button
                key={f}
                onClick={() => setCurrentFolder(f)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  currentFolder === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Email Items List - Scrollable independently */}
          <div className="flex-1 min-h-0 column-scroll divide-y divide-slate-100 dark:divide-white/5">
            {messages.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                <Inbox className="w-8 h-8 mb-2 stroke-1" />
                <p className="text-xs font-medium">No messages found in this folder</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 cursor-pointer transition-colors relative flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-3 border-indigo-600 dark:border-indigo-400'
                        : msg.isUnread
                        ? 'bg-white dark:bg-[#0c0c0e] hover:bg-slate-50 dark:hover:bg-zinc-900/60'
                        : 'bg-slate-50/40 dark:bg-[#08080a] hover:bg-slate-100/60 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Top row: Sender & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {msg.isUnread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            msg.isUnread
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'font-medium text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          {msg.from.split('<')[0].replace(/"/g, '').trim()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">{msg.date}</span>
                    </div>

                    {/* Subject line */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs line-clamp-1 ${
                          msg.isUnread
                            ? 'font-semibold text-slate-900 dark:text-slate-100'
                            : 'font-normal text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {msg.subject}
                      </span>
                      <button
                        onClick={(e) => handleToggleStar(e, msg.id)}
                        className="text-slate-300 hover:text-amber-400 transition-colors shrink-0"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            msg.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-zinc-600'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Snippet */}
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                      {msg.snippet}
                    </p>

                    {/* Header tags / Unsub badge */}
                    {msg.unsubscribeHeader?.hasHeader && (
                      <div className="mt-1 flex items-center">
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
                          Subscription Detected
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Discrete Page-by-Page Navigation Footer */}
          <div className="p-2.5 sm:p-3 bg-slate-50/90 dark:bg-[#0c0c0e]/90 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0 || isLoadingPage || isLoading}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Prev</span>
            </button>

            <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <span>Page {currentPageIndex + 1}</span>
              {isLoadingPage && (
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!nextPageToken || isLoadingPage || isLoading}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </section>

        {/* PANE 3: Reading, AI Actions, & Minimalist Composer */}
        <main
          className={`flex-1 min-w-0 bg-white dark:bg-[#09090b] flex flex-col h-full max-h-full overflow-hidden min-h-0 ${
            selectedMessage ? 'flex w-full min-w-0' : 'hidden md:flex min-w-0'
          }`}
        >
          {selectedMessage ? (
            <div className="flex-1 flex flex-col h-full max-h-full overflow-hidden min-h-0">
              {/* Clean Minimalist Reading Header */}
              <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md shrink-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="md:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 shrink-0 cursor-pointer"
                    title="Back to inbox"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate tracking-tight">
                      {selectedMessage.subject || '(No Subject)'}
                    </h1>
                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 dark:text-zinc-400 truncate">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {selectedMessage.from}
                      </span>
                      <span>•</span>
                      <span className="shrink-0">{selectedMessage.date}</span>
                    </div>
                  </div>
                </div>

                {/* Clean Actions on Right */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* 1-Click Unsubscribe button */}
                  {selectedMessage.unsubscribeHeader?.hasHeader && (
                    <button
                      onClick={handle1ClickUnsubscribe}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200/80 dark:border-rose-900/40 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-all"
                      title="1-Click List-Unsubscribe"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                      <span className="hidden sm:inline">Unsubscribe</span>
                    </button>
                  )}

                  {/* AI Summary Button */}
                  <button
                    onClick={handleSummarizeThread}
                    disabled={isSummarizing}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      aiSummary
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800'
                    }`}
                    title="AI 2-bullet summary"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="hidden sm:inline">{isSummarizing ? 'Summarizing...' : 'Summary'}</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

                  {/* Mode toggle (Rich / Text / Headers) */}
                  <div className="hidden sm:flex items-center bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                    <button
                      onClick={() => setReadingViewMode('html')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                        readingViewMode === 'html'
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                      }`}
                      title="Rendered HTML"
                    >
                      HTML
                    </button>
                    <button
                      onClick={() => setReadingViewMode('text')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                        readingViewMode === 'text'
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                      }`}
                      title="Plain Text"
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setReadingViewMode('headers')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                        readingViewMode === 'headers'
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                      }`}
                      title="Headers & Security"
                    >
                      Headers
                    </button>
                  </div>

                  {/* Star */}
                  <button
                    onClick={(e) => handleToggleStar(e, selectedMessage.id)}
                    title={selectedMessage.isStarred ? 'Unstar' : 'Star'}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedMessage.isStarred ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Archive */}
                  <button
                    onClick={() => handleArchive(selectedMessage.id)}
                    title="Archive"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  {/* Trash */}
                  <button
                    onClick={() => handleTrash(selectedMessage.id)}
                    title="Move to Trash"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Summary Banner (if active) */}
              {aiSummary && (
                <div className="px-5 py-3 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-950 dark:text-indigo-200 flex items-start justify-between gap-3 shrink-0">
                  <div className="flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="whitespace-pre-line leading-relaxed font-sans font-medium">{aiSummary}</div>
                  </div>
                  <button
                    onClick={() => setAiSummary(null)}
                    className="p-1 rounded-md text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 cursor-pointer shrink-0"
                    title="Dismiss Summary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Email Content Body Pane with Full Flow Reading */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent">
                <SafeEmailPreview
                  emailData={emailPreviewData}
                  rawSnippet={selectedMessage.snippet}
                  isLoading={isLoadingContent}
                  viewMode={readingViewMode}
                />
              </div>

              {/* Sleek Collapsible Bottom Reply Bar */}
              <div className="border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0a0a0c] shrink-0 transition-all">
                {!isReplyExpanded ? (
                  /* Collapsed Minimalist Trigger Bar */
                  <div className="px-5 py-3 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setIsReplyExpanded(true)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-zinc-900 hover:bg-slate-200/70 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-zinc-400 flex items-center space-x-2 cursor-pointer transition-colors text-left"
                    >
                      <Reply className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Reply to {selectedMessage.from.split('<')[0].trim()}...</span>
                    </button>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setIsReplyExpanded(true);
                          handleGenerateAiReply('direct');
                        }}
                        disabled={isAiDraftingReply}
                        className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center space-x-1.5 border border-indigo-200/60 dark:border-indigo-900/40 cursor-pointer transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">AI Draft</span>
                      </button>

                      <button
                        onClick={() => {
                          setComposeInitialData({
                            to: selectedMessage.from,
                            subject: selectedMessage.subject.startsWith('Re:')
                              ? selectedMessage.subject
                              : `Re: ${selectedMessage.subject}`,
                            body: '',
                            threadId: selectedMessage.threadId,
                          });
                          setIsComposeOpen(true);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Open in full composer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Expanded Clean Reply Composer */
                  <div className="p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <div className="flex items-center space-x-1.5 font-medium truncate">
                        <Reply className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">Replying to {selectedMessage.from.split('<')[0].trim()}</span>
                      </div>

                      {/* AI Tone Pills in context */}
                      <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
                        <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">AI Tone:</span>
                        {(['direct', 'warm', 'casual', 'polite_decline'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => handleGenerateAiReply(t)}
                            disabled={isAiDraftingReply}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[11px] font-medium text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 border border-slate-200/60 dark:border-zinc-700 shadow-2xs cursor-pointer transition-all"
                          >
                            {t === 'direct' ? 'Direct' : t === 'warm' ? 'Warm' : t === 'casual' ? 'Casual' : 'Decline'}
                          </button>
                        ))}

                        <button
                          onClick={() => {
                            setComposeInitialData({
                              to: selectedMessage.from,
                              subject: selectedMessage.subject.startsWith('Re:')
                                ? selectedMessage.subject
                                : `Re: ${selectedMessage.subject}`,
                              body: quickReplyText,
                              threadId: selectedMessage.threadId,
                            });
                            setIsComposeOpen(true);
                          }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-2 cursor-pointer hidden md:inline shrink-0"
                        >
                          Full Composer
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={quickReplyText}
                      onChange={(e) => setQuickReplyText(e.target.value)}
                      placeholder="Type your response or pick an AI tone above..."
                      rows={3}
                      autoFocus
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed transition-all"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setIsReplyExpanded(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSendQuickReply}
                        disabled={isQuickReplying || !quickReplyText.trim()}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all cursor-pointer"
                      >
                        {isQuickReplying ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-zinc-500">
              <MailOpen className="w-12 h-12 mb-3 stroke-1 text-slate-300 dark:text-zinc-600" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No message selected</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-sm">
                Select an email from the list to read with smooth full-height flow, generate quick replies, or 1-click unsubscribe.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button for Mobile Compose */}
      <button
        type="button"
        onClick={() => {
          setComposeInitialData({});
          setIsComposeOpen(true);
        }}
        className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        title="Compose New Email"
      >
        <PenSquare className="w-5 h-5" />
      </button>

      {/* Floating Full Composer Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        initialTo={composeInitialData.to}
        initialSubject={composeInitialData.subject}
        initialBody={composeInitialData.body}
        threadId={composeInitialData.threadId}
        token={token}
        onEmailSent={() => {
          toast.success('Email sent successfully');
          fetchMessages();
        }}
      />
    </div>
  );
};

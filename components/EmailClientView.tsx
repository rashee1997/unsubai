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
} from 'lucide-react';
import { ComposeModal } from '@/components/ComposeModal';
import { EmailPreviewModal } from '@/components/EmailPreviewModal';
import { EmailMessageSummary } from '@/app/api/gmail/messages/route';
import { useToast } from '@/components/Toast';

interface EmailClientViewProps {
  token: string | null;
  onOpenUnsubscribeCenter: () => void;
}

export const EmailClientView: React.FC<EmailClientViewProps> = ({ token, onOpenUnsubscribeCenter }) => {
  const { toast } = useToast();
  const [currentFolder, setCurrentFolder] = useState<string>('INBOX');
  const [messages, setMessages] = useState<EmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveConnection, setIsLiveConnection] = useState(false);

  // Modals & Composer
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState<{
    to?: string;
    subject?: string;
    body?: string;
    threadId?: string;
  }>({});

  // Thread Reading details
  const [fullMessageContent, setFullMessageContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // AI Summary state for currently open message
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Inline Quick Reply
  const [quickReplyText, setQuickReplyText] = useState('');
  const [isQuickReplying, setIsQuickReplying] = useState(false);
  const [isAiDraftingReply, setIsAiDraftingReply] = useState(false);

  const handleSelectMessage = React.useCallback(async (msg: EmailMessageSummary) => {
    setSelectedMessage(msg);
    setAiSummary(null);
    setQuickReplyText('');

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

    // Fetch full body content
    setIsLoadingContent(true);
    try {
      const res = await fetch('/api/gmail/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ messageId: msg.id }),
      });
      const data = await res.json();
      if (data.success) {
        setFullMessageContent(data.html || data.snippet || msg.snippet);
      } else {
        setFullMessageContent(msg.snippet);
      }
    } catch {
      setFullMessageContent(msg.snippet);
    } finally {
      setIsLoadingContent(false);
    }
  }, [token]);

  // Fetch messages from API
  const fetchMessages = React.useCallback(async (folder = currentFolder, query = searchQuery) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gmail/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ folder, q: query }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setIsLiveConnection(data.isLive || false);
        if (data.messages?.length > 0 && !selectedMessage) {
          handleSelectMessage(data.messages[0]);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load messages:', err?.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, searchQuery, token, selectedMessage, handleSelectMessage]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/gmail/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ folder: currentFolder, q: searchQuery }),
        });
        const data = await res.json();
        if (!ignore && data.success) {
          setMessages(data.messages || []);
          setIsLiveConnection(data.isLive || false);
          if (data.messages?.length > 0) {
            handleSelectMessage(data.messages[0]);
          }
        }
      } catch (err: any) {
        console.warn('Failed to load messages:', err?.message);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
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

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 dark:bg-[#070709]">
      {/* 3-Pane Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANE 1: Navigation & Folders */}
        <aside className="w-56 shrink-0 bg-white/80 dark:bg-[#0c0c0e]/90 border-r border-slate-200/80 dark:border-white/10 flex flex-col justify-between p-3 select-none">
          <div className="flex flex-col gap-4">
            {/* Primary Compose Button */}
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

            {/* Main Mailboxes */}
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-3 mb-1">
                Mailboxes
              </span>

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
                    onClick={() => setCurrentFolder(folder.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span>{folder.label}</span>
                    </div>
                    {typeof folder.count === 'number' && folder.count > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Tools section */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-col gap-2">
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

        {/* PANE 2: Message Stream List */}
        <section className="w-80 md:w-96 shrink-0 bg-white dark:bg-[#09090b] border-r border-slate-200/80 dark:border-white/10 flex flex-col">
          {/* Stream Search Bar */}
          <div className="p-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
            <div className="relative flex-1">
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
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Email Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
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
        </section>

        {/* PANE 3: Reading, AI Copilot, & Action Canvas */}
        <main className="flex-1 bg-white dark:bg-[#070709] flex flex-col overflow-hidden">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Reading Header Bar */}
              <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white/70 dark:bg-[#09090b]/80 backdrop-blur-md shrink-0">
                <div className="flex flex-col min-w-0 pr-4">
                  <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {selectedMessage.subject}
                  </h1>
                  <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">
                      From: {selectedMessage.from}
                    </span>
                    <span>•</span>
                    <span>{selectedMessage.date}</span>
                  </div>
                </div>

                {/* Quick actions (Archive, Trash, Star, 1-Click Unsub) */}
                <div className="flex items-center space-x-2 shrink-0">
                  {selectedMessage.unsubscribeHeader?.hasHeader && (
                    <button
                      onClick={handle1ClickUnsubscribe}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200/80 dark:border-rose-900/40 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                      <span>1-Click Unsubscribe</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleArchive(selectedMessage.id)}
                    title="Archive"
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleTrash(selectedMessage.id)}
                    title="Move to Trash"
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Copilot & Summary strip */}
              <div className="px-6 py-2.5 bg-slate-50/80 dark:bg-zinc-900/30 border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>AI Copilot:</span>
                  </span>
                  <button
                    onClick={handleSummarizeThread}
                    disabled={isSummarizing}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    {isSummarizing ? 'Analyzing...' : 'Summarize Thread (2 Bullets)'}
                  </button>
                </div>

                {/* Anti-AI Instant Reply Triggers */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">Draft Human Reply:</span>
                  {(['direct', 'warm', 'casual', 'polite_decline'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleGenerateAiReply(t)}
                      disabled={isAiDraftingReply}
                      className="px-2 py-0.8 rounded-md bg-white dark:bg-zinc-800 text-[11px] font-medium text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-zinc-700 shadow-2xs cursor-pointer"
                    >
                      {t === 'direct' ? 'Direct' : t === 'warm' ? 'Warm' : t === 'casual' ? 'Casual' : 'Decline'}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Summary Banner (if active) */}
              {aiSummary && (
                <div className="px-6 py-3 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-200 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="whitespace-pre-line leading-relaxed font-sans">{aiSummary}</div>
                </div>
              )}

              {/* Email Content Body Pane */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingContent ? (
                  <div className="flex items-center justify-center h-48 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-zinc-200"
                    dangerouslySetInnerHTML={{
                      __html:
                        fullMessageContent && fullMessageContent.includes('<')
                          ? fullMessageContent
                          : `<div style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${
                              fullMessageContent || selectedMessage.snippet
                            }</div>`,
                    }}
                  />
                )}
              </div>

              {/* Inline Quick Reply Box */}
              <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#0a0a0c] shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center space-x-1.5">
                    <Reply className="w-3.5 h-3.5" />
                    <span>Quick Reply to {selectedMessage.from.split('<')[0].trim()}</span>
                  </div>
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
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                  >
                    Open Full Composer
                  </button>
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    value={quickReplyText}
                    onChange={(e) => setQuickReplyText(e.target.value)}
                    placeholder="Type a human reply (or click a tone button above)..."
                    rows={2}
                    className="flex-1 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={handleSendQuickReply}
                    disabled={isQuickReplying || !quickReplyText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    {isQuickReplying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-zinc-500">
              <MailOpen className="w-12 h-12 mb-3 stroke-1" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No message selected</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-sm">
                Select an email from the stream to read, generate human-cadence replies, or 1-click unsubscribe.
              </p>
            </div>
          )}
        </main>
      </div>

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

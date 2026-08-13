'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Sliders,
  Settings,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  Bell,
  HelpCircle,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';
import { GroupedSenderData } from '@/components/SenderCard';
import { AppSettings, CustomFilterRule } from '@/lib/settings';
import { AuditLogEntry } from '@/components/AuditLogModal';

export interface PendingToolCall {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  functionCalls?: any[];
  pendingTool?: PendingToolCall;
  isHelpNotification?: boolean;
}

export interface GeminiChatbotProps {
  senders: GroupedSenderData[];
  scanConfig: any;
  settings: AppSettings;
  auditLogs: AuditLogEntry[];
  isConnected: boolean;
  userEmail: string | null;
  hasScanned: boolean;
  // Live CRUD callbacks to app state
  onExecuteUnsubscribe: (senderKeys: string[], autoTrash: boolean) => Promise<void>;
  onExecuteTrash: (senderKeys: string[]) => Promise<void>;
  onUpdatePriority: (senderKey: string, newPriority: 'high' | 'medium' | 'low', isJobRelated?: boolean) => void;
  onAddRule: (rule: Omit<CustomFilterRule, 'id' | 'enabled'>) => void;
  onUpdateScanConfig: (newConfig: any) => void;
  onTriggerScan: () => void;
  onAddProtectedDomain: (domainOrEmail: string) => void;
}

export function GeminiChatbot({
  senders,
  scanConfig,
  settings,
  auditLogs,
  isConnected,
  userEmail,
  hasScanned,
  onExecuteUnsubscribe,
  onExecuteTrash,
  onUpdatePriority,
  onAddRule,
  onUpdateScanConfig,
  onTriggerScan,
  onAddProtectedDomain,
}: GeminiChatbotProps) {
  // Chat Visibility States
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [systemRole, setSystemRole] = useState<'inbox_agent' | 'privacy_expert' | 'strict_cleaner'>('inbox_agent');

  // Auto Trigger & Help Notifications State
  const [showAutoTriggerBanner, setShowAutoTriggerBanner] = useState(false);
  const [autoHelpText, setAutoHelpText] = useState<string | null>(null);
  const [hasDismissedHelp, setHasDismissedHelp] = useState(false);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);

  // Chat History & Inputs
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          role: 'model',
          content: `👋 Hello! I am your **Gemini AI Inbox Agent**. I can search senders, perform CRUD operations, update rules, and unsubscribe from unwanted emails with **human-in-the-loop safety confirmation**.\n\nHow can I help clean or organize your inbox today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [messages.length]);

  // Auto Trigger / Proactive Notification Logic
  useEffect(() => {
    if (!autoTriggerEnabled || hasDismissedHelp) return;

    // Trigger proactive help notification when scan finishes or when user arrives
    if (hasScanned && senders.length > 0) {
      const highPriority = senders.filter((s) => s.analysis?.unsubscribePriority === 'high');
      const jobAlerts = senders.filter((s) => s.analysis?.isJobRelated);

      let text = `💡 **Scan complete!** Found ${senders.length} senders.`;
      if (highPriority.length > 0) {
        text = `🔥 **${highPriority.length} High-Priority newsletters** detected! Click to let me unsubscribe them safely.`;
      } else if (jobAlerts.length > 0) {
        text = `💼 **${jobAlerts.length} Job Alerts protected**. Need me to update filter rules or clean promos?`;
      }

      setAutoHelpText(text);
      setShowAutoTriggerBanner(true);

      // Auto dismiss after 12 seconds if not clicked
      const timer = setTimeout(() => {
        setShowAutoTriggerBanner(false);
      }, 12000);
      return () => clearTimeout(timer);
    } else if (!hasScanned) {
      const timer = setTimeout(() => {
        if (!hasScanned) {
          setAutoHelpText('✨ Need help organizing your Gmail inbox? Open AI chat for agentic CRUD operations!');
          setShowAutoTriggerBanner(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasScanned, senders, autoTriggerEnabled, hasDismissedHelp]);

  // Auto Scroll Chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Execute Read Tools Client-side
  const handleReadToolCall = (toolName: string, args: any): any => {
    switch (toolName) {
      case 'get_inbox_health': {
        const highPriority = senders.filter((s) => s.analysis?.unsubscribePriority === 'high').length;
        const totalUnread = senders.reduce((acc, s) => acc + s.unreadCount, 0);
        const jobAlerts = senders.filter((s) => s.analysis?.isJobRelated).length;
        return {
          totalSendersScanned: senders.length,
          highPriorityUnsubscribes: highPriority,
          jobAlertsPreserved: jobAlerts,
          totalUnreadEmails: totalUnread,
          healthScore: Math.max(10, 100 - highPriority * 5 - totalUnread),
        };
      }

      case 'search_senders': {
        const { query = '', priority = 'all', category = '', domain = '' } = args;
        let results = [...senders];

        if (query) {
          const q = query.toLowerCase();
          results = results.filter(
            (s) =>
              s.fromName.toLowerCase().includes(q) ||
              s.fromEmail.toLowerCase().includes(q) ||
              s.sampleSubject.toLowerCase().includes(q) ||
              (s.analysis?.category && s.analysis.category.toLowerCase().includes(q))
          );
        }

        if (priority !== 'all') {
          if (priority === 'job_alerts') {
            results = results.filter((s) => s.analysis?.isJobRelated);
          } else {
            results = results.filter((s) => s.analysis?.unsubscribePriority === priority);
          }
        }

        if (domain) {
          results = results.filter((s) => s.domain.toLowerCase().includes(domain.toLowerCase()));
        }

        if (category) {
          results = results.filter((s) => s.analysis?.category?.toLowerCase().includes(category.toLowerCase()));
        }

        return {
          matchCount: results.length,
          senders: results.slice(0, 10).map((s) => ({
            fromName: s.fromName,
            fromEmail: s.fromEmail,
            totalEmails: s.totalEmails,
            unreadCount: s.unreadCount,
            priority: s.analysis?.unsubscribePriority,
            category: s.analysis?.category,
            recommendationScore: s.analysis?.recommendationScore,
          })),
        };
      }

      case 'get_audit_logs': {
        return {
          logCount: auditLogs.length,
          recentLogs: auditLogs.slice(0, 8),
        };
      }

      default:
        return { status: 'unknown_tool' };
    }
  };

  // Main Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const queryText = textToSend || inputValue;
    if (!queryText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      // Build conversation history for API
      const historyPayload = messages.concat(userMsg).map((m) => ({
        role: m.role,
        content: m.content,
        functionCalls: m.functionCalls,
      }));

      const contextData = {
        totalSenders: senders.length,
        highPriorityCount: senders.filter((s) => s.analysis?.unsubscribePriority === 'high').length,
        jobAlertsCount: senders.filter((s) => s.analysis?.isJobRelated).length,
        totalUnread: senders.reduce((acc, s) => acc + s.unreadCount, 0),
        scanConfig,
        userEmail,
        unsubscribedCount: auditLogs.filter((a) => a.action === 'unsubscribe').length,
        cleanedMessagesCount: auditLogs.reduce((acc, a) => acc + a.messagesAffected, 0),
      };

      const res = await fetch('/app/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          systemRole,
          context: contextData,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to communicate with Gemini');
      }

      const data = await res.json();
      const assistantText = data.text || '';
      const functionCalls = data.functionCalls;

      // Handle Function Calls (CRUD tools)
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const { name, args } = call;

          // Check if tool is a READ operation (Auto execute) vs WRITE/DELETE operation (HITL required)
          const isReadTool = ['get_inbox_health', 'search_senders', 'get_audit_logs'].includes(name);

          if (isReadTool) {
            // Auto execute read tool
            const toolResult = handleReadToolCall(name, args);

            // Send tool result back to Gemini for final natural language response
            const toolResponseHistory = historyPayload.concat([
              {
                role: 'model',
                content: assistantText,
                functionCalls: [call],
              },
              {
                role: 'function',
                name,
                response: toolResult,
              },
            ] as any);

            const followUpRes = await fetch('/app/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: toolResponseHistory,
                systemRole,
                context: contextData,
              }),
            });

            if (followUpRes.ok) {
              const followUpData = await followUpRes.json();
              setMessages((prev) => [
                ...prev,
                {
                  id: `model-${Date.now()}`,
                  role: 'model',
                  content: followUpData.text || 'Here are the requested details.',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: `model-${Date.now()}`,
                  role: 'model',
                  content: assistantText || 'Fetched requested data.',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }
          } else {
            // WRITE / CRUD Operation -> REQUIRES HUMAN-IN-THE-LOOP CONFIRMATION
            const pendingTool: PendingToolCall = {
              id: `tool-${Date.now()}`,
              name,
              args,
              status: 'pending',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages((prev) => [
              ...prev,
              {
                id: `model-hitl-${Date.now()}`,
                role: 'model',
                content: assistantText || `I need your authorization to perform this CRUD operation on your inbox. Please review below:`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                pendingTool,
              },
            ]);
          }
        }
      } else {
        // Plain Text Response
        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            content: assistantText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `⚠️ Error: ${err.message || 'Unable to connect to Gemini chatbot.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Human-in-the-loop Approval Execution Handler
  const handleApproveTool = async (messageId: string, tool: PendingToolCall) => {
    // Mark pending tool as approved & executing
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.pendingTool
          ? { ...m, pendingTool: { ...m.pendingTool, status: 'approved' } }
          : m
      )
    );

    try {
      const { name, args } = tool;

      if (name === 'unsubscribe_sender') {
        const { senderKeys, autoTrash } = args;
        await onExecuteUnsubscribe(senderKeys, Boolean(autoTrash));
      } else if (name === 'trash_sender_emails') {
        const { senderKeys } = args;
        await onExecuteTrash(senderKeys);
      } else if (name === 'update_sender_priority') {
        const { senderKey, newPriority, isJobRelated } = args;
        onUpdatePriority(senderKey, newPriority, isJobRelated);
      } else if (name === 'add_custom_filter_rule') {
        const { title, description, instruction, category } = args;
        onAddRule({
          title,
          description: description || title,
          instruction,
          category,
        });
      } else if (name === 'add_to_protected_list') {
        const { domainOrEmail } = args;
        onAddProtectedDomain(domainOrEmail);
      } else if (name === 'update_scan_configuration') {
        onUpdateScanConfig(args);
      } else if (name === 'trigger_inbox_scan') {
        onTriggerScan();
      }

      // Update state to executed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.pendingTool
            ? { ...m, pendingTool: { ...m.pendingTool, status: 'executed' } }
            : m
        )
      );

      // Add follow-up confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: `model-confirm-${Date.now()}`,
          role: 'model',
          content: `✅ **Action Confirmed & Executed!** Successfully completed \`${tool.name}\`. Your inbox state and rules have been updated live.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Failed to execute approved tool:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `model-err-${Date.now()}`,
          role: 'model',
          content: `❌ **Execution Error:** ${err.message || 'Failed to execute action.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Human-in-the-loop Rejection Handler
  const handleRejectTool = (messageId: string, tool: PendingToolCall) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.pendingTool
          ? { ...m, pendingTool: { ...m.pendingTool, status: 'rejected' } }
          : m
      )
    );

    setMessages((prev) => [
      ...prev,
      {
        id: `model-cancel-${Date.now()}`,
        role: 'model',
        content: `🚫 **Action Cancelled.** I cancelled the execution of \`${tool.name}\`. No changes were made to your inbox or settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* AUTO TRIGGER / PROACTIVE HELP BUBBLE (BOTTOM-RIGHT CORNER) */}
      {/* ========================================================= */}
      {!isOpen && showAutoTriggerBanner && autoHelpText && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 max-w-xs sm:max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative rounded-2xl bg-white/95 dark:bg-[#18181B]/95 border border-indigo-200 dark:border-indigo-500/30 p-4 shadow-2xl shadow-indigo-500/10 text-slate-900 dark:text-zinc-100 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Gemini AI Assistant
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed">
                    {autoHelpText.replace(/\*\*/g, '')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAutoTriggerBanner(false);
                  setHasDismissedHelp(true);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
                title="Dismiss hint"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Auto-triggered helper</span>
              <button
                onClick={() => {
                  setIsOpen(true);
                  setIsMinimized(false);
                  setShowAutoTriggerBanner(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Open AI Chat</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP AI CHATBOT TRIGGER BUTTON (BOTTOM-RIGHT CORNER)    */}
      {/* ========================================================= */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setShowAutoTriggerBanner(false);
          }}
          className="fixed bottom-6 right-4 sm:right-6 z-50 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30 flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
          title="Open Gemini AI Agent Chat"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-indigo-900"></span>
            </span>
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold tracking-wide uppercase leading-none">AI Assistant</span>
            <span className="text-xs text-indigo-200 font-medium opacity-90 mt-1">Inbox CRUD Agent</span>
          </div>
        </button>
      )}

      {/* ========================================================= */}
      {/* FLOATING EXPANDABLE AI CHAT PANEL (BOTTOM-RIGHT ANCHORED) */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] md:w-[420px] rounded-2xl bg-white/95 dark:bg-[#121215]/95 border border-slate-200 dark:border-zinc-800 shadow-2xl backdrop-blur-2xl transition-all duration-300 flex flex-col overflow-hidden ${
            isMinimized ? 'h-14' : 'h-[540px] sm:h-[580px] max-h-[80vh]'
          }`}
        >
          {/* Chat Panel Header */}
          <div className="px-3.5 py-2.5 bg-slate-900 dark:bg-zinc-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm tracking-tight text-white truncate">Gemini AI Agent</h3>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-medium border border-indigo-500/30 shrink-0">
                    3.6 Flash
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium truncate">Agentic CRUD • Human-in-the-Loop</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Role Preset Selector */}
              <select
                value={systemRole}
                onChange={(e: any) => setSystemRole(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs font-medium px-2 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                title="Switch Agent Persona"
              >
                <option value="inbox_agent">Inbox AI</option>
                <option value="privacy_expert">Safety AI</option>
                <option value="strict_cleaner">Cleaner AI</option>
              </select>

              {/* Minimize / Expand Toggle */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Chat Body (Hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Quick Prompt Recommendation Pills */}
              <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1 shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Prompts:
                </span>

                <button
                  onClick={() => handleSendMessage('Unsubscribe from all high priority marketing newsletters')}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 text-xs font-medium border border-slate-200 dark:border-zinc-700 shrink-0 transition-all cursor-pointer"
                >
                  🔥 Unsubscribe High Priority
                </button>

                <button
                  onClick={() => handleSendMessage('Show all job alerts and recruitment emails')}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 text-xs font-medium border border-slate-200 dark:border-zinc-700 shrink-0 transition-all cursor-pointer"
                >
                  💼 View Job Alerts
                </button>

                <button
                  onClick={() => handleSendMessage('How healthy is my inbox? Give me a full summary')}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 text-xs font-medium border border-slate-200 dark:border-zinc-700 shrink-0 transition-all cursor-pointer"
                >
                  📊 Inbox Health Stats
                </button>

                <button
                  onClick={() => handleSendMessage('Add a rule to protect Substack tech digests')}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 text-xs font-medium border border-slate-200 dark:border-zinc-700 shrink-0 transition-all cursor-pointer"
                >
                  ➕ Protect Substack Rule
                </button>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      {/* User / Model Label */}
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 px-1">
                        {isUser ? (
                          <>
                            <span>You</span>
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                          </>
                        ) : (
                          <>
                            <Bot className="w-3.5 h-3.5 text-indigo-500" />
                            <span>
                              Gemini Agent ({systemRole === 'inbox_agent' ? 'Inbox AI' : systemRole === 'privacy_expert' ? 'Safety AI' : 'Cleaner AI'})
                            </span>
                          </>
                        )}
                        <span className="text-xs font-normal opacity-60">• {msg.timestamp}</span>
                      </div>

                      {/* Text Bubble */}
                      {msg.content && (
                        <div
                          className={`max-w-[90%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                            isUser
                              ? 'bg-indigo-600 text-white rounded-br-xs font-medium shadow-xs'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-xs border border-slate-200/80 dark:border-zinc-700/60'
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}

                      {/* ======================================================= */}
                      {/* HUMAN-IN-THE-LOOP (HITL) CONFIRMATION CARD INLINE IN CHAT */}
                      {/* ======================================================= */}
                      {msg.pendingTool && (
                        <div className="w-full mt-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-slate-900 dark:text-zinc-100 shadow-md space-y-2.5">
                          <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800/60">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300">
                                  Human Confirmation Required
                                </h4>
                                <span className="text-xs font-mono text-amber-700 dark:text-amber-400">
                                  Tool: {msg.pendingTool.name}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase">
                              {msg.pendingTool.status}
                            </span>
                          </div>

                          {/* Action Details */}
                          <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-1 font-mono">
                            <p className="text-slate-800 dark:text-zinc-200 font-sans font-medium text-xs">
                              <strong>Action Impact:</strong> {msg.pendingTool.args?.reason || 'Agent initiated state update.'}
                            </p>

                            {msg.pendingTool.args?.senderKeys && (
                              <div className="text-xs text-slate-600 dark:text-zinc-400">
                                <strong>Target Senders ({msg.pendingTool.args.senderKeys.length}):</strong>
                                <ul className="list-disc list-inside mt-0.5 space-y-0.5 max-h-20 overflow-y-auto font-mono text-xs">
                                  {msg.pendingTool.args.senderKeys.map((key: string) => (
                                    <li key={key} className="truncate">{key}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {msg.pendingTool.args?.title && (
                              <div className="text-xs text-slate-600 dark:text-zinc-400">
                                <strong>Rule Title:</strong> {msg.pendingTool.args.title}
                              </div>
                            )}

                            {msg.pendingTool.args?.domainOrEmail && (
                              <div className="text-xs text-slate-600 dark:text-zinc-400">
                                <strong>Protect Domain/Email:</strong> {msg.pendingTool.args.domainOrEmail}
                              </div>
                            )}
                          </div>

                          {/* Approval / Rejection Buttons */}
                          {msg.pendingTool.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => handleRejectTool(msg.id, msg.pendingTool!)}
                                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Reject</span>
                              </button>

                              <button
                                onClick={() => handleApproveTool(msg.id, msg.pendingTool!)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve & Execute</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-1 text-xs font-bold text-slate-600 dark:text-zinc-400">
                              {msg.pendingTool.status === 'executed' && '✅ Executed successfully'}
                              {msg.pendingTool.status === 'rejected' && '🚫 Cancelled by user'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 text-xs font-medium py-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Gemini AI thinking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-[#121215] border-t border-slate-200 dark:border-zinc-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask Gemini to search, unsubscribe, or add rules..."
                    className="flex-1 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  <span>Press Enter to send</span>
                  <span>Human approval required for actions</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

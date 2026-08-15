'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Mic,
  MicOff,
  Download,
  RotateCcw,
  CheckSquare,
  Square,
  TrendingUp,
  Mail,
  HardDrive,
  Check,
  Eye,
  ExternalLink,
  Layers,
  FileText,
  Activity,
  ArrowRight,
  Shield,
  Star,
  Copy,
  LayoutGrid,
  List,
} from 'lucide-react';
import { GroupedSenderData } from '@/components/SenderCard';
import { AppSettings, CustomFilterRule } from '@/lib/settings';
import { AuditLogEntry } from '@/components/AuditLogModal';
import { FormattedMarkdown } from '@/components/FormattedMarkdown';

export const DEFAULT_DEMO_SENDERS: GroupedSenderData[] = [
  {
    senderKey: 'promotions@shopdeal.com',
    fromName: 'ShopDeal Weekly Flash',
    fromEmail: 'promotions@shopdeal.com',
    domain: 'shopdeal.com',
    totalEmails: 18,
    unreadCount: 16,
    latestDate: 'Yesterday',
    latestTimestamp: Date.now() - 86400000,
    sampleSubject: '⚡ 70% OFF Flash Sale Ends Tonight!',
    sampleSnippet: 'Claim your exclusive promo code DEAL70 on clothing, accessories, and home tech. Unsubscribe link at footer.',
    unsubscribeUrl: 'https://shopdeal.com/unsubscribe?user=demo',
    unsubscribeMailto: 'mailto:unsubscribe@shopdeal.com?subject=Unsubscribe',
    unsubscribePostHeader: 'List-Unsubscribe=One-Click',
    messageIds: ['demo-1', 'demo-2', 'demo-3'],
    unreadMessageIds: ['demo-1', 'demo-2'],
    frequencyHistory: [1, 3, 6, 8],
    frequencyTrend: {
      direction: 'increasing',
      percentChange: 250,
      label: 'Volume Increasing (+250% in last 30d)',
      badgeLabel: '+250% (Rising)',
      sparkline: [1, 3, 6, 8],
      recentCount: 14,
      olderCount: 4,
      breakdownLabels: ['30-23d ago: 1', '22-15d ago: 3', '14-8d ago: 6', 'Last 7d: 8'],
    },
    analysis: {
      senderKey: 'promotions@shopdeal.com',
      unsubscribePriority: 'high',
      recommendationScore: 96,
      category: 'E-Commerce Deals',
      summary: 'High volume marketing promo emails with 16 unopened messages in past 30 days.',
      isSensitive: false,
    },
  },
  {
    senderKey: 'news@techdigestdaily.io',
    fromName: 'Tech Digest Daily',
    fromEmail: 'news@techdigestdaily.io',
    domain: 'techdigestdaily.io',
    totalEmails: 12,
    unreadCount: 10,
    latestDate: '2 days ago',
    latestTimestamp: Date.now() - 172800000,
    sampleSubject: 'Top 10 AI Framework Trends for 2026',
    sampleSnippet: 'Here is your daily round-up of tech news, startup funding, and developer tools. Click to manage preferences.',
    unsubscribeUrl: 'https://techdigestdaily.io/unsub',
    unsubscribeMailto: null,
    unsubscribePostHeader: null,
    messageIds: ['demo-4', 'demo-5'],
    unreadMessageIds: ['demo-4'],
    frequencyHistory: [2, 3, 3, 4],
    frequencyTrend: {
      direction: 'increasing',
      percentChange: 40,
      label: 'Volume Increasing (+40% in last 30d)',
      badgeLabel: '+40% (Rising)',
      sparkline: [2, 3, 3, 4],
      recentCount: 7,
      olderCount: 5,
      breakdownLabels: ['30-23d ago: 2', '22-15d ago: 3', '14-8d ago: 3', 'Last 7d: 4'],
    },
    analysis: {
      senderKey: 'news@techdigestdaily.io',
      unsubscribePriority: 'high',
      recommendationScore: 91,
      category: 'Tech Digest',
      summary: 'Daily newsletter with low open rates (10 unopened emails). Recommended to unsubscribe.',
      isSensitive: false,
    },
  },
  {
    senderKey: 'jobalerts-noreply@linkedin.com',
    fromName: 'LinkedIn Job Alerts',
    fromEmail: 'jobalerts-noreply@linkedin.com',
    domain: 'linkedin.com',
    totalEmails: 14,
    unreadCount: 8,
    latestDate: '3 hours ago',
    latestTimestamp: Date.now() - 10800000,
    sampleSubject: '12 new Senior Full Stack Engineer positions in San Francisco',
    sampleSnippet: 'Recommended jobs matching your profile: Senior Full Stack Engineer at Anthropic, AI Engineer at Google, Tech Lead at Stripe.',
    unsubscribeUrl: 'https://linkedin.com/e/v2/unsubscribe',
    unsubscribeMailto: null,
    unsubscribePostHeader: null,
    messageIds: ['demo-7', 'demo-8'],
    unreadMessageIds: ['demo-7'],
    frequencyHistory: [3, 4, 4, 3],
    frequencyTrend: {
      direction: 'stable',
      percentChange: 0,
      label: 'Steady volume over 30 days',
      badgeLabel: 'Steady',
      sparkline: [3, 4, 4, 3],
      recentCount: 7,
      olderCount: 7,
      breakdownLabels: ['30-23d ago: 3', '22-15d ago: 4', '14-8d ago: 4', 'Last 7d: 3'],
    },
    analysis: {
      senderKey: 'jobalerts-noreply@linkedin.com',
      unsubscribePriority: 'low',
      recommendationScore: 15,
      category: 'Job Alerts & Careers',
      summary: 'Recruitment alert with engineering job openings matching your profile.',
      safetyWarning: 'Job Alert / Career Notification - AI filtered and preserved to protect job opportunities.',
      isSensitive: true,
      isJobRelated: true,
    },
  },
  {
    senderKey: 'alert@indeed.com',
    fromName: 'Indeed Recommended Jobs',
    fromEmail: 'alert@indeed.com',
    domain: 'indeed.com',
    totalEmails: 9,
    unreadCount: 5,
    latestDate: 'Yesterday',
    latestTimestamp: Date.now() - 90000000,
    sampleSubject: 'New Lead React / Node.js Developer openings near you',
    sampleSnippet: 'Matching roles for Lead Developer ($180k - $220k). View job specifications and apply in 1-click.',
    unsubscribeUrl: 'https://indeed.com/account/alerts',
    unsubscribeMailto: null,
    unsubscribePostHeader: null,
    messageIds: ['demo-9', 'demo-10'],
    unreadMessageIds: ['demo-9'],
    frequencyHistory: [2, 3, 2, 2],
    frequencyTrend: {
      direction: 'decreasing',
      percentChange: 20,
      label: 'Volume Decreasing (-20% in last 30d)',
      badgeLabel: '-20% (Dropping)',
      sparkline: [2, 3, 2, 2],
      recentCount: 4,
      olderCount: 5,
      breakdownLabels: ['30-23d ago: 2', '22-15d ago: 3', '14-8d ago: 2', 'Last 7d: 2'],
    },
    analysis: {
      senderKey: 'alert@indeed.com',
      unsubscribePriority: 'low',
      recommendationScore: 18,
      category: 'Job Alerts & Careers',
      summary: 'Job alert digest for Lead React/Node.js Developer openings.',
      safetyWarning: 'Job Alert / Career Notification - AI filtered and preserved to protect job opportunities.',
      isSensitive: true,
      isJobRelated: true,
    },
  },
  {
    senderKey: 'no-reply@flightbookingapp.com',
    fromName: 'SkyFly Itineraries',
    fromEmail: 'no-reply@flightbookingapp.com',
    domain: 'flightbookingapp.com',
    totalEmails: 4,
    unreadCount: 1,
    latestDate: '4 days ago',
    latestTimestamp: Date.now() - 345600000,
    sampleSubject: 'Your Flight E-Ticket Confirmation & Boarding Pass',
    sampleSnippet: 'Flight SF902 to SF. Booking Reference #XYZ987. Please keep this email for your records.',
    unsubscribeUrl: 'https://flightbookingapp.com/notif-settings',
    unsubscribeMailto: null,
    unsubscribePostHeader: null,
    messageIds: ['demo-6'],
    unreadMessageIds: ['demo-6'],
    frequencyHistory: [3, 1, 0, 0],
    frequencyTrend: {
      direction: 'decreasing',
      percentChange: 100,
      label: 'Volume Decreasing (-100% in last 30d)',
      badgeLabel: '-100% (Dropping)',
      sparkline: [3, 1, 0, 0],
      recentCount: 0,
      olderCount: 4,
      breakdownLabels: ['30-23d ago: 3', '22-15d ago: 1', '14-8d ago: 0', 'Last 7d: 0'],
    },
    analysis: {
      senderKey: 'no-reply@flightbookingapp.com',
      unsubscribePriority: 'low',
      recommendationScore: 25,
      category: 'Travel & Receipts',
      summary: 'Contains actual flight tickets and booking confirmations. Caution advised.',
      safetyWarning: 'This sender sends flight tickets & itinerary receipts. Unsubscribing may block travel updates.',
      isSensitive: true,
      isJobRelated: false,
    },
  },
];

export interface PendingToolCall {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  timestamp: string;
  selectedSenderKeys?: string[];
}

export interface InspectorData {
  fromName: string;
  fromEmail: string;
  domain: string;
  totalEmails: number;
  unreadCount: number;
  unreadRatio: string;
  sampleSubject?: string;
  sampleSnippet?: string;
  hasOneClickHeader?: boolean;
  hasHttpUnsubscribe?: boolean;
  hasMailtoUnsubscribe?: boolean;
  frequencyTrend?: string;
  category?: string;
  isJobRelated?: boolean;
  isSensitive?: boolean;
}

export interface SimulationData {
  action: string;
  affectedSendersCount: number;
  totalMessagesFreed: number;
  unreadMessagesFreed: number;
  estimatedStorageFreedMB: number;
  hasJobAlertRisk: boolean;
  jobAlertSenders: string[];
  riskTier: 'low' | 'medium' | 'high';
}

export interface HealthData {
  totalSendersScanned: number;
  highPriorityUnsubscribes: number;
  jobAlertsPreserved: number;
  totalUnreadEmails: number;
  totalMessagesFound: number;
  estimatedStorageUsedMB: number;
  healthScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant' | 'system' | 'function' | 'tool';
  name?: string;
  response?: any;
  content: string;
  timestamp: string;
  functionCalls?: any[];
  pendingTool?: PendingToolCall;
  isHelpNotification?: boolean;
  uiWidgetType?: 'senders' | 'inspector' | 'health' | 'simulation' | 'rules' | 'audit';
  senderCards?: {
    senderKey: string;
    fromName: string;
    fromEmail: string;
    domain: string;
    totalEmails: number;
    unreadCount: number;
    priority?: 'high' | 'medium' | 'low';
    category?: string;
    isJobRelated?: boolean;
    sampleSubject?: string;
  }[];
  inspectorData?: InspectorData;
  simulationData?: SimulationData;
  healthData?: HealthData;
}

export interface GeminiChatbotProps {
  senders: GroupedSenderData[];
  unsubscribedSet?: Set<string>;
  cleanedSet?: Set<string>;
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

const STORAGE_KEY = 'unsub_gemini_chat_history_v3';

export function GeminiChatbot({
  senders,
  unsubscribedSet,
  cleanedSet,
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
  // Use active senders (with sample demo fallback if scan has not been performed)
  const activeSenders = useMemo(() => {
    return senders && senders.length > 0 ? senders : DEFAULT_DEMO_SENDERS;
  }, [senders]);

  // Real-time Unsubscribe & Clean Status Tracking
  const [localUnsubscribedSet, setLocalUnsubscribedSet] = useState<Set<string>>(new Set());
  const [localCleanedSet, setLocalCleanedSet] = useState<Set<string>>(new Set());

  const isSenderUnsubscribed = useCallback(
    (key: string) => {
      if (!key) return false;
      return (
        (unsubscribedSet && unsubscribedSet.has(key)) ||
        localUnsubscribedSet.has(key) ||
        (unsubscribedSet && Array.from(unsubscribedSet).some((k) => k.toLowerCase() === key.toLowerCase())) ||
        Array.from(localUnsubscribedSet).some((k) => k.toLowerCase() === key.toLowerCase())
      );
    },
    [unsubscribedSet, localUnsubscribedSet]
  );

  const isSenderCleaned = useCallback(
    (key: string) => {
      if (!key) return false;
      return (
        (cleanedSet && cleanedSet.has(key)) ||
        localCleanedSet.has(key) ||
        (cleanedSet && Array.from(cleanedSet).some((k) => k.toLowerCase() === key.toLowerCase())) ||
        Array.from(localCleanedSet).some((k) => k.toLowerCase() === key.toLowerCase())
      );
    },
    [cleanedSet, localCleanedSet]
  );

  // Chat Visibility & Sizing States
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpandedCanvas, setIsExpandedCanvas] = useState(false);
  const [activeCanvasTab, setActiveCanvasTab] = useState<'senders' | 'health' | 'rules' | 'audit'>('senders');
  const [systemRole, setSystemRole] = useState<'inbox_agent' | 'privacy_expert' | 'strict_cleaner'>('inbox_agent');

  // Canvas Search & Filter state
  const [canvasSearch, setCanvasSearch] = useState('');
  const [canvasFilterPriority, setCanvasFilterPriority] = useState<string>('all');
  const [canvasSelectedSenders, setCanvasSelectedSenders] = useState<string[]>([]);
  const [inspectedSender, setInspectedSender] = useState<GroupedSenderData | null>(null);
  const [newProtectedDomainInput, setNewProtectedDomainInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat History & Inputs
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Show Toast feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  };

  // Initial welcome message / Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Ignore parse error
    }

    const highPriority = activeSenders.filter((s) => s.analysis?.unsubscribePriority === 'high').length;
    const totalUnread = activeSenders.reduce((acc, s) => acc + s.unreadCount, 0);
    const jobAlerts = activeSenders.filter((s) => s.analysis?.isJobRelated).length;
    const totalMessages = activeSenders.reduce((acc, s) => acc + s.totalEmails, 0);
    const estimatedStorageMB = Number((totalMessages * 0.12).toFixed(1));

    setMessages([
      {
        id: 'welcome-1',
        role: 'model',
        content: `Hello! I am your **Gemini Inbox Copilot** with real-time inspection, simulation, and direct inbox management controls.\n\nUse the quick triggers below, ask any question about your senders, or open the **Interactive Canvas** to batch-manage subscriptions!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        uiWidgetType: 'health',
        healthData: {
          totalSendersScanned: activeSenders.length,
          highPriorityUnsubscribes: highPriority,
          jobAlertsPreserved: jobAlerts,
          totalUnreadEmails: totalUnread,
          totalMessagesFound: totalMessages,
          estimatedStorageUsedMB: estimatedStorageMB,
          healthScore: Math.max(10, 100 - highPriority * 5 - totalUnread),
        },
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save conversation to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
      } catch {
        // Ignore quota errors
      }
    }
  }, [messages]);

  // Clear chat history
  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Conversation reset. How can I assist with your Gmail inbox today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast('Chat history cleared');
  };

  // Export conversation as Markdown digest
  const handleExportDigest = () => {
    const lines = [
      '# Gemini Inbox Assistant - Session Summary',
      `*Generated on: ${new Date().toLocaleString()}*`,
      `*User Account: ${userEmail || 'Demo Mode'}*`,
      '',
      '## Conversation Log',
      '',
    ];

    messages.forEach((m) => {
      const author = m.role === 'user' ? 'User' : 'Gemini Assistant';
      lines.push(`### ${author} (${m.timestamp})`);
      lines.push(m.content);
      if (m.pendingTool) {
        lines.push(`\n**Action Record:** \`${m.pendingTool.name}\` — Status: **${m.pendingTool.status}**`);
        if (m.pendingTool.args?.reason) {
          lines.push(`> *Reason:* ${m.pendingTool.args.reason}`);
        }
      }
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inbox-assistant-digest-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Markdown digest downloaded');
  };

  // Auto Scroll Chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Execute Read & Simulation Tools Client-side
  const handleReadToolCall = (toolName: string, args: any): any => {
    switch (toolName) {
      case 'get_inbox_health': {
        const highPriority = activeSenders.filter((s) => s.analysis?.unsubscribePriority === 'high').length;
        const totalUnread = activeSenders.reduce((acc, s) => acc + s.unreadCount, 0);
        const jobAlerts = activeSenders.filter((s) => s.analysis?.isJobRelated).length;
        const totalMessages = activeSenders.reduce((acc, s) => acc + s.totalEmails, 0);
        const estimatedStorageMB = (totalMessages * 0.12).toFixed(1);
        return {
          totalSendersScanned: activeSenders.length,
          highPriorityUnsubscribes: highPriority,
          jobAlertsPreserved: jobAlerts,
          totalUnreadEmails: totalUnread,
          totalMessagesFound: totalMessages,
          estimatedStorageUsedMB: Number(estimatedStorageMB),
          healthScore: Math.max(10, 100 - highPriority * 5 - totalUnread),
        };
      }

      case 'search_senders': {
        const { query = '', priority = 'all', category = '', domain = '' } = args;
        let results = [...activeSenders];

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
          senders: results.slice(0, 12).map((s) => ({
            senderKey: s.senderKey,
            fromName: s.fromName,
            fromEmail: s.fromEmail,
            domain: s.domain,
            totalEmails: s.totalEmails,
            unreadCount: s.unreadCount,
            priority: s.analysis?.unsubscribePriority || 'medium',
            category: s.analysis?.category || 'General Newsletter',
            isJobRelated: Boolean(s.analysis?.isJobRelated),
            sampleSubject: s.sampleSubject,
          })),
        };
      }

      case 'inspect_sender_samples': {
        const { senderKey } = args;
        const target = activeSenders.find(
          (s) =>
            s.senderKey.toLowerCase() === senderKey.toLowerCase() ||
            s.fromEmail.toLowerCase() === senderKey.toLowerCase()
        );

        if (!target) {
          return { error: `Sender ${senderKey} not found in current scan results.` };
        }

        return {
          fromName: target.fromName,
          fromEmail: target.fromEmail,
          domain: target.domain,
          totalEmails: target.totalEmails,
          unreadCount: target.unreadCount,
          unreadRatio: `${Math.round((target.unreadCount / Math.max(1, target.totalEmails)) * 100)}%`,
          sampleSubject: target.sampleSubject,
          sampleSnippet: target.sampleSnippet,
          hasOneClickHeader: Boolean(target.unsubscribePostHeader),
          hasHttpUnsubscribe: Boolean(target.unsubscribeUrl),
          hasMailtoUnsubscribe: Boolean(target.unsubscribeMailto),
          frequencyTrend: target.frequencyTrend?.label || 'Stable volume',
          category: target.analysis?.category || 'Subscription',
          isJobRelated: Boolean(target.analysis?.isJobRelated),
          isSensitive: Boolean(target.analysis?.isSensitive),
        };
      }

      case 'simulate_cleanup_impact': {
        const { senderKeys = [], action = 'unsubscribe' } = args;
        let matched = activeSenders.filter((s) =>
          senderKeys.some(
            (k: string) => k.toLowerCase() === s.senderKey.toLowerCase() || k.toLowerCase() === s.fromEmail.toLowerCase()
          )
        );

        // If no explicit keys provided, default to high priority senders
        if (matched.length === 0) {
          matched = activeSenders.filter((s) => s.analysis?.unsubscribePriority === 'high');
        }

        const totalMessages = matched.reduce((acc, s) => acc + s.totalEmails, 0);
        const totalUnread = matched.reduce((acc, s) => acc + s.unreadCount, 0);
        const estimatedMB = Number((totalMessages * 0.12).toFixed(2));
        const jobAlertMatches = matched.filter((s) => s.analysis?.isJobRelated).map((s) => s.fromEmail);

        let riskTier: 'low' | 'medium' | 'high' = 'medium';
        if (action === 'trash' || action === 'unsubscribe_and_trash') {
          riskTier = 'high';
        } else if (jobAlertMatches.length > 0) {
          riskTier = 'high';
        } else if (action === 'unsubscribe') {
          riskTier = 'medium';
        }

        return {
          action,
          affectedSendersCount: matched.length,
          totalMessagesFreed: totalMessages,
          unreadMessagesFreed: totalUnread,
          estimatedStorageFreedMB: estimatedMB,
          hasJobAlertRisk: jobAlertMatches.length > 0,
          jobAlertSenders: jobAlertMatches,
          riskTier,
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

  // Direct Live Action Dispatchers
  const handleDirectUnsubscribe = async (senderKey: string, autoTrash = false) => {
    try {
      setLocalUnsubscribedSet((prev) => new Set(prev).add(senderKey));
      if (autoTrash) {
        setLocalCleanedSet((prev) => new Set(prev).add(senderKey));
      }
      await onExecuteUnsubscribe([senderKey], autoTrash);
      showToast(`Unsubscribed from ${senderKey}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `direct-unsub-${Date.now()}`,
          role: 'model',
          content: `⚡ **Action Applied:** Successfully unsubscribed from \`${senderKey}\`${autoTrash ? ' and moved emails to Trash' : ''}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDirectTrash = async (senderKey: string) => {
    try {
      setLocalCleanedSet((prev) => new Set(prev).add(senderKey));
      await onExecuteTrash([senderKey]);
      showToast(`Emails moved to trash for ${senderKey}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `direct-trash-${Date.now()}`,
          role: 'model',
          content: `🗑️ **Action Applied:** Moved emails from \`${senderKey}\` to Trash.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDirectPriorityChange = (senderKey: string, priority: 'high' | 'medium' | 'low', isJob?: boolean) => {
    onUpdatePriority(senderKey, priority, isJob);
    showToast(`Priority updated for ${senderKey}`);
  };

  const handleDirectAddWhitelist = (domain: string) => {
    onAddProtectedDomain(domain);
    showToast(`Added @${domain} to Protected Whitelist`);
    setMessages((prev) => [
      ...prev,
      {
        id: `direct-whitelist-${Date.now()}`,
        role: 'model',
        content: `🛡️ **Protection Updated:** Added **${domain}** to your VIP Protected Domains list. Senders from this domain will never be flagged for unsubscription.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
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

    const assistantMsgId = `model-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      const historyPayload = messages.concat(userMsg).map((m) => ({
        role: m.role,
        content: m.content,
        functionCalls: m.functionCalls,
        name: m.name,
        response: m.response,
      }));

      const contextData = {
        totalSenders: activeSenders.length,
        highPriorityCount: activeSenders.filter((s) => s.analysis?.unsubscribePriority === 'high').length,
        jobAlertsCount: activeSenders.filter((s) => s.analysis?.isJobRelated).length,
        totalUnread: activeSenders.reduce((acc, s) => acc + s.unreadCount, 0),
        scanConfig,
        userEmail,
        sendersSummary: activeSenders.slice(0, 10).map((s) => `${s.fromName} <${s.fromEmail}> (${s.totalEmails} emails, priority: ${s.analysis?.unsubscribePriority || 'medium'}, category: ${s.analysis?.category || 'General'})`).join('; '),
        unsubscribedCount: auditLogs.filter((a) => a.action === 'unsubscribe').length,
        cleanedMessagesCount: auditLogs.reduce((acc, a) => acc + a.messagesAffected, 0),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          systemRole,
          context: contextData,
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to communicate with Gemini');
      }

      let accumulatedText = '';
      const functionCalls: any[] = [];

      // Check if response is stream or json
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const event of events) {
            if (!event.trim()) continue;
            const lines = event.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                try {
                  const payload = JSON.parse(jsonStr);
                  if (payload.type === 'text' && payload.text) {
                    accumulatedText += payload.text;
                    const textNow = accumulatedText;
                    setMessages((prev) =>
                      prev.map((m) => (m.id === assistantMsgId ? { ...m, content: textNow } : m))
                    );
                  } else if (payload.type === 'functionCalls' && payload.functionCalls) {
                    functionCalls.push(...payload.functionCalls);
                  } else if (payload.type === 'error') {
                    throw new Error(payload.error);
                  }
                } catch (e: any) {
                  if (e.message?.includes('stream error') || e.message?.includes('Gemini')) {
                    throw e;
                  }
                }
              }
            }
          }
        }
      } else {
        const data = await res.json();
        accumulatedText = data.text || '';
        if (data.functionCalls) functionCalls.push(...data.functionCalls);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedText } : m))
        );
      }

      // Handle Function Calls
      if (functionCalls.length > 0) {
        for (const call of functionCalls) {
          const { name, args } = call;

          const isReadTool = [
            'get_inbox_health',
            'search_senders',
            'inspect_sender_samples',
            'simulate_cleanup_impact',
            'get_audit_logs',
          ].includes(name);

          if (isReadTool) {
            const toolResult = handleReadToolCall(name, args);

            let uiWidgetType: ChatMessage['uiWidgetType'] = undefined;
            let senderCardsPayload: any[] | undefined = undefined;
            let inspectorPayload: InspectorData | undefined = undefined;
            let simulationPayload: SimulationData | undefined = undefined;
            let healthPayload: HealthData | undefined = undefined;

            if (name === 'search_senders' && toolResult.senders) {
              uiWidgetType = 'senders';
              senderCardsPayload = toolResult.senders;
            } else if (name === 'inspect_sender_samples') {
              uiWidgetType = 'inspector';
              inspectorPayload = toolResult;
            } else if (name === 'simulate_cleanup_impact') {
              uiWidgetType = 'simulation';
              simulationPayload = toolResult;
            } else if (name === 'get_inbox_health') {
              uiWidgetType = 'health';
              healthPayload = toolResult;
            } else if (name === 'get_audit_logs') {
              uiWidgetType = 'audit';
            }

            let fallbackNaturalText = '';
            if (name === 'search_senders') {
              fallbackNaturalText = `Found **${toolResult.matchCount || (toolResult.senders?.length ?? 0)}** matching subscription senders in your inbox. You can manage, inspect, or protect each below:`;
            } else if (name === 'get_inbox_health') {
              fallbackNaturalText = `Here is your current **Inbox Health Score: ${toolResult.healthScore || 85}/100** based on scanned newsletter volume and open rates.`;
            } else if (name === 'inspect_sender_samples') {
              fallbackNaturalText = `Here is the detailed inspection profile for **${toolResult.fromName || toolResult.fromEmail || 'the selected sender'}**:`;
            } else if (name === 'simulate_cleanup_impact') {
              fallbackNaturalText = `Simulation complete: Unsubscribing will free approximately **${toolResult.totalMessagesFreed || 0}** emails and save **~${toolResult.estimatedStorageFreedMB || 0} MB** of storage.`;
            } else if (name === 'get_audit_logs') {
              fallbackNaturalText = `Retrieved **${toolResult.logCount || 0}** recent action records from your session log.`;
            } else {
              fallbackNaturalText = 'Here are the requested insights:';
            }

            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === assistantMsgId) {
                  return {
                    ...m,
                    content: m.content || fallbackNaturalText,
                    uiWidgetType,
                    senderCards: senderCardsPayload,
                    inspectorData: inspectorPayload,
                    simulationData: simulationPayload,
                    healthData: healthPayload,
                  };
                }
                return m;
              })
            );

            // Send tool result back to Gemini for final natural language response with streaming
            const toolResponseHistory = historyPayload.concat([
              {
                role: 'model',
                content: accumulatedText || `Executing tool ${name}`,
                functionCalls: [call],
              },
              {
                role: 'tool',
                name,
                response: toolResult,
              },
            ] as any);

            const followUpRes = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: toolResponseHistory,
                systemRole,
                context: contextData,
                stream: true,
              }),
            });

            if (followUpRes.ok && followUpRes.body) {
              const followUpContentType = followUpRes.headers.get('content-type') || '';
              if (followUpContentType.includes('text/event-stream')) {
                const fReader = followUpRes.body.getReader();
                const fDecoder = new TextDecoder();
                let fBuffer = '';
                let fText = accumulatedText ? `${accumulatedText}\n\n` : '';

                while (true) {
                  const { done: fDone, value: fVal } = await fReader.read();
                  if (fDone) break;

                  fBuffer += fDecoder.decode(fVal, { stream: true });
                  const fEvents = fBuffer.split('\n\n');
                  fBuffer = fEvents.pop() || '';

                  for (const fEv of fEvents) {
                    if (!fEv.trim()) continue;
                    const fLines = fEv.split('\n');
                    for (const fL of fLines) {
                      if (fL.startsWith('data: ')) {
                        const fJson = fL.slice(6).trim();
                        if (!fJson) continue;
                        try {
                          const fPayload = JSON.parse(fJson);
                          if (fPayload.type === 'text' && fPayload.text) {
                            fText += fPayload.text;
                            const currentF = fText;
                            setMessages((prev) =>
                              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: currentF } : m))
                            );
                          }
                        } catch (e) {
                          // ignore json parse error
                        }
                      }
                    }
                  }
                }
              } else {
                const followUpData = await followUpRes.json();
                const finalText = followUpData.text || fallbackNaturalText;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, content: finalText } : m))
                );
              }
            }
          } else {
            // WRITE / CRUD Operation -> REQUIRES HUMAN-IN-THE-LOOP CONFIRMATION
            const initialSelected = Array.isArray(args.senderKeys) ? [...args.senderKeys] : [];
            const pendingTool: PendingToolCall = {
              id: `tool-${Date.now()}`,
              name,
              args,
              status: 'pending',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              selectedSenderKeys: initialSelected,
            };

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: m.content || `I have prepared this inbox update for your review:`,
                      pendingTool,
                    }
                  : m
              )
            );
          }
        }
      } else if (!accumulatedText.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: 'I processed your request. Let me know if you need further adjustments.' }
              : m
          )
        );
      }
    } catch (err: any) {
      console.error('Chatbot error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ **Connection issue:** ${err.message || 'Could not connect to Gemini.'}\n\nPlease verify your network or try asking again.`,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // Toggle sender selection within a pending HITL card
  const toggleSenderInPendingTool = (messageId: string, senderKey: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.pendingTool) {
          const current = m.pendingTool.selectedSenderKeys || [];
          const exists = current.includes(senderKey);
          const updated = exists ? current.filter((k) => k !== senderKey) : [...current, senderKey];
          return {
            ...m,
            pendingTool: {
              ...m.pendingTool,
              selectedSenderKeys: updated,
            },
          };
        }
        return m;
      })
    );
  };

  // Human-in-the-loop Approval Execution Handler
  const handleApproveTool = async (messageId: string, tool: PendingToolCall) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.pendingTool
          ? { ...m, pendingTool: { ...m.pendingTool, status: 'approved' } }
          : m
      )
    );

    try {
      const { name, args, selectedSenderKeys } = tool;
      const targetKeys =
        selectedSenderKeys && selectedSenderKeys.length > 0 ? selectedSenderKeys : args.senderKeys || [];

      if (name === 'unsubscribe_sender') {
        const { autoTrash } = args;
        targetKeys.forEach((k: string) => setLocalUnsubscribedSet((prev) => new Set(prev).add(k)));
        if (autoTrash) {
          targetKeys.forEach((k: string) => setLocalCleanedSet((prev) => new Set(prev).add(k)));
        }
        await onExecuteUnsubscribe(targetKeys, Boolean(autoTrash));
      } else if (name === 'trash_sender_emails') {
        targetKeys.forEach((k: string) => setLocalCleanedSet((prev) => new Set(prev).add(k)));
        await onExecuteTrash(targetKeys);
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

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.pendingTool
            ? { ...m, pendingTool: { ...m.pendingTool, status: 'executed' } }
            : m
        )
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `model-confirm-${Date.now()}`,
          role: 'model',
          content: `✅ **Action Confirmed & Executed!** Successfully applied \`${tool.name}\` across **${targetKeys.length || 1}** item(s). Your inbox state is up-to-date.`,
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
        content: `🚫 **Action Cancelled.** Execution of \`${tool.name}\` was dismissed. No inbox changes were made.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Determine Risk Tier for a Tool Call
  const getToolRiskBadge = (toolName: string, args: any) => {
    if (toolName === 'trash_sender_emails' || (toolName === 'unsubscribe_sender' && args?.autoTrash)) {
      return {
        label: 'HIGH RISK (DATA MODIFICATION)',
        classes: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        icon: Trash2,
      };
    }
    if (toolName === 'unsubscribe_sender') {
      return {
        label: 'MEDIUM RISK (UNSUBSCRIBE)',
        classes: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        icon: Mail,
      };
    }
    return {
      label: 'LOW RISK (SETTINGS / PREFERENCES)',
      classes: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      icon: ShieldCheck,
    };
  };

  // Filtered senders for the Interactive Canvas
  const canvasFilteredSenders = useMemo(() => {
    let list = [...activeSenders];
    if (canvasSearch.trim()) {
      const q = canvasSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.fromName.toLowerCase().includes(q) ||
          s.fromEmail.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q) ||
          s.sampleSubject.toLowerCase().includes(q)
      );
    }
    if (canvasFilterPriority !== 'all') {
      if (canvasFilterPriority === 'job_alerts') {
        list = list.filter((s) => s.analysis?.isJobRelated);
      } else if (canvasFilterPriority === 'unsubscribed') {
        list = list.filter((s) => isSenderUnsubscribed(s.senderKey) || isSenderUnsubscribed(s.fromEmail));
      } else if (canvasFilterPriority === 'active') {
        list = list.filter((s) => !isSenderUnsubscribed(s.senderKey) && !isSenderUnsubscribed(s.fromEmail));
      } else {
        list = list.filter((s) => s.analysis?.unsubscribePriority === canvasFilterPriority);
      }
    }
    return list;
  }, [activeSenders, canvasSearch, canvasFilterPriority, isSenderUnsubscribed]);

  return (
    <>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[60] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* FLOATING TRIGGER BUTTON                                   */}
      {/* ========================================================= */}
      {!isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 group flex items-center">
          <div className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap px-3.5 py-2 rounded-xl bg-slate-900/95 dark:bg-zinc-800/95 text-white text-xs font-semibold border border-slate-700/60 dark:border-zinc-700/60 shadow-2xl backdrop-blur-xl flex items-center gap-2 translate-x-2 group-hover:translate-x-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Gemini Inbox Copilot</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer relative"
            aria-label="Open Gemini Copilot"
          >
            <Sparkles className="w-6 h-6 text-white" />
            <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white"></span>
            </span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* EXPANDABLE AI CHAT & WORKSPACE CANVAS                     */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          className={`fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 rounded-2xl bg-white/95 dark:bg-[#121215]/95 border border-slate-200 dark:border-zinc-800 shadow-2xl backdrop-blur-2xl transition-all duration-300 flex flex-col overflow-hidden ${
            isMinimized
              ? 'w-[calc(100vw-1.5rem)] sm:w-[380px] h-14'
              : isExpandedCanvas
              ? 'w-[calc(100vw-1.5rem)] sm:w-[92vw] md:w-[1000px] lg:w-[1120px] h-[720px] max-h-[92vh]'
              : 'w-[calc(100vw-1.5rem)] sm:w-[440px] md:w-[480px] h-[580px] sm:h-[620px] max-h-[88vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 dark:bg-zinc-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm tracking-tight text-white truncate">Gemini Copilot</h3>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-medium border border-indigo-500/30 shrink-0">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">Autonomous Inbox Assistant & Interactive Canvas</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={systemRole}
                onChange={(e: any) => setSystemRole(e.target.value)}
                className="bg-slate-800 text-slate-200 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                title="Switch Assistant Mode"
              >
                <option value="inbox_agent">Smart Assistant</option>
                <option value="privacy_expert">Privacy Guard</option>
                <option value="strict_cleaner">Clutter Cleaner</option>
              </select>

              {/* Canvas Expand Toggle */}
              {!isMinimized && (
                <button
                  onClick={() => setIsExpandedCanvas(!isExpandedCanvas)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                    isExpandedCanvas
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title={isExpandedCanvas ? 'Exit Canvas Workspace' : 'Open Interactive Canvas Workspace'}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isExpandedCanvas ? 'Standard' : 'Canvas Workspace'}</span>
                </button>
              )}

              {/* Minimize / Expand Toggle */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          {!isMinimized && (
            <div className="flex-1 flex overflow-hidden">
              {/* LEFT / CHAT COLUMN */}
              <div
                className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${
                  isExpandedCanvas ? 'w-full md:w-[420px] lg:w-[450px] border-r border-slate-200 dark:border-zinc-800' : 'w-full'
                }`}
              >
                {/* Action Toolbar */}
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-medium">
                      <HardDrive className="w-3 h-3 text-indigo-500" />
                      <span>{activeSenders.length} senders loaded</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportDigest}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                      title="Export conversation as Markdown"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export</span>
                    </button>
                    <span>•</span>
                    <button
                      onClick={handleClearHistory}
                      className="hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                      title="Reset chat memory"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Quick Prompts */}
                <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1 shrink-0">
                    <Zap className="w-3 h-3 text-amber-500" /> Quick:
                  </span>

                  <button
                    onClick={() => handleSendMessage('Search all marketing newsletters with high unsubscribe priority')}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 text-xs font-medium border border-slate-200 dark:border-zinc-700 shrink-0 transition-all cursor-pointer"
                  >
                    🔍 Find High Priority
                  </button>

                  <button
                    onClick={() => handleSendMessage('Simulate the cleanup impact of unsubscribing from all high priority marketing newsletters')}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 text-xs font-medium border border-slate-200 dark:border-zinc-700 shrink-0 transition-all cursor-pointer"
                  >
                    ⚡ Simulate Cleanup
                  </button>

                  <button
                    onClick={() => handleSendMessage('Show all job alerts and career emails')}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 text-xs font-medium border border-slate-200 dark:border-zinc-700 shrink-0 transition-all cursor-pointer"
                  >
                    🛡️ Job Alerts
                  </button>

                  <button
                    onClick={() => handleSendMessage('How healthy is my inbox? Give me a comprehensive audit score')}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 text-xs font-medium border border-slate-200 dark:border-zinc-700 shrink-0 transition-all cursor-pointer"
                  >
                    📊 Health Score
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                        {/* Author Label */}
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 px-1">
                          {isUser ? (
                            <>
                              <span>You</span>
                              <User className="w-3 h-3 text-indigo-500" />
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 text-indigo-500" />
                              <span>Assistant</span>
                            </>
                          )}
                          <span className="text-[10px] font-normal opacity-60">• {msg.timestamp}</span>
                        </div>

                        {/* Text Message */}
                        {msg.content && (
                          <div
                            className={`max-w-[92%] p-3 rounded-2xl leading-relaxed ${
                              isUser
                                ? 'bg-indigo-600 text-white rounded-br-xs font-medium shadow-xs whitespace-pre-wrap'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-xs border border-slate-200/80 dark:border-zinc-700/60'
                            }`}
                          >
                            {isUser ? msg.content : <FormattedMarkdown content={msg.content} />}
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* HEALTH DASHBOARD WIDGET                                   */}
                        {/* ========================================================= */}
                        {msg.healthData && (
                          <div className="w-full mt-2 p-3 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-2.5">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-indigo-400" /> Inbox Health & Risk Status
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Score: {msg.healthData.healthScore}/100
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                <div className="text-slate-400 text-[10px] font-medium">Scanned Subscriptions</div>
                                <div className="text-base font-bold text-white">{msg.healthData.totalSendersScanned}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                <div className="text-slate-400 text-[10px] font-medium">High Unsub Priority</div>
                                <div className="text-base font-bold text-rose-400">{msg.healthData.highPriorityUnsubscribes}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                <div className="text-slate-400 text-[10px] font-medium">Job Alerts Safe</div>
                                <div className="text-base font-bold text-indigo-400">{msg.healthData.jobAlertsPreserved}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                <div className="text-slate-400 text-[10px] font-medium">Storage Used</div>
                                <div className="text-base font-bold text-amber-400">~{msg.healthData.estimatedStorageUsedMB} MB</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                onClick={() => {
                                  setIsExpandedCanvas(true);
                                  setActiveCanvasTab('senders');
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span>Open in Canvas Workspace</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* INTERACTIVE SENDER CARDS WITH LIVE CONTROLS               */}
                        {/* ========================================================= */}
                        {msg.senderCards && msg.senderCards.length > 0 && (
                          <div className="w-full mt-2 space-y-2">
                            <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 px-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Subscriptions ({msg.senderCards.length})</span>
                              </span>
                              <button
                                onClick={() => {
                                  setIsExpandedCanvas(true);
                                  setActiveCanvasTab('senders');
                                }}
                                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>View all in Canvas</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {msg.senderCards.map((sc) => {
                                const isUnsub = isSenderUnsubscribed(sc.senderKey) || isSenderUnsubscribed(sc.fromEmail);
                                const isClean = isSenderCleaned(sc.senderKey) || isSenderCleaned(sc.fromEmail);

                                return (
                                  <div
                                    key={sc.senderKey}
                                    className={`p-3 rounded-xl bg-white dark:bg-zinc-900 border transition-all space-y-2 ${
                                      isUnsub
                                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                                        : 'border-slate-200 dark:border-zinc-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                            {sc.fromName}
                                          </span>
                                          {isUnsub ? (
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold flex items-center gap-0.5 border border-emerald-300 dark:border-emerald-800">
                                              <Check className="w-2.5 h-2.5" />
                                              Unsubscribed
                                            </span>
                                          ) : (
                                            <span
                                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                sc.priority === 'high'
                                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                                  : sc.priority === 'low'
                                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                              }`}
                                            >
                                              {sc.priority} Priority
                                            </span>
                                          )}
                                          {sc.isJobRelated && (
                                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold">
                                              Job Alert
                                            </span>
                                          )}
                                          {isClean && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[9px] font-bold">
                                              Trashed
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                          {sc.fromEmail} • {sc.unreadCount} unread / {sc.totalEmails} total
                                        </div>
                                      </div>
                                    </div>

                                    {sc.sampleSubject && (
                                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 italic line-clamp-1 bg-slate-50 dark:bg-zinc-950/50 p-1.5 rounded border border-slate-100 dark:border-zinc-800/80">
                                        &ldquo;{sc.sampleSubject}&rdquo;
                                      </p>
                                    )}

                                    {/* Direct CRUD Action Toolbar */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800">
                                      {isUnsub ? (
                                        <div className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          <span>Unsubscribed</span>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => handleDirectUnsubscribe(sc.senderKey, false)}
                                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                          title="Unsubscribe from this newsletter"
                                        >
                                          <Zap className="w-3 h-3" />
                                          <span>Unsubscribe</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleDirectTrash(sc.senderKey)}
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-slate-700 dark:text-zinc-300 hover:text-rose-600 text-[10px] font-semibold border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                                        title="Move all emails from this sender to trash"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Trash</span>
                                      </button>

                                      <button
                                        onClick={() => handleSendMessage(`Inspect sender ${sc.fromEmail}`)}
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[10px] font-semibold border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                                        title="Inspect email samples and headers"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Inspect</span>
                                      </button>

                                      <button
                                        onClick={() => handleDirectAddWhitelist(sc.domain)}
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 text-slate-700 dark:text-zinc-300 hover:text-emerald-600 text-[10px] font-semibold border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                                        title="Add domain to protected list"
                                      >
                                        <Shield className="w-3 h-3" />
                                        <span>Protect</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* SENDER INSPECTOR CARD                                     */}
                        {/* ========================================================= */}
                        {msg.inspectorData && (() => {
                          const isUnsub = isSenderUnsubscribed(msg.inspectorData.fromEmail) || isSenderUnsubscribed(msg.inspectorData.fromName);
                          return (
                            <div className={`w-full mt-2 p-3.5 rounded-xl border text-slate-900 dark:text-zinc-100 shadow-sm space-y-2.5 transition-all ${
                              isUnsub
                                ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                            }`}>
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5" /> Sender Inspection Profile
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {isUnsub && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Unsubscribed
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                    {msg.inspectorData.category || 'Newsletter'}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    {msg.inspectorData.fromName}
                                  </span>
                                  <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                                    @{msg.inspectorData.domain}
                                  </span>
                                </div>
                                <div className="text-xs font-mono text-slate-600 dark:text-zinc-300">
                                  {msg.inspectorData.fromEmail}
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-1">
                                  <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                                    <div className="text-[10px] text-slate-500">Unread Ratio</div>
                                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                      {msg.inspectorData.unreadRatio}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                                    <div className="text-[10px] text-slate-500">Total Volume</div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                      {msg.inspectorData.totalEmails} msgs
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center">
                                    <div className="text-[10px] text-slate-500">1-Click Header</div>
                                    <div className="text-xs font-bold text-emerald-600">
                                      {msg.inspectorData.hasOneClickHeader ? 'Supported' : 'Standard'}
                                    </div>
                                  </div>
                                </div>

                                {msg.inspectorData.sampleSnippet && (
                                  <div className="p-2 rounded bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs">
                                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                      Recent Snippet Preview:
                                    </div>
                                    <p className="text-slate-700 dark:text-zinc-300 italic">
                                      &ldquo;{msg.inspectorData.sampleSnippet}&rdquo;
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Direct Action Bar */}
                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                                {isUnsub ? (
                                  <div className="flex-1 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center justify-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Unsubscribed</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleDirectUnsubscribe(msg.inspectorData!.fromEmail, false)}
                                    className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>Unsubscribe Now</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDirectTrash(msg.inspectorData!.fromEmail)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Trash All</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ========================================================= */}
                        {/* SIMULATION IMPACT CARD                                    */}
                        {/* ========================================================= */}
                        {msg.simulationData && (
                          <div className="w-full mt-2 p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-zinc-100 shadow-sm space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                Projected Cleanup Impact
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200">
                                Simulated
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-1 text-center">
                              <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900">
                                <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                                  {msg.simulationData.affectedSendersCount}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Senders</div>
                              </div>
                              <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900">
                                <div className="text-base font-bold text-slate-900 dark:text-white">
                                  {msg.simulationData.totalMessagesFreed}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Emails Saved</div>
                              </div>
                              <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900">
                                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                  ~{msg.simulationData.estimatedStorageFreedMB} MB
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Storage Freed</div>
                              </div>
                            </div>

                            {msg.simulationData.hasJobAlertRisk && (
                              <div className="p-2 rounded bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Warning:</strong> {msg.simulationData.jobAlertSenders.length} target sender(s) match Career/Job alerts.
                                </span>
                              </div>
                            )}

                            <button
                              onClick={() => handleSendMessage('Execute the simulated cleanup now')}
                              className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Proceed with Cleanup Execution</span>
                            </button>
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* HITL ACTION CONFIRMATION CARD                             */}
                        {/* ========================================================= */}
                        {msg.pendingTool && (
                          <div className="w-full mt-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-slate-900 dark:text-zinc-100 shadow-md space-y-2.5">
                            {/* Risk Badge Header */}
                            {(() => {
                              const risk = getToolRiskBadge(msg.pendingTool.name, msg.pendingTool.args);
                              const IconComponent = risk.icon;
                              return (
                                <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800/60">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                                    <div>
                                      <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 dark:text-amber-300">
                                        Authorization Required
                                      </h4>
                                      <span className="text-[11px] font-mono text-amber-800 dark:text-amber-400">
                                        Action: {msg.pendingTool.name.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${risk.classes}`}>
                                    {risk.label.split(' ')[0]}
                                  </span>
                                </div>
                              );
                            })()}

                            {/* Action Details with Granular Senders Checklist */}
                            <div className="bg-white/90 dark:bg-zinc-900/90 p-2.5 rounded-lg border border-amber-200/70 dark:border-amber-800/50 text-xs space-y-2 font-mono">
                              <p className="text-slate-800 dark:text-zinc-200 font-sans font-medium text-xs">
                                <strong>Summary:</strong> {msg.pendingTool.args?.reason || 'Proposed workflow execution.'}
                              </p>

                              {/* Granular Senders Selection List */}
                              {msg.pendingTool.args?.senderKeys && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-zinc-300 font-sans font-semibold">
                                    <span>
                                      Select Senders to Process ({msg.pendingTool.selectedSenderKeys?.length || 0} / {msg.pendingTool.args.senderKeys.length}):
                                    </span>
                                  </div>
                                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1 bg-slate-50 dark:bg-zinc-950/70 p-1.5 rounded border border-slate-200 dark:border-zinc-800">
                                    {msg.pendingTool.args.senderKeys.map((key: string) => {
                                      const isSelected = msg.pendingTool?.selectedSenderKeys?.includes(key);
                                      return (
                                        <div
                                          key={key}
                                          onClick={() => {
                                            if (msg.pendingTool?.status === 'pending') {
                                              toggleSenderInPendingTool(msg.id, key);
                                            }
                                          }}
                                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-[11px] ${
                                            isSelected
                                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 font-semibold'
                                              : 'opacity-50 hover:opacity-80 text-slate-500 dark:text-zinc-400'
                                          }`}
                                        >
                                          {isSelected ? (
                                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                          ) : (
                                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          )}
                                          <span className="truncate flex-1 font-mono">{key}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {msg.pendingTool.args?.title && (
                                <div className="text-xs text-slate-700 dark:text-zinc-300">
                                  <strong>Rule Title:</strong> {msg.pendingTool.args.title}
                                </div>
                              )}

                              {msg.pendingTool.args?.domainOrEmail && (
                                <div className="text-xs text-slate-700 dark:text-zinc-300">
                                  <strong>Domain/Email:</strong> {msg.pendingTool.args.domainOrEmail}
                                </div>
                              )}
                            </div>

                            {/* Approval / Rejection Controls */}
                            {msg.pendingTool.status === 'pending' && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleApproveTool(msg.id, msg.pendingTool!)}
                                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Approve & Execute</span>
                                </button>
                                <button
                                  onClick={() => handleRejectTool(msg.id, msg.pendingTool!)}
                                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-slate-700 dark:text-zinc-300 hover:text-rose-600 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}

                            {msg.pendingTool.status === 'approved' && (
                              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Executing live changes in Gmail...</span>
                              </div>
                            )}

                            {msg.pendingTool.status === 'executed' && (
                              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Approved and executed</span>
                              </div>
                            )}

                            {msg.pendingTool.status === 'rejected' && (
                              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rejected by user</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Typing / Agent Thinking Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-xs text-slate-600 dark:text-zinc-400 animate-pulse w-fit">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                      <span>Gemini is analyzing your inbox...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2 shrink-0"
                >
                  {/* Voice Button */}
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                          : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                      }`}
                      title={isListening ? 'Listening (click to stop)' : 'Dictate with Voice'}
                    >
                      {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>
                  )}

                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask Gemini to search, simulate, clean, or protect..."
                    disabled={isTyping}
                    className="flex-1 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  />

                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* ========================================================= */}
              {/* RIGHT / INTERACTIVE CANVAS WORKSPACE                      */}
              {/* ========================================================= */}
              {isExpandedCanvas && (
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0c0c0e] overflow-hidden">
                  {/* Canvas Navigation Tabs */}
                  <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveCanvasTab('senders')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          activeCanvasTab === 'senders'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Subscriptions ({activeSenders.length})</span>
                      </button>

                      <button
                        onClick={() => setActiveCanvasTab('health')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          activeCanvasTab === 'health'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Health & Reclaim</span>
                      </button>

                      <button
                        onClick={() => setActiveCanvasTab('rules')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          activeCanvasTab === 'rules'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Rules & Whitelist</span>
                      </button>

                      <button
                        onClick={() => setActiveCanvasTab('audit')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          activeCanvasTab === 'audit'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Session Audit Log</span>
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      Live Workspace Synced
                    </span>
                  </div>

                  {/* Canvas Tab 1: Subscriptions CRUD */}
                  {activeCanvasTab === 'senders' && (
                    <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
                      {/* Search & Filter Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={canvasSearch}
                              onChange={(e) => setCanvasSearch(e.target.value)}
                              placeholder="Filter senders by name, email, domain, or subject..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <select
                            value={canvasFilterPriority}
                            onChange={(e) => setCanvasFilterPriority(e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium outline-none cursor-pointer"
                          >
                            <option value="all">All Subscriptions ({activeSenders.length})</option>
                            <option value="active">Active Only ({activeSenders.filter((s) => !isSenderUnsubscribed(s.senderKey) && !isSenderUnsubscribed(s.fromEmail)).length})</option>
                            <option value="unsubscribed">Unsubscribed ({activeSenders.filter((s) => isSenderUnsubscribed(s.senderKey) || isSenderUnsubscribed(s.fromEmail)).length})</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                            <option value="job_alerts">Job Alerts Only</option>
                          </select>
                        </div>

                        {/* Batch Action Buttons */}
                        {canvasSelectedSenders.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={async () => {
                                canvasSelectedSenders.forEach((k) => setLocalUnsubscribedSet((prev) => new Set(prev).add(k)));
                                await onExecuteUnsubscribe(canvasSelectedSenders, false);
                                showToast(`Unsubscribed from ${canvasSelectedSenders.length} senders`);
                                setCanvasSelectedSenders([]);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Unsub Selected ({canvasSelectedSenders.length})</span>
                            </button>

                            <button
                              onClick={async () => {
                                canvasSelectedSenders.forEach((k) => setLocalCleanedSet((prev) => new Set(prev).add(k)));
                                await onExecuteTrash(canvasSelectedSenders);
                                showToast(`Moved emails to trash for ${canvasSelectedSenders.length} senders`);
                                setCanvasSelectedSenders([]);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Trash Selected</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Senders Table / Cards */}
                      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                        {canvasFilteredSenders.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 dark:text-zinc-400 space-y-2">
                            <Mail className="w-8 h-8 mx-auto text-slate-400" />
                            <p className="text-xs font-medium">No senders match your search criteria.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {canvasFilteredSenders.map((s) => {
                              const isSelected = canvasSelectedSenders.includes(s.senderKey);
                              const isUnsub = isSenderUnsubscribed(s.senderKey) || isSenderUnsubscribed(s.fromEmail);
                              const isClean = isSenderCleaned(s.senderKey) || isSenderCleaned(s.fromEmail);

                              return (
                                <div
                                  key={s.senderKey}
                                  className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                                    isSelected
                                      ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                                      : isUnsub
                                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/30'
                                      : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <button
                                      onClick={() => {
                                        setCanvasSelectedSenders((prev) =>
                                          prev.includes(s.senderKey)
                                            ? prev.filter((k) => k !== s.senderKey)
                                            : [...prev, s.senderKey]
                                        );
                                      }}
                                      className="cursor-pointer text-slate-400 hover:text-indigo-600"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                          {s.fromName}
                                        </span>
                                        {isUnsub ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Unsubscribed
                                          </span>
                                        ) : (
                                          <span
                                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                              s.analysis?.unsubscribePriority === 'high'
                                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                                : s.analysis?.unsubscribePriority === 'low'
                                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                            }`}
                                          >
                                            {s.analysis?.unsubscribePriority || 'med'}
                                          </span>
                                        )}
                                        {s.analysis?.isJobRelated && (
                                          <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold">
                                            Job Alert
                                          </span>
                                        )}
                                        {isClean && (
                                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[9px] font-bold">
                                            Trashed
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                        {s.fromEmail} • {s.unreadCount} unread / {s.totalEmails} total • {s.domain}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Direct Row CRUD Actions */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isUnsub ? (
                                      <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Unsubscribed</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleDirectUnsubscribe(s.senderKey, false)}
                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                        title="1-Click Unsubscribe"
                                      >
                                        Unsubscribe
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleDirectTrash(s.senderKey)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Trash all messages"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleDirectAddWhitelist(s.domain)}
                                      className="p-1 rounded text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                      title="Add domain to protected whitelist"
                                    >
                                      <Shield className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setInspectedSender(s);
                                        handleSendMessage(`Inspect sender ${s.fromEmail}`);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                      title="Deep inspect in chat"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Canvas Tab 2: Health & Reclaim */}
                  {activeCanvasTab === 'health' && (
                    <div className="flex-1 p-5 overflow-y-auto space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-1">
                          <div className="text-xs font-semibold text-slate-500">Inbox Health Score</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {Math.min(100, Math.max(10, 100 - activeSenders.filter((s) => !isSenderUnsubscribed(s.senderKey) && !isSenderUnsubscribed(s.fromEmail) && s.analysis?.unsubscribePriority === 'high').length * 6 + (activeSenders.filter((s) => isSenderUnsubscribed(s.senderKey) || isSenderUnsubscribed(s.fromEmail)).length * 4)))}/100
                          </div>
                          <div className="text-[11px] text-slate-400">Calculated from unread & unsubscribed ratios</div>
                        </div>

                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-1">
                          <div className="text-xs font-semibold text-slate-500">Total Senders Scanned</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeSenders.length}</div>
                          <div className="text-[11px] text-slate-400">
                            {activeSenders.filter((s) => isSenderUnsubscribed(s.senderKey) || isSenderUnsubscribed(s.fromEmail)).length} unsubscribed
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-1">
                          <div className="text-xs font-semibold text-slate-500">Unsubscribed Senders</div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {activeSenders.filter((s) => isSenderUnsubscribed(s.senderKey) || isSenderUnsubscribed(s.fromEmail)).length}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {activeSenders.filter((s) => !isSenderUnsubscribed(s.senderKey) && !isSenderUnsubscribed(s.fromEmail) && s.analysis?.unsubscribePriority === 'high').length} high priority remaining
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-1">
                          <div className="text-xs font-semibold text-slate-500">Storage Reclaimed / Reclaimable</div>
                          <div className="text-2xl font-bold text-emerald-600">
                            ~{(activeSenders.reduce((acc, s) => acc + s.totalEmails, 0) * 0.12).toFixed(1)} MB
                          </div>
                          <div className="text-[11px] text-slate-400">Potential & freed space</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span>Gemini Autonomous Cleanup Recommendations</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 flex items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                Clean All High-Priority Marketing Newsletters
                              </div>
                              <div className="text-slate-500 dark:text-zinc-400 text-[11px]">
                                Target senders with &gt;10 unopened promotional emails without touching career notifications.
                              </div>
                            </div>
                            <button
                              onClick={() => handleSendMessage('Simulate the cleanup impact of unsubscribing from all high priority marketing newsletters')}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0 cursor-pointer"
                            >
                              Simulate & Clean
                            </button>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 flex items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                Audit Job Alert & Recruiter Protection
                              </div>
                              <div className="text-slate-500 dark:text-zinc-400 text-[11px]">
                                Ensure LinkedIn, Glassdoor, and recruitment emails remain safely preserved.
                              </div>
                            </div>
                            <button
                              onClick={() => handleSendMessage('Show all job alerts and recruitment emails')}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-200 font-semibold text-xs shrink-0 cursor-pointer"
                            >
                              Audit Alerts
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Canvas Tab 3: Rules & Whitelist */}
                  {activeCanvasTab === 'rules' && (
                    <div className="flex-1 p-5 overflow-y-auto space-y-4">
                      {/* Add Protected Domain Form */}
                      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Add VIP Protected Domain / Email</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newProtectedDomainInput}
                            onChange={(e) => setNewProtectedDomainInput(e.target.value)}
                            placeholder="e.g. substack.com or hiring@company.com"
                            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => {
                              if (newProtectedDomainInput.trim()) {
                                handleDirectAddWhitelist(newProtectedDomainInput.trim());
                                setNewProtectedDomainInput('');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                          >
                            + Add Protection
                          </button>
                        </div>
                      </div>

                      {/* Active Custom Filter Rules */}
                      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                            Active Rules ({settings.presetRules?.length || 0})
                          </h4>
                          <button
                            onClick={() => handleSendMessage('Create a new custom filter rule to protect Substack and tech blogs')}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                          >
                            + Ask Gemini to create rule
                          </button>
                        </div>

                        <div className="space-y-2">
                          {settings.presetRules?.map((rule) => (
                            <div
                              key={rule.id}
                              className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 dark:text-white">{rule.title}</div>
                                <div className="text-slate-500 dark:text-zinc-400 text-[11px]">{rule.description}</div>
                                <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                                  {rule.instruction}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  rule.enabled
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400'
                                }`}
                              >
                                {rule.enabled ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Canvas Tab 4: Session Audit Log */}
                  {activeCanvasTab === 'audit' && (
                    <div className="flex-1 p-5 overflow-y-auto space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Session Audit & Execution History ({auditLogs.length})</span>
                        </h4>
                      </div>

                      {auditLogs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-zinc-400 text-xs">
                          No cleanup actions executed in this session yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {auditLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white capitalize">
                                  {log.action.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-600 dark:text-zinc-300">
                                {log.senderEmail}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                <span>{log.messagesAffected} messages affected</span>
                                <span>•</span>
                                <span className="capitalize">{log.methodUsed || 'Completed'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

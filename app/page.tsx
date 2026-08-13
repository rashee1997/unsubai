'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { ScanFilterPanel, ScanConfig } from '@/components/ScanFilterPanel';
import { InboxHealthDashboard } from '@/components/InboxHealthDashboard';
import { SenderCard, GroupedSenderData, AIAnalysisData } from '@/components/SenderCard';
import { AuditLogModal, AuditLogEntry } from '@/components/AuditLogModal';
import { UnsubscribeConfirmModal } from '@/components/UnsubscribeConfirmModal';
import { BulkTrashConfirmModal } from '@/components/BulkTrashConfirmModal';
import { ClientIdModal } from '@/components/ClientIdModal';
import { Sparkles, Search, Filter, ShieldAlert, CheckCircle2, History, AlertCircle, RefreshCw, Mail, ArrowRight, Send, CheckSquare, Trash2, Briefcase } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

// Sample fallback data for immediate preview / demo testing
const SAMPLE_SENDERS: GroupedSenderData[] = [
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

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google_client_id');
      if (stored && stored.trim() !== '' && stored !== 'MY_GOOGLE_CLIENT_ID') {
        return stored;
      }
    }
    return '';
  });

  const [scanConfig, setScanConfig] = useState<ScanConfig>({
    timeframe: '30d',
    mode: 'unopened',
    maxResults: 60,
  });

  const [isScanning, setIsScanning] = useState(false);
  const [senders, setSenders] = useState<GroupedSenderData[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Unsubscribe & Cleanup States
  const [unsubscribingMap, setUnsubscribingMap] = useState<Record<string, boolean>>({});
  const [unsubscribedSet, setUnsubscribedSet] = useState<Set<string>>(new Set());
  const [cleaningMap, setCleaningMap] = useState<Record<string, boolean>>({});
  const [cleanedSet, setCleanedSet] = useState<Set<string>>(new Set());

  const [cleanedMessagesTotal, setCleanedMessagesTotal] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmCandidates, setConfirmCandidates] = useState<GroupedSenderData[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProcessedCount, setBatchProcessedCount] = useState(0);

  // Bulk Trash Modal State
  const [bulkTrashModalOpen, setBulkTrashModalOpen] = useState(false);
  const [bulkTrashCandidates, setBulkTrashCandidates] = useState<GroupedSenderData[]>([]);
  const [isBulkTrashProcessing, setIsBulkTrashProcessing] = useState(false);
  const [bulkTrashProcessedCount, setBulkTrashProcessedCount] = useState(0);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'job_alerts'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClientIdModalOpen, setIsClientIdModalOpen] = useState(false);

  // 1. Fetch Client ID if not already set locally
  useEffect(() => {
    fetch('/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.clientId && data.clientId !== 'MY_GOOGLE_CLIENT_ID') {
          setClientId((prev) => (prev ? prev : data.clientId));
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch User Profile when token is available
  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/gmail/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserEmail(data.emailAddress);
      }
    } catch {
      // fallback
    }
  }, []);

  // 3. Google OAuth Connect trigger with ID parameter
  const handleConnectWithId = useCallback(
    (activeClientId: string) => {
      setErrorMessage(null);

      if (!window.google?.accounts?.oauth2) {
        setErrorMessage('Google Identity Services script is loading. Please retry in a moment.');
        return;
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope:
            'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
          callback: (response: any) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              fetchUserProfile(response.access_token);
              setIsDemoMode(false);
            } else if (response.error) {
              setErrorMessage(`Authentication failed: ${response.error}`);
            }
          },
        });

        client.requestAccessToken({ prompt: '' });
      } catch (err: any) {
        setErrorMessage(`OAuth initialization error: ${err.message || 'Invalid Client ID'}`);
        setIsClientIdModalOpen(true);
      }
    },
    [fetchUserProfile]
  );

  const handleConnect = useCallback(() => {
    const activeClientId =
      clientId ||
      (typeof window !== 'undefined' ? localStorage.getItem('google_client_id') : null) ||
      (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'MY_GOOGLE_CLIENT_ID'
        ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        : '');

    if (!activeClientId || activeClientId.trim() === '' || activeClientId === 'MY_GOOGLE_CLIENT_ID') {
      setIsClientIdModalOpen(true);
      return;
    }

    handleConnectWithId(activeClientId);
  }, [clientId, handleConnectWithId]);

  const handleSaveClientId = (newClientId: string) => {
    setClientId(newClientId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_client_id', newClientId);
    }
    setIsClientIdModalOpen(false);
    setTimeout(() => {
      handleConnectWithId(newClientId);
    }, 100);
  };

  const handleDisconnect = () => {
    setAccessToken(null);
    setUserEmail(null);
    setSenders([]);
    setHasScanned(false);
  };

  // 4. Run Scan & AI Analysis
  const runScan = async () => {
    setErrorMessage(null);

    // If not connected, load sample demo dataset
    if (!accessToken) {
      setIsScanning(true);
      setTimeout(() => {
        setSenders(SAMPLE_SENDERS);
        setHasScanned(true);
        setIsDemoMode(true);
        setIsScanning(false);
      }, 1000);
      return;
    }

    setIsScanning(true);
    try {
      // Step A: Scan Gmail REST API
      const scanRes = await fetch('/api/gmail/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(scanConfig),
      });

      if (!scanRes.ok) {
        const errJson = await scanRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to scan Gmail inbox.');
      }

      const scanData = await scanRes.json();
      const fetchedSenders: GroupedSenderData[] = scanData.senders || [];

      if (fetchedSenders.length === 0) {
        setSenders([]);
        setHasScanned(true);
        setIsScanning(false);
        return;
      }

      // Step B: Send to Gemini AI for analysis
      const aiRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senders: fetchedSenders }),
      });

      let aiAnalysisMap: Record<string, AIAnalysisData> = {};
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const list: AIAnalysisData[] = aiData.sendersAnalysis || [];
        for (const item of list) {
          aiAnalysisMap[item.senderKey.toLowerCase()] = item;
        }
      }

      // Step C: Merge AI analysis with sender data
      const mergedSenders = fetchedSenders.map((s) => ({
        ...s,
        analysis: aiAnalysisMap[s.senderKey.toLowerCase()] || {
          senderKey: s.senderKey,
          unsubscribePriority: (s.unreadCount >= 2 ? 'high' : 'medium') as any,
          recommendationScore: Math.min(60 + s.unreadCount * 8, 98),
          category: 'Newsletter',
          summary: `Has ${s.unreadCount} unread email(s) in this scan period.`,
          isSensitive: false,
        },
      }));

      // Sort by AI recommendation score descending
      mergedSenders.sort((a, b) => (b.analysis?.recommendationScore || 0) - (a.analysis?.recommendationScore || 0));

      setSenders(mergedSenders);
      setHasScanned(true);
      setIsDemoMode(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing inbox scan.');
    } finally {
      setIsScanning(false);
    }
  };

  // Open Confirmation Modal for Single Sender
  const openConfirmModalForSender = (sender: GroupedSenderData) => {
    setConfirmCandidates([sender]);
    setConfirmModalOpen(true);
  };

  // Open Confirmation Modal for Batch High Priority or Filtered List
  const openConfirmModalForBatch = (batchList: GroupedSenderData[]) => {
    const unSubscribedFilter = batchList.filter((s) => !unsubscribedSet.has(s.senderKey));
    if (unSubscribedFilter.length === 0) return;
    setConfirmCandidates(unSubscribedFilter);
    setConfirmModalOpen(true);
  };

  // Open Bulk Trash Modal for High Priority Senders
  const openBulkTrashModalForHighPriority = () => {
    const highPriorityList = senders.filter((s) => s.analysis?.unsubscribePriority === 'high');
    const uncleanedList = highPriorityList.filter((s) => !cleanedSet.has(s.senderKey));
    const targetCandidates = uncleanedList.length > 0 ? uncleanedList : highPriorityList;
    if (targetCandidates.length === 0) return;
    setBulkTrashCandidates(targetCandidates);
    setBulkTrashModalOpen(true);
  };

  // Execute Bulk Trash for High Priority Senders
  const handleExecuteBulkTrashHighPriority = async (selectedSenders: GroupedSenderData[]) => {
    setIsBulkTrashProcessing(true);
    setBulkTrashProcessedCount(0);

    for (let i = 0; i < selectedSenders.length; i++) {
      const sender = selectedSenders[i];
      const key = sender.senderKey;

      setCleaningMap((prev) => ({ ...prev, [key]: true }));

      try {
        if (isDemoMode || !accessToken) {
          await new Promise((r) => setTimeout(r, 400));
          setCleanedSet((prev) => new Set(prev).add(key));
          setCleanedMessagesTotal((prev) => prev + sender.totalEmails);

          setAuditLogs((prev) => [
            {
              id: `${Date.now()}-trash-${i}`,
              senderName: sender.fromName,
              senderEmail: sender.fromEmail,
              action: 'trash',
              methodUsed: 'Bulk High Priority Trash',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messagesAffected: sender.totalEmails,
            },
            ...prev,
          ]);
        } else {
          if (sender.messageIds.length > 0) {
            const res = await fetch('/api/gmail/cleanup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                action: 'trash',
                messageIds: sender.messageIds,
              }),
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              console.error(`Failed to bulk trash messages for ${key}:`, err);
            }
          }

          setCleanedSet((prev) => new Set(prev).add(key));
          setCleanedMessagesTotal((prev) => prev + sender.totalEmails);

          setAuditLogs((prev) => [
            {
              id: `${Date.now()}-trash-${i}`,
              senderName: sender.fromName,
              senderEmail: sender.fromEmail,
              action: 'trash',
              methodUsed: 'Bulk High Priority Trash',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messagesAffected: sender.totalEmails,
            },
            ...prev,
          ]);
        }
      } catch (err: any) {
        console.error('Error during bulk trash operation:', err);
      } finally {
        setCleaningMap((prev) => ({ ...prev, [key]: false }));
        setBulkTrashProcessedCount(i + 1);
      }
    }

    setIsBulkTrashProcessing(false);
    setBulkTrashModalOpen(false);
  };

  // Execute Confirmed Unsubscriptions
  const handleExecuteConfirmedUnsubscribes = async (
    selectedSenders: GroupedSenderData[],
    autoTrashEmails: boolean
  ) => {
    setIsBatchProcessing(true);
    setBatchProcessedCount(0);

    for (let i = 0; i < selectedSenders.length; i++) {
      const sender = selectedSenders[i];
      const key = sender.senderKey;

      setUnsubscribingMap((prev) => ({ ...prev, [key]: true }));

      try {
        if (isDemoMode || !accessToken) {
          await new Promise((r) => setTimeout(r, 400));
          setUnsubscribedSet((prev) => new Set(prev).add(key));

          if (autoTrashEmails) {
            setCleanedSet((prev) => new Set(prev).add(key));
            setCleanedMessagesTotal((prev) => prev + sender.totalEmails);
          }

          setAuditLogs((prev) => [
            {
              id: `${Date.now()}-${i}`,
              senderName: sender.fromName,
              senderEmail: sender.fromEmail,
              action: 'unsubscribe',
              methodUsed: sender.unsubscribePostHeader ? 'RFC 8058 One-Click' : 'Mailto Automation',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messagesAffected: sender.totalEmails,
            },
            ...prev,
          ]);
        } else {
          // Call Gmail Unsubscribe Endpoint
          const res = await fetch('/api/gmail/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              senderKey: sender.senderKey,
              unsubscribeUrl: sender.unsubscribeUrl,
              unsubscribeMailto: sender.unsubscribeMailto,
              unsubscribePostHeader: sender.unsubscribePostHeader,
            }),
          });

          const data = await res.json();
          if (data.redirectUrl && data.method === 'web_redirect') {
            window.open(data.redirectUrl, '_blank');
          }

          setUnsubscribedSet((prev) => new Set(prev).add(key));

          // Optionally trash messages if user opted-in on confirmation modal
          if (autoTrashEmails && sender.messageIds.length > 0) {
            await fetch('/api/gmail/cleanup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                action: 'trash',
                messageIds: sender.messageIds,
              }),
            }).catch(() => {});
            setCleanedSet((prev) => new Set(prev).add(key));
            setCleanedMessagesTotal((prev) => prev + sender.totalEmails);
          }

          setAuditLogs((prev) => [
            {
              id: `${Date.now()}-${i}`,
              senderName: sender.fromName,
              senderEmail: sender.fromEmail,
              action: 'unsubscribe',
              methodUsed: data.method || 'Unsubscribed',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messagesAffected: sender.totalEmails,
            },
            ...prev,
          ]);
        }
      } catch (err: any) {
        console.error('Error unsubscribing', err);
      } finally {
        setUnsubscribingMap((prev) => ({ ...prev, [key]: false }));
        setBatchProcessedCount(i + 1);
      }
    }

    setIsBatchProcessing(false);
    setConfirmModalOpen(false);
  };

  // Handle Batch Inbox Cleanup Action (Trash/Archive)
  const handleCleanup = async (sender: GroupedSenderData, action: 'trash' | 'archive' | 'mark_read') => {
    const key = sender.senderKey;
    setCleaningMap((prev) => ({ ...prev, [key]: true }));

    try {
      if (isDemoMode || !accessToken) {
        await new Promise((r) => setTimeout(r, 500));
        setCleanedSet((prev) => new Set(prev).add(key));
        setCleanedMessagesTotal((prev) => prev + sender.totalEmails);
        return;
      }

      const res = await fetch('/api/gmail/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action,
          messageIds: sender.messageIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Cleanup failed');
      }

      setCleanedSet((prev) => new Set(prev).add(key));
      setCleanedMessagesTotal((prev) => prev + sender.totalEmails);
    } catch (err: any) {
      setErrorMessage(`Cleanup error: ${err.message}`);
    } finally {
      setCleaningMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Filtering senders
  const filteredSenders = senders.filter((s) => {
    const matchesSearch =
      s.fromName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.analysis?.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (priorityFilter === 'high') return s.analysis?.unsubscribePriority === 'high';
    if (priorityFilter === 'medium') return s.analysis?.unsubscribePriority === 'medium';
    if (priorityFilter === 'low') return s.analysis?.unsubscribePriority === 'low';
    if (priorityFilter === 'job_alerts') return Boolean(s.analysis?.isJobRelated || s.analysis?.category?.toLowerCase().includes('job'));

    return true;
  });

  const highPriorityList = senders.filter((s) => s.analysis?.unsubscribePriority === 'high');
  const highPriorityCount = highPriorityList.length;
  const jobAlertsList = senders.filter((s) => s.analysis?.isJobRelated || s.analysis?.category?.toLowerCase().includes('job'));
  const jobAlertsCount = jobAlertsList.length;
  const totalUnreadEmails = senders.reduce((acc, s) => acc + s.unreadCount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0B] text-zinc-100 font-sans">
      {/* Navbar */}
      <Navbar
        userEmail={userEmail}
        isConnected={Boolean(accessToken)}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isScanning={isScanning}
        unsubscribedCount={unsubscribedSet.size}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner if not connected */}
        {!accessToken && (
          <div className="mb-8 rounded-3xl bg-[#121215] border border-zinc-800 text-white p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Smart Gmail Unsubscriber with Safety Confirmation</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Review unopened emails & explicitly confirm unsubscriptions.
              </h1>

              <p className="text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed">
                Connect your Gmail account to let Gemini AI identify newsletter subscriptions, calculate priority scores, and present a clear confirmation step before unsubscribing.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleConnect}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Connect Gmail & Start Free Scan</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={runScan}
                  className="px-5 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-colors border border-zinc-700/80 cursor-pointer"
                >
                  Preview Demo Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Preview Mode Active:</strong> Currently showing sample email subscriptions. Connect your live Gmail account above to scan your actual inbox!
              </span>
            </div>
            <button
              onClick={handleConnect}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 transition-colors shrink-0 cursor-pointer"
            >
              Connect Gmail
            </button>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-950/50 border border-rose-800/70 text-rose-200 text-xs sm:text-sm space-y-3 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Scan Issue Detected</h4>
                  <p className="text-rose-200/90 text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs font-semibold text-rose-300 hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-rose-900/60 flex flex-wrap items-center gap-2">
              <button
                onClick={handleConnect}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconnect Gmail</span>
              </button>

              <button
                onClick={() => setIsClientIdModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Set OAuth Client ID
              </button>

              <button
                onClick={() => {
                  setErrorMessage(null);
                  setSenders(SAMPLE_SENDERS);
                  setHasScanned(true);
                  setIsDemoMode(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Load Demo Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Scan Filter Configuration Panel */}
        <ScanFilterPanel
          config={scanConfig}
          onChange={setScanConfig}
          onStartScan={runScan}
          isScanning={isScanning}
          isConnected={Boolean(accessToken)}
        />

        {/* Health Dashboard Metrics */}
        {hasScanned && (
          <InboxHealthDashboard
            totalSenders={senders.length}
            highPriorityCount={highPriorityCount}
            totalUnreadEmails={totalUnreadEmails}
            unsubscribedCount={unsubscribedSet.size}
            cleanedMessagesCount={cleanedMessagesTotal}
            senders={senders}
            jobAlertsCount={jobAlertsCount}
            onBulkTrashHighPriority={openBulkTrashModalForHighPriority}
            onBulkUnsubscribeHighPriority={() => openConfirmModalForBatch(highPriorityList)}
            onBulkUnsubscribeAll={() => openConfirmModalForBatch(senders)}
            onSelectJobAlertsFilter={() => setPriorityFilter('job_alerts')}
          />
        )}

        {/* Results Toolbar & Search Controls */}
        {hasScanned && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121215] p-4 rounded-2xl border border-zinc-800 shadow-lg">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sender name or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Batch Action & Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
              {/* Batch Confirm Unsubscribe Button */}
              {highPriorityCount > 0 && (
                <button
                  type="button"
                  onClick={() => openConfirmModalForBatch(highPriorityList)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm Unsubscribe High Priority ({highPriorityCount})</span>
                </button>
              )}

              {/* Bulk Trash High Priority Button */}
              {highPriorityCount > 0 && (
                <button
                  type="button"
                  onClick={openBulkTrashModalForHighPriority}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    Bulk Trash High Priority (
                    {highPriorityList.reduce((acc, s) => acc + (cleanedSet.has(s.senderKey) ? 0 : s.totalEmails), 0)})
                  </span>
                </button>
              )}

              {[
                { id: 'all', label: `All (${senders.length})` },
                { id: 'high', label: `High (${highPriorityCount})` },
                { id: 'job_alerts', label: `💼 Job Alerts (${jobAlertsCount})` },
                { id: 'medium', label: 'Medium' },
                { id: 'low', label: 'Low / Keep' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPriorityFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    priorityFilter === tab.id
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {auditLogs.length > 0 && (
                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-xs font-semibold hover:bg-emerald-900/60 transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <History className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audit Log ({auditLogs.length})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sender Cards Grid */}
        {hasScanned && (
          <div className="space-y-4">
            {filteredSenders.length === 0 ? (
              <div className="text-center py-12 bg-[#121215] rounded-2xl border border-zinc-800 p-8 shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No matching senders found</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                  Try adjusting your search query, priority filter, or changing your timeframe threshold to scan deeper into your inbox.
                </p>
              </div>
            ) : (
              filteredSenders.map((sender) => (
                <SenderCard
                  key={sender.senderKey}
                  sender={sender}
                  onUnsubscribe={(s) => Promise.resolve(openConfirmModalForSender(s))}
                  onCleanup={handleCleanup}
                  isUnsubscribing={Boolean(unsubscribingMap[sender.senderKey])}
                  isCleaning={Boolean(cleaningMap[sender.senderKey])}
                  isUnsubscribed={unsubscribedSet.has(sender.senderKey)}
                  isCleaned={cleanedSet.has(sender.senderKey)}
                />
              ))
            )}
          </div>
        )}

        {/* Initial Prompt State if not scanned yet */}
        {!hasScanned && !isScanning && (
          <div className="text-center py-16 bg-[#121215] rounded-3xl border border-zinc-800 p-8 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-800/60 shadow-lg">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Ready to clean your inbox safely</h3>
            <p className="text-sm text-zinc-400 mt-2 max-w-lg mx-auto">
              Select your search criteria above and click <strong>&quot;Scan Inbox for Unopened Emails&quot;</strong> to discover recurring subscriptions and explicitly confirm senders before unsubscribing.
            </p>
          </div>
        )}
      </main>

      {/* Explicit Confirmation Step Modal */}
      <UnsubscribeConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        candidates={confirmCandidates}
        onConfirmExecute={handleExecuteConfirmedUnsubscribes}
        isProcessing={isBatchProcessing}
        processedCount={batchProcessedCount}
        totalToProcess={confirmCandidates.length}
      />

      {/* Bulk Trash Confirmation Modal */}
      <BulkTrashConfirmModal
        isOpen={bulkTrashModalOpen}
        onClose={() => setBulkTrashModalOpen(false)}
        candidates={bulkTrashCandidates}
        onConfirmExecute={handleExecuteBulkTrashHighPriority}
        isProcessing={isBulkTrashProcessing}
        processedCount={bulkTrashProcessedCount}
        totalToProcess={bulkTrashCandidates.length}
      />

      {/* Audit Log Drawer/Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={auditLogs}
        onClearLogs={() => setAuditLogs([])}
      />

      {/* Google OAuth Client ID Modal */}
      <ClientIdModal
        isOpen={isClientIdModalOpen}
        onClose={() => setIsClientIdModalOpen(false)}
        onSaveClientId={handleSaveClientId}
        onUseDemoMode={runScan}
        initialValue={clientId}
      />
    </div>
  );
}

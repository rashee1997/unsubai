'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { ScanFilterPanel, ScanConfig } from '@/components/ScanFilterPanel';
import { InboxHealthDashboard } from '@/components/InboxHealthDashboard';
import { SenderCard, GroupedSenderData, AIAnalysisData } from '@/components/SenderCard';
import { EmailPreviewModal } from '@/components/EmailPreviewModal';
import { AuditLogModal, AuditLogEntry } from '@/components/AuditLogModal';
import { UnsubscribeConfirmModal } from '@/components/UnsubscribeConfirmModal';
import { BulkTrashConfirmModal } from '@/components/BulkTrashConfirmModal';
import { ClientIdModal } from '@/components/ClientIdModal';
import { Sparkles, Search, ShieldAlert, CheckCircle2, History, AlertCircle, RefreshCw, Mail, ArrowRight, Send, Trash2, Globe, Tag, X, FilterX, AtSign, Check, SlidersHorizontal } from 'lucide-react';
import { getStoredSettings, compileCombinedCustomInstructions, saveStoredSettings, CustomFilterRule, AppSettings } from '@/lib/settings';
import { GeminiChatbot } from '@/components/GeminiChatbot';
import { filterSendersFuzzy } from '@/lib/fuzzySearch';
import { classifySender, isJobAlertSender } from '@/lib/classification';
import { useToast } from '@/components/Toast';

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
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('unsub_ai_client_id');
      if (stored && stored.trim()) return stored.trim();
    }
    return (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  });
  const [isClientIdModalOpen, setIsClientIdModalOpen] = useState(false);

  // Auto-fetch Google Client ID from runtime environment variables / secrets
  useEffect(() => {
    async function loadClientConfig() {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          if (data.clientId && data.clientId.trim()) {
            setClientId((prev) => {
              const trimmed = data.clientId.trim();
              if (!prev || prev !== trimmed) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('unsub_ai_client_id', trimmed);
                }
                return trimmed;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn('Could not auto-fetch Google Client ID from server config:', err);
      }
    }
    loadClientConfig();
  }, []);


  // Scan Configuration State
  const [scanConfig, setScanConfig] = useState<ScanConfig>({
    timeframe: '30d',
    mode: 'unopened',
    maxResults: 60,
  });

  // Main Senders State & UI States
  const [senders, setSenders] = useState<GroupedSenderData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive Action Sets & Maps
  const [unsubscribedSet, setUnsubscribedSet] = useState<Set<string>>(new Set());
  const [cleanedSet, setCleanedSet] = useState<Set<string>>(new Set());
  const [cleanedMessagesTotal, setCleanedMessagesTotal] = useState<number>(0);
  const [unsubscribingMap, setUnsubscribingMap] = useState<Record<string, boolean>>({});
  const [cleaningMap, setCleaningMap] = useState<Record<string, boolean>>({});

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [domainFilterMode, setDomainFilterMode] = useState<'include' | 'exclude'>('include');
  const [contextTypeFilter, setContextTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'job_alerts'>('all');

  // Modals & Audit Logs
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Safety Confirmation Step State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmCandidates, setConfirmCandidates] = useState<GroupedSenderData[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProcessedCount, setBatchProcessedCount] = useState(0);

  // Bulk Trash Modal State
  const [bulkTrashModalOpen, setBulkTrashModalOpen] = useState(false);
  const [bulkTrashCandidates, setBulkTrashCandidates] = useState<GroupedSenderData[]>([]);
  const [isBulkTrashProcessing, setIsBulkTrashProcessing] = useState(false);
  const [bulkTrashProcessedCount, setBulkTrashProcessedCount] = useState(0);

  // Email Full Preview Modal State
  const [previewingSender, setPreviewingSender] = useState<GroupedSenderData | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // App Settings State & Chatbot Live CRUD Callbacks
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getStoredSettings());

  const handleChatbotUnsubscribe = async (senderKeys: string[], autoTrash: boolean) => {
    const targets = senders.filter((s) => senderKeys.includes(s.senderKey) || senderKeys.includes(s.fromEmail));
    if (targets.length === 0) {
      const fallbacks: GroupedSenderData[] = senderKeys.map((k) => ({
        senderKey: k,
        fromName: k.split('@')[0],
        fromEmail: k,
        domain: k.split('@')[1] || 'custom.com',
        totalEmails: 1,
        unreadCount: 1,
        latestDate: 'Just now',
        latestTimestamp: Date.now(),
        sampleSubject: 'Direct Chatbot Unsubscribe',
        sampleSnippet: 'Unsubscribed via Gemini AI Chatbot agent',
        unsubscribeUrl: `https://${k.split('@')[1] || 'custom.com'}/unsubscribe`,
        unsubscribeMailto: null,
        unsubscribePostHeader: null,
        messageIds: [],
        unreadMessageIds: [],
        analysis: {
          senderKey: k,
          unsubscribePriority: 'high',
          recommendationScore: 90,
          category: 'Chatbot Targeted',
          summary: 'Unsubscribed directly via Gemini Chatbot',
          isSensitive: false,
        },
      }));
      await handleExecuteConfirmedUnsubscribes(fallbacks, autoTrash);
    } else {
      await handleExecuteConfirmedUnsubscribes(targets, autoTrash);
    }
  };

  const handleChatbotTrash = async (senderKeys: string[]) => {
    const targets = senders.filter((s) => senderKeys.includes(s.senderKey) || senderKeys.includes(s.fromEmail));
    if (targets.length > 0) {
      await handleExecuteBulkTrashHighPriority(targets);
    }
  };

  const handleChatbotUpdatePriority = (
    senderKey: string,
    newPriority: 'high' | 'medium' | 'low',
    isJobRelated?: boolean
  ) => {
    setSenders((prev) =>
      prev.map((s) => {
        if (s.senderKey === senderKey || s.fromEmail === senderKey) {
          return {
            ...s,
            analysis: {
              ...(s.analysis || {
                senderKey: s.senderKey,
                recommendationScore: newPriority === 'high' ? 90 : 20,
                category: 'Updated',
                summary: 'Priority updated via Gemini Chatbot',
                isSensitive: newPriority === 'low',
              }),
              unsubscribePriority: newPriority,
              isJobRelated: isJobRelated !== undefined ? isJobRelated : s.analysis?.isJobRelated || false,
            },
          };
        }
        return s;
      })
    );
  };

  const handleChatbotAddRule = (rule: Omit<CustomFilterRule, 'id' | 'enabled'>) => {
    const current = getStoredSettings();
    const newRule: CustomFilterRule = {
      ...rule,
      id: `custom_${Date.now()}`,
      enabled: true,
    };
    const updated = {
      ...current,
      presetRules: [newRule, ...current.presetRules],
    };
    saveStoredSettings(updated);
    setAppSettings(updated);
  };

  const handleChatbotUpdateScanConfig = (newConfig: any) => {
    setScanConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const handleChatbotAddProtectedDomain = (domainOrEmail: string) => {
    const current = getStoredSettings();
    const updatedText = current.customInstructionsText
      ? `${current.customInstructionsText}\n- ALWAYS PROTECT: ${domainOrEmail}`
      : `- ALWAYS PROTECT: ${domainOrEmail}`;
    const updated = {
      ...current,
      customInstructionsText: updatedText,
    };
    saveStoredSettings(updated);
    setAppSettings(updated);
  };

  // Save updated Client ID
  const handleSaveClientId = (newId: string) => {
    setClientId(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('unsub_ai_client_id', newId);
    }
    setIsClientIdModalOpen(false);
  };

  // Google OAuth Popup Initializer
  const handleConnect = useCallback(async () => {
    let activeClientId = clientId;

    // If client ID is missing in state, attempt to load from localStorage or server auth config
    if (!activeClientId) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('unsub_ai_client_id');
        if (stored && stored.trim()) {
          activeClientId = stored.trim();
          setClientId(activeClientId);
        }
      }
    }

    if (!activeClientId) {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          if (data.clientId && data.clientId.trim()) {
            activeClientId = data.clientId.trim();
            setClientId(activeClientId);
            if (typeof window !== 'undefined') {
              localStorage.setItem('unsub_ai_client_id', activeClientId);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch auth config:', e);
      }
    }

    if (!activeClientId) {
      setIsClientIdModalOpen(true);
      return;
    }

    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      setErrorMessage('Google Identity Services library is loading. Please retry in a moment.');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope:
          'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
        callback: async (response: any) => {
          if (response.error) {
            console.error('OAuth token error:', response);
            setErrorMessage(`Google Login Failed: ${response.error_description || response.error}`);
            return;
          }

          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsDemoMode(false);
            setErrorMessage(null);

            // Fetch User Profile
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (res.ok) {
                const info = await res.json();
                setUserEmail(info.email || 'Connected User');
              }
            } catch (e) {
              setUserEmail('Connected User');
            }
          }
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      console.error('Failed to init Google Token Client:', err);
      setErrorMessage(`OAuth Client Error: ${err.message || 'Check Client ID configuration.'}`);
    }
  }, [clientId]);

  // Handle Disconnect
  const handleDisconnect = () => {
    setAccessToken(null);
    setUserEmail(null);
    setSenders([]);
    setHasScanned(false);
    setIsDemoMode(false);
  };

  // Trigger Inbox Scan & AI Priority Scoring
  const runScan = async () => {
    setIsScanning(true);
    setErrorMessage(null);

    // If no access token, run demo mode with high quality sample data
    if (!accessToken) {
      setTimeout(() => {
        setSenders(SAMPLE_SENDERS);
        setHasScanned(true);
        setIsScanning(false);
        setIsDemoMode(true);
        toast.info(`Loaded ${SAMPLE_SENDERS.length} demo subscription senders. Connect Gmail to scan your live inbox.`, {
          title: 'Demo Mode Loaded',
        });
      }, 1200);
      return;
    }

    try {
      // Get stored custom filter rules & direct instructions
      const userSettings = getStoredSettings();
      const combinedCustomInstructions = compileCombinedCustomInstructions(userSettings);

      const res = await fetch('/api/gmail/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          timeframe: scanConfig.timeframe,
          mode: scanConfig.mode,
          maxResults: scanConfig.maxResults,
          customQuery: scanConfig.customQuery,
          customInstructions: combinedCustomInstructions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Scan failed with status ${res.status}`);
      }

      const data = await res.json();
      const rawSenders = data.senders || [];
      const classifiedSenders: GroupedSenderData[] = rawSenders.map((s: any) => ({
        ...s,
        analysis: classifySender({
          senderKey: s.senderKey,
          fromName: s.fromName,
          fromEmail: s.fromEmail,
          domain: s.domain,
          totalEmails: s.totalEmails,
          unreadCount: s.unreadCount,
          sampleSubject: s.sampleSubject,
          sampleSnippet: s.sampleSnippet,
          existingAnalysis: s.analysis,
        }),
      }));

      setSenders(classifiedSenders);
      setHasScanned(true);
      setIsDemoMode(false);
      toast.success(`Identified ${classifiedSenders.length} recurring subscription sender${classifiedSenders.length === 1 ? '' : 's'}.`, {
        title: 'Inbox Scan Complete',
      });

      // Asynchronously trigger AI Deep Analysis to enrich summaries & categories if senders found
      if (classifiedSenders.length > 0) {
        fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senders: classifiedSenders,
            customInstructions: combinedCustomInstructions,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((aiData) => {
            if (aiData?.sendersAnalysis && Array.isArray(aiData.sendersAnalysis)) {
              const analysisMap = new Map<string, any>(
                aiData.sendersAnalysis.map((item: any) => [item.senderKey, item])
              );

              setSenders((current) =>
                current.map((sender) => {
                  const aiItem = analysisMap.get(sender.senderKey);
                  if (aiItem) {
                    return {
                      ...sender,
                      analysis: classifySender({
                        senderKey: sender.senderKey,
                        fromName: sender.fromName,
                        fromEmail: sender.fromEmail,
                        domain: sender.domain,
                        totalEmails: sender.totalEmails,
                        unreadCount: sender.unreadCount,
                        sampleSubject: sender.sampleSubject,
                        sampleSnippet: sender.sampleSnippet,
                        existingAnalysis: aiItem,
                      }),
                    };
                  }
                  return sender;
                })
              );
            }
          })
          .catch((aiErr) => {
            console.warn('AI background enrichment skipped:', aiErr);
          });
      }
    } catch (err: any) {
      console.error('Error scanning Gmail:', err);
      const errMsg = err.message || 'Failed to scan inbox. Ensure permissions are granted or try Demo Mode.';
      setErrorMessage(errMsg);
      toast.error(errMsg, { title: 'Scan Error' });

      // Fallback to demo mode so user experiences full app features
      if (senders.length === 0) {
        setSenders(SAMPLE_SENDERS);
        setHasScanned(true);
        setIsDemoMode(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Open Safety Confirmation Step Modal for a Single Sender
  const openConfirmModalForSender = (sender: GroupedSenderData) => {
    setConfirmCandidates([sender]);
    setConfirmModalOpen(true);
  };

  // Open Safety Confirmation Step Modal for Batch/Group
  const openConfirmModalForBatch = (batch: GroupedSenderData[]) => {
    const activeCandidates = batch.filter((s) => !unsubscribedSet.has(s.senderKey));
    if (activeCandidates.length === 0) return;
    setConfirmCandidates(activeCandidates);
    setConfirmModalOpen(true);
  };

  // Open Bulk Trash Confirmation Modal for High Priority List
  const openBulkTrashModalForHighPriority = () => {
    const highPriorityList = senders.filter((s) => s.analysis?.unsubscribePriority === 'high');
    const candidatesToTrash = highPriorityList.filter((s) => !cleanedSet.has(s.senderKey));
    if (candidatesToTrash.length === 0) return;
    setBulkTrashCandidates(candidatesToTrash);
    setBulkTrashModalOpen(true);
  };

  // Execute Confirmed Bulk Trash Operation
  const handleExecuteBulkTrashHighPriority = async (candidates: GroupedSenderData[]) => {
    setIsBulkTrashProcessing(true);
    setBulkTrashProcessedCount(0);
    let successCount = 0;
    let failureCount = 0;
    let totalMessagesTrashed = 0;

    for (let i = 0; i < candidates.length; i++) {
      const sender = candidates[i];
      const key = sender.senderKey;

      setCleaningMap((prev) => ({ ...prev, [key]: true }));

      try {
        if (isDemoMode || !accessToken) {
          await new Promise((r) => setTimeout(r, 300));
          setCleanedSet((prev) => new Set(prev).add(key));
          setCleanedMessagesTotal((prev) => prev + sender.totalEmails);
          successCount++;
          totalMessagesTrashed += sender.totalEmails;

          setAuditLogs((prev) => [
            {
              id: `${Date.now()}-trash-${i}`,
              senderName: sender.fromName,
              senderEmail: sender.fromEmail,
              action: 'trash',
              methodUsed: 'Bulk High Priority Trash (Demo)',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messagesAffected: sender.totalEmails,
            },
            ...prev,
          ]);
        } else {
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
            failureCount++;
          } else {
            setCleanedSet((prev) => new Set(prev).add(key));
            setCleanedMessagesTotal((prev) => prev + sender.totalEmails);
            successCount++;
            totalMessagesTrashed += sender.totalEmails;

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
        }
      } catch (err: any) {
        console.error('Error during bulk trash operation:', err);
        failureCount++;
      } finally {
        setCleaningMap((prev) => ({ ...prev, [key]: false }));
        setBulkTrashProcessedCount(i + 1);
      }
    }

    setIsBulkTrashProcessing(false);
    setBulkTrashModalOpen(false);

    if (failureCount === 0 && successCount > 0) {
      toast.success(
        `Moved ${successCount} sender${successCount > 1 ? 's' : ''} (${totalMessagesTrashed} email${totalMessagesTrashed > 1 ? 's' : ''}) to Trash.`,
        {
          title: 'Bulk Trash Completed',
          description: 'Your selected emails have been moved to Trash safely.',
        }
      );
    } else if (failureCount > 0 && successCount > 0) {
      toast.warning(
        `Moved ${successCount} of ${candidates.length} senders to Trash. ${failureCount} failed.`,
        {
          title: 'Partial Bulk Trash',
        }
      );
    } else if (failureCount > 0 && successCount === 0) {
      toast.error(
        `Failed to bulk trash emails for ${failureCount} sender${failureCount > 1 ? 's' : ''}.`,
        {
          title: 'Bulk Trash Failed',
        }
      );
    }
  };

  // Execute Confirmed Unsubscriptions
  const handleExecuteConfirmedUnsubscribes = async (
    selectedSenders: GroupedSenderData[],
    autoTrashEmails: boolean
  ) => {
    setIsBatchProcessing(true);
    setBatchProcessedCount(0);
    let successCount = 0;
    let failureCount = 0;
    let trashedMessagesCount = 0;

    for (let i = 0; i < selectedSenders.length; i++) {
      const sender = selectedSenders[i];
      const key = sender.senderKey;

      setUnsubscribingMap((prev) => ({ ...prev, [key]: true }));

      try {
        if (isDemoMode || !accessToken) {
          await new Promise((r) => setTimeout(r, 400));
          setUnsubscribedSet((prev) => new Set(prev).add(key));
          successCount++;

          if (autoTrashEmails) {
            setCleanedSet((prev) => new Set(prev).add(key));
            setCleanedMessagesTotal((prev) => prev + sender.totalEmails);
            trashedMessagesCount += sender.totalEmails;
          }

          setAuditLogs((prev) => [
            {
              id: `${Date.now()}-${i}`,
              senderName: sender.fromName,
              senderEmail: sender.fromEmail,
              action: 'unsubscribe',
              methodUsed: sender.unsubscribePostHeader ? 'One-Click Post' : 'Direct Link / Mailto',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messagesAffected: autoTrashEmails ? sender.totalEmails : 0,
            },
            ...prev,
          ]);
        } else {
          const res = await fetch('/api/gmail/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              senderEmail: sender.fromEmail,
              unsubscribeUrl: sender.unsubscribeUrl,
              unsubscribeMailto: sender.unsubscribeMailto,
              unsubscribePostHeader: sender.unsubscribePostHeader,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Unsubscribe failed');

          setUnsubscribedSet((prev) => new Set(prev).add(key));
          successCount++;

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
            });
            setCleanedSet((prev) => new Set(prev).add(key));
            setCleanedMessagesTotal((prev) => prev + sender.totalEmails);
            trashedMessagesCount += sender.totalEmails;
          }

          setAuditLogs((prev) => [
            {
              id: `${Date.now()}-${i}`,
              senderName: sender.fromName,
              senderEmail: sender.fromEmail,
              action: 'unsubscribe',
              methodUsed: data.methodUsed || 'API Triggered',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messagesAffected: autoTrashEmails ? sender.totalEmails : 0,
            },
            ...prev,
          ]);
        }
      } catch (err: any) {
        console.error('Error unsubscribing', err);
        failureCount++;
      } finally {
        setUnsubscribingMap((prev) => ({ ...prev, [key]: false }));
        setBatchProcessedCount(i + 1);
      }
    }

    setIsBatchProcessing(false);
    setConfirmModalOpen(false);

    if (failureCount === 0 && successCount > 0) {
      const isBulk = selectedSenders.length > 1;
      const msg = isBulk
        ? `Successfully unsubscribed from ${successCount} senders${autoTrashEmails ? ` and moved ${trashedMessagesCount} emails to Trash.` : '.'}`
        : `Successfully unsubscribed from ${selectedSenders[0].fromName || selectedSenders[0].fromEmail}${autoTrashEmails ? ` and trashed ${trashedMessagesCount} emails.` : '.'}`;

      toast.success(msg, {
        title: isBulk ? 'Bulk Unsubscribe Complete' : 'Unsubscribed Successfully',
        description: 'Unsubscribe requests have been sent.',
      });
    } else if (failureCount > 0 && successCount > 0) {
      toast.warning(
        `Unsubscribed from ${successCount} of ${selectedSenders.length} senders (${failureCount} failed).`,
        {
          title: 'Partial Unsubscribe',
        }
      );
    } else if (failureCount > 0 && successCount === 0) {
      toast.error(
        `Failed to unsubscribe from ${failureCount} sender${failureCount > 1 ? 's' : ''}.`,
        {
          title: 'Unsubscribe Failed',
        }
      );
    }
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
        const actionLabel = action === 'trash' ? 'moved to Trash' : action === 'archive' ? 'archived' : 'marked as read';
        toast.success(
          `${sender.totalEmails} email(s) from ${sender.fromName || sender.fromEmail} ${actionLabel} (Demo).`,
          { title: 'Cleanup Completed' }
        );
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

      const actionLabel = action === 'trash' ? 'moved to Trash' : action === 'archive' ? 'archived' : 'marked as read';
      toast.success(
        `${sender.totalEmails} email(s) from ${sender.fromName || sender.fromEmail} ${actionLabel}.`,
        { title: 'Cleanup Completed' }
      );
    } catch (err: any) {
      const errMsg = `Cleanup error: ${err.message}`;
      setErrorMessage(errMsg);
      toast.error(`Failed to ${action} emails from ${sender.fromName || sender.fromEmail}: ${err.message}`, {
        title: 'Cleanup Error',
      });
    } finally {
      setCleaningMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Filtering senders using fuzzy matching and domain / context use-type criteria
  const filteredSenders = filterSendersFuzzy(senders, {
    query: searchQuery,
    domainFilter,
    domainFilterMode,
    contextType: contextTypeFilter,
    priorityFilter,
  });

  // Extract top domains from active senders for quick domain chip selection
  const topDomains = Array.from(
    new Set(senders.map((s) => s.domain).filter(Boolean))
  ).slice(0, 8);

  const highPriorityList = senders.filter((s) => {
    const analysis = s.analysis || classifySender(s);
    const isJob = analysis.isJobRelated || isJobAlertSender(s) || analysis.category?.toLowerCase().includes('job');
    return !isJob && analysis.unsubscribePriority === 'high';
  });
  const highPriorityCount = highPriorityList.length;

  const jobAlertsList = senders.filter((s) => {
    const analysis = s.analysis || classifySender(s);
    return analysis.isJobRelated || isJobAlertSender(s) || analysis.category?.toLowerCase().includes('job');
  });
  const jobAlertsCount = jobAlertsList.length;
  const totalUnreadEmails = senders.reduce((acc, s) => acc + s.unreadCount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-200">
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
          <div className="mb-8 rounded-3xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors">
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200 dark:border-indigo-500/20 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Gmail Unsubscribe & Filter Assistant</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Review unopened emails & manage unsubscriptions safely.
              </h1>

              <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed">
                Connect your Gmail account to categorize subscription emails, evaluate priority levels, and unsubscribe with explicit confirmation.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleConnect}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  <span>Connect Gmail Account</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={runScan}
                  className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-300 font-semibold text-sm transition-colors border border-slate-200 dark:border-zinc-700/80 cursor-pointer"
                >
                  Try Demo Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
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
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200 text-xs sm:text-sm space-y-3 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Scan Issue Detected</h4>
                  <p className="text-rose-800 dark:text-rose-200/90 text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 flex flex-wrap items-center gap-2">
              <button
                onClick={handleConnect}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconnect Gmail</span>
              </button>

              <button
                onClick={() => setIsClientIdModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
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
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
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

        {/* Results Toolbar & Advanced Domain/Fuzzy Filters */}
        {hasScanned && (
          <div className="mb-6 space-y-4">
            {/* Top Toolbar Panel */}
            <div className="glass-panel p-4 sm:p-5 transition-all space-y-4">
              {/* Row 1: Fuzzy Text Search & Custom Domain Filter Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Fuzzy Search Input Box */}
                <div className="md:col-span-6 relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Search className="w-3 h-3 text-indigo-500" />
                      <span>Fuzzy Search (Name, Email, Snippets, Category)</span>
                    </label>
                    {searchQuery && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                        ✨ Fuzzy Match Active
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Fuzzy match name, subject, category (e.g. 'substk', 'job', 'news')..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="glass-input w-full pl-10 pr-8 py-2 text-xs sm:text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Custom Domain Filter Input Box & Mode Toggle */}
                <div className="md:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <AtSign className="w-3 h-3 text-indigo-500" />
                      <span>Custom Domain Filter</span>
                    </label>

                    {/* Include / Exclude Mode Toggle */}
                    <div className="flex items-center space-x-1 bg-slate-200/60 dark:bg-zinc-800/60 p-0.5 rounded-lg text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setDomainFilterMode('include')}
                        className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          domainFilterMode === 'include'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Match Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setDomainFilterMode('exclude')}
                        className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          domainFilterMode === 'exclude'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Exclude Domain
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <Globe className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={
                        domainFilterMode === 'include'
                          ? "Filter domain (e.g. substack.com or @linkedin.com)..."
                          : "Exclude domain (e.g. gmail.com)..."
                      }
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value)}
                      className={`glass-input w-full pl-10 pr-8 py-2 text-xs sm:text-sm ${
                        domainFilter
                          ? domainFilterMode === 'include'
                            ? 'border-indigo-500/50 dark:border-indigo-400/50 bg-indigo-50/30 dark:bg-indigo-950/20'
                            : 'border-rose-500/50 dark:border-rose-400/50 bg-rose-50/30 dark:bg-rose-950/20'
                          : ''
                      }`}
                    />
                    {domainFilter && (
                      <button
                        onClick={() => setDomainFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Domain Filter Chips */}
              {topDomains.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-white/5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-500 flex items-center gap-1 mr-1">
                    <AtSign className="w-3 h-3" /> Quick Domain Filters:
                  </span>
                  {topDomains.map((domain) => {
                    const isSelected = domainFilter.toLowerCase().replace(/^@/, '') === domain.toLowerCase();
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDomainFilter('');
                          } else {
                            setDomainFilter(domain);
                            setDomainFilterMode('include');
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 backdrop-blur-md active:scale-95 ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700/60'
                        }`}
                      >
                        <span>@{domain}</span>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Row 2: Context / Use-Type Filters & Priority Filter Tabs */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-white/10">
                {/* Context Use-Type Selector Pills */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3 text-indigo-500" />
                    <span>Context & Use-Type Filter</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'All Contexts' },
                      { id: 'job_alerts', label: '💼 Careers & Jobs' },
                      { id: 'newsletters', label: '📰 Tech Newsletters' },
                      { id: 'ecommerce', label: '🏷️ Deals & Shop' },
                      { id: 'finance', label: '🧾 Receipts & Bills' },
                      { id: 'high_unread', label: '📬 High Unread (>5)' },
                    ].map((ctx) => (
                      <button
                        key={ctx.id}
                        type="button"
                        onClick={() => setContextTypeFilter(ctx.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                          contextTypeFilter === ctx.id
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'bg-white/60 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-white/10'
                        }`}
                      >
                        {ctx.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Filter Tabs & Actions */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
                    <span>Priority Level</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: `All (${senders.length})` },
                      { id: 'high', label: `🔥 High (${highPriorityCount})` },
                      { id: 'job_alerts', label: `💼 Job Alerts (${jobAlertsCount})` },
                      { id: 'medium', label: 'Medium' },
                      { id: 'low', label: 'Low / Keep' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setPriorityFilter(tab.id as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 backdrop-blur-md ${
                          priorityFilter === tab.id
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'glass-pill text-slate-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Action Buttons (Batch Unsubscribe, Bulk Trash, Clear Filters) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredSenders.length}</strong> of {senders.length} subscriptions
                  </span>

                  {/* Clear All Filters Button */}
                  {(searchQuery || domainFilter || contextTypeFilter !== 'all' || priorityFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDomainFilter('');
                        setContextTypeFilter('all');
                        setPriorityFilter('all');
                      }}
                      className="px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-zinc-800/80 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer active:scale-95"
                    >
                      <FilterX className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Batch Confirm Unsubscribe Button */}
                  {highPriorityCount > 0 && (
                    <button
                      type="button"
                      onClick={() => openConfirmModalForBatch(highPriorityList)}
                      className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm Unsubscribe High ({highPriorityCount})</span>
                    </button>
                  )}

                  {/* Bulk Trash High Priority Button */}
                  {highPriorityCount > 0 && (
                    <button
                      type="button"
                      onClick={openBulkTrashModalForHighPriority}
                      className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bulk Trash High</span>
                    </button>
                  )}

                  {auditLogs.length > 0 && (
                    <button
                      onClick={() => setIsAuditModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 transition-colors flex items-center space-x-1 cursor-pointer active:scale-95 backdrop-blur-md"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Audit Log ({auditLogs.length})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sender Cards Grid */}
        {hasScanned && (
          <div className="space-y-4">
            {filteredSenders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No matching senders found</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
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
                  onOpenPreview={(s) => {
                    setPreviewingSender(s);
                    setIsPreviewModalOpen(true);
                  }}
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
          <div className="text-center py-16 bg-white dark:bg-[#121215] rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 shadow-xs transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ready to clean your inbox safely</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
              Select your search criteria above and click <strong>&quot;Scan Inbox&quot;</strong> to discover recurring subscriptions and review senders before unsubscribing.
            </p>
          </div>
        )}
        {/* Unsub.AI v1.0.0 Footer */}
        <footer className="pt-8 pb-12 border-t border-slate-200/80 dark:border-zinc-800/80 text-center text-xs text-slate-500 dark:text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700 dark:text-zinc-300">Unsub.AI</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
              v1.0.0
            </span>
            <span>• Direct Client-Side Gmail OAuth &amp; Gemini AI</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            Private &amp; Secure • Credentials and tokens remain in your session
          </p>
        </footer>
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

      {/* Full Email Preview Modal */}
      <EmailPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewingSender(null);
        }}
        sender={previewingSender}
        accessToken={accessToken}
        onUnsubscribe={(s) => {
          setIsPreviewModalOpen(false);
          return Promise.resolve(openConfirmModalForSender(s));
        }}
        onCleanup={(s, action) => handleCleanup(s, action)}
        isUnsubscribing={previewingSender ? Boolean(unsubscribingMap[previewingSender.senderKey]) : false}
        isCleaning={previewingSender ? Boolean(cleaningMap[previewingSender.senderKey]) : false}
        isUnsubscribed={previewingSender ? unsubscribedSet.has(previewingSender.senderKey) : false}
        isCleaned={previewingSender ? cleanedSet.has(previewingSender.senderKey) : false}
      />

      {/* Gemini Agentic Chatbot (Fixed in Bottom-Right Corner with Auto Trigger Help Notifications) */}
      <GeminiChatbot
        senders={senders}
        scanConfig={scanConfig}
        settings={appSettings}
        auditLogs={auditLogs}
        isConnected={Boolean(accessToken)}
        userEmail={userEmail}
        hasScanned={hasScanned}
        onExecuteUnsubscribe={handleChatbotUnsubscribe}
        onExecuteTrash={handleChatbotTrash}
        onUpdatePriority={handleChatbotUpdatePriority}
        onAddRule={handleChatbotAddRule}
        onUpdateScanConfig={handleChatbotUpdateScanConfig}
        onTriggerScan={runScan}
        onAddProtectedDomain={handleChatbotAddProtectedDomain}
      />
    </div>
  );
}

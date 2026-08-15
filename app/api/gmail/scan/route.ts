import { NextRequest, NextResponse } from 'next/server';
import { classifySender } from '@/lib/classification';
import { AIAnalysisData } from '@/components/SenderCard';

export interface EmailHeader {
  name: string;
  value: string;
}

export interface ParsedEmailMessage {
  id: string;
  threadId: string;
  fromName: string;
  fromEmail: string;
  senderKey: string; // cleaned domain/brand email
  subject: string;
  snippet: string;
  date: string;
  timestamp: number;
  isUnread: boolean;
  unsubscribeHeader: string | null;
  unsubscribePostHeader: string | null;
  unsubscribeUrl: string | null;
  unsubscribeMailto: string | null;
  labelIds: string[];
}

export interface GroupedSender {
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

// Helper function to extract email and name from "Name <email@domain.com>"
function parseFromHeader(fromHeader: string): { name: string; email: string; domain: string } {
  if (!fromHeader) return { name: 'Unknown Sender', email: 'unknown@sender.com', domain: 'sender.com' };

  let name = '';
  let email = '';

  const match = fromHeader.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match) {
    name = match[1]?.trim() || '';
    email = match[2]?.trim() || '';
  } else {
    email = fromHeader.trim();
  }

  if (!email) {
    email = fromHeader;
  }

  if (!name) {
    name = email.split('@')[0] || email;
    // Clean up name if it's an email prefix
    name = name.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const parts = email.split('@');
  const domain = parts.length > 1 ? parts[1].toLowerCase() : 'unknown';

  return { name, email, domain };
}

// Helper to parse List-Unsubscribe header: "<https://...>, <mailto:...>"
function parseUnsubscribeHeader(headerVal: string | null): { url: string | null; mailto: string | null } {
  if (!headerVal) return { url: null, mailto: null };

  let url: string | null = null;
  let mailto: string | null = null;

  const matches = headerVal.match(/<([^>]+)>/g);
  if (matches) {
    for (const raw of matches) {
      const clean = raw.replace(/^<|>$/g, '').trim();
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        if (!url) url = clean;
      } else if (clean.startsWith('mailto:')) {
        if (!mailto) mailto = clean;
      }
    }
  } else {
    // Plain URL fallback
    if (headerVal.startsWith('http://') || headerVal.startsWith('https://')) {
      url = headerVal.trim();
    } else if (headerVal.startsWith('mailto:')) {
      mailto = headerVal.trim();
    }
  }

  return { url, mailto };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const body = await req.json().catch(() => ({}));
    const timeframe = body.timeframe || '30d'; // 7d, 14d, 30d, 60d, 90d, 180d
    const mode = body.mode || 'unopened'; // 'unopened', 'all_subscriptions', 'untouched_promos', 'custom_query'
    const maxScanResults = Math.min(Number(body.maxResults) || 60, 150);
    const customQuery = typeof body.customQuery === 'string' ? body.customQuery.trim() : '';

    // Build primary Gmail search query
    let queryParts: string[] = [];

    if (mode === 'custom_query' && customQuery) {
      // If user typed e.g. "from:domain.com" or "newsletter" directly
      if (customQuery.includes('from:') || customQuery.includes('subject:') || customQuery.includes('to:')) {
        queryParts.push(customQuery);
      } else {
        // Automatically wrap clean domain or text in from: query operator
        const cleanDomain = customQuery.replace(/^@/, '');
        queryParts.push(`(from:${cleanDomain} OR ${customQuery})`);
      }
      queryParts.push(`older_than:${timeframe}`);
    } else if (mode === 'job_alerts') {
      queryParts.push('("job alert" OR "jobs" OR "careers" OR "hiring" OR "interview" OR "recruiter" OR "linkedin jobs" OR "indeed")');
    } else if (mode === 'unopened') {
      queryParts.push('is:unread');
      queryParts.push(`older_than:${timeframe}`);
      queryParts.push('(category:promotions OR category:updates OR unsubscribe OR newsletter)');
    } else if (mode === 'untouched_promos') {
      queryParts.push('category:promotions');
      queryParts.push('is:unread');
      queryParts.push(`older_than:${timeframe}`);
    } else {
      // all subscriptions
      queryParts.push('(unsubscribe OR "list-unsubscribe" OR category:promotions)');
      queryParts.push(`older_than:${timeframe}`);
    }

    // If customQuery is provided alongside any other mode, add it as a secondary constraint
    if (mode !== 'custom_query' && customQuery) {
      if (customQuery.includes('from:') || customQuery.includes('subject:') || customQuery.includes('to:')) {
        queryParts.push(`(${customQuery})`);
      } else {
        const cleanDomain = customQuery.replace(/^@/, '');
        queryParts.push(`(from:${cleanDomain} OR ${customQuery})`);
      }
    }

    let searchQuery = queryParts.join(' ');

    // 1. Fetch message list IDs from Gmail API
    let listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=${maxScanResults}`;
    let listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      let userFriendlyError = `Gmail API error (${listRes.status})`;

      try {
        const parsedErr = JSON.parse(errText);
        const rawMessage = parsedErr.error?.message || errText;

        if (listRes.status === 401) {
          userFriendlyError = 'Gmail authorization expired or invalid. Please re-connect your Gmail account.';
        } else if (listRes.status === 403) {
          if (rawMessage.includes('disabled') || rawMessage.includes('has not been used')) {
            userFriendlyError = 'Gmail API is disabled in your Google Cloud Project. Please enable the Gmail API in Google Cloud Console > APIs & Services.';
          } else if (rawMessage.includes('Insufficient Permission')) {
            userFriendlyError = 'Gmail read permission was not granted. Please reconnect and check all requested Gmail permissions.';
          } else {
            userFriendlyError = `Gmail API Permission Denied (403): ${rawMessage}`;
          }
        } else {
          userFriendlyError = `Gmail Scan Error (${listRes.status}): ${rawMessage}`;
        }
      } catch {
        userFriendlyError = `Gmail Scan Error (${listRes.status}): ${errText}`;
      }

      return NextResponse.json({ error: userFriendlyError }, { status: listRes.status });
    }

    let listData = await listRes.json();
    let messagesSummary: { id: string; threadId: string }[] = listData.messages || [];

    // Fallback search if older_than filter yielded 0 results
    if (messagesSummary.length === 0 && timeframe !== '7d') {
      const fallbackQuery = mode === 'unopened'
        ? 'is:unread (category:promotions OR category:updates OR unsubscribe)'
        : '(unsubscribe OR "list-unsubscribe" OR category:promotions)';
      
      const fallbackUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(fallbackQuery)}&maxResults=${maxScanResults}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData.messages && fallbackData.messages.length > 0) {
          messagesSummary = fallbackData.messages;
          searchQuery = fallbackQuery;
        }
      }
    }

    if (messagesSummary.length === 0) {
      return NextResponse.json({
        query: searchQuery,
        totalFound: 0,
        senders: [],
        messages: [],
      });
    }

    // 2. Fetch details for messages in parallel batches (batch size 15)
    const BATCH_SIZE = 15;
    const parsedMessages: ParsedEmailMessage[] = [];

    for (let i = 0; i < messagesSummary.length; i += BATCH_SIZE) {
      const batchIds = messagesSummary.slice(i, i + BATCH_SIZE);
      const batchPromises = batchIds.map(async (item) => {
        try {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=List-Unsubscribe&metadataHeaders=List-Unsubscribe-Post`;
          const detailRes = await fetch(detailUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!detailRes.ok) return null;
          const msg = await detailRes.json();

          const headers: EmailHeader[] = msg.payload?.headers || [];
          const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          const fromStr = getHeader('From');
          const subject = getHeader('Subject') || '(No Subject)';
          const dateStr = getHeader('Date');
          const unsubHeader = getHeader('List-Unsubscribe');
          const unsubPostHeader = getHeader('List-Unsubscribe-Post');

          const { name: fromName, email: fromEmail, domain } = parseFromHeader(fromStr);
          const { url: unsubscribeUrl, mailto: unsubscribeMailto } = parseUnsubscribeHeader(unsubHeader);

          const isUnread = Boolean(msg.labelIds?.includes('UNREAD'));
          const dateObj = dateStr ? new Date(dateStr) : new Date(Number(msg.internalDate) || Date.now());
          const timestamp = isNaN(dateObj.getTime()) ? Date.now() : dateObj.getTime();

          return {
            id: msg.id,
            threadId: msg.threadId,
            fromName,
            fromEmail,
            senderKey: fromEmail.toLowerCase(),
            subject,
            snippet: msg.snippet || '',
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp,
            isUnread,
            unsubscribeHeader: unsubHeader || null,
            unsubscribePostHeader: unsubPostHeader || null,
            unsubscribeUrl,
            unsubscribeMailto,
            labelIds: msg.labelIds || [],
          } as ParsedEmailMessage;
        } catch {
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        if (res) parsedMessages.push(res);
      }
    }

    // 3. Aggregate messages by Sender Email / Brand
    const senderMap = new Map<string, GroupedSender>();

    for (const msg of parsedMessages) {
      const key = msg.senderKey || msg.fromEmail.toLowerCase();
      const existing = senderMap.get(key);

      if (!existing) {
        const domain = msg.fromEmail.split('@')[1]?.toLowerCase() || 'domain.com';
        senderMap.set(key, {
          senderKey: key,
          fromName: msg.fromName,
          fromEmail: msg.fromEmail,
          domain,
          totalEmails: 1,
          unreadCount: msg.isUnread ? 1 : 0,
          latestDate: msg.date,
          latestTimestamp: msg.timestamp,
          sampleSubject: msg.subject,
          sampleSnippet: msg.snippet,
          unsubscribeUrl: msg.unsubscribeUrl,
          unsubscribeMailto: msg.unsubscribeMailto,
          unsubscribePostHeader: msg.unsubscribePostHeader,
          messageIds: [msg.id],
          unreadMessageIds: msg.isUnread ? [msg.id] : [],
        });
      } else {
        existing.totalEmails += 1;
        if (msg.isUnread) {
          existing.unreadCount += 1;
          existing.unreadMessageIds.push(msg.id);
        }
        existing.messageIds.push(msg.id);

        if (msg.timestamp > existing.latestTimestamp) {
          existing.latestTimestamp = msg.timestamp;
          existing.latestDate = msg.date;
          existing.sampleSubject = msg.subject;
          existing.sampleSnippet = msg.snippet;
        }

        if (!existing.unsubscribeUrl && msg.unsubscribeUrl) existing.unsubscribeUrl = msg.unsubscribeUrl;
        if (!existing.unsubscribeMailto && msg.unsubscribeMailto) existing.unsubscribeMailto = msg.unsubscribeMailto;
        if (!existing.unsubscribePostHeader && msg.unsubscribePostHeader) existing.unsubscribePostHeader = msg.unsubscribePostHeader;
      }
    }

    const sendersList = Array.from(senderMap.values())
      .map((sender) => ({
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
        }),
      }))
      .sort((a, b) => b.unreadCount - a.unreadCount || b.totalEmails - a.totalEmails);

    return NextResponse.json({
      query: searchQuery,
      totalMessagesScanned: parsedMessages.length,
      totalSendersFound: sendersList.length,
      senders: sendersList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error executing Gmail scan' }, { status: 500 });
  }
}

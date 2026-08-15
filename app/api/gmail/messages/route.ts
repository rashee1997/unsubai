import { NextRequest, NextResponse } from 'next/server';

export interface EmailMessageSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  timestamp: number;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  labels: string[];
  category?: 'primary' | 'promotions' | 'updates' | 'social';
  unsubscribeHeader?: {
    hasHeader: boolean;
    postUrl?: string;
    mailto?: string;
    webUrl?: string;
  };
}

// Fallback high-fidelity mock data for demo / offline mode
const MOCK_MESSAGES: EmailMessageSummary[] = [
  {
    id: 'msg-1',
    threadId: 'th-1',
    from: 'Sarah Jenkins <sarah.jenkins@designcraft.io>',
    to: 'me',
    subject: 'Updated Q3 Product Design Sprint Schedule & Deck',
    snippet: "Hey! I've uploaded the revised design sprint presentation. Could you take a quick look at slide 4 before our 2 PM sync?",
    date: '10:42 AM',
    timestamp: Date.now() - 1000 * 60 * 35,
    isUnread: true,
    isStarred: true,
    hasAttachment: true,
    labels: ['INBOX', 'IMPORTANT', 'CATEGORY_PERSONAL'],
    category: 'primary',
  },
  {
    id: 'msg-2',
    threadId: 'th-2',
    from: 'GitHub Notifications <notifications@github.com>',
    to: 'me',
    subject: '[ai-studio/applet] PR #42: Modern 3-Pane Email Client with Anti-AI Composer',
    snippet: 'alex-dev merged 3 commits into main from feature/email-client. All checks passed successfully.',
    date: '9:15 AM',
    timestamp: Date.now() - 1000 * 60 * 120,
    isUnread: true,
    isStarred: false,
    hasAttachment: false,
    labels: ['INBOX', 'CATEGORY_UPDATES'],
    category: 'updates',
    unsubscribeHeader: {
      hasHeader: true,
      webUrl: 'https://github.com/settings/notifications',
      mailto: 'mailto:notifications-unsub@github.com',
    },
  },
  {
    id: 'msg-3',
    threadId: 'th-3',
    from: 'Substack Weekly <digest@substack.com>',
    to: 'me',
    subject: 'The Future of Human-First AI Interface Design',
    snippet: 'This week we unpack why corporate buzzwords and robotic AI replies fail, and how high perplexity & burstiness change communication.',
    date: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 22,
    isUnread: false,
    isStarred: false,
    hasAttachment: false,
    labels: ['INBOX', 'CATEGORY_PROMOTIONS'],
    category: 'promotions',
    unsubscribeHeader: {
      hasHeader: true,
      postUrl: 'https://substack.com/api/v1/unsubscribe?token=mock123',
      mailto: 'mailto:unsub@substack.com',
      webUrl: 'https://substack.com/unsubscribe',
    },
  },
  {
    id: 'msg-4',
    threadId: 'th-4',
    from: 'LinkedIn Job Alerts <jobalerts-noreply@linkedin.com>',
    to: 'me',
    subject: '30+ new Senior Frontend Engineer roles matching your alert',
    snippet: 'Stripe, Vercel, and Figma are hiring in your area. View the latest job opportunities and apply directly.',
    date: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 28,
    isUnread: false,
    isStarred: true,
    hasAttachment: false,
    labels: ['INBOX', 'CATEGORY_UPDATES'],
    category: 'updates',
    unsubscribeHeader: {
      hasHeader: true,
      webUrl: 'https://www.linkedin.com/e/v2',
    },
  },
  {
    id: 'msg-5',
    threadId: 'th-5',
    from: 'Stripe Billing <invoices@stripe.com>',
    to: 'me',
    subject: 'Invoice #INV-2026-0814 for Cloud Services',
    snippet: 'Your receipt for the period Aug 1 - Aug 15 is attached. Total charged: $49.00.',
    date: 'Aug 14',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    isUnread: false,
    isStarred: false,
    hasAttachment: true,
    labels: ['INBOX', 'CATEGORY_UPDATES'],
    category: 'updates',
  },
  {
    id: 'msg-6',
    threadId: 'th-6',
    from: 'Figma Community <updates@figma.com>',
    to: 'me',
    subject: 'New plugins and design system components for August',
    snippet: 'Discover the top 10 UI kits and token generators curated by design systems leads.',
    date: 'Aug 13',
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    isUnread: false,
    isStarred: false,
    hasAttachment: false,
    labels: ['INBOX', 'CATEGORY_PROMOTIONS'],
    category: 'promotions',
    unsubscribeHeader: {
      hasHeader: true,
      postUrl: 'https://figma.com/api/unsubscribe',
      webUrl: 'https://figma.com/settings',
    },
  },
  {
    id: 'msg-7',
    threadId: 'th-7',
    from: 'Michael Rivera <michael.r@partnergroup.com>',
    to: 'me',
    subject: 'Contract review for upcoming Q4 partnership',
    snippet: "Hey, hope your week is wrapping up well. Attached is the redlined version of the agreement. Let's aim to finalize by Tuesday.",
    date: 'Aug 12',
    timestamp: Date.now() - 1000 * 60 * 60 * 96,
    isUnread: false,
    isStarred: true,
    hasAttachment: true,
    labels: ['INBOX', 'IMPORTANT'],
    category: 'primary',
  },
];

export async function POST(req: NextRequest) {
  try {
    const { folder = 'INBOX', q = '', pageToken = '', maxResults = 30 } = await req.json();

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || '';

    // If OAuth token is provided, fetch real Gmail messages!
    if (token && !token.startsWith('mock_')) {
      try {
        let gmailQuery = '';
        if (folder === 'STARRED') gmailQuery = 'is:starred';
        else if (folder === 'SENT') gmailQuery = 'in:sent';
        else if (folder === 'DRAFTS') gmailQuery = 'in:draft';
        else if (folder === 'TRASH') gmailQuery = 'in:trash';
        else if (folder === 'SPAM') gmailQuery = 'in:spam';
        else if (folder === 'UNREAD') gmailQuery = 'is:unread in:inbox';
        else if (folder === 'PROMOTIONS') gmailQuery = 'category:promotions';
        else if (folder === 'UPDATES') gmailQuery = 'category:updates';
        else gmailQuery = 'in:inbox';

        if (q.trim()) {
          gmailQuery = `${gmailQuery} ${q.trim()}`;
        }

        const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
        listUrl.searchParams.set('q', gmailQuery);
        listUrl.searchParams.set('maxResults', String(Math.min(maxResults, 50)));
        if (pageToken) listUrl.searchParams.set('pageToken', pageToken);

        const listRes = await fetch(listUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (listRes.ok) {
          const listData = await listRes.json();
          const messageSummaries: EmailMessageSummary[] = [];

          if (listData.messages && Array.isArray(listData.messages)) {
            // Fetch metadata in parallel batches of 10
            const msgPromises = listData.messages.slice(0, 30).map(async (item: { id: string; threadId: string }) => {
              try {
                const metaRes = await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=List-Unsubscribe&metadataHeaders=List-Unsubscribe-Post`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!metaRes.ok) return null;
                const metaData = await metaRes.json();

                const headers = metaData.payload?.headers || [];
                const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

                const from = getHeader('From') || 'Unknown Sender';
                const to = getHeader('To') || 'me';
                const subject = getHeader('Subject') || '(No Subject)';
                const dateStr = getHeader('Date');
                const listUnsub = getHeader('List-Unsubscribe');
                const listUnsubPost = getHeader('List-Unsubscribe-Post');

                let parsedUnsub: EmailMessageSummary['unsubscribeHeader'];
                if (listUnsub) {
                  let postUrl: string | undefined;
                  let mailto: string | undefined;
                  let webUrl: string | undefined;

                  const links = listUnsub.match(/<([^>]+)>/g) || [];
                  links.forEach((l: string) => {
                    const clean = l.replace(/[<>]/g, '');
                    if (clean.startsWith('mailto:')) mailto = clean;
                    else if (clean.startsWith('http')) webUrl = clean;
                  });

                  if (listUnsubPost && listUnsubPost.includes('List-Unsubscribe=One-Click') && webUrl) {
                    postUrl = webUrl;
                  }

                  parsedUnsub = {
                    hasHeader: true,
                    postUrl,
                    mailto,
                    webUrl,
                  };
                }

                const labelIds: string[] = metaData.labelIds || [];
                const isUnread = labelIds.includes('UNREAD');
                const isStarred = labelIds.includes('STARRED');

                let category: EmailMessageSummary['category'] = 'primary';
                if (labelIds.includes('CATEGORY_PROMOTIONS')) category = 'promotions';
                else if (labelIds.includes('CATEGORY_UPDATES')) category = 'updates';
                else if (labelIds.includes('CATEGORY_SOCIAL')) category = 'social';

                const ts = metaData.internalDate ? parseInt(metaData.internalDate, 10) : Date.now();
                const d = new Date(ts);
                const isToday = new Date().toDateString() === d.toDateString();
                const formattedDate = isToday
                  ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return {
                  id: metaData.id,
                  threadId: metaData.threadId,
                  from,
                  to,
                  subject,
                  snippet: metaData.snippet || '',
                  date: formattedDate,
                  timestamp: ts,
                  isUnread,
                  isStarred,
                  hasAttachment: false,
                  labels: labelIds,
                  category,
                  unsubscribeHeader: parsedUnsub,
                } as EmailMessageSummary;
              } catch {
                return null;
              }
            });

            const results = await Promise.all(msgPromises);
            results.forEach((r) => {
              if (r) messageSummaries.push(r);
            });
          }

          return NextResponse.json({
            success: true,
            messages: messageSummaries,
            nextPageToken: listData.nextPageToken || null,
            isLive: true,
          });
        }
      } catch (err: any) {
        console.warn('Live Gmail fetch failed, using mock data:', err?.message);
      }
    }

    // Fallback Mock Filter
    let filtered = [...MOCK_MESSAGES];
    if (folder === 'STARRED') {
      filtered = filtered.filter((m) => m.isStarred);
    } else if (folder === 'UNREAD') {
      filtered = filtered.filter((m) => m.isUnread);
    } else if (folder === 'PROMOTIONS') {
      filtered = filtered.filter((m) => m.category === 'promotions');
    } else if (folder === 'UPDATES') {
      filtered = filtered.filter((m) => m.category === 'updates');
    } else if (folder === 'SENT') {
      filtered = [
        {
          id: 'sent-1',
          threadId: 'th-sent-1',
          from: 'Me <user@example.com>',
          to: 'sarah.jenkins@designcraft.io',
          subject: 'Re: Updated Q3 Product Design Sprint Schedule & Deck',
          snippet: "Thanks for sending over slide 4. The typography hierarchy looks great now!",
          date: 'Yesterday',
          timestamp: Date.now() - 1000 * 60 * 60 * 20,
          isUnread: false,
          isStarred: false,
          hasAttachment: false,
          labels: ['SENT'],
        },
      ];
    } else if (folder === 'TRASH') {
      filtered = [
        {
          id: 'trash-1',
          threadId: 'th-trash-1',
          from: 'Weekly Marketing Deals <deals@spammarket.com>',
          to: 'me',
          subject: 'Last chance for 70% off flash clearance',
          snippet: 'Huge weekend sale on electronics and smart appliances.',
          date: 'Aug 10',
          timestamp: Date.now() - 1000 * 60 * 60 * 120,
          isUnread: false,
          isStarred: false,
          hasAttachment: false,
          labels: ['TRASH'],
        },
      ];
    }

    if (q.trim()) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.subject.toLowerCase().includes(lower) ||
          m.from.toLowerCase().includes(lower) ||
          m.snippet.toLowerCase().includes(lower)
      );
    }

    return NextResponse.json({
      success: true,
      messages: filtered,
      nextPageToken: null,
      isLive: false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to list messages' }, { status: 500 });
  }
}

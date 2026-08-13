import { NextRequest, NextResponse } from 'next/server';

export interface EmailPreviewResponse {
  id: string;
  threadId: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  date: string;
  timestamp: number;
  snippet: string;
  htmlBody: string;
  textBody: string;
  headers: Record<string, string>;
  labelIds: string[];
  unsubscribeUrl?: string | null;
}

// Decode base64url encoded string from Gmail API
function decodeBase64Url(data: string): string {
  if (!data) return '';
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

// Recursively traverse Gmail message payload parts to extract HTML & Text
function extractBodies(payload: any): { html: string; text: string } {
  let html = '';
  let text = '';

  function walk(part: any) {
    if (!part) return;

    if (part.mimeType === 'text/html' && part.body?.data) {
      html += decodeBase64Url(part.body.data);
    } else if (part.mimeType === 'text/plain' && part.body?.data) {
      text += decodeBase64Url(part.body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        walk(subPart);
      }
    }
  }

  if (payload) {
    walk(payload);
    // If body data was directly on payload
    if (!html && !text && payload.body?.data) {
      const decoded = decodeBase64Url(payload.body.data);
      if (payload.mimeType === 'text/html') {
        html = decoded;
      } else {
        text = decoded;
      }
    }
  }

  return { html, text };
}

// Generate realistic rich HTML previews for demo/mock messages
function generateDemoHtmlBody(fromName: string, fromEmail: string, subject: string, snippet: string, date: string): { html: string; text: string } {
  const isJob = fromEmail.includes('linkedin') || fromEmail.includes('indeed') || subject.toLowerCase().includes('job') || subject.toLowerCase().includes('engineer');
  const isEcom = fromEmail.includes('shop') || subject.includes('Sale') || subject.includes('OFF') || subject.includes('70%');
  const isFlight = fromEmail.includes('flight') || subject.includes('Flight') || subject.includes('Ticket');

  if (isJob) {
    return {
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: #0a66c2; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">${fromName}</h1>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Recommended Opportunities For Your Profile</p>
          </div>
          <div style="padding: 24px;">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">${subject}</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">${snippet}</p>
            <div style="margin: 20px 0; border-top: 1px solid #f1f5f9; pt-4;">
              <div style="padding: 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
                <div style="font-weight: 700; font-size: 15px; color: #0f172a;">Senior Full Stack Engineer</div>
                <div style="font-size: 13px; color: #475569; margin-top: 2px;">Anthropic • San Francisco, CA (Hybrid)</div>
                <div style="font-size: 12px; color: #16a34a; font-weight: 600; margin-top: 6px;">$190,000 - $240,000 / year • Matches 98% of your skills</div>
              </div>
              <div style="padding: 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
                <div style="font-weight: 700; font-size: 15px; color: #0f172a;">AI Applications Tech Lead</div>
                <div style="font-size: 13px; color: #475569; margin-top: 2px;">Google • Mountain View, CA</div>
                <div style="font-size: 12px; color: #16a34a; font-weight: 600; margin-top: 6px;">$210,000 - $280,000 / year • Actively hiring</div>
              </div>
            </div>
            <a href="https://linkedin.com/jobs" style="display: inline-block; background: #0a66c2; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 20px; font-weight: 600; font-size: 14px;">View All Job Matches</a>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
            You are receiving this job alert based on your job preferences on LinkedIn. <br/>
            <a href="https://linkedin.com/unsubscribe" style="color: #64748b; text-decoration: underline;">Unsubscribe from job alerts</a>
          </div>
        </div>
      `,
      text: `${subject}\n\n${snippet}\n\nPositions:\n1. Senior Full Stack Engineer - Anthropic ($190k-$240k)\n2. AI Applications Tech Lead - Google ($210k-$280k)\n\nUnsubscribe: https://linkedin.com/unsubscribe`,
    };
  }

  if (isEcom) {
    return {
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; text-align: center; color: #ffffff;">
            <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">LIMITED TIME PROMO</span>
            <h1 style="margin: 12px 0 0; font-size: 26px; font-weight: 900;">${subject}</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Exclusive VIP Flash Savings</p>
          </div>
          <div style="padding: 28px; text-align: center;">
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0;">${snippet}</p>
            <div style="background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Use Promo Code At Checkout</div>
              <div style="font-size: 28px; font-weight: 900; color: #4f46e5; letter-spacing: 2px; margin-top: 4px;">DEAL70</div>
            </div>
            <a href="https://shopdeal.com" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(79,70,229,0.3);">Shop Flash Sale Now</a>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            You received this promotional message because you subscribed to ${fromName}. <br/>
            <a href="https://shopdeal.com/unsubscribe?user=demo" style="color: #6366f1; font-weight: 600; text-decoration: underline;">Click here to unsubscribe from all marketing emails</a>
          </div>
        </div>
      `,
      text: `${subject}\n\n${snippet}\n\nPromo Code: DEAL70\nShop: https://shopdeal.com\nUnsubscribe: https://shopdeal.com/unsubscribe?user=demo`,
    };
  }

  if (isFlight) {
    return {
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: #0284c7; padding: 24px; color: #ffffff;">
            <div style="font-size: 12px; font-weight: 700; uppercase; tracking-wider; opacity: 0.8;">CONFIRMED E-TICKET</div>
            <h1 style="margin: 4px 0 0; font-size: 20px; font-weight: 800;">${subject}</h1>
          </div>
          <div style="padding: 24px;">
            <p style="color: #475569; font-size: 14px; margin-top: 0;">${snippet}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
              <tr style="background: #f1f5f9;">
                <td style="padding: 10px; font-weight: 700; border-bottom: 1px solid #e2e8f0;">Booking Reference</td>
                <td style="padding: 10px; font-weight: 700; color: #0284c7; border-bottom: 1px solid #e2e8f0;">#XYZ987</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Flight Number</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">SF902</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Departure Date</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${date}</td>
              </tr>
            </table>
            <div style="padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; font-size: 12px; color: #0369a1;">
              📌 Keep this email handy for airport check-in and boarding gates.
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            Transactional notification sent by ${fromName}.
          </div>
        </div>
      `,
      text: `${subject}\n\n${snippet}\n\nBooking Ref: #XYZ987\nFlight: SF902\nDate: ${date}`,
    };
  }

  // Generic Newsletter / Tech Digest
  return {
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="padding: 24px; border-bottom: 1px solid #f1f5f9;">
          <div style="font-size: 12px; font-weight: 700; color: #6366f1; text-transform: uppercase;">NEWSLETTER EDITION</div>
          <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 800; color: #0f172a;">${subject}</h1>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">From: ${fromName} &lt;${fromEmail}&gt; • ${date}</div>
        </div>
        <div style="padding: 24px; font-size: 15px; line-height: 1.7; color: #334155;">
          <p style="margin-top: 0;">Welcome to today's issue of <strong>${fromName}</strong>!</p>
          <p>${snippet}</p>
          <p>In this issue, we examine emerging developer trends, machine learning deployment patterns, and industry shifts impacting cloud architecture for 2026.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <h3 style="font-size: 16px; color: #0f172a;">Key Takeaways:</h3>
          <ul style="padding-left: 20px; color: #475569;">
            <li>High-performance TypeScript standard libraries</li>
            <li>Zero-latency micro-frontend architectures</li>
            <li>Serverless real-time data streaming patterns</li>
          </ul>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          You received this email because you are subscribed to ${fromName}.<br/>
          <a href="https://techdigestdaily.io/unsub" style="color: #6366f1; text-decoration: underline;">Unsubscribe or change email frequency</a>
        </div>
      </div>
    `,
    text: `${subject}\n\nFrom: ${fromName} <${fromEmail}>\nDate: ${date}\n\n${snippet}\n\nUnsubscribe: https://techdigestdaily.io/unsub`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messageId = body.messageId;
    const fromName = body.fromName || 'Newsletter';
    const fromEmail = body.fromEmail || 'news@domain.com';
    const subject = body.subject || '(No Subject)';
    const snippet = body.snippet || 'Email preview content...';
    const dateStr = body.date || new Date().toLocaleDateString();

    const authHeader = req.headers.get('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Check if messageId is a demo id or if we don't have a valid OAuth token
    if (!token || !messageId || messageId.startsWith('demo-')) {
      const demoData = generateDemoHtmlBody(fromName, fromEmail, subject, snippet, dateStr);
      return NextResponse.json({
        id: messageId || 'demo-preview',
        threadId: messageId || 'demo-thread',
        fromName,
        fromEmail,
        toEmail: 'me@gmail.com',
        subject,
        date: dateStr,
        timestamp: Date.now(),
        snippet,
        htmlBody: demoData.html,
        textBody: demoData.text,
        headers: {
          'From': `${fromName} <${fromEmail}>`,
          'To': 'me@gmail.com',
          'Subject': subject,
          'Date': dateStr,
          'List-Unsubscribe': `<https://${fromEmail.split('@')[1] || 'domain.com'}/unsubscribe>`,
          'Message-ID': `<${messageId || 'demo'}@mail.google.com>`,
        },
        labelIds: ['CATEGORY_PROMOTIONS', 'UNREAD'],
        unsubscribeUrl: `https://${fromEmail.split('@')[1] || 'domain.com'}/unsubscribe`,
      } as EmailPreviewResponse);
    }

    // Fetch full message from Gmail API using token
    const fetchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // Fallback to demo layout with supplied snippet
      const demoData = generateDemoHtmlBody(fromName, fromEmail, subject, snippet, dateStr);
      return NextResponse.json({
        id: messageId,
        threadId: messageId,
        fromName,
        fromEmail,
        toEmail: 'me@gmail.com',
        subject,
        date: dateStr,
        timestamp: Date.now(),
        snippet,
        htmlBody: demoData.html,
        textBody: demoData.text,
        headers: {
          'From': `${fromName} <${fromEmail}>`,
          'To': 'me@gmail.com',
          'Subject': subject,
          'Date': dateStr,
        },
        labelIds: ['INBOX'],
      } as EmailPreviewResponse);
    }

    const msgData = await res.json();
    const headersList: { name: string; value: string }[] = msgData.payload?.headers || [];
    const headersMap: Record<string, string> = {};
    for (const h of headersList) {
      headersMap[h.name] = h.value;
    }

    const { html, text } = extractBodies(msgData.payload);
    const dateObj = headersMap['Date'] ? new Date(headersMap['Date']) : new Date(Number(msgData.internalDate) || Date.now());

    // Clean html if present, or construct text fallback
    let finalHtml = html;
    if (!finalHtml && text) {
      finalHtml = `<div style="font-family: system-ui, sans-serif; white-space: pre-wrap; padding: 20px; line-height: 1.6; color: #1e293b;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    } else if (!finalHtml && !text) {
      finalHtml = `<div style="font-family: system-ui, sans-serif; padding: 20px; color: #64748b;">${snippet || 'No message content body available.'}</div>`;
    }

    return NextResponse.json({
      id: msgData.id,
      threadId: msgData.threadId,
      fromName: fromName || headersMap['From'] || 'Sender',
      fromEmail: fromEmail || headersMap['From'] || 'email@domain.com',
      toEmail: headersMap['To'] || 'me@gmail.com',
      subject: headersMap['Subject'] || subject || '(No Subject)',
      date: isNaN(dateObj.getTime()) ? dateStr : dateObj.toLocaleString(),
      timestamp: isNaN(dateObj.getTime()) ? Date.now() : dateObj.getTime(),
      snippet: msgData.snippet || snippet,
      htmlBody: finalHtml,
      textBody: text || snippet,
      headers: headersMap,
      labelIds: msgData.labelIds || [],
      unsubscribeUrl: headersMap['List-Unsubscribe'] || null,
    } as EmailPreviewResponse);

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch email message preview' }, { status: 500 });
  }
}

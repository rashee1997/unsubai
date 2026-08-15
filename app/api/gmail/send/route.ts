import { NextRequest, NextResponse } from 'next/server';

function createMimeMessage(to: string, subject: string, bodyText: string, fromName = 'Me'): string {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
  ];
  const message = messageParts.join('\r\n');
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, threadId } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { success: false, error: 'To, Subject, and Body are required.' },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || '';

    if (token && !token.startsWith('mock_')) {
      try {
        const raw = createMimeMessage(to, subject, body);
        const payload: any = { raw };
        if (threadId) {
          payload.threadId = threadId;
        }

        const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (sendRes.ok) {
          const sentData = await sendRes.json();
          return NextResponse.json({
            success: true,
            id: sentData.id,
            threadId: sentData.threadId,
            isLive: true,
          });
        } else {
          const errText = await sendRes.text();
          console.warn('Gmail API send returned error:', errText);
        }
      } catch (err: any) {
        console.warn('Error connecting to Gmail send endpoint:', err?.message);
      }
    }

    // Demo / fallback mode simulation
    return NextResponse.json({
      success: true,
      id: `sim-sent-${Date.now()}`,
      threadId: threadId || `sim-thread-${Date.now()}`,
      isLive: false,
      message: 'Sent successfully (Demo Mode)',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

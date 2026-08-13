import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const body = await req.json();
    const { senderKey, unsubscribeUrl, unsubscribeMailto, unsubscribePostHeader } = body;

    if (!unsubscribeUrl && !unsubscribeMailto) {
      return NextResponse.json({
        success: false,
        method: 'none',
        message: 'No direct List-Unsubscribe header or mailto link found for this sender. Try searching body links or setting a Gmail filter.',
      });
    }

    // Attempt Method 1: RFC 8058 One-Click HTTP POST or HTTP GET
    if (unsubscribeUrl) {
      try {
        if (unsubscribePostHeader && unsubscribePostHeader.includes('List-Unsubscribe=One-Click')) {
          // Send RFC 8058 POST
          const postRes = await fetch(unsubscribeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'List-Unsubscribe=One-Click',
          });

          if (postRes.ok || postRes.status === 200 || postRes.status === 202) {
            return NextResponse.json({
              success: true,
              method: 'http_post',
              message: 'Successfully triggered RFC 8058 One-Click Unsubscribe via HTTP POST.',
            });
          }
        }

        // Standard HTTP GET ping for unsubscribe link
        const getRes = await fetch(unsubscribeUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UnsubAI/1.0',
          },
        });

        if (getRes.ok || getRes.status < 400) {
          return NextResponse.json({
            success: true,
            method: 'http_get',
            message: 'Unsubscribe page pinged successfully via HTTP.',
            redirectUrl: unsubscribeUrl,
          });
        }
      } catch (err: any) {
        // Fall through to mailto if HTTP fails
        console.warn('HTTP Unsubscribe attempt failed, trying mailto if available:', err.message);
      }
    }

    // Attempt Method 2: Send email via Gmail API to mailto recipient
    if (unsubscribeMailto) {
      const cleanMailto = unsubscribeMailto.replace(/^mailto:/i, '');
      const mailtoParts = cleanMailto.split('?');
      const targetEmail = mailtoParts[0];

      let subject = 'Unsubscribe';
      let bodyText = 'Unsubscribe me from this mailing list.';

      if (mailtoParts[1]) {
        const urlParams = new URLSearchParams(mailtoParts[1]);
        if (urlParams.get('subject')) subject = urlParams.get('subject')!;
        if (urlParams.get('body')) bodyText = urlParams.get('body')!;
      }

      // Construct raw MIME email
      const rawMessage = [
        `To: ${targetEmail}`,
        'Subject: ' + subject,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        bodyText,
      ].join('\r\n');

      // Base64URL encode
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      });

      if (sendRes.ok) {
        return NextResponse.json({
          success: true,
          method: 'mailto_send',
          message: `Sent automated unsubscribe request email to ${targetEmail}.`,
        });
      } else {
        const sendErr = await sendRes.text();
        return NextResponse.json({
          success: false,
          method: 'mailto_failed',
          message: `Failed sending unsubscribe mailto request: ${sendErr}`,
          redirectUrl: unsubscribeUrl || null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      method: 'web_redirect',
      message: 'Opening unsubscribe URL in browser.',
      redirectUrl: unsubscribeUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error processing unsubscribe request' }, { status: 500 });
  }
}

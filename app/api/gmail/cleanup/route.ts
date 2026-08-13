import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const body = await req.json();
    const { action, messageIds } = body as { action: 'trash' | 'archive' | 'mark_read'; messageIds: string[] };

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'No message IDs provided' }, { status: 400 });
    }

    // Limit to max 1000 message IDs per batch according to Gmail API limits
    const targetIds = messageIds.slice(0, 1000);

    if (action === 'trash') {
      // Use batchModify to add 'TRASH' label and remove 'INBOX' label
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: targetIds,
          addLabelIds: ['TRASH'],
          removeLabelIds: ['INBOX', 'UNREAD'],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Gmail trash action failed: ${errText}` }, { status: res.status });
      }

      return NextResponse.json({
        success: true,
        action: 'trash',
        affectedCount: targetIds.length,
        message: `Successfully moved ${targetIds.length} email(s) to Trash.`,
      });
    }

    if (action === 'archive') {
      // Remove INBOX label
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: targetIds,
          removeLabelIds: ['INBOX'],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Gmail archive action failed: ${errText}` }, { status: res.status });
      }

      return NextResponse.json({
        success: true,
        action: 'archive',
        affectedCount: targetIds.length,
        message: `Successfully archived ${targetIds.length} email(s).`,
      });
    }

    if (action === 'mark_read') {
      // Remove UNREAD label
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: targetIds,
          removeLabelIds: ['UNREAD'],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Gmail mark read action failed: ${errText}` }, { status: res.status });
      }

      return NextResponse.json({
        success: true,
        action: 'mark_read',
        affectedCount: targetIds.length,
        message: `Successfully marked ${targetIds.length} email(s) as read.`,
      });
    }

    return NextResponse.json({ error: 'Invalid cleanup action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error executing cleanup' }, { status: 500 });
  }
}

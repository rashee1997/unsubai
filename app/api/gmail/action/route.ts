import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messageId, action, addLabelIds = [], removeLabelIds = [] } = await req.json();

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'messageId is required' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || '';

    let toAdd = [...addLabelIds];
    let toRemove = [...removeLabelIds];

    if (action === 'star') toAdd.push('STARRED');
    if (action === 'unstar') toRemove.push('STARRED');
    if (action === 'markRead') toRemove.push('UNREAD');
    if (action === 'markUnread') toAdd.push('UNREAD');
    if (action === 'archive') toRemove.push('INBOX');

    if (token && !token.startsWith('mock_')) {
      try {
        if (action === 'trash') {
          const trashRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (trashRes.ok) {
            return NextResponse.json({ success: true, isLive: true, action: 'trashed' });
          }
        } else {
          const modRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              addLabelIds: toAdd,
              removeLabelIds: toRemove,
            }),
          });
          if (modRes.ok) {
            return NextResponse.json({ success: true, isLive: true, action });
          }
        }
      } catch (err: any) {
        console.warn('Live Gmail action failed:', err?.message);
      }
    }

    // Demo Mode fallback
    return NextResponse.json({
      success: true,
      isLive: false,
      messageId,
      action,
      applied: { add: toAdd, remove: toRemove },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update message' }, { status: 500 });
  }
}

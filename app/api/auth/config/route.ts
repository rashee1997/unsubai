import { NextResponse } from 'next/server';

export async function GET() {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_OAUTH_CLIENT_ID ||
    process.env.GMAIL_CLIENT_ID ||
    process.env.GOOGLE_ID ||
    process.env.CLIENT_ID ||
    '';
  return NextResponse.json({ clientId: clientId.trim() });
}


import type {Metadata} from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unsub AI - Smart Gmail Unsubscriber & Inbox Cleaner',
  description: 'Connect Gmail to automatically scan unopened newsletters, extract unsubscribe links, analyze with Gemini AI, and bulk cleanup unwanted emails.',
  openGraph: {
    title: 'Unsub AI - Smart Gmail Unsubscriber',
    description: 'AI-powered newsletter scanner and bulk unsubscriber for Gmail.',
    type: 'website',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#0A0A0B] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}


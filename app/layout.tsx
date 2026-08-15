import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Unsub.AI v1.0.0 - Smart Gmail Unsubscriber & Inbox Cleaner',
  description: 'Unsub.AI v1.0.0: Connect Gmail to automatically scan unopened newsletters, extract unsubscribe links, analyze with Gemini AI, and bulk cleanup unwanted emails.',
  openGraph: {
    title: 'Unsub.AI v1.0.0 - Smart Gmail Unsubscriber',
    description: 'AI-powered newsletter scanner and bulk unsubscriber for Gmail.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning className="min-h-screen antialiased transition-colors duration-300 bg-[#f5f5f7] dark:bg-[#070709] text-slate-900 dark:text-zinc-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

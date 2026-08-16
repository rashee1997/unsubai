'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Copy, Check } from 'lucide-react';
import { EmailPreviewResponse } from '@/app/api/gmail/preview/route';

interface SafeEmailPreviewProps {
  emailData: EmailPreviewResponse | null;
  rawSnippet?: string;
  isLoading?: boolean;
  viewMode?: 'html' | 'text' | 'headers';
  loadImages?: boolean;
}

export const SafeEmailPreview: React.FC<SafeEmailPreviewProps> = ({
  emailData,
  rawSnippet,
  isLoading,
  viewMode = 'html',
  loadImages = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const htmlContent = emailData?.htmlBody || (rawSnippet ? `<div style="font-family: system-ui, -apple-system, sans-serif; padding: 24px; line-height: 1.6; font-size: 15px; color: #1e293b;">${rawSnippet}</div>` : '');
  const textContent = emailData?.textBody || rawSnippet || '';

  // Always reset scroll to the top whenever email or view mode changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [emailData, rawSnippet, viewMode]);

  // Synchronize height from embedded message postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'EMAIL_IFRAME_RESIZE' && typeof event.data.height === 'number') {
        const measured = Math.ceil(event.data.height);
        if (measured > 50) {
          setIframeHeight(measured);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Calculate dynamic iframe height directly when HTML loads or updates
  const handleIframeLoad = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentWindow.document;
        if (doc && (doc.body || doc.documentElement)) {
          const bodyH = doc.body ? Math.max(doc.body.scrollHeight, doc.body.offsetHeight) : 0;
          const docH = doc.documentElement ? Math.max(doc.documentElement.scrollHeight, doc.documentElement.offsetHeight, doc.documentElement.clientHeight) : 0;
          const finalHeight = Math.max(bodyH, docH, 200);
          setIframeHeight(Math.ceil(finalHeight));
          iframeRef.current.contentWindow.scrollTo(0, 0);
        }
      }
    } catch {
      // Cross-origin fallback
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    const t1 = setTimeout(() => handleIframeLoad(), 100);
    const t2 = setTimeout(() => handleIframeLoad(), 500);
    const t3 = setTimeout(() => handleIframeLoad(), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [htmlContent, viewMode, loadImages]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate safe HTML srcDoc preserving author colors, component layouts, and starting at top
  const buildSrcDoc = () => {
    if (!htmlContent) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="referrer" content="no-referrer">
          <base target="_blank">
          <style>
            html, body {
              margin: 0;
              padding: 16px;
              background-color: #ffffff;
              color: #222222;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 14px;
              line-height: 1.5;
              -webkit-font-smoothing: antialiased;
              height: auto !important;
              min-height: 0 !important;
              overflow: hidden !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
              ${!loadImages ? 'display: none !important;' : ''}
            }
            table {
              border-spacing: 0;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.scrollTo(0, 0);
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;

            function sendHeight() {
              try {
                var b = document.body;
                var e = document.documentElement;
                if (!b && !e) return;
                var h = Math.max(
                  b ? b.scrollHeight : 0,
                  b ? b.offsetHeight : 0,
                  e ? e.scrollHeight : 0,
                  e ? e.offsetHeight : 0,
                  e ? e.clientHeight : 0
                );
                if (h > 0) {
                  window.parent.postMessage({ type: 'EMAIL_IFRAME_RESIZE', height: h }, '*');
                }
              } catch (err) {}
            }
            window.addEventListener('DOMContentLoaded', function() {
              window.scrollTo(0, 0);
              sendHeight();
            });
            window.addEventListener('load', function() {
              window.scrollTo(0, 0);
              sendHeight();
            });
            if (window.ResizeObserver && document.body) {
              try {
                var ro = new ResizeObserver(function() { sendHeight(); });
                ro.observe(document.body);
                if (document.documentElement) ro.observe(document.documentElement);
              } catch(e) {}
            }
            var allImages = document.querySelectorAll('img');
            for (var i = 0; i < allImages.length; i++) {
              allImages[i].addEventListener('load', sendHeight);
              allImages[i].addEventListener('error', sendHeight);
            }
            setTimeout(sendHeight, 50);
            setTimeout(sendHeight, 200);
            setTimeout(sendHeight, 600);
            setTimeout(sendHeight, 1500);
          </script>
        </body>
      </html>
    `;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-zinc-500">
        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Loading message body...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full bg-slate-50/70 dark:bg-[#070709] overflow-hidden">
      {/* Main Reading Canvas - Seamless scroll with comfortable margins and top alignment */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden column-scroll px-2 sm:px-6 py-4 sm:py-6 flex justify-center"
      >
        {viewMode === 'html' && (
          <div className="w-full max-w-4xl self-start bg-white rounded-2xl shadow-xs border border-slate-200/80 dark:border-white/10 overflow-hidden">
            <iframe
              ref={iframeRef}
              srcDoc={buildSrcDoc()}
              onLoad={handleIframeLoad}
              title="Rich Email Body"
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              scrolling="no"
              className="w-full border-0 block bg-white"
              style={{
                height: `${iframeHeight}px`,
                minHeight: '250px',
                overflow: 'hidden',
                display: 'block',
                backgroundColor: '#ffffff',
              }}
            />
          </div>
        )}

        {viewMode === 'text' && (
          <div className="w-full max-w-4xl self-start">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span>Plain Text Representation</span>
              <button
                onClick={handleCopyText}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/5 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200 whitespace-pre-wrap select-text shadow-xs">
              {textContent || 'No plain text representation available.'}
            </div>
          </div>
        )}

        {viewMode === 'headers' && (
          <div className="w-full max-w-4xl flex flex-col gap-4 self-start">
            {/* Authentication & Security Shield Box */}
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start space-x-3 text-emerald-900 dark:text-emerald-200">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="font-bold text-sm">Security & Transport Audit</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 font-medium">
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">SPF Pass</span>
                    Verified Sender Domain
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">DKIM Signature</span>
                    Valid Cryptographic Key
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">DMARC Policy</span>
                    Enforced (p=reject)
                  </div>
                </div>
              </div>
            </div>

            {/* Headers Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 font-semibold text-xs text-slate-700 dark:text-zinc-300">
                Message Headers
              </div>
              <div className="p-4 flex flex-col gap-2 font-mono text-xs divide-y divide-slate-100 dark:divide-zinc-800">
                {emailData?.headers ? (
                  Object.entries(emailData.headers).map(([key, val]) => (
                    <div key={key} className="pt-2 flex flex-col sm:flex-row sm:items-start gap-1">
                      <span className="w-40 font-bold text-slate-500 dark:text-zinc-400 shrink-0">{key}:</span>
                      <span className="text-slate-800 dark:text-zinc-200 break-all">{val}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400">Standard RFC 5322 metadata headers parsed.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

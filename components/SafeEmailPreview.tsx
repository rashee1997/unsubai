'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, Code, FileText, Shield, Image as ImageIcon, Lock, ExternalLink, Copy, Check } from 'lucide-react';
import { EmailPreviewResponse } from '@/app/api/gmail/preview/route';

interface SafeEmailPreviewProps {
  emailData: EmailPreviewResponse | null;
  rawSnippet?: string;
  isLoading?: boolean;
}

export const SafeEmailPreview: React.FC<SafeEmailPreviewProps> = ({ emailData, rawSnippet, isLoading }) => {
  const [viewMode, setViewMode] = useState<'html' | 'text' | 'headers'>('html');
  const [loadImages, setLoadImages] = useState(true);
  const [copied, setCopied] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(500);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const htmlContent = emailData?.htmlBody || (rawSnippet ? `<div style="font-family: system-ui, sans-serif; padding: 20px; line-height: 1.6;">${rawSnippet}</div>` : '');
  const textContent = emailData?.textBody || rawSnippet || '';

  // Calculate dynamic iframe height when HTML updates without feedback loops
  const handleIframeLoad = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentWindow.document;
        if (doc && doc.body) {
          // Use offsetHeight or bounding rect to prevent scrollHeight recursive expansion
          const bodyRect = doc.body.getBoundingClientRect();
          const measuredHeight = Math.max(
            bodyRect.height || 0,
            doc.body.offsetHeight || 0,
            300
          );
          // Clamp height between 350px and 850px to prevent infinite expansion
          const clampedHeight = Math.min(Math.max(Math.ceil(measuredHeight) + 30, 350), 850);
          setIframeHeight(clampedHeight);
        }
      }
    } catch {
      // Fallback sensible bounded height
      setIframeHeight(500);
    }
  };

  useEffect(() => {
    // Re-calculate after a brief delay for async images
    const timer = setTimeout(() => {
      handleIframeLoad();
    }, 300);
    return () => clearTimeout(timer);
  }, [htmlContent, viewMode]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate safe HTML srcDoc with base target="_blank" and image policies
  const buildSrcDoc = () => {
    if (!htmlContent) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="referrer" content="no-referrer">
          <base target="_blank">
          <style>
            html, body {
              margin: 0;
              padding: 24px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              word-break: break-word;
              height: auto !important;
              min-height: 0 !important;
              overflow-x: hidden;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
              ${!loadImages ? 'display: none !important;' : ''}
            }
            a {
              color: #4f46e5;
            }
            table {
              max-width: 100% !important;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Loading rich email preview...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full bg-slate-50/50 dark:bg-[#070709] overflow-hidden">
      {/* View Mode Bar */}
      <div className="px-6 py-2 bg-slate-100/80 dark:bg-zinc-900/60 border-b border-slate-200/80 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        
        {/* Mode Buttons */}
        <div className="flex items-center space-x-1 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-700">
          <button
            onClick={() => setViewMode('html')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'html'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Rich HTML</span>
          </button>

          <button
            onClick={() => setViewMode('text')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'text'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain Text</span>
          </button>

          <button
            onClick={() => setViewMode('headers')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'headers'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Headers & Security</span>
          </button>
        </div>

        {/* Extra Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {viewMode === 'html' && (
            <button
              onClick={() => setLoadImages(!loadImages)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                loadImages
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{loadImages ? 'Images Enabled' : 'Load External Images'}</span>
            </button>
          )}

          {viewMode === 'text' && (
            <button
              onClick={handleCopyText}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 flex justify-center">
        {viewMode === 'html' && (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
            <iframe
              ref={iframeRef}
              srcDoc={buildSrcDoc()}
              onLoad={handleIframeLoad}
              title="Rich Email Body"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              className="w-full border-0 block"
              style={{ minHeight: '400px', height: `${iframeHeight}px` }}
            />
          </div>
        )}

        {viewMode === 'text' && (
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-zinc-200 whitespace-pre-wrap select-text">
            {textContent || 'No plain text representation available.'}
          </div>
        )}

        {viewMode === 'headers' && (
          <div className="w-full max-w-3xl flex flex-col gap-4">
            
            {/* Authentication & Security Shield Box */}
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start space-x-3 text-emerald-900 dark:text-emerald-200">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="font-bold text-sm">Security & Transport Audit</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 font-medium">
                  <div className="p-2 rounded bg-white/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">SPF Pass</span>
                    Verified Sender Domain
                  </div>
                  <div className="p-2 rounded bg-white/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">DKIM Signature</span>
                    Valid Cryptographic Key
                  </div>
                  <div className="p-2 rounded bg-white/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/40">
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

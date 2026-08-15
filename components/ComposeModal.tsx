'use client';

import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, RefreshCw, Wand2, Check, AlertCircle } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  threadId?: string;
  onEmailSent?: (msg: any) => void;
  token?: string | null;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  threadId,
  onEmailSent,
  token,
}) => {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);

  // AI Prompt & Anti-AI Humanizer states
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [tone, setTone] = useState<'direct' | 'warm' | 'casual' | 'polite_decline'>('direct');
  const [length, setLength] = useState<'short' | 'medium' | 'detailed'>('short');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateAiEmail = async (type: 'new' | 'humanize') => {
    setIsGenerating(true);
    setAiStatusMessage(null);

    try {
      const res = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          prompt: aiPrompt || body,
          draftToHumanize: body,
          tone,
          length,
          originalEmail: initialSubject ? { subject: initialSubject, body: initialBody } : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.subject && !subject) {
          setSubject(data.subject);
        }
        setBody(data.body || '');
        setAiStatusMessage('Generated using anti-AI natural cadence rules.');
      } else {
        setAiStatusMessage(data.error || 'Generation failed');
      }
    } catch (err: any) {
      setAiStatusMessage('Failed to connect to AI engine.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in To, Subject, and Body.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
          threadId,
        }),
      });

      const result = await res.json();
      if (result.success) {
        if (onEmailSent) onEmailSent(result);
        onClose();
      } else {
        alert(result.error || 'Failed to send email.');
      }
    } catch (err: any) {
      alert('Failed to send email: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {threadId ? 'Reply to Thread' : 'New Message'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Craft or humanize emails with anti-AI cadence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Copilot Bar */}
        <div className="px-6 py-3 bg-indigo-50/60 dark:bg-indigo-950/20 border-b border-indigo-100/80 dark:border-indigo-900/30 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAiAssist(!showAiAssist)}
              className="flex items-center space-x-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showAiAssist ? 'Hide AI Human Copilot' : 'Open AI Human Copilot (Anti-Cliché Engine)'}</span>
            </button>

            {body && (
              <button
                type="button"
                onClick={() => handleGenerateAiEmail('humanize')}
                disabled={isGenerating}
                className="text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-2xs"
              >
                <Wand2 className="w-3 h-3 text-indigo-500" />
                <span>Humanize My Draft</span>
              </button>
            )}
          </div>

          {showAiAssist && (
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Tone:</span>
                {(['direct', 'warm', 'casual', 'polite_decline'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      tone === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {t === 'direct' ? 'Direct (2-3 sent.)' : t === 'warm' ? 'Warm & Professional' : t === 'casual' ? 'Casual' : 'Polite Decline'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="What would you like to say? (e.g. Confirm slide 4 changes, push meeting to 3 PM)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleGenerateAiEmail('new')}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{isGenerating ? 'Writing...' : 'Generate'}</span>
                </button>
              </div>

              {aiStatusMessage && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>{aiStatusMessage}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center border-b border-slate-200 dark:border-zinc-800 pb-2">
            <label className="w-16 text-xs font-medium text-slate-500 dark:text-zinc-400">To:</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center border-b border-slate-200 dark:border-zinc-800 pb-2">
            <label className="w-16 text-xs font-medium text-slate-500 dark:text-zinc-400">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line"
              className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[220px]">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here..."
              className="flex-1 w-full p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-white/5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
          <div className="text-xs text-slate-400 dark:text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[10px]">Ctrl+Enter</kbd> to send
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
            >
              {isSending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

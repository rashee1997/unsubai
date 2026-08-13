'use client';

import React, { useState } from 'react';
import { Key, ExternalLink, HelpCircle, X, Sparkles, ShieldCheck } from 'lucide-react';

interface ClientIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClientId: (clientId: string) => void;
  onUseDemoMode: () => void;
  initialValue?: string;
}

export const ClientIdModal: React.FC<ClientIdModalProps> = ({
  isOpen,
  onClose,
  onSaveClientId,
  onUseDemoMode,
  initialValue = '',
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError('Please enter a valid Google OAuth Client ID.');
      return;
    }

    if (!trimmed.endsWith('.apps.googleusercontent.com') && !trimmed.includes('.googleusercontent.com')) {
      setError('A Google Client ID usually ends with .apps.googleusercontent.com');
      return;
    }

    setError(null);
    onSaveClientId(trimmed);
  };

  const devUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ecb2reu5ivy5al7idbd4zs-48279084395.europe-west3.run.app';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-xl w-full text-zinc-200 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white tracking-tight">Configure Google OAuth Client ID</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Required for client-side Gmail authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            To securely access your Gmail inbox via Google Identity Services, provide your Google OAuth Client ID below:
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Google OAuth Client ID
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 1234567890-abc123def456.apps.googleusercontent.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {error && <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>}
          </div>

          {/* Setup Instructions Helper Box */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>How to set Authorized Origins in Google Cloud Console:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
              <li>Go to <strong>Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</strong></li>
              <li>Under <strong>Authorized JavaScript origins</strong>, add this URL:</li>
            </ol>
            <div className="p-2 rounded bg-black/60 font-mono text-[11px] text-indigo-300 break-all select-all border border-zinc-800">
              {devUrl}
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onUseDemoMode();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Use Demo Mode Instead</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Save &amp; Connect Gmail</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

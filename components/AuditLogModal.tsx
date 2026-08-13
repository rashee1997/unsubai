'use client';

import React from 'react';
import { X, CheckCircle2, ShieldCheck, Mail, Copy, Check, Trash2, ArrowUpRight } from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  senderName: string;
  senderEmail: string;
  action: 'unsubscribe' | 'trash' | 'archive';
  methodUsed?: string;
  timestamp: string;
  messagesAffected: number;
}

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
  onClearLogs: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, logs, onClearLogs }) => {
  const [copiedAllFilters, setCopiedAllFilters] = React.useState(false);

  if (!isOpen) return null;

  const copyBulkGmailFilter = () => {
    if (logs.length === 0) return;
    const emails = Array.from(new Set(logs.map((l) => l.senderEmail)));
    const filterQuery = emails.map((e) => `from:${e}`).join(' OR ');
    navigator.clipboard.writeText(filterQuery);
    setCopiedAllFilters(true);
    setTimeout(() => setCopiedAllFilters(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121215] rounded-2xl max-w-2xl w-full border border-zinc-800 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Unsubscribe & Cleaning Audit Log</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm text-zinc-400">No unsubscribe actions performed yet in this session.</p>
              <p className="text-xs text-zinc-500 mt-1">Run a scan above and select senders to unsubscribe!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{log.senderName}</div>
                      <div className="font-mono text-zinc-400">{log.senderEmail}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {log.timestamp} • {log.messagesAffected} email(s) cleaned ({log.action})
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold text-[11px]">
                      {log.methodUsed || 'Unsubscribed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-900/90 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {logs.length > 0 && (
            <button
              onClick={copyBulkGmailFilter}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {copiedAllFilters ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAllFilters ? 'Filter Query Copied!' : 'Copy Bulk Gmail Filter Query'}</span>
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear Log
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

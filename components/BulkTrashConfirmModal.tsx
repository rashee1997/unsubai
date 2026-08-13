'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Trash2, AlertTriangle, CheckSquare, Square, Sparkles, Mail } from 'lucide-react';
import { GroupedSenderData } from './SenderCard';

interface BulkTrashConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: GroupedSenderData[];
  onConfirmExecute: (selectedSenders: GroupedSenderData[]) => Promise<void>;
  isProcessing: boolean;
  processedCount: number;
  totalToProcess: number;
}

export const BulkTrashConfirmModal: React.FC<BulkTrashConfirmModalProps> = ({
  isOpen,
  onClose,
  candidates,
  onConfirmExecute,
  isProcessing,
  processedCount,
  totalToProcess,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set(candidates.map((c) => c.senderKey)));
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevCandidates, setPrevCandidates] = useState(candidates);

  // Sync selected keys when modal opens or candidates update
  if (isOpen !== prevIsOpen || candidates !== prevCandidates) {
    setPrevIsOpen(isOpen);
    setPrevCandidates(candidates);
    if (isOpen) {
      setSelectedKeys(new Set(candidates.map((c) => c.senderKey)));
    }
  }

  if (!isOpen) return null;

  const toggleSender = (key: string) => {
    if (isProcessing) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (isProcessing) return;
    if (selectedKeys.size === candidates.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(candidates.map((c) => c.senderKey)));
    }
  };

  const selectedList = candidates.filter((c) => selectedKeys.has(c.senderKey));
  const totalEmailsToTrash = selectedList.reduce((sum, sender) => sum + sender.totalEmails, 0);
  const sensitiveSelectedCount = selectedList.filter((c) => c.analysis?.isSensitive || c.analysis?.safetyWarning).length;

  const handleConfirm = () => {
    if (selectedList.length === 0 || isProcessing) return;
    onConfirmExecute(selectedList);
  };

  const progressPercentage = totalToProcess > 0 ? Math.round((processedCount / totalToProcess) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-rose-900/60 rounded-2xl max-w-2xl w-full text-zinc-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-950/80 to-zinc-900 border-b border-rose-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                Bulk Trash All High Priority Emails
              </h3>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Quickly move emails from high-priority flagged senders to Gmail Trash in a single confirmation.
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Impact Summary Banner */}
        <div className="px-6 py-3.5 bg-rose-950/30 border-b border-rose-900/40 flex items-center justify-between text-xs text-rose-200 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Moving <strong>{totalEmailsToTrash} email(s)</strong> across <strong>{selectedList.length}</strong> high priority sender(s) to Trash.
            </span>
          </div>
          <span className="font-mono text-rose-300 font-bold bg-rose-950/80 px-2.5 py-1 rounded-md border border-rose-800/60 shrink-0">
            {totalEmailsToTrash} Messages
          </span>
        </div>

        {/* Sensitive Item Warning Banner if user selected caution items */}
        {sensitiveSelectedCount > 0 && !isProcessing && (
          <div className="px-6 py-2.5 bg-amber-950/40 border-b border-amber-800/50 text-amber-300 text-xs flex items-center gap-2.5 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Caution:</strong> {sensitiveSelectedCount} sender(s) contain travel/receipt info. They will be included in bulk trash.
            </span>
          </div>
        )}

        {/* Progress Bar during Execution */}
        {isProcessing && (
          <div className="p-6 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-2 font-medium">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400 animate-spin" />
                Moving high priority emails to Gmail Trash...
              </span>
              <span className="font-mono text-rose-400">
                {processedCount} / {totalToProcess} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Candidate List Toolbar */}
        {!isProcessing && (
          <div className="px-6 py-2.5 bg-zinc-900/40 border-b border-zinc-800 flex items-center justify-between text-xs shrink-0">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center space-x-2 text-zinc-300 hover:text-white transition-colors cursor-pointer font-medium"
            >
              {selectedKeys.size === candidates.length ? (
                <CheckSquare className="w-4 h-4 text-rose-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-500" />
              )}
              <span>
                {selectedKeys.size === candidates.length ? 'Deselect All' : 'Select All'} ({candidates.length} High Priority Senders)
              </span>
            </button>

            <span className="text-zinc-500 font-mono">
              {selectedKeys.size} sender(s) selected
            </span>
          </div>
        )}

        {/* Scrollable Sender List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm">
              No high priority senders remaining to trash.
            </div>
          ) : (
            candidates.map((sender) => {
              const isSelected = selectedKeys.has(sender.senderKey);
              const isSensitive = Boolean(sender.analysis?.isSensitive || sender.analysis?.safetyWarning);

              return (
                <div
                  key={sender.senderKey}
                  onClick={() => toggleSender(sender.senderKey)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? isSensitive
                        ? 'bg-amber-950/20 border-amber-700/60 shadow-xs'
                        : 'bg-rose-950/20 border-rose-700/60 shadow-xs'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-rose-400" />
                        ) : (
                          <Square className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-bold text-white text-sm">{sender.fromName}</h4>
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-mono">
                            {sender.fromEmail}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80 text-[10px] font-semibold uppercase">
                            High Priority
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {sender.analysis?.summary || `Contains ${sender.totalEmails} email(s) to trash.`}
                        </p>

                        {sender.analysis?.safetyWarning && (
                          <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{sender.analysis.safetyWarning}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-rose-400 flex items-center justify-end gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{sender.totalEmails} emails</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {sender.unreadCount} unopened
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-zinc-400 hidden sm:block">
            Emails will be moved to Gmail Trash. You can restore them from Trash within 30 days.
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {!isProcessing && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedList.length === 0 || isProcessing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Trashing Emails...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Bulk Trash ({totalEmailsToTrash} Emails)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

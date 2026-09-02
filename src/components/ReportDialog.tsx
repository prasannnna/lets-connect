import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, X, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../lib/api.js';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment';
  targetId: number;
  targetPreview?: string;
}

const REPORT_REASONS = [
  'Harassment',
  'Bullying',
  'Hate/abuse',
  'Spam',
  'Defamation',
  'Inappropriate content',
  'Personal information',
  'Other',
] as const;

export function ReportDialog({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetPreview,
}: ReportDialogProps) {
  const [reason, setReason] = useState<string>('Harassment');
  const [details, setDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (targetType === 'post') {
        return api.reportPost(targetId, { reason, details: details.trim() || null });
      } else {
        return api.reportComment(targetId, { reason, details: details.trim() || null });
      }
    },
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDetails('');
        onClose();
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    reportMutation.mutate();
  };

  return (
    <div
      id="modal-report-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="modal-report-card"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-rose-600 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <span>Report {targetType === 'post' ? 'Post' : 'Reply'}</span>
          </div>
          <button
            id="btn-close-report-modal"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Report Submitted</h3>
            <p className="text-sm text-slate-600">
              Thank you for keeping the Aditya University community safe. Our student moderators will review this content.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {targetPreview && (
              <div className="p-3 text-xs bg-slate-100 text-slate-600 rounded-lg border border-slate-200 italic line-clamp-2">
                "{targetPreview}"
              </div>
            )}

            {errorMsg && (
              <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Reason for Reporting
              </label>
              <select
                id="select-report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Additional Details (Optional)
              </label>
              <textarea
                id="textarea-report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Help moderators understand what rule was violated..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>

            <p className="text-xs text-slate-500">
              Your identity as the reporter remains strictly anonymous to the community and author.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-report"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-submit-report"
                type="submit"
                disabled={reportMutation.isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {reportMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  FileText,
  MessageSquare,
  Loader2,
  Lock,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { safeFormatDistanceToNow } from '../lib/dateUtils.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Report } from '../shared/types.js';
import { ConfirmModal } from '../components/ConfirmModal.js';

export function ModeratorPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ type: 'post' | 'comment'; id: number } | null>(null);

  // Fetch Reports
  const { data: reports = [], isLoading, refetch } = useQuery<Report[]>({
    queryKey: ['moderation-reports', selectedStatus],
    queryFn: () => api.getReports(selectedStatus === 'all' ? undefined : selectedStatus),
    enabled: user?.role === 'Moderator',
  });

  // Update Report Status & Notes Mutation
  const updateReportMutation = useMutation({
    mutationFn: (payload: { id: number; status: string; moderator_notes?: string | null }) =>
      api.updateReport(payload.id, {
        status: payload.status,
        moderator_notes: payload.moderator_notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      setEditingNotesId(null);
    },
  });

  // Moderator Delete Post
  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => api.moderatorDeletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Moderator Delete Comment
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => api.moderatorDeleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Access Control Guard
  if (!user || user.role !== 'Moderator') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Moderator Access Required</h2>
        <p className="text-sm text-slate-500">
          This portal is strictly restricted to verified Aditya University student community moderators.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  const handleStatusChange = (reportId: number, newStatus: string, currentNotes?: string | null) => {
    updateReportMutation.mutate({
      id: reportId,
      status: newStatus,
      moderator_notes: currentNotes || null,
    });
  };

  const handleSaveNotes = (reportId: number, currentStatus: string) => {
    updateReportMutation.mutate({
      id: reportId,
      status: currentStatus,
      moderator_notes: noteText.trim() || null,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Moderator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Community Safety & Content Triage
          </h1>
          <p className="text-sm text-slate-500">
            Review reported posts, resolve bullying flags, and enforce university guidelines.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 self-start sm:self-center transition-colors"
        >
          Refresh Reports
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'open', label: 'Open Queue' },
          { id: 'reviewing', label: 'In Review' },
          { id: 'resolved', label: 'Resolved' },
          { id: 'dismissed', label: 'Dismissed' },
          { id: 'all', label: 'All Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-moderation-${tab.id}`}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedStatus === tab.id
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Stream */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-40" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Queue is Clear</h3>
          <p className="text-sm text-slate-500">
            No reports found matching the "{selectedStatus}" status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => {
            const isPost = Boolean(report.post_id);
            const isTargetDeleted = Boolean(report.post?.deleted_at || report.comment?.deleted_at);

            return (
              <div
                key={report.id}
                id={`report-card-${report.id}`}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 text-slate-800"
              >
                {/* Report Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                      {report.reason}
                    </span>
                    <span className="text-xs text-slate-500">
                      Report #{report.id} on {isPost ? 'Post' : 'Reply'} by{' '}
                      <span className="font-semibold text-slate-800">{report.reporter_pseudonym}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      • {safeFormatDistanceToNow(report.created_at)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        report.status === 'open'
                          ? 'bg-amber-100 text-amber-800'
                          : report.status === 'reviewing'
                          ? 'bg-blue-100 text-blue-800'
                          : report.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>

                {/* Reporter Description */}
                {report.details && (
                  <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                    <span className="font-bold text-slate-900">Reporter comment:</span> {report.details}
                  </div>
                )}

                {/* Target Content Preview */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      {isPost ? <FileText className="w-4 h-4 text-indigo-600" /> : <MessageSquare className="w-4 h-4 text-indigo-600" />}
                      <span>Reported {isPost ? 'Post Content' : 'Comment Content'}</span>
                    </div>
                    {isTargetDeleted && (
                      <span className="text-rose-600 font-bold">[Content Has Been Removed]</span>
                    )}
                  </div>

                  {isPost && report.post && (
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{report.post.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 whitespace-pre-line">
                        {report.post.body}
                      </p>
                    </div>
                  )}

                  {!isPost && report.comment && (
                    <p className="text-xs text-slate-600 whitespace-pre-line">
                      {report.comment.body}
                    </p>
                  )}
                </div>

                {/* Moderator Notes & Reviewer details */}
                <div className="space-y-2">
                  {report.reviewer_pseudonym && (
                    <div className="text-[11px] text-slate-400">
                      Last reviewed by <span className="font-semibold text-slate-600">{report.reviewer_pseudonym}</span>{' '}
                      {report.reviewed_at && safeFormatDistanceToNow(report.reviewed_at)}
                    </div>
                  )}

                  {editingNotesId === report.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add moderator rationale or follow-up notes..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(report.id, report.status)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div>
                        {report.moderator_notes ? (
                          <span>
                            <strong>Moderator Note:</strong> {report.moderator_notes}
                          </span>
                        ) : (
                          <span className="italic">No moderator notes attached</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(report.id);
                          setNoteText(report.moderator_notes || '');
                        }}
                        className="text-purple-600 hover:underline font-semibold"
                      >
                        {report.moderator_notes ? 'Edit note' : '+ Add note'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Moderator Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {report.status !== 'reviewing' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(report.id, 'reviewing', report.moderator_notes)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      >
                        Mark In Review
                      </button>
                    )}

                    {report.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(report.id, 'resolved', report.moderator_notes)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      >
                        Mark Resolved
                      </button>
                    )}

                    {report.status !== 'dismissed' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(report.id, 'dismissed', report.moderator_notes)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        Dismiss Report
                      </button>
                    )}
                  </div>

                  {/* Destructive Moderator Content Action */}
                  {!isTargetDeleted && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isPost && report.post_id) {
                          setPendingDelete({ type: 'post', id: report.post_id });
                        } else if (!isPost && report.comment_id) {
                          setPendingDelete({ type: 'comment', id: report.comment_id });
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remove Content From Platform</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'post' ? 'Remove Question' : 'Remove Reply'}
        message="Permanently remove this reported content for community safety violation?"
        confirmLabel="Remove Content"
        isLoading={deletePostMutation.isPending || deleteCommentMutation.isPending}
        onConfirm={async () => {
          if (!pendingDelete) return;
          if (pendingDelete.type === 'post') {
            await deletePostMutation.mutateAsync(pendingDelete.id);
          } else {
            await deleteCommentMutation.mutateAsync(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

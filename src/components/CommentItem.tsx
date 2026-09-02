import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowBigUp,
  MessageSquare,
  Clock,
  Flag,
  Trash2,
  Edit3,
  CornerDownRight,
  Loader2,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Comment } from '../shared/types.js';
import { Avatar } from './Avatar.js';
import { ReportDialog } from './ReportDialog.js';
import { ConfirmModal } from './ConfirmModal.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';

interface CommentItemProps {
  key?: React.Key;
  comment: Comment;
  postId: number;
  depth?: number;
}

export function CommentItem({ comment, postId, depth = 0 }: CommentItemProps) {
  const { user, openAuthModal } = useAuth();
  const queryClient = useQueryClient();

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Voting state
  const [voted, setVoted] = useState(Boolean(comment.has_voted));
  const [voteCount, setVoteCount] = useState(comment.vote_count);

  const isDeleted = comment.deleted_at !== null;
  const isAuthor = Boolean(user && (user.id === comment.student_id || user.id === comment.author?.id));
  const isModerator = user?.role === 'Moderator';

  const voteMutation = useMutation({
    mutationFn: () => api.voteComment(comment.id),
    onMutate: () => {
      const newVoted = !voted;
      setVoted(newVoted);
      setVoteCount((prev) => (newVoted ? prev + 1 : Math.max(0, prev - 1)));
    },
    onSuccess: (data) => {
      setVoted(data.voted);
      setVoteCount(data.vote_count);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: () => {
      setVoted(Boolean(comment.has_voted));
      setVoteCount(comment.vote_count);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => api.createComment(postId, { body, parent_id: comment.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setIsReplying(false);
      setReplyText('');
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to post reply.');
    },
  });

  const editMutation = useMutation({
    mutationFn: (body: string) => api.updateComment(comment.id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setIsEditing(false);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update reply.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteComment(comment.id),
    onSuccess: () => {
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.refetchQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to delete reply.');
    },
  });

  const handleVote = () => {
    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('session_token'));
    if (!user && !hasToken) {
      openAuthModal('login');
      return;
    }
    voteMutation.mutate();
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('session_token'));
    if (!user && !hasToken) {
      openAuthModal('login');
      return;
    }
    if (!replyText.trim()) return;
    setErrorMsg(null);
    replyMutation.mutate(replyText.trim());
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    setErrorMsg(null);
    editMutation.mutate(editText.trim());
  };

  const handleDelete = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsDeleteOpen(true);
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={`relative ${depth > 0 ? 'mt-3 pl-3 sm:pl-5 border-l-2 border-slate-200/80' : 'mt-3'}`}
    >
      <div className={`p-4 rounded-xl border ${isDeleted ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200/90 shadow-2xs text-slate-800'}`}>
        {/* Comment Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {!isDeleted && (
              <Avatar
                seed={comment.author.avatar_seed}
                pseudonym={comment.author.pseudonym}
                size="sm"
              />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium ${isDeleted ? 'italic text-slate-400' : 'text-slate-900'}`}>
                {comment.author.pseudonym}
              </span>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-2 p-2.5 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body / Edit Mode */}
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-2 mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editMutation.isPending}
                className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"
              >
                {editMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Save Edit
              </button>
            </div>
          </form>
        ) : (
          <div className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${isDeleted ? 'italic text-slate-400 py-1' : 'text-slate-700'}`}>
            {comment.body}
          </div>
        )}

        {/* Action Buttons */}
        {!isDeleted && (
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              {/* Vote */}
              <button
                type="button"
                onClick={handleVote}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-colors ${
                  voted
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowBigUp className={`w-3.5 h-3.5 ${voted ? 'fill-white' : ''}`} />
                <span>{voteCount}</span>
              </button>

              {/* Reply Button (Max Depth limit e.g. 5) */}
              {depth < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('session_token'));
                    if (!user && !hasToken) {
                      openAuthModal('login');
                      return;
                    }
                    setIsReplying(!isReplying);
                    setErrorMsg(null);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-600 font-normal transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Reply</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {isAuthor && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                  title="Edit reply"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}

              {(isAuthor || isModerator) && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Delete reply"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    openAuthModal('login');
                    return;
                  }
                  setIsReportOpen(true);
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                title="Report reply"
              >
                <Flag className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Nested Reply Composer */}
        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600">
              <CornerDownRight className="w-3 h-3" />
              <span>Replying to {comment.author.pseudonym}</span>
            </div>
            <textarea
              required
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a helpful, constructive reply..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replyMutation.isPending || !replyText.trim()}
                className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-1"
              >
                {replyMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Post Reply
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recursive Render for Child Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              postId={postId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="comment"
        targetId={comment.id}
        targetPreview={comment.body}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete Reply"
        message="Are you sure you want to delete this reply?"
        confirmLabel="Delete Reply"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
